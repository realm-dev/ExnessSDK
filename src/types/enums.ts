export const OrderType = { market: 'market', stop: 'stop', limit: 'limit', sltp: 'sltp' } as const;
export type OrderType = typeof OrderType[keyof typeof OrderType];

export const OrderState = {
  pending_new: 'pending_new',
  placed:      'placed',
  filled:      'filled',
  cancelled:   'cancelled',
  rejected:    'rejected',
} as const;
export type OrderState = typeof OrderState[keyof typeof OrderState];

export const DealType = {
  open:             'open',
  close:            'close',
  balance:          'balance',
  null_compensation:'null_compensation',
  swap_fee:         'swap_fee',
  admin_fee:        'admin_fee',
  dividend:         'dividend',
  exness_dollar:    'exness_dollar',
} as const;
export type DealType = typeof DealType[keyof typeof DealType];

export const Side = { buy: 'buy', sell: 'sell' } as const;
export type Side = typeof Side[keyof typeof Side];

export const TradeMode = { enabled: 'enabled', trading_disabled: 'trading_disabled' } as const;
export type TradeMode = typeof TradeMode[keyof typeof TradeMode];

export const AccountTradingStatus = { active: 'active', close_only: 'close_only' } as const;
export type AccountTradingStatus = typeof AccountTradingStatus[keyof typeof AccountTradingStatus];

export const ExecutionMode = { undefined: 'undefined', instant: 'instant', market: 'market' } as const;
export type ExecutionMode = typeof ExecutionMode[keyof typeof ExecutionMode];

export const CalculationMode = {
  undefined:       'undefined',
  forex:           'forex',
  forex_no_leverage:'forex_no_leverage',
  cfd:             'cfd',
  cfd_leverage:    'cfd_leverage',
} as const;
export type CalculationMode = typeof CalculationMode[keyof typeof CalculationMode];

export const InstrumentOrderType = { stop: 'stop', limit: 'limit', stoplimit: 'stoplimit', market: 'market' } as const;
export type InstrumentOrderType = typeof InstrumentOrderType[keyof typeof InstrumentOrderType];

export const FillingMode = { fok: 'fok', ioc: 'ioc', boc: 'boc' } as const;
export type FillingMode = typeof FillingMode[keyof typeof FillingMode];

export const CommissionType = {
  undefined:         'undefined',
  per_lot_per_side:  'per_lot_per_side',
  per_lot_per_trade: 'per_lot_per_trade',
  per_million_usd:   'per_million_usd',
} as const;
export type CommissionType = typeof CommissionType[keyof typeof CommissionType];

export const OrderReason = {
  undefined:           'undefined',
  sl:                  'sl',
  tp:                  'tp',
  so:                  'so',
  margin_check_failed: 'margin_check_failed',
  dealer:              'dealer',
  close_by:            'close_by',
  stock_split:         'stock_split',
  trading_server:      'trading_server',
} as const;
export type OrderReason = typeof OrderReason[keyof typeof OrderReason];

export const TradingEventStatus = { success: 'success', failed: 'failed', rejected: 'rejected' } as const;
export type TradingEventStatus = typeof TradingEventStatus[keyof typeof TradingEventStatus];

export const InstrumentEventAction = { new: 'new', upd: 'upd', del: 'del' } as const;
export type InstrumentEventAction = typeof InstrumentEventAction[keyof typeof InstrumentEventAction];

export const HmrPeriodEventType = { regular: 'regular', periodic: 'periodic' } as const;
export type HmrPeriodEventType = typeof HmrPeriodEventType[keyof typeof HmrPeriodEventType];

export const OperationStatus = { pending: 'pending', confirmed: 'confirmed', rejected: 'rejected', failed: 'failed' } as const;
export type OperationStatus = typeof OperationStatus[keyof typeof OperationStatus];

export const Timeframe = { M1:'M1', M3:'M3', M5:'M5', M10:'M10', M15:'M15', M30:'M30', H1:'H1', H2:'H2', H4:'H4', D1:'D1', W1:'W1', MN:'MN' } as const;
export type Timeframe = typeof Timeframe[keyof typeof Timeframe];

export const PriceType = { bid: 'bid', ask: 'ask', both: 'both' } as const;
export type PriceType = typeof PriceType[keyof typeof PriceType];
