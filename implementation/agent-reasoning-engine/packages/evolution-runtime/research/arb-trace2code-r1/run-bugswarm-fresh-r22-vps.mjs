#!/usr/bin/env node
// VPS-only tokenizer then one-shot generation for sealed fresh G01 packets.
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root='/opt/are-benchmark-runs/g01-bugswarm-fresh-r22';
const transportPath='/opt/are/evolution-runtime/g01-source-combined-candidate-r8/implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
const secretPath='/opt/are-keld-presentation/secrets/model_api_key';
const pins={packets:'9cf7490d6b21d34b58d0dbb75d1ab262caac061b773a75ab350b54a7291e149c',
  seal:'f281f62b2073fa61932b4c1823a02445aac88e6edd748dd9d6eeac1e4d89d63f',
  protocol:'66268c7fc20073337e01275c3b0ed333991134df3de18ba62a2ff60b4031dd02',
  transport:'5669b2c72d642e1ccf1d5bd796064c1e61d9dcad8828622f9b6f4450acdec56d'};
const model='glm-5.3-flash';
const sha=data=>createHash('sha256').update(data).digest('hex');
const path=name=>join(root,name);
const digest=name=>sha(readFileSync(path(name)));
const need=(ok,why)=>{if(!ok)throw Error(`g01-fresh-r22.${why}`);};
const save=(name,value)=>writeFileSync(path(name),JSON.stringify(value,null,2)+'\n',
  {flag:'wx',mode:0o600});

function selection(content,packet){
  let body=content.trim();
  const fence=/^```json\r?\n([\s\S]*?)\r?\n```$/.exec(body);
  if(fence)body=fence[1];
  const obj=JSON.parse(body);
  need(obj && typeof obj==='object' && !Array.isArray(obj) &&
    Object.keys(obj).length===1 && Object.hasOwn(obj,'candidate_ids') &&
    Array.isArray(obj.candidate_ids) && obj.candidate_ids.length<=8,'selection-shape');
  const byPath=new Map(packet.candidates.map(c=>[c.path,c.candidate_id]));
  const ids=obj.candidate_ids.map(item=>{
    if(Number.isSafeInteger(item))return item;
    if(typeof item==='string' && /^[1-9][0-9]*$/.test(item))return Number(item);
    if(typeof item==='string' && byPath.has(item))return byPath.get(item);
    throw Error('selection-value');
  });
  need(ids.every(id=>Number.isSafeInteger(id)&&id>=1&&id<=packet.candidate_count) &&
    new Set(ids).size===ids.length,'selection-ids');
  return ids;
}

function inputs(){
  need(process.argv.length===2 && !existsSync(path('RUN-FREEZE.json')) &&
    !existsSync(path('RUN-RESULT.json')),'usage-or-prior-run');
  need(digest('PACKETS.jsonl')===pins.packets &&
    digest('PACKET-SEAL.json')===pins.seal &&
    digest('TREATMENT-PROTOCOL.md')===pins.protocol &&
    sha(readFileSync(transportPath))===pins.transport,'input-pin-drift');
  const seal=JSON.parse(readFileSync(path('PACKET-SEAL.json'),'utf8'));
  const packets=readFileSync(path('PACKETS.jsonl'),'utf8').trimEnd().split('\n').map(JSON.parse);
  need(seal.cases===24 && seal.packets_sha256===pins.packets &&
    seal.maximum_candidates<=80 && seal.maximum_prompt_bytes<=24000 &&
    seal.gold_opened===false && seal.model_calls===0 && packets.length===24,
    'seal-shape');
  packets.forEach((packet,i)=>need(packet.ordinal===i+1 && packet.gold_opened===false &&
    packet.model_calls===0 && packet.fresh_confirmation===true &&
    packet.candidate_count===packet.candidates.length && packet.candidate_count<=80 &&
    packet.candidates.every((c,j)=>c.candidate_id===j+1) &&
    new Set(packet.candidates.map(c=>c.path)).size===packet.candidate_count &&
    Buffer.byteLength(packet.prompt)<=24000,`packet:${i+1}`));
  return packets;
}

