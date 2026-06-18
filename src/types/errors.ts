export const ErrorCode = {
  SYSTEM_RATE_LIMIT:                    1,
  SYSTEM_TEMPORARY_UNAVAILABLE:         2,
  SYSTEM_INTERNAL_ERROR:                3,
  AUTH_INVALID_API_KEY:                 1000,
  AUTH_INVALID_SIGNATURE:               1001,
  AUTH_PERMISSION_DENIED:               1002,
  ACCOUNT_NOT_FOUND:                    2000,
  ACCOUNT_DISABLED:                     2001,
  ACCOUNT_CLOSE_ONLY:                   2002,
  REQUEST_INVALID:                      3000,
  REQUEST_INVALID_PARAMETERS:           3001,
  REQUEST_INVALID_PRICE:                3002,
  REQUEST_INVALID_TIMEFRAME:            3003,
  REQUEST_INVALID_TIME_RANGE:           3004,
  REQUEST_INVALID_COUNT:                3005,
  REQUEST_INVALID_LIMIT:                3006,
  REQUEST_INVALID_CURSOR:               3007,
  REQUEST_INVALID_PRICE_TYPE:           3008,
  REQUEST_INVALID_FILTER_COMBINATION:   3009,
  REQUEST_UNSUPPORTED_MEDIA_TYPE:       3010,
  REQUEST_METHOD_NOT_ALLOWED:           3011,
  REQUEST_ORDER_NOT_FOUND:              3012,
  REQUEST_POSITION_NOT_FOUND:           3013,
  REQUEST_OPERATION_NOT_FOUND:          3014,
  MARKET_INSTRUMENT_NOT_FOUND:          4000,
  MARKET_TRADE_DISABLED:                4001,
  MARKET_CLOSE_ONLY:                    4002,
  MARKET_SESSION_CLOSED:                4003,
  MARKET_NO_QUOTES:                     4004,
  TRADING_RULE_INVALID_VOLUME:          5000,
  TRADING_RULE_VOLUME_TOO_SMALL:        5001,
  TRADING_RULE_VOLUME_TOO_LARGE:        5002,
  TRADING_RULE_INVALID_VOLUME_STEP:     5003,
  TRADING_RULE_INVALID_REMAINING_VOLUME:5004,
  TRADING_RULE_INVALID_PRICE_LEVELS:    5005,
  TRADING_RULE_INSUFFICIENT_MARGIN:     5006,
  TRADING_RULE_MARGIN_LEVEL_TOO_LOW:    5007,
  TRADING_RULE_OPERATION_RESTRICTED:    5008,
  TRADING_RULE_TOO_MANY_PENDING_ORDERS: 5009,
  TRADING_RULE_TOO_MANY_OPEN_POSITIONS: 5010,
  EXECUTION_REQUOTE:                    6000,
  EXECUTION_REJECTED:                   6001,
} as const;
export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];

export interface ErrorResponse {
  code:          number;
  error_message: string;
}

export class ExnessApiError extends Error {
  constructor(
    public readonly code: number,
    public readonly error_message: string,
    public readonly httpStatus: number
  ) {
    super(`[${code}] ${error_message}`);
    this.name = 'ExnessApiError';
  }

  get isRetryable(): boolean {
    return this.code === ErrorCode.SYSTEM_RATE_LIMIT
        || this.code === ErrorCode.SYSTEM_TEMPORARY_UNAVAILABLE;
  }
}
