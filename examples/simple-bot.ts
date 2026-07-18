import { ExnessClient } from 'exness-sdk';

const accountId = '15000044623' as never;
const instrument = (process.env.EXNESS_INSTRUMENT ?? 'BTCUSD') as never;

const client = new ExnessClient({
  baseUrl: process.env.EXNESS_BASE_URL ?? 'https://api.exness.com',
  wsBaseUrl: process.env.EXNESS_WS_BASE_URL,
  auth: {
    type: 'signed',
    apiKey: process.env.EXNESS_API_KEY!,
    privateKey: process.env.EXNESS_PRIVATE_KEY!,
  },
  clockOffsetMs: Number(process.env.EXNESS_CLOCK_OFFSET_MS ?? '0'),
});

async function main(): Promise<void> {
  const instrumentCondition = await client.configuration.getInstrumentCondition(accountId, instrument);
  console.log('[bot] instrument condition', instrumentCondition);

  const events = client.createEventsClient(accountId);
  const ticks = client.createTicksClient(accountId);

  events.on('transaction_event', (event) => {
    console.log('[bot] transaction event', event);
  });

  events.on('trading_state_snapshot', (event) => {
    console.log('[bot] trading snapshot', event);
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

  const ack = await client.trading.openPosition(
    accountId,
    {
      instrument,
      side: 'buy',
      volume: '0.01',
      comment: 'simple-bot market order',
    },
    'open-market-1'
  );

  console.log('[bot] market order ack', ack);
}

main().catch((error) => {
  console.error('[bot] fatal error', error);
  process.exitCode = 1;
});
