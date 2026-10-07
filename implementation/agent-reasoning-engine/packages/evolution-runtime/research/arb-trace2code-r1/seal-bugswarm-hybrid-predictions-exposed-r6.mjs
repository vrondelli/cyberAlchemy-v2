#!/usr/bin/env node
// Bind all 24 r6 GLM selections before evaluator-only BugSwarm access.
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {stable} from '../../../coding-agent-runtime/glm-flash-v1/transport.mjs';

const archive = '/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004';
const root = join(archive, 'exposed-hybrid-r6');
const generationRoot = join(root, 'generation-vps');
const tokenizerRoot = join(root, 'tokenizer-vps');
const outputRoot = join(root, 'predictions-r6');
const packetsSha = '5dd0f9f92348211dff92d401e3018f0f88cf5c278dc120d8692776cc24d99b9e';
const packetSealSha = 'fd1ab5a039a5345b61e9d556a5ddd79723ff66ed2d88ef795e1b75a1ad680cdc';
const generationFreezeSha = '14872bcf3d69da268c16584a3940824132b3d1e7a02f517949a763fc43c1c04c';
const generationResultSha = '180965a25874db733ee2890189f3bf7d2ad32cf972625f87a0b6a65fb4fd8423';
const sha = value => createHash('sha256').update(value).digest('hex');
const digest = path => sha(readFileSync(path));
const need = (condition, reason) => {if (!condition) throw Error(`bugswarm-hybrid-prediction-seal-r6.${reason}`);};

need(process.argv.length === 2, 'arguments');
need(!existsSync(outputRoot), 'output-exists');
const packetPath = join(root, 'PACKETS.jsonl');
const packetSealPath = join(root, 'PACKET-SEAL.json');
const freezePath = join(generationRoot, 'GENERATION-FREEZE.json');
const resultPath = join(generationRoot, 'GENERATION-RESULT.json');
need(digest(packetPath) === packetsSha && digest(packetSealPath) === packetSealSha &&
  digest(freezePath) === generationFreezeSha &&
  digest(resultPath) === generationResultSha, 'input-pin-drift');
const packetSeal = JSON.parse(readFileSync(packetSealPath, 'utf8'));
const freeze = JSON.parse(readFileSync(freezePath, 'utf8'));
const result = JSON.parse(readFileSync(resultPath, 'utf8'));
const packets = readFileSync(packetPath, 'utf8').trimEnd().split('\n').map(JSON.parse);
need(packetSeal.cases === 24 && packetSeal.packets_sha256 === packetsSha &&
  !packetSeal.gold_opened && packetSeal.model_calls === 0 &&
  freeze.packets_sha256 === packetsSha && freeze.tokenizer_case_sha256.length === 24 &&
  freeze.prompt_tokens === 70279 &&
  result.status === 'completed-valid' && result.attempts === 24 && result.valid === 24 &&
  packets.length === 24, 'run-or-packet-shape');
const rows = [];
const responseHashes = [];
let promptTokens = 0, completionTokens = 0, summedCallMs = 0;
for (let index = 0; index < 24; index++) {
  const packet = packets[index];
  const tokenPath = join(tokenizerRoot, `TOKENIZER-${String(index + 1).padStart(2, '0')}.json`);
  const responsePath = join(generationRoot, `GENERATION-${String(index + 1).padStart(2, '0')}.json`);
  const token = JSON.parse(readFileSync(tokenPath, 'utf8'));
  const response = JSON.parse(readFileSync(responsePath, 'utf8'));
  const choice = response.provider_payload?.choices?.[0];
  let parsed;
  try {parsed = JSON.parse(choice?.message?.content);}
  catch {throw Error(`bugswarm-hybrid-prediction-seal-r6.provider-json:${index + 1}`);}
  const ids = parsed?.candidate_ids;
  const body = stable({model:'glm-5.3-flash',
    messages:[{role:'user', content:packet.prompt}], stream:false,
    max_tokens:512, reasoning_effort:'low'});
  need(packet.ordinal === index + 1 && token.ordinal === index + 1 &&
    response.ordinal === index + 1 && packet.id === token.id &&
    packet.id === response.id && digest(tokenPath) === freeze.tokenizer_case_sha256[index] &&
    response.status === 'valid' && response.http_status === 200 &&
    response.finish_reason === 'stop' && choice?.finish_reason === 'stop' &&
    response.prompt_sha256 === sha(packet.prompt) &&
    response.request_sha256 === sha(body) &&
    Object.keys(parsed).join(',') === 'candidate_ids' && Array.isArray(ids) &&
    ids.length <= 8 && ids.every(id => Number.isSafeInteger(id) && id >= 1 &&
      id <= packet.candidate_count) && new Set(ids).size === ids.length &&
    JSON.stringify(ids) === JSON.stringify(response.selected_ids) &&
    response.provider_payload.usage?.prompt_tokens === token.prompt_tokens &&
    Number.isSafeInteger(response.provider_payload.usage?.completion_tokens) &&
    response.provider_payload.usage.completion_tokens >= 0 &&
    Number.isSafeInteger(response.elapsed_ms) && response.elapsed_ms >= 0,
    `response-integrity:${index + 1}`);
  const selectedPaths = ids.map(id => packet.candidates[id - 1].path);
  need(new Set(selectedPaths).size === selectedPaths.length, `selected-paths:${index + 1}`);
  responseHashes.push(digest(responsePath));
  promptTokens += token.prompt_tokens;
  completionTokens += response.provider_payload.usage.completion_tokens;
  summedCallMs += response.elapsed_ms;
  rows.push({ordinal:index + 1, id:packet.id, repo:packet.repo,
    language:packet.language, selected_ids:ids, selected_paths:selectedPaths,
    candidate_count:packet.candidate_count,
    prompt_tokens:token.prompt_tokens,
    completion_tokens:response.provider_payload.usage.completion_tokens,
    generation_elapsed_ms:response.elapsed_ms,
    response_sha256:responseHashes.at(-1), gold_opened:false});
}
need(promptTokens === 70279 && promptTokens <= 84615, 'prompt-cost-drift');
mkdirSync(outputRoot, {mode:0o700});
const predictionData = rows.map(row => JSON.stringify(row)).join('\n') + '\n';
const seal = {schema_version:'are.g01-bugswarm-hybrid-prediction-seal-exposed-r6/v1',
  posture:'exposed predictions sealed before evaluator join; no independent claim',
  packets_sha256:packetsSha, packet_seal_sha256:packetSealSha,
  generation_freeze_sha256:generationFreezeSha,
  generation_result_sha256:generationResultSha,
  generation_response_sha256:responseHashes,
  predictions_sha256:sha(predictionData), cases:24,
  known_prompt_tokens:promptTokens, known_completion_tokens:completionTokens,
  summed_generation_elapsed_ms:summedCallMs, gold_opened:false};
const sealData = JSON.stringify(seal, null, 2) + '\n';
writeFileSync(join(outputRoot, 'PREDICTIONS.jsonl'), predictionData,
  {flag:'wx', mode:0o600});
writeFileSync(join(outputRoot, 'PREDICTION-SEAL.json'), sealData,
  {flag:'wx', mode:0o600});
process.stdout.write(JSON.stringify({cases:24, known_prompt_tokens:promptTokens,
  known_completion_tokens:completionTokens, summed_generation_elapsed_ms:summedCallMs,
  predictions_sha256:seal.predictions_sha256, seal_sha256:sha(sealData)}) + '\n');
