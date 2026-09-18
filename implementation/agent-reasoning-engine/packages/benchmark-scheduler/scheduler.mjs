import { mkdir, readFile, writeFile, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

const canonical = value => JSON.stringify(value, (_, v) => v && typeof v === 'object' && !Array.isArray(v)
  ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
const integer = n => Number.isSafeInteger(n) && n >= 0;
const digest = value => createHash('sha256').update(canonical(value)).digest('hex');

export function validateManifest(manifest) {
  if (!manifest || typeof manifest.id !== 'string' || !manifest.id.trim() || !integer(manifest.token_budget)
      || !Array.isArray(manifest.jobs) || !manifest.jobs.length) throw new Error('Invalid manifest');
  // Reject values JSON would silently discard or alter before hashing the protocol.
  function json(value) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
    if (typeof value === 'number' && Number.isFinite(value)) return;
    if (!value || typeof value !== 'object' || (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype)) throw new Error('Manifest must contain JSON values');
    for (const child of Object.values(value)) json(child);
  }
  json(manifest);
  const jobs = new Map();
  for (const job of manifest.jobs) {
    if (!job || typeof job.id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(job.id)
        || jobs.has(job.id) || !integer(job.reservation_tokens) || job.reservation_tokens === 0
        || !Array.isArray(job.depends_on) || new Set(job.depends_on).size !== job.depends_on.length
        || (job.after !== undefined && (!Array.isArray(job.after) || new Set(job.after).size !== job.after.length))) throw new Error('Invalid or duplicate job');
    jobs.set(job.id, job);
  }
  const seen = new Set(), visiting = new Set();
  function visit(id) {
    if (!jobs.has(id)) throw new Error(`Unknown dependency: ${id}`);
    if (visiting.has(id)) throw new Error('Dependency cycle');
    if (seen.has(id)) return;
    visiting.add(id);
    for (const dep of [...jobs.get(id).depends_on, ...(jobs.get(id).after ?? [])]) visit(dep);
    visiting.delete(id); seen.add(id);
  }
  for (const id of jobs.keys()) visit(id);
  return digest(manifest);
}
function validUsage(usage) {
  return usage && integer(usage.prompt_tokens) && integer(usage.completion_tokens)
    && integer(usage.total_tokens) && usage.prompt_tokens + usage.completion_tokens === usage.total_tokens;
}
async function atomic(path, value) {
  const temp = `${path}.${randomUUID()}.tmp`;
  await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
  await rename(temp, path);
}

/** No implicit retries. Unknown attempts retain their full reservation on resume.
 * A lock left by a killed process requires operator verification/removal; never stolen.
 */
export async function runScheduler({ directory, manifest, execute, concurrency = 2 }) {
  const manifestHash = validateManifest(manifest);
  if (!directory || typeof execute !== 'function' || !Number.isSafeInteger(concurrency) || concurrency < 1) throw new Error('Invalid scheduler options');
  // Detach caller-owned objects so an executor cannot mutate the frozen protocol.
  manifest = JSON.parse(JSON.stringify(manifest));
  await mkdir(directory, { recursive: true });
  const lock = join(directory, '.scheduler-lock');
  try { await mkdir(lock); } catch (error) {
    if (error.code === 'EEXIST') throw new Error('Scheduler lock exists; verify the owner before explicit recovery');
    throw error;
  }
  const checkpoint = join(directory, 'checkpoint.json');
  const running = new Map();
  try {
    await writeFile(join(lock, 'owner.json'), JSON.stringify({ pid: process.pid, started_at: new Date().toISOString() }));
    let state;
    try { state = JSON.parse(await readFile(checkpoint, 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    let frozen;
    try { frozen = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (frozen && validateManifest(frozen) !== manifestHash) throw new Error('Manifest differs from frozen manifest');
    if (state) {
      if (state.manifest_hash !== manifestHash) throw new Error('Manifest differs from frozen checkpoint');
      if (state.version !== 1 || !state.jobs || Object.keys(state.jobs).length !== manifest.jobs.length
          || !Number.isSafeInteger(state.concurrency) || state.concurrency < 1
          || manifest.jobs.some(j => !Object.hasOwn(state.jobs, j.id))) throw new Error('Invalid checkpoint');
      for (const job of manifest.jobs) {
        const record = state.jobs[job.id];
        if (!['pending', 'running', 'completed', 'failed', 'unknown', 'blocked', 'budget_blocked'].includes(record.status)
            || (record.usage !== undefined && !validUsage(record.usage))
            || (record.status === 'completed' && (!validUsage(record.usage) || record.result === undefined))
            || (['pending', 'running', 'unknown', 'blocked', 'budget_blocked'].includes(record.status) && record.usage !== undefined)) {
          throw new Error(`Invalid checkpoint record: ${job.id}`);
        }
        if (record.usage?.total_tokens > job.reservation_tokens) state.halt_reason = `Reservation exceeded by ${job.id}`;
        if (record.status === 'running') { record.status = 'unknown'; record.error = 'Interrupted attempt: usage unknown'; }
      }
      state.concurrency = Math.min(concurrency, state.concurrency);
    } else {
      await atomic(join(directory, 'manifest.json'), manifest);
      state = { version: 1, manifest_hash: manifestHash, concurrency, halt_reason: null,
        jobs: Object.fromEntries(manifest.jobs.map(j => [j.id, { status: 'pending' }])) };
    }
    const totals = () => {
      let known_tokens = 0, unknown_reserved_tokens = 0, running_reserved_tokens = 0;
      for (const job of manifest.jobs) {
        const r = state.jobs[job.id];
        if (r.usage) known_tokens += r.usage.total_tokens;
        else if (r.status === 'running') running_reserved_tokens += job.reservation_tokens;
        else if (r.status === 'unknown' || r.status === 'failed') unknown_reserved_tokens += job.reservation_tokens;
      }
      return { known_tokens, unknown_reserved_tokens, running_reserved_tokens,
        accounted_tokens: known_tokens + unknown_reserved_tokens + running_reserved_tokens };
    };
    const save = async () => { state.accounting = totals(); await atomic(checkpoint, state); };
    await save();
    // All checkpoint mutations occur on this single coordinator, never inside workers.
    while (true) {
      for (const job of manifest.jobs) {
        const r = state.jobs[job.id];
        if (r.status !== 'pending') continue;
        if (job.depends_on.some(dep => ['failed', 'unknown', 'blocked', 'budget_blocked'].includes(state.jobs[dep].status))) {
          r.status = 'blocked'; r.error = 'Dependency did not complete';
        }
      }
      if (!state.halt_reason) {
        for (const job of manifest.jobs) {
          if (running.size >= state.concurrency) break;
          const r = state.jobs[job.id];
          if (r.status !== 'pending' || !job.depends_on.every(dep => state.jobs[dep].status === 'completed')) continue;
          if (!(job.after ?? []).every(dep => !['pending', 'running'].includes(state.jobs[dep].status))) continue;
          if (totals().accounted_tokens + job.reservation_tokens > manifest.token_budget) continue;
          Object.assign(r, { status: 'running', attempt_id: randomUUID(), started_at: new Date().toISOString() });
          await save(); // Persist reservation and attempt identity before external effects.
          const dependencies = Object.fromEntries(job.depends_on.map(id => [id, structuredClone(state.jobs[id].result)]));
          const promise = Promise.resolve().then(() => execute(structuredClone(job), { dependencies, attempt_id: r.attempt_id }))
            .then(result => ({ id: job.id, result }), error => ({ id: job.id, error }));
          running.set(job.id, promise);
        }
      }
      if (!running.size) {
        // Propagate transitive blocked dependencies to a fixed point.
        let changed;
        do {
          changed = false;
          for (const job of manifest.jobs) {
            const r = state.jobs[job.id];
            if (r.status === 'pending' && job.depends_on.some(dep => ['failed', 'unknown', 'blocked', 'budget_blocked'].includes(state.jobs[dep].status))) {
              r.status = 'blocked'; r.error = 'Dependency did not complete'; changed = true;
            }
          }
        } while (changed);
        const unaffordable = manifest.jobs.filter(job => state.jobs[job.id].status === 'pending'
            && (state.halt_reason || (totals().accounted_tokens + job.reservation_tokens > manifest.token_budget
              && job.depends_on.every(dep => state.jobs[dep].status === 'completed')
              && (job.after ?? []).every(dep => !['pending', 'running'].includes(state.jobs[dep].status)))));
        for (const job of unaffordable) {
          state.jobs[job.id].status = 'budget_blocked';
          state.jobs[job.id].error = state.halt_reason ?? 'Insufficient shared token budget';
        }
        await save();
        if (Object.values(state.jobs).some(r => r.status === 'pending')) continue;
        break;
      }
      const outcome = await Promise.race(running.values());
      running.delete(outcome.id);
      const r = state.jobs[outcome.id];
      const job = manifest.jobs.find(j => j.id === outcome.id);
      const usage = outcome.error?.receipt?.usage ?? outcome.result?.usage;
      const valid = validUsage(usage);
      r.status = outcome.error ? 'failed' : valid ? 'completed' : 'unknown';
      if (valid) r.usage = structuredClone(usage);
      if (outcome.error) r.error = String(outcome.error.message ?? outcome.error);
      else if (!valid) r.error = 'Missing or invalid token usage';
      if (outcome.result !== undefined) r.result = outcome.result;
      r.finished_at = new Date().toISOString();
      const code = String(outcome.error?.receipt?.error_code ?? outcome.error?.receipt?.status ?? '');
      if (['1302', '1305', '429'].includes(code)) {
        state.concurrency = Math.max(1, Math.floor(state.concurrency / 2));
        r.rate_limit_code = code;
      }
      if (valid && usage.total_tokens > job.reservation_tokens) state.halt_reason = `Reservation exceeded by ${job.id}`;
      await atomic(join(directory, `${job.id}.result.json`), r);
      await save();
    }
    return structuredClone(state);
  } finally {
    // A coordinator I/O failure must never release ownership while provider effects run.
    await Promise.allSettled(running.values());
    await rm(lock, { recursive: true, force: true });
  }
}
