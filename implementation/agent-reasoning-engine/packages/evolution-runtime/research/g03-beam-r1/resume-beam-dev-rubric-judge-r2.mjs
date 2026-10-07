// New, separately frozen continuation of the r1 exposed multi-step judge run.
// It reinterprets one already-sealed string score, then makes only remaining calls.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const need = (condition, reason) => {
  if (!condition) throw Error(`g03-beam-dev-rubric-judge-resume-r2.${reason}`);
};
const [wirePath, wireSha, helperPath, helperSha, priorRunnerPath,
  priorRunnerSha, priorRoot, root] = process.argv.slice(2);
need(process.argv.length === 10 &&
  [wirePath, helperPath, priorRunnerPath, priorRoot, root].every(path =>
    /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+$/.test(path ?? '') &&
    !path.includes('/../')) &&
  [wireSha, helperSha, priorRunnerSha].every(value =>
    /^[a-f0-9]{64}$/.test(value ?? '')), 'arguments');
const PRIOR_FREEZE_SHA =
  '0ce427eada9444103e20f091e8cd5991c3eac8766225abcf7199db112545c607';
const PRIOR_PREFLIGHT_SHA =
  'd88563bc970597508c87563a977b99f1793a2d7e0c55fac6402bd1843c0ab8d6';
const PRIOR_RESULT_SHA =
  '595c027ef6013f2e913c74eb5d66974e658256d7a0eb79c7beb8317e0d5e0edb';
const [wireBytes, helperBytes, priorRunnerBytes, priorFreezeBytes,
  priorPreflightBytes, priorResultBytes] = await Promise.all([
  readFile(wirePath), readFile(helperPath), readFile(priorRunnerPath),
  readFile(`${priorRoot}/FREEZE.json`),
  readFile(`${priorRoot}/PREFLIGHT.json`),
  readFile(`${priorRoot}/RUN-RESULT.json`)]);
need(sha(wireBytes) === wireSha && sha(helperBytes) === helperSha &&
  sha(priorRunnerBytes) === priorRunnerSha &&
  sha(priorFreezeBytes) === PRIOR_FREEZE_SHA &&
  sha(priorPreflightBytes) === PRIOR_PREFLIGHT_SHA &&
  sha(priorResultBytes) === PRIOR_RESULT_SHA, 'pinned-input-drift');
const wire = JSON.parse(wireBytes);
const priorFreeze = JSON.parse(priorFreezeBytes);
const priorPreflight = JSON.parse(priorPreflightBytes);
const priorResult = JSON.parse(priorResultBytes);
const source = priorRunnerBytes.toString('utf8');
need(source.includes('const JUDGE_PROMPT = `') &&
  source.split('const JUDGE_PROMPT = `').length === 2, 'prior-prompt-source');
const prompt = source.split('const JUDGE_PROMPT = `')[1].split('`;')[0];
need(typeof prompt === 'string' && prompt.length > 3000 &&
  sha(prompt) === priorFreeze.prompt_sha256, 'prior-prompt-binding');
need(wire.schema_version === 'are.g03-beam-dev-rubric-judge-wires-r2/v1' &&
  wire.judge_variant === 'official-content-whitespace-normalized-glm' &&
  wire.judge_wires === 38 && wire.maximum_generation_calls === 76 &&
  wire.reserved_conversations === 16 &&
  wire.heldout_evaluator_values_accessed_in_code === false &&
  priorFreeze.wire_sha256 === wireSha &&
  priorFreeze.helper_sha256 === helperSha &&
  priorFreeze.runner_sha256 === priorRunnerSha &&
  priorFreeze.maximum_generation_calls === 76 &&
  priorPreflight.status === 'passed' &&
  priorPreflight.freeze_sha256 === PRIOR_FREEZE_SHA &&
  priorPreflight.tokenizer_requests === 38 &&
  priorPreflight.rows.every(row => row.admitted_8k) &&
  priorResult.status === 'terminal-incomplete' &&
  priorResult.wire_sha256 === wireSha &&
  priorResult.freeze_sha256 === PRIOR_FREEZE_SHA &&
  priorResult.preflight_sha256 === PRIOR_PREFLIGHT_SHA &&
  priorResult.attempted === 22 && priorResult.valid === 21 &&
  priorResult.automatic_retries === 0, 'prior-run-boundary');

