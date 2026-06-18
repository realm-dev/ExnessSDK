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

    let headers: Record<string, string> = {};
    if (this.auth.type === 'signed') {
      headers = await buildSignedHeaders(this.auth, 'GET', this.wsPath, '', '');
    } else {
      headers['Authorization'] = `Bearer ${this.auth.token}`;
    }

    this.ws = new WebSocket(wsUrl, { headers });

    this.ws.on('open', () => {
      this.onConnected();
    });

    this.ws.on('message', (data: WebSocket.RawData) => {
      this.onMessage(data.toString());
    });

    this.ws.on('close', () => {
      this.ws = null;
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => {
          void this.openConnection();
        }, RECONNECT_DELAY_MS);
      }
    });

    this.ws.on('error', (_err: Error) => {
      // error is followed by close event which handles reconnect
    });
  }
}
