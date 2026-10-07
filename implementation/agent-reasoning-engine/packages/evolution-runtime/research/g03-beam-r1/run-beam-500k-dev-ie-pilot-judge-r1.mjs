// Blinded exposed-development rubric calibration. The prompt's non-whitespace
// tokens match BEAM b2da22eac88bb0874c64665f13457eb99835774a,
// src/prompts.py unified_llm_judge_base_prompt (MIT). GLM and whitespace
// normalization make this an adapted judge, not official BEAM scoring.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const need = (condition, reason) => {
  if (!condition) throw Error(`g03-beam-500k-ie-pilot-judge-r1.${reason}`);
};
const [wirePath, wireSha, helperPath, helperSha, root] = process.argv.slice(2);
need(process.argv.length === 7 && [wirePath, helperPath, root].every(path =>
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+$/.test(path ?? '') &&
  !path.includes('/../')) && wirePath.endsWith('.json') &&
  helperPath.endsWith('.mjs') && [wireSha, helperSha].every(value =>
  /^[a-f0-9]{64}$/.test(value ?? '')), 'arguments');

const JUDGE_PROMPT = `
You are an expert evaluator tasked with judging whether the LLM's response demonstrates compliance with the specified RUBRIC CRITERION.

## EVALUATION INPUTS
- RUBRIC CRITERION (what to check): <rubric_item>
- RESPONSE TO EVALUATE: <llm_response>
## EVALUATION RUBRIC:
The rubric defines a specific requirement, constraint, or expected behavior that the LLM response should demonstrate.

**IMPORTANT**: Pay careful attention to whether the rubric specifies:
- **Positive requirements** (things the response SHOULD include/do)
- **Negative constraints** (things the response SHOULD NOT include/do, often indicated by "no", "not", "avoid", "absent")
## RESPONSIVENESS REQUIREMENT
A compliant response must be **on-topic** and attempt to answer it.
- If the response does not address the QUESTION, score **0.0** and stop.
- For negative constraints, both must hold: (a) the response is responsive to the QUESTION, and (b) the prohibited element is absent.
## SEMANTIC TOLERANCE RULES:
Judge by meaning, not exact wording.
- Accept **paraphrases** and **synonyms** that preserve intent.
- **Case/punctuation/whitespace** differences must be ignored.
- **Numbers/currencies/dates** may appear in equivalent forms (e.g., “$68,000”, “68k”, “68,000 USD”, or “sixty-eight thousand dollars”). Treat them as equal when numerically equivalent.
- If the rubric expects a number or duration, prefer **normalized comparison** (extract and compare values) over string matching.
## STYLE NEUTRALITY (prevents style contamination):
Ignore tone, politeness, length, and flourish unless the rubric explicitly requires a format/structure (e.g., “itemized list”, “no citations”, “one sentence”).
- Do **not** penalize hedging, voice, or verbosity if content satisfies the rubric.
- Only evaluate format when the rubric **explicitly** mandates it.
## SCORING SCALE:
- **1.0 (Complete Compliance)**: Fully complies with the rubric criterion.
  - Positive: required element present, accurate, properly executed (allowing semantic equivalents).
  - Negative: prohibited element **absent** AND response is **responsive**.

- **0.5 (Partial Compliance)**: Partially complies.
  - Positive: element present but minor inaccuracies/incomplete execution.
  - Negative: generally responsive and mostly avoids the prohibited element but with minor/edge violations.
- **0.0 (No Compliance)**: Fails to comply.
  - Positive: required element missing or incorrect.
  - Negative: prohibited element present **or** response is non-responsive/evasive even if the element is absent.
## EVALUATION INSTRUCTIONS:
1. **Understand the Requirement**: Determine if the rubric is asking for something to be present (positive) or absent (negative/constraint).
2. **Parse Compound Statements**: If the rubric contains multiple elements connected by "and" or commas, evaluate whether:
   - **All elements** must be present for full compliance (1.0)
   - **Some elements** present indicates partial compliance (0.5)
   - **No elements** present indicates no compliance (0.0)

3. **Check Compliance**:
   - For positive requirements: Look for the presence and quality of the required element
   - For negative constraints: Look for the absence of the prohibited element
4. **Assign Score**: Based on compliance with the specific rubric criterion according to the scoring scale above.

5. **Provide Reasoning**: Explain whether the rubric criterion was satisfied and justify the score.
## OUTPUT FORMAT:
Return your evaluation in JSON format with two fields:

{
   "score": [your score: 1.0, 0.5, or 0.0],
   "reason": "[detailed explanation of whether the rubric criterion was satisfied and why this justified the assigned score]"
}

NOTE: ONLY output the json object, without any explanation before or after that
`;

const [wireBytes, helperBytes] = await Promise.all([
  readFile(wirePath), readFile(helperPath)]);
