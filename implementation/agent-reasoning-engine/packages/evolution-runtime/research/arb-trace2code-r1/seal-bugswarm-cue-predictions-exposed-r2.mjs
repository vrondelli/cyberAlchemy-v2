#!/usr/bin/env node
// Bind 24 exposed GLM selections before opening evaluator-only BugSwarm labels.
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {stable} from '../../../coding-agent-runtime/glm-flash-v1/transport.mjs';

const archive = '/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004';
const packetRoot = join(archive, 'exposed-cue-packets-r1');
const generationRoot = join(packetRoot, 'generation-vps-r2');
const tokenizerRoot = join(packetRoot, 'tokenizer-vps-r1');
const outputRoot = join(packetRoot, 'predictions-r2');
const packetsSha = 'ebea9efb6d9ccc2b18588d39fc128e542487e6551e1a7203a74ee245862269e7';
const packetSealSha = '1fc2f018504531db7392af47cb6eafc7a2975c51508e978b80e10de4d5b4a87c';
const generationFreezeSha = '1b3bfb4bf0e22d909cbc4c7d0f06b182374b412b18ab424d77a3c2f6a836117c';
const generationResultSha = '5d168ece82c249ad63ba49a1eb5e3462166eab77af20f9198aaf2cf441ad3ef3';
const sha = value => createHash('sha256').update(value).digest('hex');
const digest = path => sha(readFileSync(path));
const need = (condition, reason) => {if (!condition) throw Error(`bugswarm-cue-prediction-seal.${reason}`);};

need(process.argv.length === 2, 'arguments');
need(!existsSync(outputRoot), 'output-exists');
const packetPath = join(packetRoot, 'PACKETS.jsonl');
const packetSealPath = join(packetRoot, 'PACKET-SEAL.json');
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
  result.status === 'completed-valid' && result.attempts === 24 && result.valid === 24 &&
  packets.length === 24, 'run-or-packet-shape');
const rows = [];
const responseHashes = [];
let promptTokens = 0, completionTokens = 0, summedCallMs = 0;
for (let i = 0; i < 24; i++) {
  const packet = packets[i];
  const tokenPath = join(tokenizerRoot, `TOKENIZER-${String(i + 1).padStart(2, '0')}.json`);
  const responsePath = join(generationRoot, `GENERATION-${String(i + 1).padStart(2, '0')}.json`);
  const token = JSON.parse(readFileSync(tokenPath, 'utf8'));
  const response = JSON.parse(readFileSync(responsePath, 'utf8'));
  const choice = response.provider_payload?.choices?.[0];
  let parsed;
  try {parsed = JSON.parse(choice?.message?.content);}
  catch {throw Error(`bugswarm-cue-prediction-seal.provider-json:${i + 1}`);}
  const ids = parsed?.candidate_ids;
  const body = stable({model:'glm-5.3-flash',
    messages:[{role:'user', content:packet.prompt}], stream:false,
    max_tokens:512, reasoning_effort:'low'});
  need(packet.ordinal === i + 1 && token.ordinal === i + 1 && response.ordinal === i + 1 &&
    packet.id === token.id && packet.id === response.id &&
    digest(tokenPath) === freeze.tokenizer_case_sha256[i] &&
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
    `response-integrity:${i + 1}`);
  const selectedPaths = ids.map(id => packet.candidates[id - 1].path);
  need(new Set(selectedPaths).size === selectedPaths.length, `selected-paths:${i + 1}`);
  responseHashes.push(digest(responsePath));
  promptTokens += token.prompt_tokens;
  completionTokens += response.provider_payload.usage.completion_tokens;
  summedCallMs += response.elapsed_ms;
  rows.push({ordinal:i + 1, id:packet.id, repo:packet.repo, language:packet.language,
    selected_ids:ids, selected_paths:selectedPaths,
    candidate_count:packet.candidate_count,
    prompt_tokens:token.prompt_tokens,
    completion_tokens:response.provider_payload.usage.completion_tokens,
    generation_elapsed_ms:response.elapsed_ms,
    response_sha256:responseHashes.at(-1), gold_opened:false});
}
need(promptTokens === 71784 && promptTokens <= Math.floor(56410 * 1.5),
  'prompt-cost-drift');
mkdirSync(outputRoot, {mode:0o700});
const predictionData = rows.map(row => JSON.stringify(row)).join('\n') + '\n';
const seal = {schema_version:'are.g01-bugswarm-cue-prediction-seal-exposed-r2/v1',
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
