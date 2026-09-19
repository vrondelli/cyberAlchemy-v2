import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createDurableBrokerQuota} from './broker-quota.mjs';

const monetary = {
  maximumInputTokens: 50,
  maximumOutputTokens: 10,
  maximumHourlyMicrousd: 100,
  maximumMonthlyMicrousd: 200,
  inputMicrousdPerMillionTokens: 1_000_000,
  outputMicrousdPerMillionTokens: 2_000_000,
};

async function fixture(options, run) {
  const directory = await mkdtemp(join(tmpdir(), 'are-broker-quota-'));
  const statePath = join(directory, 'state.json');
  try { await run(statePath, options); } finally { await rm(directory, {recursive: true}); }
}

test('durable quota charges an abandoned token and monetary reservation after restart', async () => {
  await fixture({maximumActive: 1, maximumCalls: 4, maximumTokens: 100, reservationTokens: 60, ...monetary}, async (statePath, options) => {
    const first = createDurableBrokerQuota({statePath, ...options});
    await first.acquire();
    const restarted = createDurableBrokerQuota({statePath, ...options});
    await assert.rejects(restarted.acquire(), /broker-token-limit/);
  });
});

test('durable quota enforces concurrency and retains completed usage', async () => {
  await fixture({maximumActive: 1, maximumCalls: 4, maximumTokens: 100, reservationTokens: 60, ...monetary}, async (statePath, options) => {
    const quota = createDurableBrokerQuota({statePath, ...options});
    const lease = await quota.acquire();
    await assert.rejects(quota.acquire(), /broker-concurrency-limit/);
    await lease.complete({inputTokens: 15, outputTokens: 5});
    const restarted = createDurableBrokerQuota({statePath, ...options});
    const next = await restarted.acquire();
    await next.complete({inputTokens: 5, outputTokens: 5});
    await assert.rejects(next.complete({inputTokens: 1, outputTokens: 0}), /broker-quota-lease-settled/);
  });
});

test('durable quota rolls an idle elapsed window without discarding active work', async () => {
  let timestamp = 1_800_000;
  await fixture({maximumActive: 1, maximumCalls: 1, maximumTokens: 100, reservationTokens: 60, ...monetary}, async (statePath, options) => {
    const quota = createDurableBrokerQuota({statePath, now: () => timestamp, ...options});
    const lease = await quota.acquire();
    timestamp += 3_600_000;
    await assert.rejects(quota.acquire(), /broker-concurrency-limit/);
    await lease.complete({inputTokens: 5, outputTokens: 0});
    const next = await quota.acquire();
    await next.complete({inputTokens: 5, outputTokens: 0});
  });
});

test('durable quota enforces hourly and monthly monetary ceilings across restart and window rollover', async () => {
  let timestamp = Date.UTC(2026, 8, 18, 10);
  const options = {maximumActive: 1, maximumCalls: 10, maximumTokens: 1000, reservationTokens: 60,
    ...monetary, maximumHourlyMicrousd: 100, maximumMonthlyMicrousd: 110};
  await fixture(options, async (statePath, configured) => {
    const first = createDurableBrokerQuota({statePath, now: () => timestamp, ...configured});
    const lease = await first.acquire();
    await lease.complete({inputTokens: 40, outputTokens: 5}); // 50 micro-USD.
    const restarted = createDurableBrokerQuota({statePath, now: () => timestamp, ...configured});
    await assert.rejects(restarted.acquire(), /broker-hourly-spend-limit/);
    timestamp += 3_600_000;
    const nextHour = createDurableBrokerQuota({statePath, now: () => timestamp, ...configured});
    await assert.rejects(nextHour.acquire(), /broker-monthly-spend-limit/);
    timestamp = Date.UTC(2026, 9, 1);
    const nextMonth = createDurableBrokerQuota({statePath, now: () => timestamp, ...configured});
    const afterReset = await nextMonth.acquire();
    await afterReset.complete({inputTokens: 1, outputTokens: 1});
  });
});

test('v1 state migrates conservatively and invalid monetary configuration fails closed', async () => {
  await fixture({maximumActive: 1, maximumCalls: 4, maximumTokens: 100, reservationTokens: 60, ...monetary}, async (statePath, options) => {
    await writeFile(statePath, JSON.stringify({schema_version: 'are.broker-quota/v1', window_start_ms: 0,
      calls: 1, committed_tokens: 10, reservations: []}) + '\n');
    const quota = createDurableBrokerQuota({statePath, now: () => 1_800_000, ...options});
    await assert.rejects(quota.acquire(), /broker-hourly-spend-limit/);
    assert.equal(JSON.parse(await readFile(statePath, 'utf8')).schema_version, 'are.broker-quota/v2');
  });
  assert.throws(() => createDurableBrokerQuota(), /broker-quota-hourly-microusd-invalid/);
  assert.throws(() => createDurableBrokerQuota({...monetary, maximumHourlyMicrousd: 69}), /broker-quota-monetary-reservation-invalid/);
});
