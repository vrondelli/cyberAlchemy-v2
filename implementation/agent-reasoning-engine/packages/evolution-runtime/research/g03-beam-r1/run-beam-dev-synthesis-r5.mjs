// Zero-retry final synthesis for two exposed BEAM development questions.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const need = (value, reason) => { if (!value) throw Error(`g03-beam-synthesis-run-r5.${reason}`); };
const [wirePath, wireSha, preflightPath, preflightSha, helperPath, helperSha, root] = process.argv.slice(2);
need(process.argv.length === 9 &&
  [wirePath, preflightPath].every(path => /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+\.json$/.test(path ?? '') && !path.includes('/../')) &&
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+\.mjs$/.test(helperPath ?? '') &&
  !helperPath.includes('/../') &&
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+$/.test(root ?? '') && !root.includes('/../') &&
  [wireSha, preflightSha, helperSha].every(value => /^[a-f0-9]{64}$/.test(value ?? '')),
  'arguments');
const [wireBytes, preflightBytes, helperBytes] = await Promise.all([
  readFile(wirePath), readFile(preflightPath), readFile(helperPath)]);
need(sha(wireBytes) === wireSha && sha(preflightBytes) === preflightSha &&
  sha(helperBytes) === helperSha, 'input-drift');
const wire = JSON.parse(wireBytes), preflight = JSON.parse(preflightBytes);
need(wire.schema_version === 'are.g03-beam-dev-synthesis-wires-r5/v1' &&
  wire.status === 'frozen-after-extraction-before-synthesis-tokenizer' &&
  wire.evaluator_fields_read === false && wire.wires.length === 2 &&
  wire.synthesis_output_reserve_tokens === 1024 &&
  preflight.schema_version === 'are.g03-beam-dev-synthesis-preflight-r5/v1' &&
  preflight.status === 'passed-two-development-synthesis-wires' &&
  preflight.wire_sha256 === wireSha && preflight.generation_calls === 0 &&
  preflight.rows.length === 2 &&
  preflight.rows.every((row, index) => row.admitted_8k === true &&
    row.prompt_tokens + 1024 <= 8192 &&
    row.probe_id === wire.wires[index].probe_id), 'preflight-boundary');
await mkdir(root);
const {createVpsLocalPost, verifyHen11VpsTopology} = await import(pathToFileURL(helperPath).href);
const topology = verifyHen11VpsTopology();
const selfSha = sha(await readFile(new URL(import.meta.url)));
const freeze = {schema_version: 'are.g03-beam-dev-synthesis-freeze-r5/v1',
  status: 'frozen-before-development-synthesis', wire_sha256: wireSha,
  tokenizer_preflight_sha256: preflightSha, helper_sha256: helperSha,
  runner_sha256: selfSha, model: 'glm-5.3-flash',
  generation_endpoint: 'https://api.z.ai/api/paas/v4/chat/completions',
  ordered_probe_ids: wire.wires.map(row => row.probe_id),
  maximum_generation_calls: 2, max_tokens: 1024,
  context_window_tokens: 8192, automatic_retries: 0,
  failure_policy: 'preserve-attempt-and-stop-without-retry-or-substitution',
  evaluator_fields_read: false,
  claim_ceiling: 'Two exposed development answers only; no native score, holdout, or superiority'};
const freezeBytes = Buffer.from(`${JSON.stringify(freeze, null, 2)}\n`);
await writeFile(`${root}/FREEZE.json`, freezeBytes, {flag: 'wx', mode: 0o600});
const post = createVpsLocalPost();
const endpoint = new URL(freeze.generation_endpoint);
const rows = [];
for (const [index, entry] of wire.wires.entries()) {
  const body = JSON.stringify(entry.request);
  const started = Date.now();
  let response;
  try {
    const delivered = await post(endpoint, body, {apiKey: 'container-owned-marker',
      timeout_ms: 120000, maximum_response_bytes: 262144});
    response = {status: delivered.status, payload: delivered.payload,
      bytes: delivered.bytes};
  } catch (error) {
    const code = String(error?.code ?? 'transport-error');
    response = {status: null, payload: null, bytes: null,
      transport_error_code: /^[A-Za-z0-9_.-]{1,40}$/.test(code) ? code : 'transport-error'};
  }
  const raw = {schema_version: 'are.g03-beam-dev-synthesis-attempt-r5/v1',
    ordinal: index + 1, probe_id: entry.probe_id,
    request_sha256: sha(body), elapsed_ms: Date.now() - started,
    response};
  const rawBytes = Buffer.from(`${JSON.stringify(raw, null, 2)}\n`);
  await writeFile(`${root}/ATTEMPT-${String(index + 1).padStart(2, '0')}.json`,
    rawBytes, {flag: 'wx', mode: 0o600});
  const answer = response.payload?.choices?.[0]?.message?.content;
  const promptTokens = response.payload?.usage?.prompt_tokens;
  const completionTokens = response.payload?.usage?.completion_tokens;
  const reasoningTokens = response.payload?.usage?.completion_tokens_details?.reasoning_tokens;
  const finishReason = response.payload?.choices?.[0]?.finish_reason;
  const valid = response.status === 200 && typeof answer === 'string' &&
    answer.trim().length > 0 && Number.isSafeInteger(promptTokens) &&
    promptTokens > 0 && Number.isSafeInteger(completionTokens) &&
    completionTokens > 0 && completionTokens <= 1024 &&
    promptTokens + completionTokens <= 8192 && finishReason !== 'length';
  rows.push({ordinal: index + 1, probe_id: entry.probe_id,
    status: response.status, valid, finish_reason: finishReason ?? null,
    prompt_tokens: Number.isSafeInteger(promptTokens) ? promptTokens : null,
    completion_tokens: Number.isSafeInteger(completionTokens) ? completionTokens : null,
    reasoning_tokens: Number.isSafeInteger(reasoningTokens) ? reasoningTokens : null,
    answer_sha256: valid ? sha(answer) : null,
    raw_sha256: sha(rawBytes), elapsed_ms: raw.elapsed_ms});
  if (!valid) break;
}
const summary = {schema_version: 'are.g03-beam-dev-synthesis-result-r5/v1',
  status: rows.length === 2 && rows.every(row => row.valid) ?
    'completed-two-development-answers' : 'terminal-incomplete',
  freeze_sha256: sha(freezeBytes), wire_sha256: wireSha,
  tokenizer_preflight_sha256: preflightSha,
  provider_host_fingerprint_sha256: topology.host_fingerprint_sha256,
  attempted: rows.length, valid: rows.filter(row => row.valid).length,
  automatic_retries: 0, evaluator_fields_read: false,
  known_prompt_tokens: rows.reduce((sum, row) => sum + (row.prompt_tokens ?? 0), 0),
  known_completion_tokens: rows.reduce((sum, row) => sum + (row.completion_tokens ?? 0), 0),
  known_reasoning_tokens: rows.reduce((sum, row) => sum + (row.reasoning_tokens ?? 0), 0),
  rows, claim_ceiling: 'Two exposed development answers only; no native score, holdout, or superiority'};
const summaryBytes = Buffer.from(`${JSON.stringify(summary, null, 2)}\n`);
await writeFile(`${root}/RUN-RESULT.json`, summaryBytes, {flag: 'wx', mode: 0o600});
process.stdout.write(`${JSON.stringify({status: summary.status, attempted: summary.attempted,
  valid: summary.valid, known_completion_tokens: summary.known_completion_tokens,
  freeze_sha256: summary.freeze_sha256, result_sha256: sha(summaryBytes)})}\n`);
if (summary.status !== 'completed-two-development-answers') process.exitCode = 2;
