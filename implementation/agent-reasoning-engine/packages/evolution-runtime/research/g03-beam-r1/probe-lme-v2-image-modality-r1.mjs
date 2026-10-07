// One-call, development-only V2 image transport check; not a benchmark score.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const need = (value, code) => { if (!value) throw Error(`g03-v2-image-probe.${code}`); };
const [imagePath, helperPath, root] = process.argv.slice(2);
need(process.argv.length === 5 && [imagePath, helperPath, root].every(path =>
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+$/.test(path ?? '') &&
  !path.includes('/../')), 'arguments');
const image = await readFile(imagePath);
need(sha(image) === 'a77eaead88f1224bbb6f5c0ad6cd85b65ed9d608def25b1d2e93caf43cc80a25',
  'source-image-drift');
const request = {
  model: 'glm-5.3-flash',
  messages: [{role: 'user', content: [
    {type: 'text', text: 'In one sentence, describe the visible interface in this image.'},
    {type: 'image_url', image_url: {url: `data:image/png;base64,${image.toString('base64')}`}},
  ]}],
  max_tokens: 128, reasoning_effort: 'low', thinking: {type: 'enabled'},
  stream: false,
};
const body = JSON.stringify(request);
need(Buffer.byteLength(body) < 280000, 'request-size');
const {createVpsLocalPost, verifyHen11VpsTopology} =
  await import(pathToFileURL(helperPath).href);
const topology = verifyHen11VpsTopology();
await mkdir(root);
const freeze = {
  schema_version: 'are.g03-v2-image-modality-probe/v1',
  purpose: 'Development-only image API feasibility; no benchmark question, answer, or score',
  dataset_revision: 'f152293e235517d504809563c833d7190b8c713b',
  development_question_id: '2f6a21cd', image_sha256: sha(image),
  helper_sha256: sha(await readFile(helperPath)),
  runner_sha256: sha(await readFile(new URL(import.meta.url))),
  request_sha256: sha(body), model: request.model, maximum_calls: 1,
  automatic_retries: 0, max_tokens: 128,
  provider_host_fingerprint_sha256: topology.host_fingerprint_sha256,
  claim_ceiling: 'API modality transport only; no benchmark or superiority claim',
};
await writeFile(`${root}/FREEZE.json`, `${JSON.stringify(freeze, null, 2)}\n`,
  {flag: 'wx', mode: 0o600});
const started = Date.now();
let response;
try {
  const delivered = await createVpsLocalPost()(
    new URL('https://api.z.ai/api/paas/v4/chat/completions'), body,
    {apiKey: 'container-owned-marker', timeout_ms: 120000,
      maximum_response_bytes: 131072});
  response = {status: delivered.status, payload: delivered.payload,
    bytes: delivered.bytes};
} catch (error) {
  response = {status: null, transport_error: String(error?.message ?? 'error')
    .replace(/[^A-Za-z0-9_.:-]/g, '').slice(0, 120)};
}
const attempt = {schema_version: 'are.g03-v2-image-modality-attempt/v1',
  freeze_sha256: sha(Buffer.from(`${JSON.stringify(freeze, null, 2)}\n`)),
  request_sha256: sha(body), elapsed_ms: Date.now() - started, response};
const attemptBytes = Buffer.from(`${JSON.stringify(attempt, null, 2)}\n`);
await writeFile(`${root}/ATTEMPT.json`, attemptBytes, {flag: 'wx', mode: 0o600});
const answer = response.payload?.choices?.[0]?.message?.content;
const result = {schema_version: 'are.g03-v2-image-modality-result/v1',
  status: response.status, accepted: response.status === 200 &&
    typeof answer === 'string' && answer.trim().length > 0,
  answer_sha256: typeof answer === 'string' ? sha(answer) : null,
  finish_reason: response.payload?.choices?.[0]?.finish_reason ?? null,
  prompt_tokens: response.payload?.usage?.prompt_tokens ?? null,
  completion_tokens: response.payload?.usage?.completion_tokens ?? null,
  attempt_sha256: sha(attemptBytes), elapsed_ms: attempt.elapsed_ms,
  claim_ceiling: 'API modality transport only; no benchmark or superiority claim'};
await writeFile(`${root}/RESULT.json`, `${JSON.stringify(result, null, 2)}\n`,
  {flag: 'wx', mode: 0o600});
process.stdout.write(`${JSON.stringify(result)}\n`);
if (!result.accepted) process.exitCode = 2;
