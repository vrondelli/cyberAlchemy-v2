import {mkdir, open, readFile, rename, rm} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {dirname, resolve} from 'node:path';

const SCHEMA = 'are.broker-quota/v1';
const WINDOW_MS = 60 * 60 * 1000;

function integer(value, minimum, maximum, name) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) throw new Error(`broker-quota-${name}-invalid`);
  return value;
}

function fresh(now) {
  return {schema_version: SCHEMA, window_start_ms: Math.floor(now / WINDOW_MS) * WINDOW_MS, calls: 0, committed_tokens: 0, reservations: []};
}

function normalize(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.schema_version !== SCHEMA ||
      !Number.isSafeInteger(value.window_start_ms) || value.window_start_ms < 0 ||
      !Number.isSafeInteger(value.calls) || value.calls < 0 ||
      !Number.isSafeInteger(value.committed_tokens) || value.committed_tokens < 0 ||
      !Array.isArray(value.reservations) || value.reservations.some(item => !item || typeof item !== 'object' ||
        !/^[a-f0-9-]{36}$/.test(item.id) || !Number.isSafeInteger(item.tokens) || item.tokens < 1)) {
    throw new Error('broker-quota-state-invalid');
  }
  return {schema_version: SCHEMA, window_start_ms: value.window_start_ms, calls: value.calls,
    committed_tokens: value.committed_tokens, reservations: value.reservations.map(item => ({id: item.id, tokens: item.tokens}))};
}

async function atomicWrite(path, value) {
  const temporary = `${path}.tmp-${randomUUID()}`;
  let handle;
  try {
    handle = await open(temporary, 'wx', 0o600);
    await handle.writeFile(JSON.stringify(value) + '\n', 'utf8');
    await handle.sync();
    await handle.close(); handle = undefined;
    await rename(temporary, path);
    const directory = await open(dirname(path), 'r');
    try { await directory.sync(); } finally { await directory.close(); }
  } catch (error) {
    await handle?.close().catch(() => {});
    await rm(temporary, {force: true}).catch(() => {});
    throw error;
  }
}

export function createDurableBrokerQuota({
  statePath = '/var/lib/are-broker-quota/state.json', now = Date.now,
  maximumActive = 2, maximumCalls = 60, maximumTokens = 100_000, reservationTokens = 37_000,
} = {}) {
  const path = resolve(statePath);
  if (typeof now !== 'function' || !path.endsWith('.json')) throw new Error('broker-quota-config-invalid');
  integer(maximumActive, 1, 128, 'active');
  integer(maximumCalls, 1, 100_000, 'calls');
  integer(maximumTokens, 1, 1_000_000_000, 'tokens');
  integer(reservationTokens, 1, maximumTokens, 'reservation');
  let state;
  let chain = Promise.resolve();

  async function persist(next) {
    try {
      await mkdir(dirname(path), {recursive: true, mode: 0o700});
      await atomicWrite(path, next);
    } catch { throw new Error('broker-quota-unavailable'); }
    state = next;
  }

  async function load() {
    if (state) return;
    let candidate;
    try { candidate = normalize(JSON.parse(await readFile(path, 'utf8'))); }
    catch (error) {
      if (error?.code !== 'ENOENT') throw new Error('broker-quota-unavailable');
      candidate = fresh(now());
      await persist(candidate);
      return;
    }
    if (candidate.reservations.length > 0) {
      candidate.committed_tokens += candidate.reservations.reduce((sum, item) => sum + item.tokens, 0);
      candidate.reservations = [];
      await persist(candidate);
    } else state = candidate;
  }

  function serialize(operation) {
    const result = chain.then(operation, operation);
    chain = result.catch(() => {});
    return result;
  }

  async function transaction(change) {
    return serialize(async () => {
      await load();
      let current = structuredClone(state);
      const timestamp = now();
      if (timestamp - current.window_start_ms >= WINDOW_MS && current.reservations.length === 0) current = fresh(timestamp);
      const {next, value} = change(current);
      await persist(next);
      return value;
    });
  }

  return {
    acquire() {
      return transaction(current => {
        if (current.reservations.length >= maximumActive) throw new Error('broker-concurrency-limit');
        if (current.calls >= maximumCalls) throw new Error('broker-hourly-limit');
        const reserved = current.reservations.reduce((sum, item) => sum + item.tokens, 0);
        if (current.committed_tokens + reserved + reservationTokens > maximumTokens) throw new Error('broker-token-limit');
        const id = randomUUID();
        const next = structuredClone(current);
        next.calls += 1;
        next.reservations.push({id, tokens: reservationTokens});
        let settled = false;
        return {next, value: {
          complete(usedTokens) {
            if (settled) return Promise.reject(new Error('broker-quota-lease-settled'));
            settled = true;
            const charged = usedTokens === undefined ? reservationTokens : integer(usedTokens, 0, reservationTokens, 'usage');
            return transaction(live => {
              const reservation = live.reservations.find(item => item.id === id);
              if (!reservation) throw new Error('broker-quota-unavailable');
              const completed = structuredClone(live);
              completed.reservations = completed.reservations.filter(item => item.id !== id);
              completed.committed_tokens += charged;
              return {next: completed, value: undefined};
            });
          },
        }};
      });
    },
  };
}
