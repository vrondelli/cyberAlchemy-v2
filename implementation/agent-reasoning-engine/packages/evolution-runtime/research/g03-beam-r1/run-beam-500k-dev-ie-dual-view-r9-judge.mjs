// Zero-retry, two-pass blind GLM-adapted BEAM IE rubric judging for r9.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const need = (value, reason) => {
  if (!value) throw Error(`g03-beam-500k-ie-dual-view-r9-judge.${reason}`);
};
const [wirePath, wireSha, promptSourcePath, promptSourceSha,
  helperPath, helperSha, root] = process.argv.slice(2);
const validPath = (path, suffix = '') =>
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+$/.test(path ?? '') &&
  !path.includes('/../') && (!suffix || path.endsWith(suffix));
need(process.argv.length === 9 && validPath(wirePath, '.json') &&
  validPath(promptSourcePath, '.mjs') && validPath(helperPath, '.mjs') &&
  validPath(root) && [wireSha, promptSourceSha, helperSha].every(value =>
    /^[a-f0-9]{64}$/.test(value ?? '')), 'arguments');
const [wireBytes, promptSourceBytes, helperBytes] = await Promise.all([
  readFile(wirePath), readFile(promptSourcePath), readFile(helperPath)]);
need(sha(wireBytes) === wireSha && sha(promptSourceBytes) === promptSourceSha &&
  sha(helperBytes) === helperSha, 'input-drift');
// The pinned r3 runner carries the previously calibrated BEAM-adapted prompt.
// Extract that exact literal; do not retype or silently amend its wording.
const promptSource = promptSourceBytes.toString('utf8');
const match = promptSource.match(/const JUDGE_PROMPT = `([\s\S]*?)`;/);
need(match?.length === 2 && !match[1].includes('`') &&
  !match[1].includes('${'), 'pinned-prompt-extraction');
const JUDGE_PROMPT = match[1];
const wire = JSON.parse(wireBytes);
need(wire.schema_version ===
  'are.g03-beam-500k-ie-dual-view-r9-judge-wires/v1' &&
  wire.status === 'blinded-full-development-not-model-scored' &&
  wire.judge_variant === 'official-content-whitespace-normalized-glm' &&
  wire.development_pairs === 60 && wire.reserved_conversations === 16 &&
  wire.question_emitted_to_judge === false &&
  wire.heldout_evaluator_values_accessed_in_code === false &&
  wire.rubric_items === 106 && wire.judge_wires === wire.wires.length &&
  wire.judge_wires === 212 &&
  wire.maximum_generation_calls === 2 * wire.judge_wires &&
  wire.automatic_retries === 0 && wire.wires.every(row =>
    /^[a-f0-9]{24}$/.test(row.blind_id) &&
    typeof row.answer === 'string' && row.answer.trim() &&
    typeof row.rubric_item === 'string' && row.rubric_item.trim() &&
    sha(row.answer) === row.answer_sha256 &&
    sha(row.rubric_item) === row.rubric_item_sha256), 'wire-boundary');
need(new Set(wire.wires.map(row => row.blind_id)).size === wire.judge_wires,
  'unique-blind-ids');
const requests = wire.wires.map(row => {
  const prompt = JUDGE_PROMPT.replace('<rubric_item>', row.rubric_item)
    .replace('<llm_response>', row.answer);
  need(!prompt.includes('<rubric_item>') &&
    !prompt.includes('<llm_response>'), 'prompt-binding');
  return {blind_id: row.blind_id, request: {
    model: 'glm-5.3-flash', messages: [{role: 'user', content: prompt}],
    max_tokens: 512, reasoning_effort: 'low',
    thinking: {type: 'enabled'}, stream: false}};
});
const {createVpsLocalPost, verifyHen11VpsTopology} =
  await import(pathToFileURL(helperPath).href);
