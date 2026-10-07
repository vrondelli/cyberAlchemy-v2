// Post-label, zero-retry, two-pass transfer of the exact r12 cited-source scorer.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const sha = value => createHash('sha256').update(value).digest('hex');
const need = (value, reason) => {
  if (!value) throw Error(`g03-beam-r13-source-judge.${reason}`);
};
const HEX64 = /^[a-f0-9]{64}$/;
const CODES = new Set(['direct_match', 'missing', 'alternative_only',
  'explicit_uncertainty', 'contradicted', 'off_target', 'other']);
const R12_RUNNER_SHA =
  '555ae796084a8ca69a52d0f59cc442650df7e1234b6654001d89bbb3924e8230';
const R12_PROMPT_SHA =
  '8db418bb000b4a022fd74f7db88ff7a9470235b65f78175db8c4979069ba5a8c';
const SOURCE_PREFLIGHT_SHA =
  'f2c76a591ead557e1ede2ca61a84237e05b650dad60c43187563ec0cb7d6d9bb';
const REVIEW_SHA =
  '74a51190fcf675ca5ad7f1e54121da98a576b05b85333d8dcdd8698b10b45970';
const ANSWER_AUDIT_SHA =
  'e3cda154789426075cc39b36fe607721099fef9711443c9b0a166eb1ad7b33b8';

const validPath = (value, suffix = '') =>
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+$/.test(value ?? '') &&
  !value.includes('/../') && (!suffix || value.endsWith(suffix));

const canonical = value => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') return `{${Object.keys(value)
    .sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`)
    .join(',')}}`;
  return JSON.stringify(value);
};

