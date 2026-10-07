#!/usr/bin/env node
// Source-only VPS generation. Gold and complete evaluator rankings stay on WSL.
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root='/opt/are-benchmark-runs/g01-bugswarm-graph-dev-b-r8';
const transportPath='/opt/are/evolution-runtime/g01-source-combined-candidate-r8/implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
const secretPath='/opt/are-keld-presentation/secrets/model_api_key';
const pins={packets:'26e3b47e375bf309e1df4c92279e137f9d68b5ae9dcd5a9f5f9d9d0196527a4f',
  seal:'da390e2ef19987f93a79f2e126498023bb1130bc1ebdf85591811da455439980',
  protocol:'b5c2829077cd98bb4b511b758990ffb8d70652047ef77ed5aa3056fbdb0bc65c',
  tokenizer:'699fa8136a9eebc54d75f68b549f9985f8f9d0ae1ec1fd0649d3a88b8051bae1',
  transport:'5669b2c72d642e1ccf1d5bd796064c1e61d9dcad8828622f9b6f4450acdec56d'};
const model='glm-5.3-flash';
const sha=data=>createHash('sha256').update(data).digest('hex');
const digest=path=>sha(readFileSync(path));
const path=name=>join(root,name);
const need=(ok,why)=>{if(!ok)throw Error(`g01-b-r8.${why}`);};
const save=(name,value)=>writeFileSync(path(name),JSON.stringify(value,null,2)+'\n',
  {flag:'wx',mode:0o600});

