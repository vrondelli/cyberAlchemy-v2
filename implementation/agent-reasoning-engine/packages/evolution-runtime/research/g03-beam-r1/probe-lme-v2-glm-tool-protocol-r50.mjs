// One zero-retry, receipt-bound private GLM function-call protocol probe.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const sha = value => createHash('sha256').update(value).digest('hex');
const need = (value, code) => { if (!value) throw Error(`g03-v2-tool-probe-r50.${code}`); };
const [helperPath, root] = process.argv.slice(2);
need(process.argv.length === 4 && [helperPath, root].every(path =>
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+$/.test(path ?? '') &&
  !path.includes('/../')), 'arguments');
const helperSha = sha(await readFile(helperPath));
need(helperSha === 'deafaf7bc91d5cac29c070781519a996975d6c684d2035c83d09dd2dd584194e',
  'helper-drift');
const {createVpsLocalPost, verifyHen11VpsTopology} = await import(pathToFileURL(helperPath).href);
const topology = verifyHen11VpsTopology();
const request = {model: 'glm-5.3-flash', messages: [
  {role: 'system', content: 'Use the lookup function to get the answer. Never guess its value.'},
  {role: 'user', content: 'What is the private code for key alpha? Call lookup first.'},
], tools: [{type: 'function', function: {name: 'lookup',
  description: 'Read a key from a toy local dictionary.', parameters: {type: 'object',
    properties: {key: {type: 'string', enum: ['alpha']}}, required: ['key'],
    additionalProperties: false}}}], tool_choice: 'auto', max_tokens: 512,
reasoning_effort: 'low', thinking: {type: 'enabled'}, stream: false};
const requestBytes = Buffer.from(JSON.stringify(request));
need(requestBytes.length < 12000, 'request-size');
await mkdir(root);
const freeze = {schema_version: 'are.g03-v2-tool-probe-r50-freeze/v1',
  status: 'frozen-before-provider-calls', request_sha256: sha(requestBytes),
  helper_sha256: helperSha, runner_sha256: sha(await readFile(new URL(import.meta.url))),
  provider_host_fingerprint_sha256: topology.host_fingerprint_sha256,
  maximum_tokenizer_calls: 1, maximum_generation_calls: 1,
  automatic_retries: 0, context_window_tokens: 8192,
  claim_ceiling: 'Transport/tool protocol qualification only; no benchmark result'};
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
const token = await deliver('https://api.z.ai/api/paas/v4/tokenizer',
  JSON.stringify({model: request.model, messages: request.messages, tools: request.tools}),
  30000, 65536);
const promptTokens = token.response.payload?.usage?.prompt_tokens;
const admitted = token.response.status === 200 && Number.isSafeInteger(promptTokens) &&
  promptTokens > 0 && promptTokens + request.max_tokens <= 8192;
const tokenBytes = Buffer.from(`${JSON.stringify({request_sha256: sha(requestBytes),
  prompt_tokens: promptTokens ?? null, admitted_8k: admitted, ...token}, null, 2)}\n`);
await writeFile(`${root}/TOKENIZER.json`, tokenBytes, {flag: 'wx', mode: 0o600});
let attempt = null;
if (admitted) {
  attempt = await deliver('https://api.z.ai/api/paas/v4/chat/completions',
    requestBytes.toString(), 120000, 131072);
  await writeFile(`${root}/ATTEMPT.json`,
    `${JSON.stringify({request_sha256: sha(requestBytes), ...attempt}, null, 2)}\n`,
    {flag: 'wx', mode: 0o600});
}
const choice = attempt?.response.payload?.choices?.[0];
const calls = choice?.message?.tool_calls;
const result = {schema_version: 'are.g03-v2-tool-probe-r50-result/v1',
  status: admitted && attempt?.response.status === 200 ? 'provider-answered' : 'terminal-incomplete',
  freeze_sha256: sha(freezeBytes), tokenizer_sha256: sha(tokenBytes),
  prompt_tokens: promptTokens ?? null, provider_status: attempt?.response.status ?? null,
  finish_reason: choice?.finish_reason ?? null,
  tool_call_count: Array.isArray(calls) ? calls.length : 0,
  first_tool_name: calls?.[0]?.function?.name ?? null,
  first_tool_arguments: calls?.[0]?.function?.arguments ?? null,
  claim_ceiling: freeze.claim_ceiling};
const resultBytes = Buffer.from(`${JSON.stringify(result, null, 2)}\n`);
await writeFile(`${root}/RESULT.json`, resultBytes, {flag: 'wx', mode: 0o600});
process.stdout.write(`${JSON.stringify({status: result.status,
  tool_call_count: result.tool_call_count, first_tool_name: result.first_tool_name,
  result_sha256: sha(resultBytes)})}\n`);
if (result.status !== 'provider-answered') process.exitCode = 2;
