import { createHash } from 'node:crypto';
import * as ed from '@noble/ed25519';
import { createHash as _createHash } from 'node:crypto';

// Required by @noble/ed25519 v2 in Node.js environments without WebCrypto globals
ed.etc.sha512Sync = (...msgs) => {
  const h = _createHash('sha512');
  for (const m of msgs) h.update(m);
  return new Uint8Array(h.digest());
};

export interface SignedAuthConfig {
  type:       'signed';
  apiKey:     string;
  privateKey: Uint8Array;  // 32-byte Ed25519 private key seed
}

export interface BearerAuthConfig {
  type:  'bearer';
  token: string;
}

export type AuthConfig = SignedAuthConfig | BearerAuthConfig;

// base64url without padding
function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function sha256Base64Url(text: string): string {
  const hash = createHash('sha256').update(text, 'utf8').digest();
  return toBase64Url(hash);
}

// SHA-256 of the empty string — used as body_hash for GET / no-body requests
export const EMPTY_BODY_HASH = sha256Base64Url('');

export type SignedHeaders = Record<string, string>;

export async function buildSignedHeaders(
  config: SignedAuthConfig,
  method: string,           // uppercase: 'GET', 'POST', etc.
  pathWithQuery: string,    // path + query string exactly as transmitted
  body: string,             // JSON-serialized body or '' for GET/no-body
  idempotencyKey: string    // '' for GET requests
): Promise<SignedHeaders> {
  const timestamp = Date.now();
  const bodyHash  = body ? sha256Base64Url(body) : EMPTY_BODY_HASH;

  const payload = {
    api_key:         config.apiKey,
    idempotency_key: idempotencyKey,
    timestamp,
    sign_version:    1,
    method:          method.toUpperCase(),
    path:            pathWithQuery,
    body_hash:       bodyHash,
  };

  // Sign the raw UTF-8 bytes of the JSON payload (NOT the base64url string)
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const dataHeader   = toBase64Url(payloadBytes);
  const signature    = await ed.signAsync(payloadBytes, config.privateKey);
  const signHeader   = toBase64Url(signature);

  return {
    'EXN-API-KEY':         config.apiKey,
    'EXN-TIMESTAMP':       String(timestamp),
    'EXN-SIGN-VERSION':    '1',
    'EXN-IDEMPOTENCY-KEY': idempotencyKey,
    'EXN-DATA':            dataHeader,
    'EXN-SIGN':            signHeader,
  };
}
