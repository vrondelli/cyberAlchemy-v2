// VPS-only GLM rerank pilot on 12 sealed, already-exposed ARB cases.
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = '/opt/are/evolution-runtime/arb-exposed-rerank-pilot-r1';
const packetPath = join(root, 'PACKETS.jsonl');
const packetSha = 'd0ef532a085fbb00333c2083b025a079bbbb84d1c9dd3f2d25377bb11537dce7';
const transportPath = '/opt/are/evolution-runtime/g01-source-combined-candidate-r8/implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
const secretPath = '/opt/are-keld-presentation/secrets/model_api_key';
const model = 'glm-5.3-flash';
const tokenizerEndpoint = 'https://api.z.ai/api/paas/v4/tokenizer';
const generationEndpoint = 'https://api.z.ai/api/paas/v4/chat/completions';
const sha = value => createHash('sha256').update(value).digest('hex');
const digest = path => sha(readFileSync(path));
const save = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n', {flag:'wx', mode:0o600});
const need = (ok, why) => {if (!ok) throw Error(`arb-rerank-r1.${why}`);};

function packets() {
  need(digest(packetPath) === packetSha, 'packet-drift');
  const data = readFileSync(packetPath, 'utf8').trimEnd().split('\n').map(JSON.parse);
  need(data.length === 12 && new Set(data.map(x => x.id)).size === 12, 'denominator');
  for (const packet of data) need(packet.candidates.length <= 20 &&
    packet.candidates.every((x, i) => x.candidate_id === i+1) &&
    Buffer.byteLength(packet.prompt) <= 18000, `packet-shape:${packet.id}`);
  return data;
}

function freeze() {
  return {schema:'are.arb-exposed-rerank-pilot-freeze-r1/v1', status:'frozen-before-dispatch',
    posture:'exposed-development-only-not-independent-or-superiority',
    packet_sha256:packetSha, runner_sha256:digest(fileURLToPath(import.meta.url)),
    transport_sha256:digest(transportPath), model, reasoning_effort:'low',
    tokenizer_endpoint:tokenizerEndpoint, generation_endpoint:generationEndpoint,
    maximum_cases:12, maximum_generation_calls:13, maximum_output_tokens:512,
    maximum_prompt_plus_reserve_tokens:8192, automatic_retries:0,
    invalid_policy:'count-invalid-no-retry', provider_failure_policy:'stop-no-retry',
    advancement_gate:{valid_responses:12, minimum_repositories_with_mrr_gain:3,
      nonnegative_mean_mrr_at_8_vs_both_standalone_arms:true},
    claim_ceiling:'Development diagnostic only; no ContextBench, live ARE, or general superiority claim.'};
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
  need(digest(join(root,'FREEZE.json')) === sha(JSON.stringify(freeze(),null,2)+'\n'), 'freeze-drift');
  need(!existsSync(join(root,'PREFLIGHT.json')), 'prior-attempt');
  const {postOnce,stable,MODEL} = await import(transportPath);
  need(MODEL === model, 'transport-model-drift');
  const key = readFileSync(secretPath,'utf8').trim();
  need(key.length >= 8 && key.length <= 8192, 'secret-shape');
  const data = packets();
  const tiny = [{role:'user',content:'ARE exposed retrieval pilot readiness. Reply OK.'}];
  const tokenizer = await request(postOnce,tokenizerEndpoint,stable({model,messages:tiny}),key,30000);
  let ready = tokenizer.status === 200 && Number.isSafeInteger(tokenizer.payload?.usage?.prompt_tokens);
  let generation = null;
  if (ready) {
    generation = await request(postOnce,generationEndpoint,
      stable({model,messages:tiny,stream:false,max_tokens:256,reasoning_effort:'low'}),key,30000);
    ready = generation.status === 200 &&
      typeof generation.payload?.choices?.[0]?.message?.content === 'string';
  }
  const admission = [];
  const bodies = [];
  if (ready) for (const packet of data) {
    const messages = [{role:'user',content:packet.prompt}];
    const body = stable({model,messages,stream:false,max_tokens:512,reasoning_effort:'low'});
    const token = await request(postOnce,tokenizerEndpoint,stable({model,messages}),key,30000);
    const count = token.payload?.usage?.prompt_tokens;
    admission.push({id:packet.id,status:token.status,prompt_tokens:Number.isSafeInteger(count)?count:null,
      admitted:token.status===200 && Number.isSafeInteger(count) && count+512<=8192});
    bodies.push(body);
  }
  const preflight = {schema:'are.arb-exposed-rerank-pilot-preflight-r1/v1',
    status:ready && admission.length===12 && admission.every(x=>x.admitted)?'ready':'not-ready',
    readiness_tokenizer_status:tokenizer.status,readiness_generation_status:generation?.status??null,
    readiness_generation_usage:generation?.payload?.usage??null,admission};
  save(join(root,'PREFLIGHT.json'),preflight);
  process.stdout.write(JSON.stringify({preflight:preflight.status,admitted:admission.filter(x=>x.admitted).length})+'\n');
  if (preflight.status!=='ready') {process.exitCode=2;return;}
  for (let i=0;i<data.length;i++) {
    const packet=data[i], body=bodies[i], ordinal=i+1;
    save(join(root,`STARTED-${ordinal}.json`),{ordinal,id:packet.id,request_sha256:sha(body),started_at:new Date().toISOString()});
    const result=await request(postOnce,generationEndpoint,body,key,120000);
    const choice=result.payload?.choices?.[0];
    let ids=null, invalid=null;
    if (result.status===200 && choice?.finish_reason==='stop' && typeof choice?.message?.content==='string') {
      try {ids=parse(choice.message.content,packet);} catch(error) {invalid=String(error.message).slice(0,160);}
    }
    const record={schema:'are.arb-exposed-rerank-pilot-response-r1/v1',ordinal,id:packet.id,
      request_sha256:sha(body),status:ids?'valid':'invalid',http_status:result.status,
      failure_code:result.failure_code??null,elapsed_ms:result.elapsed_ms,
      validation_error:invalid,selected_ids:ids,provider_payload:result.payload??null};
    save(join(root,`RESPONSE-${ordinal}.json`),record);
    process.stdout.write(JSON.stringify({ordinal,status:record.status,http_status:record.http_status,
      selected_count:ids?.length??null,usage:result.payload?.usage??null})+'\n');
    if (result.status!==200 || result.failure_code) {process.exitCode=2;return;}
  }
  save(join(root,'RUN-RESULT.json'),{schema:'are.arb-exposed-rerank-pilot-run-r1/v1',status:'completed',cases:12});
}

const mode=process.argv[2];
if (mode==='check' && process.argv.length===3) {
  process.stdout.write(JSON.stringify({status:'check-passed',packets:packets().length,
    freeze_sha256:sha(JSON.stringify(freeze(),null,2)+'\n')})+'\n');
} else if (mode==='freeze' && process.argv.length===3) {
  save(join(root,'FREEZE.json'),freeze());
  process.stdout.write(JSON.stringify({status:'frozen',sha256:digest(join(root,'FREEZE.json'))})+'\n');
} else if (mode==='run' && process.argv.length===3) await run();
else throw Error('usage: run-exposed-rerank-pilot-r1.mjs check|freeze|run');
