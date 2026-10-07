// Two arm-blind, zero-retry exposed-development rubric votes.
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const sha = value => createHash('sha256').update(value).digest('hex');
const need = (value, code) => { if (!value) throw Error(`g03-v2-relation-r38.${code}`); };
const [wirePath, helperPath, root] = process.argv.slice(2);
need(process.argv.length === 5 && [wirePath, helperPath, root].every(path =>
  /^\/opt\/are\/evolution-runtime\/[A-Za-z0-9_./-]+$/.test(path ?? '') &&
  !path.includes('/../')), 'arguments');
const wireBytes = await readFile(wirePath);
need(sha(wireBytes) === '96224539180faa45ce282446f0aa9cac424c33191e4cc3a64ea426cbfc600728',
  'wire-drift');
const wire = JSON.parse(wireBytes);
need(wire.schema_version === 'are.g03-lme-v2-relation-judge-wires-r37/v1' &&
  wire.wires.length === 2 && wire.maximum_judge_calls === 2 &&
  wire.automatic_retries === 0 && wire.arm_identity_in_provider_messages === false &&
  wire.official_rubric_prompts_reused === true, 'wire-schema');
const ids = new Set();
for (const entry of wire.wires) {
  need(/^[a-f0-9]{24}$/.test(entry.blind_id) && !ids.has(entry.blind_id), 'blind-id');
  ids.add(entry.blind_id);
  need(entry.request.model === 'glm-5.3-flash' && entry.request.max_tokens === 2048 &&
    entry.request.reasoning_effort === 'low' && entry.request.thinking?.type === 'enabled' &&
    entry.request.stream === false && sha(JSON.stringify(entry.request)) === entry.request_sha256,
    'request-drift');
}
const {createVpsLocalPost, verifyHen11VpsTopology} = await import(pathToFileURL(helperPath).href);
const topology = verifyHen11VpsTopology();
const helperSha = sha(await readFile(helperPath));
need(helperSha === 'deafaf7bc91d5cac29c070781519a996975d6c684d2035c83d09dd2dd584194e',
  'helper-drift');
await mkdir(root);
const freeze = {schema_version: 'are.g03-lme-v2-relation-r38-freeze/v1',
  status: 'frozen-before-provider-calls', wire_sha256: sha(wireBytes),
  helper_sha256: helperSha,
  runner_sha256: sha(await readFile(new URL(import.meta.url))),
  provider_host_fingerprint_sha256: topology.host_fingerprint_sha256,
  ordered_requests: wire.wires.map(row => ({blind_id: row.blind_id,
    request_sha256: row.request_sha256})),
  model: 'glm-5.3-flash', max_tokens: 2048, context_window_tokens: 8192,
  maximum_tokenizer_calls: 2, maximum_generation_calls: 2, automatic_retries: 0,
  invalid_verdict_policy: 'retain invalid and treat as unresolved; no retry',
  arm_identity_in_provider_messages: false,
  claim_ceiling: 'Exposed development GLM-adapted rubric votes only'};
