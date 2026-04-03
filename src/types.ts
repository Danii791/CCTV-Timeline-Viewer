export type RecordingType = 'VIDEO' | 'IMAGE';

export interface RecordingFile {
  name: string; // HH-MM-SS.ext
  time: string; // HH:MM:SS
  seconds: number; // seconds from start of day
  url: string;
  type: RecordingType;
}

export interface CameraData {
  id: string;
  name: string;
  recordings: RecordingFile[];
}
