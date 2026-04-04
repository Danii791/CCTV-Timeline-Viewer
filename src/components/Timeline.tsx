import React, { useRef, useEffect, useState } from 'react';
import { RecordingFile } from '../types';
import { motion } from 'motion/react';
import { formatSecondsToTime } from '../utils/data';

interface TimelineProps {
  recordings: RecordingFile[];
  currentTime: number; // seconds from start of day
  onTimeChange: (seconds: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ recordings, currentTime, onTimeChange }) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [zoom, setZoom] = useState(12); // pixels per minute

  const totalHeight = 1440 * zoom;

  const handleTimelineInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const y = clientY - rect.top + timelineRef.current.scrollTop;
    const minutes = Math.max(0, Math.min(1440, y / zoom));
    const seconds = Math.floor(minutes * 60);
    onTimeChange(seconds);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top + timelineRef.current.scrollTop;
    const minutes = Math.max(0, Math.min(1440, y / zoom));
    setHoverTime(Math.floor(minutes * 60));
    
    if (isDragging) {
      handleTimelineInteraction(e);
    }
  };

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(4, Math.min(60, prev + delta)));
  };

  // Scroll to current time on mount or when currentTime/zoom changes
  useEffect(() => {
    if (timelineRef.current && !isDragging) {
      const targetScroll = (currentTime / 60) * zoom - timelineRef.current.clientHeight / 2;
      timelineRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  }, [currentTime, isDragging, zoom]);

  return (
    <div className="h-full bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-xl p-2 shadow-xl flex flex-col gap-2">
      {/* Header Section */}
      <div className="flex flex-col gap-2 p-1 border-b border-zinc-800/50">
        <div className="flex items-center justify-between">
          <h3 className="text-zinc-500 font-bold text-[9px] uppercase tracking-tighter">Timeline (24h)</h3>
          <div className="flex items-center gap-1 bg-zinc-800/50 rounded-md p-0.5 border border-zinc-700/30">
            <button 
              onClick={() => handleZoom(5)}
              className="w-6 h-6 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 hover:text-white transition-all"
              title="Zoom In"
            >
              <span className="text-sm font-bold">+</span>
            </button>
            <button 
              onClick={() => handleZoom(-5)}
              className="w-6 h-6 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 hover:text-white transition-all"
              title="Zoom Out"
            >
              <span className="text-sm font-bold">-</span>
            </button>
          </div>
        </div>

        <div className="bg-zinc-950/50 p-2 rounded-lg border border-zinc-800/50 flex flex-col items-center">
          <span className="text-zinc-600 text-[8px] font-bold uppercase tracking-widest mb-0.5">Current Time</span>
          <span className="text-blue-400 text-2xl font-mono font-bold tracking-tighter">
            {formatSecondsToTime(currentTime)}
          </span>
          {hoverTime !== null && (
            <span className="text-zinc-500 text-xs font-mono mt-0.5 opacity-60">
              {formatSecondsToTime(hoverTime)}
            </span>
          )}
        </div>
      </div>

      {/* Timeline Area */}
      <div className="flex-1 min-h-0 relative flex gap-2">
        {/* Scrollable Timeline */}
        <div 
          ref={timelineRef}
          className="flex-1 relative overflow-y-auto overflow-x-hidden cursor-crosshair select-none scrollbar-hide"
          onMouseDown={(e) => { setIsDragging(true); handleTimelineInteraction(e); }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => { setIsDragging(false); setHoverTime(null); }}
          onMouseMove={handleMouseMove}
        >
          <div 
            className="relative w-full"
            style={{ height: `${totalHeight}px` }}
          >
            {/* Hour Markers */}
            {Array.from({ length: 25 }).map((_, i) => (
              <div 
                key={i} 
                className="absolute left-0 w-full border-t border-zinc-800/50 flex items-start z-10"
                style={{ top: `${i * 60 * zoom}px` }}
              >
                <span className="text-sm text-zinc-300 font-mono -mt-3 ml-1 font-bold bg-zinc-950/90 px-2 py-0.5 rounded border border-zinc-700/50 shadow-md">
                  {i.toString().padStart(2, '0')}:00
                </span>
                <div className="flex-1 border-t border-zinc-800/30 ml-2 mt-0.5"></div>
              </div>
            ))}

            {/* 10-Minute Markers */}
            {zoom >= 15 && Array.from({ length: 24 * 6 }).map((_, i) => {
              if (i % 6 === 0) return null;
              return (
                <div 
                  key={i} 
                  className="absolute left-0 w-full border-t border-zinc-800/20 flex items-center"
                  style={{ top: `${i * 10 * zoom}px` }}
                >
                  <span className="text-xs text-zinc-500 font-mono ml-16">
                    {Math.floor(i / 6).toString().padStart(2, '0')}:{(i % 6 * 10).toString().padStart(2, '0')}
                  </span>
                </div>
              );
            })}

            {/* 1-Minute Ticks */}
            {zoom >= 40 && Array.from({ length: 1440 }).map((_, i) => {
              if (i % 10 === 0) return null;
              return (
                <div 
                  key={i} 
                  className="absolute left-0 w-4 border-t border-zinc-800/20"
                  style={{ top: `${i * zoom}px` }}
                ></div>
              );
            })}

            {/* Recording Markers */}
            {recordings.map((rec, idx) => (
              <motion.div
                key={idx}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                className={`absolute right-2 h-1.5 rounded-sm ${rec.type === 'VIDEO' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}
                style={{ 
                  top: `${(rec.seconds / 60) * zoom}px`,
                  width: '40%',
                  transform: 'translateY(-50%)'
                }}
                whileHover={{ scale: 1.2, width: '60%', zIndex: 10 }}
              />
            ))}

            {/* Current Time Indicator */}
            <div 
              className="absolute left-0 w-full h-0.5 bg-blue-400 z-20 shadow-[0_0_15px_rgba(96,165,250,0.8)]"
              style={{ top: `${(currentTime / 60) * zoom}px` }}
            >
              <div className="absolute -left-0.5 -top-1 w-2.5 h-2.5 bg-blue-400 rounded-full border-2 border-zinc-900"></div>
            </div>

            {/* Hover Indicator */}
            {hoverTime !== null && (
              <div 
                className="absolute left-0 w-full h-px bg-white/20 pointer-events-none"
                style={{ top: `${(hoverTime / 60) * zoom}px` }}
              ></div>
            )}
          </div>
        </div>
      </div>

      {/* Legend Footer */}
      <div className="p-2 border-t border-zinc-800/50 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-[8px] text-zinc-600 font-bold uppercase tracking-widest">
          <div className="w-2 h-2 bg-blue-500 rounded-sm"></div>
          <span>Video Recording</span>
        </div>
        <div className="flex items-center gap-2 text-[8px] text-zinc-600 font-bold uppercase tracking-widest">
          <div className="w-2 h-2 bg-emerald-500 rounded-sm"></div>
          <span>Image Snapshot</span>
        </div>
      </div>
    </div>
  );
};
