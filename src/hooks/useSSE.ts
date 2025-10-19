'use client';
import { useEffect, useRef } from 'react';

export function useSSE<T = any>(open: () => EventSource, onData: (d: T) => void) {
    const ref = useRef<EventSource | null>(null);
    useEffect(() => {
        const es = open();
        ref.current = es;
        es.onerror = () => { /* TODO: 재연결 로직 */ };
        return () => { es.close(); ref.current = null; };
    }, [open, onData]);
}
