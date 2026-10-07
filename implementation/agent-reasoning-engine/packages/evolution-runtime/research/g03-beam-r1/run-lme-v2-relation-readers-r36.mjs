// Four frozen, zero-retry exposed-development reader calls for r35 packets.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const sha = value => createHash('sha256').update(value).digest('hex');
const need = (value, code) => { if (!value) throw Error(`g03-v2-relation-r36.${code}`); };
const [wirePath, helperPath, root] = process.argv.slice(2);
need(process.argv.length === 5 && [wirePath, helperPath, root].every(path =>
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+$/.test(path ?? '') &&
  !path.includes('/../')), 'arguments');
const wireBytes = await readFile(wirePath);
need(sha(wireBytes) === '51ac9d781d9fa3e53d7c0cedaf96a821f60922514893c116e76e71406598e8c9',
  'wire-drift');
const wire = JSON.parse(wireBytes);
const ids = ['01307e07', '4dffe641', '83a77f9d', 'ca8e070b'];
need(wire.schema_version === 'are.g03-lme-v2-relation-packets-r35/v1' &&
  wire.status === 'exposed-second-development-source-only-not-token-qualified' &&
  wire.rows.length === 26 && wire.gold_fields_used_by_builder === false &&
  wire.confirmation_question_fields_selected_or_emitted === false &&
  JSON.stringify(wire.changed_treatment_question_ids) === JSON.stringify(ids), 'wire-schema');
const byId = new Map(wire.rows.map(row => [row.id, row]));
need(byId.size === 26, 'question-duplicates');
const system = 'Answer the question using only the supplied prior agent-trajectory evidence. If the evidence is insufficient, state that you do not know. Follow the requested final-answer format. Do not invent details.';
const requests = ids.map(id => {
  const row = byId.get(id);
  need(row && !row.question_image &&
    row.arms.treatment.view_kind === 'source-grounded-relation-packet' &&
    row.arms.treatment.evidence.length <= 12000 &&
    sha(row.arms.treatment.evidence) === row.arms.treatment.evidence_sha256,
    'selected-answer');
  const prompt = `Prior agent-trajectory evidence:\n${row.arms.treatment.evidence}\n\nQuestion:\n${row.question}`;
  const request = {model: 'glm-5.3-flash', messages: [
    {role: 'system', content: system}, {role: 'user', content: prompt},
  ], max_tokens: 2048, reasoning_effort: 'low', thinking: {type: 'enabled'}, stream: false};
  return {id, request, request_sha256: sha(JSON.stringify(request))};
});
const {createVpsLocalPost, verifyHen11VpsTopology} = await import(pathToFileURL(helperPath).href);
const topology = verifyHen11VpsTopology();
const helperSha = sha(await readFile(helperPath));
need(helperSha === 'deafaf7bc91d5cac29c070781519a996975d6c684d2035c83d09dd2dd584194e',
  'helper-drift');
await mkdir(root);
const freeze = {schema_version: 'are.g03-lme-v2-relation-r36-freeze/v1',
  status: 'frozen-before-provider-calls', wire_sha256: sha(wireBytes),
  ordered_requests: requests.map(({id, request_sha256}) => ({question_id: id, request_sha256})),
  helper_sha256: helperSha, runner_sha256: sha(await readFile(new URL(import.meta.url))),
  provider_host_fingerprint_sha256: topology.host_fingerprint_sha256,
  model: 'glm-5.3-flash', max_tokens: 2048, context_window_tokens: 8192,
  maximum_tokenizer_calls: 4, maximum_generation_calls: 4, automatic_retries: 0,
  invalid_answer_policy: 'retain as incorrect; no retry', evaluator_fields_used: false,
  claim_ceiling: 'Four already-exposed development answers; no confirmation or superiority claim'};
