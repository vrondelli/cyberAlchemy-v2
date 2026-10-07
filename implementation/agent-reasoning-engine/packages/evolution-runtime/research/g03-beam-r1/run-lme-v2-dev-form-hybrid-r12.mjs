// One changed exposed development answer; all other requests inherit identical receipts.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const sha = value => createHash('sha256').update(value).digest('hex');
const need = (value, code) => { if (!value) throw Error(`g03-v2-form-r12.${code}`); };
const [wirePath, priorPath, helperPath, root] = process.argv.slice(2);
need(process.argv.length === 6 && [wirePath, priorPath, helperPath, root].every(path =>
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+$/.test(path ?? '') &&
  !path.includes('/../')), 'arguments');
const [wireBytes, priorBytes] = await Promise.all([readFile(wirePath), readFile(priorPath)]);
need(sha(wireBytes) === 'a4acebf4dde831d8fbc249f364b4b266bdace8a74d8e0aca295672108e14ebbd' &&
  sha(priorBytes) === 'ec1c38232e217281958ad9976c2d519012c75882cd3de26962856573ed6eb9a5',
  'wire-drift');
const wire = JSON.parse(wireBytes), prior = JSON.parse(priorBytes);
need(wire.schema_version === 'are.g03-lme-v2-dev-form-hybrid-r12/v1' &&
  wire.parent_wire_sha256 === sha(priorBytes) && wire.rows.length === 28 &&
  prior.rows.length === 28 && wire.gold_fields_used_by_builder === false &&
  wire.confirmation_question_fields_selected_or_emitted === false &&
  JSON.stringify(wire.changed_treatment_question_ids) ===
    JSON.stringify(['19367bc7', '7e32e4a2']), 'wire-schema');
for (let i = 0; i < 28; i++) {
  const row = wire.rows[i], before = prior.rows[i];
  need(row.id === before.id && row.question === before.question &&
    row.question_image === before.question_image &&
    JSON.stringify(row.arms.control) === JSON.stringify(before.arms.control) &&
    sha(row.arms.treatment.evidence) === row.arms.treatment.evidence_sha256 &&
    row.arms.treatment.evidence.length <= 12000, 'pair-binding');
  if (!wire.changed_treatment_question_ids.includes(row.id))
    need(JSON.stringify(row.arms.treatment) === JSON.stringify(before.arms.treatment),
      'unchanged-treatment-drift');
}
const row = wire.rows.find(item => item.id === '19367bc7');
need(row && !row.question_image &&
  row.arms.treatment.view_kind === 'observed-integration-field-on-listed-form',
  'selected-answer');
const system = 'Answer the question using only the supplied prior agent-trajectory evidence. If the evidence is insufficient, state that you do not know. Follow the requested final-answer format. Do not invent details.';
const prompt = `Prior agent-trajectory evidence:\n${row.arms.treatment.evidence}\n\nQuestion:\n${row.question}`;
const request = {model: 'glm-5.3-flash', messages: [
  {role: 'system', content: system}, {role: 'user', content: prompt},
], max_tokens: 2048, reasoning_effort: 'low',
thinking: {type: 'enabled'}, stream: false};
const requestSha = sha(JSON.stringify(request));
const {createVpsLocalPost, verifyHen11VpsTopology} =
  await import(pathToFileURL(helperPath).href);
const topology = verifyHen11VpsTopology();
need(sha(await readFile(helperPath)) ===
  'deafaf7bc91d5cac29c070781519a996975d6c684d2035c83d09dd2dd584194e',
  'helper-drift');
await mkdir(root);
const freeze = {schema_version: 'are.g03-lme-v2-dev-form-r12-freeze/v1',
  status: 'frozen-before-provider-calls', wire_sha256: sha(wireBytes),
  prior_wire_sha256: sha(priorBytes), question_id: row.id,
  request_sha256: requestSha, helper_sha256: sha(await readFile(helperPath)),
  runner_sha256: sha(await readFile(new URL(import.meta.url))),
  provider_host_fingerprint_sha256: topology.host_fingerprint_sha256,
  model: 'glm-5.3-flash', max_tokens: 2048, context_window_tokens: 8192,
  maximum_tokenizer_calls: 1, maximum_generation_calls: 1, automatic_retries: 0,
  invalid_answer_policy: 'retain as incorrect; no retry', evaluator_fields_used: false,
  claim_ceiling: 'Exposed development answer only; no confirmation or superiority claim'};
