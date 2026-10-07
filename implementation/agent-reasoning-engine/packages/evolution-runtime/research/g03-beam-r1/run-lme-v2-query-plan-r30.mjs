// Frozen question-only query decomposition, without reference/evaluator access.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const sha = value => createHash('sha256').update(value).digest('hex');
const need = (value, code) => { if (!value) throw Error(`g03-v2-query-plan-r30.${code}`); };
const [wirePath, imageDir, helperPath, root] = process.argv.slice(2);
need(process.argv.length === 6 && [wirePath, imageDir, helperPath, root].every(path =>
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+$/.test(path ?? '') &&
  !path.includes('/../')), 'arguments');
const wireBytes = await readFile(wirePath);
need(sha(wireBytes) === 'f57e18ac2354bd6e346d7e39bfb41eea162da1784864495692253c6a7d20407d', 'wire-drift');
const wire = JSON.parse(wireBytes);
need(wire.schema_version === 'are.g03-lme-v2-query-plan-wires-r30/v1' &&
  wire.rows.length === 26 && wire.gold_fields_used_by_builder === false &&
  wire.question_type_labels_used_by_builder === false &&
  wire.confirmation_question_fields_selected_or_emitted === false, 'wire-schema');
const images = {
  '7586cf7c': 'aff0665a68d29a2414d4a12ab21e1905de9a55087f2384f08fc9cf5bae587d47',
  'af2ebaed': '43b4ef22be21d6869aa3681637ada80f0d8d0ffd6e635d0e58957c099e5f28e9',
  '1d864942': 'cf1f053f4f0702daefef59a861ac1e771910c8354e059d825ac566103c63f1b4',
  '77258cda': 'a48baf68f1fac917314904b1f7e129d09ea192ca03c659eebe0d75e2774e84c3',
};
const imageBodies = new Map();
for (const [id, expected] of Object.entries(images)) {
  const bytes = await readFile(`${imageDir}/${id}.png`);
  need(sha(bytes) === expected, `image-drift-${id}`);
  imageBodies.set(id, `data:image/png;base64,${bytes.toString('base64')}`);
}
const system = `You prepare retrieval queries for a memory of past web-agent trajectories. You do not answer the user's question. Return exactly one JSON object, no markdown or prose, with these keys:
{"raw_state_queries":["..."],"event_query":"...","note_query":"...","answer_operator":"..."}
raw_state_queries: 1-4 short searches for exact UI pages, records, entities, fields, values, control groups, or compared surfaces. Keep distinct surfaces separate. event_query: a short search for a before/after action, navigation, revealed content, failure, or confirmation when needed; otherwise empty. note_query: a short search for reusable procedure, prerequisite, pitfall, or premise knowledge when needed; otherwise empty. answer_operator must be one of exact_set, ordered_neighbor, count, comparison, multiple_choice, premise_check, procedure, fact. Preserve literal entity and UI names. If the question has multiple-choice options, ignore the option letters and do not merely repeat the options. Do not infer the answer, fabricate a page, or include a claim of correctness.`;
const requests = [];
for (const row of [...wire.rows].sort((a, b) => a.question_id.localeCompare(b.question_id))) {
  need(sha(row.question) === row.question_sha256 &&
    Boolean(row.question_image) === imageBodies.has(row.question_id) &&
    (!row.question_image || row.question_image === `question_screenshots/${row.question_id}.png`),
    'question-binding');
  const prompt = `Plan retrieval for this question only:\n${row.question}`;
  const content = row.question_image ? [
    {type: 'text', text: prompt},
    {type: 'image_url', image_url: {url: imageBodies.get(row.question_id)}},
  ] : prompt;
  const request = {model: 'glm-5.3-flash', messages: [
    {role: 'system', content: system}, {role: 'user', content},
  ], max_tokens: 768, reasoning_effort: 'low', thinking: {type: 'enabled'}, stream: false};
  need(Buffer.byteLength(JSON.stringify(request)) < 280000, 'request-size');
  requests.push({question_id: row.question_id, request,
    request_sha256: sha(JSON.stringify(request))});
}
need(requests.length === 26, 'request-count');
const {createVpsLocalPost, verifyHen11VpsTopology} = await import(pathToFileURL(helperPath).href);
const topology = verifyHen11VpsTopology();
need(sha(await readFile(helperPath)) ===
  'deafaf7bc91d5cac29c070781519a996975d6c684d2035c83d09dd2dd584194e', 'helper-drift');
await mkdir(root);
const freeze = {schema_version: 'are.g03-lme-v2-query-plan-r30-freeze/v1',
  status: 'frozen-before-provider-calls', wire_sha256: sha(wireBytes),
  image_sha256: images, system_prompt_sha256: sha(system),
  helper_sha256: sha(await readFile(helperPath)),
  runner_sha256: sha(await readFile(new URL(import.meta.url))),
  provider_host_fingerprint_sha256: topology.host_fingerprint_sha256,
  ordered_requests: requests.map(({question_id, request_sha256}) =>
    ({question_id, request_sha256})),
  model: 'glm-5.3-flash', max_tokens: 768, context_window_tokens: 8192,
  maximum_tokenizer_calls: 26, maximum_generation_calls: 26,
  automatic_retries: 0, evaluator_fields_used: false,
  claim_ceiling: 'Question-only exposed-development retrieval plans; no answer or superiority'};
