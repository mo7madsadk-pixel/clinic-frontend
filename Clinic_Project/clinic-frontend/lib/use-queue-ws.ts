// lib/use-queue-ws.ts
'use client';

import { useEffect, useRef, useState } from 'react';

export function useQueueWs(room: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // backend is running on http://localhost:8000 by default
    const wsUrl = `ws://${window.location.hostname}:8000/ws/${room}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages((prev) => [...prev, data]);
      } catch {
        console.warn('Received non‑JSON message', event.data);
      }
    };

    ws.onclose = () => {
      // try to reconnect after a short delay
      setTimeout(() => {
        wsRef.current = new WebSocket(wsUrl);
      }, 2000);
    };

    return () => {
      ws.close();
    };
  }, [room]);

  return messages;
}