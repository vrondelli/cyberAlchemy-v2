// One changed r3 treatment; reuse three byte-identical, sealed r2 answers.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const sha = value => createHash('sha256').update(value).digest('hex');
const need = (value, code) => { if (!value) throw Error(`g03-v2-dev-r3.${code}`); };
const [r3Path, r2Path, r2ResultPath, r2FreezePath, helperPath, root] = process.argv.slice(2);
need(process.argv.length === 8 && [r3Path, r2Path, r2ResultPath,
  r2FreezePath, helperPath, root].every(path =>
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+$/.test(path ?? '') &&
  !path.includes('/../')), 'arguments');
const [r3Bytes, r2Bytes, r2ResultBytes, r2FreezeBytes] = await Promise.all([
  readFile(r3Path), readFile(r2Path), readFile(r2ResultPath), readFile(r2FreezePath)]);
need(sha(r3Bytes) === '4389fc85179fe99aeae9faa91e59bbfb3d37b90c6e542611edb405f69d38593b' &&
  sha(r2Bytes) === '99be56cad573d2eacf5ba327cb463288ba6060e80fe5eac9fceed372f7e07f05' &&
  sha(r2ResultBytes) === '206fa29e99ed92ec9309f3fc99c63c72dc69a96ef74d994e1692a1b55bc6c07e',
  'input-drift');
const r3 = JSON.parse(r3Bytes), r2 = JSON.parse(r2Bytes);
const r2Result = JSON.parse(r2ResultBytes), r2Freeze = JSON.parse(r2FreezeBytes);
need(r3.schema_version === 'are.g03-lme-v2-dev-form-procedure-r3/v1' &&
  r3.parent_wire_sha256 === sha(r2Bytes) &&
  r3.structured_form_question_count === 1 &&
  r3.structured_form_question_ids.length === 1 &&
  r3.structured_form_question_ids[0] === '7e32e4a2' &&
  r2Result.status === 'completed-four-development-answers' &&
  r2Result.freeze_sha256 === sha(r2FreezeBytes) &&
  r2Freeze.ordered_requests.length === 4 &&
  r2Result.answer_rows.length === 4 &&
  r2Result.answer_rows.every(row => row.valid), 'sealed-predecessor');
const system = 'Answer the question using only the supplied prior agent-trajectory evidence. If the evidence is insufficient, state that you do not know. Follow the requested final-answer format. Do not invent details.';
const makeRequest = (row, arm) => ({model: 'glm-5.3-flash', messages: [
  {role: 'system', content: system},
  {role: 'user', content: `Prior agent-trajectory evidence:\n${row.arms[arm].evidence}\n\nQuestion:\n${row.question}`},
], max_tokens: 512, reasoning_effort: 'low', thinking: {type: 'enabled'}, stream: false});
const ids = ['19367bc7', '7e32e4a2'];
const inherited = [];
let changed = null;
for (const id of ids) {
  const old = r2.rows.find(row => row.id === id);
  const current = r3.rows.find(row => row.id === id);
  need(old && current && !current.question_image && current.question === old.question,
    'pair-identity');
  for (const arm of ['control', 'treatment']) {
    const ordinal = inherited.length + (changed ? 2 : 1);
    const expectedIndex = id === ids[0] ? (arm === 'control' ? 0 : 1) :
      (arm === 'control' ? 2 : 3);
    const oldSha = sha(JSON.stringify(makeRequest(old, arm)));
    need(oldSha === r2Freeze.ordered_requests[expectedIndex].request_sha256,
      'predecessor-request');
    const next = makeRequest(current, arm);
    const nextSha = sha(JSON.stringify(next));
    if (id === '7e32e4a2' && arm === 'treatment') {
      need(nextSha !== oldSha && current.arms[arm].view_kind ===
        'source-grounded-item-form-comparison', 'single-delta');
      changed = {question_id: id, arm, request: next, request_sha256: nextSha};
    } else {
      need(nextSha === oldSha, 'unexpected-delta');
      inherited.push({question_id: id, arm, predecessor_ordinal: expectedIndex + 1,
        request_sha256: nextSha,
        answer_sha256: r2Result.answer_rows[expectedIndex].answer_sha256,
        predecessor_raw_sha256: r2Result.answer_rows[expectedIndex].raw_sha256});
    }
  }
}
need(changed && inherited.length === 3, 'delta-cardinality');
const {createVpsLocalPost, verifyHen11VpsTopology} =
  await import(pathToFileURL(helperPath).href);
