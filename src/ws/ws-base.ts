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
      headers = await buildSignedHeaders(this.auth, 'GET', this.wsPath, '', '');
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

    this.ws = new WebSocket(wsUrl, {
      headers,
      handshakeTimeout: 10000,
      perMessageDeflate: false,
    });

    if (process.env.EXNESS_WS_DEBUG === '1') {
      const req = (this.ws as WebSocket & { _req?: { getHeaders?: () => Record<string, unknown> } })._req;
      const actualHeaders = req?.getHeaders?.();
      if (actualHeaders) {
        console.log('[exness-sdk][ws] actual-request-headers', JSON.stringify(actualHeaders));
      }
    }

    await new Promise<void>((resolve, reject) => {
      let settled = false;

      this.ws!.once('unexpected-response', (_req, res) => {
        if (process.env.EXNESS_WS_DEBUG === '1') {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          res.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf8');
            console.log('[exness-sdk][ws] unexpected-response', JSON.stringify({
              statusCode: res.statusCode,
              statusMessage: res.statusMessage,
              headers: res.headers,
              body,
            }));
          });
        }
      });

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
