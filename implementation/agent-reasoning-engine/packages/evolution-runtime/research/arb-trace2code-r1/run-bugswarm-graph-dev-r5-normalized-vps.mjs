#!/usr/bin/env node
// VPS-only r5 one-shot selector. Reads r4 source-only packets/tokenizer, never gold.
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const r4='/opt/are-benchmark-runs/g01-bugswarm-graph-dev-r4-union-selector';
const root='/opt/are-benchmark-runs/g01-bugswarm-graph-dev-r5-normalized-selector';
const transportPath='/opt/are/evolution-runtime/g01-source-combined-candidate-r8/implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
const secretPath='/opt/are-keld-presentation/secrets/model_api_key';
const pins={packets:'2eab7cd9858421eaca78f6e13c7f6209eec29adf1e6224b5a0e0701b3728d33f',
  packetSeal:'cce178545b3e511f6fbbdc14efcddf9a043603fc82b7be680d09072e97f10c32',
  tokenizer:'46b3bdfda82b5268e86da7fe7c26885ab7e1b03ecc70f4a97e086bbc48f4e8ba',
  protocol:'8265d321d814ff2d71b4b3984e943f623f02d87996aa8a1ddcc4f14b52bd6325',
  transport:'5669b2c72d642e1ccf1d5bd796064c1e61d9dcad8828622f9b6f4450acdec56d'};
const model='glm-5.3-flash';
const sha=data=>createHash('sha256').update(data).digest('hex');
const digest=path=>sha(readFileSync(path));
const need=(ok,why)=>{if(!ok)throw Error(`g01-r5.${why}`);};
const save=(path,value)=>writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});

function readInputs(){
  need(digest(join(r4,'PACKETS.jsonl'))===pins.packets &&
    digest(join(r4,'PACKET-SEAL.json'))===pins.packetSeal &&
    digest(join(r4,'TOKENIZER-RESULT.json'))===pins.tokenizer &&
    digest(join(root,'G01-BUGSWARM-GRAPH-DEV-R5-NORMALIZED-SELECTOR-PROTOCOL-2026-10-04.md'))===pins.protocol &&
    digest(transportPath)===pins.transport,'input-pin-drift');
  const seal=JSON.parse(readFileSync(join(r4,'PACKET-SEAL.json'),'utf8'));
  const token=JSON.parse(readFileSync(join(r4,'TOKENIZER-RESULT.json'),'utf8'));
  const packets=readFileSync(join(r4,'PACKETS.jsonl'),'utf8').trimEnd().split('\n').map(JSON.parse);
  need(seal.cases===24 && seal.packets_sha256===pins.packets &&
    !seal.gold_opened && !seal.reserved_confirmation_opened && seal.model_calls===0 &&
    token.status==='admitted' && token.attempts===24 && token.admitted===24 &&
    token.summed_prompt_tokens===52511 && token.summed_prompt_tokens<=130000 &&
    packets.length===24,'source-or-token-shape');
  const tokenHashes=[];
  packets.forEach((packet,i)=>{
    const tokenPath=join(r4,`TOKENIZER-${String(i+1).padStart(2,'0')}.json`);
    const t=JSON.parse(readFileSync(tokenPath,'utf8'));
    need(packet.ordinal===i+1 && packet.gold_opened===false && packet.model_calls===0 &&
      packet.exposed_development===true && packet.candidates.length===packet.candidate_count &&
      packet.candidates.every((c,j)=>c.candidate_id===j+1) &&
      t.ordinal===packet.ordinal && t.id===packet.id && t.admitted===true &&
      t.prompt_sha256===sha(packet.prompt) && t.prompt_tokens+512<=8192,
      `packet-or-token-case:${i+1}`);
    tokenHashes.push(digest(tokenPath));
  });
  return {packets,tokenHashes};
}

function parseSelection(content,packet){
  const value=JSON.parse(content);
  need(value && typeof value==='object' && !Array.isArray(value) &&
    Object.keys(value).join(',')==='candidate_ids' &&
    Array.isArray(value.candidate_ids) && value.candidate_ids.length<=8,
    'response-object-shape');
  const byPath=new Map(packet.candidates.map(c=>[c.path,c.candidate_id]));
  const ids=value.candidate_ids.map(item=>{
    if(Number.isSafeInteger(item))return item;
    if(typeof item==='string' && /^[1-9][0-9]*$/.test(item))return Number(item);
    if(typeof item==='string' && byPath.has(item))return byPath.get(item);
    throw Error('g01-r5.response-value-invalid');
  });
  need(ids.every(n=>Number.isSafeInteger(n)&&n>=1&&n<=packet.candidate_count) &&
    new Set(ids).size===ids.length,'response-ids-invalid');
  return ids;
}

