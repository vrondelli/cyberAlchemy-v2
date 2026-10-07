#!/usr/bin/env node
// Source-only 24-case r7 prediction seal: carried Python, new Java.
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {stable} from '../../../coding-agent-runtime/glm-flash-v1/transport.mjs';

const archive = '/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004';
const root = join(archive, 'exposed-java-evidence-r7');
const priorRoot = join(archive, 'exposed-hybrid-r6');
const outputRoot = join(root, 'predictions-r7');
const packetSha = '23e85916c8d4c214babd93239049882b2fed9543f8eef788db2551552953f37f';
const sealSha = '05672eab88f5116bf0e2ad85bb4e30830c6dcfef8354393292e5bbb0bfdace06';
const generationFreezeSha = '47bc2c83a29cb2c9046359e61a536bbeb2dc76edc64b739c16fc6c83e92e3afa';
const generationResultSha = '6008d42c04fe6436e004c55e692cdff57708da97cbad8d081d4e0a36740c023e';
const priorPacketSha = '5dd0f9f92348211dff92d401e3018f0f88cf5c278dc120d8692776cc24d99b9e';
const priorPredictionsSha = 'c6a42d5e12b2c193797f0a287c9c8e087ca79ce7b6af442db6d5c9e61c2658ab';
const priorPredictionSealSha = '386174a416c1e9ceb71bd0ce3d48b0fe357273ec1af3a10ab31f0c7307980751';
const sha = value => createHash('sha256').update(value).digest('hex');
const digest = path => sha(readFileSync(path));
const need = (condition, reason) => {if (!condition) throw Error(`bugswarm-java-evidence-prediction-seal-r7.${reason}`);};

need(process.argv.length === 2 && !existsSync(outputRoot), 'arguments-or-output-exists');
const paths = {
  packets:join(root, 'PACKETS.jsonl'), seal:join(root, 'PACKET-SEAL.json'),
  genFreeze:join(root, 'generation-vps/GENERATION-FREEZE.json'),
  genResult:join(root, 'generation-vps/GENERATION-RESULT.json'),
  priorPackets:join(priorRoot, 'PACKETS.jsonl'),
  priorPredictions:join(priorRoot, 'predictions-r6/PREDICTIONS.jsonl'),
  priorSeal:join(priorRoot, 'predictions-r6/PREDICTION-SEAL.json')};
need(digest(paths.packets) === packetSha && digest(paths.seal) === sealSha &&
  digest(paths.genFreeze) === generationFreezeSha &&
  digest(paths.genResult) === generationResultSha &&
  digest(paths.priorPackets) === priorPacketSha &&
  digest(paths.priorPredictions) === priorPredictionsSha &&
  digest(paths.priorSeal) === priorPredictionSealSha, 'input-pin-drift');
const packets = readFileSync(paths.packets, 'utf8').trimEnd().split('\n').map(JSON.parse);
const priorPackets = readFileSync(paths.priorPackets, 'utf8').trimEnd().split('\n').map(JSON.parse);
const priorPredictions = readFileSync(paths.priorPredictions, 'utf8').trimEnd().split('\n').map(JSON.parse);
const freeze = JSON.parse(readFileSync(paths.genFreeze, 'utf8'));
const result = JSON.parse(readFileSync(paths.genResult, 'utf8'));
const priorSeal = JSON.parse(readFileSync(paths.priorSeal, 'utf8'));
need(packets.length === 24 && priorPackets.length === 24 && priorPredictions.length === 24 &&
  freeze.packets_sha256 === packetSha && freeze.carried_python_response_sha256.length === 12 &&
  freeze.new_java_token_case_sha256.length === 12 &&
  result.status === 'completed-valid' && result.attempts === 12 && result.valid === 12 &&
  priorSeal.predictions_sha256 === priorPredictionsSha && !priorSeal.gold_opened,
  'cohort-or-seal-shape');
