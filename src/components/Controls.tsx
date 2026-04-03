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
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 shadow-xl">
      {/* Date Selector */}
      <div className="flex items-center gap-4 bg-zinc-800/50 p-1.5 rounded-xl border border-zinc-700/50">
        <button 
          onClick={handlePrevDay}
          className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className="flex items-center gap-3 px-4">
          <Calendar size={18} className="text-blue-400" />
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-transparent border-none text-white font-medium focus:ring-0 cursor-pointer text-sm"
          />
        </div>

        <button 
          onClick={handleNextDay}
          className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Mode Selector */}
      <div className="flex items-center gap-2 bg-zinc-800/50 p-1.5 rounded-xl border border-zinc-700/50">
        <button
          onClick={() => onTypeChange('VIDEO')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all duration-300 font-medium text-sm ${
            selectedType === 'VIDEO' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
              : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
          }`}
        >
          <Video size={18} />
          <span>VIDEO</span>
        </button>
        <button
          onClick={() => onTypeChange('IMAGE')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all duration-300 font-medium text-sm ${
            selectedType === 'IMAGE' 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
              : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
          }`}
        >
          <ImageIcon size={18} />
          <span>IMAGE</span>
        </button>
      </div>
    </div>
  );
};
