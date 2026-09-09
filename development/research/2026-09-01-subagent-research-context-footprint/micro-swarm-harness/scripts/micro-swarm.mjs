#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CARD_VERSION = 'cav2.micro-swarm-claim-card.v1';
const MANIFEST_VERSION = 'cav2.micro-swarm-manifest.v1';
const DECISION_VERSION = 'cav2.micro-swarm-judge-decision.v1';
const TERMINAL_DISPOSITIONS = new Set([
  'support', 'contradict', 'defer', 'kill', 'failed', 'timed_out',
]);
const PROOF_STATUSES = new Set([
  'observed', 'executed', 'derived', 'unverified', 'failed',
]);
const VERDICTS = new Set(['ACCEPT', 'REJECT', 'REVISE', 'NOT_EVALUABLE']);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function validateManifest(manifest) {
  invariant(manifest?.schema_version === MANIFEST_VERSION,
    `manifest schema_version must be ${MANIFEST_VERSION}`);
  invariant(typeof manifest.experiment_id === 'string' && manifest.experiment_id,
    'manifest experiment_id is required');
  invariant(typeof manifest.objective === 'string' && manifest.objective,
    'manifest objective is required');
  invariant(Number.isInteger(manifest.deadline_ms) && manifest.deadline_ms > 0 &&
    manifest.deadline_ms <= 300000, 'manifest deadline_ms must be 1..300000');
  invariant(Array.isArray(manifest.tasks) && manifest.tasks.length > 0,
    'manifest tasks must be non-empty');

  const seen = new Set();
  for (const task of manifest.tasks) {
    invariant(/^MAP-[0-9]{3,}$/.test(task.task_id),
      `invalid task_id ${task.task_id}`);
    invariant(!seen.has(task.task_id), `duplicate task_id ${task.task_id}`);
    seen.add(task.task_id);
    for (const key of ['strategy_result_id', 'claim_id', 'lane', 'question', 'attack']) {
      invariant(typeof task[key] === 'string' && task[key],
        `${task.task_id} missing ${key}`);
    }
    invariant(Array.isArray(task.allowed_sources) && task.allowed_sources.length > 0,
      `${task.task_id} requires allowed_sources`);
    for (const source of task.allowed_sources) {
      invariant(typeof source.source_ref === 'string' && source.source_ref,
        `${task.task_id} source_ref is required`);
      invariant(typeof source.selector === 'string' && source.selector,
        `${task.task_id} selector is required`);
      if (source.sha256 !== undefined) {
        invariant(/^[a-f0-9]{64}$/.test(source.sha256),
          `${task.task_id} has invalid source sha256`);
      }
    }
    invariant(Number.isInteger(task.max_output_tokens) && task.max_output_tokens > 0 &&
      task.max_output_tokens <= 1000,
    `${task.task_id} max_output_tokens must be 1..1000`);
    invariant(Number.isInteger(task.timeout_ms) && task.timeout_ms > 0 &&
      task.timeout_ms <= manifest.deadline_ms,
    `${task.task_id} timeout_ms exceeds the experiment deadline`);
    invariant(typeof task.mandatory === 'boolean', `${task.task_id} mandatory is required`);
  }
  return manifest;
}

function allowedEvidenceKey(evidence) {
  return `${evidence.source_ref}\u0000${evidence.selector}\u0000${evidence.sha256 ?? ''}`;
}

export function validateCard(card, task) {
  invariant(card?.schema_version === CARD_VERSION,
    `${task.task_id} card schema_version must be ${CARD_VERSION}`);
  invariant(card.task_id === task.task_id, `${task.task_id} card task_id mismatch`);
  invariant(card.strategy_result_id === task.strategy_result_id,
    `${task.task_id} strategy_result_id mismatch`);
  invariant(card.claim_id === task.claim_id, `${task.task_id} claim_id mismatch`);
  invariant(typeof card.statement === 'string', `${task.task_id} statement is required`);
  invariant(Array.isArray(card.evidence), `${task.task_id} evidence must be an array`);
  invariant(PROOF_STATUSES.has(card.proof_status), `${task.task_id} invalid proof_status`);
  invariant(TERMINAL_DISPOSITIONS.has(card.disposition),
    `${task.task_id} invalid disposition`);
  invariant(Number.isFinite(card.confidence) && card.confidence >= 0 && card.confidence <= 1,
    `${task.task_id} confidence must be 0..1`);
  invariant(Array.isArray(card.conflicts), `${task.task_id} conflicts must be an array`);
  invariant(Array.isArray(card.non_claims), `${task.task_id} non_claims must be an array`);
  invariant(Number.isFinite(card.elapsed_ms) && card.elapsed_ms >= 0,
    `${task.task_id} elapsed_ms must be non-negative`);

  const isFailure = card.disposition === 'failed' || card.disposition === 'timed_out';
  if (!isFailure) invariant(card.evidence.length > 0,
    `${task.task_id} successful card requires evidence`);
  const allowed = new Set(task.allowed_sources.map(allowedEvidenceKey));
  for (const evidence of card.evidence) {
    invariant(typeof evidence.source_ref === 'string' && evidence.source_ref,
      `${task.task_id} evidence source_ref is required`);
    invariant(typeof evidence.selector === 'string' && evidence.selector,
      `${task.task_id} evidence selector is required`);
    invariant(allowed.has(allowedEvidenceKey(evidence)),
      `${task.task_id} evidence is outside its allowed source boundary`);
  }
  return card;
}

