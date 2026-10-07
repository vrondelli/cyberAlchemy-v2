// Zero-retry matched GLM answers for 12 already exposed BEAM 500K IE probes.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const need = (value, reason) => {
  if (!value) throw Error(`g03-beam-500k-ie-answer-pilot-r1.${reason}`);
};
const [wirePath, wireSha, preflightPath, preflightSha, helperPath,
  helperSha, root] = process.argv.slice(2);
const validPath = (path, extension = '') =>
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+$/.test(path ?? '') &&
  !path.includes('/../') && (!extension || path.endsWith(extension));
need(process.argv.length === 9, 'argument-count');
need(validPath(wirePath, '.json'), 'wire-path');
need(validPath(preflightPath, '.json'), 'preflight-path');
need(validPath(helperPath, '.mjs'), 'helper-path');
need(validPath(root), 'root-path');
need(/^[a-f0-9]{64}$/.test(wireSha ?? ''), 'wire-hash-argument');
need(/^[a-f0-9]{64}$/.test(preflightSha ?? ''), 'preflight-hash-argument');
need(/^[a-f0-9]{64}$/.test(helperSha ?? ''), 'helper-hash-argument');
const [wireBytes, preflightBytes, helperBytes] = await Promise.all([
  readFile(wirePath), readFile(preflightPath), readFile(helperPath)]);
need(sha(wireBytes) === wireSha && sha(preflightBytes) === preflightSha &&
  sha(helperBytes) === helperSha, 'input-drift');
const wire = JSON.parse(wireBytes), preflight = JSON.parse(preflightBytes);
need(wire.schema_version === 'are.g03-beam-500k-dev-ie-answer-pilot-wires/v1' &&
  wire.status === 'source-only-development-wires-not-token-qualified' &&
  wire.evaluator_fields_read === false && wire.wires.length === 24 &&
  wire.maximum_generation_calls === 24 && wire.automatic_retries === 0 &&
  preflight.schema_version === 'are.g03-beam-500k-ie-answer-pilot-preflight/v1' &&
  preflight.status === 'passed-24-development-wires' &&
  preflight.wire_sha256 === wireSha && preflight.helper_sha256 === helperSha &&
  preflight.generation_calls === 0 && preflight.rows.length === 24 &&
  preflight.provider_requests === 24, 'sealed-inputs');
const pairs = new Map();
for (const [index, entry] of wire.wires.entries()) {
  const pre = preflight.rows[index];
  const tokenizerBody = JSON.stringify({model: entry.request.model,
    messages: entry.request.messages});
  need(entry.request.model === 'glm-5.3-flash' &&
    entry.request.max_tokens === 512 &&
    entry.request.reasoning_effort === 'low' &&
    entry.request.thinking?.type === 'enabled' &&
    entry.request.stream === false &&
    sha(JSON.stringify(entry.request)) === entry.request_sha256 &&
    pre.ordinal === index + 1 && pre.probe_id === entry.probe_id &&
    pre.arm === entry.arm && pre.tokenizer_request_sha256 === sha(tokenizerBody) &&
    pre.admitted_8k === true && pre.prompt_tokens + 512 <= 8192,
    'wire-preflight-binding');
  need(['treatment', 'control'].includes(entry.arm), 'arm');
  if (!pairs.has(entry.probe_id)) pairs.set(entry.probe_id, new Set());
  pairs.get(entry.probe_id).add(entry.arm);
}
need(pairs.size === 12 && [...pairs.values()].every(arms =>
  arms.size === 2 && arms.has('treatment') && arms.has('control')),
  'matched-pairs');
const {createVpsLocalPost, verifyHen11VpsTopology} =
  await import(pathToFileURL(helperPath).href);
const topology = verifyHen11VpsTopology();
await mkdir(root);
const freeze = {
  schema_version: 'are.g03-beam-500k-ie-answer-pilot-freeze-r1/v1',
  status: 'frozen-before-development-generation',
  wire_sha256: wireSha, tokenizer_preflight_sha256: preflightSha,
  helper_sha256: helperSha,
  runner_sha256: sha(await readFile(new URL(import.meta.url))),
  model: 'glm-5.3-flash',
  generation_endpoint: 'https://api.z.ai/api/paas/v4/chat/completions',
  ordered_wires: wire.wires.map(row => ({probe_id: row.probe_id,
    arm: row.arm, request_sha256: row.request_sha256})),
  maximum_generation_calls: 24, max_tokens: 512,
  context_window_tokens: 8192, automatic_retries: 0,
  failure_policy: 'preserve-attempt-and-stop-without-retry-or-substitution',
  evaluator_fields_read: false,
  claim_ceiling: 'Matched exposed-development answers only; no native score, holdout, or superiority'
};
const freezeBytes = Buffer.from(`${JSON.stringify(freeze, null, 2)}\n`);
await writeFile(`${root}/FREEZE.json`, freezeBytes,
  {flag: 'wx', mode: 0o600});
