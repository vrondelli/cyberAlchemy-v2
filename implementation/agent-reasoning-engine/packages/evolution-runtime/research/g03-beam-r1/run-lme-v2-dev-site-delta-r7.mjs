// Run only the ten changed treatment packets in the exposed V2 development set.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const sha = value => createHash('sha256').update(value).digest('hex');
const need = (value, code) => { if (!value) throw Error(`g03-v2-dev-site-r7b.${code}`); };
const [newWirePath, oldWirePath, imageDir, helperPath, root] = process.argv.slice(2);
need(process.argv.length === 7 && [newWirePath, oldWirePath, imageDir,
  helperPath, root].every(path =>
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+$/.test(path ?? '') &&
  !path.includes('/../')), 'arguments');
const [newBytes, oldBytes] = await Promise.all([readFile(newWirePath), readFile(oldWirePath)]);
need(sha(newBytes) === 'dc0896dd41756d35ddb4645a4f5598b2761bd0a760e547e0c37744caa6ccf97d' &&
  sha(oldBytes) === '4389fc85179fe99aeae9faa91e59bbfb3d37b90c6e542611edb405f69d38593b',
  'wire-drift');
const wire = JSON.parse(newBytes), old = JSON.parse(oldBytes);
need(wire.schema_version === 'are.g03-lme-v2-dev-query-site-scope-r7/v1' &&
  wire.parent_wire_sha256 === sha(oldBytes) && wire.rows.length === old.rows.length &&
  wire.rows.length === 28 && wire.changed_treatment_question_ids.length === 10 &&
  wire.gold_fields_used_by_builder === false &&
  wire.confirmation_question_fields_selected_or_emitted === false, 'wire-schema');
const changed = new Set(wire.changed_treatment_question_ids);
for (let index = 0; index < 28; index++) {
  const row = wire.rows[index], before = old.rows[index];
  need(row.id === before.id && row.question === before.question &&
    row.question_image === before.question_image &&
    JSON.stringify(row.arms.control) === JSON.stringify(before.arms.control) &&
    (changed.has(row.id) ? row.arms.treatment.evidence_sha256 !==
      before.arms.treatment.evidence_sha256 : row.arms.treatment.evidence_sha256 ===
      before.arms.treatment.evidence_sha256), 'pair-binding');
}
const imageDigests = {
  '0574c69a': '62f19636923def38517feb066afb327338012215eeecde2f63b358aaede11c45',
  '1e77eb4b': '196b973d7cac067e76cf19f8ddff1cd7602739d4940e974d9154704f5d63eb3d',
  '2f6a21cd': 'a77eaead88f1224bbb6f5c0ad6cd85b65ed9d608def25b1d2e93caf43cc80a25',
  '302bf60e': '3676a0004d85cfd55ceebf250af4ad1d178af440373779fd18b4aa86f6601e1e',
};
const imageBodies = new Map();
for (const id of changed) {
  if (!imageDigests[id]) continue;
  const bytes = await readFile(`${imageDir}/${id}.png`);
  need(sha(bytes) === imageDigests[id], 'image-drift');
  imageBodies.set(id, `data:image/png;base64,${bytes.toString('base64')}`);
}
const system = 'Answer the question using only the supplied prior agent-trajectory evidence. If the evidence is insufficient, state that you do not know. Follow the requested final-answer format. Do not invent details.';
const requests = [];
for (const row of wire.rows) {
  if (!changed.has(row.id)) continue;
  need(Boolean(row.question_image) === imageBodies.has(row.id), 'image-partition');
  const evidence = row.arms.treatment.evidence;
  need(sha(evidence) === row.arms.treatment.evidence_sha256, 'evidence-drift');
  const prompt = `Prior agent-trajectory evidence:\n${evidence}\n\nQuestion:\n${row.question}`;
  const content = row.question_image ? [
    {type: 'text', text: prompt},
    {type: 'image_url', image_url: {url: imageBodies.get(row.id)}},
  ] : prompt;
  const request = {model: 'glm-5.3-flash', messages: [
    {role: 'system', content: system}, {role: 'user', content},
  ], max_tokens: 2048, reasoning_effort: 'low',
  thinking: {type: 'enabled'}, stream: false};
  need(Buffer.byteLength(JSON.stringify(request)) < 280000, 'request-size');
  requests.push({question_id: row.id, request, request_sha256: sha(JSON.stringify(request))});
}
need(requests.length === 10, 'changed-count');
const {createVpsLocalPost, verifyHen11VpsTopology} =
  await import(pathToFileURL(helperPath).href);
const topology = verifyHen11VpsTopology();
await mkdir(root);
const freeze = {schema_version: 'are.g03-lme-v2-dev-site-r7b-freeze/v1',
  status: 'frozen-before-provider-calls', wire_sha256: sha(newBytes),
  parent_wire_sha256: sha(oldBytes),
  ordered_requests: requests.map(({question_id, request_sha256}) =>
    ({question_id, request_sha256})),
  image_sha256: Object.fromEntries([...imageBodies.keys()].map(id => [id, imageDigests[id]])),
  helper_sha256: sha(await readFile(helperPath)),
  runner_sha256: sha(await readFile(new URL(import.meta.url))),
  provider_host_fingerprint_sha256: topology.host_fingerprint_sha256,
  model: 'glm-5.3-flash', max_tokens: 2048, context_window_tokens: 8192,
  maximum_tokenizer_calls: 10, maximum_generation_calls: 10, automatic_retries: 0,
  invalid_answer_policy: 'retain as incorrect; no retry',
  evaluator_fields_used: false,
  claim_ceiling: 'Exposed development answer delta only; no independent or full-benchmark superiority claim'};
