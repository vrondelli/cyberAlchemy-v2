#!/usr/bin/env node
// VPS-only Java tokenizer admission; Python r6 prompts/receipts are carried.
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = '/opt/are-benchmark-runs/g01-bugswarm-java-evidence-exposed-r7';
const priorRoot = '/opt/are-benchmark-runs/g01-bugswarm-hybrid-exposed-r6';
const packetPath = join(root, 'PACKETS.jsonl');
const sealPath = join(root, 'PACKET-SEAL.json');
const protocolPath = join(root, 'G01-BUGSWARM-JAVA-EVIDENCE-R7-EXPOSED-PROTOCOL.md');
const packetSha = '23e85916c8d4c214babd93239049882b2fed9543f8eef788db2551552953f37f';
const sealSha = '05672eab88f5116bf0e2ad85bb4e30830c6dcfef8354393292e5bbb0bfdace06';
const priorPacketSha = '5dd0f9f92348211dff92d401e3018f0f88cf5c278dc120d8692776cc24d99b9e';
const priorResultSha = '890b56ad49b135393615efdb7f1c48243c77014079192cb0650e50be6cbddca4';
const transportPath = '/opt/are/evolution-runtime/g01-source-combined-candidate-r8/implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
const transportSha = '5669b2c72d642e1ccf1d5bd796064c1e61d9dcad8828622f9b6f4450acdec56d';
const secretPath = '/opt/are-keld-presentation/secrets/model_api_key';
const endpoint = 'https://api.z.ai/api/paas/v4/tokenizer';
const model = 'glm-5.3-flash';
const sha = value => createHash('sha256').update(value).digest('hex');
const digest = path => sha(readFileSync(path));
const save = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n',
  {flag:'wx', mode:0o600});
const need = (condition, reason) => {if (!condition) throw Error(`bugswarm-java-evidence-tokenizer-r7.${reason}`);};

function readInputs() {
  need(digest(packetPath) === packetSha && digest(sealPath) === sealSha &&
    digest(join(priorRoot, 'PACKETS.jsonl')) === priorPacketSha &&
    digest(join(priorRoot, 'TOKENIZER-RESULT.json')) === priorResultSha &&
    digest(transportPath) === transportSha, 'input-pin-drift');
  const seal = JSON.parse(readFileSync(sealPath, 'utf8'));
  const packets = readFileSync(packetPath, 'utf8').trimEnd().split('\n').map(JSON.parse);
  const prior = readFileSync(join(priorRoot, 'PACKETS.jsonl'), 'utf8').trimEnd().split('\n').map(JSON.parse);
  need(seal.cases === 24 && seal.packets_sha256 === packetSha &&
    !seal.gold_opened && seal.model_calls === 0 && packets.length === 24 &&
    prior.length === 24, 'packet-shape');
  let carriedTokens = 0;
  const carriedTokenHashes = [];
  for (let index = 0; index < 24; index++) {
    const packet = packets[index];
    need(packet.ordinal === index + 1 && packet.java_evidence_r7 === true &&
      !packet.gold_opened && packet.candidate_count > 0 &&
      packet.candidate_count <= 30 && packet.candidates.length === packet.candidate_count &&
      packet.candidates.every((row, rowIndex) => row.candidate_id === rowIndex + 1) &&
      new Set(packet.candidates.map(row => row.path)).size === packet.candidate_count &&
      Buffer.byteLength(packet.prompt) <= 18000, `case-shape:${index + 1}`);
    if (index < 12) {
      const tokenPath = join(priorRoot, `TOKENIZER-${String(index + 1).padStart(2, '0')}.json`);
      const token = JSON.parse(readFileSync(tokenPath, 'utf8'));
      need(packet.language === 'Python' && packet.prompt === prior[index].prompt &&
        token.ordinal === packet.ordinal && token.id === packet.id && token.admitted &&
        token.prompt_sha256 === sha(packet.prompt), `carried-python:${index + 1}`);
      carriedTokens += token.prompt_tokens;
      carriedTokenHashes.push(digest(tokenPath));
    } else need(packet.language === 'Java', `java-case:${index + 1}`);
  }
  need(carriedTokens === 34198, 'carried-prompt-cost-drift');
  return {packets, carriedTokens, carriedTokenHashes};
}

async function run() {
  need(!existsSync(join(root, 'TOKENIZER-FREEZE.json')) &&
    !existsSync(join(root, 'TOKENIZER-RESULT.json')), 'prior-run');
  const {packets, carriedTokens, carriedTokenHashes} = readInputs();
  const {postOnce, stable, MODEL} = await import(transportPath);
  need(MODEL === model, 'transport-model-drift');
  const key = readFileSync(secretPath, 'utf8').trim();
  need(key.length >= 8 && key.length <= 8192, 'secret-shape');
  save(join(root, 'TOKENIZER-FREEZE.json'), {
    schema_version:'are.g01-bugswarm-java-evidence-tokenizer-freeze-exposed-r7/v1',
    posture:'private exposed development; tokenizer only; no gold or generation',
    packets_sha256:packetSha, packet_seal_sha256:sealSha,
    protocol_sha256:digest(protocolPath), prior_packets_sha256:priorPacketSha,
    prior_tokenizer_result_sha256:priorResultSha,
    carried_python_token_case_sha256:carriedTokenHashes,
    runner_sha256:digest(fileURLToPath(import.meta.url)), transport_sha256:transportSha,
    model, endpoint, new_java_cases:12, carried_python_cases:12,
    maximum_tokenizer_calls:12, maximum_generation_calls:0,
    output_reserve_tokens:512, maximum_prompt_plus_reserve_tokens:8192,
    aggregate_prompt_token_cap:84615, carried_prompt_tokens:carriedTokens,
    automatic_retries:0, invalid_policy:'stop-no-retry'
  });
  const admissions = [];
  for (const packet of packets.slice(12)) {
    const request = stable({model, messages:[{role:'user', content:packet.prompt}]});
    const started = Date.now();
    let response;
    try {
      response = await postOnce(new URL(endpoint), request,
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
  const newTokens = admissions.reduce((sum, row) => sum + (row.prompt_tokens ?? 0), 0);
  const result = {schema_version:'are.g01-bugswarm-java-evidence-tokenizer-result-exposed-r7/v1',
    status:admissions.length === 12 && admissions.every(row => row.admitted) &&
      carriedTokens + newTokens <= 84615 ? 'admitted' : 'not-admitted',
    packets_sha256:packetSha, new_attempts:admissions.length,
    new_admitted:admissions.filter(row => row.admitted).length,
    carried_python_cases:12, carried_prompt_tokens:carriedTokens,
    new_java_prompt_tokens:newTokens, combined_prompt_tokens:carriedTokens + newTokens,
    maximum_java_prompt_tokens:Math.max(...admissions.map(row => row.prompt_tokens ?? 0)),
    summed_tokenizer_elapsed_ms:admissions.reduce((sum, row) => sum + row.elapsed_ms, 0),
    maximum_generation_calls:0};
  save(join(root, 'TOKENIZER-RESULT.json'), result);
  process.stdout.write(JSON.stringify(result) + '\n');
  if (result.status !== 'admitted') process.exitCode = 2;
}

if (process.argv.length !== 2) throw Error('usage: tokenize-bugswarm-java-evidence-exposed-r7.mjs');
await run();
