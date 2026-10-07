// One GLM review per exposed G02 pair. Source packets are frozen before model calls.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

const base = '/opt/are/evolution-runtime';
const packets = `${base}/g02-r4-reviewer-packets-r1`;
const output = `${base}/g02-r4-reviewer-development-r2`;
const packetSealSha = '11cc658044a9429d4a8a77682460336c578eb65c39db6a5cdc0192a38685682d';
const priorFreeze = `${base}/g02-r4-reviewer-development-r1/FREEZE.json`;
const priorFreezeSha = '3e52092c1bec992fb9e6f30c94c7a0416075a36b96a2f6b26807306d9868e54b';
const transportPath = `${base}/g01-source-combined-candidate-r8/implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs`;
const secretPath = '/opt/are-keld-presentation/secrets/model_api_key';
const endpoint = 'https://api.z.ai/api/paas/v4/chat/completions';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const digest = path => sha(readFileSync(path));
const load = path => JSON.parse(readFileSync(path, 'utf8'));
const save = (path,value) => writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
const need = (ok,code) => {if(!ok)throw Error(`g02-review-r2.${code}`);};

function verifiedInputs(){
  need(digest(`${packets}/SEAL.json`)===packetSealSha,'packet-seal-drift');
  need(digest(priorFreeze)===priorFreezeSha,'prior-freeze-drift');
  const seal=load(`${packets}/SEAL.json`),prior=load(priorFreeze);
  need(seal.packets?.length===32&&prior.ordered_pairs?.length===32,'pair-count');
  for(const binding of seal.packets)need(binding.path.startsWith(`${packets}/`)&&digest(binding.path)===binding.sha256,`packet-drift:${binding.pair}`);
  return {seal,prior};
}

function freezeValue(){
  const {seal,prior}=verifiedInputs();
  return {schema_version:'are.g02-reviewer-development-freeze/v2',status:'frozen-before-model-dispatch',
    posture:'exposed-development-only',packet_seal_sha256:packetSealSha,prior_freeze_sha256:priorFreezeSha,
    runner_sha256:digest(new URL(import.meta.url)),transport_sha256:digest(transportPath),
    model:'glm-5.3-flash',endpoint,maximum_calls:32,maximum_output_tokens:1024,
    request_timeout_ms:120000,retries:0,prompt:prior.prompt,prompt_sha256:sha(prior.prompt),
    ordered_pairs:seal.packets.map(({cohort,pair,path,sha256})=>({cohort,pair,path,sha256})),
    invalid_output_policy:'preserve-original-prediction-and-count-invalid',
    claim_ceiling:'Exposed development only; no fresh matched-arm superiority claim.'};
}

export function validate(value,packet){
  need(value&&!Array.isArray(value)&&typeof value==='object'&&Object.keys(value).sort().join(',')==='add_read_indexes,drop_files','review-shape');
  const adds=value.add_read_indexes,drops=value.drop_files;
  need(Array.isArray(adds)&&adds.length<=5&&new Set(adds).size===adds.length&&adds.every(x=>Number.isSafeInteger(x)&&packet.delivered_reads.some(h=>h.index===x)),'review-adds');
  need(Array.isArray(drops)&&drops.length<=3&&new Set(drops).size===drops.length&&drops.every(x=>typeof x==='string'&&packet.current_selected_files.includes(x)),'review-drops');
  return {add_read_indexes:adds,drop_files:drops};
}

function idle(){
  for(const unit of ['are-g01-r6-campaign.service','are-g01-r6-finalize.service']){
    const state=execFileSync('systemctl',['show',unit,'-p','ActiveState','--value'],{encoding:'utf8'}).trim();
    need(state!=='active',`capacity-busy:${unit}`);
  }
  need(existsSync(`${base}/g01-product-replication-r6/HASH-AUDIT.json`),'g01-audit-not-ready');
  const result=execFileSync('systemctl',['show','are-g01-r6-finalize.service','-p','Result','--value'],{encoding:'utf8'}).trim();
  need(result==='success','g01-finalizer-not-successful');
}