const rows = [];
const newHashes = [];
let promptTokens = 0, completionTokens = 0, summedCallMs = 0;
for (let index = 0; index < 24; index++) {
  const packet = packets[index];
  need(packet.ordinal === index + 1 && packet.java_evidence_r7 &&
    !packet.gold_opened, `packet-shape:${index + 1}`);
  if (index < 12) {
    const prior = priorPredictions[index];
    need(packet.language === 'Python' && packet.prompt === priorPackets[index].prompt &&
      prior.ordinal === packet.ordinal && prior.id === packet.id &&
      prior.response_sha256 === freeze.carried_python_response_sha256[index] &&
      prior.selected_paths.join('\n') === prior.selected_ids.map(id =>
        packet.candidates[id - 1].path).join('\n') &&
      prior.candidate_count === packet.candidate_count, `carried-python:${index + 1}`);
    rows.push({...prior, carried_from_r6:true});
    promptTokens += prior.prompt_tokens;
    completionTokens += prior.completion_tokens;
    summedCallMs += prior.generation_elapsed_ms;
    continue;
  }
  const tokenPath = join(root, 'tokenizer-vps',
    `TOKENIZER-${String(index + 1).padStart(2, '0')}.json`);
  const responsePath = join(root, 'generation-vps',
    `GENERATION-${String(index + 1).padStart(2, '0')}.json`);
  const token = JSON.parse(readFileSync(tokenPath, 'utf8'));
  const response = JSON.parse(readFileSync(responsePath, 'utf8'));
  const choice = response.provider_payload?.choices?.[0];
  let parsed;
  try {parsed = JSON.parse(choice?.message?.content);}
  catch {throw Error(`bugswarm-java-evidence-prediction-seal-r7.provider-json:${index + 1}`);}
  const ids = parsed?.candidate_ids;
  const body = stable({model:'glm-5.3-flash',
    messages:[{role:'user', content:packet.prompt}], stream:false,
    max_tokens:512, reasoning_effort:'low'});
  need(packet.language === 'Java' && token.ordinal === packet.ordinal &&
    response.ordinal === packet.ordinal && token.id === packet.id &&
    response.id === packet.id && digest(tokenPath) === freeze.new_java_token_case_sha256[index - 12] &&
    response.status === 'valid' && response.http_status === 200 &&
    response.finish_reason === 'stop' && choice?.finish_reason === 'stop' &&
    response.prompt_sha256 === sha(packet.prompt) && response.request_sha256 === sha(body) &&
    Object.keys(parsed).join(',') === 'candidate_ids' && Array.isArray(ids) &&
    ids.length <= 8 && ids.every(id => Number.isSafeInteger(id) && id >= 1 &&
      id <= packet.candidate_count) && new Set(ids).size === ids.length &&
    JSON.stringify(ids) === JSON.stringify(response.selected_ids) &&
    response.provider_payload.usage?.prompt_tokens === token.prompt_tokens &&
    Number.isSafeInteger(response.provider_payload.usage?.completion_tokens) &&
    response.provider_payload.usage.completion_tokens >= 0 &&
    Number.isSafeInteger(response.elapsed_ms) && response.elapsed_ms >= 0,
    `new-java-integrity:${index + 1}`);
  const selectedPaths = ids.map(id => packet.candidates[id - 1].path);
  need(new Set(selectedPaths).size === selectedPaths.length, `selected-paths:${index + 1}`);
  newHashes.push(digest(responsePath));
  rows.push({ordinal:index + 1, id:packet.id, repo:packet.repo,
    language:packet.language, selected_ids:ids, selected_paths:selectedPaths,
    candidate_count:packet.candidate_count, prompt_tokens:token.prompt_tokens,
    completion_tokens:response.provider_payload.usage.completion_tokens,
    generation_elapsed_ms:response.elapsed_ms,
    response_sha256:newHashes.at(-1), carried_from_r6:false, gold_opened:false});
  promptTokens += token.prompt_tokens;
  completionTokens += response.provider_payload.usage.completion_tokens;
  summedCallMs += response.elapsed_ms;
}
need(promptTokens === 63620 && promptTokens <= 84615, 'prompt-cost-drift');
mkdirSync(outputRoot, {mode:0o700});
const predictionData = rows.map(row => JSON.stringify(row)).join('\n') + '\n';
const seal = {schema_version:'are.g01-bugswarm-java-evidence-prediction-seal-exposed-r7/v1',
  posture:'exposed predictions sealed before evaluator join; no independent claim',
  packets_sha256:packetSha, packet_seal_sha256:sealSha,
  generation_freeze_sha256:generationFreezeSha,
  generation_result_sha256:generationResultSha,
  carried_python_response_sha256:freeze.carried_python_response_sha256,
  new_java_response_sha256:newHashes,
  predictions_sha256:sha(predictionData), cases:24,
  carried_python_cases:12, new_java_cases:12,
  known_prompt_tokens:promptTokens, known_completion_tokens:completionTokens,
  summed_generation_elapsed_ms:summedCallMs, gold_opened:false};
const sealData = JSON.stringify(seal, null, 2) + '\n';
writeFileSync(join(outputRoot, 'PREDICTIONS.jsonl'), predictionData,
  {flag:'wx', mode:0o600});
writeFileSync(join(outputRoot, 'PREDICTION-SEAL.json'), sealData,
  {flag:'wx', mode:0o600});
process.stdout.write(JSON.stringify({cases:24, carried_python_cases:12,
  new_java_cases:12, known_prompt_tokens:promptTokens,
  known_completion_tokens:completionTokens,
  summed_generation_elapsed_ms:summedCallMs,
  predictions_sha256:seal.predictions_sha256, seal_sha256:sha(sealData)}) + '\n');
