// Separate 2,048-token all-28 development successor; no r3 top-up.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const sha = value => createHash('sha256').update(value).digest('hex');
const need = (value, code) => { if (!value) throw Error(`g03-v2-dev-full-r4.${code}`); };
const [wirePath, imageDir, oldFreezePath, oldResultPath, helperPath, root] =
  process.argv.slice(2);
need(process.argv.length === 8 && [wirePath, imageDir, oldFreezePath,
  oldResultPath, helperPath, root].every(path =>
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+$/.test(path ?? '') &&
  !path.includes('/../')), 'arguments');
const [wireBytes, oldFreezeBytes, oldResultBytes] = await Promise.all([
  readFile(wirePath), readFile(oldFreezePath), readFile(oldResultPath)]);
need(sha(wireBytes) === '4389fc85179fe99aeae9faa91e59bbfb3d37b90c6e542611edb405f69d38593b' &&
  sha(oldFreezeBytes) === 'd4cd6b236e08fad4c1530ad821c0a32c5ccf10de35b9f3358fb83541443c18c9' &&
  sha(oldResultBytes) === '18f23136168444088d2841ac0e48df3ae43687b0193e6172b3427e98a4b43d6b',
  'input-drift');
const wire = JSON.parse(wireBytes), oldFreeze = JSON.parse(oldFreezeBytes),
  oldResult = JSON.parse(oldResultBytes);
need(wire.schema_version === 'are.g03-lme-v2-dev-form-procedure-r3/v1' &&
  wire.rows.length === 28 && oldFreeze.ordered_requests.length === 56 &&
  oldFreeze.wire_sha256 === sha(wireBytes) &&
  oldResult.freeze_sha256 === sha(oldFreezeBytes) &&
  oldResult.status === 'terminal-incomplete' &&
  oldResult.tokenizer_rows.length === 56 &&
  oldResult.tokenizer_rows.every(row => row.admitted_8k &&
    Number.isSafeInteger(row.prompt_tokens) && row.prompt_tokens + 2048 <= 8192),
  'tokenizer-predecessor');
const images = {
  '0574c69a': '62f19636923def38517feb066afb327338012215eeecde2f63b358aaede11c45',
  '1e77eb4b': '196b973d7cac067e76cf19f8ddff1cd7602739d4940e974d9154704f5d63eb3d',
  '2f6a21cd': 'a77eaead88f1224bbb6f5c0ad6cd85b65ed9d608def25b1d2e93caf43cc80a25',
  '302bf60e': '3676a0004d85cfd55ceebf250af4ad1d178af440373779fd18b4aa86f6601e1e',
};
const imageBodies = new Map();
for (const [id, expected] of Object.entries(images)) {
  const bytes = await readFile(`${imageDir}/${id}.png`);
  need(sha(bytes) === expected, `image-drift-${id}`);
  imageBodies.set(id, `data:image/png;base64,${bytes.toString('base64')}`);
}
const system = 'Answer the question using only the supplied prior agent-trajectory evidence. If the evidence is insufficient, state that you do not know. Follow the requested final-answer format. Do not invent details.';
const requests = [];
for (const row of [...wire.rows].sort((a, b) => a.id.localeCompare(b.id))) {
  const hasImage = Boolean(row.question_image);
  need(hasImage === imageBodies.has(row.id) &&
    (!hasImage || row.question_image === `question_screenshots/${row.id}.png`),
    'image-partition');
  for (const arm of ['control', 'treatment']) {
    const evidence = row.arms[arm].evidence;
    need(typeof evidence === 'string' && evidence.length <= 12000 &&
      sha(evidence) === row.arms[arm].evidence_sha256, 'evidence-drift');
    const prompt = `Prior agent-trajectory evidence:\n${evidence}\n\nQuestion:\n${row.question}`;
    const content = hasImage ? [
      {type: 'text', text: prompt},
      {type: 'image_url', image_url: {url: imageBodies.get(row.id)}},
    ] : prompt;
    const messages = [
      {role: 'system', content: system}, {role: 'user', content},
    ];
    const predecessor = {model: 'glm-5.3-flash', messages, max_tokens: 512,
      reasoning_effort: 'low', thinking: {type: 'enabled'}, stream: false};
    const request = {model: 'glm-5.3-flash', messages, max_tokens: 2048,
      reasoning_effort: 'low', thinking: {type: 'enabled'}, stream: false};
    need(Buffer.byteLength(JSON.stringify(request)) < 280000, 'request-size');
    requests.push({question_id: row.id, arm, request,
      predecessor_sha256: sha(JSON.stringify(predecessor)),
      request_sha256: sha(JSON.stringify(request))});
  }
}
need(requests.length === 56, 'request-count');
for (const [index, entry] of requests.entries()) {
  need(oldFreeze.ordered_requests[index].question_id === entry.question_id &&
    oldFreeze.ordered_requests[index].arm === entry.arm &&
    oldFreeze.ordered_requests[index].request_sha256 === entry.predecessor_sha256 &&
    oldResult.tokenizer_rows[index].ordinal === index + 1 &&
    oldResult.tokenizer_rows[index].question_id === entry.question_id &&
    oldResult.tokenizer_rows[index].arm === entry.arm,
    'request-tokenizer-binding');
}
const {createVpsLocalPost, verifyHen11VpsTopology} =
  await import(pathToFileURL(helperPath).href);
