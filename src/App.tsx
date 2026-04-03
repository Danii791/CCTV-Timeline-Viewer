/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { RecordingFile, RecordingType } from './types';
import { generateDummyRecordings } from './utils/data';
import { Viewer } from './components/Viewer';
import { Timeline } from './components/Timeline';
import { Controls } from './components/Controls';
import { Camera, Shield, Settings, Bell, User } from 'lucide-react';

export default function App() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedType, setSelectedType] = useState<RecordingType>('VIDEO');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [recordings, setRecordings] = useState<RecordingFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  }, [selectedDate, selectedType]);

  // Find the closest recording for the current time
  const currentRecording = useMemo(() => {
    if (recordings.length === 0) return null;
    
    // Find the recording that is closest to currentTime but not after it
    // Or just the closest one if we want "jump to nearest"
    let closest = recordings[0];
    let minDiff = Math.abs(currentTime - recordings[0].seconds);

    for (const rec of recordings) {
      const diff = Math.abs(currentTime - rec.seconds);
      if (diff < minDiff) {
        minDiff = diff;
        closest = rec;
      }
    }

    // Only return if it's reasonably close (e.g., within 30 mins)
    // or just return the closest one for better UX
    return minDiff < 1800 ? closest : null;
  }, [recordings, currentTime]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30">
      {/* Sidebar Navigation (Mock) */}
      <aside className="fixed left-0 top-0 h-full w-20 border-r border-zinc-900 bg-zinc-950/50 backdrop-blur-xl flex flex-col items-center py-8 gap-10 z-50">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
          <Shield className="text-white" size={24} />
        </div>
        
        <nav className="flex flex-col gap-6">
          <button className="p-3 text-blue-400 bg-blue-400/10 rounded-xl border border-blue-400/20 transition-all">
            <Camera size={24} />
          </button>
          <button className="p-3 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded-xl transition-all">
            <Bell size={24} />
          </button>
          <button className="p-3 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded-xl transition-all">
            <Settings size={24} />
          </button>
        </nav>

        <div className="mt-auto p-3 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded-xl transition-all">
          <User size={24} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="pl-20 min-h-screen">
        <header className="px-8 py-6 border-b border-zinc-900 flex items-center justify-between sticky top-0 bg-zinc-950/80 backdrop-blur-md z-40">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">CCTV Timeline Viewer</h1>
            <p className="text-zinc-500 text-sm font-medium">Camera: <span className="text-zinc-300">Front Entrance (Cam 01)</span></p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">System Online</span>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-8 py-8 flex flex-col gap-8">
          {/* Top Section: Controls and Viewer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-12 flex flex-col gap-8">
              <Controls 
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                selectedType={selectedType}
                onTypeChange={setSelectedType}
              />
              
              {isLoading ? (
                <div className="w-full aspect-video bg-zinc-900 rounded-xl flex flex-col items-center justify-center text-zinc-500 border border-zinc-800">
                  <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-lg font-medium">Scanning recordings...</p>
                </div>
              ) : error ? (
                <div className="w-full aspect-video bg-zinc-900 rounded-xl flex flex-col items-center justify-center text-red-400 border border-red-900/30">
                  <p className="text-lg font-medium">{error}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <Viewer 
                  currentRecording={currentRecording}
                  currentTime={currentTime}
                />
              )}
            </div>
          </div>

          {/* Bottom Section: Timeline */}
          <Timeline 
            recordings={recordings}
            currentTime={currentTime}
            onTimeChange={setCurrentTime}
          />
          
          {/* Footer / Stats */}
          <footer className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/50">
              <h4 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Total Recordings</h4>
              <p className="text-3xl font-mono font-bold text-white">{recordings.length}</p>
            </div>
            <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/50">
              <h4 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Storage Used</h4>
              <p className="text-3xl font-mono font-bold text-white">12.4 <span className="text-lg text-zinc-600">GB</span></p>
            </div>
            <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/50">
              <h4 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Uptime</h4>
              <p className="text-3xl font-mono font-bold text-white">99.9 <span className="text-lg text-zinc-600">%</span></p>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
