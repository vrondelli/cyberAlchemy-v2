import {mkdir, open, readFile, rename, rm} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {dirname, resolve} from 'node:path';

const SCHEMA = 'are.broker-quota/v2';
const PREVIOUS_SCHEMA = 'are.broker-quota/v1';
const WINDOW_MS = 60 * 60 * 1000;
const RATE_DENOMINATOR = 1_000_000;

function integer(value, minimum, maximum, name) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) throw new Error(`broker-quota-${name}-invalid`);
  return value;
}

function monthStart(now) {
  const date = new Date(now);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
}

function fresh(now) {
  return {schema_version: SCHEMA, window_start_ms: Math.floor(now / WINDOW_MS) * WINDOW_MS,
    month_start_ms: monthStart(now), calls: 0, committed_tokens: 0,
    hourly_committed_microusd: 0, monthly_committed_microusd: 0, reservations: []};
}

function exactKeys(value, expected) {
  return Object.keys(value).length === expected.length && Object.keys(value).every(key => expected.includes(key));
}

function normalize(value, reservationMicrousd) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('broker-quota-state-invalid');
  if (value.schema_version === PREVIOUS_SCHEMA) {
    if (!exactKeys(value, ['schema_version', 'window_start_ms', 'calls', 'committed_tokens', 'reservations']) ||
        !Number.isSafeInteger(value.window_start_ms) || value.window_start_ms < 0 ||
        !Number.isSafeInteger(value.calls) || value.calls < 0 ||
        !Number.isSafeInteger(value.committed_tokens) || value.committed_tokens < 0 ||
        !Array.isArray(value.reservations) || value.reservations.some(item => !item || typeof item !== 'object' ||
          !exactKeys(item, ['id', 'tokens']) || !/^[a-f0-9-]{36}$/.test(item.id) ||
          !Number.isSafeInteger(item.tokens) || item.tokens < 1) || value.calls < value.reservations.length) {
      throw new Error('broker-quota-state-invalid');
    }
    const completedCost = (value.calls - value.reservations.length) * reservationMicrousd;
    if (!Number.isSafeInteger(completedCost)) throw new Error('broker-quota-state-invalid');
    return {schema_version: SCHEMA, window_start_ms: value.window_start_ms, month_start_ms: monthStart(value.window_start_ms),
      calls: value.calls, committed_tokens: value.committed_tokens, hourly_committed_microusd: completedCost,
      monthly_committed_microusd: completedCost,
      reservations: value.reservations.map(item => ({id: item.id, tokens: item.tokens, microusd: reservationMicrousd}))};
  }
  const fields = ['schema_version', 'window_start_ms', 'month_start_ms', 'calls', 'committed_tokens',
    'hourly_committed_microusd', 'monthly_committed_microusd', 'reservations'];
  if (value.schema_version !== SCHEMA || !exactKeys(value, fields) ||
      !Number.isSafeInteger(value.window_start_ms) || value.window_start_ms < 0 ||
      !Number.isSafeInteger(value.month_start_ms) || value.month_start_ms < 0 ||
      !Number.isSafeInteger(value.calls) || value.calls < 0 ||
      !Number.isSafeInteger(value.committed_tokens) || value.committed_tokens < 0 ||
      !Number.isSafeInteger(value.hourly_committed_microusd) || value.hourly_committed_microusd < 0 ||
      !Number.isSafeInteger(value.monthly_committed_microusd) || value.monthly_committed_microusd < 0 ||
      !Array.isArray(value.reservations) || value.reservations.some(item => !item || typeof item !== 'object' ||
        !exactKeys(item, ['id', 'tokens', 'microusd']) || !/^[a-f0-9-]{36}$/.test(item.id) ||
        !Number.isSafeInteger(item.tokens) || item.tokens < 1 ||
        !Number.isSafeInteger(item.microusd) || item.microusd < 1) ||
      new Set(value.reservations.map(item => item.id)).size !== value.reservations.length) {
    throw new Error('broker-quota-state-invalid');
  }
  return {schema_version: SCHEMA, window_start_ms: value.window_start_ms, calls: value.calls,
    month_start_ms: value.month_start_ms, committed_tokens: value.committed_tokens,
    hourly_committed_microusd: value.hourly_committed_microusd,
    monthly_committed_microusd: value.monthly_committed_microusd,
    reservations: value.reservations.map(item => ({id: item.id, tokens: item.tokens, microusd: item.microusd}))};
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
  maximumInputTokens = 34_800, maximumOutputTokens = 2_048,
  maximumHourlyMicrousd, maximumMonthlyMicrousd,
  inputMicrousdPerMillionTokens, outputMicrousdPerMillionTokens,
} = {}) {
  const path = resolve(statePath);
  if (typeof now !== 'function' || !path.endsWith('.json')) throw new Error('broker-quota-config-invalid');
  integer(maximumActive, 1, 128, 'active');
  integer(maximumCalls, 1, 100_000, 'calls');
  integer(maximumTokens, 1, 1_000_000_000, 'tokens');
  integer(reservationTokens, 1, maximumTokens, 'reservation');
  integer(maximumInputTokens, 1, 34_800, 'maximum-input-tokens');
  integer(maximumOutputTokens, 1, 2_048, 'maximum-output-tokens');
  if (maximumInputTokens + maximumOutputTokens > reservationTokens) throw new Error('broker-quota-reservation-invalid');
  integer(maximumHourlyMicrousd, 1, 1_000_000_000_000, 'hourly-microusd');
  integer(maximumMonthlyMicrousd, 1, 1_000_000_000_000, 'monthly-microusd');
  integer(inputMicrousdPerMillionTokens, 1, 1_000_000_000, 'input-rate');
  integer(outputMicrousdPerMillionTokens, 1, 1_000_000_000, 'output-rate');
  const usageCost = (inputTokens, outputTokens) => {
    const numerator = inputTokens * inputMicrousdPerMillionTokens + outputTokens * outputMicrousdPerMillionTokens;
    if (!Number.isSafeInteger(numerator)) throw new Error('broker-quota-cost-overflow');
    return Math.ceil(numerator / RATE_DENOMINATOR);
  };
  const reservationMicrousd = usageCost(maximumInputTokens, maximumOutputTokens);
  if (reservationMicrousd > maximumHourlyMicrousd || reservationMicrousd > maximumMonthlyMicrousd) {
    throw new Error('broker-quota-monetary-reservation-invalid');
  }
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
    let migrated = false;
    try {
      const parsed = JSON.parse(await readFile(path, 'utf8'));
      migrated = parsed?.schema_version === PREVIOUS_SCHEMA;
      candidate = normalize(parsed, reservationMicrousd);
    }
    catch (error) {
      if (error?.code !== 'ENOENT') throw new Error('broker-quota-unavailable');
      candidate = fresh(now());
      await persist(candidate);
      return;
    }
    if (candidate.reservations.length > 0) {
      candidate.committed_tokens += candidate.reservations.reduce((sum, item) => sum + item.tokens, 0);
      const abandonedCost = candidate.reservations.reduce((sum, item) => sum + item.microusd, 0);
      candidate.hourly_committed_microusd += abandonedCost;
      candidate.monthly_committed_microusd += abandonedCost;
      candidate.reservations = [];
      await persist(candidate);
    } else if (migrated) await persist(candidate);
    else state = candidate;
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
      const timestamp = integer(now(), 0, 8_640_000_000_000_000, 'clock');
      if (current.reservations.length === 0) {
        if (monthStart(timestamp) > current.month_start_ms) {
          current.month_start_ms = monthStart(timestamp);
          current.monthly_committed_microusd = 0;
        }
        if (timestamp - current.window_start_ms >= WINDOW_MS) {
          current.window_start_ms = Math.floor(timestamp / WINDOW_MS) * WINDOW_MS;
          current.calls = 0;
          current.committed_tokens = 0;
          current.hourly_committed_microusd = 0;
        }
      }
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
        const reservedMicrousd = current.reservations.reduce((sum, item) => sum + item.microusd, 0);
        if (current.hourly_committed_microusd + reservedMicrousd + reservationMicrousd > maximumHourlyMicrousd) {
          throw new Error('broker-hourly-spend-limit');
        }
        if (current.monthly_committed_microusd + reservedMicrousd + reservationMicrousd > maximumMonthlyMicrousd) {
          throw new Error('broker-monthly-spend-limit');
        }
        const id = randomUUID();
        const next = structuredClone(current);
        next.calls += 1;
        next.reservations.push({id, tokens: reservationTokens, microusd: reservationMicrousd});
        let settled = false;
        return {next, value: {
          async complete(usage) {
            if (settled) return Promise.reject(new Error('broker-quota-lease-settled'));
            settled = true;
            let chargedTokens = reservationTokens, chargedMicrousd = reservationMicrousd;
            if (usage !== undefined) {
              if (!usage || typeof usage !== 'object' || Array.isArray(usage) || !exactKeys(usage, ['inputTokens', 'outputTokens'])) {
                throw new Error('broker-quota-usage-invalid');
              }
              const inputTokens = integer(usage.inputTokens, 0, maximumInputTokens, 'input-usage');
              const outputTokens = integer(usage.outputTokens, 0, maximumOutputTokens, 'output-usage');
              chargedTokens = inputTokens + outputTokens;
              chargedMicrousd = usageCost(inputTokens, outputTokens);
            }
            return transaction(live => {
              const reservation = live.reservations.find(item => item.id === id);
              if (!reservation) throw new Error('broker-quota-unavailable');
              const completed = structuredClone(live);
              completed.reservations = completed.reservations.filter(item => item.id !== id);
              completed.committed_tokens += chargedTokens;
              completed.hourly_committed_microusd += chargedMicrousd;
              completed.monthly_committed_microusd += chargedMicrousd;
              return {next: completed, value: undefined};
            });
          },
        }};
      });
    },
  };
}
