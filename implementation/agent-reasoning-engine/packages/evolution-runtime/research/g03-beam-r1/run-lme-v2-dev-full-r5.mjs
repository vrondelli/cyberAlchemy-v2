// Complete 56 development attempts by inheriting r4's 28 terminal attempts.
// An invalid response remains invalid/incorrect; no retry or substitution.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const sha = value => createHash('sha256').update(value).digest('hex');
const need = (value, code) => { if (!value) throw Error(`g03-v2-dev-full-r5.${code}`); };
const [wirePath, imageDir, oldFreezePath, oldResultPath, oldRoot,
  helperPath, root] = process.argv.slice(2);
need(process.argv.length === 9 && [wirePath, imageDir, oldFreezePath,
  oldResultPath, oldRoot, helperPath, root].every(path =>
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+$/.test(path ?? '') &&
  !path.includes('/../')), 'arguments');
const [wireBytes, oldFreezeBytes, oldResultBytes] = await Promise.all([
  readFile(wirePath), readFile(oldFreezePath), readFile(oldResultPath)]);
need(sha(wireBytes) === '4389fc85179fe99aeae9faa91e59bbfb3d37b90c6e542611edb405f69d38593b' &&
  sha(oldFreezeBytes) === 'a47c382dc51b9b309fd11937b90ed29f8a17ae1a6ebd188f77a72988bea9f83c' &&
  sha(oldResultBytes) === '9d8a675610683bed544bd80b6c57af380942316ad54cc03416746fd1085b74ef',
  'input-drift');
const wire = JSON.parse(wireBytes), oldFreeze = JSON.parse(oldFreezeBytes),
  oldResult = JSON.parse(oldResultBytes);
need(wire.schema_version === 'are.g03-lme-v2-dev-form-procedure-r3/v1' &&
  wire.rows.length === 28 && oldFreeze.wire_sha256 === sha(wireBytes) &&
  oldFreeze.ordered_requests.length === 56 &&
  oldResult.freeze_sha256 === sha(oldFreezeBytes) &&
  oldResult.status === 'terminal-incomplete' && oldResult.answer_rows.length === 28 &&
  oldResult.answer_rows.slice(0, 27).every(row => row.valid) &&
  oldResult.answer_rows[27].ordinal === 28 &&
  oldResult.answer_rows[27].valid === false &&
  oldResult.answer_rows[27].finish_reason === 'length' &&
  oldResult.answer_rows[27].completion_tokens === 2048,
  'predecessor-status');
const inherited = [];
for (const [index, row] of oldResult.answer_rows.entries()) {
  const bytes = await readFile(`${oldRoot}/ATTEMPT-${String(index + 1).padStart(2, '0')}.json`);
  need(sha(bytes) === row.raw_sha256, 'predecessor-raw-drift');
  const raw = JSON.parse(bytes);
  need(raw.ordinal === index + 1 && raw.question_id === row.question_id &&
    raw.arm === row.arm &&
    raw.request_sha256 === oldFreeze.ordered_requests[index].request_sha256,
    'predecessor-row-drift');
  inherited.push({...row, raw_source: 'r4-terminal-root'});
}
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
  need(hasImage === imageBodies.has(row.id), 'image-partition');
  for (const arm of ['control', 'treatment']) {
    const evidence = row.arms[arm].evidence;
    need(sha(evidence) === row.arms[arm].evidence_sha256, 'evidence-drift');
    const prompt = `Prior agent-trajectory evidence:\n${evidence}\n\nQuestion:\n${row.question}`;
    const content = hasImage ? [
      {type: 'text', text: prompt},
      {type: 'image_url', image_url: {url: imageBodies.get(row.id)}},
    ] : prompt;
    const request = {model: 'glm-5.3-flash', messages: [
      {role: 'system', content: system}, {role: 'user', content},
    ], max_tokens: 2048, reasoning_effort: 'low',
    thinking: {type: 'enabled'}, stream: false};
    need(Buffer.byteLength(JSON.stringify(request)) < 280000, 'request-size');
    requests.push({question_id: row.id, arm, request,
      request_sha256: sha(JSON.stringify(request))});
  }
}
need(requests.length === 56 && requests.every((entry, index) =>
  entry.question_id === oldFreeze.ordered_requests[index].question_id &&
  entry.arm === oldFreeze.ordered_requests[index].arm &&
  entry.request_sha256 === oldFreeze.ordered_requests[index].request_sha256),
  'request-binding');
