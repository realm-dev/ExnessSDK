import WebSocket from 'ws';
import { buildSignedHeaders, type AuthConfig } from '../auth/signer.js';

const RECONNECT_DELAY_MS = 3000;

export abstract class ExnessWsBase {
  protected ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = false;

  constructor(
    protected readonly baseUrl: string,
    protected readonly wsPath: string,
    protected readonly auth: AuthConfig
  ) {}

  async connect(): Promise<void> {
    this.shouldReconnect = true;
    await this.openConnection();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  protected send(payload: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  protected abstract onMessage(raw: string): void;
  protected abstract onConnected(): void;

  private async openConnection(): Promise<void> {
    // Convert http(s) base URL to ws(s)
    const wsUrl = this.baseUrl.replace(/^http/, 'ws') + this.wsPath;
    const requestId = crypto.randomUUID();

    let headers: Record<string, string> = {};
    if (this.auth.type === 'signed') {
      headers = await buildSignedHeaders(this.auth, 'GET', this.wsPath, '', requestId);
      headers['X-Request-ID'] = requestId;
    } else {
      headers['Authorization'] = `Bearer ${this.auth.token}`;
    }

    if (process.env.EXNESS_WS_DEBUG === '1') {
      console.log('[exness-sdk][ws] connecting', JSON.stringify({
        wsUrl,
        wsPath: this.wsPath,
        authType: this.auth.type,
        headers,
      }));
    }

    this.ws = new WebSocket(wsUrl, { headers });

    await new Promise<void>((resolve, reject) => {
      let settled = false;

      this.ws!.once('open', () => {
        if (process.env.EXNESS_WS_DEBUG === '1') {
          console.log('[exness-sdk][ws] open', JSON.stringify({ wsUrl, wsPath: this.wsPath }));
        }
        this.onConnected();
        if (!settled) {
          settled = true;
          resolve();
        }
      });

      this.ws!.once('error', (err) => {
        if (process.env.EXNESS_WS_DEBUG === '1') {
          console.log('[exness-sdk][ws] error', err);
        }
        if (!settled) {
          settled = true;
          reject(err);
        }
      });
    });

    this.ws.on('message', (data: WebSocket.RawData) => {
      const raw = data.toString();
      if (process.env.EXNESS_WS_DEBUG === '1') {
        console.log('[exness-sdk][ws] message', raw);
      }
      this.onMessage(raw);
    });

    this.ws.on('error', (err) => {
      if (process.env.EXNESS_WS_DEBUG === '1') {
        console.log('[exness-sdk][ws] error', err);
      }
    });

    this.ws.on('close', (code, reason) => {
      if (process.env.EXNESS_WS_DEBUG === '1') {
        console.log('[exness-sdk][ws] close', JSON.stringify({
          code,
          reason: reason.toString(),
          wsUrl,
          wsPath: this.wsPath,
        }));
      }
      this.ws = null;
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => {
          void this.openConnection();
        }, RECONNECT_DELAY_MS);
      }
    });

  }
}
