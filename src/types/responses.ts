import type { InstrumentName, UInt64String } from './common.js';
import type {
  AccountSettings, Candle, CandleBidAsk, Deal, InstrumentCondition,
  MethodRateLimit, Order, Position, AccountState, TransactionAccountState,
} from './models.js';
import type { OperationStatus } from './enums.js';

// ------------------------------------------------------------------ Shared

export interface AckResponse {
  status:             'accepted';
  operation_id?:      UInt64String;
  client_request_id?: string;
}

// ------------------------------------------------------------------ Trading

export interface TradingStateSnapshot {
  account_state: AccountState;
  orders?:       Order[];
  positions?:    Position[];
}

export interface OperationStatusResponse {
  operation_id:        UInt64String;
  status:              OperationStatus;
  created_at:          string;
  updated_at:          string;
  parent_operation_id?: UInt64String;
  client_request_id?:  string;
  error_code?:         number;
  error_message?:      string;
}

// ------------------------------------------------------------------ Market data

export interface CandleHistoryResponse {
  candles: (Candle | CandleBidAsk)[];
}

// ------------------------------------------------------------------ History

export interface OrderHistoryItem {
  event_time: string;
  order:      Order;
}

export interface OrdersHistoryResponse {
  items:        OrderHistoryItem[];
  next_cursor?: string;
  has_more?:    boolean;
  range?: { from?: string; to?: string };
}

export interface DealHistoryItem {
  event_time: string;
  deal:       Deal;
}

export interface DealsHistoryResponse {
  items:        DealHistoryItem[];
  next_cursor?: string;
  has_more?:    boolean;
  range?: { from?: string; to?: string };
}

// ------------------------------------------------------------------ Configuration

export interface AccountDetailsResponse {
  account_id:   UInt64String;
  create_date:  string;
  account_name?: string;
  settings?:    AccountSettings;
}

export type InstrumentConditionResponse = InstrumentCondition;

export interface InstrumentNameListResponse {
  instruments?: InstrumentName[];
}

export interface RateLimitsResponse {
  methods?: MethodRateLimit[];
}