const topology = verifyHen11VpsTopology();
await mkdir(root);
const freeze = {schema_version: 'are.g03-lme-v2-dev-full-r4-freeze/v1',
  status: 'frozen-before-successor-generation',
  wire_sha256: sha(wireBytes), predecessor_freeze_sha256: sha(oldFreezeBytes),
  predecessor_result_sha256: sha(oldResultBytes), image_sha256: images,
  helper_sha256: sha(await readFile(helperPath)),
  runner_sha256: sha(await readFile(new URL(import.meta.url))),
  provider_host_fingerprint_sha256: topology.host_fingerprint_sha256,
  ordered_requests: requests.map(({question_id, arm, predecessor_sha256, request_sha256}) =>
    ({question_id, arm, predecessor_sha256, request_sha256})),
  model: 'glm-5.3-flash', max_tokens: 2048, context_window_tokens: 8192,
  reused_tokenizer_calls: 56, new_tokenizer_calls: 0,
  maximum_generation_calls: 56, automatic_retries: 0,
  evaluator_fields_used: false,
  claim_ceiling: '28 exposed development questions only; no independent or full-benchmark superiority claim'};
const freezeBytes = Buffer.from(`${JSON.stringify(freeze, null, 2)}\n`);
await writeFile(`${root}/FREEZE.json`, freezeBytes, {flag: 'wx', mode: 0o600});
const post = createVpsLocalPost();
const endpoint = new URL('https://api.z.ai/api/paas/v4/chat/completions');
const answers = [];
for (const [index, entry] of requests.entries()) {
  const body = JSON.stringify(entry.request);
  const started = Date.now();
  let response;
  try {
    const delivered = await post(endpoint, body,
      {apiKey: 'container-owned-marker', timeout_ms: 120000,
        maximum_response_bytes: 131072});
    response = {status: delivered.status, payload: delivered.payload,
      bytes: delivered.bytes};
  } catch (error) {
    response = {status: null, error: String(error?.message ?? 'transport-error')
      .replace(/[^A-Za-z0-9_.:-]/g, '').slice(0, 120)};
  }
  const raw = {schema_version: 'are.g03-lme-v2-dev-full-r4-attempt/v1',
    ordinal: index + 1, question_id: entry.question_id, arm: entry.arm,
    request_sha256: sha(body), elapsed_ms: Date.now() - started, response};
  const rawBytes = Buffer.from(`${JSON.stringify(raw, null, 2)}\n`);
  await writeFile(`${root}/ATTEMPT-${String(index + 1).padStart(2, '0')}.json`,
    rawBytes, {flag: 'wx', mode: 0o600});
  const answer = response.payload?.choices?.[0]?.message?.content;
  const finish = response.payload?.choices?.[0]?.finish_reason;
  const usage = response.payload?.usage;
  const row = {ordinal: index + 1, question_id: entry.question_id,
    arm: entry.arm, status: response.status,
    valid: response.status === 200 && typeof answer === 'string' &&
      answer.trim().length > 0 && finish !== 'length' &&
      Number.isSafeInteger(usage?.prompt_tokens) &&
      Number.isSafeInteger(usage?.completion_tokens) &&
      usage.prompt_tokens + usage.completion_tokens <= 8192,
    answer_sha256: typeof answer === 'string' ? sha(answer) : null,
    prompt_tokens: usage?.prompt_tokens ?? null,
    completion_tokens: usage?.completion_tokens ?? null,
    reasoning_tokens: usage?.completion_tokens_details?.reasoning_tokens ?? null,
    finish_reason: finish ?? null,
    elapsed_ms: raw.elapsed_ms, raw_sha256: sha(rawBytes)};
  answers.push(row);
  if (!row.valid) break;
}
const result = {schema_version: 'are.g03-lme-v2-dev-full-r4-result/v1',
  status: answers.length === 56 && answers.every(row => row.valid) ?
    'completed-56-development-answers' : 'terminal-incomplete',
  freeze_sha256: sha(freezeBytes), answer_rows: answers,
  reused_tokenizer_calls: 56, new_tokenizer_calls: 0,
  generation_calls: answers.length, evaluator_fields_used: false,
  known_prompt_tokens: answers.reduce((sum, row) => sum + (row.prompt_tokens ?? 0), 0),
  known_completion_tokens: answers.reduce((sum, row) => sum + (row.completion_tokens ?? 0), 0),
  claim_ceiling: '28 exposed development questions only; no independent or full-benchmark superiority claim'};
const resultBytes = Buffer.from(`${JSON.stringify(result, null, 2)}\n`);
await writeFile(`${root}/RESULT.json`, resultBytes, {flag: 'wx', mode: 0o600});
process.stdout.write(`${JSON.stringify({status: result.status,
  generation_calls: result.generation_calls,
  valid_answers: answers.filter(row => row.valid).length,
  known_prompt_tokens: result.known_prompt_tokens,
  known_completion_tokens: result.known_completion_tokens,
  result_sha256: sha(resultBytes)})}\n`);
if (result.status !== 'completed-56-development-answers') process.exitCode = 2;
