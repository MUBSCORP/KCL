// src/app/public/types/event-log.ts
export interface LogItem {
  id: number;
  processed: boolean;
  state: string;
  type: string;
  code: string;
  message: string;
  action: string | null;
  time: string;
  time_format: string;
  solution: string | null;
  equipment: string;
  channel: string;
  phenomenon: string;
  batteryID: string;
  name: string | null;
}