async function run(){
  idle();
  const expected=freezeValue(),freezePath=`${output}/FREEZE.json`;
  need(digest(freezePath)===sha(JSON.stringify(expected,null,2)+'\n'),'freeze-drift');
  const {postOnce,stable,MODEL}=await import(transportPath);
  need(MODEL===expected.model,'model-drift');
  const key=readFileSync(secretPath,'utf8').trim();
  need(key.length>=8&&key.length<=8192,'secret-shape');
  let completed=0;
  for(const binding of expected.ordered_pairs){
    const packet=load(binding.path),dir=join(output,`${binding.cohort}-${binding.pair}`);
    need(!existsSync(dir),`prior-attempt:${binding.pair}`);
    mkdirSync(dir,{mode:0o700});
    const body=stable({model:MODEL,messages:[{role:'system',content:expected.prompt},
      {role:'user',content:JSON.stringify(packet)}],tools:[],stream:false,max_tokens:1024,
      thinking:{type:'enabled',clear_thinking:false},reasoning_effort:'low'});
    need(Buffer.byteLength(body)<=262144,'request-too-large');
    const requestSha=sha(body);
    save(join(dir,'STARTED.json'),{pair:binding.pair,packet_sha256:binding.sha256,
      request_sha256:requestSha,started_at:new Date().toISOString()});
    const start=Date.now();let response, failure=null;
    try{response=await postOnce(new URL(endpoint),body,{apiKey:key,timeout_ms:120000,maximum_response_bytes:262144});}
    catch(error){failure=error.code??'request-failed';}
    const payload=response?.payload,choice=payload?.choices?.[0],content=choice?.message?.content;
    let review=null,invalid=null;
    if(!failure&&response?.status===200&&choice?.finish_reason==='stop'&&typeof content==='string'){
      try{review=validate(JSON.parse(content),packet);}catch(error){invalid=String(error.message).slice(0,160);}
    }
    const record={schema_version:'are.g02-reviewer-development-response/v2',
      pair:binding.pair,cohort:binding.cohort,packet_sha256:binding.sha256,request_sha256:requestSha,
      status:review?'valid':'invalid',http_status:response?.status??null,
      provider_code:String(payload?.error?.code??payload?.code??''),finish_reason:choice?.finish_reason??null,
      failure_code:failure,validation_error:invalid,elapsed_ms:Date.now()-start,
      response_bytes:response?.bytes??0,usage:payload?.usage??null,
      content:typeof content==='string'?content:null,review};
    save(join(dir,'RESPONSE.json'),record);
    completed++;
    process.stdout.write(JSON.stringify({completed,pair:binding.pair,status:record.status,
      known_tokens:record.usage?record.usage.prompt_tokens+record.usage.completion_tokens:null})+'\n');
  }
  save(join(output,'RUN-RESULT.json'),{schema_version:'are.g02-reviewer-development-run/v2',
    status:'completed-exposed-diagnostic',completed,expected:expected.ordered_pairs.length,
    response_paths:expected.ordered_pairs.map(x=>join(output,`${x.cohort}-${x.pair}`,'RESPONSE.json')),
    claim_ceiling:expected.claim_ceiling});
}

if(process.argv[2]==='freeze'){
  need(!existsSync(output),'output-exists');
  const value=freezeValue();mkdirSync(output,{mode:0o700});
  const path=join(output,'FREEZE.json');save(path,value);
  process.stdout.write(JSON.stringify({status:'frozen-no-model',path,sha256:digest(path),pairs:value.ordered_pairs.length})+'\n');
}else if(process.argv[2]==='run')await run();
else if(process.argv[2]!==undefined)throw Error('usage: run-receipt-review-r2.mjs freeze|run');