const topology = verifyHen11VpsTopology();
await mkdir(root);
const freeze = {
  schema_version: 'are.g03-beam-500k-ie-dual-view-r9-judge-freeze/v1',
  status: 'frozen-before-provider-requests', wire_sha256: wireSha,
  prompt_source_sha256: promptSourceSha, prompt_sha256: sha(JUDGE_PROMPT),
  helper_sha256: helperSha,
  runner_sha256: sha(await readFile(new URL(import.meta.url))),
  official_source_commit: wire.source_commit,
  ordered_blind_ids: requests.map(row => row.blind_id),
  model: 'glm-5.3-flash', context_window_tokens: 8192,
  max_tokens: 512, repeats: 2,
  maximum_generation_calls: wire.maximum_generation_calls,
  automatic_retries: 0, question_emitted_to_judge: false,
  claim_ceiling: 'GLM-adapted judge of 60 exposed 500K IE development pairs only'
};
const freezeBytes = Buffer.from(`${JSON.stringify(freeze, null, 2)}\n`);
await writeFile(`${root}/FREEZE.json`, freezeBytes,
  {flag: 'wx', mode: 0o600});
const post = createVpsLocalPost();
const tokenizerEndpoint = new URL('https://api.z.ai/api/paas/v4/tokenizer');
const tokenizerRows = [];
for (const [index, entry] of requests.entries()) {
  const body = JSON.stringify({model: entry.request.model,
    messages: entry.request.messages});
  let status = null, count = null, errorCode = null;
  try {
    const response = await post(tokenizerEndpoint, body,
      {apiKey: 'container-owned-marker', timeout_ms: 30000,
        maximum_response_bytes: 65536});
    status = response.status;
    const tokens = response.payload?.usage?.prompt_tokens;
    if (status === 200 && Number.isSafeInteger(tokens) && tokens > 0)
      count = tokens;
    else errorCode = String(response.payload?.error?.code ?? 'invalid-response');
  } catch (error) {errorCode = String(error?.code ?? 'transport-error');}
  const row = {ordinal: index + 1, blind_id: entry.blind_id,
    tokenizer_request_sha256: sha(body), status, prompt_tokens: count,
    admitted_8k: count !== null && count + 512 <= 8192,
    ...(errorCode ? {error_code: /^[A-Za-z0-9_.-]{1,40}$/.test(errorCode) ?
      errorCode : 'invalid-code'} : {})};
  tokenizerRows.push(row);
  await writeFile(`${root}/TOKENIZER-${String(index + 1).padStart(3, '0')}.json`,
    `${JSON.stringify(row, null, 2)}\n`, {flag: 'wx', mode: 0o600});
  if (!row.admitted_8k) break;
}
const preflight = {
  schema_version: 'are.g03-beam-500k-ie-dual-view-r9-judge-preflight/v1',
  status: tokenizerRows.length === requests.length &&
    tokenizerRows.every(row => row.admitted_8k) ? 'passed' : 'not-qualified',
  freeze_sha256: sha(freezeBytes), wire_sha256: wireSha,
  helper_sha256: helperSha,
  provider_host_fingerprint_sha256: topology.host_fingerprint_sha256,
  tokenizer_requests: tokenizerRows.length, generation_calls: 0,
  rows: tokenizerRows
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
  schema_version: 'are.g03-beam-500k-ie-dual-view-r9-judge-generation-freeze/v1',
  status: 'frozen-after-tokenizer-before-generation',
  freeze_sha256: sha(freezeBytes), preflight_sha256: sha(preflightBytes),
  ordered_blind_ids: freeze.ordered_blind_ids,
  maximum_generation_calls: wire.maximum_generation_calls,
  automatic_retries: 0
};
const generationFreezeBytes = Buffer.from(
  `${JSON.stringify(generationFreeze, null, 2)}\n`);
await writeFile(`${root}/GENERATION-FREEZE.json`, generationFreezeBytes,
  {flag: 'wx', mode: 0o600});
