import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Archive, CheckCircle2, AlertCircle, Loader2, Calendar } from 'lucide-react';
import { formatIndonesianDate } from '../utils/data';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate: string;
}

type DownloadStatus = 'idle' | 'compressing' | 'completed' | 'error';

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose, initialDate }) => {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedDate(initialDate);
      setStatus('idle');
      setProgress(0);
      setError(null);
    }
  }, [isOpen, initialDate]);

  const startDownload = async () => {
    setStatus('compressing');
    setError(null);
    setProgress(0);

    try {
      const response = await fetch('/api/download/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start compression');
      }

      // Start polling for status
      pollStatus();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const pollStatus = async () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/download/status?date=${selectedDate}`);
        const data = await response.json();

        if (data.status === 'compressing') {
          setProgress(data.progress);
        } else if (data.status === 'completed') {
          setProgress(100);
          setStatus('completed');
          clearInterval(interval);
        } else if (data.status === 'error') {
          setStatus('error');
          setError('Compression failed on server');
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 1000);

    return () => clearInterval(interval);
  };

  const handleFinalDownload = () => {
    window.location.href = `/api/download/file?date=${selectedDate}`;
    onClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      
      <motion.div 
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center text-zinc-400">
              <Archive size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Download Recordings</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {status === 'idle' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-4">
                  <div className="relative group/date cursor-pointer h-12">
                    {/* Native input that is transparent but clickable and fills the area */}
                    <input 
                      id="modal-date-input"
                      type="date" 
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="absolute inset-0 bg-transparent text-transparent border-none cursor-pointer z-20 w-full h-full hide-calendar-icon focus:ring-0 rounded"
                      style={{ colorScheme: 'dark' }}
                    />

                    <div className="absolute inset-y-0 left-3 flex items-center z-10 pointer-events-none">
                      <div className="w-7 h-7 bg-zinc-800 rounded flex items-center justify-center text-zinc-400 border border-zinc-700">
                        <Calendar size={14} />
                      </div>
                    </div>
                    
                    <div className="w-full h-full bg-zinc-950 border border-zinc-800 rounded pl-12 pr-6 flex items-center text-white font-mono font-bold text-sm">
                      {formatIndonesianDate(selectedDate)}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded">
                    <p className="text-[11px] text-zinc-500 leading-relaxed uppercase tracking-wider font-bold">
                      Bundling footage for {formatIndonesianDate(selectedDate)} as ZIP.
                    </p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={startDownload}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
              >
                <Archive size={14} />
                Prepare Download
              </button>
            </div>
          )}

          {(status === 'compressing' || status === 'completed') && (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center space-y-4">
                {status === 'compressing' ? (
                  <Loader2 size={32} className="text-blue-500 animate-spin" />
                ) : (
                  <CheckCircle2 size={32} className="text-emerald-500" />
                )}
                
                <div>
                  <h4 className="text-white font-bold text-sm uppercase tracking-wider">
                    {status === 'compressing' ? 'Compressing...' : 'Complete!'}
                  </h4>
                  <p className="text-zinc-500 text-[10px] mt-1 uppercase tracking-tight">
                    {status === 'compressing' 
                      ? `${formatIndonesianDate(selectedDate)}` 
                      : `CCTV_${selectedDate}.zip is ready`}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest">
                  <span className="text-zinc-600">Progress</span>
                  <span className="text-blue-500">{progress}%</span>
                </div>
                <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-blue-600"
                  />
                </div>
              </div>

              {status === 'completed' && (
                <button 
                  onClick={handleFinalDownload}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                >
                  <Download size={14} />
                  Download ZIP
                </button>
              )}
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
                  <AlertCircle size={32} />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg">Compression Failed</h4>
                  <p className="text-red-400/80 text-sm mt-1">{error}</p>
                </div>
              </div>
              
              <button 
                onClick={() => setStatus('idle')}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