const topology = verifyHen11VpsTopology();
await mkdir(root);
const freeze = {schema_version: 'are.g03-lme-v2-dev-form-delta-r3-freeze/v1',
  status: 'frozen-before-provider-calls', r3_wire_sha256: sha(r3Bytes),
  r2_wire_sha256: sha(r2Bytes), predecessor_result_sha256: sha(r2ResultBytes),
  helper_sha256: sha(await readFile(helperPath)),
  runner_sha256: sha(await readFile(new URL(import.meta.url))),
  provider_host_fingerprint_sha256: topology.host_fingerprint_sha256,
  inherited, changed: {question_id: changed.question_id, arm: changed.arm,
    request_sha256: changed.request_sha256},
  model: 'glm-5.3-flash', max_tokens: 512, context_window_tokens: 8192,
  maximum_tokenizer_calls: 1, maximum_generation_calls: 1,
  automatic_retries: 0, evaluator_fields_used: false,
  claim_ceiling: 'Two exposed development pairs; no superiority claim'};
const freezeBytes = Buffer.from(`${JSON.stringify(freeze, null, 2)}\n`);
await writeFile(`${root}/FREEZE.json`, freezeBytes, {flag: 'wx', mode: 0o600});
const post = createVpsLocalPost();
const tokenBody = JSON.stringify({model: changed.request.model,
  messages: changed.request.messages});
const startedToken = Date.now();
let tokenResponse;
try {
  const response = await post(new URL('https://api.z.ai/api/paas/v4/tokenizer'),
    tokenBody, {apiKey: 'container-owned-marker', timeout_ms: 30000,
      maximum_response_bytes: 65536});
  tokenResponse = {status: response.status, payload: response.payload, bytes: response.bytes};
} catch (error) {
  tokenResponse = {status: null, error: String(error?.message ?? 'transport-error')
    .replace(/[^A-Za-z0-9_.:-]/g, '').slice(0, 120)};
}
const count = tokenResponse.payload?.usage?.prompt_tokens;
const token = {schema_version: 'are.g03-lme-v2-dev-r3-tokenizer/v1',
  request_sha256: changed.request_sha256, status: tokenResponse.status,
  prompt_tokens: Number.isSafeInteger(count) ? count : null,
  admitted_8k: tokenResponse.status === 200 && Number.isSafeInteger(count) &&
    count > 0 && count + 512 <= 8192,
  elapsed_ms: Date.now() - startedToken, response: tokenResponse};
const tokenBytes = Buffer.from(`${JSON.stringify(token, null, 2)}\n`);
await writeFile(`${root}/TOKENIZER.json`, tokenBytes, {flag: 'wx', mode: 0o600});
let answer = null;
if (token.admitted_8k) {
  const body = JSON.stringify(changed.request);
  const started = Date.now();
  let response;
  try {
    const delivered = await post(new URL('https://api.z.ai/api/paas/v4/chat/completions'),
      body, {apiKey: 'container-owned-marker', timeout_ms: 120000,
        maximum_response_bytes: 131072});
    response = {status: delivered.status, payload: delivered.payload,
      bytes: delivered.bytes};
  } catch (error) {
    response = {status: null, error: String(error?.message ?? 'transport-error')
      .replace(/[^A-Za-z0-9_.:-]/g, '').slice(0, 120)};
  }
  const raw = {schema_version: 'are.g03-lme-v2-dev-r3-attempt/v1',
    question_id: changed.question_id, arm: changed.arm,
    request_sha256: sha(body), elapsed_ms: Date.now() - started, response};
  const rawBytes = Buffer.from(`${JSON.stringify(raw, null, 2)}\n`);
  await writeFile(`${root}/ATTEMPT.json`, rawBytes, {flag: 'wx', mode: 0o600});
  const text = response.payload?.choices?.[0]?.message?.content;
  answer = {status: response.status,
    valid: response.status === 200 && typeof text === 'string' && text.trim().length > 0,
    answer_sha256: typeof text === 'string' ? sha(text) : null,
    prompt_tokens: response.payload?.usage?.prompt_tokens ?? null,
    completion_tokens: response.payload?.usage?.completion_tokens ?? null,
    elapsed_ms: raw.elapsed_ms, raw_sha256: sha(rawBytes)};
}
const result = {schema_version: 'are.g03-lme-v2-dev-form-delta-r3-result/v1',
  status: token.admitted_8k && answer?.valid ? 'completed-one-development-delta' :
    'terminal-incomplete', freeze_sha256: sha(freezeBytes),
  tokenizer_sha256: sha(tokenBytes), tokenizer_admitted: token.admitted_8k,
  answer, generation_calls: answer ? 1 : 0, evaluator_fields_used: false,
  claim_ceiling: 'Two exposed development pairs; no superiority claim'};
const resultBytes = Buffer.from(`${JSON.stringify(result, null, 2)}\n`);
await writeFile(`${root}/RESULT.json`, resultBytes, {flag: 'wx', mode: 0o600});
process.stdout.write(`${JSON.stringify({status: result.status,
  tokenizer_admitted: result.tokenizer_admitted,
  generation_calls: result.generation_calls,
  valid_answer: Boolean(result.answer?.valid),
  result_sha256: sha(resultBytes)})}\n`);
if (result.status !== 'completed-one-development-delta') process.exitCode = 2;
