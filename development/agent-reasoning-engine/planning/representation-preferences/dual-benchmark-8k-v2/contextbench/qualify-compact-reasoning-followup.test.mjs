// Actual native wire/ledger/repository tools, scripted HTTP responses only.
import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import http from 'node:http';import {EventEmitter} from 'node:events';import {syncBuiltinESMExports} from 'node:module';
import {qualifyCompactFollowup,SEARCH_ARGS,REPORT_TOOL,DEBUG_CASE} from './qualify-compact-reasoning-followup.mjs';import {createGlmClient} from './packet-diversity-v1/transport-bounded-v4.mjs';import {decodeToolPayload} from './tool-payload-codec.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
async function fixture({wrong=false,noReasoning=false,failModel=false,overflow=false,drift=false}={}){
 const root=mkdtempSync(join(tmpdir(),'fresh-followup-')),fixture_root=join(root,'source'),out_root=join(root,'out');mkdirSync(fixture_root);mkdirSync(out_root);
 const git=args=>execFileSync('git',['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',...args],{cwd:fixture_root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 const text=Array.from({length:20},(_,i)=>'context observation '+i+' test evidence').join('\n')+'\n';writeFileSync(join(fixture_root,'observations.txt'),text);git(['init','-q']);git(['add','.']);git(['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','fixture']);const base_commit=git(['rev-parse','HEAD']);
 let models=0,tokenizers=0;const wires=[],saved=http.request;
 http.request=(url,options,callback)=>{const req=new EventEmitter();req.destroy=()=>{};req.end=body=>queueMicrotask(()=>{
  const wire=JSON.parse(body),tokenizer=url.pathname.endsWith('/tokenizer');wires.push({tokenizer,wire});let payload;
  if(tokenizer){tokenizers++;payload={usage:{prompt_tokens:tokenizers===1?1000:overflow?6000:2500}};}
  else{
   models++;if(failModel&&models===2){req.emit('error',Object.assign(Error('synthetic-private-message'),{code:'ECONNRESET'}));return;}
   let name,args;if(models===1){name='search';args=SEARCH_ARGS;}else{const p=JSON.parse(wire.messages.find(m=>m.role==='tool').content),original=decodeToolPayload({tool:'search',payload:p});name='report_observation';args=Object.fromEntries(REPORT_TOOL.function.parameters.required.map(k=>[k,original.output.observations[0][k]]));if(wrong)args.utf8+=' wrong';}
   const message={role:'assistant',content:null,...(!noReasoning?{reasoning_content:'Synthetic reasoning '+models}:{}),tool_calls:[{id:'call-'+models,type:'function',function:{name,arguments:JSON.stringify(args)}}]};
   payload={model:'glm-5.3-flash',choices:[{message,finish_reason:'tool_calls'}],usage:{prompt_tokens:1000,completion_tokens:30,completion_tokens_details:{reasoning_tokens:noReasoning?0:7}}};
  }
  const response=new EventEmitter();response.statusCode=200;response.headers={'content-type':'application/json'};response.destroy=()=>{};callback(response);response.emit('data',Buffer.from(JSON.stringify(payload)));response.emit('end');
 });return req;};syncBuiltinESMExports();
 try{
  const result=await qualifyCompactFollowup({out_root,fixture_root,base_commit,fixture_sha256:drift?'0'.repeat(64):hash(text),binding:{},credential_path:'unused',signal:new AbortController().signal},{host_guard:()=>({admitted:true}),create_client:({credential_path,...args})=>createGlmClient({...args,chat_endpoint:'http://127.0.0.1/chat/completions',tokenizer_endpoint:'http://127.0.0.1/tokenizer'})});
  const savedResult=JSON.parse(readFileSync(join(out_root,'RESULTS.json')));assert.deepEqual(result,savedResult);return {result,wires,models,tokenizers};
 }finally{http.request=saved;syncBuiltinESMExports();rmSync(root,{recursive:true,force:true});}
}
test('fresh two-call native qualification binds encoded observations, actual retained reasoning and exact model wire',async()=>{
 const f=await fixture();assert.equal(f.result.complete,true,f.result.failure);assert.equal(f.result.qualification_passed,true);assert.equal(f.models,2);assert.equal(f.tokenizers,2);assert.equal(f.result.known_model_tokens,2060);assert.equal(f.result.unknown_model_calls,0);assert.equal(f.result.retained_reasoning_reservation,7);assert.equal(f.result.delivered_observations,20);
 assert.equal(f.result.rows[1].projected_tokens,5067);assert.deepEqual(f.wires[2].wire.messages,f.wires[3].wire.messages);assert.deepEqual(f.wires[2].wire.tools,f.wires[3].wire.tools);
});
test('completed wrong interpretation or absent retained reasoning cannot pass qualification',async()=>{
 for(const flags of [{wrong:true},{noReasoning:true}]){const f=await fixture(flags);assert.equal(f.result.complete,true);assert.equal(f.result.qualification_passed,false);assert.equal(f.models,2);}
});
test('followup provider failure preserves paid first call and unknown second call with bounded diagnostic',async()=>{
 const f=await fixture({failModel:true});assert.equal(f.result.complete,false);assert.equal(f.result.qualification_passed,false);assert.equal(f.models,2);assert.equal(f.result.known_model_tokens,1030);assert.equal(f.result.unknown_model_calls,1);assert.equal(f.result.conservative_model_tokens,9030);assert.deepEqual(f.result.receipts.at(-1).transport_diagnostic.codes,['ECONNRESET']);assert.equal(f.result.delivered_observations,0);
});
test('oversized fresh followup cannot dispatch another model',async()=>{
 const f=await fixture({overflow:true});assert.equal(f.result.complete,false);assert.match(f.result.failure,/fresh-context-too-large/);assert.equal(f.models,1);assert.equal(f.tokenizers,2);assert.equal(f.result.known_model_tokens,1030);assert.equal(f.result.unknown_model_calls,0);
});
test('fixture drift is rejected before creating any HTTP attempt',async()=>{
 const f=await fixture({drift:true});assert.equal(f.result.complete,false);assert.match(f.result.failure,/fixture-drift/);assert.equal(f.wires.length,0);
});

test('debugging decision has exactly one failing candidate under the complete trace',()=>{
 const failing=[];
 for(const [name,code]of Object.entries(DEBUG_CASE.implementations)){
  const load=new Function(code)();let calls=0;
  const values=DEBUG_CASE.trace.map(t=>load(t.key,t.revision,()=>{calls++;return t.loader_value;}));
  if(JSON.stringify(values)!==JSON.stringify(DEBUG_CASE.expected_values)||calls!==DEBUG_CASE.expected_loader_calls)failing.push(name);
 }
 assert.deepEqual(failing,[SEARCH_ARGS.query]);
});