const freezeBytes = Buffer.from(`${JSON.stringify(freeze, null, 2)}\n`);
await writeFile(`${root}/FREEZE.json`, freezeBytes, {flag: 'wx', mode: 0o600});
const post = createVpsLocalPost();
const tokenizer = new URL('https://api.z.ai/api/paas/v4/tokenizer');
const completion = new URL('https://api.z.ai/api/paas/v4/chat/completions');
const tokens = [];
for (const [index, entry] of requests.entries()) {
  const started = Date.now();
  let response;
  try {
    const delivered = await post(tokenizer, JSON.stringify({model: entry.request.model,
      messages: entry.request.messages}), {apiKey: 'container-owned-marker', timeout_ms: 30000,
      maximum_response_bytes: 65536});
    response = {status: delivered.status, payload: delivered.payload, bytes: delivered.bytes};
  } catch (error) {
    response = {status: null, error: String(error?.message ?? 'transport-error')
      .replace(/[^A-Za-z0-9_.:-]/g, '').slice(0, 120)};
  }
  const count = response.payload?.usage?.prompt_tokens;
  const raw = {schema_version: 'are.g03-lme-v2-query-plan-r30-tokenizer/v1',
    ordinal: index + 1, question_id: entry.question_id,
    request_sha256: entry.request_sha256, status: response.status,
    prompt_tokens: Number.isSafeInteger(count) ? count : null,
    admitted_8k: response.status === 200 && Number.isSafeInteger(count) &&
      count > 0 && count + 768 <= 8192,
    elapsed_ms: Date.now() - started, response};
  const bytes = Buffer.from(`${JSON.stringify(raw, null, 2)}\n`);
  await writeFile(`${root}/TOKENIZER-${String(index + 1).padStart(2, '0')}.json`,
    bytes, {flag: 'wx', mode: 0o600});
  tokens.push({ordinal: raw.ordinal, question_id: raw.question_id,
    admitted_8k: raw.admitted_8k, prompt_tokens: raw.prompt_tokens,
    raw_sha256: sha(bytes)});
  if (!raw.admitted_8k) break;
}
const plans = [];
if (tokens.length === 26 && tokens.every(row => row.admitted_8k)) {
  for (const [index, entry] of requests.entries()) {
    const started = Date.now();
    let response;
    try {
      const delivered = await post(completion, JSON.stringify(entry.request),
        {apiKey: 'container-owned-marker', timeout_ms: 120000,
          maximum_response_bytes: 131072});
      response = {status: delivered.status, payload: delivered.payload, bytes: delivered.bytes};
    } catch (error) {
      response = {status: null, error: String(error?.message ?? 'transport-error')
        .replace(/[^A-Za-z0-9_.:-]/g, '').slice(0, 120)};
    }
    const raw = {schema_version: 'are.g03-lme-v2-query-plan-r30-attempt/v1',
      ordinal: index + 1, question_id: entry.question_id,
      request_sha256: entry.request_sha256, elapsed_ms: Date.now() - started, response};
    const bytes = Buffer.from(`${JSON.stringify(raw, null, 2)}\n`);
    await writeFile(`${root}/ATTEMPT-${String(index + 1).padStart(2, '0')}.json`,
      bytes, {flag: 'wx', mode: 0o600});
    const content = response.payload?.choices?.[0]?.message?.content;
    const finish = response.payload?.choices?.[0]?.finish_reason;
    const usage = response.payload?.usage;
    plans.push({ordinal: index + 1, question_id: entry.question_id,
      response_valid: response.status === 200 && typeof content === 'string' &&
        content.trim().length > 0 && finish !== 'length' &&
        Number.isSafeInteger(usage?.prompt_tokens) &&
        Number.isSafeInteger(usage?.completion_tokens) &&
        usage.prompt_tokens + usage.completion_tokens <= 8192,
      content_sha256: typeof content === 'string' ? sha(content) : null,
      prompt_tokens: usage?.prompt_tokens ?? null,
      completion_tokens: usage?.completion_tokens ?? null,
      finish_reason: finish ?? null, elapsed_ms: raw.elapsed_ms,
      raw_sha256: sha(bytes)});
  }
}
const result = {schema_version: 'are.g03-lme-v2-query-plan-r30-result/v1',
  status: plans.length === 26 ? 'completed-26-query-plan-attempts' : 'terminal-incomplete',
  freeze_sha256: sha(freezeBytes), tokenizer_rows: tokens, plan_rows: plans,
  tokenizer_calls: tokens.length, generation_calls: plans.length,
  invalid_responses: plans.filter(row => !row.response_valid).length,
  claim_ceiling: freeze.claim_ceiling};
const resultBytes = Buffer.from(`${JSON.stringify(result, null, 2)}\n`);
await writeFile(`${root}/RESULT.json`, resultBytes, {flag: 'wx', mode: 0o600});
process.stdout.write(`${JSON.stringify({status: result.status,
  tokenizer_calls: result.tokenizer_calls, generation_calls: result.generation_calls,
  invalid_responses: result.invalid_responses, result_sha256: sha(resultBytes)})}\n`);
if (result.status !== 'completed-26-query-plan-attempts') process.exitCode = 2;