const freezeBytes = Buffer.from(`${JSON.stringify(freeze, null, 2)}\n`);
await writeFile(`${root}/FREEZE.json`, freezeBytes, {flag: 'wx', mode: 0o600});
const post = createVpsLocalPost();
const tokenizer = new URL('https://api.z.ai/api/paas/v4/tokenizer');
const completion = new URL('https://api.z.ai/api/paas/v4/chat/completions');
async function deliver(url, body, timeout_ms, maximum_response_bytes) {
  const started = Date.now();
  let response;
  try {
    const result = await post(url, body, {apiKey: 'container-owned-marker',
      timeout_ms, maximum_response_bytes});
    response = {status: result.status, payload: result.payload, bytes: result.bytes};
  } catch (error) {
    response = {status: null, error: String(error?.message ?? 'transport-error')
      .replace(/[^A-Za-z0-9_.:-]/g, '').slice(0, 120)};
  }
  return {response, elapsed_ms: Date.now() - started};
}
const tokenDelivery = await deliver(tokenizer, JSON.stringify({
  model: request.model, messages: request.messages}), 30000, 65536);
const tokenCount = tokenDelivery.response.payload?.usage?.prompt_tokens;
const token = {schema_version: 'are.g03-lme-v2-dev-form-r12-tokenizer/v1',
  question_id: row.id, request_sha256: requestSha,
  prompt_tokens: Number.isSafeInteger(tokenCount) ? tokenCount : null,
  admitted_8k: tokenDelivery.response.status === 200 &&
    Number.isSafeInteger(tokenCount) && tokenCount > 0 && tokenCount + 2048 <= 8192,
  ...tokenDelivery};
const tokenBytes = Buffer.from(`${JSON.stringify(token, null, 2)}\n`);
await writeFile(`${root}/TOKENIZER-01.json`, tokenBytes, {flag: 'wx', mode: 0o600});
let attempt = null, attemptBytes = null;
if (token.admitted_8k) {
  const delivery = await deliver(completion, JSON.stringify(request), 120000, 131072);
  attempt = {schema_version: 'are.g03-lme-v2-dev-form-r12-attempt/v1',
    question_id: row.id, request_sha256: requestSha, ...delivery};
  attemptBytes = Buffer.from(`${JSON.stringify(attempt, null, 2)}\n`);
  await writeFile(`${root}/ATTEMPT-01.json`, attemptBytes, {flag: 'wx', mode: 0o600});
}
const answer = attempt?.response.payload?.choices?.[0]?.message?.content;
const finish = attempt?.response.payload?.choices?.[0]?.finish_reason;
const usage = attempt?.response.payload?.usage;
const valid = attempt?.response.status === 200 && typeof answer === 'string' &&
  answer.trim().length > 0 && finish !== 'length' &&
  Number.isSafeInteger(usage?.prompt_tokens) &&
  Number.isSafeInteger(usage?.completion_tokens) &&
  usage.prompt_tokens + usage.completion_tokens <= 8192;
const result = {schema_version: 'are.g03-lme-v2-dev-form-r12-result/v1',
  status: attempt ? 'completed-one-exposed-development-answer' : 'tokenizer-not-admitted',
  freeze_sha256: sha(freezeBytes), token_raw_sha256: sha(tokenBytes),
  attempt_raw_sha256: attemptBytes ? sha(attemptBytes) : null,
  tokenizer_calls: 1, generation_calls: attempt ? 1 : 0,
  admitted_8k: token.admitted_8k, valid_answer: valid,
  answer_sha256: typeof answer === 'string' ? sha(answer) : null,
  prompt_tokens: usage?.prompt_tokens ?? null,
  completion_tokens: usage?.completion_tokens ?? null,
  finish_reason: finish ?? null, elapsed_ms: attempt?.elapsed_ms ?? null,
  claim_ceiling: freeze.claim_ceiling};
const bytes = Buffer.from(`${JSON.stringify(result, null, 2)}\n`);
await writeFile(`${root}/RESULT.json`, bytes, {flag: 'wx', mode: 0o600});
process.stdout.write(`${JSON.stringify({status: result.status,
  admitted_8k: result.admitted_8k, valid_answer: result.valid_answer,
  result_sha256: sha(bytes)})}\n`);
if (!attempt) process.exitCode = 2;
