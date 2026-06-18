import type { ExnessHttpClient } from '../http/client.js';
import type { IdempotencyKey, UInt64String } from '../types/common.js';
import type {
  CancelAllOrdersParams, CloseAllPositionsParams, ClosePositionParams,
  ModifyOrderRequest, NewPendingOrderRequest, OpenPositionRequest,
} from '../types/requests.js';
import type { AckResponse, OperationStatusResponse, TradingStateSnapshot } from '../types/responses.js';

export class TradingApi {
  constructor(private readonly http: ExnessHttpClient) {}

  // ------------------------------------------------------------------ Positions

  openPosition(
    accountId: UInt64String,
    req: OpenPositionRequest,
    idempotencyKey: IdempotencyKey
  ): Promise<AckResponse> {
    return this.http.request('POST',
      `/v1/trading/accounts/${accountId}/positions`,
      { body: req, idempotencyKey }
    );
  }

  closePosition(
    accountId: UInt64String,
    positionId: UInt64String,
    params: ClosePositionParams,
    idempotencyKey: IdempotencyKey
  ): Promise<AckResponse> {
    return this.http.request('DELETE',
      `/v1/trading/accounts/${accountId}/positions/${positionId}`,
      { query: params as unknown as Record<string, string | number | boolean | undefined | null>, idempotencyKey }
    );
  }

  closeAllPositions(
    accountId: UInt64String,
    params: CloseAllPositionsParams,
    idempotencyKey: IdempotencyKey
  ): Promise<AckResponse> {
    return this.http.request('DELETE',
      `/v1/trading/accounts/${accountId}/positions`,
      { query: params as unknown as Record<string, string | number | boolean | undefined | null>, idempotencyKey }
    );
  }

  // ------------------------------------------------------------------ Orders

  placePendingOrder(
    accountId: UInt64String,
    req: NewPendingOrderRequest,
    idempotencyKey: IdempotencyKey
  ): Promise<AckResponse> {
    return this.http.request('POST',
      `/v1/trading/accounts/${accountId}/orders`,
      { body: req, idempotencyKey }
    );
  }

  modifyOrder(
    accountId: UInt64String,
    orderId: UInt64String,
    req: ModifyOrderRequest,
    idempotencyKey: IdempotencyKey
  ): Promise<AckResponse> {
    return this.http.request('PATCH',
      `/v1/trading/accounts/${accountId}/orders/${orderId}`,
      { body: req, idempotencyKey }
    );
  }

  cancelPendingOrder(
    accountId: UInt64String,
    orderId: UInt64String,
    idempotencyKey: IdempotencyKey
  ): Promise<AckResponse> {
    return this.http.request('DELETE',
      `/v1/trading/accounts/${accountId}/orders/${orderId}`,
      { idempotencyKey }
    );
  }

  cancelAllPendingOrders(
    accountId: UInt64String,
    params: CancelAllOrdersParams,
    idempotencyKey: IdempotencyKey
  ): Promise<AckResponse> {
    return this.http.request('DELETE',
      `/v1/trading/accounts/${accountId}/orders`,
      { query: params as unknown as Record<string, string | number | boolean | undefined | null>, idempotencyKey }
    );
  }

  // ------------------------------------------------------------------ State & operations

  getTradingStateSnapshot(accountId: UInt64String): Promise<TradingStateSnapshot> {
    return this.http.request('GET',
      `/v1/trading/accounts/${accountId}/snapshot`
    );
  }

  getOperationStatus(
    accountId: UInt64String,
    operationId: UInt64String
  ): Promise<OperationStatusResponse> {
    return this.http.request('GET',
      `/v1/trading/accounts/${accountId}/operations/${operationId}`
    );
  }
}
