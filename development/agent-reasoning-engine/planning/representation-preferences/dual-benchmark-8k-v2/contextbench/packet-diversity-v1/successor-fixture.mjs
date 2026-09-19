// Synthetic native fixture copied additively from run-v2.test.mjs; no sockets.
import {openContextRecycling} from '../../../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/context-recycling.mjs';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,mkdirSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {EventEmitter} from 'node:events';
import http from 'node:http';
import fs from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import {createGlmClient,MODEL} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/holdout-v1/transport.mjs';
import {stable,bodyForReceipt,attachObservationHandles,bindDelivery} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {reasoningEvidence} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/accounting-v1/accounting.mjs';
import {buildTerminalEvidence,EXPANDED} from './terminal-evidence.mjs';
import {extractBoundary,preparePackets,hash} from './prepare.mjs';
import {runNativeRequest,runSlot,derivePrefixLedger,measureNativeWire,runPairs,classifyExportFailure} from './run-v2.mjs';
const clientOptions={chat_endpoint:'http://127.0.0.1/chat/completions',tokenizer_endpoint:'http://127.0.0.1/tokenizer',maximum_requests:96,maximum_output_tokens:2048,maximum_request_bytes:262144,request_budget:'contextbench-deferral-v1',token_margin:512,model_timeout_ms:120000};
async function fixture(){
 const root=mkdtempSync(join(tmpdir(),'packet-native-')),repoRoot=join(root,'base');mkdirSync(repoRoot);writeFileSync(join(repoRoot,'a.js'),'alpha beta\n');
 const task={instance_id:'fixture',repo_url:'https://example.invalid/source.git',base_commit:'a'.repeat(40),problem_statement:'alpha beta'};
 const call={id:'r1',type:'function',function:{name:'read_file',arguments:stable({path:'a.js',start_line:1,line_count:1})}};
 const observation=attachObservationHandles(call,{ok:true,output:{path:'a.js',start_line:1,end_line:1,utf8:'alpha beta',source_sha256:hash('alpha beta\n')}});
 const prefixPrompt=stable({messages:[{role:'user',content:'alpha beta'},{role:'assistant',tool_calls:[call]},{role:'tool',tool_call_id:'r1',content:stable(observation)}],tools:[]});
 const message={role:'assistant',content:'Observed source.',reasoning_content:'synthetic fixture reasoning'};
 const profile={kind:'model',status:200,dispatched:true,model:MODEL,reasoning_effort:'low',output_cap:2048,input_tokens:100,output_tokens:20,finish_reason:'stop'};
 const receipt={...profile,request_sha256:hash(stable(bodyForReceipt(prefixPrompt,profile))),retained_reasoning:reasoningEvidence(message,{output_tokens:20,reasoning_tokens:7}),reasoning_tokens:7};
 const captures=[{prompt:prefixPrompt,prompt_sha256:hash(prefixPrompt)}],reads=bindDelivery({captures,receipts:[receipt]}).read_observations;
 const snapshots=[{path:'a.js',source_sha256:hash('alpha beta\n'),utf8:'alpha beta\n'}];
 const packet=await buildTerminalEvidence({reads,snapshots,repoRoot,problem_statement:task.problem_statement,version:EXPANDED,measure_tokens:async()=>30});
 const prompt=stable({messages:[{role:'user',content:task.problem_statement},message,{role:'user',content:packet.model.text}],tools:[packet.model.tool]});
 const last={...profile,finish_reason:'tool_calls',request_sha256:hash(stable(bodyForReceipt(prompt,profile)))};
 const result={captures:[...captures,{prompt,prompt_sha256:hash(prompt)}],receipts:[receipt,last],terminal_evidence_presentations:[{packet}],terminal_evidence_attempts:[{receipt_start_index:1,receipt_index:1,receipt_sha256:hash(last),request_sha256:last.request_sha256}]};
 const client=createGlmClient(clientOptions),cell={context_limit:8000,recycle_at:7000,safety_margin:1000,limits:{maximum_calls:96,output_cap:2048},provider_profile:{token_margin:512,request_tokenizer_transport_attempts:1,index_tokenizer_transport_attempts:1}};
 const material={version:1,binding:'b'.repeat(64),identity:client.identity,phase:'idle',model_calls:2,tokenizer_calls:0,receipts:result.receipts};
 const ledger={...material,ledger_digest:hash(material)};
 const donor={...extractBoundary({result,ledger,task,cell,donor_id:'fixture-control'}),snapshots};
 return {root,repoRoot,donor,prompt,result,ledger,task,cell,create_client:()=>createGlmClient(clientOptions),storage_guard:()=>{},cleanup:()=>rmSync(root,{recursive:true,force:true})};
}
/** No sockets: replace the HTTP primitive with in-memory wire responses, keeping
 * the actual GLM transport, private registration, ledger and recycler active. */
async function wireFixture(fn,{tokenCount=100,status=200,omitUsage=false,onModel=()=>{},handles=['h0']}={}){
 const original=http.request,calls=[];
 http.request=(url,options,callback)=>{const request=new EventEmitter();request.destroy=()=>{};request.end=body=>{
  const requestBody=JSON.parse(body);calls.push({path:url.pathname,body:requestBody});
  const tokenizer=url.pathname.endsWith('/tokenizer');if(!tokenizer)onModel();
  const message={role:'assistant',content:null,tool_calls:[{id:'terminal',type:'function',function:{name:'submit_context_handles_v2',arguments:stable({summary:'Synthetic selection',context_handles:handles})}}]};
  const payload=tokenizer?{usage:{prompt_tokens:tokenCount}}:status!==200?{error:{code:'1305'}}:{model:MODEL,choices:[{message,finish_reason:'tool_calls'}],...(!omitUsage?{usage:{prompt_tokens:100,completion_tokens:20}}:{})};
  queueMicrotask(()=>{const response=new EventEmitter();response.headers={'content-type':'application/json'};response.statusCode=tokenizer?200:status;response.destroy=()=>{};callback(response);response.emit('data',Buffer.from(JSON.stringify(payload)));response.emit('end');});
 };return request;};syncBuiltinESMExports();
 try{return await fn(calls);}finally{http.request=original;syncBuiltinESMExports();}
}

export {fixture,wireFixture,clientOptions};
