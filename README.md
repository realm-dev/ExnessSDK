# ExnessSDK
Non official Exness typescript SDK 

## Installation

```bash
npm install github:realm-dev/ExnessSDK
```

## Usage

### REST client

```ts
import { ExnessClient } from 'exness-sdk';

const client = new ExnessClient({
  baseUrl: 'https://api.exness.com',
  auth: {
    type: 'signed',
    apiKey: process.env.EXNESS_API_KEY!,
    privateKey: privateKeySeed,
  },
});

const accountId = '15000044623' as never;
const accessPoint = await client.configuration.getTradingAccessPoint(accountId);

const tradingClient = new ExnessClient({
  baseUrl: accessPoint.access_point,
  auth: {
    type: 'signed',
    apiKey: process.env.EXNESS_API_KEY!,
    privateKey: privateKeySeed,
  },
});

const instruments = await tradingClient.configuration.getAvailableInstrumentList(accountId);
console.log(instruments);
```

Signed auth note:
- The server timestamp tolerance is effectively asymmetric: requests are accepted only when `0 <= server_now_ms - signed_timestamp_ms <= 3000`.
- In practice, a client clock that is even slightly ahead of the server can trigger `AUTH_INVALID_API_KEY` with reason `timestamp out of tolerance`.
- If you see intermittent auth failures with otherwise valid signatures, bias the signed timestamp slightly into the past, for example `Date.now() - 1000`.

### WebSocket client

```ts
import { ExnessClient } from 'exness-sdk';

const client = new ExnessClient({
  baseUrl: 'https://api.exness.com',
  wsBaseUrl: 'https://rtapi.prod.env/rtapi/exot/trial3',
  auth: {
    type: 'signed',
    apiKey: process.env.EXNESS_API_KEY!,
    privateKey: privateKeySeed,
  },
});

const accountId = '15000044623' as never;
const ticks = client.createTicksClient(accountId);

ticks.on('tick', (tick) => {
  console.log('tick', tick);
});

ticks.on('error', (err) => {
  console.error('ws error', err);
});

await ticks.connect();
ticks.subscribe('ticks-1', ['BTCUSD']);
```

## WebSocket Notes

- `baseUrl` is used for REST requests.
- `wsBaseUrl` can be provided separately when WebSocket traffic must use a different host than REST.
- Some EXOT environments use a dedicated WS host such as `https://rtapi...`, while REST configuration/trading requests still use the standard API host or resolved trading access point.
- The SDK requests the `exness-ws-protocol` WebSocket subprotocol automatically.
- Signed WebSocket `GET` handshakes must use an empty `EXN-IDEMPOTENCY-KEY`. `X-Request-ID` may still be sent separately for tracing.
- The ticks stream uses the legacy subscribe payload:

```json
{
  "id": "ticks-1",
  "subscribe": {
    "event": "ticks",
    "instruments": ["BTCUSD"]
  }
}
```

- A `{"id":"...","code":200}` WebSocket message is treated as a subscribe ACK, not as an error.
- Some internal WS hosts may present a self-signed certificate chain. The current SDK disables TLS verification for WS connections as a diagnostic workaround; replace this with a proper CA configuration for production use.

```typescript
import { ExnessSDK } from 'exness-sdk';
```
