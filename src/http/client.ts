import { buildSignedHeaders, type AuthConfig } from '../auth/signer.js';
import { ExnessApiError, type ErrorResponse } from '../types/errors.js';

export interface ExnessClientConfig {
  baseUrl: string;
  wsBaseUrl?: string;
  auth:    AuthConfig;
  clockOffsetMs?: number;
}

type QueryParams = Record<string, string | number | boolean | undefined | null>;

function buildQueryString(params?: QueryParams): string {
  if (!params) return '';
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.length > 0 ? '?' + parts.join('&') : '';
}

export class ExnessHttpClient {
  constructor(private readonly config: ExnessClientConfig) {}

  getClockOffsetMs(): number {
    return this.config.clockOffsetMs ?? 0;
  }

  private updateClockOffsetFromResponse(response: Response): void {
    const serverDate = response.headers.get('date');
    if (!serverDate) {
      return;
    }

    const serverTimeMs = Date.parse(serverDate);
    if (!Number.isFinite(serverTimeMs)) {
      return;
    }

    this.config.clockOffsetMs = serverTimeMs - Date.now();

    if (process.env.EXNESS_HTTP_DEBUG === '1') {
      console.log('[exness-sdk][http] clock-offset-updated', JSON.stringify({
        serverDate,
        serverTimeMs,
        localTimeMs: Date.now(),
        clockOffsetMs: this.config.clockOffsetMs,
      }));
    }
  }

  async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    options?: {
      query?:          QueryParams;
      body?:           unknown;
      idempotencyKey?: string;
    }
  ): Promise<T> {
    const bodyStr = options?.body !== undefined ? JSON.stringify(options.body) : '';
    const qs = buildQueryString(options?.query);
    const pathWithQuery = path + qs;
    const idempotencyKey = options?.idempotencyKey ?? '';
    const url = this.config.baseUrl + pathWithQuery;
    const maxAttempts = this.config.auth.type === 'signed' ? 2 : 1;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.auth.type === 'signed') {
        const authHeaders = await buildSignedHeaders(
          this.config.auth,
          method,
          pathWithQuery,
          bodyStr,
          idempotencyKey,
          { clockOffsetMs: this.getClockOffsetMs() }
        );
        Object.assign(headers, authHeaders);
      } else {
        headers['Authorization'] = `Bearer ${this.config.auth.token}`;
        if (idempotencyKey) {
          headers['Idempotency-Key'] = idempotencyKey;
        }
      }

      if (process.env.EXNESS_AUTH_DEBUG === '1' && this.config.auth.type === 'signed') {
        console.log('[exness-sdk][http] request', JSON.stringify({
          method,
          url,
          headers: {
            'EXN-API-KEY': headers['EXN-API-KEY'],
            'EXN-IDEMPOTENCY-KEY': headers['EXN-IDEMPOTENCY-KEY'],
            'EXN-TIMESTAMP': headers['EXN-TIMESTAMP'],
            'EXN-SIGN-VERSION': headers['EXN-SIGN-VERSION'],
          },
          body: bodyStr || null,
          attempt,
          clockOffsetMs: this.getClockOffsetMs(),
        }));
      }

      const response = await fetch(url, {
        method,
        headers,
        body: bodyStr || undefined,
      });

      this.updateClockOffsetFromResponse(response);

      if (!response.ok) {
        let errorBody: ErrorResponse = { code: response.status, error_message: response.statusText };
        try {
          errorBody = await response.json() as ErrorResponse;
        } catch {
          // leave default
        }

        const shouldRetry = this.config.auth.type === 'signed'
          && attempt === 0
          && (
            errorBody.code === 1000
            || /timestamp out of tolerance/i.test(errorBody.error_message)
            || /AUTH_INVALID_API_KEY/i.test(errorBody.error_message)
          );

        if (shouldRetry) {
          if (process.env.EXNESS_AUTH_DEBUG === '1') {
            console.warn('[exness-sdk][http] retry-after-auth-failure', JSON.stringify({
              method,
              url,
              status: response.status,
              code: errorBody.code,
              error_message: errorBody.error_message,
              clockOffsetMs: this.getClockOffsetMs(),
            }));
          }
          continue;
        }

        throw new ExnessApiError(errorBody.code, errorBody.error_message, response.status);
      }

      // 204 No Content or empty body
      const text = await response.text();
      if (!text) return undefined as T;

      return JSON.parse(text) as T;
    }

    throw new Error('Request retries exhausted');
  }
}