function inputs(){
  need(process.argv.length===2 && !existsSync(path('GENERATION-FREEZE.json')) &&
    !existsSync(path('GENERATION-RESULT.json')),'usage-or-prior-run');
  need(digest(path('PACKETS-B-R8.jsonl'))===pins.packets &&
    digest(path('PACKET-SEAL-B-R8.json'))===pins.seal &&
    digest(path('G01-BUGSWARM-GRAPH-DEV-B-R8-GLM-PROTOCOL-2026-10-04.md'))===pins.protocol &&
    digest(path('TOKENIZER-RESULT.json'))===pins.tokenizer &&
    digest(transportPath)===pins.transport,'input-pin-drift');
  const seal=JSON.parse(readFileSync(path('PACKET-SEAL-B-R8.json'),'utf8'));
  const token=JSON.parse(readFileSync(path('TOKENIZER-RESULT.json'),'utf8'));
  const packets=readFileSync(path('PACKETS-B-R8.jsonl'),'utf8').trimEnd().split('\n').map(JSON.parse);
  need(seal.cases===24 && seal.packets_sha256===pins.packets &&
    !seal.gold_opened && !seal.reserved_confirmation_opened && seal.model_calls===0 &&
    token.status==='admitted' && token.attempts===24 && token.admitted===24 &&
    token.packets_sha256===pins.packets && token.summed_prompt_tokens<=220000 &&
    packets.length===24,'source-or-token-shape');
  const tokenHashes=[];
  packets.forEach((packet,i)=>{
    const receiptPath=path(`TOKENIZER-${String(i+1).padStart(2,'0')}.json`);
    const t=JSON.parse(readFileSync(receiptPath,'utf8'));
    need(packet.ordinal===i+1 && packet.gold_opened===false &&
      packet.exposed_development===true && packet.model_calls===0 &&
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

function choice(content){
  const obj=JSON.parse(content);
  need(obj && typeof obj==='object' && !Array.isArray(obj) &&
    Object.keys(obj).length===1 && (obj.choice==='A'||obj.choice==='B'),
    'choice-shape');
  return obj.choice;
}

function pairPrompt(packet,first,second){
  const show=(label,c)=>`${label}: ${c.path} | r2=${c.r2_rank} r3=${c.r3_rank} origin=${c.origin} | line ${c.excerpt_start_line}: ${c.excerpt}`;
  return 'Which implementation file is more likely responsible for the failure? '+
    'Compare only the two source-grounded candidates. Return exactly JSON '+
    '{"choice":"A"} or {"choice":"B"}; no prose.\nFailure:\n'+packet.query+'\n'+
    show('A',first)+'\n'+show('B',second);
}

async function run(){
  const {packets,tokenHashes}=inputs();
  const {postOnce,stable,MODEL}=await import(transportPath);
  need(MODEL===model,'transport-model-drift');
  const key=readFileSync(secretPath,'utf8').trim();
  need(key.length>=8 && key.length<=8192,'secret-shape');
  save('GENERATION-FREEZE.json',{
    schema_version:'are.g01-bugswarm-graph-dev-b-r8-generation-freeze/v1',
    posture:'private exposed development; source-only VPS, no gold or reserved confirmation',
    packets_sha256:pins.packets,packet_seal_sha256:pins.seal,
    tokenizer_result_sha256:pins.tokenizer,token_case_sha256:tokenHashes,
    protocol_sha256:pins.protocol,runner_sha256:digest(fileURLToPath(import.meta.url)),
    transport_sha256:pins.transport,model,
    endpoint:'https://api.z.ai/api/paas/v4/chat/completions',maximum_calls:72,
    maximum_output_tokens:512,reasoning_effort:'low',known_prompt_cap_tokens:220000,
    automatic_retries:0,invalid_policy:'r2-fallback-no-retry',
    transport_failure_policy:'stop-no-retry'});
  let calls=0,listwiseValid=0,pairwiseCalls=0,pairwiseValid=0;
  let knownPromptTokens=0,knownCompletionTokens=0,summedElapsedMs=0;
  let stopped=false;
  async function ask(ordinal,kind,prompt,name){
    const body=stable({model,messages:[{role:'user',content:prompt}],stream:false,
      max_tokens:512,reasoning_effort:'low'});
    const start=Date.now();let response;
    try{response=await postOnce(new URL('https://api.z.ai/api/paas/v4/chat/completions'),body,
      {apiKey:key,timeout_ms:120000,maximum_response_bytes:262144});}
    catch(error){response={status:null,payload:null,
      failure_code:String(error?.code??error?.message??'request-failed').slice(0,100)};}
    const elapsed=Date.now()-start;
    const selected=response.payload?.choices?.[0];
    const usage=response.payload?.usage??null;
    const row={schema_version:'are.g01-bugswarm-graph-dev-b-r8-call/v1',
      ordinal,kind,prompt_sha256:sha(prompt),request_sha256:sha(body),
      response_sha256:response.payload?sha(JSON.stringify(response.payload)):null,
      http_status:response.status,failure_code:response.failure_code??null,
      elapsed_ms:elapsed,finish_reason:selected?.finish_reason??null,
      usage,provider_payload:response.payload??null};
    save(name,row);
    calls++;summedElapsedMs+=elapsed;
    if(Number.isSafeInteger(usage?.prompt_tokens))knownPromptTokens+=usage.prompt_tokens;
    if(Number.isSafeInteger(usage?.completion_tokens))knownCompletionTokens+=usage.completion_tokens;
    if(response.status!==200 || response.failure_code || knownPromptTokens>220000)stopped=true;
    return {row,content:selected?.message?.content};
  }
  for(const packet of packets){
    const num=String(packet.ordinal).padStart(2,'0');
    const r2top=packet.candidates.find(c=>c.r2_rank===1);
    const list=await ask(packet.ordinal,'listwise',packet.prompt,`GENERATION-${num}.json`);
    let ids=null,listwiseError=null;
    if(list.row.http_status===200 && list.row.finish_reason==='stop' &&
      typeof list.content==='string'){
      try{ids=selection(list.content,packet);listwiseValid++;}
      catch(error){listwiseError=String(error.message).slice(0,160);}
    }else listwiseError='provider-status-finish-or-content';
    const listTop=ids?.length?packet.candidates[ids[0]-1]:r2top;
    const pair=[];
    if(!stopped && ids!==null && listTop.path!==r2top.path){
      for(const [order,first,second] of [
        ['AB',listTop,r2top],['BA',r2top,listTop]]){
        const prompt=pairPrompt(packet,first,second);
        need(Buffer.byteLength(prompt)<8192,`pairwise-prompt-byte-cap:${packet.ordinal}`);
        const reply=await ask(packet.ordinal,`pairwise-${order}`,prompt,
          `PAIRWISE-${num}-${order}.json`);
        pairwiseCalls++;
        let selectedPath=null,error=null;
        if(reply.row.http_status===200 && reply.row.finish_reason==='stop' &&
          typeof reply.content==='string'){
          try{selectedPath=choice(reply.content)==='A'?first.path:second.path;pairwiseValid++;}
          catch(e){error=String(e.message).slice(0,160);}
        }else error='provider-status-finish-or-content';
        pair.push({order,selected_path:selectedPath,validation_error:error,
          call_file:`PAIRWISE-${num}-${order}.json`});
        if(stopped)break;
      }
    }
    const guardPromotes=pair.length===2 && pair.every(p=>p.selected_path===listTop.path);
    const selectedPaths=ids?.map(id=>packet.candidates[id-1].path)??[];
    const decision={schema_version:'are.g01-bugswarm-graph-dev-b-r8-decision/v1',
      ordinal:packet.ordinal,id:packet.id,r2_top_path:r2top.path,
      listwise_valid:ids!==null,listwise_error:listwiseError,selected_ids:ids,
      selected_paths:selectedPaths,listwise_top_path:listTop.path,
      pairwise:pair,guard_promotes:guardPromotes,
      guarded_top_path:guardPromotes?listTop.path:r2top.path,
      stopped_after_case:stopped};
    save(`DECISION-${num}.json`,decision);
    process.stdout.write(JSON.stringify({ordinal:packet.ordinal,listwise_valid:ids!==null,
      pairwise_calls:pair.length,guard_promotes:guardPromotes,stopped})+'\n');
    if(stopped)break;
  }
  const result={schema_version:'are.g01-bugswarm-graph-dev-b-r8-generation-result/v1',
    status:!stopped && listwiseValid===24 && calls<=72?
      'completed-valid-listwise':'terminal-incomplete-or-invalid',
    calls,listwise_valid:listwiseValid,pairwise_calls:pairwiseCalls,
    pairwise_valid:pairwiseValid,known_prompt_tokens:knownPromptTokens,
    known_completion_tokens:knownCompletionTokens,summed_model_call_elapsed_ms:summedElapsedMs,
    maximum_calls:72,automatic_retries:0,packets_sha256:pins.packets};
  save('GENERATION-RESULT.json',result);
  process.stdout.write(JSON.stringify(result)+'\n');
  if(result.status!=='completed-valid-listwise')process.exitCode=2;
}

await run();