export function historicalPrompt(source) {
  const match = source.match(/const SYSTEM = `([^`]*)`;/s);
  need(match && sha(match[1]) === R12_PROMPT_SHA, 'historical-prompt-drift');
  return match[1];
}

export function makeRequests(wire, system) {
  need(wire.schema_version ===
    'are.g03-beam-100k-ie-r13-source-grounded-wires/v1' &&
    wire.status === 'blinded-after-two-human-label-seal-before-judge' &&
    HEX64.test(wire.label_sha256 ?? '') &&
    wire.source_preflight_sha256 === SOURCE_PREFLIGHT_SHA &&
    wire.review_input_sha256 === REVIEW_SHA &&
    wire.answer_audit_sha256 === ANSWER_AUDIT_SHA &&
    wire.question_pairs === 32 && wire.blind_wires === 64 &&
    wire.maximum_judge_calls === 128 &&
    wire.cited_turns_truncated === false &&
    Array.isArray(wire.wires) && wire.wires.length === 64,
  'wire-boundary');
  const seen = new Set();
  let maxCited = 0;
  const requests = wire.wires.map(row => {
    need(/^[a-f0-9]{24}$/.test(row.blind_id ?? '') &&
      !seen.has(row.blind_id) &&
      typeof row.question === 'string' && row.question.trim() &&
      typeof row.reference_answer === 'string' &&
      row.reference_answer.trim() &&
      typeof row.answer === 'string' && row.answer.trim() &&
      sha(row.question) === row.question_sha256 &&
      sha(row.reference_answer) === row.reference_sha256 &&
      sha(row.answer) === row.answer_sha256 &&
      Array.isArray(row.cited_turns) && row.cited_turns.length > 0 &&
      row.cited_turns.every(turn =>
        Number.isSafeInteger(turn.source_turn) && turn.source_turn >= 0 &&
        ['user', 'assistant'].includes(turn.role) &&
        typeof turn.content === 'string' && turn.content.trim()) &&
      sha(canonical(row.cited_turns)) === row.cited_turns_sha256,
    'wire-row');
    seen.add(row.blind_id);
    maxCited = Math.max(maxCited, row.cited_turns.reduce((n, turn) =>
      n + turn.content.length, 0));
    return {blind_id: row.blind_id, request: {
      model: 'glm-5.3-flash', messages: [
        {role: 'system', content: system},
        {role: 'user', content: JSON.stringify({QUESTION: row.question,
          REFERENCE_ANSWER: row.reference_answer,
          CITED_TURNS: row.cited_turns, RESPONSE: row.answer})}],
      max_tokens: 512, reasoning_effort: 'low',
      thinking: {type: 'enabled'}, stream: false}};
  });
  need(seen.size === 64 && maxCited === wire.max_cited_source_content_chars,
    'wire-completeness');
  return requests;
}

export function parseJudgment(response) {
  const content = response.payload?.choices?.[0]?.message?.content;
  const usage = response.payload?.usage;
  const promptTokens = usage?.prompt_tokens;
  const completionTokens = usage?.completion_tokens;
  const finishReason = response.payload?.choices?.[0]?.finish_reason;
  let parsed = null;
  try {parsed = JSON.parse(content);} catch { /* invalid judge output */ }
  const valid = response.status === 200 &&
    typeof content === 'string' && content.trim() &&
    Number.isSafeInteger(promptTokens) && promptTokens > 0 &&
    Number.isSafeInteger(completionTokens) && completionTokens > 0 &&
    completionTokens <= 512 && promptTokens + completionTokens <= 8192 &&
    finishReason !== 'length' && parsed &&
    typeof parsed.correct === 'boolean' &&
    CODES.has(parsed.reason_code) && Object.keys(parsed).length === 2;
  return {valid: Boolean(valid), status: response.status ?? null,
    finish_reason: finishReason ?? null,
    prompt_tokens: Number.isSafeInteger(promptTokens) ? promptTokens : null,
    completion_tokens: Number.isSafeInteger(completionTokens) ?
      completionTokens : null,
    correct: valid ? parsed.correct : null,
    reason_code: valid ? parsed.reason_code : null};
}

async function main() {
  const [wirePath, wireSha, historicalPath, helperPath, helperSha, root] =
    process.argv.slice(2);
  need(process.argv.length === 8 && validPath(wirePath, '.json') &&
    validPath(historicalPath, '.mjs') && validPath(helperPath, '.mjs') &&
    validPath(root) && [wireSha, helperSha].every(v => HEX64.test(v ?? '')),
  'arguments');
  const [wireBytes, historicalBytes, helperBytes] = await Promise.all([
    readFile(wirePath), readFile(historicalPath), readFile(helperPath)]);
  need(sha(wireBytes) === wireSha &&
    sha(historicalBytes) === R12_RUNNER_SHA &&
    sha(helperBytes) === helperSha, 'input-drift');
  const system = historicalPrompt(historicalBytes.toString('utf8'));
  const wire = JSON.parse(wireBytes);
  const requests = makeRequests(wire, system);
  const {createVpsLocalPost, verifyHen11VpsTopology} =
    await import(pathToFileURL(helperPath).href);
  const topology = verifyHen11VpsTopology();
  await mkdir(root);
  const freeze = {
    schema_version: 'are.g03-beam-100k-ie-r13-source-judge-freeze/v1',
    status: 'frozen-before-provider-requests',
    wire_sha256: wireSha, label_sha256: wire.label_sha256,
    historical_runner_sha256: R12_RUNNER_SHA,
    prompt_sha256: R12_PROMPT_SHA, helper_sha256: helperSha,
    runner_sha256: sha(await readFile(new URL(import.meta.url))),
    ordered_blind_ids: requests.map(row => row.blind_id),
    ordered_requests: requests.map(row => ({blind_id: row.blind_id,
      generation_request_sha256: sha(JSON.stringify(row.request)),
      tokenizer_request_sha256: sha(JSON.stringify({model: row.request.model,
        messages: row.request.messages}))})),
    model: 'glm-5.3-flash', context_window_tokens: 8192,
    max_tokens: 512, repeats: 2, maximum_judge_calls: 128,
    automatic_retries: 0,
    claim_ceiling: 'Frozen independent scorer transfer only; no judged accuracy'
  };
  const freezeBytes = Buffer.from(`${JSON.stringify(freeze, null, 2)}\n`);
  await writeFile(`${root}/FREEZE.json`, freezeBytes,
    {flag: 'wx', mode: 0o600});
  const post = createVpsLocalPost();
  const tokenizer = new URL('https://api.z.ai/api/paas/v4/tokenizer');
  const tokenRows = [];
  for (const [index, entry] of requests.entries()) {
    const body = JSON.stringify({model: entry.request.model,
      messages: entry.request.messages});
    let status = null, promptTokens = null, errorCode = null;
    try {
      const response = await post(tokenizer, body,
        {apiKey: 'container-owned-marker', timeout_ms: 30000,
          maximum_response_bytes: 65536});
      status = response.status;
      const tokens = response.payload?.usage?.prompt_tokens;
      if (status === 200 && Number.isSafeInteger(tokens) && tokens > 0)
        promptTokens = tokens;
      else errorCode = String(response.payload?.error?.code ?? 'invalid-response');
    } catch (error) {errorCode = String(error?.code ?? 'transport-error');}
    const row = {ordinal: index + 1, blind_id: entry.blind_id,
      tokenizer_request_sha256: sha(body), status,
      prompt_tokens: promptTokens,
      admitted_8k: promptTokens !== null && promptTokens + 512 <= 8192,
      ...(errorCode ? {error_code: /^[A-Za-z0-9_.-]{1,40}$/.test(errorCode) ?
        errorCode : 'invalid-code'} : {})};
    tokenRows.push(row);
    await writeFile(`${root}/TOKENIZER-${String(index + 1).padStart(3, '0')}.json`,
      `${JSON.stringify(row, null, 2)}\n`, {flag: 'wx', mode: 0o600});
    if (!row.admitted_8k) break;
  }
  const preflight = {
    schema_version: 'are.g03-beam-100k-ie-r13-source-judge-preflight/v1',
    status: tokenRows.length === 64 && tokenRows.every(row => row.admitted_8k) ?
      'passed' : 'not-qualified',
    freeze_sha256: sha(freezeBytes), wire_sha256: wireSha,
    helper_sha256: helperSha,
    provider_host_fingerprint_sha256: topology.host_fingerprint_sha256,
    tokenizer_requests: tokenRows.length, generation_calls: 0,
    rows: tokenRows
  };
  const preflightBytes = Buffer.from(`${JSON.stringify(preflight, null, 2)}\n`);
  await writeFile(`${root}/PREFLIGHT.json`, preflightBytes,
    {flag: 'wx', mode: 0o600});
  if (preflight.status !== 'passed') {
    process.stdout.write(`${JSON.stringify({status: preflight.status,
      tokenizer_requests: tokenRows.length,
      preflight_sha256: sha(preflightBytes), generation_calls: 0})}\n`);
    process.exitCode = 2;
    return;
  }
  const generationFreeze = {
    schema_version: 'are.g03-beam-100k-ie-r13-source-judge-generation-freeze/v1',
    status: 'frozen-after-tokenizer-before-generation',
    freeze_sha256: sha(freezeBytes), preflight_sha256: sha(preflightBytes),
    ordered_blind_ids: freeze.ordered_blind_ids,
    maximum_judge_calls: 128, automatic_retries: 0
  };
  const generationBytes = Buffer.from(
    `${JSON.stringify(generationFreeze, null, 2)}\n`);
  await writeFile(`${root}/GENERATION-FREEZE.json`, generationBytes,
    {flag: 'wx', mode: 0o600});
  const endpoint = new URL('https://api.z.ai/api/paas/v4/chat/completions');
  const rows = [];
  for (let repeat = 1; repeat <= 2; repeat++) {
    const ordered = repeat === 1 ? requests : [...requests].reverse();
    for (const entry of ordered) {
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
        schema_version: 'are.g03-beam-100k-ie-r13-source-judge-attempt/v1',
        repeat, ordinal: rows.length + 1, blind_id: entry.blind_id,
        request_sha256: sha(body), elapsed_ms: Date.now() - started, response
      };
      const rawBytes = Buffer.from(`${JSON.stringify(raw, null, 2)}\n`);
      await writeFile(`${root}/ATTEMPT-${String(raw.ordinal).padStart(3, '0')}.json`,
        rawBytes, {flag: 'wx', mode: 0o600});
      const verdict = parseJudgment(response);
      rows.push({repeat, ordinal: raw.ordinal, blind_id: entry.blind_id,
        ...verdict, raw_sha256: sha(rawBytes), elapsed_ms: raw.elapsed_ms});
      if (!verdict.valid) break;
    }
    if (rows.some(row => !row.valid)) break;
  }
  const result = {
    schema_version: 'are.g03-beam-100k-ie-r13-source-judge-result/v1',
    status: rows.length === 128 && rows.every(row => row.valid) ?
      'completed-64-pairs-two-pass' : 'terminal-incomplete',
    wire_sha256: wireSha, label_sha256: wire.label_sha256,
    freeze_sha256: sha(freezeBytes),
    preflight_sha256: sha(preflightBytes),
    generation_freeze_sha256: sha(generationBytes),
    provider_host_fingerprint_sha256: topology.host_fingerprint_sha256,
    attempted: rows.length, valid: rows.filter(row => row.valid).length,
    automatic_retries: 0,
    known_prompt_tokens: rows.reduce((sum, row) => sum +
      (row.prompt_tokens ?? 0), 0),
    known_completion_tokens: rows.reduce((sum, row) => sum +
      (row.completion_tokens ?? 0), 0),
    rows,
    claim_ceiling: 'Scorer transfer receipts only; paired analysis and independent audit remain'
  };
  const resultBytes = Buffer.from(`${JSON.stringify(result, null, 2)}\n`);
  await writeFile(`${root}/RUN-RESULT.json`, resultBytes,
    {flag: 'wx', mode: 0o600});
  process.stdout.write(`${JSON.stringify({status: result.status,
    attempted: result.attempted, valid: result.valid,
    tokenizer_requests: tokenRows.length,
    known_completion_tokens: result.known_completion_tokens,
    result_sha256: sha(resultBytes)})}\n`);
  if (result.status !== 'completed-64-pairs-two-pass') process.exitCode = 2;
}

if (process.argv[1] &&
    pathToFileURL(process.argv[1]).href === import.meta.url) await main();
