#!/usr/bin/env node
// VPS-only one-shot r7 Java GLM rerank; Python r6 responses carry unchanged.
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = '/opt/are-benchmark-runs/g01-bugswarm-java-evidence-exposed-r7';
const priorRoot = '/opt/are-benchmark-runs/g01-bugswarm-hybrid-exposed-r6';
const packetsPath = join(root, 'PACKETS.jsonl');
const packetSealPath = join(root, 'PACKET-SEAL.json');
const tokenFreezePath = join(root, 'TOKENIZER-FREEZE.json');
const tokenResultPath = join(root, 'TOKENIZER-RESULT.json');
const protocolPath = join(root, 'G01-BUGSWARM-JAVA-EVIDENCE-R7-EXPOSED-PROTOCOL.md');
const packetsSha = '23e85916c8d4c214babd93239049882b2fed9543f8eef788db2551552953f37f';
const packetSealSha = '05672eab88f5116bf0e2ad85bb4e30830c6dcfef8354393292e5bbb0bfdace06';
const tokenFreezeSha = '835df9df7cba8088626746ad4b3951291b921a6f528df053da7b313312caac6a';
const tokenResultSha = '732ac41b06e881f3abaa9e79f0d3453d1e9fb87b557b98cb290e2f6453ce1200';
const protocolSha = 'f409222a2c1629cc5428f40f2513b33db5ee81f9027e2bc6c5f79281b12ab18f';
const priorPacketsSha = '5dd0f9f92348211dff92d401e3018f0f88cf5c278dc120d8692776cc24d99b9e';
const priorGenResultSha = '180965a25874db733ee2890189f3bf7d2ad32cf972625f87a0b6a65fb4fd8423';
const transportPath = '/opt/are/evolution-runtime/g01-source-combined-candidate-r8/implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
const transportSha = '5669b2c72d642e1ccf1d5bd796064c1e61d9dcad8828622f9b6f4450acdec56d';
const secretPath = '/opt/are-keld-presentation/secrets/model_api_key';
const model = 'glm-5.3-flash';
const endpoint = 'https://api.z.ai/api/paas/v4/chat/completions';
const sha = value => createHash('sha256').update(value).digest('hex');
const digest = path => sha(readFileSync(path));
const save = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n',
  {flag:'wx', mode:0o600});
const need = (condition, reason) => {if (!condition) throw Error(`bugswarm-java-evidence-r7.${reason}`);};

