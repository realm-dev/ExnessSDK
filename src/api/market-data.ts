import type { ExnessHttpClient } from '../http/client.js';
import type { UInt64String } from '../types/common.js';
import type { CandleHistoryParams } from '../types/requests.js';
import type { CandleHistoryResponse } from '../types/responses.js';

export class MarketDataApi {
  constructor(private readonly http: ExnessHttpClient) {}

  getCandleHistory(
    accountId: UInt64String,
    params: CandleHistoryParams
  ): Promise<CandleHistoryResponse> {
    return this.http.request('GET',
      `/v1/market-data/accounts/${accountId}/candles`,
      { query: params as unknown as Record<string, string | number | boolean | undefined | null> }
    );
  }
}
