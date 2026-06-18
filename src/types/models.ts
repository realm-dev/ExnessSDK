import type { DecimalString, InstrumentName, Money, UInt64String } from './common.js';
import type {
  CalculationMode, CommissionType, DealType, ExecutionMode, FillingMode,
  HmrPeriodEventType, InstrumentEventAction, InstrumentOrderType, OrderReason,
  OrderState, OrderType, Side, TradeMode,
} from './enums.js';

// ------------------------------------------------------------------ Account

export interface AccountState {
  balance:     DecimalString;
  equity:      DecimalString;
  used_margin: DecimalString;
}

export interface TransactionAccountState extends AccountState {
  leverage: string;
}

export interface AccountSettings {
  currency:          string;
  leverage:          string;
  trade_mode:        TradeMode;
  account_status:    import('./enums.js').AccountTradingStatus;
  execution_mode:    ExecutionMode;
  margin_call_level?: DecimalString;
  stopout_level?:    DecimalString;
}

// ------------------------------------------------------------------ Orders

export interface Order {
  order_id:         UInt64String;
  order_type:       OrderType;
  state:            OrderState;
  create_time:      string;
  position_id?:     UInt64String;
  direction?:       Side;
  instrument?:      InstrumentName;
  price?:           DecimalString;
  stop_loss_price?: DecimalString | null;
  take_profit_price?: DecimalString | null;
  update_time?:     string;
  volume?:          DecimalString;
  reason?:          OrderReason;
}

// ------------------------------------------------------------------ Positions

export interface Position {
  position_id:     UInt64String;
  direction:       Side;
  instrument:      InstrumentName;
  volume:          DecimalString;
  state:           'open' | 'closed';
  create_time:     string;
  initial_volume?: DecimalString;
  open_price?:     DecimalString;
  margin_rate?:    DecimalString;
  commission?:     DecimalString;
  swap?:           DecimalString;
  rollover_time?:  string;
}

// ------------------------------------------------------------------ Deals

export interface Deal {
  deal_id:     UInt64String;
  type:        DealType;
  create_time: string;
  order_id?:   UInt64String;
  position_id?: UInt64String;
  direction?:  Side;
  instrument?: InstrumentName;
  volume?:     DecimalString;
  price?:      DecimalString;
  profit?:     { amount: DecimalString; currency: string };
  commission?: DecimalString;
}

// ------------------------------------------------------------------ Market data

export interface CandleSide {
  open:  number;
  high:  number;
  low:   number;
  close: number;
}

export interface Candle {
  time:   string;
  open:   number;
  high:   number;
  low:    number;
  close:  number;
  volume: number;
}

export interface CandleBidAsk {
  time:   string;
  bid?:   CandleSide;
  ask?:   CandleSide;
  volume: number;
}

export interface WSTick {
  instrument: InstrumentName;
  bid:        number;
  ask:        number;
  timestamp:  string;
}

// ------------------------------------------------------------------ Configuration

export interface SwapMultiplier {
  day:        string;
  multiplier: number;
}

export interface CommissionSettings {
  commission_type?:  CommissionType;
  commission_value?: Money;
}

export interface InstrumentSession {
  trade_mode?:      TradeMode;
  week_start_time?: string;
  week_end_time?:   string;
}

export interface InstrumentCondition {
  instrument:          InstrumentName;
  description?:        string;
  international_name?: string | null;
  category?:           string;
  base_currency?:      string;
  quote_currency?:     string;
  margin_currency?:    string;
  point_digits?:       number;
  calc_mode?:          CalculationMode;
  exec_mode?:          ExecutionMode;
  margin_percent?:     DecimalString | null;
  contract_size?:      DecimalString | null;
  volume_min?:         DecimalString | null;
  volume_max?:         DecimalString | null;
  volume_step?:        DecimalString | null;
  swap_long?:          DecimalString | null;
  swap_short?:         DecimalString | null;
  swap_multipliers?:   SwapMultiplier[];
  trade_mode?:         TradeMode;
  order_types?:        InstrumentOrderType[];
  filling_modes?:      FillingMode[];
  trade_sessions?:     InstrumentSession[];
  commission_settings?: CommissionSettings;
}

// ------------------------------------------------------------------ HMR

export interface HmrPeriod {
  period_id:   UInt64String;
  event_type:  HmrPeriodEventType;
  instruments: InstrumentName[];
  leverage:    string;
  start_time:  string;
  end_time:    string;
}

// ------------------------------------------------------------------ Rate limits

export interface MethodRateLimit {
  method?:              string;
  requests_per_minute?: number;
}

// ------------------------------------------------------------------ Transaction payload

export interface TransactionPayload {
  orders?:        Order[];
  positions?:     Position[];
  deals?:         Deal[];
  account_state?: TransactionAccountState;
}

