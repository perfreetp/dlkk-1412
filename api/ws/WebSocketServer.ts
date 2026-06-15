import { WebSocket, WebSocketServer as WS } from 'ws';
import type { Server as HTTPServer } from 'http';

interface WSMessage {
  type: string;
  data?: unknown;
}

export class WebSocketServer {
  private static wss: WS | null = null;
  private static clients: Set<WebSocket> = new Set();

  static init(server: HTTPServer) {
    if (this.wss) return;

    this.wss = new WS({ server, path: '/ws' });

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      console.log('[WS] Client connected, total:', this.clients.size);

      ws.on('message', (message) => {
        try {
          const parsed: WSMessage = JSON.parse(message.toString());
          this.handleMessage(ws, parsed);
        } catch (e) {
          console.error('[WS] Parse error:', e);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('[WS] Client disconnected, total:', this.clients.size);
      });

      ws.on('error', (err) => {
        console.error('[WS] Error:', err);
        this.clients.delete(ws);
      });
    });

    console.log('[WS] WebSocket server initialized');
  }

  private static handleMessage(ws: WebSocket, msg: WSMessage) {
    if (msg.type === 'PING') {
      ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
    }
  }

  static broadcast(message: WSMessage) {
    const payload = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }
}
