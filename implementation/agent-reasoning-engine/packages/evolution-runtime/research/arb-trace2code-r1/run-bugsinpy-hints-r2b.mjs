// VPS-only frozen paired GLM rerank on task/commit-disjoint BugsInPy r2b.
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = '/opt/are/evolution-runtime/g01-bugsinpy-hints-r2b';
const packetSha = 'f49de587e08039426ab536afe96e323a511202af27a47a1b89014e07cafcbd18';
const baseProtocolSha = '2b9b391016535b63d1700d522dcc548208fc892b7b8885d520dfea56af625974';
const amendmentSha = '04467453c9688a8ed887e3881cabdf1c09347bea46be039be6adb4361cd9a875';
const transportPath = '/opt/are/evolution-runtime/g01-source-combined-candidate-r8/implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
const transportSha = '5669b2c72d642e1ccf1d5bd796064c1e61d9dcad8828622f9b6f4450acdec56d';
const secretPath = '/opt/are-keld-presentation/secrets/model_api_key';
const model = 'glm-5.3-flash';
const tokenizerEndpoint = 'https://api.z.ai/api/paas/v4/tokenizer';
const generationEndpoint = 'https://api.z.ai/api/paas/v4/chat/completions';
const sha = value => createHash('sha256').update(value).digest('hex');
const digest = path => sha(readFileSync(path));
const save = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n', {flag:'wx', mode:0o600});
const need = (ok, why) => {if (!ok) throw Error(`bugsinpy-hints-r2b.${why}`);};

function packets() {
  need(digest(join(root,'PACKETS.jsonl')) === packetSha &&
    digest(join(root,'BASE-PROTOCOL.md')) === baseProtocolSha &&
    digest(join(root,'AMENDMENT.md')) === amendmentSha, 'input-drift');
  const data = readFileSync(join(root,'PACKETS.jsonl'), 'utf8').trimEnd().split('\n').map(JSON.parse);
  need(data.length === 48 && new Set(data.map(x => x.id)).size === 48 &&
    new Set(data.map(x => x.case_id)).size === 24 &&
    new Set(data.map(x => x.repo)).size === 12, 'denominator');
  const grouped = new Map();
  for (const packet of data) {
    need(['unhinted','hinted'].includes(packet.arm) &&
      packet.id === `${packet.case_id}/${packet.arm}` &&
      packet.candidates.length > 0 && packet.candidates.length <= 20 &&
      packet.candidates.every((x,i) => x.candidate_id === i+1) &&
      Buffer.byteLength(packet.prompt) <= 18000 &&
      packet.are_ranked_files.length === packet.chunk_ranked_files.length &&
      new Set(packet.are_ranked_files).size === packet.are_ranked_files.length &&
      packet.candidates.every(x => packet.are_ranked_files.includes(x.path)), `shape:${packet.id}`);
    grouped.set(packet.case_id, [...(grouped.get(packet.case_id) ?? []), packet]);
  }
  for (const pair of grouped.values()) need(pair.length === 2 &&
    new Set(pair.map(x => x.arm)).size === 2 &&
    pair[0].query_sha256 === pair[1].query_sha256 &&
    pair[0].base_commit === pair[1].base_commit, 'pair-drift');
  return data;
}

