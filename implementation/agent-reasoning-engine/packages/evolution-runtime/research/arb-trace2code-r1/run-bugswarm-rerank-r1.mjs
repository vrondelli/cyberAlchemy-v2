// VPS-only, frozen 24-repository BugSwarm GLM trace-to-code rerank.
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = '/opt/are-benchmark-runs/g01-bugswarm-transfer-r1-source';
const packetPath = join(root, 'packets-r1/PACKETS.jsonl');
const packetSha = 'ee0d6ff047426241b6533e5938f7da97219a6f64336b13e354b739c68e6baa76';
const packetSealPath = join(root, 'packets-r1/PACKET-SEAL.json');
const packetSealSha = 'be138a42969914a63a719b7ac50f5aa86f59c5a6ae5b9f6a4bd990ad23409bc4';
const campaignFreezePath = join(root, 'CAMPAIGN-FREEZE-R1.json');
const campaignFreezeSha = 'f3d46be103d8917a8f8e9e755b05d8a7da1e7d7a09181fec3c00d1158ec14151';
const protocolPath = join(root, 'G01-BUGSWARM-TRANSFER-R1-PROTOCOL.md');
const protocolSha = '8929d29cac3c03ccb9fb0a9344a9a227f4a0dc3558d8d5b6c1502e4ff671430b';
const transportPath = '/opt/are/evolution-runtime/g01-source-combined-candidate-r8/implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
const transportSha = '5669b2c72d642e1ccf1d5bd796064c1e61d9dcad8828622f9b6f4450acdec56d';
const secretPath = '/opt/are-keld-presentation/secrets/model_api_key';
const model = 'glm-5.3-flash';
const tokenizerEndpoint = 'https://api.z.ai/api/paas/v4/tokenizer';
const generationEndpoint = 'https://api.z.ai/api/paas/v4/chat/completions';
const sha = value => createHash('sha256').update(value).digest('hex');
const digest = path => sha(readFileSync(path));
const save = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n', {flag:'wx', mode:0o600});
const need = (ok, why) => {if (!ok) throw Error(`bugswarm-rerank-r1.${why}`);};

function packets() {
  need(digest(packetPath) === packetSha && digest(packetSealPath) === packetSealSha &&
    digest(campaignFreezePath) === campaignFreezeSha && digest(protocolPath) === protocolSha, 'input-drift');
  const data = readFileSync(packetPath, 'utf8').trimEnd().split('\n').map(JSON.parse);
  const sealed = JSON.parse(readFileSync(packetSealPath, 'utf8'));
  const frozen = JSON.parse(readFileSync(campaignFreezePath, 'utf8'));
  need(data.length === 24 && sealed.cases === 24 && sealed.packets_sha256 === packetSha &&
    new Set(data.map(x => x.id)).size === 24 && new Set(data.map(x => x.repo)).size === 24,
    'denominator');
  for (let i=0;i<data.length;i++) {
    const packet = data[i];
    need(packet.ordinal === i+1 && packet.id === frozen.case_ids[i] &&
      packet.candidates.length > 0 && packet.candidates.length <= 20 &&
      packet.candidates.every((x, j) => x.candidate_id === j+1) &&
      Buffer.byteLength(packet.prompt) <= 18000 &&
      packet.are_ranked_files.length === packet.chunk_ranked_files.length &&
      new Set(packet.are_ranked_files).size === packet.are_ranked_files.length &&
      packet.candidates.every(x => packet.are_ranked_files.includes(x.path)), `shape:${i+1}`);
  }
  return data;
}

function freeze() {
  return {schema:'are.g01-bugswarm-rerank-runner-freeze-r1/v1', status:'frozen-before-dispatch',
    posture:'private-provisional-BugSwarm-source-projected-trace-to-code',
    campaign_freeze_sha256:campaignFreezeSha, packet_sha256:packetSha,
    packet_seal_sha256:packetSealSha, protocol_sha256:protocolSha,
    runner_sha256:digest(fileURLToPath(import.meta.url)), transport_sha256:transportSha,
    model, reasoning_effort:'low', tokenizer_endpoint:tokenizerEndpoint,
    generation_endpoint:generationEndpoint, cases:24, repositories:24,
    maximum_generation_calls:24, maximum_output_tokens:512,
    maximum_prompt_plus_reserve_tokens:8192, automatic_retries:0,
    invalid_policy:'count-invalid-no-retry-no-replacement',
    provider_failure_policy:'stop-no-retry',
    claim_ceiling:'Private provisional BugSwarm trace-to-code transfer only; HTTP log/diff provenance unresolved; no ContextBench, RepoMap, live ARE, cost, or product superiority claim.'};
}

async function request(postOnce, endpoint, body, key, timeoutMs) {
  const start = Date.now();
  try {
    const response = await postOnce(new URL(endpoint), body,
      {apiKey:key, timeout_ms:timeoutMs, maximum_response_bytes:262144});
    return {...response, elapsed_ms:Date.now()-start};
  } catch (error) {
    return {status:null,payload:null,elapsed_ms:Date.now()-start,
      failure_code:String(error?.code ?? error?.message ?? 'request-failed').slice(0,100)};
  }
}

