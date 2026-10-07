// Tokenizer-only check of two frozen r5 synthesis requests.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const need = (value, reason) => { if (!value) throw Error(`g03-beam-synthesis-r5.${reason}`); };
const [wirePath, wireSha, helperPath, helperSha, root] = process.argv.slice(2);
need(process.argv.length === 7 &&
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+\.json$/.test(wirePath ?? '') &&
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+\.mjs$/.test(helperPath ?? '') &&
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+$/.test(root ?? '') &&
  ![wirePath, helperPath, root].some(path => path.includes('/../')) &&
  [wireSha, helperSha].every(value => /^[a-f0-9]{64}$/.test(value ?? '')),
  'arguments');
const wireBytes = await readFile(wirePath);
need(sha(wireBytes) === wireSha && sha(await readFile(helperPath)) === helperSha,
  'input-drift');
const wire = JSON.parse(wireBytes);
need(wire.schema_version === 'are.g03-beam-dev-synthesis-wires-r5/v1' &&
  wire.status === 'frozen-after-extraction-before-synthesis-tokenizer' &&
  wire.evaluator_fields_read === false && wire.wires.length === 2 &&
  wire.context_window_tokens === 8192 &&
  wire.synthesis_output_reserve_tokens === 1024, 'wire-seal');
need(wire.wires.every(row => row.request?.model === 'glm-5.3-flash' &&
  Array.isArray(row.request.messages) && row.request.messages.length === 2 &&
  row.request.max_tokens === 1024 && row.request.reasoning_effort === 'low' &&
  row.request.thinking?.type === 'enabled' && row.request.stream === false),
  'wire-shape');
await mkdir(root);
const {createVpsLocalPost, verifyHen11VpsTopology} = await import(pathToFileURL(helperPath).href);
const topology = verifyHen11VpsTopology();
const post = createVpsLocalPost();
const endpoint = new URL('https://api.z.ai/api/paas/v4/tokenizer');
const rows = [];
for (const [index, entry] of wire.wires.entries()) {
  const body = JSON.stringify({model: entry.request.model,
    messages: entry.request.messages});
  const started = Date.now();
  let status = null, promptTokens = null, responseBytes = null, errorCode = null;
  try {
    const response = await post(endpoint, body, {apiKey: 'container-owned-marker',
      timeout_ms: 30000, maximum_response_bytes: 65536});
    status = response.status;
    responseBytes = response.bytes;
    const count = response.payload?.usage?.prompt_tokens;
    if (status === 200 && Number.isSafeInteger(count) && count > 0) {
      promptTokens = count;
    } else {
      const code = String(response.payload?.error?.code ?? response.payload?.code ?? 'invalid-response');
      errorCode = /^[A-Za-z0-9_.-]{1,40}$/.test(code) ? code : 'invalid-code';
    }
  } catch (error) {
    const code = String(error?.code ?? 'transport-error');
    errorCode = /^[A-Za-z0-9_.-]{1,40}$/.test(code) ? code : 'transport-error';
  }
  const row = {index: index + 1, probe_id: entry.probe_id,
    tokenizer_request_sha256: sha(body), status,
    prompt_tokens: promptTokens, output_reserve_tokens: 1024,
    admitted_8k: promptTokens !== null && promptTokens + 1024 <= 8192,
    response_bytes: responseBytes, elapsed_ms: Date.now() - started,
    ...(errorCode ? {error_code: errorCode} : {})};
  rows.push(row);
  await writeFile(`${root}/TOKENIZER-${String(index + 1).padStart(2, '0')}.json`,
    `${JSON.stringify(row, null, 2)}\n`, {flag: 'wx', mode: 0o600});
  if (promptTokens === null) break;
}
const result = {schema_version: 'are.g03-beam-dev-synthesis-preflight-r5/v1',
  status: rows.length === 2 && rows.every(row => row.admitted_8k) ?
    'passed-two-development-synthesis-wires' : 'not-qualified',
  checked_at: new Date().toISOString(), wire_sha256: wireSha,
  helper_sha256: helperSha, provider_host_fingerprint_sha256: topology.host_fingerprint_sha256,
  model: 'glm-5.3-flash', context_window_tokens: 8192,
  output_reserve_tokens: 1024, automatic_retries: 0,
  provider_requests: rows.length, generation_calls: 0, rows,
  claim_ceiling: 'Tokenizer admission on two exposed development synthesis wires only; no answer quality, holdout, or superiority'};
const bytes = Buffer.from(`${JSON.stringify(result, null, 2)}\n`);
await writeFile(`${root}/RESULT.json`, bytes, {flag: 'wx', mode: 0o600});
process.stdout.write(`${JSON.stringify({status: result.status,
  sha256: sha(bytes), provider_requests: rows.length,
  prompt_tokens_max: Math.max(...rows.map(row => row.prompt_tokens ?? 0))})}\n`);
if (result.status !== 'passed-two-development-synthesis-wires') process.exitCode = 2;