const endpoint = new URL('https://api.z.ai/api/paas/v4/chat/completions');
const rows = [];
for (let repeat = 1; repeat <= 2; repeat++) {
  const order = repeat === 1 ? requests : [...requests].reverse();
  for (const entry of order) {
    const body = JSON.stringify(entry.request);
    let response;
    const started = Date.now();
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
    const raw = {
      schema_version: 'are.g03-beam-500k-ie-dual-view-r9-judge-attempt/v1',
      repeat, ordinal: rows.length + 1, blind_id: entry.blind_id,
      request_sha256: sha(body), elapsed_ms: Date.now() - started, response
    };
    const rawBytes = Buffer.from(`${JSON.stringify(raw, null, 2)}\n`);
    await writeFile(`${root}/ATTEMPT-${String(raw.ordinal).padStart(3, '0')}.json`,
      rawBytes, {flag: 'wx', mode: 0o600});
    const answer = response.payload?.choices?.[0]?.message?.content;
    const usage = response.payload?.usage;
    const promptTokens = usage?.prompt_tokens;
    const completionTokens = usage?.completion_tokens;
    const finishReason = response.payload?.choices?.[0]?.finish_reason;
    let parsed = null;
    try {parsed = JSON.parse(answer);} catch { /* invalid judge output */ }
    const numericScore = parsed && (typeof parsed.score === 'number' ?
      parsed.score : ['0', '0.0', '0.5', '1', '1.0'].includes(parsed.score) ?
        Number(parsed.score) : null);
    const valid = response.status === 200 &&
      typeof answer === 'string' && answer.trim() &&
      Number.isSafeInteger(promptTokens) && promptTokens > 0 &&
      Number.isSafeInteger(completionTokens) && completionTokens > 0 &&
      completionTokens <= 512 && promptTokens + completionTokens <= 8192 &&
      finishReason !== 'length' && parsed &&
      [0, 0.5, 1].includes(numericScore) &&
      typeof parsed.reason === 'string' && parsed.reason.trim();
    rows.push({repeat, ordinal: raw.ordinal, blind_id: entry.blind_id,
      valid: Boolean(valid), status: response.status,
      finish_reason: finishReason ?? null,
      prompt_tokens: Number.isSafeInteger(promptTokens) ? promptTokens : null,
      completion_tokens: Number.isSafeInteger(completionTokens) ? completionTokens : null,
      score: valid ? numericScore : null,
      raw_sha256: sha(rawBytes), elapsed_ms: raw.elapsed_ms});
    if (!valid) break;
  }
  if (rows.some(row => !row.valid)) break;
}
const result = {
  schema_version: 'are.g03-beam-500k-ie-dual-view-r9-judge-result/v1',
  status: rows.length === wire.maximum_generation_calls &&
    rows.every(row => row.valid) ?
      'completed-60-development-pairs-two-pass' : 'terminal-incomplete',
  wire_sha256: wireSha, freeze_sha256: sha(freezeBytes),
  preflight_sha256: sha(preflightBytes),
  generation_freeze_sha256: sha(generationFreezeBytes),
  provider_host_fingerprint_sha256: topology.host_fingerprint_sha256,
  attempted: rows.length, valid: rows.filter(row => row.valid).length,
  automatic_retries: 0,
  known_prompt_tokens: rows.reduce((sum, row) => sum +
    (row.prompt_tokens ?? 0), 0),
  known_completion_tokens: rows.reduce((sum, row) => sum +
    (row.completion_tokens ?? 0), 0),
  rows,
  claim_ceiling: 'GLM-adapted rubric scores on 60 exposed development pairs only; no independent holdout, native BEAM score or superiority'
};
const resultBytes = Buffer.from(`${JSON.stringify(result, null, 2)}\n`);
await writeFile(`${root}/RUN-RESULT.json`, resultBytes,
  {flag: 'wx', mode: 0o600});
process.stdout.write(`${JSON.stringify({status: result.status,
  attempted: result.attempted, valid: result.valid,
  tokenizer_requests: tokenizerRows.length,
  known_completion_tokens: result.known_completion_tokens,
  result_sha256: sha(resultBytes)})}\n`);
if (result.status !== 'completed-60-development-pairs-two-pass') process.exitCode = 2;
