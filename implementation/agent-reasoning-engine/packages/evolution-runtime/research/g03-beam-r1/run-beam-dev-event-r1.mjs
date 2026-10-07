// Bounded generation on eight already-exposed BEAM development event wires.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const need = (value, reason) => { if (!value) throw Error(`g03-beam-dev-event-run.${reason}`); };
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
need(wire.schema_version === 'are.g03-beam-dev-event-wire/v1' &&
  wire.evaluator_fields_read === false && wire.event_ordering_wires === 8 &&
  preflight.status === 'passed-eight-development-wires' &&
  preflight.wire_sha256 === wireSha && preflight.generation_calls === 0 &&
  preflight.results.length === 8 &&
  preflight.results.every((row, index) => row.admitted_8k === true &&
    row.probe_id === wire.wires[index].probe_id), 'preflight-boundary');
await mkdir(root); // No reused output root or rerun of an attempt.
const {createVpsLocalPost, verifyHen11VpsTopology} = await import(pathToFileURL(helperPath).href);
const topology = verifyHen11VpsTopology();
const selfSha = sha(await readFile(new URL(import.meta.url)));
const freeze = {schema_version: 'are.g03-beam-dev-event-run-freeze/v1',
  status: 'frozen-before-development-generation', wire_sha256: wireSha,
  tokenizer_preflight_sha256: preflightSha, helper_sha256: helperSha,
  runner_sha256: selfSha, model: 'glm-5.3-flash',
  generation_endpoint: 'https://api.z.ai/api/paas/v4/chat/completions',
  ordered_probe_ids: wire.wires.map(row => row.probe_id),
  maximum_generation_calls: 8, maximum_output_tokens: 512,
  context_window_tokens: 8192, automatic_retries: 0,
  failure_policy: 'preserve-attempt-and-stop-without-retry-or-substitution',
  evaluator_fields_read: false,
  claim_ceiling: 'Exposed development answers only; no native score, independent holdout, or superiority'};
const freezeBytes = Buffer.from(`${JSON.stringify(freeze, null, 2)}\n`);
await writeFile(`${root}/FREEZE.json`, freezeBytes, {flag: 'wx', mode: 0o600});
const post = createVpsLocalPost();
const endpoint = new URL(freeze.generation_endpoint);
const rows = [];
for (const [index, entry] of wire.wires.entries()) {
  const body = JSON.stringify(entry.request);
  const started = Date.now();
  let result;
  try {
    const response = await post(endpoint, body, {apiKey: 'container-owned-marker',
      timeout_ms: 120000, maximum_response_bytes: 262144});
    result = {status: response.status, payload: response.payload,
      bytes: response.bytes};
  } catch (error) {
    const code = String(error?.code ?? 'transport-error');
    result = {status: null, payload: null, bytes: null,
      transport_error_code: /^[A-Za-z0-9_.-]{1,40}$/.test(code) ? code : 'transport-error'};
  }
  const raw = {schema_version: 'are.g03-beam-dev-event-attempt/v1',
    ordinal: index + 1, probe_id: entry.probe_id,
    request_sha256: sha(body), elapsed_ms: Date.now() - started,
    response: result};
  const rawBytes = Buffer.from(`${JSON.stringify(raw, null, 2)}\n`);
  const rawPath = `${root}/ATTEMPT-${String(index + 1).padStart(2, '0')}.json`;
  await writeFile(rawPath, rawBytes, {flag: 'wx', mode: 0o600});
  const answer = result.payload?.choices?.[0]?.message?.content;
  const promptTokens = result.payload?.usage?.prompt_tokens;
  const completionTokens = result.payload?.usage?.completion_tokens;
  const valid = result.status === 200 && typeof answer === 'string' &&
    answer.trim().length > 0 && Number.isSafeInteger(promptTokens) &&
    promptTokens > 0 && Number.isSafeInteger(completionTokens) && completionTokens > 0;
  rows.push({ordinal: index + 1, probe_id: entry.probe_id,
    status: result.status, valid, prompt_tokens: valid ? promptTokens : null,
    completion_tokens: valid ? completionTokens : null,
    answer_sha256: valid ? sha(answer) : null,
    raw_sha256: sha(rawBytes), elapsed_ms: raw.elapsed_ms});
  if (!valid) break;
}
const summary = {schema_version: 'are.g03-beam-dev-event-run-result/v1',
  status: rows.length === 8 && rows.every(row => row.valid) ?
    'completed-eight-development-answers' : 'terminal-incomplete',
  freeze_sha256: sha(freezeBytes), wire_sha256: wireSha,
  tokenizer_preflight_sha256: preflightSha,
  provider_host_fingerprint_sha256: topology.host_fingerprint_sha256,
  attempted: rows.length, valid: rows.filter(row => row.valid).length,
  automatic_retries: 0, evaluator_fields_read: false,
  known_prompt_tokens: rows.reduce((sum, row) => sum + (row.prompt_tokens ?? 0), 0),
  known_completion_tokens: rows.reduce((sum, row) => sum + (row.completion_tokens ?? 0), 0),
  rows, claim_ceiling: 'Exposed development model answers only; scoring, judge, independent holdout, and superiority unproven'};
const summaryBytes = Buffer.from(`${JSON.stringify(summary, null, 2)}\n`);
await writeFile(`${root}/RUN-RESULT.json`, summaryBytes, {flag: 'wx', mode: 0o600});
process.stdout.write(`${JSON.stringify({status: summary.status, attempted: summary.attempted,
  valid: summary.valid, freeze_sha256: summary.freeze_sha256,
  result_sha256: sha(summaryBytes), output_root: root})}\n`);
if (summary.status !== 'completed-eight-development-answers') process.exitCode = 2;
