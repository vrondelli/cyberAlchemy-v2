// Same-account tokenizer-only admission for sealed 32-pair BEAM 100K wires.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const sha = value => createHash('sha256').update(value).digest('hex');
const need = (value, reason) => {
  if (!value) throw Error(`g03-beam-100k-r13-tokenizer.${reason}`);
};
const [wirePath, wireSha, helperPath, helperSha, root] = process.argv.slice(2);
const validPath = (value, suffix = '') =>
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+$/.test(value ?? '') &&
  !value.includes('/../') && (!suffix || value.endsWith(suffix));
need(process.argv.length === 7 && validPath(wirePath, '.json') &&
  validPath(helperPath, '.mjs') && validPath(root) &&
  [wireSha, helperSha].every(value => /^[a-f0-9]{64}$/.test(value ?? '')),
  'arguments');
const [wireBytes, helperBytes] = await Promise.all([
  readFile(wirePath), readFile(helperPath)]);
need(sha(wireBytes) === wireSha && sha(helperBytes) === helperSha,
  'input-drift');
const wire = JSON.parse(wireBytes);
need(wire.schema_version === 'are.g03-beam-100k-ie-r13-answer-wires/v1' &&
  wire.status === 'source-only-reserved-wires-not-token-qualified' &&
  wire.evaluator_fields_read === false && wire.model_calls === 0 &&
  wire.reserved_questions === 32 && wire.matched_wires === 64 &&
  wire.maximum_generation_calls === 64 &&
  wire.answer_output_reserve_tokens === 512 &&
  wire.context_window_tokens === 8192 &&
  wire.wires.length === 64 && wire.wires.every(row =>
    /^[a-f0-9]{24}$/.test(row.probe_id) &&
    ['control', 'treatment'].includes(row.arm) &&
    row.request.model === 'glm-5.3-flash' &&
    row.request.max_tokens === 512 &&
    Array.isArray(row.request.messages) &&
    row.request.messages.length === 2 &&
    row.request.messages[0].role === 'system' &&
    row.request.messages[1].role === 'user'), 'wire-boundary');
need(new Set(wire.wires.map(row => `${row.probe_id}:${row.arm}`)).size === 64,
  'pair-uniqueness');
const {createVpsLocalPost, verifyHen11VpsTopology} =
  await import(pathToFileURL(helperPath).href);
const topology = verifyHen11VpsTopology();
await mkdir(root);
const freeze = {
  schema_version: 'are.g03-beam-100k-ie-r13-tokenizer-freeze/v1',
  status: 'frozen-before-tokenizer', wire_sha256: wireSha,
  helper_sha256: helperSha,
  runner_sha256: sha(await readFile(new URL(import.meta.url))),
  ordered_pair_ids: wire.wires.map(row => `${row.probe_id}:${row.arm}`),
  model: 'glm-5.3-flash', context_window_tokens: 8192,
  output_reserve_tokens: 512, generation_calls: 0,
  evaluator_fields_read: false,
  claim_ceiling: 'Tokenizer-only admission; no answers, labels, score, or superiority'
};
const freezeBytes = Buffer.from(`${JSON.stringify(freeze, null, 2)}\n`);
await writeFile(`${root}/FREEZE.json`, freezeBytes,
  {flag: 'wx', mode: 0o600});
const post = createVpsLocalPost();
const tokenizer = new URL('https://api.z.ai/api/paas/v4/tokenizer');
const rows = [];
for (const [index, entry] of wire.wires.entries()) {
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
  const row = {ordinal: index + 1, probe_id: entry.probe_id,
    arm: entry.arm, request_sha256: sha(body), status,
    prompt_tokens: promptTokens,
    admitted_8k: promptTokens !== null && promptTokens + 512 <= 8192,
    ...(errorCode ? {error_code: /^[A-Za-z0-9_.-]{1,40}$/.test(errorCode) ?
      errorCode : 'invalid-code'} : {})};
  rows.push(row);
  await writeFile(`${root}/TOKENIZER-${String(index + 1).padStart(3, '0')}.json`,
    `${JSON.stringify(row, null, 2)}\n`, {flag: 'wx', mode: 0o600});
}
const result = {
  schema_version: 'are.g03-beam-100k-ie-r13-tokenizer-result/v1',
  status: rows.length === 64 && rows.every(row => row.admitted_8k) ?
    'passed-64-of-64' : 'not-qualified',
  wire_sha256: wireSha, freeze_sha256: sha(freezeBytes),
  helper_sha256: helperSha,
  provider_host_fingerprint_sha256: topology.host_fingerprint_sha256,
  tokenizer_requests: rows.length,
  admitted_requests: rows.filter(row => row.admitted_8k).length,
  maximum_prompt_tokens: Math.max(...rows.map(row => row.prompt_tokens ?? 0)),
  generation_calls: 0, evaluator_fields_read: false, rows,
  claim_ceiling: 'Tokenizer-only admission; no answers, labels, score, or superiority'
};
const resultBytes = Buffer.from(`${JSON.stringify(result, null, 2)}\n`);
await writeFile(`${root}/RESULT.json`, resultBytes,
  {flag: 'wx', mode: 0o600});
process.stdout.write(`${JSON.stringify({status: result.status,
  tokenizer_requests: result.tokenizer_requests,
  admitted_requests: result.admitted_requests,
  maximum_prompt_tokens: result.maximum_prompt_tokens,
  generation_calls: 0, result_sha256: sha(resultBytes)})}\n`);
if (result.status !== 'passed-64-of-64') process.exitCode = 2;
