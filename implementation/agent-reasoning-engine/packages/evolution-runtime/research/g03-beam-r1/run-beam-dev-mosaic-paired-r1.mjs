// Exact 8K tokenizer admission, then zero-retry paired BEAM development answers.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const need = (value, reason) => { if (!value) throw Error(`g03-beam-mosaic-paired-r1.${reason}`); };
const [wirePath, wireSha, helperPath, helperSha, root] = process.argv.slice(2);
need(process.argv.length === 7 &&
  [wirePath, helperPath, root].every(path =>
    /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+$/.test(path ?? '') &&
    !path.includes('/../')) &&
  wirePath.endsWith('.json') && helperPath.endsWith('.mjs') &&
  [wireSha, helperSha].every(value => /^[a-f0-9]{64}$/.test(value ?? '')),
  'arguments');
const [wireBytes, helperBytes] = await Promise.all([
  readFile(wirePath), readFile(helperPath)]);
need(sha(wireBytes) === wireSha && sha(helperBytes) === helperSha,
  'input-drift');
const wire = JSON.parse(wireBytes);
need(wire.schema_version === 'are.g03-beam-dev-mosaic-paired-wires-r1/v1' &&
  wire.status === 'source-only-development-wires-not-token-qualified' &&
  wire.evaluator_fields_read === false && wire.wires.length === 8 &&
  wire.context_window_tokens === 8192 &&
  wire.answer_output_reserve_tokens === 1024 &&
  wire.maximum_generation_calls === 8 && wire.automatic_retries === 0 &&
  wire.wires.every(row => row.request?.model === 'glm-5.3-flash' &&
    Array.isArray(row.request.messages) && row.request.messages.length === 2 &&
    row.request.max_tokens === 1024 &&
    row.request.reasoning_effort === 'low' &&
    row.request.thinking?.type === 'enabled' &&
    row.request.stream === false &&
    ['mosaic', 'bm25'].includes(row.arm)), 'wire-boundary');
const {createVpsLocalPost, verifyHen11VpsTopology} =
  await import(pathToFileURL(helperPath).href);
const topology = verifyHen11VpsTopology();
const post = createVpsLocalPost();
await mkdir(root);
const selfSha = sha(await readFile(new URL(import.meta.url)));
const freeze = {
  schema_version: 'are.g03-beam-dev-mosaic-paired-run-freeze-r1/v1',
  status: 'frozen-before-provider-requests',
  wire_sha256: wireSha, helper_sha256: helperSha,
  runner_sha256: selfSha,
  ordered_pairs: wire.wires.map(row => [row.probe_id, row.arm]),
  model: 'glm-5.3-flash', context_window_tokens: 8192,
  answer_output_reserve_tokens: 1024, maximum_generation_calls: 8,
  automatic_retries: 0,
  failure_policy: 'preserve-attempt-and-stop-without-retry-or-substitution',
  evaluator_fields_read: false,
  claim_ceiling: 'Four exposed development pairs only; no native score, holdout, or superiority',
};
const freezeBytes = Buffer.from(`${JSON.stringify(freeze, null, 2)}\n`);
await writeFile(`${root}/FREEZE.json`, freezeBytes, {flag: 'wx', mode: 0o600});
const tokenizerEndpoint = new URL('https://api.z.ai/api/paas/v4/tokenizer');
const tokenizerRows = [];
for (const [index, entry] of wire.wires.entries()) {
  const body = JSON.stringify({model: entry.request.model,
    messages: entry.request.messages});
  const started = Date.now();
  let status = null, promptTokens = null, errorCode = null;
  try {
    const response = await post(tokenizerEndpoint, body,
      {apiKey: 'container-owned-marker', timeout_ms: 30000,
        maximum_response_bytes: 65536});
    status = response.status;
    const count = response.payload?.usage?.prompt_tokens;
    if (status === 200 && Number.isSafeInteger(count) && count > 0) {
      promptTokens = count;
    } else {
      const code = String(response.payload?.error?.code ??
        response.payload?.code ?? 'invalid-response');
      errorCode = /^[A-Za-z0-9_.-]{1,40}$/.test(code) ? code : 'invalid-code';
    }
  } catch (error) {
    const code = String(error?.code ?? 'transport-error');
    errorCode = /^[A-Za-z0-9_.-]{1,40}$/.test(code) ? code : 'transport-error';
  }
  const row = {ordinal: index + 1, probe_id: entry.probe_id, arm: entry.arm,
    request_sha256: sha(body), status, prompt_tokens: promptTokens,
    admitted_8k: promptTokens !== null && promptTokens + 1024 <= 8192,
    elapsed_ms: Date.now() - started,
    ...(errorCode ? {error_code: errorCode} : {})};
  tokenizerRows.push(row);
  await writeFile(`${root}/TOKENIZER-${String(index + 1).padStart(2, '0')}.json`,
    `${JSON.stringify(row, null, 2)}\n`, {flag: 'wx', mode: 0o600});
  if (!row.admitted_8k) break;
}
const preflight = {
  schema_version: 'are.g03-beam-dev-mosaic-paired-preflight-r1/v1',
  status: tokenizerRows.length === 8 &&
    tokenizerRows.every(row => row.admitted_8k) ? 'passed' : 'not-qualified',
  freeze_sha256: sha(freezeBytes), wire_sha256: wireSha,
  helper_sha256: helperSha,
  provider_host_fingerprint_sha256: topology.host_fingerprint_sha256,
  tokenizer_requests: tokenizerRows.length, generation_calls: 0,
  rows: tokenizerRows,
};
const preflightBytes = Buffer.from(`${JSON.stringify(preflight, null, 2)}\n`);
await writeFile(`${root}/PREFLIGHT.json`, preflightBytes,
  {flag: 'wx', mode: 0o600});
