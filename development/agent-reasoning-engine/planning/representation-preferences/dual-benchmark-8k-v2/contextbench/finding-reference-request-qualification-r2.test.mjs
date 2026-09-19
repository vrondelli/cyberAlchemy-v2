import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {runComparisonArm} from './finding-reference-arm-r2.mjs';
import {buildCandidateOnlySchedule as buildComparisonSchedule} from './candidate-only-schedule.mjs';import {qualifyComparisonRequests} from './finding-reference-request-qualification-r2.mjs';import {createComparisonGenerationStorage} from './candidate-only-generation-storage.mjs';import {createStatelessRecyclingTransport} from './packet-diversity-v1/context-recycling-bounded-v3.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
function fixture(t,{tokens=200,modelWitness=false}={}){
 const root=mkdtempSync(join(tmpdir(),'comparison-requests-'));t.after(()=>rmSync(root,{recursive:true,force:true}));const cache=join(root,'cache');mkdirSync(cache);
 const git=args=>execFileSync('git',args,{cwd:cache,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();git(['init','-q']);writeFileSync(join(cache,'fixture.js'),'export const value = 1;\n');git(['add','.']);git(['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','fixture']);const commit=git(['rev-parse','HEAD']),url='https://example.invalid/fixture.git';git(['remote','add','origin',url]);
 const config=JSON.parse(readFileSync(new URL('./discovery-v1/live-config.json',import.meta.url)));
 config.tasks=config.tasks.map((old,i)=>{const task={instance_id:'fixture-'+i,original_inst_id:'fixture-'+i,repo:'fixture',repo_url:url,language:'javascript',base_commit:commit,problem_statement:'Investigate fixture behavior '+i,source:'synthetic'},path=join(root,'task-'+i+'.json');writeFileSync(path,stable(task));return {...old,cell_template:{...old.cell_template,instance_id:task.instance_id},instance_id:task.instance_id,task_path:path,task_sha256:hash(readFileSync(path)),base_commit:commit,repository_cache:cache};});
 const config_path=join(root,'config.json'),cohort_path=join(root,'cohort.json');writeFileSync(config_path,stable(config));const cohort={source_config_sha256:hash(readFileSync(config_path)),cohort:config.tasks.map(t=>({task_id:t.id,instance_id:t.instance_id,task_path:t.task_path,task_sha256:t.task_sha256,base_commit:t.base_commit}))};writeFileSync(cohort_path,stable(cohort));const sources={config_path,cohort_path,cohort_sha256:hash(readFileSync(cohort_path))},schedule=buildComparisonSchedule({...sources,candidates:['independent-investigations']});
 const roots=Object.fromEntries(['outcome_root','runs_root','metadata_root'].map(k=>{const p=join(root,k);mkdirSync(p);return [k,p];}));let modelDispatches=0,clients=0;
 const request={...roots,source_root:join(root,'sources'),sources,schedule,binding:{},credential_path:'unused-fixture',signal:new AbortController().signal};
 const deps={create_storage:r=>createComparisonGenerationStorage(r,{host_guard:()=>({admitted:true})}),create_factory:()=>({create_client:({cell})=>{clients++;const receipts=[];const transport=createStatelessRecyclingTransport({adapter_id:'qualification-fixture',source_ref:'qualification-fixture',maximum_output_tokens:cell.limits.output_cap,measure_request:async({prompt})=>{const wire=JSON.parse(prompt);receipts.push({kind:'tokenizer',dispatched:true,status:200,automatic_retries:0,input_tokens:tokens,request_sha256:hash(stable({model:'glm-5.3-flash',messages:wire.messages,tools:wire.tools}))});if(modelWitness)receipts.push({kind:'model',dispatched:true,status:200,input_tokens:1,output_tokens:1});return tokens+cell.provider_profile.token_margin;},request_once:async()=>{modelDispatches++;throw Error('forbidden fixture model invocation');}});return {model:'glm-5.3-flash',measureEnvelope:async()=>tokens+cell.provider_profile.token_margin+cell.limits.output_cap+2,transport,receipts,index_receipts:[],bindRunLedger:()=>{}};},measure_index_tokens:async()=>0})};
 return {request,deps,counts:()=>({modelDispatches,clients})};
}
test('actual candidate prepared runners qualify four initial renders without model dispatch',async t=>{
 const f=fixture(t),r=await qualifyComparisonRequests(f.request,f.deps);assert.equal(r.qualified,true,JSON.stringify(r.rows));assert.equal(r.rows.length,4);assert.equal(r.model_calls,0);assert.deepEqual(f.counts(),{modelDispatches:0,clients:4});assert.ok(r.rows.every(x=>x.status==='qualified'&&x.projected_tokens<=8000));assert.deepEqual(JSON.parse(readFileSync(join(f.request.metadata_root,'RESULTS.json'))),r);
});
test('oversized tokenizer request leaves fixed denominator and stops further starts',async t=>{
 const f=fixture(t,{tokens:8001}),r=await qualifyComparisonRequests(f.request,f.deps);assert.equal(r.qualified,false);assert.equal(r.rows.length,4);assert.equal(f.counts().modelDispatches,0);assert.ok(f.counts().clients<=2);assert.ok(r.rows.some(r=>r.status==='failed'));
});
test('any model receipt rejects tokenizer-only qualification',async t=>{
 const f=fixture(t,{modelWitness:true}),r=await qualifyComparisonRequests(f.request,f.deps);assert.equal(r.qualified,false);assert.ok(r.model_calls>0);assert.equal(f.counts().modelDispatches,0);assert.ok(r.rows.some(r=>r.error?.includes('model-call-forbidden')));
});

test('a successful measurement cannot hide an unrelated episode failure',async t=>{
 const f=fixture(t);f.deps.execute=async args=>({...await runComparisonArm(args),status:'orchestration_error',error:'fixture persistence failure'});
 const r=await qualifyComparisonRequests(f.request,f.deps);assert.equal(r.qualified,false);assert.equal(f.counts().modelDispatches,0);assert.ok(r.rows.some(r=>r.error?.includes('expected-disabled-stop')));
});

test('explicit infrastructure, persistence and health failures override intentional stop',async t=>{
 for(const flags of [
  {infrastructure_failure:{persistence_failure:true}},
  {persistence_failure:true},{persistence_failures:['disk failure']},
  {provider_healthy:false},{provider_health:{healthy:false}},
  {accounting_requires_reconciliation:true},{unknown_usage:true},
  {phase_state:{unknown_calls:1}},
 ]){
  const f=fixture(t);f.deps.execute=async args=>({...await runComparisonArm(args),...flags});
  const r=await qualifyComparisonRequests(f.request,f.deps);
  assert.equal(r.qualified,false,JSON.stringify(flags));assert.equal(r.rows.length,4);
  assert.ok(r.rows.some(x=>x.status==='failed'&&x.receipts.length>0));assert.equal(f.counts().modelDispatches,0);
 }
});
test('failed auxiliary provider receipt cannot hide behind successful initial tokenizer',async t=>{
 const f=fixture(t);f.deps.execute=async args=>({...await runComparisonArm(args),index_tokenizer_receipts:[{kind:'index-tokenizer',dispatched:true,status:503}]});
 const r=await qualifyComparisonRequests(f.request,f.deps);assert.equal(r.qualified,false);assert.ok(r.rows.some(x=>x.error?.includes('provider-attempt-failure')));
});
test('final persistence failure carries complete measured rows as explicitly incomplete evidence',async t=>{
 const f=fixture(t),create=f.deps.create_storage;
 f.deps.create_storage=args=>{const storage=create(args),write=storage.metadata_persistence.writeJson;
  return {...storage,metadata_persistence:{...storage.metadata_persistence,writeJson:(path,value,options)=>{
   if(path===join(f.request.metadata_root,'RESULTS.json'))throw Error('fixture final disk failure');
   return write(path,value,options);
  }}};
 };
 await assert.rejects(qualifyComparisonRequests(f.request,f.deps),error=>{
  assert.equal(error.result.qualified,false);assert.equal(error.result.status,'incomplete');
  assert.equal(error.result.rows.length,4);assert.ok(error.result.rows.every(x=>x.receipt.status===200));
  assert.equal(error.result.model_calls,0);assert.match(error.result.persistence_failure,/fixture final disk failure/);return true;
 });
 assert.deepEqual(f.counts(),{clients:4,modelDispatches:0});
});

test('model witnesses in each result receipt family deny qualification and remain visible',async t=>{
 for(const key of ['receipts','index_tokenizer_receipts']){
  const f=fixture(t),witness={kind:'model',dispatched:true,status:200,automatic_retries:0,input_tokens:100,output_tokens:20};
  f.deps.execute=async args=>{const result=await runComparisonArm(args);return {...result,[key]:[...(result[key]??[]),witness]};};
  const r=await qualifyComparisonRequests(f.request,f.deps);
  assert.equal(r.qualified,false);assert.ok(r.model_calls>0);assert.equal(f.counts().modelDispatches,0);
  const row=r.rows.find(x=>x.error?.includes('model-call-forbidden'));assert.ok(row);
  assert.ok(Object.values(row.receipt_families).some(rs=>rs.some(x=>x.kind==='model'&&x.input_tokens===100)));
 }
});
