import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createDurableBrokerQuota} from './broker-quota.mjs';

async function fixture(options, run) {
  const directory = await mkdtemp(join(tmpdir(), 'are-broker-quota-'));
  const statePath = join(directory, 'state.json');
  try { await run(statePath, options); } finally { await rm(directory, {recursive: true}); }
}

test('durable quota charges an abandoned reservation after restart', async () => {
  await fixture({maximumActive: 1, maximumCalls: 4, maximumTokens: 100, reservationTokens: 60}, async (statePath, options) => {
    const first = createDurableBrokerQuota({statePath, ...options});
    await first.acquire();
    const restarted = createDurableBrokerQuota({statePath, ...options});
    await assert.rejects(restarted.acquire(), /broker-token-limit/);
  });
});

test('durable quota enforces concurrency and retains completed usage', async () => {
  await fixture({maximumActive: 1, maximumCalls: 4, maximumTokens: 100, reservationTokens: 60}, async (statePath, options) => {
    const quota = createDurableBrokerQuota({statePath, ...options});
    const lease = await quota.acquire();
    await assert.rejects(quota.acquire(), /broker-concurrency-limit/);
    await lease.complete(25);
    const restarted = createDurableBrokerQuota({statePath, ...options});
    const next = await restarted.acquire();
    await next.complete(15);
    await assert.rejects(next.complete(1), /broker-quota-lease-settled/);
  });
});

test('durable quota rolls an idle elapsed window without discarding active work', async () => {
  let timestamp = 1_800_000;
  await fixture({maximumActive: 1, maximumCalls: 1, maximumTokens: 100, reservationTokens: 60}, async (statePath, options) => {
    const quota = createDurableBrokerQuota({statePath, now: () => timestamp, ...options});
    const lease = await quota.acquire();
    timestamp += 3_600_000;
    await assert.rejects(quota.acquire(), /broker-concurrency-limit/);
    await lease.complete(10);
    const next = await quota.acquire();
    await next.complete(5);
  });
});
