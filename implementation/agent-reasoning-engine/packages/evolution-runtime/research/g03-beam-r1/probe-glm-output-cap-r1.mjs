// One exposed development request tests the documented Z.AI output-limit key.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const need = (value, reason) => { if (!value) throw Error(`g03-output-cap.${reason}`); };
const [wirePath, wireSha, helperPath, helperSha, root] = process.argv.slice(2);
need(process.argv.length === 7 &&
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+\.json$/.test(wirePath ?? '') &&
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+\.mjs$/.test(helperPath ?? '') &&
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+$/.test(root ?? '') &&
  ![wirePath, helperPath, root].some(value => value.includes('/../')) &&
  [wireSha, helperSha].every(value => /^[a-f0-9]{64}$/.test(value ?? '')),
  'arguments');
const wireBytes = await readFile(wirePath);
need(sha(wireBytes) === wireSha && sha(await readFile(helperPath)) === helperSha,
  'input-drift');
const sealed = JSON.parse(wireBytes);
need(sealed.schema_version === 'are.g03-beam-dev-event-wire/v1' &&
  sealed.evaluator_fields_read === false && sealed.wires.length === 8,
  'source-only-wire');
const first = sealed.wires[0];
const request = {model: first.request.model, messages: first.request.messages,
  thinking: {type: 'enabled'}, reasoning_effort: 'low', max_tokens: 512,
  stream: false};
const body = JSON.stringify(request);
await mkdir(root);
const {createVpsLocalPost, verifyHen11VpsTopology} = await import(pathToFileURL(helperPath).href);
const topology = verifyHen11VpsTopology();
const freeze = {schema_version: 'are.g03-glm-output-cap-probe-freeze/v1',
  status: 'frozen-before-one-exposed-development-call',
  wire_sha256: wireSha, helper_sha256: helperSha,
  script_sha256: sha(await readFile(new URL(import.meta.url))),
  probe_id: first.probe_id, request_sha256: sha(body),
  model: request.model, parameter: 'max_tokens', max_tokens: 512,
  reasoning_effort: 'low', maximum_generation_calls: 1,
  automatic_retries: 0, evaluator_fields_read: false,
  claim_ceiling: 'Provider output-limit calibration only; no benchmark score or superiority'};
const freezeBytes = Buffer.from(`${JSON.stringify(freeze, null, 2)}\n`);
await writeFile(`${root}/FREEZE.json`, freezeBytes, {flag: 'wx', mode: 0o600});
const post = createVpsLocalPost();
const start = Date.now();
let response;
try {
  const value = await post(new URL('https://api.z.ai/api/paas/v4/chat/completions'),
    body, {apiKey: 'container-owned-marker', timeout_ms: 120000,
      maximum_response_bytes: 262144});
  response = {status: value.status, payload: value.payload, bytes: value.bytes};
} catch (error) {
  const code = String(error?.code ?? 'transport-error');
  response = {status: null, payload: null, bytes: null,
    transport_error_code: /^[A-Za-z0-9_.-]{1,40}$/.test(code) ? code : 'transport-error'};
}
const raw = {schema_version: 'are.g03-glm-output-cap-probe-attempt/v1',
  probe_id: first.probe_id, request_sha256: sha(body),
  elapsed_ms: Date.now() - start, response};
const rawBytes = Buffer.from(`${JSON.stringify(raw, null, 2)}\n`);
await writeFile(`${root}/ATTEMPT.json`, rawBytes, {flag: 'wx', mode: 0o600});
const tokens = response.payload?.usage?.completion_tokens;
const answer = response.payload?.choices?.[0]?.message?.content;
const result = {schema_version: 'are.g03-glm-output-cap-probe-result/v1',
  status: response.status === 200 && Number.isSafeInteger(tokens) && tokens > 0 ?
    'settled' : 'not-qualified',
  freeze_sha256: sha(freezeBytes), attempt_sha256: sha(rawBytes),
  provider_host_fingerprint_sha256: topology.host_fingerprint_sha256,
  provider_status: response.status, completion_tokens: tokens ?? null,
  observed_within_512: Number.isSafeInteger(tokens) && tokens <= 512,
  visible_answer_nonempty: typeof answer === 'string' && answer.trim().length > 0,
  reasoning_tokens: response.payload?.usage?.completion_tokens_details?.reasoning_tokens ?? null,
  automatic_retries: 0, generation_calls: 1,
  claim_ceiling: 'One exposed provider parameter calibration only; no native score, corrected campaign or superiority'};
const bytes = Buffer.from(`${JSON.stringify(result, null, 2)}\n`);
await writeFile(`${root}/RESULT.json`, bytes, {flag: 'wx', mode: 0o600});
process.stdout.write(`${JSON.stringify({status: result.status, provider_status: result.provider_status,
  completion_tokens: result.completion_tokens,
  observed_within_512: result.observed_within_512,
  visible_answer_nonempty: result.visible_answer_nonempty,
  result_sha256: sha(bytes), output_root: root})}\n`);
if (result.status !== 'settled') process.exitCode = 2;
