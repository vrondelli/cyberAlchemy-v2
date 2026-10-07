#!/usr/bin/env node
// VPS-only raw-listwise generation; no gold or passing-commit material.
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root='/opt/are-benchmark-runs/g01-bugswarm-graph-confirm-r8';
const transportPath='/opt/are/evolution-runtime/g01-source-combined-candidate-r8/implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
const secretPath='/opt/are-keld-presentation/secrets/model_api_key';
const pins={packets:'f311bb898823756015e5a0cc4ea2d1918ed29f0cbabafcc283e13623188cd5b5',
  seal:'20b43fcb0d3d5de2ed17222848eb58f0d4298a5222a3eaff0c5ce48e07d9e682',
  protocol:'1ec51a135f22f9c4e1cf8cdec12275563b53b5829231b8582f829a9680dc1862',
  tokenizer:'34c4df063d5783f5dd6b15a2b565da16dc2a5148e91796a4a5804ce35918e930',
  transport:'5669b2c72d642e1ccf1d5bd796064c1e61d9dcad8828622f9b6f4450acdec56d'};
const model='glm-5.3-flash';
const sha=data=>createHash('sha256').update(data).digest('hex');
const digest=path=>sha(readFileSync(path));
const path=name=>join(root,name);
const need=(ok,why)=>{if(!ok)throw Error(`g01-confirm-r8.${why}`);};
const save=(name,value)=>writeFileSync(path(name),JSON.stringify(value,null,2)+'\n',
  {flag:'wx',mode:0o600});

function inputs(){
  need(process.argv.length===2 && !existsSync(path('GENERATION-FREEZE.json')) &&
    !existsSync(path('GENERATION-RESULT.json')),'usage-or-prior-run');
  need(digest(path('PACKETS.jsonl'))===pins.packets &&
    digest(path('PACKET-SEAL.json'))===pins.seal &&
    digest(path('TREATMENT-PROTOCOL.md'))===pins.protocol &&
    digest(path('TOKENIZER-RESULT.json'))===pins.tokenizer &&
    digest(transportPath)===pins.transport,'input-pin-drift');
  const seal=JSON.parse(readFileSync(path('PACKET-SEAL.json'),'utf8'));
  const token=JSON.parse(readFileSync(path('TOKENIZER-RESULT.json'),'utf8'));
  const packets=readFileSync(path('PACKETS.jsonl'),'utf8').trimEnd().split('\n').map(JSON.parse);
  need(seal.cases===24 && seal.packets_sha256===pins.packets &&
    seal.gold_opened===false && seal.model_calls===0 &&
    token.status==='admitted' && token.attempts===24 && token.admitted===24 &&
    token.packets_sha256===pins.packets && token.summed_prompt_tokens<=220000 &&
    packets.length===24,'source-or-token-shape');
  const tokenHashes=[];
  packets.forEach((packet,i)=>{
    const receiptPath=path(`TOKENIZER-${String(i+1).padStart(2,'0')}.json`);
    const t=JSON.parse(readFileSync(receiptPath,'utf8'));
    need(packet.ordinal===i+1 && packet.gold_opened===false &&
      packet.reserved_confirmation===true && packet.model_calls===0 &&
      packet.candidate_count===packet.candidates.length && packet.candidate_count<=80 &&
      packet.candidates.every((c,j)=>c.candidate_id===j+1) &&
      new Set(packet.candidates.map(c=>c.path)).size===packet.candidate_count &&
      packet.candidates.filter(c=>c.r2_rank===1).length===1 &&
      t.ordinal===packet.ordinal && t.id===packet.id && t.admitted===true &&
      t.prompt_sha256===sha(packet.prompt) && t.prompt_tokens+512<=8192,
      `packet-or-token-case:${i+1}`);
    tokenHashes.push(digest(receiptPath));
  });
  return {packets,tokenHashes};
}

function selection(content,packet){
  const obj=JSON.parse(content);
  need(obj && typeof obj==='object' && !Array.isArray(obj) &&
    Object.keys(obj).length===1 && Object.hasOwn(obj,'candidate_ids') &&
    Array.isArray(obj.candidate_ids) && obj.candidate_ids.length<=8,
    'selection-shape');
  const byPath=new Map(packet.candidates.map(c=>[c.path,c.candidate_id]));
  const ids=obj.candidate_ids.map(item=>{
    if(Number.isSafeInteger(item))return item;
    if(typeof item==='string' && /^[1-9][0-9]*$/.test(item))return Number(item);
    if(typeof item==='string' && byPath.has(item))return byPath.get(item);
    throw Error('selection-value');
  });
  need(ids.every(n=>Number.isSafeInteger(n)&&n>=1&&n<=packet.candidate_count) &&
    new Set(ids).size===ids.length,'selection-ids');
  return ids;
}