async function run(){
  need(process.argv.length===2 && !existsSync(join(root,'GENERATION-FREEZE.json')) &&
    !existsSync(join(root,'GENERATION-RESULT.json')),'prior-run-or-usage');
  const {packets,tokenHashes}=readInputs();
  const {postOnce,stable,MODEL}=await import(transportPath);
  need(MODEL===model,'transport-model-drift');
  const key=readFileSync(secretPath,'utf8').trim();
  need(key.length>=8 && key.length<=8192,'secret-shape');
  save(join(root,'GENERATION-FREEZE.json'),{
    schema_version:'are.g01-graph-dev-r5-generation-freeze/v1',
    posture:'private exposed development; no evaluator or reserved confirmation',
    packets_sha256:pins.packets,packet_seal_sha256:pins.packetSeal,
    tokenizer_result_sha256:pins.tokenizer,token_case_sha256:tokenHashes,
    protocol_sha256:pins.protocol,runner_sha256:digest(fileURLToPath(import.meta.url)),
    transport_sha256:pins.transport,model,
    endpoint:'https://api.z.ai/api/paas/v4/chat/completions',
    maximum_calls:24,maximum_output_tokens:512,reasoning_effort:'low',
    prompt_cost_cap_tokens:130000,automatic_retries:0,
    invalid_policy:'count-invalid-no-retry',transport_failure_policy:'stop-no-retry'});
  let attempts=0,valid=0;
  for(const packet of packets){
    const body=stable({model,messages:[{role:'user',content:packet.prompt}],
      stream:false,max_tokens:512,reasoning_effort:'low'});
    const start=Date.now();let response;
    try{response=await postOnce(new URL('https://api.z.ai/api/paas/v4/chat/completions'),body,
      {apiKey:key,timeout_ms:120000,maximum_response_bytes:262144});}
    catch(error){response={status:null,payload:null,
      failure_code:String(error?.code??error?.message??'request-failed').slice(0,100)};}
    const choice=response.payload?.choices?.[0];let selected=null,invalid=null;
    if(response.status===200 && choice?.finish_reason==='stop' &&
      typeof choice?.message?.content==='string'){
      try{selected=parseSelection(choice.message.content,packet);}
      catch(error){invalid=String(error.message).slice(0,160);}
    }else invalid='provider-status-finish-or-content';
    const row={schema_version:'are.g01-graph-dev-r5-response/v1',
      ordinal:packet.ordinal,id:packet.id,request_sha256:sha(body),
      prompt_sha256:sha(packet.prompt),status:selected===null?'invalid':'valid',
      http_status:response.status,failure_code:response.failure_code??null,
      elapsed_ms:Date.now()-start,finish_reason:choice?.finish_reason??null,
      validation_error:invalid,selected_ids:selected,provider_payload:response.payload??null};
    save(join(root,`GENERATION-${String(packet.ordinal).padStart(2,'0')}.json`),row);
    attempts++;if(selected!==null)valid++;
    process.stdout.write(JSON.stringify({ordinal:packet.ordinal,status:row.status,
      http_status:row.http_status,selected_count:selected?.length??null,
      prompt_tokens:response.payload?.usage?.prompt_tokens??null,
      completion_tokens:response.payload?.usage?.completion_tokens??null})+'\n');
    if(response.status!==200 || response.failure_code)break;
  }
  const result={schema_version:'are.g01-graph-dev-r5-generation-result/v1',
    status:attempts===24&&valid===24?'completed-valid':'terminal-incomplete-or-invalid',
    attempts,valid,maximum_calls:24,automatic_retries:0,packets_sha256:pins.packets};
  save(join(root,'GENERATION-RESULT.json'),result);
  process.stdout.write(JSON.stringify(result)+'\n');
  if(result.status!=='completed-valid')process.exitCode=2;
}

await run();