const {createVpsLocalPost, verifyHen11VpsTopology} =
  await import(pathToFileURL(helperPath).href);
const topology = verifyHen11VpsTopology();
await mkdir(root);
const freeze = {schema_version: 'are.g03-lme-v2-dev-full-r5-freeze/v1',
  status: 'frozen-before-missing-generation', wire_sha256: sha(wireBytes),
  predecessor_freeze_sha256: sha(oldFreezeBytes),
  predecessor_result_sha256: sha(oldResultBytes),
  inherited_attempts: inherited.map(row => ({ordinal: row.ordinal,
    question_id: row.question_id, arm: row.arm, valid: row.valid,
    raw_sha256: row.raw_sha256})),
  ordered_requests: requests.map(({question_id, arm, request_sha256}) =>
    ({question_id, arm, request_sha256})),
  image_sha256: images, helper_sha256: sha(await readFile(helperPath)),
  runner_sha256: sha(await readFile(new URL(import.meta.url))),
  provider_host_fingerprint_sha256: topology.host_fingerprint_sha256,
  model: 'glm-5.3-flash', max_tokens: 2048, context_window_tokens: 8192,
  inherited_attempt_count: 28, maximum_new_generation_calls: 28,
  automatic_retries: 0,
  invalid_answer_policy: 'retain as incorrect; continue other reserved development arms',
  evaluator_fields_used: false,
  claim_ceiling: '28 exposed development questions only; no independent or full-benchmark superiority claim'};
const freezeBytes = Buffer.from(`${JSON.stringify(freeze, null, 2)}\n`);
await writeFile(`${root}/FREEZE.json`, freezeBytes, {flag: 'wx', mode: 0o600});
const post = createVpsLocalPost();
const endpoint = new URL('https://api.z.ai/api/paas/v4/chat/completions');
const fresh = [];
for (let index = 28; index < 56; index++) {
  const entry = requests[index], body = JSON.stringify(entry.request);
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
  const raw = {schema_version: 'are.g03-lme-v2-dev-full-r5-attempt/v1',
    ordinal: index + 1, question_id: entry.question_id, arm: entry.arm,
    request_sha256: sha(body), elapsed_ms: Date.now() - started, response};
  const rawBytes = Buffer.from(`${JSON.stringify(raw, null, 2)}\n`);
  await writeFile(`${root}/ATTEMPT-${String(index + 1).padStart(2, '0')}.json`,
    rawBytes, {flag: 'wx', mode: 0o600});
  const answer = response.payload?.choices?.[0]?.message?.content;
  const finish = response.payload?.choices?.[0]?.finish_reason;
  const usage = response.payload?.usage;
  fresh.push({ordinal: index + 1, question_id: entry.question_id,
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
    finish_reason: finish ?? null, elapsed_ms: raw.elapsed_ms,
    raw_sha256: sha(rawBytes), raw_source: 'r5-continuation-root'});
}
const rows = [...inherited, ...fresh];
const result = {schema_version: 'are.g03-lme-v2-dev-full-r5-result/v1',
  status: rows.length === 56 ? 'completed-56-development-attempts' :
    'terminal-incomplete', freeze_sha256: sha(freezeBytes),
  answer_rows: rows, inherited_attempts: inherited.length,
  new_generation_calls: fresh.length,
  valid_answers: rows.filter(row => row.valid).length,
  invalid_answers: rows.filter(row => !row.valid).length,
  evaluator_fields_used: false,
  known_prompt_tokens: rows.reduce((sum, row) => sum + (row.prompt_tokens ?? 0), 0),
  known_completion_tokens: rows.reduce((sum, row) => sum + (row.completion_tokens ?? 0), 0),
  claim_ceiling: '28 exposed development questions only; invalid answers count incorrect; no superiority claim'};
const resultBytes = Buffer.from(`${JSON.stringify(result, null, 2)}\n`);
await writeFile(`${root}/RESULT.json`, resultBytes, {flag: 'wx', mode: 0o600});
process.stdout.write(`${JSON.stringify({status: result.status,
  inherited_attempts: result.inherited_attempts,
  new_generation_calls: result.new_generation_calls,
  valid_answers: result.valid_answers,
  invalid_answers: result.invalid_answers,
  result_sha256: sha(resultBytes)})}\n`);
if (result.status !== 'completed-56-development-attempts') process.exitCode = 2;