function readInputs() {
  need(digest(packetsPath) === packetsSha && digest(packetSealPath) === packetSealSha &&
    digest(tokenFreezePath) === tokenFreezeSha && digest(tokenResultPath) === tokenResultSha &&
    digest(protocolPath) === protocolSha &&
    digest(join(priorRoot, 'PACKETS.jsonl')) === priorPacketsSha &&
    digest(join(priorRoot, 'GENERATION-RESULT.json')) === priorGenResultSha &&
    digest(transportPath) === transportSha, 'input-pin-drift');
  const packets = readFileSync(packetsPath, 'utf8').trimEnd().split('\n').map(JSON.parse);
  const prior = readFileSync(join(priorRoot, 'PACKETS.jsonl'), 'utf8').trimEnd().split('\n').map(JSON.parse);
  const seal = JSON.parse(readFileSync(packetSealPath, 'utf8'));
  const tokenResult = JSON.parse(readFileSync(tokenResultPath, 'utf8'));
  need(seal.cases === 24 && seal.packets_sha256 === packetsSha &&
    !seal.gold_opened && seal.model_calls === 0 && packets.length === 24 &&
    prior.length === 24 && tokenResult.status === 'admitted' &&
    tokenResult.new_attempts === 12 && tokenResult.new_admitted === 12 &&
    tokenResult.combined_prompt_tokens === 63620, 'preflight-shape');
  const carriedResponseHashes = [];
  const tokenHashes = [];
  let newTokens = 0;
  for (let index = 0; index < 24; index++) {
    const packet = packets[index];
    need(packet.ordinal === index + 1 && packet.java_evidence_r7 &&
      !packet.gold_opened && packet.candidate_count <= 30 &&
      packet.candidates.length === packet.candidate_count &&
      packet.candidates.every((row, n) => row.candidate_id === n + 1),
      `packet-shape:${index + 1}`);
    if (index < 12) {
      const priorPath = join(priorRoot, `GENERATION-${String(index + 1).padStart(2, '0')}.json`);
      const response = JSON.parse(readFileSync(priorPath, 'utf8'));
      need(packet.language === 'Python' && packet.prompt === prior[index].prompt &&
        response.ordinal === packet.ordinal && response.id === packet.id &&
        response.status === 'valid' && response.prompt_sha256 === sha(packet.prompt),
        `carried-response:${index + 1}`);
      carriedResponseHashes.push(digest(priorPath));
    } else {
      const tokenPath = join(root, `TOKENIZER-${String(index + 1).padStart(2, '0')}.json`);
      const token = JSON.parse(readFileSync(tokenPath, 'utf8'));
      need(packet.language === 'Java' && token.ordinal === packet.ordinal &&
        token.id === packet.id && token.status === 200 && token.admitted &&
        token.prompt_sha256 === sha(packet.prompt) &&
        Number.isSafeInteger(token.prompt_tokens) && token.prompt_tokens + 512 <= 8192,
        `token-admission:${index + 1}`);
      newTokens += token.prompt_tokens;
      tokenHashes.push(digest(tokenPath));
    }
  }
  need(newTokens === 29422 && 34198 + newTokens <= 84615, 'prompt-cost-drift');
  return {packets, carriedResponseHashes, tokenHashes};
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
  const {packets, carriedResponseHashes, tokenHashes} = readInputs();
  const {postOnce, stable, MODEL} = await import(transportPath);
  need(MODEL === model, 'model-drift');
  const key = readFileSync(secretPath, 'utf8').trim();
  need(key.length >= 8 && key.length <= 8192, 'secret-shape');
  save(join(root, 'GENERATION-FREEZE.json'), {
    schema_version:'are.g01-bugswarm-java-evidence-rerank-exposed-r7-freeze/v1',
    posture:'private exposed development; no fresh or product claim',
    packets_sha256:packetsSha, packet_seal_sha256:packetSealSha,
    tokenizer_freeze_sha256:tokenFreezeSha, tokenizer_result_sha256:tokenResultSha,
    new_java_token_case_sha256:tokenHashes,
    carried_python_response_sha256:carriedResponseHashes,
    prior_generation_result_sha256:priorGenResultSha,
    protocol_sha256:protocolSha,
    runner_sha256:digest(fileURLToPath(import.meta.url)), transport_sha256:transportSha,
    model, endpoint, new_java_cases:12, carried_python_cases:12,
    maximum_generation_calls:12, maximum_output_tokens:512,
    automatic_retries:0, combined_prompt_tokens:63620,
    prompt_cost_cap_tokens:84615,
    invalid_policy:'count-invalid-no-retry', transport_failure_policy:'stop-no-retry'
  });
  let valid = 0;
  let attempts = 0;
  for (const packet of packets.slice(12)) {
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
    const row = {schema_version:'are.g01-bugswarm-java-evidence-rerank-exposed-r7-response/v1',
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
  const result = {schema_version:'are.g01-bugswarm-java-evidence-rerank-exposed-r7-result/v1',
    status:attempts === 12 && valid === 12 ? 'completed-valid' : 'terminal-incomplete-or-invalid',
    new_java_cases:12, carried_python_cases:12, attempts, valid,
    maximum_generation_calls:12, automatic_retries:0, packets_sha256:packetsSha};
  save(join(root, 'GENERATION-RESULT.json'), result);
  process.stdout.write(JSON.stringify(result) + '\n');
  if (result.status !== 'completed-valid') process.exitCode = 2;
}

if (process.argv.length !== 2) throw Error('usage: run-bugswarm-java-evidence-rerank-exposed-r7.mjs');
await run();
