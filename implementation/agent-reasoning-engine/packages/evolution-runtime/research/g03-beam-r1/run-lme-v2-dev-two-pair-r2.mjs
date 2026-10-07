// Zero-retry r2 line-window development pilot on two already exposed questions.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const sha = value => createHash('sha256').update(value).digest('hex');
const need = (value, code) => { if (!value) throw Error(`g03-v2-dev-r2.${code}`); };
const [wirePath, helperPath, root] = process.argv.slice(2);
need(process.argv.length === 5 && [wirePath, helperPath, root].every(path =>
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+$/.test(path ?? '') &&
  !path.includes('/../')), 'arguments');
const wireBytes = await readFile(wirePath);
need(sha(wireBytes) === '99be56cad573d2eacf5ba327cb463288ba6060e80fe5eac9fceed372f7e07f05',
  'wire-drift');
const wire = JSON.parse(wireBytes);
need(wire.schema_version === 'are.g03-lme-v2-dev-line-window-r2/v1' &&
  wire.rows.length === 28 && wire.max_evidence_chars === 12000 &&
  wire.same_fields_and_character_budget === true, 'wire-schema');
const ids = ['19367bc7', '7e32e4a2'];
const requests = [];
for (const id of ids) {
  const row = wire.rows.find(item => item.id === id);
  need(row && !row.question_image, 'pilot-id');
  for (const arm of ['control', 'treatment']) {
    const evidence = row.arms[arm].evidence;
    need(row.arms[arm].selection.length === 6 &&
      evidence.length <= 12000 && sha(evidence) === row.arms[arm].evidence_sha256,
    'evidence-drift');
    const request = {model: 'glm-5.3-flash', messages: [
      {role: 'system', content: 'Answer the question using only the supplied prior agent-trajectory evidence. If the evidence is insufficient, state that you do not know. Follow the requested final-answer format. Do not invent details.'},
      {role: 'user', content: `Prior agent-trajectory evidence:\n${evidence}\n\nQuestion:\n${row.question}`},
    ], max_tokens: 512, reasoning_effort: 'low', thinking: {type: 'enabled'}, stream: false};
    requests.push({question_id: id, arm, request, request_sha256: sha(JSON.stringify(request))});
  }
}
const {createVpsLocalPost, verifyHen11VpsTopology} =
  await import(pathToFileURL(helperPath).href);
const topology = verifyHen11VpsTopology();
await mkdir(root);
const freeze = {schema_version: 'are.g03-lme-v2-dev-r2-freeze/v1',
  status: 'frozen-before-provider-calls', wire_sha256: sha(wireBytes),
  dataset_revision: wire.dataset_revision,
  index_sha256: wire.index_sha256,
  helper_sha256: sha(await readFile(helperPath)),
  runner_sha256: sha(await readFile(new URL(import.meta.url))),
  provider_host_fingerprint_sha256: topology.host_fingerprint_sha256,
  ids, arm_order: ['control', 'treatment'],
  ordered_requests: requests.map(({question_id, arm, request_sha256}) =>
    ({question_id, arm, request_sha256})),
  model: 'glm-5.3-flash', max_tokens: 512, context_window_tokens: 8192,
  maximum_tokenizer_calls: 4, maximum_generation_calls: 4,
  automatic_retries: 0, evaluator_fields_used: false,
  claim_ceiling: 'Two exposed development pairs only; no superiority claim'};
