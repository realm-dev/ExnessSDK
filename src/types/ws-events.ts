import type { UInt64String } from './common.js';
import type { InstrumentEventAction, TradingEventStatus } from './enums.js';
import type { HmrPeriod, InstrumentCondition, TransactionPayload } from './models.js';
import type { TradingStateSnapshot } from './responses.js';

// ------------------------------------------------------------------ WS event discriminated union

export interface WSTradingStateSnapshotEvent {
  event_type: 'trading_state_snapshot';
  id:         string;
  payload:    TradingStateSnapshot;
}

export interface WSTradingTransactionEvent {
  event_type:          'transaction_event';
  id:                  string;
  payload:             TransactionPayload;
  status?:             TradingEventStatus;
  operation_id?:       UInt64String;
  parent_operation_id?: UInt64String | null;
  client_request_id?:  string | null;
  error_code?:         number;
  error_message?:      string;
  event_time?:         string;
}

export interface WSAccountStateEvent {
  event_type:  'account_state_event';
  id:          string;
  event_time:  string;
  payload: {
    account_state: import('./models.js').AccountState;
  };
}

export interface WSInstrumentEvent {
  event_type: 'instrument_event';
  id:         string;
  event_time: string;
  action:     InstrumentEventAction;
  payload:    InstrumentCondition;
}

export interface WSHmrSnapshotEvent {
  event_type: 'hmr_snapshot';
  periods:    HmrPeriod[];
}

export interface WSHmrUpdateEvent {
  event_type:       'hmr_update';
  upserted_periods: HmrPeriod[];
  removed_period_ids: UInt64String[];
}

export type WSTradingEvent =
  | WSTradingStateSnapshotEvent
  | WSTradingTransactionEvent
  | WSAccountStateEvent
  | WSInstrumentEvent
  | WSHmrSnapshotEvent
  | WSHmrUpdateEvent;

// ------------------------------------------------------------------ WS error

export interface WsErrorResponse {
  id:            string;
  code:          number;
  error_message: string;
}
