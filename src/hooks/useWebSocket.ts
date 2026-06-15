import { useEffect, useRef } from 'react';
import { useSeatStore } from '../stores/useSeatStore';
import { useCallStore } from '../stores/useCallStore';
import { usePatrolStore } from '../stores/usePatrolStore';
import { Seat, CallRecord, PatrolTask } from '../types';

interface WSMessage {
  type: string;
  data?: unknown;
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number>(0);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = '3001';
    const wsUrl = `${protocol}//${host}:${port}/ws`;

    const connect = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Connected');
        reconnectRef.current = 0;
        useSeatStore.getState().fetchSeats();
        useCallStore.getState().fetchCalls();
        usePatrolStore.getState().fetchPatrols();
      };

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          handleMessage(msg);
        } catch (e) {
          console.error('[WS] Parse error:', e);
        }
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected, reconnecting...');
        const delay = Math.min(1000 * Math.pow(2, reconnectRef.current), 30000);
        reconnectRef.current++;
        setTimeout(connect, delay);
      };

      ws.onerror = (err) => {
        console.error('[WS] Error:', err);
      };
    };

    const handleMessage = (msg: WSMessage) => {
      const { type, data } = msg;

      switch (type) {
        case 'SEAT_UPDATED':
          useSeatStore.getState().updateSeat(data as Seat);
          break;
        case 'CALL_CREATED':
          useCallStore.getState().addCall(data as CallRecord);
          break;
        case 'CALL_UPDATED':
          useCallStore.getState().updateCall(data as CallRecord);
          break;
        case 'CALL_COMPLETED':
          useCallStore.getState().setCompletedReceipt(data as CallRecord);
          break;
        case 'CALL_TIMEOUT':
          useCallStore.getState().updateCall(data as CallRecord);
          break;
        case 'PATROL_CREATED':
          usePatrolStore.getState().addPatrol(data as PatrolTask);
          break;
        case 'PATROL_UPDATED':
          usePatrolStore.getState().updatePatrol(data as PatrolTask);
          break;
        case 'PATROL_DUE':
          usePatrolStore.getState().setDuePatrolId((data as PatrolTask).id);
          break;
      }
    };

    connect();

    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'PING' }));
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      wsRef.current?.close();
    };
  }, []);
}
