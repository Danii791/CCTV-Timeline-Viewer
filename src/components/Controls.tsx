import React from 'react';
import { RecordingType } from '../types';
import { Calendar, Video, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface ControlsProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedType: RecordingType;
  onTypeChange: (type: RecordingType) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  selectedDate,
  onDateChange,
  selectedType,
  onTypeChange,
}) => {
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split('T')[0]);
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
        
        <div className="flex items-center gap-2 px-2">
          <Calendar size={14} className="text-blue-400" />
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-transparent border-none text-white font-medium focus:ring-0 cursor-pointer text-xs p-0"
          />
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
    </div>
  );
};