export function promptEnvelope(manifest, task) {
  const fixedTask = {
    task_id: task.task_id,
    strategy_result_id: task.strategy_result_id,
    claim_id: task.claim_id,
    lane: task.lane,
    question: task.question,
    attack: task.attack,
    allowed_sources: task.allowed_sources,
    output_schema: CARD_VERSION,
    max_output_tokens: task.max_output_tokens,
  };
  return {
    schema_version: 'cav2.micro-swarm-prompt-envelope.v1',
    experiment_id: manifest.experiment_id,
    task_id: task.task_id,
    prompt_sha256: sha256(stableJson(fixedTask)),
    system: [
      'You are one stateless atomic research explorer.',
      'Answer only the assigned question and return one JSON claim card.',
      'Use only the allowed sources and selectors.',
      'Preserve counterevidence, uncertainty, and non-claims.',
      'Do not synthesize other tasks or introduce new claim IDs.',
    ].join(' '),
    task: fixedTask,
  };
}

export function prepare(manifest) {
  validateManifest(manifest);
  return manifest.tasks.map((task) => promptEnvelope(manifest, task));
}

function flattenCardDocuments(documents) {
  return documents.flatMap((document) => Array.isArray(document) ? document : [document]);
}

export function reduceCards(manifest, documents, runReceipt = null) {
  validateManifest(manifest);
  const cards = flattenCardDocuments(documents);
  const taskById = new Map(manifest.tasks.map((task) => [task.task_id, task]));
  const cardByTask = new Map();
  const unexpected = [];
  const duplicates = [];

  for (const card of cards) {
    const task = taskById.get(card.task_id);
    if (!task) {
      unexpected.push(card.task_id ?? null);
      continue;
    }
    if (cardByTask.has(card.task_id)) {
      duplicates.push(card.task_id);
      continue;
    }
    validateCard(card, task);
    cardByTask.set(card.task_id, card);
  }

  invariant(unexpected.length === 0, `unexpected task cards: ${unexpected.join(', ')}`);
  invariant(duplicates.length === 0, `duplicate task cards: ${duplicates.join(', ')}`);
  const missing = manifest.tasks.filter((task) => !cardByTask.has(task.task_id));
  const missingMandatory = missing.filter((task) => task.mandatory);
  invariant(missingMandatory.length === 0,
    `missing mandatory task cards: ${missingMandatory.map((task) => task.task_id).join(', ')}`);

  const claims = new Map();
  for (const task of manifest.tasks) {
    const card = cardByTask.get(task.task_id);
    if (!card) continue;
    if (!claims.has(card.claim_id)) {
      claims.set(card.claim_id, {
        claim_id: card.claim_id,
        variants: [],
        dispositions: {},
        strategy_result_ids: [],
        evidence: [],
        non_claims: [],
        conflicts: [],
      });
    }
    const reduced = claims.get(card.claim_id);
    reduced.variants.push({
      task_id: card.task_id,
      statement: card.statement,
      proof_status: card.proof_status,
      disposition: card.disposition,
      confidence: card.confidence,
    });
    reduced.dispositions[card.disposition] =
      (reduced.dispositions[card.disposition] ?? 0) + 1;
    reduced.strategy_result_ids.push(card.strategy_result_id);
    reduced.evidence.push(...card.evidence.map((item) => ({...item, task_id: card.task_id})));
    reduced.non_claims.push(...card.non_claims);
    reduced.conflicts.push(...card.conflicts);
  }

  for (const claim of claims.values()) {
    claim.variants.sort((a, b) => a.task_id.localeCompare(b.task_id));
    claim.strategy_result_ids = [...new Set(claim.strategy_result_ids)].sort();
    claim.evidence = [...new Map(claim.evidence.map((item) =>
      [`${item.task_id}\u0000${allowedEvidenceKey(item)}`, item])).values()];
    claim.non_claims = [...new Set(claim.non_claims)].sort();
    claim.conflicts = [...new Set(claim.conflicts)].sort();
  }

  const receivedTasks = [...cardByTask.keys()].sort();
  const failedTasks = cards.filter((card) =>
    card.disposition === 'failed' || card.disposition === 'timed_out')
    .map((card) => card.task_id).sort();
  return {
    schema_version: 'cav2.micro-swarm-reduction.v1',
    experiment_id: manifest.experiment_id,
    manifest_sha256: sha256(stableJson(manifest)),
    coverage: {
      expected: manifest.tasks.length,
      received: receivedTasks.length,
      received_task_ids: receivedTasks,
      missing_optional_task_ids: missing.map((task) => task.task_id).sort(),
      failed_task_ids: failedTasks,
      complete: missing.length === 0 && failedTasks.length === 0,
    },
    timing: {
      deadline_ms: manifest.deadline_ms,
      exploration_wall_ms: runReceipt?.wall_elapsed_ms ??
        Math.max(0, ...cards.map((card) => card.elapsed_ms)),
      timing_source: runReceipt ? 'run-receipt' : 'maximum-card-elapsed-control-estimate',
    },
    claims: [...claims.values()].sort((a, b) => a.claim_id.localeCompare(b.claim_id)),
  };
}

