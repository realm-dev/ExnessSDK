import type { AuthConfig } from '../auth/signer.js';
import type { InstrumentName, UInt64String } from '../types/common.js';
import type {
  WSTradingEvent, WSTradingStateSnapshotEvent, WSTradingTransactionEvent,
  WSAccountStateEvent, WSInstrumentEvent, WSHmrSnapshotEvent, WSHmrUpdateEvent,
  WsErrorResponse,
} from '../types/ws-events.js';
import { ExnessWsBase } from './ws-base.js';

type EventHandlers = {
  trading_state_snapshot: Array<(e: WSTradingStateSnapshotEvent) => void>;
  transaction_event:      Array<(e: WSTradingTransactionEvent) => void>;
  account_state_event:    Array<(e: WSAccountStateEvent) => void>;
  instrument_event:       Array<(e: WSInstrumentEvent) => void>;
  hmr_snapshot:           Array<(e: WSHmrSnapshotEvent) => void>;
  hmr_update:             Array<(e: WSHmrUpdateEvent) => void>;
  error:                  Array<(e: WsErrorResponse) => void>;
};

type ActiveSubscription =
  | { type: 'transactions' }
  | { type: 'account_state' }
  | { type: 'instruments'; instruments: string[] }
  | { type: 'hmr'; instruments: string[] };

export class ExnessEventsClient extends ExnessWsBase {
  private readonly handlers: EventHandlers = {
    trading_state_snapshot: [],
    transaction_event:      [],
    account_state_event:    [],
    instrument_event:       [],
    hmr_snapshot:           [],
    hmr_update:             [],
    error:                  [],
  };

  private readonly activeSubscriptions = new Map<string, object>();

  constructor(baseUrl: string, accountId: UInt64String, auth: AuthConfig) {
    super(baseUrl, `/v1/server-events/accounts/${accountId}/ws/events`, auth);
  }

  // Typed on() overloads
  on(event: 'trading_state_snapshot', cb: (e: WSTradingStateSnapshotEvent) => void): this;
  on(event: 'transaction_event',      cb: (e: WSTradingTransactionEvent) => void): this;
  on(event: 'account_state_event',    cb: (e: WSAccountStateEvent) => void): this;
  on(event: 'instrument_event',       cb: (e: WSInstrumentEvent) => void): this;
  on(event: 'hmr_snapshot',           cb: (e: WSHmrSnapshotEvent) => void): this;
  on(event: 'hmr_update',             cb: (e: WSHmrUpdateEvent) => void): this;
  on(event: 'error',                  cb: (e: WsErrorResponse) => void): this;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: keyof EventHandlers, cb: (e: any) => void): this {
    (this.handlers[event] as Array<(...args: unknown[]) => void>).push(cb);
    return this;
  }

  // ------------------------------------------------------------------ Subscriptions

  subscribeTransactions(requestId: string): void {
    const cmd = { id: requestId, subscribe: { event: 'transactions' } };
    this.activeSubscriptions.set('transactions', cmd);
    this.send(cmd);
  }

  subscribeAccountState(requestId: string): void {
    const cmd = { id: requestId, subscribe: { event: 'account_state' } };
    this.activeSubscriptions.set('account_state', cmd);
    this.send(cmd);
  }

  subscribeInstruments(requestId: string, instruments: InstrumentName[] | ['all']): void {
    const cmd = { id: requestId, subscribe: { event: 'instruments', instruments } };
    this.activeSubscriptions.set('instruments', cmd);
    this.send(cmd);
  }

  subscribeHmr(requestId: string, instruments: InstrumentName[]): void {
    const cmd = { id: requestId, subscribe: { event: 'hmr', instruments } };
    this.activeSubscriptions.set('hmr', cmd);
    this.send(cmd);
  }

  unsubscribeInstruments(requestId: string, instruments: InstrumentName[] | ['all']): void {
    this.activeSubscriptions.delete('instruments');
    this.send({ id: requestId, unsubscribe: { event: 'instruments', instruments } });
  }

  unsubscribeHmr(requestId: string, instruments: InstrumentName[]): void {
    this.activeSubscriptions.delete('hmr');
    this.send({ id: requestId, unsubscribe: { event: 'hmr', instruments } });
  }

  // ------------------------------------------------------------------ Internal

  protected onConnected(): void {
    // Replay all active subscriptions after reconnect
    if (process.env.EXNESS_WS_DEBUG === '1') {
      console.log('[exness-sdk][events] resubscribe', JSON.stringify({ subscriptions: [...this.activeSubscriptions.keys()] }));
    }
    for (const cmd of this.activeSubscriptions.values()) {
      this.send(cmd);
    }
  }

  protected onMessage(raw: string): void {
    if (process.env.EXNESS_WS_DEBUG === '1') {
      console.log('[exness-sdk][events] raw', raw);
    }
    let msg: WSTradingEvent | WsErrorResponse;
    try {
      msg = JSON.parse(raw) as WSTradingEvent | WsErrorResponse;
    } catch {
      return;
    }

    // WS error response has 'code' field, not 'event_type'
    if ('code' in msg) {
      for (const cb of this.handlers.error) cb(msg as WsErrorResponse);
      return;
    }

    const event = msg as WSTradingEvent;
    switch (event.event_type) {
      case 'trading_state_snapshot':
        for (const cb of this.handlers.trading_state_snapshot) cb(event);
        break;
      case 'transaction_event':
        for (const cb of this.handlers.transaction_event) cb(event);
        break;
      case 'account_state_event':
        for (const cb of this.handlers.account_state_event) cb(event);
        break;
      case 'instrument_event':
        for (const cb of this.handlers.instrument_event) cb(event);
        break;
      case 'hmr_snapshot':
        for (const cb of this.handlers.hmr_snapshot) cb(event);
        break;
      case 'hmr_update':
        for (const cb of this.handlers.hmr_update) cb(event);
        break;
    }
  }
}