const post = createVpsLocalPost();
const endpoint = new URL(freeze.generation_endpoint);
const rows = [];
for (const [index, entry] of wire.wires.entries()) {
  const body = JSON.stringify(entry.request);
  const started = Date.now();
  let response;
  try {
    const delivered = await post(endpoint, body,
      {apiKey: 'container-owned-marker', timeout_ms: 120000,
        maximum_response_bytes: 262144});
    response = {status: delivered.status, payload: delivered.payload,
      bytes: delivered.bytes};
  } catch (error) {
    const code = String(error?.code ?? 'transport-error');
    response = {status: null, payload: null, bytes: null,
      transport_error_code: /^[A-Za-z0-9_.-]{1,40}$/.test(code) ?
        code : 'transport-error'};
  }
  const raw = {schema_version: 'are.g03-beam-500k-ie-answer-pilot-attempt-r1/v1',
    ordinal: index + 1, probe_id: entry.probe_id, arm: entry.arm,
    request_sha256: sha(body), elapsed_ms: Date.now() - started, response};
  const rawBytes = Buffer.from(`${JSON.stringify(raw, null, 2)}\n`);
  await writeFile(`${root}/ATTEMPT-${String(index + 1).padStart(2, '0')}.json`,
    rawBytes, {flag: 'wx', mode: 0o600});
  const answer = response.payload?.choices?.[0]?.message?.content;
  const usage = response.payload?.usage;
  const promptTokens = usage?.prompt_tokens;
  const completionTokens = usage?.completion_tokens;
  const reasoningTokens = usage?.completion_tokens_details?.reasoning_tokens;
  const finishReason = response.payload?.choices?.[0]?.finish_reason;
  const valid = response.status === 200 && typeof answer === 'string' &&
    answer.trim().length > 0 && Number.isSafeInteger(promptTokens) &&
    promptTokens > 0 && Number.isSafeInteger(completionTokens) &&
    completionTokens > 0 && completionTokens <= 512 &&
    promptTokens + completionTokens <= 8192 && finishReason !== 'length';
  rows.push({ordinal: index + 1, probe_id: entry.probe_id, arm: entry.arm,
    status: response.status, valid, finish_reason: finishReason ?? null,
    prompt_tokens: Number.isSafeInteger(promptTokens) ? promptTokens : null,
    completion_tokens: Number.isSafeInteger(completionTokens) ? completionTokens : null,
    reasoning_tokens: Number.isSafeInteger(reasoningTokens) ? reasoningTokens : null,
    answer_sha256: valid ? sha(answer) : null,
    raw_sha256: sha(rawBytes), elapsed_ms: raw.elapsed_ms});
  if (!valid) break;
}
const summary = {
  schema_version: 'are.g03-beam-500k-ie-answer-pilot-result-r1/v1',
  status: rows.length === 24 && rows.every(row => row.valid) ?
    'completed-24-development-answers' : 'terminal-incomplete',
  freeze_sha256: sha(freezeBytes), wire_sha256: wireSha,
  tokenizer_preflight_sha256: preflightSha,
  provider_host_fingerprint_sha256: topology.host_fingerprint_sha256,
  attempted: rows.length, valid: rows.filter(row => row.valid).length,
  automatic_retries: 0, evaluator_fields_read: false,
  known_prompt_tokens: rows.reduce((sum, row) => sum + (row.prompt_tokens ?? 0), 0),
  known_completion_tokens: rows.reduce((sum, row) => sum + (row.completion_tokens ?? 0), 0),
  known_reasoning_tokens: rows.reduce((sum, row) => sum + (row.reasoning_tokens ?? 0), 0),
  rows,
  claim_ceiling: 'Matched exposed-development answers only; no native score, holdout, or superiority'
};
const summaryBytes = Buffer.from(`${JSON.stringify(summary, null, 2)}\n`);
await writeFile(`${root}/RUN-RESULT.json`, summaryBytes,
  {flag: 'wx', mode: 0o600});
process.stdout.write(`${JSON.stringify({status: summary.status,
  attempted: summary.attempted, valid: summary.valid,
  known_completion_tokens: summary.known_completion_tokens,
  freeze_sha256: summary.freeze_sha256,
  result_sha256: sha(summaryBytes)})}\n`);
if (summary.status !== 'completed-24-development-answers') process.exitCode = 2;
