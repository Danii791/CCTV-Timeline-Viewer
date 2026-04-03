import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Dynamic CCTV path
  let cctvPath = path.join(process.cwd(), 'recordings');

  // Static serving for recordings - we'll re-mount this when path changes
  // For simplicity in this demo, we'll use a middleware that resolves the path dynamically
  app.use('/recordings', (req, res, next) => {
    express.static(cctvPath)(req, res, next);
  });

  // API Endpoint: POST /api/set-path
  app.post('/api/set-path', (req, res) => {
    const { path: newPath } = req.body;
    if (newPath) {
      cctvPath = newPath;
      console.log(`CCTV Path updated to: ${cctvPath}`);
      return res.json({ status: 'ok', path: cctvPath });
    }
    res.status(400).json({ error: 'Path is required' });
  });

  // API Endpoint: GET /api/files?date=YYYY-MM-DD
  app.get('/api/files', (req, res) => {
    const { date, camera = 'cam1' } = req.query;
    
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'Date parameter is required (YYYY-MM-DD)' });
    }

    const folderPath = path.join(cctvPath, camera as string, date);
    
    if (!fs.existsSync(folderPath)) {
      return res.json([]); // Return empty list if folder doesn't exist
    }

    try {
      const files = fs.readdirSync(folderPath);
      const result = files
        .filter(file => file.endsWith('.mp4') || file.endsWith('.jpg'))
        .map(file => {
          // Extract time from filename (HH-MM-SS.ext)
          const nameWithoutExt = path.parse(file).name;
          const timeParts = nameWithoutExt.split('-');
          
          if (timeParts.length !== 3) return null;

          const time = `${timeParts[0]}:${timeParts[1]}:${timeParts[2]}`;
          const seconds = parseInt(timeParts[0]) * 3600 + parseInt(timeParts[1]) * 60 + parseInt(timeParts[2]);
          const type = file.endsWith('.mp4') ? 'VIDEO' : 'IMAGE';
          
          return {
            name: file,
            time: time,
            seconds: seconds,
            url: `/recordings/${camera}/${date}/${file}`,
            type: type
          };
        })
        .filter(item => item !== null)
        .sort((a, b) => a!.seconds - b!.seconds);

      res.json(result);
    } catch (error) {
      console.error('Error reading recordings:', error);
      res.status(500).json({ error: 'Failed to read recordings' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
