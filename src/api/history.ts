import type { ExnessHttpClient } from '../http/client.js';
import type { UInt64String } from '../types/common.js';
import type { DealsHistoryParams, OrdersHistoryParams } from '../types/requests.js';
import type { DealsHistoryResponse, OrdersHistoryResponse } from '../types/responses.js';

export class HistoryApi {
  constructor(private readonly http: ExnessHttpClient) {}

  getOrdersHistory(
    accountId: UInt64String,
    params?: OrdersHistoryParams
  ): Promise<OrdersHistoryResponse> {
    return this.http.request('GET',
      `/v1/history/accounts/${accountId}/orders`,
      { query: params as unknown as Record<string, string | number | boolean | undefined | null> }
    );
  }

  getDealsHistory(
    accountId: UInt64String,
    params?: DealsHistoryParams
  ): Promise<DealsHistoryResponse> {
    return this.http.request('GET',
      `/v1/history/accounts/${accountId}/deals`,
      { query: params as unknown as Record<string, string | number | boolean | undefined | null> }
    );
  }
}