const freezeBytes = Buffer.from(`${JSON.stringify(freeze, null, 2)}\n`);
await writeFile(`${root}/FREEZE.json`, freezeBytes, {flag: 'wx', mode: 0o600});
const post = createVpsLocalPost();
const tokenizer = new URL('https://api.z.ai/api/paas/v4/tokenizer');
const completion = new URL('https://api.z.ai/api/paas/v4/chat/completions');
const tokenRows = [];
for (const [index, entry] of requests.entries()) {
  const body = JSON.stringify({model: entry.request.model,
    messages: entry.request.messages});
  let response;
  const started = Date.now();
  try {
    const delivered = await post(tokenizer, body,
      {apiKey: 'container-owned-marker', timeout_ms: 30000,
        maximum_response_bytes: 65536});
    response = {status: delivered.status, payload: delivered.payload,
      bytes: delivered.bytes};
  } catch (error) {
    response = {status: null, error: String(error?.message ?? 'transport-error')
      .replace(/[^A-Za-z0-9_.:-]/g, '').slice(0, 120)};
  }
  const count = response.payload?.usage?.prompt_tokens;
  const row = {ordinal: index + 1, question_id: entry.question_id, arm: entry.arm,
    request_sha256: entry.request_sha256, status: response.status,
    prompt_tokens: Number.isSafeInteger(count) ? count : null,
    admitted_8k: response.status === 200 && Number.isSafeInteger(count) &&
      count > 0 && count + 512 <= 8192,
    elapsed_ms: Date.now() - started, response};
  const bytes = Buffer.from(`${JSON.stringify(row, null, 2)}\n`);
  await writeFile(`${root}/TOKENIZER-${index + 1}.json`, bytes,
    {flag: 'wx', mode: 0o600});
  tokenRows.push({...row, raw_sha256: sha(bytes)});
  if (!row.admitted_8k) break;
}
const answers = [];
if (tokenRows.length === 4 && tokenRows.every(row => row.admitted_8k)) {
  for (const [index, entry] of requests.entries()) {
    const body = JSON.stringify(entry.request);
    let response;
    const started = Date.now();
    try {
      const delivered = await post(completion, body,
        {apiKey: 'container-owned-marker', timeout_ms: 120000,
          maximum_response_bytes: 131072});
      response = {status: delivered.status, payload: delivered.payload,
        bytes: delivered.bytes};
    } catch (error) {
      response = {status: null, error: String(error?.message ?? 'transport-error')
        .replace(/[^A-Za-z0-9_.:-]/g, '').slice(0, 120)};
    }
    const raw = {schema_version: 'are.g03-lme-v2-dev-r2-attempt/v1',
      ordinal: index + 1, question_id: entry.question_id, arm: entry.arm,
      request_sha256: sha(body), elapsed_ms: Date.now() - started, response};
    const rawBytes = Buffer.from(`${JSON.stringify(raw, null, 2)}\n`);
    await writeFile(`${root}/ATTEMPT-${index + 1}.json`, rawBytes,
      {flag: 'wx', mode: 0o600});
    const text = response.payload?.choices?.[0]?.message?.content;
    const row = {ordinal: index + 1, question_id: entry.question_id, arm: entry.arm,
      status: response.status, valid: response.status === 200 &&
        typeof text === 'string' && text.trim().length > 0,
      answer_sha256: typeof text === 'string' ? sha(text) : null,
      prompt_tokens: response.payload?.usage?.prompt_tokens ?? null,
      completion_tokens: response.payload?.usage?.completion_tokens ?? null,
      finish_reason: response.payload?.choices?.[0]?.finish_reason ?? null,
      elapsed_ms: raw.elapsed_ms, raw_sha256: sha(rawBytes)};
    answers.push(row);
    if (!row.valid) break;
  }
}
const result = {schema_version: 'are.g03-lme-v2-dev-r2-result/v1',
  status: tokenRows.length === 4 && tokenRows.every(row => row.admitted_8k) &&
    answers.length === 4 && answers.every(row => row.valid) ?
    'completed-four-development-answers' : 'terminal-incomplete',
  freeze_sha256: sha(freezeBytes),
  tokenizer_rows: tokenRows.map(({response, ...row}) => row),
  answer_rows: answers, generation_calls: answers.length,
  evaluator_fields_used: false,
  claim_ceiling: 'Two exposed development pairs only; no superiority claim'};
const resultBytes = Buffer.from(`${JSON.stringify(result, null, 2)}\n`);
await writeFile(`${root}/RESULT.json`, resultBytes, {flag: 'wx', mode: 0o600});
process.stdout.write(`${JSON.stringify({status: result.status,
  token_admitted: tokenRows.filter(row => row.admitted_8k).length,
  generation_calls: answers.length, valid_answers: answers.filter(row => row.valid).length,
  result_sha256: sha(resultBytes)})}\n`);
if (result.status !== 'completed-four-development-answers') process.exitCode = 2;