export function buildJudgePacket(reduced) {
  invariant(reduced?.schema_version === 'cav2.micro-swarm-reduction.v1',
    'judge packet requires a reduction v1 document');
  return {
    schema_version: 'cav2.micro-swarm-judge-packet.v1',
    experiment_id: reduced.experiment_id,
    reduction_sha256: sha256(stableJson(reduced)),
    judge_contract: {
      role: 'judge-only',
      allowed_verdicts: [...VERDICTS],
      introduce_new_claims: false,
      requirements: [
        'Decide every supplied claim_id exactly once.',
        'Reference only supplied task variants.',
        'Preserve conflicts and non-claims.',
        'Do not perform new research or write final narrative prose.',
      ],
    },
    coverage: reduced.coverage,
    claims: reduced.claims,
  };
}

export function validateDecision(reduced, decision) {
  invariant(decision?.schema_version === DECISION_VERSION,
    `decision schema_version must be ${DECISION_VERSION}`);
  invariant(decision.experiment_id === reduced.experiment_id,
    'decision experiment_id mismatch');
  invariant(decision.judge_role === 'judge-only', 'decision judge_role must be judge-only');
  invariant(decision.introduces_new_claims === false,
    'judge decision may not introduce new claims');
  invariant(Array.isArray(decision.decisions), 'decision decisions must be an array');
  invariant(Number.isFinite(decision.elapsed_ms) && decision.elapsed_ms >= 0,
    'decision elapsed_ms must be non-negative');

  const claimById = new Map(reduced.claims.map((claim) => [claim.claim_id, claim]));
  const seen = new Set();
  for (const row of decision.decisions) {
    invariant(claimById.has(row.claim_id), `judge invented claim ${row.claim_id}`);
    invariant(!seen.has(row.claim_id), `duplicate judge decision ${row.claim_id}`);
    seen.add(row.claim_id);
    invariant(VERDICTS.has(row.verdict), `invalid verdict for ${row.claim_id}`);
    invariant(typeof row.reason === 'string' && row.reason,
      `judge reason required for ${row.claim_id}`);
    invariant(Array.isArray(row.accepted_task_ids),
      `accepted_task_ids required for ${row.claim_id}`);
    const available = new Set(claimById.get(row.claim_id).variants.map((item) => item.task_id));
    for (const taskId of row.accepted_task_ids) {
      invariant(available.has(taskId),
        `${row.claim_id} references unavailable task variant ${taskId}`);
    }
    if (row.verdict === 'ACCEPT') invariant(row.accepted_task_ids.length > 0,
      `${row.claim_id} ACCEPT requires an accepted task variant`);
  }
  const missing = [...claimById.keys()].filter((claimId) => !seen.has(claimId));
  invariant(missing.length === 0, `missing judge decisions: ${missing.join(', ')}`);
  return decision;
}

