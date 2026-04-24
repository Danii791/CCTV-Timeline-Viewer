import { RecordingFile, RecordingType } from '../types';

export function generateDummyRecordings(date: string, type: RecordingType): RecordingFile[] {
  const recordings: RecordingFile[] = [];
  const count = type === 'VIDEO' ? 20 : 50; // More images than videos
  const extension = type === 'VIDEO' ? 'mp4' : 'jpg';

  // Generate random times throughout the day
  for (let i = 0; i < count; i++) {
    const hour = Math.floor(Math.random() * 24);
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);

    const timeStr = `${hour.toString().padStart(2, '0')}-${minute.toString().padStart(2, '0')}-${second.toString().padStart(2, '0')}`;
    const displayTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
    const totalSeconds = hour * 3600 + minute * 60 + second;

    // Use placeholder images/videos
    const url = type === 'VIDEO' 
      ? `https://www.w3schools.com/html/mov_bbb.mp4?t=${totalSeconds}` // BBB video with random seek
      : `https://picsum.photos/seed/${date}-${timeStr}/1280/720`;

    recordings.push({
      name: `${timeStr}.${extension}`,
      time: displayTime,
      seconds: totalSeconds,
      url: url,
      type: type
    });
  }

  // Sort by time
  return recordings.sort((a, b) => a.seconds - b.seconds);
}

export function formatSecondsToTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatIndonesianDate(dateStr: string): string {
  try {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  } catch (e) {
    return dateStr;
  }
}

export function formatDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
