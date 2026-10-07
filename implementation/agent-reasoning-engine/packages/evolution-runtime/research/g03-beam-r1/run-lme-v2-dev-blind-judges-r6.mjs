// Arm-blind, two-pass GLM-adapted official-rubric development judgments.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const sha = value => createHash('sha256').update(value).digest('hex');
const need = (value, code) => { if (!value) throw Error(`g03-v2-dev-judge-r6.${code}`); };
const [wirePath, helperPath, root] = process.argv.slice(2);
need(process.argv.length === 5 && [wirePath, helperPath, root].every(path =>
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+$/.test(path ?? '') &&
  !path.includes('/../')), 'arguments');
const wireBytes = await readFile(wirePath);
need(sha(wireBytes) === '4911e989cc02f030d35c955ec4a7bae7323f3c894fac4da15956cf4b01dc94d6',
  'wire-drift');
const wire = JSON.parse(wireBytes);
need(wire.schema_version === 'are.g03-lme-v2-dev-blind-judge-wires-r6/v1' &&
  wire.wires.length === 64 && wire.maximum_judge_calls === 64 &&
  wire.automatic_retries === 0 &&
  wire.arm_identity_in_provider_messages === false &&
  wire.official_rubric_prompts_reused === true, 'wire-schema');
const ids = new Set();
for (const entry of wire.wires) {
  need(/^[a-f0-9]{24}$/.test(entry.blind_id) && !ids.has(entry.blind_id),
    'blind-id');
  ids.add(entry.blind_id);
  need(entry.request.model === 'glm-5.3-flash' &&
    entry.request.max_tokens === 2048 &&
    entry.request.reasoning_effort === 'low' &&
    entry.request.thinking?.type === 'enabled' &&
    entry.request.stream === false &&
    sha(JSON.stringify(entry.request)) === entry.request_sha256 &&
    Buffer.byteLength(JSON.stringify(entry.request)) < 280000,
    'request-drift');
}
const {createVpsLocalPost, verifyHen11VpsTopology} =
  await import(pathToFileURL(helperPath).href);
const topology = verifyHen11VpsTopology();
await mkdir(root);
const freeze = {schema_version: 'are.g03-lme-v2-dev-blind-judge-r6-freeze/v1',
  status: 'frozen-before-provider-calls', wire_sha256: sha(wireBytes),
  helper_sha256: sha(await readFile(helperPath)),
  runner_sha256: sha(await readFile(new URL(import.meta.url))),
  provider_host_fingerprint_sha256: topology.host_fingerprint_sha256,
  ordered_requests: wire.wires.map(row => ({blind_id: row.blind_id,
    request_sha256: row.request_sha256})),
  model: 'glm-5.3-flash', max_tokens: 2048,
  context_window_tokens: 8192, maximum_tokenizer_calls: 64,
  maximum_generation_calls: 64, automatic_retries: 0,
  invalid_verdict_policy: 'retain invalid and score control-favoring sensitivity; no retry',
  arm_identity_in_provider_messages: false,
  claim_ceiling: 'Exposed development GLM-adapted rubric judgments; not native V2 or superiority'};