export function renderFindings(reduced, decision) {
  validateDecision(reduced, decision);
  const decisionById = new Map(decision.decisions.map((row) => [row.claim_id, row]));
  const lines = [
    '# Micro-Swarm Findings',
    '',
    `Experiment: \`${reduced.experiment_id}\``,
    `Coverage: ${reduced.coverage.received}/${reduced.coverage.expected} tasks; complete=${reduced.coverage.complete}.`,
    '',
    '## Accepted claims',
    '',
  ];
  let acceptedCount = 0;
  for (const claim of reduced.claims) {
    const row = decisionById.get(claim.claim_id);
    if (row.verdict !== 'ACCEPT') continue;
    acceptedCount += 1;
    const variants = new Map(claim.variants.map((variant) => [variant.task_id, variant]));
    for (const taskId of row.accepted_task_ids) {
      const variant = variants.get(taskId);
      lines.push(`- **${claim.claim_id}** (${taskId}): ${variant.statement}`);
    }
    for (const nonClaim of claim.non_claims) lines.push(`  - Non-claim: ${nonClaim}`);
  }
  if (acceptedCount === 0) lines.push('- None.');

  lines.push('', '## Judge matrix', '', '| Claim | Verdict | Reason |', '| --- | --- | --- |');
  for (const claim of reduced.claims) {
    const row = decisionById.get(claim.claim_id);
    lines.push(`| ${claim.claim_id} | ${row.verdict} | ${row.reason.replaceAll('|', '\\|')} |`);
  }
  const totalElapsed = reduced.timing.exploration_wall_ms + decision.elapsed_ms;
  const deadlinePass = reduced.coverage.complete && totalElapsed <= reduced.timing.deadline_ms;
  lines.push(
    '',
    '## Deadline assessment',
    '',
    `- Exploration wall time: ${reduced.timing.exploration_wall_ms} ms (${reduced.timing.timing_source}).`,
    `- Judge time: ${decision.elapsed_ms} ms.`,
    `- Accounted time: ${totalElapsed} ms of ${reduced.timing.deadline_ms} ms.`,
    `- Result: **${deadlinePass ? 'PASS' : 'FAIL'}**.`,
    '',
    'This control report is experiment evidence only and makes no quality-parity, serving, admission, or deployment claim.',
    '',
  );
  return { markdown: lines.join('\n'), deadlinePass, totalElapsed };
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function writeText(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, value);
}

async function loadCardDocuments(directory) {
  const names = (await readdir(directory)).filter((name) =>
    name.endsWith('.json') && !name.startsWith('_')).sort();
  return Promise.all(names.map((name) => readJson(path.join(directory, name))));
}

function parseArgs(argv) {
  const command = argv[0];
  const options = {};
  for (let index = 1; index < argv.length; index += 1) {
    const arg = argv[index];
    invariant(arg.startsWith('--'), `unexpected argument ${arg}`);
    const key = arg.slice(2);
    const value = argv[++index];
    invariant(value !== undefined, `missing value for --${key}`);
    options[key] = value;
  }
  return { command, options };
}

function required(options, key) {
  invariant(options[key], `--${key} is required`);
  return options[key];
}