function normalizeScore(value) {
  if (typeof value === 'number')
    return [0, 0.5, 1].includes(value) ? value : null;
  if (typeof value !== 'string' ||
      !/^(?:0(?:\.0+)?|0\.5(?:0+)?|1(?:\.0+)?)$/.test(value.trim()))
    return null;
  const number = Number(value.trim());
  return [0, 0.5, 1].includes(number) ? number : null;
}
const requests = wire.wires.map(row => {
  need(sha(row.answer) === row.answer_sha256 &&
    sha(row.rubric_item) === row.rubric_item_sha256, 'wire-item-drift');
  const content = prompt.replace('<rubric_item>', row.rubric_item)
    .replace('<llm_response>', row.answer);
  need(!content.includes('<rubric_item>') &&
    !content.includes('<llm_response>'), 'request-binding');
  return {blind_id: row.blind_id, request: {
    model: 'glm-5.3-flash', messages: [{role: 'user', content}],
    max_tokens: 256, reasoning_effort: 'low',
    thinking: {type: 'enabled'}, stream: false}};
});
need(new Set(requests.map(row => row.blind_id)).size === 38 &&
  priorFreeze.ordered_blind_ids.join('\0') ===
    requests.map(row => row.blind_id).join('\0'), 'request-order');
const schedule = [...requests.map((entry, index) => ({
  entry, repeat: 1, ordinal: index + 1})),
  ...[...requests].reverse().map((entry, index) => ({
    entry, repeat: 2, ordinal: 39 + index}))];
const rows = [];
for (const task of schedule.slice(0, 22)) {
  const row = priorResult.rows[task.ordinal - 1];
  const rawBytes = await readFile(`${priorRoot}/ATTEMPT-${String(task.ordinal).padStart(2, '0')}.json`);
  const raw = JSON.parse(rawBytes);
  const answer = raw.response?.payload?.choices?.[0]?.message?.content;
  let parsed = null;
  try {parsed = JSON.parse(answer);} catch { /* invalid prior response */ }
  const score = normalizeScore(parsed?.score);
  const usage = raw.response?.payload?.usage;
  const body = JSON.stringify(task.entry.request);
  need(row.ordinal === task.ordinal && row.repeat === 1 &&
    row.blind_id === task.entry.blind_id &&
    raw.ordinal === task.ordinal && raw.repeat === 1 &&
    raw.blind_id === task.entry.blind_id &&
    raw.request_sha256 === sha(body) &&
    sha(rawBytes) === row.raw_sha256 && raw.response.status === 200 &&
    Number.isSafeInteger(usage?.prompt_tokens) &&
    Number.isSafeInteger(usage?.completion_tokens) &&
    usage.prompt_tokens + usage.completion_tokens <= 8192 &&
    usage.completion_tokens <= 256 &&
    raw.response.payload.choices[0].finish_reason !== 'length' &&
    score !== null && typeof parsed.reason === 'string' &&
    parsed.reason.trim() &&
    (task.ordinal < 22 ? row.valid && row.score === score :
      !row.valid && row.score === null && parsed.score === '0.0'),
    'prior-attempt-reconciliation');
  rows.push({repeat: 1, ordinal: task.ordinal,
    blind_id: task.entry.blind_id, valid: true, score,
    score_was_numeric_string: typeof parsed.score === 'string',
    prompt_tokens: usage.prompt_tokens,
    completion_tokens: usage.completion_tokens,
    raw_sha256: sha(rawBytes), raw_origin: 'retained-r1'});
}
need(rows.length === 22 && rows[21].score_was_numeric_string,
  'repair-scope');
const {createVpsLocalPost, verifyHen11VpsTopology} =
  await import(pathToFileURL(helperPath).href);
const topology = verifyHen11VpsTopology();
const post = createVpsLocalPost();
await mkdir(root);
const freeze = {
  schema_version: 'are.g03-beam-dev-rubric-judge-resume-freeze-r2/v1',
  status: 'frozen-before-new-provider-requests',
  wire_sha256: wireSha, helper_sha256: helperSha,
  prior_runner_sha256: priorRunnerSha,
  prior_freeze_sha256: PRIOR_FREEZE_SHA,
  prior_preflight_sha256: PRIOR_PREFLIGHT_SHA,
  prior_result_sha256: PRIOR_RESULT_SHA,
  runner_sha256: sha(await readFile(new URL(import.meta.url))),
  prompt_sha256: sha(prompt),
  prior_calls_reconciled: 22, prior_calls_reinterpreted: 1,
  new_call_ceiling: 54, total_call_ceiling: 76,
  parser_rule: 'number-or-decimal-string-for-exact-0-0.5-1',
  automatic_retries: 0, context_window_tokens: 8192,
  max_tokens: 256, heldout_evaluator_values_accessed_in_code: false,
};
const freezeBytes = Buffer.from(`${JSON.stringify(freeze, null, 2)}\n`);
await writeFile(`${root}/FREEZE.json`, freezeBytes,
  {flag: 'wx', mode: 0o600});
