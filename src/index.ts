import type { AuthConfig } from './auth/signer.js';
import { ExnessHttpClient, type ExnessClientConfig } from './http/client.js';
import { ConfigurationApi } from './api/configuration.js';
import { HistoryApi } from './api/history.js';
import { MarketDataApi } from './api/market-data.js';
import { TradingApi } from './api/trading.js';
import { ExnessEventsClient } from './ws/events-client.js';
import { ExnessTicksClient } from './ws/ticks-client.js';
import type { UInt64String } from './types/common.js';

export class ExnessClient {
  public readonly marketData:    MarketDataApi;
  public readonly trading:       TradingApi;
  public readonly history:       HistoryApi;
  public readonly configuration: ConfigurationApi;

  private readonly http: ExnessHttpClient;

  constructor(private readonly config: ExnessClientConfig) {
    this.http          = new ExnessHttpClient(config);
    this.marketData    = new MarketDataApi(this.http);
    this.trading       = new TradingApi(this.http);
    this.history       = new HistoryApi(this.http);
    this.configuration = new ConfigurationApi(this.http);
  }

  createEventsClient(accountId: UInt64String): ExnessEventsClient {
    return new ExnessEventsClient(this.config.wsBaseUrl ?? this.config.baseUrl, accountId, this.config.auth);
  }

  createTicksClient(accountId: UInt64String): ExnessTicksClient {
    return new ExnessTicksClient(this.config.wsBaseUrl ?? this.config.baseUrl, accountId, this.config.auth);
  }
}

// Re-export everything needed by consumers
export type { AuthConfig, ExnessClientConfig };
export { ExnessEventsClient, ExnessTicksClient };

// Types
export type { UInt64String, InstrumentName, DecimalString, IdempotencyKey, Money } from './types/common.js';
export * from './types/enums.js';
export type {
  Order, Position, Deal, AccountState, TransactionAccountState,
  Candle, CandleBidAsk, CandleSide, WSTick,
  InstrumentCondition, AccountSettings, HmrPeriod,
  TransactionPayload, MethodRateLimit,
} from './types/models.js';
export type {
  OpenPositionRequest, ClosePositionParams, CloseAllPositionsParams,
  NewPendingOrderRequest, NewLimitOrderRequest, NewStopOrderRequest, NewSltpOrderRequest,
  ModifyOrderRequest, CancelAllOrdersParams,
  CandleHistoryParams, OrdersHistoryParams, DealsHistoryParams,
} from './types/requests.js';
export type {
  AckResponse, TradingStateSnapshot, OperationStatusResponse,
  CandleHistoryResponse, OrdersHistoryResponse, DealsHistoryResponse,
  AccountDetailsResponse, InstrumentConditionResponse,
  InstrumentNameListResponse, RateLimitsResponse,
} from './types/responses.js';
export type {
  WSTradingEvent, WSTradingStateSnapshotEvent, WSTradingTransactionEvent,
  WSAccountStateEvent, WSInstrumentEvent, WSHmrSnapshotEvent, WSHmrUpdateEvent,
  WsErrorResponse,
} from './types/ws-events.js';
export { ExnessApiError, ErrorCode } from './types/errors.js';
export type { ErrorResponse } from './types/errors.js';
