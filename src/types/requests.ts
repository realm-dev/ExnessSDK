import type { DecimalString, InstrumentName, UInt64String } from './common.js';

// ------------------------------------------------------------------ Open position

export interface OpenPositionRequest {
  instrument:        InstrumentName;
  side:              'buy' | 'sell';
  volume:            string;  // InstrumentVolumeString
  price?:            string;  // Required for instant execution mode
  deviation?:        DecimalString;
  stop_loss_price?:  string;
  take_profit_price?: string;
  comment?:          string;
}

// ------------------------------------------------------------------ Close position (query params)

export interface ClosePositionParams {
  volume?:              string;
  price?:               string;
  deviation?:           DecimalString;
  close_by_position_id?: UInt64String;
}

// ------------------------------------------------------------------ Close all positions (query params)

export interface CloseAllPositionsParams {
  filter?:      'all';
  instrument?:  InstrumentName;
  side?:        'buy' | 'sell';
  profitable?:  boolean;
  unprofitable?: boolean;
}

// ------------------------------------------------------------------ Pending orders

export interface NewLimitOrderRequest {
  type:              'limit';
  instrument:        InstrumentName;
  side:              'buy' | 'sell';
  volume:            string;
  price:             string;
  stop_loss_price?:  string;
  take_profit_price?: string;
  comment?:          string;
}

export interface NewStopOrderRequest {
  type:              'stop';
  instrument:        InstrumentName;
  side:              'buy' | 'sell';
  volume:            string;
  price:             string;
  stop_loss_price?:  string;
  take_profit_price?: string;
  comment?:          string;
}

export interface NewSltpOrderRequest {
  type:              'sltp';
  position_id:       UInt64String;
  stop_loss_price?:  string;
  take_profit_price?: string;
  comment?:          string;
}

export type NewPendingOrderRequest =
  | NewLimitOrderRequest
  | NewStopOrderRequest
  | NewSltpOrderRequest;

// ------------------------------------------------------------------ Modify order

export interface ModifyOrderRequest {
  price?:             string;
  stop_loss_price?:   string | null;  // null removes SL
  take_profit_price?: string | null;  // null removes TP
  comment?:           string;
}

// ------------------------------------------------------------------ Cancel all orders (query params)

export interface CancelAllOrdersParams {
  filter?:     'all';
  instrument?: InstrumentName;
  order_type?: 'stop' | 'limit' | 'sltp';
  side?:       'buy' | 'sell';
}

// ------------------------------------------------------------------ Candle history params

export interface CandleHistoryParams {
  instrument:   InstrumentName;
  timeframe:    string;  // Timeframe enum
  from:         string;  // ISO date-time
  to?:          string;
  count?:       number;  // -1000 to 1000, excluding 0
  price_type?:  'bid' | 'ask' | 'both';
}

// ------------------------------------------------------------------ History params

export interface OrdersHistoryParams {
  from?:        string;
  to?:          string;
  instrument?:  InstrumentName;
  order_type?:  string;
  side?:        'buy' | 'sell';
  state?:       string;
  cursor?:      string;
  limit?:       number;
}

export interface DealsHistoryParams {
  from?:        string;
  to?:          string;
  instrument?:  InstrumentName;
  deal_type?:   string;
  side?:        'buy' | 'sell';
  cursor?:      string;
  limit?:       number;
}
