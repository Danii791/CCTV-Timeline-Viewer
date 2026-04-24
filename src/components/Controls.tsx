import React, { useState, useRef, useEffect } from 'react';
import CalendarComponent from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { motion, AnimatePresence } from 'motion/react';
import { RecordingType } from '../types';
import { Calendar, Video, Image as ImageIcon, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { formatIndonesianDate, formatDateLocal } from '../utils/data';

interface ControlsProps {
  availableDates: string[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedType: RecordingType;
  onTypeChange: (type: RecordingType) => void;
  onDownloadClick: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  availableDates = [],
  selectedDate,
  onDateChange,
  selectedType,
  onTypeChange,
  onDownloadClick,
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  
  const hasData = availableDates.includes(selectedDate);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 1);
    onDateChange(formatDateLocal(date));
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    onDateChange(formatDateLocal(date));
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateStr = formatDateLocal(date);

      if (availableDates.includes(dateStr)) {
        return (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full ring-1 ring-blue-500/20" />
          </div>
        );
      }
    }
    return null;
  };

  const getSafeDayName = (dateStr: string, format: 'long' | 'short') => {
    try {
      if (!dateStr) return "";
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleDateString('id-ID', { weekday: format });
    } catch (e) {
      return "";
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Date Selector */}
      <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
        <button 
          onClick={handlePrevDay}
          className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
        >
          <ChevronLeft size={16} />
        </button>
        
        <div 
          className="flex items-center gap-2 px-2 cursor-pointer group/date-area relative h-8 min-w-[200px]"
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
        >
          <div className={`w-7 h-7 flex items-center justify-center rounded-md transition-all border relative z-10 ${
            hasData 
              ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' 
              : 'bg-zinc-800 text-zinc-500 border-zinc-700'
          }`}>
            <Calendar size={14} strokeWidth={2} />
            {hasData && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-600 rounded-full border border-black z-20" />
            )}
          </div>
          
          <div className="flex items-center gap-2 relative z-10">
            <span className="text-white font-mono font-bold text-xs w-[140px] text-center">
              {formatIndonesianDate(selectedDate)}
            </span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter leading-none min-w-[50px]">
              {getSafeDayName(selectedDate, 'long')}
            </span>
          </div>

          <AnimatePresence>
            {isCalendarOpen && (
              <motion.div
                ref={calendarRef}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full mt-2 left-0 z-50 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl p-2 custom-calendar-wrapper"
                onClick={(e) => e.stopPropagation()}
              >
                <CalendarComponent
                  onChange={(date) => {
                    const d = date as Date;
                    onDateChange(formatDateLocal(d));
                    setIsCalendarOpen(false);
                  }}
                  value={(() => {
                    const [y, m, d] = selectedDate.split('-').map(Number);
                    return new Date(y, m - 1, d);
                  })()}
                  tileContent={tileContent}
                  className="bg-transparent border-none text-white font-sans"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button 
          onClick={handleNextDay}
          className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Mode Selector */}
      <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
        <button
          onClick={() => onTypeChange('VIDEO')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-300 font-medium text-xs ${
            selectedType === 'VIDEO' 
              ? 'bg-blue-600 text-white' 
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Video size={14} />
          <span className="hidden sm:inline">VIDEO</span>
        </button>
        <button
          onClick={() => onTypeChange('IMAGE')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-300 font-medium text-xs ${
            selectedType === 'IMAGE' 
              ? 'bg-emerald-600 text-white' 
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <ImageIcon size={14} />
          <span className="hidden sm:inline">IMAGE</span>
        </button>
      </div>

      {/* Download Button */}
      <button
        onClick={onDownloadClick}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors font-medium text-xs"
      >
        <Download size={14} />
        <span className="hidden md:inline">DOWNLOAD</span>
      </button>
    </div>
  );
};
