import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory progress tracking
const downloadState: Record<string, { progress: number; status: 'idle' | 'compressing' | 'completed' | 'error'; filePath?: string; fileName?: string }> = {};

async function startServer() {
  const app = express();
  const isProd = process.env.NODE_ENV === 'production';
  const PORT = isProd
    ? Number(process.env.PORT) || 3100 // production
    : 3000; // dev

  app.use(express.json());

  // Dynamic CCTV path
  let cctvPath = path.join(process.cwd(), 'recordings');

  // Static serving for recordings - we'll re-mount this when path changes
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
    const { date } = req.query;
    
    let folderPath = cctvPath;
    let urlPrefix = '/recordings';

    if (date && typeof date === 'string') {
      const datePath = path.join(cctvPath, date);
      if (fs.existsSync(datePath) && fs.statSync(datePath).isDirectory()) {
        folderPath = datePath;
        urlPrefix = `/recordings/${date}`;
      }
    }
    
    if (!fs.existsSync(folderPath)) {
      return res.json([]);
    }

    try {
      const files = fs.readdirSync(folderPath);

      // If no date provided, return list of available date folders that contain recordings
      if (!date) {
        let dateDirs: string[] = [];
        
        if (fs.existsSync(folderPath)) {
          const folders = fs.readdirSync(folderPath);
          dateDirs = folders.filter(file => {
            const fullPath = path.join(folderPath, file);
            try {
              if (!fs.statSync(fullPath).isDirectory() || !/^\d{4}-\d{2}-\d{2}$/.test(file)) return false;
              const subFiles = fs.readdirSync(fullPath);
              return subFiles.some(f => f.endsWith('.mp4') || f.endsWith('.jpg'));
            } catch {
              return false;
            }
          });
        }

        return res.json(dateDirs.sort().reverse());
      }

      const result = files
        .filter(file => file.endsWith('.mp4') || file.endsWith('.jpg'))
        .map(file => {
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
            url: `${urlPrefix}/${file}`,
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

  // API Endpoint: POST /api/download/start
  app.post('/api/download/start', (req, res) => {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required' });

    const sourceFolder = path.join(cctvPath, date);
    if (!fs.existsSync(sourceFolder)) {
      return res.status(404).json({ error: 'No recordings found for this date' });
    }

    const zipFileName = `CCTV_${date}.zip`;
    const zipFilePath = path.join(os.tmpdir(), zipFileName);

    // Initialize state
    downloadState[date] = { progress: 0, status: 'compressing', filePath: zipFilePath, fileName: zipFileName };

    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      downloadState[date].status = 'completed';
      downloadState[date].progress = 100;
      console.log(`Compression finished for ${date}. Total bytes: ${archive.pointer()}`);
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn(err);
      } else {
        throw err;
      }
    });

    archive.on('error', (err) => {
      downloadState[date].status = 'error';
      console.error('Archive error:', err);
    });

    archive.on('progress', (data) => {
      // Estimate progress based on entries processed vs total files
      // Since we don't know the exact total size easily without pre-scanning, 
      // we'll use entries as a proxy if we can, or just update based on bytes if we have total.
      // For simplicity, let's just update based on entries processed.
      const totalFiles = fs.readdirSync(sourceFolder).length;
      const progress = Math.round((data.entries.processed / totalFiles) * 100);
      downloadState[date].progress = Math.min(progress, 99);
    });

    archive.pipe(output);
    archive.directory(sourceFolder, false);
    archive.finalize();

    res.json({ status: 'started', date });
  });

  // API Endpoint: GET /api/download/status?date=YYYY-MM-DD
  app.get('/api/download/status', (req, res) => {
    const { date } = req.query;
    if (!date || typeof date !== 'string') return res.status(400).json({ error: 'Date is required' });

    const state = downloadState[date];
    if (!state) return res.json({ status: 'idle', progress: 0 });

    res.json(state);
  });

  // API Endpoint: GET /api/download/file?date=YYYY-MM-DD
  app.get('/api/download/file', (req, res) => {
    const { date } = req.query;
    if (!date || typeof date !== 'string') return res.status(400).json({ error: 'Date is required' });

    const state = downloadState[date];
    if (!state || state.status !== 'completed' || !state.filePath) {
      return res.status(404).json({ error: 'File not ready' });
    }

    res.download(state.filePath, state.fileName);
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