const freezeBytes = Buffer.from(`${JSON.stringify(freeze, null, 2)}\n`);
await writeFile(`${root}/FREEZE.json`, freezeBytes, {flag: 'wx', mode: 0o600});
const post = createVpsLocalPost();
const tokenizer = new URL('https://api.z.ai/api/paas/v4/tokenizer');
const completion = new URL('https://api.z.ai/api/paas/v4/chat/completions');
const tokens = [];
for (const [index, entry] of requests.entries()) {
  const body = JSON.stringify({model: entry.request.model, messages: entry.request.messages});
  const started = Date.now();
  let response;
  try {
    const delivered = await post(tokenizer, body,
      {apiKey: 'container-owned-marker', timeout_ms: 30000,
        maximum_response_bytes: 65536});
    response = {status: delivered.status, payload: delivered.payload, bytes: delivered.bytes};
  } catch (error) {
    response = {status: null, error: String(error?.message ?? 'transport-error')
      .replace(/[^A-Za-z0-9_.:-]/g, '').slice(0, 120)};
  }
  const count = response.payload?.usage?.prompt_tokens;
  const raw = {schema_version: 'are.g03-lme-v2-dev-site-r7b-tokenizer/v1',
    ordinal: index + 1, question_id: entry.question_id,
    request_sha256: entry.request_sha256, status: response.status,
    prompt_tokens: Number.isSafeInteger(count) ? count : null,
    admitted_8k: response.status === 200 && Number.isSafeInteger(count) &&
      count > 0 && count + 2048 <= 8192,
    elapsed_ms: Date.now() - started, response};
  const bytes = Buffer.from(`${JSON.stringify(raw, null, 2)}\n`);
  await writeFile(`${root}/TOKENIZER-${String(index + 1).padStart(2, '0')}.json`,
    bytes, {flag: 'wx', mode: 0o600});
  tokens.push({ordinal: raw.ordinal, question_id: raw.question_id,
    admitted_8k: raw.admitted_8k, prompt_tokens: raw.prompt_tokens,
    raw_sha256: sha(bytes)});
  if (!raw.admitted_8k) break;
}
const answers = [];
if (tokens.length === 10 && tokens.every(row => row.admitted_8k)) {
  for (const [index, entry] of requests.entries()) {
    const body = JSON.stringify(entry.request);
    const started = Date.now();
    let response;
    try {
      const delivered = await post(completion, body,
        {apiKey: 'container-owned-marker', timeout_ms: 120000,
          maximum_response_bytes: 131072});
      response = {status: delivered.status, payload: delivered.payload, bytes: delivered.bytes};
    } catch (error) {
      response = {status: null, error: String(error?.message ?? 'transport-error')
        .replace(/[^A-Za-z0-9_.:-]/g, '').slice(0, 120)};
    }
    const raw = {schema_version: 'are.g03-lme-v2-dev-site-r7b-attempt/v1',
      ordinal: index + 1, question_id: entry.question_id,
      request_sha256: entry.request_sha256, elapsed_ms: Date.now() - started, response};
    const bytes = Buffer.from(`${JSON.stringify(raw, null, 2)}\n`);
    await writeFile(`${root}/ATTEMPT-${String(index + 1).padStart(2, '0')}.json`,
      bytes, {flag: 'wx', mode: 0o600});
    const answer = response.payload?.choices?.[0]?.message?.content;
    const finish = response.payload?.choices?.[0]?.finish_reason;
    const usage = response.payload?.usage;
    answers.push({ordinal: index + 1, question_id: entry.question_id,
      status: response.status,
      valid: response.status === 200 && typeof answer === 'string' &&
        answer.trim().length > 0 && finish !== 'length' &&
        Number.isSafeInteger(usage?.prompt_tokens) &&
        Number.isSafeInteger(usage?.completion_tokens) &&
        usage.prompt_tokens + usage.completion_tokens <= 8192,
      answer_sha256: typeof answer === 'string' ? sha(answer) : null,
      prompt_tokens: usage?.prompt_tokens ?? null,
      completion_tokens: usage?.completion_tokens ?? null,
      finish_reason: finish ?? null, elapsed_ms: raw.elapsed_ms,
      raw_sha256: sha(bytes)});
  }
}
const result = {schema_version: 'are.g03-lme-v2-dev-site-r7b-result/v1',
  status: answers.length === 10 ? 'completed-10-changed-development-treatments' :
    'terminal-incomplete', freeze_sha256: sha(freezeBytes),
  tokenizer_rows: tokens, answer_rows: answers,
  tokenizer_calls: tokens.length, generation_calls: answers.length,
  valid_answers: answers.filter(row => row.valid).length,
  invalid_answers: answers.filter(row => !row.valid).length,
  known_prompt_tokens: answers.reduce((sum, row) => sum + (row.prompt_tokens ?? 0), 0),
  known_completion_tokens: answers.reduce((sum, row) => sum + (row.completion_tokens ?? 0), 0),
  claim_ceiling: freeze.claim_ceiling};
const resultBytes = Buffer.from(`${JSON.stringify(result, null, 2)}\n`);
await writeFile(`${root}/RESULT.json`, resultBytes, {flag: 'wx', mode: 0o600});
process.stdout.write(`${JSON.stringify({status: result.status,
  tokenizer_calls: result.tokenizer_calls, generation_calls: result.generation_calls,
  valid_answers: result.valid_answers, invalid_answers: result.invalid_answers,
  result_sha256: sha(resultBytes)})}\n`);
if (result.status !== 'completed-10-changed-development-treatments') process.exitCode = 2;