const endpoint = new URL('https://api.z.ai/api/paas/v4/chat/completions');
let newCalls = 0;
for (const task of schedule.slice(22)) {
  const body = JSON.stringify(task.entry.request);
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
  const raw = {schema_version: 'are.g03-beam-dev-rubric-judge-resume-attempt-r2/v1',
    repeat: task.repeat, ordinal: task.ordinal,
    blind_id: task.entry.blind_id,
    request_sha256: sha(body), elapsed_ms: Date.now() - started,
    response};
  const rawBytes = Buffer.from(`${JSON.stringify(raw, null, 2)}\n`);
  await writeFile(`${root}/ATTEMPT-${String(task.ordinal).padStart(2, '0')}.json`,
    rawBytes, {flag: 'wx', mode: 0o600});
  newCalls++;
  const answer = response.payload?.choices?.[0]?.message?.content;
  let parsed = null;
  try {parsed = JSON.parse(answer);} catch { /* invalid judge output */ }
  const score = normalizeScore(parsed?.score);
  const usage = response.payload?.usage;
  const promptTokens = usage?.prompt_tokens;
  const completionTokens = usage?.completion_tokens;
  const finishReason = response.payload?.choices?.[0]?.finish_reason;
  const valid = response.status === 200 &&
    Number.isSafeInteger(promptTokens) && promptTokens > 0 &&
    Number.isSafeInteger(completionTokens) && completionTokens > 0 &&
    completionTokens <= 256 && promptTokens + completionTokens <= 8192 &&
    finishReason !== 'length' && score !== null &&
    typeof parsed?.reason === 'string' && parsed.reason.trim();
  rows.push({repeat: task.repeat, ordinal: task.ordinal,
    blind_id: task.entry.blind_id, valid: Boolean(valid),
    score: valid ? score : null,
    score_was_numeric_string: valid && typeof parsed.score === 'string',
    prompt_tokens: Number.isSafeInteger(promptTokens) ? promptTokens : null,
    completion_tokens: Number.isSafeInteger(completionTokens) ?
      completionTokens : null,
    raw_sha256: sha(rawBytes), raw_origin: 'new-r2',
    status: response.status, finish_reason: finishReason ?? null});
  if (!valid) break;
}
const result = {
  schema_version: 'are.g03-beam-dev-rubric-judge-resume-result-r2/v1',
  status: rows.length === 76 && rows.every(row => row.valid) ?
    'completed-calibration' : 'terminal-incomplete',
  wire_sha256: wireSha, freeze_sha256: sha(freezeBytes),
  prior_result_sha256: PRIOR_RESULT_SHA,
  attempted_total: rows.length, valid_total: rows.filter(row => row.valid).length,
  prior_calls_reused: 22, prior_calls_reinterpreted: 1,
  new_calls: newCalls, automatic_retries: 0,
  known_prompt_tokens: rows.reduce((sum, row) => sum +
    (row.prompt_tokens ?? 0), 0),
  known_completion_tokens: rows.reduce((sum, row) => sum +
    (row.completion_tokens ?? 0), 0),
  rows,
  claim_ceiling: 'Adapted judge calibration on four exposed multi-step cases with archived comparator; no holdout, native BEAM score, or superiority',
};
const resultBytes = Buffer.from(`${JSON.stringify(result, null, 2)}\n`);
await writeFile(`${root}/RUN-RESULT.json`, resultBytes,
  {flag: 'wx', mode: 0o600});
process.stdout.write(`${JSON.stringify({status: result.status,
  attempted_total: result.attempted_total,
  valid_total: result.valid_total, new_calls: result.new_calls,
  prior_calls_reinterpreted: result.prior_calls_reinterpreted,
  known_prompt_tokens: result.known_prompt_tokens,
  known_completion_tokens: result.known_completion_tokens,
  result_sha256: sha(resultBytes)})}\n`);
if (result.status !== 'completed-calibration') process.exitCode = 2;
