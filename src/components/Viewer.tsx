import React from 'react';
import { RecordingFile } from '../types';
import { Play, Image as ImageIcon, AlertCircle, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ViewerProps {
  currentRecording: RecordingFile | null;
  currentTime: number; // seconds from start of day
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export const Viewer: React.FC<ViewerProps> = ({ 
  currentRecording, 
  currentTime,
  onNext,
  onPrev,
  hasNext,
  hasPrev
}) => {
  if (!currentRecording) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full h-full bg-zinc-950 rounded-xl flex flex-col items-center justify-center text-zinc-500 border border-zinc-800 p-12 text-center"
      >
        <div className="relative mb-6">
          <AlertCircle size={48} className="text-zinc-800" />
        </div>
        <h3 className="text-lg font-bold text-zinc-400 mb-2">No recording found</h3>
        <p className="text-xs text-zinc-600 max-w-[240px]">
          There is no footage available for the selected timestamp.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="relative w-full h-full bg-zinc-950 rounded-xl overflow-hidden border border-zinc-900 group">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentRecording.url}
          initial={currentRecording.type === 'VIDEO' ? { opacity: 0 } : { opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={currentRecording.type === 'VIDEO' ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: currentRecording.type === 'VIDEO' ? 0.3 : 0 }}
          className="w-full h-full"
        >
          {currentRecording.type === 'VIDEO' ? (
            <video
              src={currentRecording.url}
              className="w-full h-full object-contain"
              controls
              autoPlay
              muted
            />
          ) : (
            <img
              src={currentRecording.url}
              alt={`Recording at ${currentRecording.time}`}
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-start pl-6 pointer-events-none">
        <button
          onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
          disabled={!hasPrev}
          className="p-3 bg-zinc-900/40 hover:bg-zinc-800/60 rounded-md text-white border border-zinc-700 disabled:opacity-0 transition-colors pointer-events-auto"
          title="Previous Recording"
        >
          <ChevronLeft size={24} />
        </button>
      </div>

      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end pr-6 pointer-events-none">
        <button
          onClick={(e) => { e.stopPropagation(); onNext?.(); }}
          disabled={!hasNext}
          className="p-3 bg-zinc-900/40 hover:bg-zinc-800/60 rounded-md text-white border border-zinc-700 disabled:opacity-0 transition-colors pointer-events-auto"
          title="Next Recording"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Top Bar Info */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none">
        <div className="bg-black/60 px-3 py-1.5 rounded-md border border-zinc-800 flex items-center gap-2.5 text-white">
          <div className={`p-1 rounded ${currentRecording.type === 'VIDEO' ? 'bg-blue-600/20 text-blue-400' : 'bg-emerald-600/20 text-emerald-400'}`}>
            {currentRecording.type === 'VIDEO' ? <Play size={10} fill="currentColor" /> : <ImageIcon size={10} />}
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest leading-none mb-0.5">Timestamp</span>
            <span className="text-xs font-mono font-bold tracking-wider leading-none">{currentRecording.time}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="bg-black/60 px-3 py-1.5 rounded-md border border-zinc-800 text-zinc-400 text-[9px] font-mono font-bold tracking-tight">
            {currentRecording.name}
          </div>
          <button className="p-2 bg-black/60 rounded-md border border-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors pointer-events-auto">
            <Maximize2 size={12} />
          </button>
        </div>
      </div>

    </div>
  );
};
