import type { ExnessHttpClient } from '../http/client.js';
import type { InstrumentName, UInt64String } from '../types/common.js';
import type {
  AccountDetailsResponse,
  InstrumentConditionResponse,
  InstrumentNameListResponse,
  LimitsResponse,
} from '../types/responses.js';

export class ConfigurationApi {
  constructor(private readonly http: ExnessHttpClient) {}

  getTradingAccessPoint(accountId: UInt64String): Promise<{ access_point: string; account_id: UInt64String }> {
    return this.http.request('GET', '/v1/trading/access-point', { query: { account_id: accountId } });
  }

  getAccountDetails(accountId: UInt64String): Promise<AccountDetailsResponse> {
    return this.http.request('GET',
      `/v1/configuration/accounts/${accountId}/account`
    );
  }

  getAvailableInstrumentList(accountId: UInt64String): Promise<InstrumentNameListResponse> {
    return this.http.request('GET',
      `/v1/configuration/accounts/${accountId}/instruments`
    );
  }

  getInstrumentCondition(
    accountId: UInt64String,
    instrument: InstrumentName
  ): Promise<InstrumentConditionResponse> {
    return this.http.request('GET',
      `/v1/configuration/accounts/${accountId}/instruments/${instrument}/conditions`
    );
  }

  getLimits(accountId: UInt64String): Promise<LimitsResponse> {
    return this.http.request('GET',
      `/v1/configuration/accounts/${accountId}/limits`
    );
  }

  getRateLimits(accountId: UInt64String): Promise<LimitsResponse> {
    return this.getLimits(accountId);
  }
}
