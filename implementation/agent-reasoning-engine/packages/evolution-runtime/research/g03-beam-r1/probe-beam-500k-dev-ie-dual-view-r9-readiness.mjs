// One tokenizer and one tiny generation on the pinned private VPS gateway.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const need = (value, reason) => {
  if (!value) throw Error(`g03-beam-500k-ie-r9-readiness.${reason}`);
};
const [helperPath, helperSha, root] = process.argv.slice(2);
need(process.argv.length === 5 &&
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+\.mjs$/.test(helperPath ?? '') &&
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+$/.test(root ?? '') &&
  ![helperPath, root].some(path => path.includes('/../')) &&
  /^[a-f0-9]{64}$/.test(helperSha ?? ''), 'arguments');
need(sha(await readFile(helperPath)) === helperSha, 'helper-drift');
const {createVpsLocalPost, verifyHen11VpsTopology} =
  await import(pathToFileURL(helperPath).href);
const topology = verifyHen11VpsTopology();
await mkdir(root);
const post = createVpsLocalPost();
const model = 'glm-5.3-flash';
const messages = [{role: 'user', content: 'Reply with OK.'}];
const tokenizerBody = JSON.stringify({model, messages});
const generationBody = JSON.stringify({model, messages,
  thinking: {type: 'enabled'}, reasoning_effort: 'low',
  max_tokens: 128, stream: false});
const safeCode = value => /^[A-Za-z0-9_.-]{1,40}$/.test(String(value ?? '')) ?
  String(value) : 'invalid-code';
async function call(path, body) {
  try {
    const response = await post(new URL(`https://api.z.ai/api/paas/v4/${path}`),
      body, {apiKey: 'container-owned-marker', timeout_ms: 30000,
        maximum_response_bytes: 65536});
    return {status: response.status, payload: response.payload,
      response_bytes: response.bytes};
  } catch (error) {
    return {status: null, payload: null,
      transport_error_code: safeCode(error?.code ?? 'transport-error')};
  }
}
const first = await call('tokenizer', tokenizerBody);
const promptTokens = first.payload?.usage?.prompt_tokens;
const tokenizerOk = first.status === 200 && Number.isSafeInteger(promptTokens) &&
  promptTokens > 0;
let second = null;
if (tokenizerOk) second = await call('chat/completions', generationBody);
const completionTokens = second?.payload?.usage?.completion_tokens;
const answer = second?.payload?.choices?.[0]?.message?.content;
const generationOk = second?.status === 200 &&
  Number.isSafeInteger(completionTokens) && completionTokens > 0 &&
  typeof answer === 'string' && answer.trim().length > 0 &&
  second?.payload?.choices?.[0]?.finish_reason !== 'length';
const receipt = {
  schema_version: 'are.g03-beam-500k-ie-dual-view-r9-readiness/v1',
  status: tokenizerOk && generationOk ? 'ready' : 'not-ready',
  checked_at: new Date().toISOString(), model,
  helper_sha256: helperSha,
  provider_host_fingerprint_sha256: topology.host_fingerprint_sha256,
  tokenizer_request_sha256: sha(tokenizerBody),
  generation_request_sha256: sha(generationBody),
  tokenizer: {status: first.status,
    prompt_tokens: tokenizerOk ? promptTokens : null,
    response_bytes: first.response_bytes ?? null,
    ...(!tokenizerOk ? {api_error_code: safeCode(
      first.payload?.error?.code ?? first.payload?.code ??
      first.transport_error_code)} : {})},
  tiny_generation: second ? {status: second.status,
    completion_tokens: generationOk ? completionTokens : null,
    response_bytes: second.response_bytes ?? null,
    answer_sha256: generationOk ? sha(answer) : null,
    ...(!generationOk ? {api_error_code: safeCode(
      second.payload?.error?.code ?? second.payload?.code ??
      second.transport_error_code)} : {})} : {status: 'not-attempted'},
  provider_requests: second ? 2 : 1,
  generation_calls: second ? 1 : 0,
  automatic_retries: 0,
  claim_ceiling: 'Same-account transport and tiny-generation readiness only; not campaign reliability, answer quality or superiority'
};
const bytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
await writeFile(`${root}/RESULT.json`, bytes, {flag: 'wx', mode: 0o600});
process.stdout.write(`${JSON.stringify({status: receipt.status,
  receipt_sha256: sha(bytes), tokenizer_status: first.status,
  generation_status: second?.status ?? null})}\n`);
if (receipt.status !== 'ready') process.exitCode = 2;