const freezeBytes = Buffer.from(`${JSON.stringify(freeze, null, 2)}\n`);
await writeFile(`${root}/FREEZE.json`, freezeBytes, {flag: 'wx', mode: 0o600});
const post = createVpsLocalPost();
async function deliver(url, body, timeout_ms, maximum_response_bytes) {
  const started = Date.now();
  let response;
  try {
    const result = await post(new URL(url), body,
      {apiKey: 'container-owned-marker', timeout_ms, maximum_response_bytes});
    response = {status: result.status, payload: result.payload, bytes: result.bytes};
  } catch (error) {
    response = {status: null, error: String(error?.message ?? 'transport-error')
      .replace(/[^A-Za-z0-9_.:-]/g, '').slice(0, 120)};
  }
  return {response, elapsed_ms: Date.now() - started};
}
const tokens = [];
for (const [index, entry] of requests.entries()) {
  const delivery = await deliver('https://api.z.ai/api/paas/v4/tokenizer',
    JSON.stringify({model: entry.request.model, messages: entry.request.messages}), 30000, 65536);
  const count = delivery.response.payload?.usage?.prompt_tokens;
  const raw = {schema_version: 'are.g03-lme-v2-relation-r36-tokenizer/v1',
    ordinal: index + 1, question_id: entry.id, request_sha256: entry.request_sha256,
    prompt_tokens: Number.isSafeInteger(count) ? count : null,
    admitted_8k: delivery.response.status === 200 && Number.isSafeInteger(count) &&
      count > 0 && count + 2048 <= 8192, ...delivery};
  const bytes = Buffer.from(`${JSON.stringify(raw, null, 2)}\n`);
  await writeFile(`${root}/TOKENIZER-${String(index + 1).padStart(2, '0')}.json`,
    bytes, {flag: 'wx', mode: 0o600});
  tokens.push({ordinal: index + 1, question_id: entry.id,
    admitted_8k: raw.admitted_8k, prompt_tokens: raw.prompt_tokens, raw_sha256: sha(bytes)});
  if (!raw.admitted_8k) break;
}
const answers = [];
if (tokens.length === 4 && tokens.every(row => row.admitted_8k)) {
  for (const [index, entry] of requests.entries()) {
    const delivery = await deliver('https://api.z.ai/api/paas/v4/chat/completions',
      JSON.stringify(entry.request), 120000, 131072);
    const raw = {schema_version: 'are.g03-lme-v2-relation-r36-attempt/v1',
      ordinal: index + 1, question_id: entry.id, request_sha256: entry.request_sha256,
      ...delivery};
    const bytes = Buffer.from(`${JSON.stringify(raw, null, 2)}\n`);
    await writeFile(`${root}/ATTEMPT-${String(index + 1).padStart(2, '0')}.json`,
      bytes, {flag: 'wx', mode: 0o600});
    const answer = raw.response.payload?.choices?.[0]?.message?.content;
    const finish = raw.response.payload?.choices?.[0]?.finish_reason;
    const usage = raw.response.payload?.usage;
    answers.push({ordinal: index + 1, question_id: entry.id,
      valid: raw.response.status === 200 && typeof answer === 'string' &&
        answer.trim().length > 0 && finish !== 'length' &&
        Number.isSafeInteger(usage?.prompt_tokens) &&
        Number.isSafeInteger(usage?.completion_tokens) &&
        usage.prompt_tokens + usage.completion_tokens <= 8192,
      answer_sha256: typeof answer === 'string' ? sha(answer) : null,
      prompt_tokens: usage?.prompt_tokens ?? null,
      completion_tokens: usage?.completion_tokens ?? null,
      finish_reason: finish ?? null, elapsed_ms: raw.elapsed_ms, raw_sha256: sha(bytes)});
  }
}
const result = {schema_version: 'are.g03-lme-v2-relation-r36-result/v1',
  status: answers.length === 4 && answers.every(row => row.valid) ?
    'completed-four-exposed-development-answers' : 'terminal-incomplete',
  freeze_sha256: sha(freezeBytes), tokenizer_rows: tokens, answer_rows: answers,
  tokenizer_calls: tokens.length, generation_calls: answers.length,
  valid_answers: answers.filter(row => row.valid).length,
  claim_ceiling: freeze.claim_ceiling};
const resultBytes = Buffer.from(`${JSON.stringify(result, null, 2)}\n`);
await writeFile(`${root}/RESULT.json`, resultBytes, {flag: 'wx', mode: 0o600});
process.stdout.write(`${JSON.stringify({status: result.status,
  tokenizer_calls: result.tokenizer_calls, generation_calls: result.generation_calls,
  valid_answers: result.valid_answers, result_sha256: sha(resultBytes)})}\n`);
if (result.status !== 'completed-four-exposed-development-answers') process.exitCode = 2;