function freeze() {
  return {schema:'are.g01-bugsinpy-hints-r2b-freeze/v1', status:'frozen-before-dispatch',
    posture:'fresh-task-and-commit-paired-source-projected-not-live-are',
    packet_sha256:packetSha, base_protocol_sha256:baseProtocolSha,
    amendment_sha256:amendmentSha,
    runner_sha256:digest(fileURLToPath(import.meta.url)), transport_sha256:transportSha,
    model, reasoning_effort:'low', tokenizer_endpoint:tokenizerEndpoint,
    generation_endpoint:generationEndpoint, cases:24, paired_packets:48,
    maximum_generation_calls:49, maximum_output_tokens:512,
    maximum_prompt_plus_reserve_tokens:8192, automatic_retries:0,
    invalid_policy:'count-invalid-no-retry-no-replacement',
    provider_failure_policy:'stop-no-retry',
    advancement_gate:'48/48 valid; 24/24 labels; >=2 more union-gold cases; hinted-minus-unhinted MRR@8 >=0.05 and repository-bootstrap lower bound >0',
    claim_ceiling:'Paired source-projected retrieval only; no official RepoMap, live ARE, ContextBench, cost or product superiority.'};
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
  need(digest(transportPath) === transportSha, 'transport-drift');
  const {postOnce,stable,MODEL} = await import(transportPath);
  need(MODEL === model, 'transport-model-drift');
  const key = readFileSync(secretPath,'utf8').trim();
  need(key.length >= 8 && key.length <= 8192, 'secret-shape');
  const data = packets();
  const tiny = [{role:'user',content:'ARE BugsInPy paired retrieval readiness. Reply OK.'}];
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
  const preflight = {schema:'are.g01-bugsinpy-hints-r2b-preflight/v1',
    status:ready && admission.length===48 && admission.every(x=>x.admitted)?'ready':'not-ready',
    readiness_tokenizer_status:tokenizer.status, readiness_generation_status:generation?.status??null,
    readiness_generation_usage:generation?.payload?.usage??null, admission};
  save(join(root,'PREFLIGHT.json'),preflight);
  process.stdout.write(JSON.stringify({preflight:preflight.status,admitted:admission.filter(x=>x.admitted).length})+'\n');
  if (preflight.status!=='ready') {process.exitCode=2;return;}
  let valid = 0;
  for (let i=0;i<data.length;i++) {
    const packet=data[i], body=bodies[i], ordinal=i+1;
    save(join(root,`STARTED-${ordinal}.json`),{ordinal,id:packet.id,request_sha256:sha(body),started_at:new Date().toISOString()});
    const result=await request(postOnce,generationEndpoint,body,key,120000);
    const choice=result.payload?.choices?.[0];
    let ids=null, invalid=null;
    if (result.status===200 && choice?.finish_reason==='stop' && typeof choice?.message?.content==='string') {
      try {ids=parse(choice.message.content,packet);} catch(error) {invalid=String(error.message).slice(0,160);}
    }
    const record={schema:'are.g01-bugsinpy-hints-r2b-response/v1',ordinal,id:packet.id,
      request_sha256:sha(body),status:ids?'valid':'invalid',http_status:result.status,
      failure_code:result.failure_code??null,elapsed_ms:result.elapsed_ms,
      finish_reason:choice?.finish_reason??null,validation_error:invalid,
      selected_ids:ids,provider_payload:result.payload??null};
    save(join(root,`RESPONSE-${ordinal}.json`),record);
    if (ids) valid++;
    process.stdout.write(JSON.stringify({ordinal,id:packet.id,status:record.status,
      http_status:record.http_status,selected_count:ids?.length??null,
      usage:result.payload?.usage??null})+'\n');
    if (result.status!==200 || result.failure_code) {process.exitCode=2;return;}
  }
  save(join(root,'RUN-RESULT.json'),{schema:'are.g01-bugsinpy-hints-r2b-run/v1',
    status:valid===48?'completed-valid':'completed-with-invalid',packets:48,valid});
  if (valid!==48) process.exitCode=2;
}

const mode=process.argv[2];
if (mode==='check' && process.argv.length===3) {
  process.stdout.write(JSON.stringify({status:'check-passed',packets:packets().length,
    freeze_sha256:sha(JSON.stringify(freeze(),null,2)+'\n')})+'\n');
} else if (mode==='freeze' && process.argv.length===3) {
  save(join(root,'FREEZE.json'),freeze());
  process.stdout.write(JSON.stringify({status:'frozen',sha256:digest(join(root,'FREEZE.json'))})+'\n');
} else if (mode==='run' && process.argv.length===3) await run();
else throw Error('usage: run-bugsinpy-hints-r2b.mjs check|freeze|run');
