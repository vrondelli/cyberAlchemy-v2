// Real transport/runner/storage pipeline against a loopback provider, never paid GLM.
import {test} from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {runComparisonArm} from './comparison-compact-arm-canonical.mjs';
import {runComparisonArm as oldDispatcher} from './comparison-compact-arm.mjs';
import {buildComparisonSchedule} from './comparison-schedule.mjs';import {runComparisonQueue} from './comparison-queue.mjs';
import {createComparisonOutcomeStore,verifyComparisonOutcomeSeal} from './comparison-outcome-store.mjs';
import {createComparisonEvidenceManifest,reconcileComparisonCampaignEvidence} from './comparison-evidence-manifest-r2.mjs';
import {createGlmClient} from './packet-diversity-v1/transport-bounded-v4.mjs';import {createIndexTokenizer} from './packet-diversity-v1/live-client-bounded-v4.mjs';
import {createStageOutputGuard} from './packet-diversity-v1/stage-output-guard.mjs';import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
function response(wire){
 const names=wire.tools?.map(t=>t.function.name)??[],tool=(name,args)=>({message:{role:'assistant',tool_calls:[{id:'call-'+hash(stable(wire)).slice(0,10),type:'function',function:{name,arguments:stable(args)}}]},finish_reason:'tool_calls'});
 if(!names.length)return {message:{role:'assistant',content:stable({questions:[{question:'What is required?',investigates:'intent'},{question:'What provides it?',investigates:'behavior'},{question:'What can regress?',investigates:'compatibility'}]})},finish_reason:'stop'};
 const final=wire.tools.find(t=>t.function.name==='submit_context_handles_v2');if(final)return tool(final.function.name,{summary:'Fixture source',context_handles:final.function.parameters.properties.context_handles.items.enum.slice(0,1)});
 const hasRead=wire.messages.some(m=>m.role==='tool');
 if(hasRead&&names.includes('submit_investigation')){const q=wire.messages.flatMap(m=>{try{return [JSON.parse(m.content).question?.id].filter(Boolean);}catch{return [];}})[0];return tool('submit_investigation',{branch_id:q,claims:[]});}
 if(hasRead&&names.includes('finish_issue_attempt'))return tool('finish_issue_attempt',{});
 if(hasRead)return {message:{role:'assistant',content:stable({summary:'Fixture source',context_read_ids:[]})},finish_reason:'stop'};
 return tool('read_file',{path:'a.py',start_line:1,line_count:1,revision:'base'});
}
async function fixture(t,mode,{failSave=false,dispatch_arm=runComparisonArm}={}){
 const root=mkdtempSync(join(tmpdir(),'canonical-integration-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const cache=join(root,'cache');mkdirSync(cache);const git=(...a)=>execFileSync('git',['-c','core.hooksPath=/dev/null',...a],{cwd:cache,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();git('init');writeFileSync(join(cache,'a.py'),'a = 1\n');git('add','.');git('-c','user.name=fixture','-c','user.email=fixture@example.invalid','commit','-m','fixture');const commit=git('rev-parse','HEAD');git('remote','add','origin','https://example.invalid/source.git');
 let modelCalls=0;const server=http.createServer(async(req,res)=>{let body='';for await(const b of req)body+=b;res.setHeader('content-type','application/json');if(req.url==='/tokenizer'){res.end(JSON.stringify({usage:{prompt_tokens:100}}));return;}modelCalls++;if(mode==='unknown'){req.socket.destroy();return;}const wire=JSON.parse(body),r=response(wire);res.end(JSON.stringify({model:'glm-5.3-flash',choices:[r],usage:{prompt_tokens:100,completion_tokens:20}}));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>{server.closeAllConnections();server.close(r);}));const endpoint='http://127.0.0.1:'+server.address().port;
 const template=JSON.parse(readFileSync(new URL('./discovery-v1/live-config.json',import.meta.url))).tasks[0].cell_template;
 const tasks=Array.from({length:4},(_,i)=>{const task={instance_id:'fixture-'+i,original_inst_id:'fixture-'+i,repo:'fixture',repo_url:'https://example.invalid/source.git',language:'python',base_commit:commit,problem_statement:'Inspect the fixture behavior.',source:'fixture'},task_path=join(root,'task'+i+'.json');writeFileSync(task_path,stable(task));return {id:'task'+i,instance_id:task.instance_id,task_path,task_sha256:hash(readFileSync(task_path)),repository_cache:cache,base_commit:commit,cell_template:{...structuredClone(template),instance_id:task.instance_id}};});
 const config={model:'glm-5.3-flash',context_limit:8000,total_tokens_per_arm:96000,credential_path:'unused',python:'unused',scorer:'unused',upstream:'unused',source_manifest:'unused',scoring_cache:'unused',tasks};const config_path=join(root,'config.json'),cohort_path=join(root,'cohort.json');writeFileSync(config_path,stable(config));writeFileSync(cohort_path,stable({source_config_sha256:hash(readFileSync(config_path)),cohort:tasks.map(({id,instance_id,task_path,task_sha256,base_commit})=>({task_id:id,instance_id,task_path,task_sha256,base_commit}))}));const sources={config_path,cohort_path,cohort_sha256:hash(readFileSync(cohort_path))},schedule=buildComparisonSchedule(sources);
 const runs=join(root,'runs'),outcomes=join(root,'outcomes');mkdirSync(runs);mkdirSync(outcomes);const make=root=>createStagePersistence({stage_root:root,stage_guard:createStageOutputGuard({root})}),base=make(runs),persistence={...base,writeJson(path,value,options){if(failSave&&path.endsWith('/result.json'))throw Error('fixture.persist-failed');return base.writeJson(path,value,options);}},store=createComparisonOutcomeStore({root:outcomes,schedule,sources,persistence:make(outcomes)}),entries=schedule.slots.map(s=>({slot_id:s.slot_id,files:null,transport_identity:null}));
 const terminal=await runComparisonQueue({schedule,sources,signal:new AbortController().signal,persist:store.persist,execute:async({slot,signal})=>{
  let client;const run=join(runs,String(slot.sequence).padStart(2,'0'));
  const create_client=({cell,record_event})=>{
   const native=createGlmClient({chat_endpoint:endpoint+'/chat/completions',tokenizer_endpoint:endpoint+'/tokenizer',maximum_requests:96,maximum_output_tokens:2048,maximum_model_retries:0,maximum_tokenizer_transport_attempts:1,request_budget:cell.limits.output_deferral?'contextbench-deferral-v1':'contextbench-budget-v1',maximum_request_bytes:262144,token_margin:512,reasoning_effort:'low',model_timeout_ms:30000,signal,persistence,before_dispatch:async()=>{}});
   const index=createIndexTokenizer({registry:{consume:async({consumer})=>consumer(Buffer.from('fixture'))},reference:{},maximum_calls:512,signal,record:r=>record_event({kind:'index-tokenizer',receipt:r}),post:async()=>{if(mode==='index'&&native.receipts.some(r=>r.kind==='model'&&r.status===200))throw Object.assign(Error('fixture.index-failure'),{code:'request-failed'});return {status:200,payload:{usage:{prompt_tokens:100}},bytes:10};}});
   client={...native,index_receipts:index.receipts,measure_index:index.measure};return client;
  };
  let result,error;try{result=await dispatch_arm({config,task_id:slot.task_id,arm:slot.arm,signal,create_client,out:run,evidence_root:runs,source_out:join(root,'source',String(slot.sequence).padStart(2,'0')),persistence,admit_source:async()=>true,measure_index_tokens:(text,client)=>client.measure_index(text)});}catch(e){error=e;result=e.result;}
  if(!failSave){assert.deepEqual(JSON.parse(readFileSync(join(run,'result.json'))),result,'canonical result must exactly match durable result');const names=['started.json','result.json','completed.json','events.jsonl','state/glm-transport-ledger.json',...(slot.arm==='current-are'?[]:['state/driver-binding.json'])];entries[slot.sequence]={slot_id:slot.slot_id,transport_identity:client.identity,files:Object.fromEntries(names.map(n=>[n,hash(readFileSync(join(run,n)))]))};}
  if(error)throw error;return result;
 }});
 const sealed=store.seal(terminal),hydrated=verifyComparisonOutcomeSeal({root:outcomes,schedule,sources,expected_seal_sha256:sealed.seal_sha256});assert.deepEqual(hydrated.map(x=>x.result),terminal.outcomes);
 const manifest=createComparisonEvidenceManifest({schedule,sources,outcome_seal_sha256:sealed.seal_sha256,entries}),reconciliation=reconcileComparisonCampaignEvidence({outcome_root:outcomes,runs_root:runs,schedule,sources,manifest,expected_manifest_sha256:hash(stable(manifest))});
 if(process.env.ARE_FIXTURE_DEBUG)console.error(JSON.stringify({mode,modelCalls,outcomes:terminal.outcomes.filter(x=>x.attempted).map(x=>({status:x.status,error:x.error,result_error:x.result?.error,receipts:x.result?.receipts?.length}))}));
 return {terminal,sealed,reconciliation,modelCalls};
}
test('unknown model failure preserves canonical result through real runner, seal and accounting',async t=>{
 const f=await fixture(t,'unknown');assert.equal(f.terminal.status,'incomplete');assert.equal(f.terminal.outcomes.length,12);assert.ok(f.terminal.outcomes.some(x=>!x.attempted));assert.ok(f.modelCalls>0);assert.equal(f.sealed.seal.summary.accounting.raw_accounting_complete,false);assert.ok(f.sealed.seal.summary.accounting.conservative_total_tokens>=8000);
 for(const row of f.reconciliation.rows.filter(r=>r.attempted)){assert.equal(row.reconciled,false);assert.doesNotMatch(row.error??'',/outcome-result/);}
});
test('index-tokenizer failure retains known model spend without post-persistence decoration',async t=>{
 const f=await fixture(t,'index');assert.equal(f.terminal.status,'incomplete');assert.ok(f.sealed.seal.summary.accounting.known_token_lower_bound>0);assert.equal(f.sealed.seal.summary.accounting.provider_healthy,false);assert.ok(f.terminal.outcomes.some(o=>o.result?.index_tokenizer_receipts?.some(r=>r.failure_code)));
 for(const row of f.reconciliation.rows.filter(r=>r.attempted))assert.doesNotMatch(row.error??'',/outcome-result/);
});
test('healthy three-arm results still persist, seal and reconcile across twelve assignments',async t=>{
 const f=await fixture(t,'healthy');assert.equal(f.terminal.outcomes.length,12);assert.equal(f.terminal.status,'settled');assert.ok(f.terminal.outcomes.every(o=>o.result.status==='final_context_selected'));assert.ok(f.reconciliation.rows.every(r=>r.reconciled),JSON.stringify(f.reconciliation.rows.map(r=>r.error)));assert.equal(f.sealed.seal.summary.accounting.raw_accounting_complete,true);
});
test('real result persistence failure remains incomplete with retained paid-attempt evidence',async t=>{
 const f=await fixture(t,'unknown',{failSave:true});assert.equal(f.terminal.status,'incomplete');assert.equal(f.sealed.seal.summary.accounting.raw_accounting_complete,false);assert.ok(f.sealed.seal.summary.accounting.conservative_total_tokens>=8000);assert.ok(f.reconciliation.rows.some(r=>r.status==='missing-run-evidence'));
});

test('original dispatcher reproduces the persisted-result mismatch on the same real failure path',async t=>{
 const f=await fixture(t,'unknown',{dispatch_arm:oldDispatcher});
 assert.ok(f.terminal.outcomes.some(o=>o.error?.includes('canonical result must exactly match durable result')));
});
