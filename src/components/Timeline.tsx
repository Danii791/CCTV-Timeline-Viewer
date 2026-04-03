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

  // 1440 minutes in a day
  // Let's say 1 minute = 4 pixels. Total width = 1440 * 4 = 5760px.
  const pixelsPerMinute = 8;
  const totalWidth = 1440 * pixelsPerMinute;

  const handleTimelineInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const x = clientX - rect.left + timelineRef.current.scrollLeft;
    const minutes = Math.max(0, Math.min(1440, x / pixelsPerMinute));
    const seconds = Math.floor(minutes * 60);
    onTimeChange(seconds);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
    const minutes = Math.max(0, Math.min(1440, x / pixelsPerMinute));
    setHoverTime(Math.floor(minutes * 60));
    
    if (isDragging) {
      handleTimelineInteraction(e);
    }
  };

  // Scroll to current time on mount or when currentTime changes significantly
  useEffect(() => {
    if (timelineRef.current && !isDragging) {
      const targetScroll = (currentTime / 60) * pixelsPerMinute - timelineRef.current.clientWidth / 2;
      timelineRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  }, [currentTime, isDragging]);

  return (
    <div className="w-full bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-zinc-400 font-medium text-sm uppercase tracking-widest">Timeline (24h)</h3>
        <div className="flex items-center gap-4">
           {hoverTime !== null && (
             <span className="text-zinc-500 text-xs font-mono">
               Hover: {formatSecondsToTime(hoverTime)}
             </span>
           )}
           <span className="text-blue-400 text-sm font-mono font-bold bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20">
             {formatSecondsToTime(currentTime)}
           </span>
        </div>
      </div>

      <div 
        ref={timelineRef}
        className="relative w-full h-32 overflow-x-auto overflow-y-hidden cursor-crosshair select-none scrollbar-hide"
        onMouseDown={(e) => { setIsDragging(true); handleTimelineInteraction(e); }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => { setIsDragging(false); setHoverTime(null); }}
        onMouseMove={handleMouseMove}
      >
        <div 
          className="relative h-full"
          style={{ width: `${totalWidth}px` }}
        >
          {/* Hour Markers */}
          {Array.from({ length: 25 }).map((_, i) => (
            <div 
              key={i} 
              className="absolute top-0 h-full border-l border-zinc-800/50 flex flex-col justify-between"
              style={{ left: `${i * 60 * pixelsPerMinute}px` }}
            >
              <span className="text-[10px] text-zinc-600 font-mono mt-1 ml-1">{i.toString().padStart(2, '0')}:00</span>
              <div className="h-4 border-l-2 border-zinc-700/50"></div>
            </div>
          ))}

          {/* Minute Ticks (every 15 mins) */}
          {Array.from({ length: 24 * 4 }).map((_, i) => (
            <div 
              key={i} 
              className="absolute bottom-0 h-4 border-l border-zinc-800/30"
              style={{ left: `${i * 15 * pixelsPerMinute}px` }}
            ></div>
          ))}

          {/* Recording Markers */}
          {recordings.map((rec, idx) => (
            <motion.div
              key={idx}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              className={`absolute bottom-6 w-1 rounded-full ${rec.type === 'VIDEO' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}
              style={{ 
                left: `${(rec.seconds / 60) * pixelsPerMinute}px`,
                height: '40%'
              }}
              whileHover={{ scale: 1.5, height: '60%', zIndex: 10 }}
            />
          ))}

          {/* Current Time Indicator */}
          <div 
            className="absolute top-0 h-full w-0.5 bg-blue-400 z-20 shadow-[0_0_15px_rgba(96,165,250,0.8)]"
            style={{ left: `${(currentTime / 60) * pixelsPerMinute}px` }}
          >
            <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-blue-400 rounded-full border-2 border-zinc-900"></div>
          </div>

          {/* Hover Indicator */}
          {hoverTime !== null && (
            <div 
              className="absolute top-0 h-full w-px bg-white/20 pointer-events-none"
              style={{ left: `${(hoverTime / 60) * pixelsPerMinute}px` }}
            ></div>
          )}
        </div>
      </div>
      
      <div className="mt-4 flex gap-6 text-[10px] text-zinc-500 font-medium uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Video Recording</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
          <span>Image Snapshot</span>
        </div>
      </div>
    </div>
  );
};
