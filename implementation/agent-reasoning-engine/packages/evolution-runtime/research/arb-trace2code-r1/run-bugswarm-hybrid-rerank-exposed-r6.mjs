#!/usr/bin/env node
// VPS-only, one-shot exposed BugSwarm hybrid r6 GLM rerank. No gold access.
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = '/opt/are-benchmark-runs/g01-bugswarm-hybrid-exposed-r6';
const packetsPath = join(root, 'PACKETS.jsonl');
const packetSealPath = join(root, 'PACKET-SEAL.json');
const tokenizerFreezePath = join(root, 'TOKENIZER-FREEZE.json');
const tokenizerResultPath = join(root, 'TOKENIZER-RESULT.json');
const protocolPath = join(root, 'G01-BUGSWARM-HYBRID-R6-EXPOSED-PROTOCOL.md');
const packetsSha = '5dd0f9f92348211dff92d401e3018f0f88cf5c278dc120d8692776cc24d99b9e';
const packetSealSha = 'fd1ab5a039a5345b61e9d556a5ddd79723ff66ed2d88ef795e1b75a1ad680cdc';
const tokenizerFreezeSha = '47f8f88e1d89f604f2d131df2af6d2c11202df708d4f667f8773ea9eb1051661';
const tokenizerResultSha = '890b56ad49b135393615efdb7f1c48243c77014079192cb0650e50be6cbddca4';
const protocolSha = 'ee4181e4c848d6195ab061616aace2c153832d6c2f16dd7ffee988b8bed299b3';
const transportPath = '/opt/are/evolution-runtime/g01-source-combined-candidate-r8/implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
const transportSha = '5669b2c72d642e1ccf1d5bd796064c1e61d9dcad8828622f9b6f4450acdec56d';
const secretPath = '/opt/are-keld-presentation/secrets/model_api_key';
const model = 'glm-5.3-flash';
const endpoint = 'https://api.z.ai/api/paas/v4/chat/completions';
const sha = value => createHash('sha256').update(value).digest('hex');
const digest = path => sha(readFileSync(path));
const save = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n',
  {flag:'wx', mode:0o600});
const need = (condition, reason) => {if (!condition) throw Error(`bugswarm-hybrid-r6.${reason}`);};

function readInputs() {
  need(digest(packetsPath) === packetsSha && digest(packetSealPath) === packetSealSha &&
    digest(tokenizerFreezePath) === tokenizerFreezeSha &&
    digest(tokenizerResultPath) === tokenizerResultSha &&
    digest(protocolPath) === protocolSha && digest(transportPath) === transportSha,
    'input-pin-drift');
  const packetSeal = JSON.parse(readFileSync(packetSealPath, 'utf8'));
  const tokenResult = JSON.parse(readFileSync(tokenizerResultPath, 'utf8'));
  const packets = readFileSync(packetsPath, 'utf8').trimEnd().split('\n').map(JSON.parse);
  need(packetSeal.cases === 24 && packetSeal.packets_sha256 === packetsSha &&
    packetSeal.gold_opened === false && packetSeal.model_calls === 0 &&
    tokenResult.status === 'admitted' && tokenResult.attempts === 24 &&
    tokenResult.admitted === 24 && tokenResult.summed_prompt_tokens === 70279 &&
    packets.length === 24, 'preflight-shape');
  let promptTokens = 0;
  const tokenHashes = [];
  for (let index = 0; index < 24; index++) {
    const packet = packets[index];
    const tokenPath = join(root, `TOKENIZER-${String(index + 1).padStart(2, '0')}.json`);
    const token = JSON.parse(readFileSync(tokenPath, 'utf8'));
    tokenHashes.push(digest(tokenPath));
    need(packet.ordinal === index + 1 && token.ordinal === index + 1 &&
      packet.id === token.id && packet.gold_opened === false &&
      packet.hybrid_r6 === true && token.prompt_sha256 === sha(packet.prompt) &&
      token.status === 200 && token.admitted === true &&
      Number.isSafeInteger(token.prompt_tokens) && token.prompt_tokens + 512 <= 8192 &&
      packet.candidates.length === packet.candidate_count &&
      packet.candidate_count <= 30 &&
      packet.candidates.every((row, rowIndex) => row.candidate_id === rowIndex + 1),
      `case-preflight:${index + 1}`);
    promptTokens += token.prompt_tokens;
  }
  need(promptTokens === 70279 && promptTokens <= 84615, 'prompt-cost-cap');
  return {packets, tokenHashes, promptTokens};
}

