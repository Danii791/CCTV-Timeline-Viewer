import React from 'react';
import { RecordingFile } from '../types';
import { Play, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface ViewerProps {
  currentRecording: RecordingFile | null;
  currentTime: number; // seconds from start of day
}

export const Viewer: React.FC<ViewerProps> = ({ currentRecording, currentTime }) => {
  if (!currentRecording) {
    return (
      <div className="w-full aspect-video bg-zinc-900 rounded-xl flex flex-col items-center justify-center text-zinc-500 border border-zinc-800">
        <AlertCircle size={48} className="mb-4 opacity-20" />
        <p className="text-lg font-medium">No recording at this time</p>
        <p className="text-sm opacity-60">Try selecting a highlighted time on the timeline</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800 group shadow-2xl">
      {currentRecording.type === 'VIDEO' ? (
        <video
          key={currentRecording.url}
          src={currentRecording.url}
          className="w-full h-full object-contain"
          controls
          autoPlay
          muted
        />
      ) : (
        <img
          key={currentRecording.url}
          src={currentRecording.url}
          alt={`Recording at ${currentRecording.time}`}
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
        />
      )}

      {/* Overlay Info */}
      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 text-white">
        {currentRecording.type === 'VIDEO' ? <Play size={14} /> : <ImageIcon size={14} />}
        <span className="text-sm font-mono font-medium tracking-wider">{currentRecording.time}</span>
      </div>

      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white/60 text-xs font-mono">
        {currentRecording.name}
      </div>
    </div>
  );
};
