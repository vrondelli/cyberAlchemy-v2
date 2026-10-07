#!/usr/bin/env node
// VPS-only tokenizer admission for sealed, already-exposed BugSwarm cue packets.
// It performs no generation call and opens no evaluator artifact.
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = '/opt/are-benchmark-runs/g01-bugswarm-cue-packets-exposed-r1';
const packetsPath = join(root, 'PACKETS.jsonl');
const sealPath = join(root, 'PACKET-SEAL.json');
const packetsSha = 'ebea9efb6d9ccc2b18588d39fc128e542487e6551e1a7203a74ee245862269e7';
const sealSha = '1fc2f018504531db7392af47cb6eafc7a2975c51508e978b80e10de4d5b4a87c';
const transportPath = '/opt/are/evolution-runtime/g01-source-combined-candidate-r8/implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
const transportSha = '5669b2c72d642e1ccf1d5bd796064c1e61d9dcad8828622f9b6f4450acdec56d';
const secretPath = '/opt/are-keld-presentation/secrets/model_api_key';
const tokenizerEndpoint = 'https://api.z.ai/api/paas/v4/tokenizer';
const model = 'glm-5.3-flash';
const sha = value => createHash('sha256').update(value).digest('hex');
const digest = path => sha(readFileSync(path));
const save = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n',
  {flag:'wx', mode:0o600});
const need = (condition, reason) => {if (!condition) throw Error(`bugswarm-cue-tokenizer.${reason}`);};

function readPackets() {
  need(digest(packetsPath) === packetsSha && digest(sealPath) === sealSha, 'packet-pin-drift');
  const seal = JSON.parse(readFileSync(sealPath, 'utf8'));
  const packets = readFileSync(packetsPath, 'utf8').trimEnd().split('\n').map(JSON.parse);
  need(seal.cases === 24 && seal.packets_sha256 === packetsSha && !seal.gold_opened &&
    seal.model_calls === 0 && packets.length === 24, 'seal-shape');
  for (let i = 0; i < packets.length; i++) {
    const packet = packets[i];
    need(packet.ordinal === i + 1 && packet.exposed_development === true &&
      packet.gold_opened === false && packet.candidates.length === packet.candidate_count &&
      packet.candidate_count > 0 && packet.candidate_count <= 30 &&
      packet.candidates.every((entry, index) => entry.candidate_id === index + 1) &&
      new Set(packet.candidates.map(entry => entry.path)).size === packet.candidate_count &&
      Buffer.byteLength(packet.prompt) <= 18000, `packet-shape:${i + 1}`);
  }
  return packets;
}

async function run() {
  need(!existsSync(join(root, 'TOKENIZER-FREEZE.json')) &&
    !existsSync(join(root, 'TOKENIZER-RESULT.json')), 'prior-run');
  need(digest(transportPath) === transportSha, 'transport-pin-drift');
  const {postOnce, stable, MODEL} = await import(transportPath);
  need(MODEL === model, 'transport-model-drift');
  const key = readFileSync(secretPath, 'utf8').trim();
  need(key.length >= 8 && key.length <= 8192, 'secret-shape');
  const packets = readPackets();
  save(join(root, 'TOKENIZER-FREEZE.json'), {
    schema_version:'are.g01-bugswarm-cue-tokenizer-freeze-exposed-r1/v1',
    posture:'private exposed development; tokenizer only; no gold or generation',
    packets_sha256:packetsSha, packet_seal_sha256:sealSha,
    runner_sha256:digest(fileURLToPath(import.meta.url)), transport_sha256:transportSha,
    model, endpoint:tokenizerEndpoint, cases:24, maximum_tokenizer_calls:24,
    maximum_generation_calls:0, maximum_prompt_plus_reserve_tokens:8192,
    output_reserve_tokens:512, automatic_retries:0, invalid_policy:'stop-no-retry'
  });
  const admissions = [];
  for (const packet of packets) {
    const messages = [{role:'user', content:packet.prompt}];
    const request = stable({model, messages});
    const started = Date.now();
    let response;
    try {
      response = await postOnce(new URL(tokenizerEndpoint), request,
        {apiKey:key, timeout_ms:30000, maximum_response_bytes:262144});
    } catch (error) {
      response = {status:null, payload:null,
        failure_code:String(error?.code ?? error?.message ?? 'request-failed').slice(0,100)};
    }
    const promptTokens = response.payload?.usage?.prompt_tokens;
    const admitted = response.status === 200 && Number.isSafeInteger(promptTokens) &&
      promptTokens + 512 <= 8192;
    const row = {ordinal:packet.ordinal, id:packet.id, prompt_sha256:sha(packet.prompt),
      request_sha256:sha(request), status:response.status,
      response_sha256:response.payload === null ? null : sha(JSON.stringify(response.payload)),
      failure_code:response.failure_code ?? null, elapsed_ms:Date.now() - started,
      prompt_tokens:Number.isSafeInteger(promptTokens) ? promptTokens : null, admitted};
    save(join(root, `TOKENIZER-${String(packet.ordinal).padStart(2, '0')}.json`), row);
    admissions.push(row);
    process.stdout.write(JSON.stringify({ordinal:row.ordinal, status:row.status,
      prompt_tokens:row.prompt_tokens, admitted}) + '\n');
    if (!admitted) break;
  }
  const result = {schema_version:'are.g01-bugswarm-cue-tokenizer-result-exposed-r1/v1',
    status:admissions.length === 24 && admissions.every(row => row.admitted)
      ? 'admitted' : 'not-admitted', packets_sha256:packetsSha,
    attempts:admissions.length, admitted:admissions.filter(row => row.admitted).length,
    maximum_prompt_tokens:Math.max(...admissions.map(row => row.prompt_tokens ?? 0)),
    summed_tokenizer_elapsed_ms:admissions.reduce((sum, row) => sum + row.elapsed_ms, 0),
    maximum_generation_calls:0};
  save(join(root, 'TOKENIZER-RESULT.json'), result);
  process.stdout.write(JSON.stringify(result) + '\n');
  if (result.status !== 'admitted') process.exitCode = 2;
}

if (process.argv.length !== 2) throw Error('usage: tokenize-bugswarm-cue-packets-exposed-r1.mjs');
await run();