const freezeBytes = Buffer.from(`${JSON.stringify(freeze, null, 2)}\n`);
await writeFile(`${root}/FREEZE.json`, freezeBytes, {flag: 'wx', mode: 0o600});
const post = createVpsLocalPost();
async function deliver(url, body, timeout_ms, maximum_response_bytes) {
  const started = Date.now();
  let response;
  try {
    const delivered = await post(new URL(url), body,
      {apiKey: 'container-owned-marker', timeout_ms, maximum_response_bytes});
    response = {status: delivered.status, payload: delivered.payload, bytes: delivered.bytes};
  } catch (error) {
    response = {status: null, error: String(error?.message ?? 'transport-error')
      .replace(/[^A-Za-z0-9_.:-]/g, '').slice(0, 120)};
  }
  return {response, elapsed_ms: Date.now() - started};
}
const tokens = [];
for (const [index, entry] of wire.wires.entries()) {
  const delivery = await deliver('https://api.z.ai/api/paas/v4/tokenizer',
    JSON.stringify({model: entry.request.model, messages: entry.request.messages}),
    30000, 65536);
  const count = delivery.response.payload?.usage?.prompt_tokens;
  const raw = {schema_version: 'are.g03-lme-v2-relation-r38-tokenizer/v1',
    ordinal: index + 1, blind_id: entry.blind_id,
    request_sha256: entry.request_sha256,
    prompt_tokens: Number.isSafeInteger(count) ? count : null,
    admitted_8k: delivery.response.status === 200 && Number.isSafeInteger(count) &&
      count > 0 && count + 2048 <= 8192, ...delivery};
  const bytes = Buffer.from(`${JSON.stringify(raw, null, 2)}\n`);
  await writeFile(`${root}/TOKENIZER-${String(index + 1).padStart(2, '0')}.json`,
    bytes, {flag: 'wx', mode: 0o600});
  tokens.push({ordinal: raw.ordinal, blind_id: raw.blind_id,
    admitted_8k: raw.admitted_8k, prompt_tokens: raw.prompt_tokens,
    raw_sha256: sha(bytes)});
  if (!raw.admitted_8k) break;
}
const judges = [];
if (tokens.length === 2 && tokens.every(row => row.admitted_8k)) {
  for (const [index, entry] of wire.wires.entries()) {
    const delivery = await deliver('https://api.z.ai/api/paas/v4/chat/completions',
      JSON.stringify(entry.request), 120000, 131072);
    const raw = {schema_version: 'are.g03-lme-v2-relation-r38-attempt/v1',
      ordinal: index + 1, blind_id: entry.blind_id,
      request_sha256: entry.request_sha256, ...delivery};
    const bytes = Buffer.from(`${JSON.stringify(raw, null, 2)}\n`);
    await writeFile(`${root}/JUDGE-${String(index + 1).padStart(2, '0')}.json`,
      bytes, {flag: 'wx', mode: 0o600});
    const content = delivery.response.payload?.choices?.[0]?.message?.content;
    const finish = delivery.response.payload?.choices?.[0]?.finish_reason;
    const usage = delivery.response.payload?.usage;
    judges.push({ordinal: index + 1, blind_id: entry.blind_id,
      response_valid: delivery.response.status === 200 && typeof content === 'string' &&
        content.trim().length > 0 && finish !== 'length' &&
        Number.isSafeInteger(usage?.prompt_tokens) &&
        Number.isSafeInteger(usage?.completion_tokens) &&
        usage.prompt_tokens + usage.completion_tokens <= 8192,
      answer_sha256: typeof content === 'string' ? sha(content) : null,
      prompt_tokens: usage?.prompt_tokens ?? null,
      completion_tokens: usage?.completion_tokens ?? null,
      finish_reason: finish ?? null, elapsed_ms: raw.elapsed_ms,
      raw_sha256: sha(bytes)});
  }
}
const result = {schema_version: 'are.g03-lme-v2-relation-r38-result/v1',
  status: judges.length === 2 ? 'completed-two-judge-attempts' : 'terminal-incomplete',
  freeze_sha256: sha(freezeBytes), tokenizer_rows: tokens, judge_rows: judges,
  tokenizer_calls: tokens.length, generation_calls: judges.length,
  invalid_responses: judges.filter(row => !row.response_valid).length,
  claim_ceiling: freeze.claim_ceiling};
const bytes = Buffer.from(`${JSON.stringify(result, null, 2)}\n`);
await writeFile(`${root}/RESULT.json`, bytes, {flag: 'wx', mode: 0o600});
process.stdout.write(`${JSON.stringify({status: result.status,
  tokenizer_calls: result.tokenizer_calls, generation_calls: result.generation_calls,
  invalid_responses: result.invalid_responses, result_sha256: sha(bytes)})}\n`);
if (result.status !== 'completed-two-judge-attempts') process.exitCode = 2;
