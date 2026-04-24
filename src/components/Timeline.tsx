import React, { useRef, useEffect, useState, useMemo } from 'react';
import { RecordingFile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { formatSecondsToTime } from '../utils/data';
import { ZoomIn, ZoomOut, Clock, Video, Image as ImageIcon, Map as MapIcon } from 'lucide-react';

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

  // Calculate density for the mini-map
  const densityMap = useMemo(() => {
    const slots = new Array(144).fill(0); // 10-minute slots
    recordings.forEach(rec => {
      const slotIdx = Math.floor(rec.seconds / 600);
      if (slotIdx < 144) slots[slotIdx]++;
    });
    const max = Math.max(...slots, 1);
    return slots.map(s => s / max);
  }, [recordings]);

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
    <div className="h-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex flex-col gap-3 overflow-hidden relative group/timeline select-none">
      {/* Header Section */}
      <div className="flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full relative"></div>
            </div>
            <h3 className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em]">Surveillance</h3>
          </div>
          <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
            <button 
              onClick={() => handleZoom(5)}
              className="w-7 h-7 flex items-center justify-center hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-all active:scale-90"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <div className="w-px h-3 bg-white/5 mx-0.5"></div>
            <button 
              onClick={() => handleZoom(-5)}
              className="w-7 h-7 flex items-center justify-center hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-all active:scale-90"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
          </div>
        </div>

        {/* Compact Vertical Playback Info */}
        <div className="flex items-center justify-center py-2 px-4 bg-zinc-900 rounded-lg border border-zinc-800 relative overflow-hidden">
          <div className="flex flex-col items-center relative z-10">
            <span className="text-zinc-500 text-[8px] font-bold uppercase tracking-[0.3em] mb-1 opacity-60">Playback</span>
            <span className="text-white text-2xl font-mono tabular-nums">
              {formatSecondsToTime(currentTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Timeline Area with Mini-map */}
      <div className="flex-1 min-h-0 relative flex gap-4">
        {/* Mini-map Scrubber with 3-hour labels */}
        <div className="w-12 h-full flex flex-col relative shrink-0 group/minimap select-none">
          {/* 3-Hour Labels for Mini-map */}
          <div className="absolute inset-y-0 left-0 w-8 flex flex-col justify-between py-1 pointer-events-none opacity-50 group-hover/minimap:opacity-100 transition-opacity duration-500">
            {[0, 3, 6, 9, 12, 15, 18, 21, 24].map(h => (
              <span key={h} className="text-[10px] text-zinc-400 font-mono font-black leading-none text-right pr-2">
                {h.toString().padStart(2, '0')}
              </span>
            ))}
          </div>

          {/* The actual scrubber bar */}
          <div className="ml-auto w-2.5 h-full bg-zinc-900 rounded-full border border-zinc-800 relative overflow-hidden cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const y = e.clientY - rect.top;
              const ratio = y / rect.height;
              onTimeChange(Math.floor(ratio * 86400));
            }}
          >
            {densityMap.map((d, i) => (
              <div 
                key={i}
                className="absolute left-0 w-full bg-blue-600"
                style={{ 
                  top: `${(i / 144) * 100}%`, 
                  height: `${(1 / 144) * 100}%`,
                  opacity: d > 0 ? Math.max(0.2, d * 0.8) : 0
                }}
              />
            ))}
            <div 
              className="absolute left-0 w-full h-1 bg-blue-400 z-10 transition-all duration-300 rounded-full"
              style={{ top: `${(currentTime / 86400) * 100}%` }}
            />
          </div>
        </div>

        {/* Scrollable Timeline */}
        <div 
          ref={timelineRef}
          className="flex-1 relative overflow-y-auto overflow-x-hidden cursor-crosshair select-none scrollbar-hide rounded-xl bg-zinc-950 border border-zinc-900"
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
            {Array.from({ length: 25 }).map((_, i) => {
              const isThreeHour = i % 3 === 0;
              return (
                <div 
                  key={i} 
                  className={`absolute left-0 w-full flex items-center z-10 group/hour ${isThreeHour ? 'opacity-100' : 'opacity-60'}`}
                  style={{ top: `${i * 60 * zoom}px` }}
                >
                  <div className="w-16 shrink-0 flex justify-end pr-3">
                    <span className={`text-[11px] font-mono tabular-nums ${isThreeHour ? 'text-zinc-300 font-bold' : 'text-zinc-500'}`}>
                      {i.toString().padStart(2, '0')}:00
                    </span>
                  </div>
                  <div className={`flex-1 border-t ${isThreeHour ? 'border-zinc-700' : 'border-zinc-800/40'}`}></div>
                </div>
              );
            })}

            {/* 10-Minute Markers */}
            {zoom >= 15 && Array.from({ length: 24 * 6 }).map((_, i) => {
              if (i % 6 === 0) return null;
              return (
                <div 
                  key={`10m-${i}`} 
                  className="absolute left-0 w-full flex items-center opacity-40 group/minute"
                  style={{ top: `${i * 10 * zoom}px` }}
                >
                  <div className="w-16 shrink-0 flex justify-end pr-3">
                    <span className="text-[10px] text-zinc-600 font-mono tabular-nums">
                      :{(i % 6 * 10).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex-1 border-t border-zinc-800/40"></div>
                </div>
              );
            })}

            {/* 5-Minute Markers (High Zoom) */}
            {zoom >= 35 && Array.from({ length: 24 * 12 }).map((_, i) => {
              if (i % 2 === 0) return null; // Skip 10-minute markers
              return (
                <div 
                  key={`5m-${i}`} 
                  className="absolute left-0 w-full flex items-center opacity-30 group/5minute"
                  style={{ top: `${i * 5 * zoom}px` }}
                >
                  <div className="w-16 shrink-0 flex justify-end pr-3">
                    <span className="text-[10px] text-zinc-700 font-mono tabular-nums">
                      :{(i % 12 * 5).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex-1 border-t border-zinc-800/20"></div>
                </div>
              );
            })}

            {/* Recording Markers */}
            {recordings.map((rec, idx) => (
              <div
                key={idx}
                className={`absolute right-0 h-3 rounded-l-md group/marker cursor-pointer border-y border-l border-white/5 ${
                  rec.type === 'VIDEO' 
                    ? 'bg-blue-600' 
                    : 'bg-emerald-600'
                }`}
                style={{ 
                  top: `${(rec.seconds / 60) * zoom}px`,
                  width: '65%',
                  transform: 'translateY(-50%)'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onTimeChange(rec.seconds);
                }}
              >
              </div>
            ))}

            {/* Current Time Indicator */}
            <div 
              className="absolute left-0 w-full h-[1px] bg-blue-500 z-[100] pointer-events-none"
              style={{ top: `${(currentTime / 60) * zoom}px` }}
            >
              <div className="absolute left-16 right-0 h-[1px] bg-blue-400"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend Footer */}
      <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center justify-around gap-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Video</span>
        </div>
        <div className="w-px h-2 bg-zinc-800"></div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></div>
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Image</span>
        </div>
      </div>
    </div>
  );
};
