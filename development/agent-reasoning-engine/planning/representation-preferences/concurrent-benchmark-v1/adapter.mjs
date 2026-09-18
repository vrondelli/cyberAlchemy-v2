import { createProvider } from '../benchmark-pilot-v2/execution/selectivity-v2/provider.mjs';
import { chunkHistory, ingestionMessages, answerMessages } from '../benchmark-pilot-v2/execution/longmemeval-sequential-v2/chunks.mjs';
import { prepareHistory, recordNotes } from '../benchmark-pilot-v2/execution/longmemeval-sequential-v2/ledger.mjs';
import { readFileSync } from 'node:fs';
import { resolve, isAbsolute, relative } from 'node:path';
import { createHash } from 'node:crypto';

const zero = () => ({ prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });
const validUsage = u => Number.isSafeInteger(u?.prompt_tokens) && u.prompt_tokens >= 0 && Number.isSafeInteger(u?.completion_tokens) && u.completion_tokens >= 0 && u.total_tokens === u.prompt_tokens + u.completion_tokens;
const fail = message => { throw Error(message); };

export function verifySourceBindings(manifest, root = resolve(import.meta.dirname, '../../../../..')) {
  if (manifest.source_bindings === undefined) return { verified: 0 };
  if (!Array.isArray(manifest.source_bindings) || !manifest.source_bindings.length) fail('invalid source bindings');
  const seen = new Set();
  for (const binding of manifest.source_bindings) {
    if (!binding || typeof binding.path !== 'string' || isAbsolute(binding.path) || !/^[a-f0-9]{64}$/.test(binding.sha256)) fail('invalid source binding');
    const path = resolve(root, binding.path), rel = relative(root, path);
    if (!rel || rel.startsWith('..') || isAbsolute(rel) || seen.has(path)) fail('invalid source binding path');
    seen.add(path);
    if (createHash('sha256').update(readFileSync(path)).digest('hex') !== binding.sha256) fail('source binding changed: ' + binding.path);
  }
  return { verified: seen.size };
}

/** Each execution consumes only its explicitly declared predecessor. No mutable notes are shared. */
export function createGlmExecutor({ directory, credential, provider = createProvider({ directory, credential }) } = {}) {
  return async (job, { dependencies = {}, attempt_id }) => {
    let modelStarted = false, receipt;
    try {
      if (!Number.isSafeInteger(job.input_cap) || job.input_cap < 1 || job.input_cap > 7168 || !Number.isSafeInteger(job.output_cap) || job.output_cap < 1 || job.input_cap + job.output_cap > 8192 || job.reservation_tokens < job.input_cap + job.output_cap) fail('invalid adapter reservation');
      const ids = job.depends_on ?? [];
      if (ids.length > 1 || (job.kind === 'static' && ids.length)) fail('invalid note dependencies');
      const parent = job.note_parent;
      if (parent && !ids.includes(parent)) fail('undeclared note predecessor');
      const prior = parent ? dependencies[parent]?.output : undefined;
      if (parent && (!prior || typeof prior.text !== 'string')) fail('missing predecessor notes');
      let messages;
      if (job.kind === 'static') messages = job.messages;
      else if (job.kind === 'ingestion') messages = ingestionMessages(job.chunk, job.arm, prior?.text ?? '');
      else if (job.kind === 'answer') messages = answerMessages(job.query, prior?.text ?? '');
      else fail('unsupported job kind');
      if (!Array.isArray(messages) || !messages.length || messages.some(m => !['system', 'user', 'assistant'].includes(m.role) || typeof m.content !== 'string')) fail('invalid messages');
      const measured = await provider.tokenize(attempt_id + '-admission', messages);
      const count = measured.usage?.prompt_tokens;
      if (!Number.isSafeInteger(count) || count < 0 || count > job.input_cap || count + job.output_cap > 8192) fail('actual input exceeds reserved admission');
      modelStarted = true;
      receipt = await provider.generate(attempt_id, messages, job.output_cap);
      if (!validUsage(receipt.usage)) fail('unknown generation usage');
      if (receipt.usage.prompt_tokens > job.input_cap || receipt.usage.completion_tokens > job.output_cap) fail('actual usage exceeds reservation');
      if (typeof receipt.output !== 'string' || !receipt.output.trim() || receipt.finish_reason !== 'stop') fail('incomplete output');
      const output = { text: receipt.output, kind: job.kind };
      if (job.kind === 'ingestion' && job.arm === 'treatment') {
        const claims = prior?.claims ?? [];
        const claim = recordNotes({ prepared: job.ledger, notes: receipt.output, step: job.step + 1, prior_claims: claims });
        output.claims = [...claims, claim];
      }
      if (job.expected_output !== undefined) output.expected_match = receipt.output.trim() === job.expected_output;
      return { usage: receipt.usage, output, receipt, admission: { input_tokens: count } };
    } catch (error) {
      const providerReceipt = error.receipt ?? receipt;
      error.model_started = modelStarted;
      error.receipt = modelStarted ? providerReceipt : { ...providerReceipt, kind: 'pre-model', usage: zero(), failure: String(error.message), model_started: false };
      if (!modelStarted) error.usage = zero();
      throw error;
    }
  };
}