async function main(){
  const packets=inputs();
  const {postOnce,stable,MODEL}=await import(transportPath);
  need(MODEL===model,'transport-model-drift');
  const key=readFileSync(secretPath,'utf8').trim();
  need(key.length>=8 && key.length<=8192,'secret-shape');
  save('RUN-FREEZE.json',{schema_version:'are.g01-fresh-r22-run-freeze/v1',
    posture:'fresh source-only packets; no gold',
    packets_sha256:pins.packets,packet_seal_sha256:pins.seal,
    protocol_sha256:pins.protocol,runner_sha256:sha(readFileSync(fileURLToPath(import.meta.url))),
    transport_sha256:pins.transport,model,maximum_tokenizer_calls:24,
    maximum_generation_calls:24,maximum_output_tokens:512,reasoning_effort:'low',
    prompt_plus_reserve_limit:8192,total_prompt_cap:220000,
    automatic_retries:0,failure_policy:'stop-no-retry'});
  let tokenSum=0; const tokenizer=[];
  for(const packet of packets){
    const body=stable({model,messages:[{role:'user',content:packet.prompt}]});
    const started=Date.now(); let response;
    try{response=await postOnce(new URL('https://api.z.ai/api/paas/v4/tokenizer'),body,
      {apiKey:key,timeout_ms:30000,maximum_response_bytes:262144});}
    catch(error){response={status:null,payload:null,
      failure_code:String(error?.code??error?.message??'request-failed').slice(0,100)};}
    const tokens=response.payload?.usage?.prompt_tokens;
    const admitted=response.status===200 && Number.isSafeInteger(tokens) &&
      tokens+512<=8192 && tokenSum+tokens<=220000;
    if(Number.isSafeInteger(tokens))tokenSum+=tokens;
    const row={schema_version:'are.g01-fresh-r22-tokenizer-case/v1',
      ordinal:packet.ordinal,id:packet.id,prompt_sha256:sha(packet.prompt),
      request_sha256:sha(body),response_sha256:response.payload?sha(JSON.stringify(response.payload)):null,
      http_status:response.status,failure_code:response.failure_code??null,
      prompt_tokens:Number.isSafeInteger(tokens)?tokens:null,elapsed_ms:Date.now()-started,admitted};
    save(`TOKENIZER-${String(packet.ordinal).padStart(2,'0')}.json`,row);
    tokenizer.push(row);
    process.stdout.write(JSON.stringify({phase:'tokenizer',ordinal:row.ordinal,
      status:row.http_status,tokens:row.prompt_tokens,admitted})+'\n');
    if(!admitted)break;
  }
  const admitted=tokenizer.length===24 && tokenizer.every(row=>row.admitted);
  save('TOKENIZER-RESULT.json',{schema_version:'are.g01-fresh-r22-tokenizer-result/v1',
    status:admitted?'admitted':'not-admitted',attempts:tokenizer.length,
    admitted:tokenizer.filter(row=>row.admitted).length,summed_prompt_tokens:tokenSum,
    maximum_prompt_tokens:Math.max(...tokenizer.map(row=>row.prompt_tokens??0)),
    summed_elapsed_ms:tokenizer.reduce((n,row)=>n+row.elapsed_ms,0),
    packets_sha256:pins.packets});
  if(!admitted){process.exitCode=2;return;}
  let calls=0,valid=0,knownPrompt=0,knownCompletion=0,summedElapsed=0;
  let stopped=false;
  for(const packet of packets){
    const body=stable({model,messages:[{role:'user',content:packet.prompt}],stream:false,
      max_tokens:512,reasoning_effort:'low'});
    const started=Date.now();let response;
    try{response=await postOnce(new URL('https://api.z.ai/api/paas/v4/chat/completions'),body,
      {apiKey:key,timeout_ms:120000,maximum_response_bytes:262144});}
    catch(error){response={status:null,payload:null,
      failure_code:String(error?.code??error?.message??'request-failed').slice(0,100)};}
    const elapsed=Date.now()-started;
    const choice=response.payload?.choices?.[0],usage=response.payload?.usage??null;
    const call={schema_version:'are.g01-fresh-r22-call/v1',
      ordinal:packet.ordinal,id:packet.id,prompt_sha256:sha(packet.prompt),
      request_sha256:sha(body),response_sha256:response.payload?sha(JSON.stringify(response.payload)):null,
      http_status:response.status,failure_code:response.failure_code??null,
      elapsed_ms:elapsed,finish_reason:choice?.finish_reason??null,
      usage,provider_payload:response.payload??null};
    save(`GENERATION-${String(packet.ordinal).padStart(2,'0')}.json`,call);
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
    save(`DECISION-${String(packet.ordinal).padStart(2,'0')}.json`,{
      schema_version:'are.g01-fresh-r22-decision/v1',ordinal:packet.ordinal,id:packet.id,
      listwise_valid:ids!==null,listwise_error:error,selected_ids:ids,
      selected_paths:ids?.map(id=>packet.candidates[id-1].path)??[],
      stopped_after_case:stopped});
    process.stdout.write(JSON.stringify({phase:'generation',ordinal:packet.ordinal,
      status:response.status,valid:ids!==null,prompt_tokens:usage?.prompt_tokens??null,
      completion_tokens:usage?.completion_tokens??null,stopped})+'\n');
    if(stopped)break;
  }
  const result={schema_version:'are.g01-fresh-r22-generation-result/v1',
    status:calls===24&&!stopped?'complete':'terminal-failed',attempts:calls,
    valid_responses:valid,known_prompt_tokens:knownPrompt,
    known_completion_tokens:knownCompletion,summed_elapsed_ms:summedElapsed,
    transport_stopped:stopped,packets_sha256:pins.packets};
  save('RUN-RESULT.json',result);
  process.stdout.write(JSON.stringify(result)+'\n');
  if(result.status!=='complete')process.exitCode=2;
}

await main();