need(sha(wireBytes) === wireSha && sha(helperBytes) === helperSha, 'input-drift');
const wire = JSON.parse(wireBytes);
need(wire.schema_version === 'are.g03-beam-500k-ie-pilot-judge-wires-r1/v1' &&
  wire.status === 'blinded-exposed-development-not-model-scored' &&
  wire.judge_variant === 'official-content-whitespace-normalized-glm' &&
  wire.development_pairs === 12 && wire.reserved_conversations === 16 &&
  wire.question_emitted_to_judge === false &&
  wire.heldout_evaluator_values_accessed_in_code === false &&
  wire.judge_wires === wire.wires.length && wire.judge_wires === 44 && wire.rubric_items === 22 &&
  wire.maximum_generation_calls === 2 * wire.judge_wires &&
  wire.automatic_retries === 0 && wire.wires.every(row =>
    /^[a-f0-9]{24}$/.test(row.blind_id) &&
    typeof row.answer === 'string' && row.answer.trim() &&
    typeof row.rubric_item === 'string' && row.rubric_item.trim() &&
    sha(row.answer) === row.answer_sha256 &&
    sha(row.rubric_item) === row.rubric_item_sha256), 'wire-boundary');
need(new Set(wire.wires.map(row => row.blind_id)).size === wire.judge_wires,
  'duplicate-blind-id');
const {createVpsLocalPost, verifyHen11VpsTopology} =
  await import(pathToFileURL(helperPath).href);
const topology = verifyHen11VpsTopology();
const post = createVpsLocalPost();
await mkdir(root);
const requests = wire.wires.map(row => {
  const prompt = JUDGE_PROMPT.replace('<rubric_item>', row.rubric_item)
    .replace('<llm_response>', row.answer);
  need(!prompt.includes('<rubric_item>') &&
    !prompt.includes('<llm_response>'), 'prompt-binding');
  return {blind_id: row.blind_id, request: {
    model: 'glm-5.3-flash', messages: [{role: 'user', content: prompt}],
    max_tokens: 256, reasoning_effort: 'low',
    thinking: {type: 'enabled'}, stream: false}};
});
const freeze = {
  schema_version: 'are.g03-beam-500k-ie-pilot-judge-freeze-r1/v1',
  status: 'frozen-before-provider-requests', wire_sha256: wireSha,
  helper_sha256: helperSha,
  runner_sha256: sha(await readFile(new URL(import.meta.url))),
  official_source_commit: wire.source_commit,
  prompt_sha256: sha(JUDGE_PROMPT),
  ordered_blind_ids: requests.map(row => row.blind_id),
  model: 'glm-5.3-flash', context_window_tokens: 8192,
  max_tokens: 256, repeats: 2,
  maximum_generation_calls: wire.maximum_generation_calls,
  automatic_retries: 0, question_emitted_to_judge: false,
  claim_ceiling: 'GLM-adapted judge calibration on 12 exposed development pairs only',
};
const freezeBytes = Buffer.from(`${JSON.stringify(freeze, null, 2)}\n`);
await writeFile(`${root}/FREEZE.json`, freezeBytes,
  {flag: 'wx', mode: 0o600});
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
    admitted_8k: count !== null && count + 256 <= 8192,
    ...(errorCode ? {error_code: /^[A-Za-z0-9_.-]{1,40}$/.test(errorCode) ?
      errorCode : 'invalid-code'} : {})};
  tokenizerRows.push(row);
  await writeFile(`${root}/TOKENIZER-${String(index + 1).padStart(2, '0')}.json`,
    `${JSON.stringify(row, null, 2)}\n`, {flag: 'wx', mode: 0o600});
  if (!row.admitted_8k) break;
}
const preflight = {
  schema_version: 'are.g03-beam-500k-ie-pilot-judge-preflight-r1/v1',
  status: tokenizerRows.length === requests.length &&
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
  schema_version: 'are.g03-beam-500k-ie-pilot-judge-generation-freeze-r1/v1',
  status: 'frozen-after-tokenizer-before-generation',
  freeze_sha256: sha(freezeBytes), preflight_sha256: sha(preflightBytes),
  ordered_blind_ids: freeze.ordered_blind_ids,
  maximum_generation_calls: wire.maximum_generation_calls,
  automatic_retries: 0,
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
    const raw = {schema_version: 'are.g03-beam-500k-ie-pilot-judge-attempt-r1/v1',
      repeat, ordinal: rows.length + 1, blind_id: entry.blind_id,
      request_sha256: sha(body), elapsed_ms: Date.now() - started, response};
    const rawBytes = Buffer.from(`${JSON.stringify(raw, null, 2)}\n`);
    await writeFile(`${root}/ATTEMPT-${String(raw.ordinal).padStart(2, '0')}.json`,
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
      completionTokens <= 256 && promptTokens + completionTokens <= 8192 &&
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
  schema_version: 'are.g03-beam-500k-ie-pilot-judge-result-r1/v1',
  status: rows.length === wire.maximum_generation_calls &&
    rows.every(row => row.valid) ? 'completed-12-pair-pilot' : 'terminal-incomplete',
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
  claim_ceiling: 'GLM-adapted judge calibration on 12 exposed development pairs; no holdout or superiority',
};
const resultBytes = Buffer.from(`${JSON.stringify(result, null, 2)}\n`);
await writeFile(`${root}/RUN-RESULT.json`, resultBytes,
  {flag: 'wx', mode: 0o600});
process.stdout.write(`${JSON.stringify({status: result.status,
  attempted: result.attempted, valid: result.valid,
  known_prompt_tokens: result.known_prompt_tokens,
  known_completion_tokens: result.known_completion_tokens,
  preflight_sha256: sha(preflightBytes), result_sha256: sha(resultBytes)})}\n`);
if (result.status !== 'completed-12-pair-pilot') process.exitCode = 2;