/** Original infrastructure probe, not a scored benchmark or a reserved evaluation. */
export function buildSmokeManifest({ id = 'glm-concurrency-smoke', count = 4, token_budget = 2048 } = {}) {
  if (!Number.isSafeInteger(count) || count < 1 || count > 32) fail('invalid smoke count');
  return { id, token_budget, protocol: 'infrastructure-smoke-v1', jobs: Array.from({ length: count }, (_, i) => ({
    id: 'smoke-' + (i + 1), depends_on: [], reservation_tokens: 512, input_cap: 128, output_cap: 384, kind: 'static', expected_output: 'READY',
    messages: [{ role: 'user', content: 'Reply with exactly READY and no other text.' }],
  })) };
}

/** Uses the frozen pilot's complete-source chunking and ledger. Caller must freeze this new experiment. */
export function buildLongMemManifest({ id, rows, repetitions = 2, arms = ['control', 'treatment'], chunk_limit = 14000, input_cap = 7168, note_output_cap = 384, answer_output_cap = 1024, token_budget, preflight }) {
  if (!Array.isArray(rows) || !rows.length || !Number.isSafeInteger(repetitions) || repetitions < 1 || !arms.length || new Set(arms).size !== arms.length || arms.some(a => !['control', 'treatment'].includes(a))) fail('invalid experiment selection');
  const jobs = [], source_manifests = [];
  for (const [index, row] of rows.entries()) {
    if (row.split !== 'development') fail('reserved tasks require a separate evaluation protocol');
    const ledger = prepareHistory(row), partition = chunkHistory(row, chunk_limit);
    source_manifests.push({ task_id: row.task_id, source_manifest_sha256: ledger.evidence.source_manifest_sha256, source_digest: partition.source_digest, unit_count: partition.unit_count });
    let orderedPrevious;
    for (let repetition = 1; repetition <= repetitions; repetition++) for (const arm of repetition % 2 ? arms : [...arms].reverse()) {
      let previous;
      partition.chunks.forEach((chunk, step) => {
        const jobId = `task-${index}-r${repetition}-${arm}-ingestion-${step}`;
        jobs.push({ id: jobId, task_id: row.task_id, repetition, arm, kind: 'ingestion', step, chunk, ...(arm === 'treatment' ? { ledger } : {}), depends_on: previous ? [previous] : [], after: !previous && orderedPrevious ? [orderedPrevious] : [], note_parent: previous ?? null, input_cap, output_cap: note_output_cap, reservation_tokens: input_cap + note_output_cap });
        previous = jobId;
      });
      jobs.push({ id: `task-${index}-r${repetition}-${arm}-answer`, task_id: row.task_id, repetition, arm, kind: 'answer', query: { question: row.question, question_date: row.question_date }, depends_on: [previous], note_parent: previous, input_cap, output_cap: answer_output_cap, reservation_tokens: input_cap + answer_output_cap });
      orderedPrevious = jobs.at(-1).id;
    }
  }
  if (preflight) {
    if (!preflight.admitted || !Array.isArray(preflight.calls)) fail('preflight not admitted');
    for (const job of jobs) {
      const reservation = preflight.calls.find(c => c.task_id === job.task_id && c.phase === job.kind && (job.kind === 'answer' || c.arm === job.arm && c.chunk === job.step));
      if (!reservation) fail('missing frozen reservation');
      job.input_cap = reservation.input_tokens + reservation.carried_notes_reservation;
      job.output_cap = reservation.output_reserve;
      job.reservation_tokens = job.input_cap + job.output_cap;
    }
  }
  return { id, token_budget, protocol: 'longmemeval-sequential-concurrent-v1', source_manifests, jobs };
}
