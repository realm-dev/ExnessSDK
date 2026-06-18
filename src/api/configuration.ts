import type { ExnessHttpClient } from '../http/client.js';
import type { InstrumentName, UInt64String } from '../types/common.js';
import type {
  AccountDetailsResponse, InstrumentConditionResponse,
  InstrumentNameListResponse, RateLimitsResponse,
} from '../types/responses.js';

export class ConfigurationApi {
  constructor(private readonly http: ExnessHttpClient) {}

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

  getRateLimits(accountId: UInt64String): Promise<RateLimitsResponse> {
    return this.http.request('GET',
      `/v1/configuration/accounts/${accountId}/rate-limits`
    );
  }
}
