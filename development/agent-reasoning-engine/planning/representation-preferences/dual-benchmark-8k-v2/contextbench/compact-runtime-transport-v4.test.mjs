// Same runtime integration exercised with additive diagnostic transport. Open questions: TRANSPORT-DIAGNOSTICS.md.
// Real native transport/recycler/source/edit/export; in-memory HTTP, no provider calls.
import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {execFileSync} from 'node:child_process';
import http from 'node:http';import {EventEmitter} from 'node:events';import {syncBuiltinESMExports} from 'node:module';
import {runMinimalRepairEpisode} from './minimal-repair-compact.mjs';
import {runMinimalRepairEpisode as runRawEpisode} from './minimal-repair-episode.mjs';
import {renderCompactPrompt} from './compact-prompt.mjs';import {PAYLOAD_GUIDE,decodeToolPayload} from './tool-payload-codec.mjs';
import {createNativeInvestigationDriver} from './independent-native-driver.mjs';
import {createGlmClient} from './packet-diversity-v1/transport-bounded-v4.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';import {createStageOutputGuard} from './packet-diversity-v1/stage-output-guard.mjs';
import {bindCompactDelivery} from './compact-delivery.mjs';
import {tools,createRepositoryTools} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/repository-tools.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
async function fixture({raw=false,failFollowup=false,tamperReasoning=false}={}){
 const root=mkdtempSync(join(tmpdir(),'compact-runtime-')),base=join(root,'base'),work=join(root,'work'),out=join(root,'out');
 const git=(cwd,...args)=>execFileSync('git',['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',...args],{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 const original=Array.from({length:20},(_,i)=>'context value '+i).join('\n')+'\n',events=[],snapshots=[],wires=[];let modelCalls=0,driver;
 const originalRequest=http.request;
 try{
  git(root,'init',base);writeFileSync(join(base,'value.txt'),original);git(base,'add','.');git(base,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','fixture');const commit=git(base,'rev-parse','HEAD');git(root,'clone','--no-local',base,work);mkdirSync(out);
  const execute_tool=createRepositoryTools({root:work,base_commit:commit,record_source:s=>snapshots.push(s)});
  const persistence=createStagePersistence({stage_root:out,stage_guard:createStageOutputGuard({root:out})});
  http.request=(url,options,callback)=>{const request=new EventEmitter();request.destroy=()=>{};request.end=body=>{
   const wire=JSON.parse(body),tokenizer=url.pathname.endsWith('/tokenizer');wires.push({tokenizer,wire});
   let payload,status=200;
   if(tokenizer){
    const search=wire.messages.find(m=>m.role==='tool'&&JSON.parse(m.content)?.output?.observations?.length===20);
    payload={usage:{prompt_tokens:search?(JSON.parse(search.content).output.observation_encoding?3400:5800):1000}};
   }else{
    const n=modelCalls++,packet=events.find(e=>e.kind==='terminal-packet')?.packet;
    const sequence=[['search',{query:'context',path_prefix:'',offset:0,limit:20,revision:'current'}],['apply_edits',{edits:[{path:'value.txt',source_sha256:hash(original),old_text:'context value 0',new_text:'context changed 0'}]}],['read_file',{path:'value.txt',start_line:1,line_count:1,revision:'base'}],['finish_issue_attempt',{}]];
    const [name,args]=packet?['submit_context_handles_v2',{summary:'Fixture edit attempted; base evidence selected.',context_handles:[packet.private.bindings.find(b=>b.start_line===1).handle]}]:sequence[n];
    const message={role:'assistant',content:null,reasoning_content:'synthetic reasoning '+n,tool_calls:[{id:'call-'+n,type:'function',function:{name,arguments:stable(args)}}]};
    payload={model:'glm-5.3-flash',choices:[{message,finish_reason:'tool_calls'}],usage:{prompt_tokens:1000,completion_tokens:30,completion_tokens_details:{reasoning_tokens:7}}};
    if(failFollowup&&n===1){status=503;payload={error:{code:'fixture-unavailable'}};}
   }
   queueMicrotask(()=>{const response=new EventEmitter();response.headers={'content-type':'application/json'};response.statusCode=status;response.destroy=()=>{};callback(response);response.emit('data',Buffer.from(stable(payload)));response.emit('end');});
  };return request;};syncBuiltinESMExports();
  const client=createGlmClient({chat_endpoint:'http://127.0.0.1/chat/completions',tokenizer_endpoint:'http://127.0.0.1/tokenizer',maximum_requests:96,maximum_output_tokens:2048,maximum_request_bytes:262144,maximum_model_retries:0,maximum_tokenizer_transport_attempts:1,request_budget:'contextbench-budget-v1',token_margin:512,reasoning_effort:'low',persistence,before_dispatch:async()=>{}});
  driver=createNativeInvestigationDriver({client,profile:{model:'glm-5.3-flash',reasoning_effort:'low',output_cap:2048},scope:{request:'Fix context value 0'},fixture_root:base,directory:join(out,'driver'),persistence,signal:new AbortController().signal,before_dispatch:async()=>true});
  const selectedDriver=tamperReasoning?{...driver,prepare:args=>{const wire=JSON.parse(args.prompt),assistant=wire.messages.find(m=>m.role==='assistant');if(assistant)assistant.reasoning_content+=' tampered';return driver.prepare({...args,prompt:stable(wire)});}}:driver;
  const result=await(raw?runRawEpisode:runMinimalRepairEpisode)({task:{problem_statement:'Fix context value 0',instance_id:'fixture',repo_url:'https://example.invalid/repo.git',base_commit:commit},driver:selectedDriver,tools,execute_tool,source_context:()=>({snapshots,repoRoot:base}),measure_tokens:async()=>100,persist:e=>events.push(structuredClone(e)),output_cap:2048});
  await driver.close();
  const ledger=JSON.parse(readFileSync(join(out,'driver/glm-transport-ledger.json'))),captures=events.filter(e=>e.kind==='request-capture').map(e=>e.capture);
  const delivered=bindCompactDelivery({captures,receipts:client.receipts});
  return {result,events,wires,modelCalls,receipts:structuredClone(client.receipts),ledger,delivered,base:readFileSync(join(base,'value.txt'),'utf8'),work:readFileSync(join(work,'value.txt'),'utf8'),original};
 }finally{await driver?.close();http.request=originalRequest;syncBuiltinESMExports();rmSync(root,{recursive:true,force:true});}
}
test('compact full runtime retains reasoning, measures exact encoded wire, edits and exports native base evidence',async()=>{
 const f=await fixture();assert.equal(f.result.status,'final_context_selected',f.result.error);assert.equal(f.modelCalls,5);
 const models=f.wires.filter(x=>!x.tokenizer),measurements=f.wires.filter(x=>x.tokenizer);
 const wire=models[1].wire;assert.equal(wire.messages.find(m=>m.role==='assistant').reasoning_content,'synthetic reasoning 0');
 const payload=JSON.parse(wire.messages.find(m=>m.role==='tool').content);assert.equal(payload.output.observation_encoding,'source-dictionary-v1');assert.equal(payload.output.observations.length,20);
 assert.ok(wire.messages[0].content.endsWith('\n'+PAYLOAD_GUIDE));assert.deepEqual(decodeToolPayload({tool:'search',payload}),f.events.find(e=>e.kind==='source-tool-result').output);
 assert.deepEqual(wire.messages,measurements[1].wire.messages);assert.deepEqual(wire.tools,measurements[1].wire.tools);
 const receipt=f.receipts.filter(r=>r.kind==='tokenizer')[1];assert.equal(receipt.retained_reasoning_reservation,7);assert.equal(receipt.input_tokens+512+2048+receipt.retained_reasoning_reservation,5967);
 assert.equal(f.result.phase_state.known_tokens,5150);assert.equal(f.ledger.phase,'idle');assert.deepEqual(f.ledger.receipts,f.receipts);
 assert.equal(f.base,f.original);assert.match(f.work,/context changed 0/);assert.ok(f.delivered.read_observations.length>=20);
 assert.equal(f.result.exported.prediction.traj_data.pred_files.length,1);assert.equal(f.result.phase_state.closed,true);
});
test('same raw tool result exceeds the measured native window and cannot dispatch followup',async()=>{
 const f=await fixture({raw:true});assert.equal(f.result.status,'run_error');assert.equal(f.result.error,'recycling.fresh-context-too-large');assert.equal(f.modelCalls,1);assert.equal(f.delivered.read_observations.length,0);
});
test('failed followup never credits encoded observations as model-delivered',async()=>{
 const f=await fixture({failFollowup:true});assert.equal(f.result.status,'run_error');assert.equal(f.modelCalls,2);assert.equal(f.delivered.read_observations.length,0);assert.equal(f.result.exported,undefined);
});
test('retained reasoning drift is rejected before tokenizer or model followup',async()=>{
 const f=await fixture({tamperReasoning:true});assert.equal(f.result.status,'run_error');assert.match(f.result.error,/unbound-retained-reasoning/);assert.equal(f.modelCalls,1);assert.equal(f.wires.length,2);assert.equal(f.delivered.read_observations.length,0);
});
test('renderer exactly reproduces reviewed prospective pair, preserves inputs and is idempotent',()=>{
 const raw=JSON.parse(readFileSync(new URL('./payload-pair-live-r2/raw.json',import.meta.url))),encoded=JSON.parse(readFileSync(new URL('./payload-pair-live-r2/encoded.json',import.meta.url))),before=stable(raw);
 const prompt=renderCompactPrompt(raw);assert.equal(prompt,stable(encoded));assert.equal(stable(raw),before);assert.equal(renderCompactPrompt(JSON.parse(prompt)),prompt);
 const plain={messages:[{role:'system',content:'task'},{role:'user',content:'plain'}],tools:[]};assert.equal(renderCompactPrompt(plain),stable(plain));
 const broken=structuredClone(raw);broken.messages.at(-1).content='{';assert.throws(()=>renderCompactPrompt(broken),/search-json/);
});