async function run(){
  const {packets,tokenHashes}=inputs();
  const {postOnce,stable,MODEL}=await import(transportPath);
  need(MODEL===model,'transport-model-drift');
  const key=readFileSync(secretPath,'utf8').trim();
  need(key.length>=8 && key.length<=8192,'secret-shape');
  save('GENERATION-FREEZE.json',{
    schema_version:'are.g01-confirm-r8-generation-freeze/v1',
    posture:'private source-only reserved confirmation; no gold',
    packets_sha256:pins.packets,packet_seal_sha256:pins.seal,
    tokenizer_result_sha256:pins.tokenizer,token_case_sha256:tokenHashes,
    protocol_sha256:pins.protocol,runner_sha256:digest(fileURLToPath(import.meta.url)),
    transport_sha256:pins.transport,model,
    endpoint:'https://api.z.ai/api/paas/v4/chat/completions',maximum_calls:24,
    maximum_output_tokens:512,reasoning_effort:'low',known_prompt_cap_tokens:220000,
    automatic_retries:0,invalid_policy:'graph-r2-fallback-no-retry',
    transport_failure_policy:'stop-no-retry'});
  let calls=0,valid=0,knownPrompt=0,knownCompletion=0,summedElapsed=0;
  let stopped=false;
  for(const packet of packets){
    const num=String(packet.ordinal).padStart(2,'0');
    const body=stable({model,messages:[{role:'user',content:packet.prompt}],stream:false,
      max_tokens:512,reasoning_effort:'low'});
    const start=Date.now();let response;
    try{response=await postOnce(new URL('https://api.z.ai/api/paas/v4/chat/completions'),body,
      {apiKey:key,timeout_ms:120000,maximum_response_bytes:262144});}
    catch(error){response={status:null,payload:null,
      failure_code:String(error?.code??error?.message??'request-failed').slice(0,100)};}
    const elapsed=Date.now()-start;
    const choice=response.payload?.choices?.[0];
    const usage=response.payload?.usage??null;
    const call={schema_version:'are.g01-confirm-r8-call/v1',
      ordinal:packet.ordinal,id:packet.id,prompt_sha256:sha(packet.prompt),
      request_sha256:sha(body),response_sha256:response.payload?sha(JSON.stringify(response.payload)):null,
      http_status:response.status,failure_code:response.failure_code??null,
      elapsed_ms:elapsed,finish_reason:choice?.finish_reason??null,
      usage,provider_payload:response.payload??null};
    save(`GENERATION-${num}.json`,call);
    calls++;summedElapsed+=elapsed;
    if(Number.isSafeInteger(usage?.prompt_tokens))knownPrompt+=usage.prompt_tokens;
    if(Number.isSafeInteger(usage?.completion_tokens))knownCompletion+=usage.completion_tokens;
    if(response.status!==200 || response.failure_code || knownPrompt>220000)stopped=true;
    let ids=null,error=null;
    if(response.status===200 && choice?.finish_reason==='stop' &&
      typeof choice?.message?.content==='string'){
      try{ids=selection(choice.message.content,packet);valid++;}
      catch(e){error=String(e.message).slice(0,160);}
    }else error='provider-status-finish-or-content';
    const decision={schema_version:'are.g01-confirm-r8-decision/v1',
      ordinal:packet.ordinal,id:packet.id,listwise_valid:ids!==null,
      listwise_error:error,selected_ids:ids,
      selected_paths:ids?.map(id=>packet.candidates[id-1].path)??[],
      stopped_after_case:stopped};
    save(`DECISION-${num}.json`,decision);
    process.stdout.write(JSON.stringify({ordinal:packet.ordinal,http_status:response.status,
      listwise_valid:ids!==null,prompt_tokens:usage?.prompt_tokens??null,
      completion_tokens:usage?.completion_tokens??null,stopped})+'\n');
    if(stopped)break;
  }
  const result={schema_version:'are.g01-confirm-r8-generation-result/v1',
    status:calls===24 && !stopped?'complete':'terminal-failed',
    attempts:calls,valid_responses:valid,known_prompt_tokens:knownPrompt,
    known_completion_tokens:knownCompletion,summed_elapsed_ms:summedElapsed,
    transport_stopped:stopped,packets_sha256:pins.packets};
  save('GENERATION-RESULT.json',result);
  process.stdout.write(JSON.stringify(result)+'\n');
  if(result.status!=='complete')process.exitCode=2;
}

await run();