function parseSelection(content, packet) {
  const value = JSON.parse(content);
  need(value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).join(',') === 'candidate_ids' && Array.isArray(value.candidate_ids) &&
    value.candidate_ids.length <= 8 &&
    value.candidate_ids.every(id => Number.isSafeInteger(id) && id >= 1 &&
      id <= packet.candidate_count) &&
    new Set(value.candidate_ids).size === value.candidate_ids.length, 'response-shape');
  return value.candidate_ids;
}

async function run() {
  need(!existsSync(join(root, 'GENERATION-FREEZE.json')) &&
    !existsSync(join(root, 'GENERATION-RESULT.json')), 'prior-run');
  const {packets, tokenHashes, promptTokens} = readInputs();
  const {postOnce, stable, MODEL} = await import(transportPath);
  need(MODEL === model, 'model-drift');
  const key = readFileSync(secretPath, 'utf8').trim();
  need(key.length >= 8 && key.length <= 8192, 'secret-shape');
  save(join(root, 'GENERATION-FREEZE.json'), {
    schema_version:'are.g01-bugswarm-hybrid-rerank-exposed-r6-freeze/v1',
    posture:'private exposed development; no fresh or product claim',
    packets_sha256:packetsSha, packet_seal_sha256:packetSealSha,
    tokenizer_freeze_sha256:tokenizerFreezeSha,
    tokenizer_result_sha256:tokenizerResultSha,
    tokenizer_case_sha256:tokenHashes, protocol_sha256:protocolSha,
    runner_sha256:digest(fileURLToPath(import.meta.url)), transport_sha256:transportSha,
    model, endpoint, cases:24, maximum_generation_calls:24,
    maximum_output_tokens:512, automatic_retries:0,
    prompt_tokens:promptTokens, prompt_cost_cap_tokens:84615,
    invalid_policy:'count-invalid-no-retry', transport_failure_policy:'stop-no-retry'
  });
  let valid = 0;
  let attempts = 0;
  for (const packet of packets) {
    const body = stable({model, messages:[{role:'user', content:packet.prompt}],
      stream:false, max_tokens:512, reasoning_effort:'low'});
    const started = Date.now();
    let response;
    try {
      response = await postOnce(new URL(endpoint), body,
        {apiKey:key, timeout_ms:120000, maximum_response_bytes:262144});
    } catch (error) {
      response = {status:null, payload:null,
        failure_code:String(error?.code ?? error?.message ?? 'request-failed').slice(0,100)};
    }
    const choice = response.payload?.choices?.[0];
    let selected = null;
    let invalid = null;
    if (response.status === 200 && choice?.finish_reason === 'stop' &&
        typeof choice?.message?.content === 'string') {
      try {selected = parseSelection(choice.message.content, packet);}
      catch (error) {invalid = String(error.message).slice(0,160);}
    } else invalid = 'provider-status-finish-or-content';
    const row = {schema_version:'are.g01-bugswarm-hybrid-rerank-exposed-r6-response/v1',
      ordinal:packet.ordinal, id:packet.id, request_sha256:sha(body),
      prompt_sha256:sha(packet.prompt), status:selected === null ? 'invalid' : 'valid',
      http_status:response.status, failure_code:response.failure_code ?? null,
      elapsed_ms:Date.now() - started, finish_reason:choice?.finish_reason ?? null,
      validation_error:invalid, selected_ids:selected, provider_payload:response.payload ?? null};
    save(join(root, `GENERATION-${String(packet.ordinal).padStart(2, '0')}.json`), row);
    attempts++;
    if (row.status === 'valid') valid++;
    process.stdout.write(JSON.stringify({ordinal:row.ordinal, status:row.status,
      http_status:row.http_status, selected_count:selected?.length ?? null,
      prompt_tokens:response.payload?.usage?.prompt_tokens ?? null,
      completion_tokens:response.payload?.usage?.completion_tokens ?? null}) + '\n');
    if (response.status !== 200 || response.failure_code) break;
  }
  const result = {schema_version:'are.g01-bugswarm-hybrid-rerank-exposed-r6-result/v1',
    status:attempts === 24 && valid === 24 ? 'completed-valid' : 'terminal-incomplete-or-invalid',
    cases:24, attempts, valid, maximum_generation_calls:24, automatic_retries:0,
    packets_sha256:packetsSha};
  save(join(root, 'GENERATION-RESULT.json'), result);
  process.stdout.write(JSON.stringify(result) + '\n');
  if (result.status !== 'completed-valid') process.exitCode = 2;
}

if (process.argv.length !== 2) throw Error('usage: run-bugswarm-hybrid-rerank-exposed-r6.mjs');
await run();