if (preflight.status !== 'passed') {
  process.stdout.write(`${JSON.stringify({status: preflight.status,
    tokenizer_requests: tokenizerRows.length,
    preflight_sha256: sha(preflightBytes), generation_calls: 0})}\n`);
  process.exit(2);
}
const generationFreeze = {
  schema_version: 'are.g03-beam-dev-mosaic-paired-generation-freeze-r1/v1',
  status: 'frozen-after-tokenizer-before-generation',
  freeze_sha256: sha(freezeBytes), preflight_sha256: sha(preflightBytes),
  ordered_pairs: freeze.ordered_pairs, maximum_generation_calls: 8,
  max_tokens: 1024, automatic_retries: 0, evaluator_fields_read: false,
};
const generationFreezeBytes = Buffer.from(
  `${JSON.stringify(generationFreeze, null, 2)}\n`);
await writeFile(`${root}/GENERATION-FREEZE.json`, generationFreezeBytes,
  {flag: 'wx', mode: 0o600});
const generationEndpoint = new URL(
  'https://api.z.ai/api/paas/v4/chat/completions');
const rows = [];
for (const [index, entry] of wire.wires.entries()) {
  const body = JSON.stringify(entry.request);
  const started = Date.now();
  let response;
  try {
    const delivered = await post(generationEndpoint, body,
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
  const raw = {schema_version: 'are.g03-beam-dev-mosaic-paired-attempt-r1/v1',
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
  const valid = response.status === 200 &&
    typeof answer === 'string' && answer.trim().length > 0 &&
    Number.isSafeInteger(promptTokens) && promptTokens > 0 &&
    Number.isSafeInteger(completionTokens) && completionTokens > 0 &&
    completionTokens <= 1024 && promptTokens + completionTokens <= 8192 &&
    finishReason !== 'length';
  rows.push({ordinal: index + 1, probe_id: entry.probe_id, arm: entry.arm,
    status: response.status, valid, finish_reason: finishReason ?? null,
    prompt_tokens: Number.isSafeInteger(promptTokens) ? promptTokens : null,
    completion_tokens: Number.isSafeInteger(completionTokens) ? completionTokens : null,
    reasoning_tokens: Number.isSafeInteger(reasoningTokens) ? reasoningTokens : null,
    answer_sha256: valid ? sha(answer) : null,
    raw_sha256: sha(rawBytes), elapsed_ms: raw.elapsed_ms});
  if (!valid) break;
}
const result = {
  schema_version: 'are.g03-beam-dev-mosaic-paired-result-r1/v1',
  status: rows.length === 8 && rows.every(row => row.valid) ?
    'completed-eight-development-answers' : 'terminal-incomplete',
  wire_sha256: wireSha, freeze_sha256: sha(freezeBytes),
  preflight_sha256: sha(preflightBytes),
  generation_freeze_sha256: sha(generationFreezeBytes),
  provider_host_fingerprint_sha256: topology.host_fingerprint_sha256,
  attempted: rows.length, valid: rows.filter(row => row.valid).length,
  automatic_retries: 0, evaluator_fields_read: false,
  known_prompt_tokens: rows.reduce((sum, row) =>
    sum + (row.prompt_tokens ?? 0), 0),
  known_completion_tokens: rows.reduce((sum, row) =>
    sum + (row.completion_tokens ?? 0), 0),
  known_reasoning_tokens: rows.reduce((sum, row) =>
    sum + (row.reasoning_tokens ?? 0), 0),
  rows,
  claim_ceiling: 'Exposed development paired answer generation only; no native score, holdout, or superiority',
};
const resultBytes = Buffer.from(`${JSON.stringify(result, null, 2)}\n`);
await writeFile(`${root}/RUN-RESULT.json`, resultBytes,
  {flag: 'wx', mode: 0o600});
process.stdout.write(`${JSON.stringify({status: result.status,
  attempted: result.attempted, valid: result.valid,
  known_prompt_tokens: result.known_prompt_tokens,
  known_completion_tokens: result.known_completion_tokens,
  preflight_sha256: sha(preflightBytes),
  result_sha256: sha(resultBytes)})}\n`);
if (result.status !== 'completed-eight-development-answers') process.exitCode = 2;
