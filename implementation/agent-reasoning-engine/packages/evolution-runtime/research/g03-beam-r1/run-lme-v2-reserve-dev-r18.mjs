// Frozen, zero-retry 26-pair second-development GLM reader run.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const sha = value => createHash('sha256').update(value).digest('hex');
const need = (value, code) => { if (!value) throw Error(`g03-lme-v2-reserve-r18.${code}`); };
const [wirePath, imageDir, helperPath, root] = process.argv.slice(2);
need(process.argv.length === 6 && [wirePath, imageDir, helperPath, root].every(path =>
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+$/.test(path ?? '') &&
  !path.includes('/../')), 'arguments');
const wireBytes = await readFile(wirePath);
need(sha(wireBytes) === 'f4d01912d4b95a02deec2b4f382bbcf773c8edd9886dda1839a5709335dfac21', 'wire-drift');
const wire = JSON.parse(wireBytes);
need(wire.schema_version === 'are.g03-lme-v2-reserve-dev-r18/v1' &&
  wire.rows.length === 26 && wire.gold_fields_used_by_builder === false &&
  wire.confirmation_question_fields_selected_or_emitted === false &&
  wire.cohort_sha256 === '73a339ee139501baf081e3f6f88d51836155e4cbdb4052320a58e00bc9756a20',
  'wire-schema');
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
const system = 'Answer the question using only the supplied prior agent-trajectory evidence. If the evidence is insufficient, state that you do not know. Follow the requested final-answer format. Do not invent details.';
const requests = [];
const ordered = [...wire.rows].sort((a, b) => a.id.localeCompare(b.id));
need(ordered.every((row, index) => !index || row.id !== ordered[index - 1].id), 'duplicate-id');
for (const row of ordered) {
  need(Boolean(row.question_image) === imageBodies.has(row.id) &&
    (!row.question_image || row.question_image === `question_screenshots/${row.id}.png`), 'image-partition');
  for (const arm of ['control', 'treatment']) {
    const evidence = row.arms[arm].evidence;
    need(typeof evidence === 'string' && evidence.length > 0 && evidence.length <= 12000 &&
      sha(evidence) === row.arms[arm].evidence_sha256 &&
      row.arms[arm].selection.length > 0, 'evidence');
    const prompt = `Prior agent-trajectory evidence:\n${evidence}\n\nQuestion:\n${row.question}`;
    const content = row.question_image ? [
      {type: 'text', text: prompt},
      {type: 'image_url', image_url: {url: imageBodies.get(row.id)}},
    ] : prompt;
    const request = {model: 'glm-5.3-flash', messages: [
      {role: 'system', content: system}, {role: 'user', content},
    ], max_tokens: 2048, reasoning_effort: 'low', thinking: {type: 'enabled'}, stream: false};
    need(Buffer.byteLength(JSON.stringify(request)) < 280000, 'request-size');
    requests.push({question_id: row.id, arm, request, request_sha256: sha(JSON.stringify(request))});
  }
}
need(requests.length === 52, 'request-count');
const {createVpsLocalPost, verifyHen11VpsTopology} = await import(pathToFileURL(helperPath).href);
const topology = verifyHen11VpsTopology();
await mkdir(root);
const freeze = {schema_version: 'are.g03-lme-v2-reserve-dev-r18-freeze/v1',
  status: 'frozen-before-provider-calls', wire_sha256: sha(wireBytes),
  cohort_sha256: wire.cohort_sha256, image_sha256: images,
  helper_sha256: sha(await readFile(helperPath)),
  runner_sha256: sha(await readFile(new URL(import.meta.url))),
  provider_host_fingerprint_sha256: topology.host_fingerprint_sha256,
  ordered_requests: requests.map(({question_id, arm, request_sha256}) =>
    ({question_id, arm, request_sha256})),
  model: 'glm-5.3-flash', max_tokens: 2048, context_window_tokens: 8192,
  maximum_tokenizer_calls: 52, maximum_generation_calls: 52,
  automatic_retries: 0, invalid_answer_policy: 'retain as incorrect; no retry',
  evaluator_fields_used: false,
  claim_ceiling: 'Separate 26-question reserve development only; no confirmation or superiority claim'};
const freezeBytes = Buffer.from(`${JSON.stringify(freeze, null, 2)}\n`);
await writeFile(`${root}/FREEZE.json`, freezeBytes, {flag: 'wx', mode: 0o600});
const post = createVpsLocalPost();
const tokenizer = new URL('https://api.z.ai/api/paas/v4/tokenizer');
const completion = new URL('https://api.z.ai/api/paas/v4/chat/completions');
const tokenRows = [];
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
  const raw = {schema_version: 'are.g03-lme-v2-reserve-dev-r18-tokenizer/v1',
    ordinal: index + 1, question_id: entry.question_id, arm: entry.arm,
    request_sha256: entry.request_sha256, status: response.status,
    prompt_tokens: Number.isSafeInteger(count) ? count : null,
    admitted_8k: response.status === 200 && Number.isSafeInteger(count) &&
      count > 0 && count + 2048 <= 8192,
    elapsed_ms: Date.now() - started, response};
  const bytes = Buffer.from(`${JSON.stringify(raw, null, 2)}\n`);
  await writeFile(`${root}/TOKENIZER-${String(index + 1).padStart(2, '0')}.json`,
    bytes, {flag: 'wx', mode: 0o600});
  tokenRows.push({ordinal: raw.ordinal, question_id: raw.question_id, arm: raw.arm,
    admitted_8k: raw.admitted_8k, prompt_tokens: raw.prompt_tokens,
    elapsed_ms: raw.elapsed_ms, raw_sha256: sha(bytes)});
  if (!raw.admitted_8k) break;
}
const answers = [];
if (tokenRows.length === 52 && tokenRows.every(row => row.admitted_8k)) {
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
    const raw = {schema_version: 'are.g03-lme-v2-reserve-dev-r18-attempt/v1',
      ordinal: index + 1, question_id: entry.question_id, arm: entry.arm,
      request_sha256: entry.request_sha256, elapsed_ms: Date.now() - started, response};
    const bytes = Buffer.from(`${JSON.stringify(raw, null, 2)}\n`);
    await writeFile(`${root}/ATTEMPT-${String(index + 1).padStart(2, '0')}.json`,
      bytes, {flag: 'wx', mode: 0o600});
    const answer = response.payload?.choices?.[0]?.message?.content;
    const finish = response.payload?.choices?.[0]?.finish_reason;
    const usage = response.payload?.usage;
    answers.push({ordinal: index + 1, question_id: entry.question_id,
      arm: entry.arm, status: response.status,
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
const result = {schema_version: 'are.g03-lme-v2-reserve-dev-r18-result/v1',
  status: answers.length === 52 && answers.every(row => row.valid) ?
    'completed-52-second-development-answers' : 'terminal-incomplete',
  freeze_sha256: sha(freezeBytes), tokenizer_rows: tokenRows, answer_rows: answers,
  tokenizer_calls: tokenRows.length, generation_calls: answers.length,
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
if (result.status !== 'completed-52-second-development-answers') process.exitCode = 2;
