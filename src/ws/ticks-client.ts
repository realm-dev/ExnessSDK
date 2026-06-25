import type { AuthConfig } from '../auth/signer.js';
import type { InstrumentName, UInt64String } from '../types/common.js';
import type { WSTick } from '../types/models.js';
import type { WsErrorResponse } from '../types/ws-events.js';
import { ExnessWsBase } from './ws-base.js';

export class ExnessTicksClient extends ExnessWsBase {
  private readonly tickHandlers:  Array<(tick: WSTick) => void> = [];
  private readonly errorHandlers: Array<(e: WsErrorResponse) => void> = [];
  private readonly subscribedInstruments = new Set<InstrumentName>();
  private subscriptionRequestId: string | null = null;
  private subscriptionMode: 'legacy' | 'streams' = 'legacy';

  constructor(baseUrl: string, accountId: UInt64String, auth: AuthConfig) {
    super(baseUrl, `/v1/server-events/accounts/${accountId}/ws/ticks`, auth);
  }

  on(event: 'tick',  cb: (tick: WSTick) => void): this;
  on(event: 'error', cb: (e: WsErrorResponse) => void): this;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: 'tick' | 'error', cb: (e: any) => void): this {
    if (event === 'tick')  (this.tickHandlers  as Array<(...args: unknown[]) => void>).push(cb);
    if (event === 'error') (this.errorHandlers as Array<(...args: unknown[]) => void>).push(cb);
    return this;
  }

  subscribe(requestId: string, instruments: InstrumentName[]): void {
    this.subscriptionRequestId = requestId;
    for (const i of instruments) this.subscribedInstruments.add(i);
    if (process.env.EXNESS_WS_DEBUG === '1') {
      console.log('[exness-sdk][ticks] subscribe', JSON.stringify({ requestId, instruments, mode: this.subscriptionMode }));
    }
    this.sendSubscribe(instruments);
  }

  protected onConnected(): void {
    if (this.subscribedInstruments.size > 0) {
      if (process.env.EXNESS_WS_DEBUG === '1') {
        console.log('[exness-sdk][ticks] resubscribe', JSON.stringify({
          instruments: [...this.subscribedInstruments],
          mode: this.subscriptionMode,
        }));
      }
      this.sendSubscribe([...this.subscribedInstruments]);
    }
  }

  protected onMessage(raw: string): void {
    if (process.env.EXNESS_WS_DEBUG === '1') {
      console.log('[exness-sdk][ticks] raw', raw);
    }
    let msg: WSTick | WsErrorResponse;
    try {
      msg = JSON.parse(raw) as WSTick | WsErrorResponse;
    } catch {
      return;
    }

    if ('code' in msg) {
      if (msg.code === 200) {
        if (process.env.EXNESS_WS_DEBUG === '1') {
          console.log('[exness-sdk][ticks] ack', JSON.stringify(msg));
        }
        return;
      }

      if (msg.code === 3000 && msg.error_message === 'REQUEST_INVALID' && this.subscriptionMode === 'legacy') {
        this.subscriptionMode = 'streams';
        if (process.env.EXNESS_WS_DEBUG === '1') {
          console.log('[exness-sdk][ticks] switching-subscribe-mode', JSON.stringify({
            nextMode: this.subscriptionMode,
            instruments: [...this.subscribedInstruments],
          }));
        }
        this.sendSubscribe([...this.subscribedInstruments]);
      }
      for (const cb of this.errorHandlers) cb(msg as WsErrorResponse);
      return;
    }

    for (const cb of this.tickHandlers) cb(msg as WSTick);
  }

  private sendSubscribe(instruments: InstrumentName[]): void {
    if (this.subscriptionMode === 'legacy') {
      this.send({
        id: this.subscriptionRequestId ?? crypto.randomUUID(),
        subscribe: { event: 'ticks', instruments },
      });
      return;
    }

    this.send({
      type: 'subscribe',
      streams: [
        {
          event: 'ticks',
          instruments,
        },
      ],
    });
  }
}