const freezeBytes = Buffer.from(`${JSON.stringify(freeze, null, 2)}\n`);
await writeFile(`${root}/FREEZE.json`, freezeBytes, {flag: 'wx', mode: 0o600});
const post = createVpsLocalPost();
const tokenizer = new URL('https://api.z.ai/api/paas/v4/tokenizer');
const completion = new URL('https://api.z.ai/api/paas/v4/chat/completions');
const tokenRows = [];
for (const [index, entry] of wire.wires.entries()) {
  const body = JSON.stringify({model: entry.request.model,
    messages: entry.request.messages});
  const started = Date.now();
  let response;
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
  const raw = {schema_version: 'are.g03-lme-v2-dev-judge-r6-tokenizer/v1',
    ordinal: index + 1, blind_id: entry.blind_id,
    request_sha256: entry.request_sha256,
    status: response.status,
    prompt_tokens: Number.isSafeInteger(count) ? count : null,
    admitted_8k: response.status === 200 && Number.isSafeInteger(count) &&
      count > 0 && count + 2048 <= 8192,
    elapsed_ms: Date.now() - started, response};
  const rawBytes = Buffer.from(`${JSON.stringify(raw, null, 2)}\n`);
  await writeFile(`${root}/TOKENIZER-${String(index + 1).padStart(2, '0')}.json`,
    rawBytes, {flag: 'wx', mode: 0o600});
  tokenRows.push({ordinal: raw.ordinal, blind_id: raw.blind_id,
    status: raw.status, prompt_tokens: raw.prompt_tokens,
    admitted_8k: raw.admitted_8k, elapsed_ms: raw.elapsed_ms,
    raw_sha256: sha(rawBytes)});
  if (!raw.admitted_8k) break;
}
const judgments = [];
if (tokenRows.length === 64 && tokenRows.every(row => row.admitted_8k)) {
  for (const [index, entry] of wire.wires.entries()) {
    const body = JSON.stringify(entry.request);
    const started = Date.now();
    let response;
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
    const raw = {schema_version: 'are.g03-lme-v2-dev-judge-r6-attempt/v1',
      ordinal: index + 1, blind_id: entry.blind_id,
      request_sha256: sha(body), elapsed_ms: Date.now() - started, response};
    const rawBytes = Buffer.from(`${JSON.stringify(raw, null, 2)}\n`);
    await writeFile(`${root}/JUDGE-${String(index + 1).padStart(2, '0')}.json`,
      rawBytes, {flag: 'wx', mode: 0o600});
    const answer = response.payload?.choices?.[0]?.message?.content;
    const finish = response.payload?.choices?.[0]?.finish_reason;
    const usage = response.payload?.usage;
    judgments.push({ordinal: index + 1, blind_id: entry.blind_id,
      status: response.status,
      response_valid: response.status === 200 && typeof answer === 'string' &&
        answer.trim().length > 0 && finish !== 'length' &&
        Number.isSafeInteger(usage?.prompt_tokens) &&
        Number.isSafeInteger(usage?.completion_tokens) &&
        usage.prompt_tokens + usage.completion_tokens <= 8192,
      answer_sha256: typeof answer === 'string' ? sha(answer) : null,
      prompt_tokens: usage?.prompt_tokens ?? null,
      completion_tokens: usage?.completion_tokens ?? null,
      reasoning_tokens: usage?.completion_tokens_details?.reasoning_tokens ?? null,
      finish_reason: finish ?? null, elapsed_ms: raw.elapsed_ms,
      raw_sha256: sha(rawBytes)});
  }
}
const result = {schema_version: 'are.g03-lme-v2-dev-blind-judge-r6-result/v1',
  status: tokenRows.length === 64 && tokenRows.every(row => row.admitted_8k) &&
    judgments.length === 64 ? 'completed-64-judge-attempts' : 'terminal-incomplete',
  freeze_sha256: sha(freezeBytes), tokenizer_rows: tokenRows,
  judge_rows: judgments, tokenizer_calls: tokenRows.length,
  generation_calls: judgments.length,
  invalid_responses: judgments.filter(row => !row.response_valid).length,
  known_prompt_tokens: judgments.reduce((sum, row) => sum + (row.prompt_tokens ?? 0), 0),
  known_completion_tokens: judgments.reduce((sum, row) => sum + (row.completion_tokens ?? 0), 0),
  claim_ceiling: 'Exposed development GLM-adapted rubric judgments; not native V2 or superiority'};
const resultBytes = Buffer.from(`${JSON.stringify(result, null, 2)}\n`);
await writeFile(`${root}/RESULT.json`, resultBytes, {flag: 'wx', mode: 0o600});
process.stdout.write(`${JSON.stringify({status: result.status,
  tokenizer_calls: result.tokenizer_calls,
  generation_calls: result.generation_calls,
  invalid_responses: result.invalid_responses,
  result_sha256: sha(resultBytes)})}\n`);
if (result.status !== 'completed-64-judge-attempts') process.exitCode = 2;
