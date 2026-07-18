# ExnessSDK

Unofficial TypeScript SDK for the Exness Public Trader API.

## Installation

Create a project and install the package:

```bash
npm init -y
npm install exness-sdk
```

Or install it into an existing project:

```bash
npm install exness-sdk
```

## Environment variables

The examples below use these variables:

```bash
EXNESS_API_KEY=...
EXNESS_CLOCK_OFFSET_MS=0
EXNESS_BASE_URL=https://api.exness.com
EXNESS_WS_BASE_URL=your_websocket_base_url
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
  clockOffsetMs: Number(process.env.EXNESS_CLOCK_OFFSET_MS ?? '0'),
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
- The SDK now keeps a shared `clockOffsetMs` in sync from HTTP `Date` response headers and reuses it for both REST and WS handshakes.
- If you want to set it explicitly, pass `clockOffsetMs` in the client config to bias all signed requests and WS handshakes.
- To obtain a good value once, create the client without `clockOffsetMs`, make one signed REST call, and then read `client.getClockOffsetMs()`.
- You can persist that value and feed it back through `clockOffsetMs` on the next start.
- The SDK still applies a small safety margin into the past on top of that offset.

Trading price formatting note:
- Before sending `price`, `stop_loss_price`, or `take_profit_price` in trading REST requests, load instrument conditions with `configuration.getInstrumentCondition(accountId, instrument)`.
- The server validates these fields against the instrument `point_digits` precision.
- Sending raw JavaScript floating-point values such as `60041.770000000004` can fail with `REQUEST_INVALID_PRICE`.
- Always normalize trade prices to the instrument precision first, for example with `value.toFixed(pointDigits)`.
- This is especially important when stop-loss or take-profit prices are derived from spreads or other arithmetic on tick values.

### WebSocket client

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

### Minimal bot example

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
  clockOffsetMs: Number(process.env.EXNESS_CLOCK_OFFSET_MS ?? '0'),
});

const accountId = '15000044623' as never;
const instrument = 'BTCUSD' as never;

// REST: load instrument settings before trading.
const instrumentCondition = await client.configuration.getInstrumentCondition(accountId, instrument);
console.log('[bot] instrument condition', instrumentCondition);

// REST: place a simple market order.
const marketAck = await client.trading.openPosition(
  accountId,
  {
    instrument,
    side: 'buy',
    volume: '0.01',
    comment: 'README example market order',
  },
  'market-open-1'
);
console.log('[bot] market order ack', marketAck);

// WS: subscribe to transactions and quotes.
const events = client.createEventsClient(accountId);
const ticks = client.createTicksClient(accountId);

events.on('transaction_event', (event) => {
  console.log('[bot] transaction', event);
});

events.on('trading_state_snapshot', (event) => {
  console.log('[bot] state snapshot', event);
});

events.on('error', (event) => {
  console.error('[bot] events error', event);
});

ticks.on('tick', (tick) => {
  console.log('[bot] tick', tick);
});

ticks.on('error', (event) => {
  console.error('[bot] ticks error', event);
});

await events.connect();
await ticks.connect();

events.subscribeTransactions('transactions-1');
events.subscribeInstruments('instruments-1', [instrument]);
ticks.subscribe('ticks-1', [instrument]);
```

You can also keep this example in a file such as [`ExnessSDK/examples/simple-bot.ts`](./examples/simple-bot.ts) and use [`ExnessSDK/examples/.env.example`](./examples/.env.example) as a starting point for local configuration.

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

### Market order example

If you only need the trading call, this is the minimal version:

```ts
import { ExnessClient } from 'exness-sdk';

const client = new ExnessClient({
  baseUrl: process.env.EXNESS_BASE_URL ?? 'https://api.exness.com',
  auth: {
    type: 'signed',
    apiKey: process.env.EXNESS_API_KEY!,
    privateKey: privateKeySeed,
  },
  clockOffsetMs: Number(process.env.EXNESS_CLOCK_OFFSET_MS ?? '0'),
});

const ack = await client.trading.openPosition(
  '15000044623' as never,
  {
    instrument: 'BTCUSD' as never,
    side: 'buy',
    volume: '0.01',
  },
  'open-market-1'
);

console.log(ack);
```
