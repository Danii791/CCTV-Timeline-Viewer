/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { RecordingFile, RecordingType } from './types';
import { Viewer } from './components/Viewer';
import { Timeline } from './components/Timeline';
import { Controls } from './components/Controls';
import { Camera, FolderOpen, RefreshCw } from 'lucide-react';

export default function App() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedType, setSelectedType] = useState<RecordingType>('VIDEO');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [recordings, setRecordings] = useState<RecordingFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cctvPath, setCctvPath] = useState<string>('/mnt/cctv');
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch recordings from the backend API
  useEffect(() => {
    const fetchRecordings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/files?date=${selectedDate}&camera=cam1`);
        if (!response.ok) throw new Error('Failed to fetch recordings');
        const data: RecordingFile[] = await response.json();
        
        // Filter by selected type (VIDEO or IMAGE)
        const filteredData = data.filter(rec => rec.type === selectedType);
        setRecordings(filteredData);
        
        // Set initial time to the first recording if available
        if (filteredData.length > 0) {
          setCurrentTime(filteredData[0].seconds);
        } else {
          setCurrentTime(0);
        }
      } catch (err) {
        console.error('Error fetching recordings:', err);
        setError('Could not load recordings. Please check your connection.');
        setRecordings([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecordings();
  }, [selectedDate, selectedType, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handlePathChange = async (newPath: string) => {
    setCctvPath(newPath);
    try {
      await fetch('/api/set-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: newPath }),
      });
    } catch (err) {
      console.error('Error setting path:', err);
    }
  };

  // Find the closest recording for the current time
  const currentRecording = useMemo(() => {
    if (recordings.length === 0) return null;
    
    let closest = recordings[0];
    let minDiff = Math.abs(currentTime - recordings[0].seconds);

    for (const rec of recordings) {
      const diff = Math.abs(currentTime - rec.seconds);
      if (diff < minDiff) {
        minDiff = diff;
        closest = rec;
      }
    }

    return minDiff < 1800 ? closest : null;
  }, [recordings, currentTime]);

  // Navigation handlers
  const handleNext = () => {
    if (recordings.length === 0) return;
    const nextRec = recordings.find(rec => rec.seconds > currentTime);
    if (nextRec) {
      setCurrentTime(nextRec.seconds);
    }
  };

  const handlePrev = () => {
    if (recordings.length === 0) return;
    const prevRecs = recordings.filter(rec => rec.seconds < currentTime);
    if (prevRecs.length > 0) {
      const prevRec = prevRecs[prevRecs.length - 1];
      setCurrentTime(prevRec.seconds);
    }
  };

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-4 py-2 border-b border-zinc-900 flex flex-col lg:flex-row items-center justify-between bg-zinc-950/80 backdrop-blur-md z-40 gap-3 shrink-0">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Camera className="text-white" size={16} />
          </div>
          <h1 className="text-lg font-bold tracking-tight">CCTV Viewer</h1>
        </div>

        <div className="flex flex-1 max-w-sm items-center gap-2 bg-zinc-900/50 px-3 py-1 rounded-lg border border-zinc-800 focus-within:border-blue-500/50 transition-all group">
          <FolderOpen size={16} className="text-zinc-500" />
          <div className="flex flex-col flex-1">
            <label className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold leading-none">CCTV Path</label>
            <input 
              type="text" 
              placeholder="/mnt/cctv"
              value={cctvPath}
              onChange={(e) => handlePathChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRefresh();
                }
              }}
              className="bg-transparent border-none p-0 text-xs focus:ring-0 text-zinc-200 placeholder:text-zinc-700 w-full"
            />
          </div>
          <button 
            onClick={handleRefresh}
            disabled={isLoading}
            className={`p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-blue-400 transition-all ${isLoading ? 'animate-spin' : ''}`}
            title="Rescan Path"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        <Controls 
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
        />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-row min-h-0 p-2 gap-2">
        {/* Viewer Section */}
        <div className="flex-1 min-h-0 flex items-center justify-center bg-zinc-900/20 rounded-xl border border-zinc-900/50 overflow-hidden relative">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center text-zinc-500">
              <div className="w-10 h-10 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-medium">Scanning recordings...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center text-red-400 p-6 text-center">
              <p className="text-sm font-medium">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-3 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-300"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="w-full h-full max-h-[85vh] flex items-center justify-center p-2">
              <Viewer 
                currentRecording={currentRecording}
                currentTime={currentTime}
                onNext={handleNext}
                onPrev={handlePrev}
                hasNext={recordings.some(rec => rec.seconds > currentTime)}
                hasPrev={recordings.some(rec => rec.seconds < currentTime)}
              />
            </div>
          )}
        </div>

        {/* Timeline Section */}
        <div className="w-72 shrink-0 h-full">
          <Timeline 
            recordings={recordings}
            currentTime={currentTime}
            onTimeChange={setCurrentTime}
          />
        </div>
      </main>
    </div>
  );
}
