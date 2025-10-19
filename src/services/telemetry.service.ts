import { API_BASE } from './apiClient';
export const SSE_URL = process.env.NEXT_PUBLIC_SSE_URL || `${API_BASE}/api/stream/events?clientId=web`;

export function openTelemetrySSE(onData: (json: any) => void) {
    const es = new EventSource(SSE_URL, { withCredentials: true });
    es.onmessage = (e) => { try { onData(JSON.parse(e.data)); } catch {} };
    return es;
}