async function runOneTask({ manifest, task, baseUrl, model, apiKey, globalStartedAt }) {
  const envelope = promptEnvelope(manifest, task);
  const elapsedGlobal = Date.now() - globalStartedAt;
  const remaining = manifest.deadline_ms - elapsedGlobal;
  if (remaining <= 0) return failureCard(task, 'timed_out', 0, 'global deadline reached');
  const timeoutMs = Math.min(task.timeout_ms, remaining);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const headers = {'content-type': 'application/json'};
    if (apiKey) headers.authorization = `Bearer ${apiKey}`;
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/v1/chat/completions`, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: task.max_output_tokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: envelope.system },
          { role: 'user', content: JSON.stringify(envelope.task) },
        ],
      }),
    });
    invariant(response.ok, `${task.task_id} server returned HTTP ${response.status}`);
    const body = await response.json();
    const content = body?.choices?.[0]?.message?.content;
    invariant(typeof content === 'string' && content, `${task.task_id} response content missing`);
    const card = JSON.parse(content);
    card.elapsed_ms = Date.now() - startedAt;
    return validateCard(card, task);
  } catch (error) {
    const timedOut = error?.name === 'AbortError';
    return failureCard(task, timedOut ? 'timed_out' : 'failed',
      Date.now() - startedAt, timedOut ? 'task timeout' : String(error.message ?? error));
  } finally {
    clearTimeout(timeout);
  }
}

function failureCard(task, disposition, elapsedMs, message) {
  return {
    schema_version: CARD_VERSION,
    task_id: task.task_id,
    strategy_result_id: task.strategy_result_id,
    claim_id: task.claim_id,
    statement: message.slice(0, 500),
    evidence: [],
    proof_status: 'failed',
    disposition,
    confidence: 0,
    conflicts: [],
    non_claims: ['Failure residue is not research evidence.'],
    elapsed_ms: elapsedMs,
  };
}

export async function runManifest(manifest, options) {
  validateManifest(manifest);
  const cardsDir = required(options, 'cards');
  const baseUrl = required(options, 'base-url');
  const model = required(options, 'model');
  const concurrency = Number(options.concurrency ?? 8);
  invariant(Number.isInteger(concurrency) && concurrency > 0 && concurrency <= 64,
    '--concurrency must be an integer from 1 to 64');
  await mkdir(cardsDir, { recursive: true });
  const startedAt = Date.now();
  let cursor = 0;
  const results = [];
  async function worker() {
    while (cursor < manifest.tasks.length) {
      const index = cursor++;
      const task = manifest.tasks[index];
      const card = await runOneTask({
        manifest,
        task,
        baseUrl,
        model,
        apiKey: process.env.OPENAI_API_KEY,
        globalStartedAt: startedAt,
      });
      results[index] = card;
      await writeText(path.join(cardsDir, `${task.task_id}.json`),
        `${JSON.stringify(card, null, 2)}\n`);
    }
  }
  await Promise.all(Array.from({length: Math.min(concurrency, manifest.tasks.length)}, worker));
  const receipt = {
    schema_version: 'cav2.micro-swarm-run-receipt.v1',
    experiment_id: manifest.experiment_id,
    model,
    base_url_origin: new URL(baseUrl).origin,
    manifest_sha256: sha256(stableJson(manifest)),
    concurrency,
    task_count: manifest.tasks.length,
    wall_elapsed_ms: Date.now() - startedAt,
    deadline_ms: manifest.deadline_ms,
    completed_by_deadline: results.every((card) =>
      card.disposition !== 'failed' && card.disposition !== 'timed_out') &&
      Date.now() - startedAt <= manifest.deadline_ms,
  };
  await writeText(path.join(cardsDir, '_run-receipt.json'),
    `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

async function main(argv) {
  const {command, options} = parseArgs(argv);
  if (command === 'prepare') {
    const manifest = await readJson(required(options, 'manifest'));
    const output = required(options, 'output');
    await writeText(output, `${prepare(manifest).map(JSON.stringify).join('\n')}\n`);
    console.log(`PASS prepare tasks=${manifest.tasks.length} output=${output}`);
    return;
  }
  if (command === 'run') {
    const manifest = await readJson(required(options, 'manifest'));
    const receipt = await runManifest(manifest, options);
    console.log(`${receipt.completed_by_deadline ? 'PASS' : 'FAIL'} run wall_ms=${receipt.wall_elapsed_ms}`);
    if (!receipt.completed_by_deadline) process.exitCode = 2;
    return;
  }
  if (command === 'validate-cards' || command === 'reduce') {
    const manifest = await readJson(required(options, 'manifest'));
    const cardsDir = required(options, 'cards');
    const documents = await loadCardDocuments(cardsDir);
    let runReceipt = null;
    try { runReceipt = await readJson(path.join(cardsDir, '_run-receipt.json')); } catch {}
    const reduced = reduceCards(manifest, documents, runReceipt);
    if (command === 'validate-cards') {
      console.log(`PASS validate-cards received=${reduced.coverage.received} complete=${reduced.coverage.complete}`);
      return;
    }
    const output = required(options, 'output');
    await writeText(output, `${JSON.stringify(reduced, null, 2)}\n`);
    console.log(`PASS reduce claims=${reduced.claims.length} output=${output}`);
    return;
  }
  if (command === 'judge-packet') {
    const reduced = await readJson(required(options, 'reduced'));
    const output = required(options, 'output');
    await writeText(output, `${JSON.stringify(buildJudgePacket(reduced), null, 2)}\n`);
    console.log(`PASS judge-packet claims=${reduced.claims.length} output=${output}`);
    return;
  }
  if (command === 'finalize') {
    const reduced = await readJson(required(options, 'reduced'));
    const decision = await readJson(required(options, 'decision'));
    const output = required(options, 'output');
    const result = renderFindings(reduced, decision);
    await writeText(output, result.markdown);
    console.log(`${result.deadlinePass ? 'PASS' : 'FAIL'} finalize accounted_ms=${result.totalElapsed} output=${output}`);
    if (!result.deadlinePass) process.exitCode = 2;
    return;
  }
  throw new Error('command must be prepare, run, validate-cards, reduce, judge-packet, or finalize');
}

const isDirect = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirect) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(`BLOCK ${error.message}`);
    process.exitCode = 1;
  });
}