function parse(content, packet) {
  const value = JSON.parse(content);
  need(value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).join(',') === 'candidate_ids' && Array.isArray(value.candidate_ids) &&
    value.candidate_ids.length <= 8, 'response-shape');
  const ids = value.candidate_ids;
  need(ids.every(id => Number.isSafeInteger(id) && id >= 1 && id <= packet.candidates.length) &&
    new Set(ids).size === ids.length, 'response-ids');
  return ids;
}

async function run() {
  need(digest(join(root,'RUNNER-FREEZE.json')) === sha(JSON.stringify(freeze(),null,2)+'\n'), 'freeze-drift');
  need(!existsSync(join(root,'PREFLIGHT.json')), 'prior-attempt');
  need(digest(transportPath) === transportSha, 'transport-drift');
  const {postOnce,stable,MODEL} = await import(transportPath);
  need(MODEL === model, 'transport-model-drift');
  const key = readFileSync(secretPath,'utf8').trim();
  need(key.length >= 8 && key.length <= 8192, 'secret-shape');
  const data = packets();
  const admission = [], bodies = [];
  for (const packet of data) {
    const messages = [{role:'user',content:packet.prompt}];
    const body = stable({model,messages,stream:false,max_tokens:512,reasoning_effort:'low'});
    const token = await request(postOnce,tokenizerEndpoint,stable({model,messages}),key,30000);
    const count = token.payload?.usage?.prompt_tokens;
    admission.push({ordinal:packet.ordinal,id:packet.id,status:token.status,
      prompt_tokens:Number.isSafeInteger(count)?count:null,
      admitted:token.status===200 && Number.isSafeInteger(count) && count+512<=8192});
    bodies.push(body);
    process.stdout.write(JSON.stringify({phase:'admission',ordinal:packet.ordinal,
      admitted:admission.at(-1).admitted,prompt_tokens:admission.at(-1).prompt_tokens})+'\n');
  }
  const preflight = {schema:'are.g01-bugswarm-rerank-preflight-r1/v1',
    status:admission.length===24 && admission.every(x=>x.admitted)?'ready':'not-ready', admission};
  save(join(root,'PREFLIGHT.json'),preflight);
  process.stdout.write(JSON.stringify({preflight:preflight.status,
    admitted:admission.filter(x=>x.admitted).length})+'\n');
  if (preflight.status!=='ready') {process.exitCode=2;return;}
  let valid = 0;
  for (let i=0;i<data.length;i++) {
    const packet=data[i], body=bodies[i], ordinal=i+1;
    save(join(root,`STARTED-${ordinal}.json`),{ordinal,id:packet.id,
      request_sha256:sha(body),started_at:new Date().toISOString()});
    const result=await request(postOnce,generationEndpoint,body,key,120000);
    const choice=result.payload?.choices?.[0];
    let ids=null, invalid=null;
    if (result.status===200 && choice?.finish_reason==='stop' && typeof choice?.message?.content==='string') {
      try {ids=parse(choice.message.content,packet);} catch(error) {invalid=String(error.message).slice(0,160);}
    }
    const record={schema:'are.g01-bugswarm-rerank-response-r1/v1',ordinal,id:packet.id,
      request_sha256:sha(body),status:ids?'valid':'invalid',http_status:result.status,
      failure_code:result.failure_code??null,elapsed_ms:result.elapsed_ms,
      finish_reason:choice?.finish_reason??null,validation_error:invalid,
      selected_ids:ids,provider_payload:result.payload??null};
    save(join(root,`RESPONSE-${ordinal}.json`),record);
    if (ids) valid++;
    process.stdout.write(JSON.stringify({phase:'generation',ordinal,id:packet.id,status:record.status,
      http_status:record.http_status,selected_count:ids?.length??null,
      usage:result.payload?.usage??null})+'\n');
    if (result.status!==200 || result.failure_code) {process.exitCode=2;return;}
  }
  save(join(root,'RUN-RESULT.json'),{schema:'are.g01-bugswarm-rerank-run-r1/v1',
    status:valid===24?'completed-valid':'completed-with-invalid',cases:24,valid});
  if (valid!==24) process.exitCode=2;
}

const mode=process.argv[2];
if (mode==='check' && process.argv.length===3) {
  process.stdout.write(JSON.stringify({status:'check-passed',packets:packets().length,
    freeze_sha256:sha(JSON.stringify(freeze(),null,2)+'\n')})+'\n');
} else if (mode==='freeze' && process.argv.length===3) {
  save(join(root,'RUNNER-FREEZE.json'),freeze());
  process.stdout.write(JSON.stringify({status:'frozen',sha256:digest(join(root,'RUNNER-FREEZE.json'))})+'\n');
} else if (mode==='run' && process.argv.length===3) await run();
else throw Error('usage: run-bugswarm-rerank-r1.mjs check|freeze|run');
