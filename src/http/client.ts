import { buildSignedHeaders, type AuthConfig } from '../auth/signer.js';
import { ExnessApiError, type ErrorResponse } from '../types/errors.js';

export interface ExnessClientConfig {
  baseUrl: string;
  auth:    AuthConfig;
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

  async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    options?: {
      query?:          QueryParams;
      body?:           unknown;
      idempotencyKey?: string;
    }
  ): Promise<T> {
    const bodyStr       = options?.body !== undefined ? JSON.stringify(options.body) : '';
    const qs            = buildQueryString(options?.query);
    const pathWithQuery = path + qs;
    const idempotencyKey = options?.idempotencyKey ?? '';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.auth.type === 'signed') {
      const authHeaders = await buildSignedHeaders(
        this.config.auth,
        method,
        pathWithQuery,
        bodyStr,
        idempotencyKey
      );
      Object.assign(headers, authHeaders);
    } else {
      headers['Authorization'] = `Bearer ${this.config.auth.token}`;
      if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
      }
    }

    const url = this.config.baseUrl + pathWithQuery;
    const response = await fetch(url, {
      method,
      headers,
      body: bodyStr || undefined,
    });

    if (!response.ok) {
      let errorBody: ErrorResponse = { code: response.status, error_message: response.statusText };
      try {
        errorBody = await response.json() as ErrorResponse;
      } catch {
        // leave default
      }
      throw new ExnessApiError(errorBody.code, errorBody.error_message, response.status);
    }

    // 204 No Content or empty body
    const text = await response.text();
    if (!text) return undefined as T;

    return JSON.parse(text) as T;
  }
}
