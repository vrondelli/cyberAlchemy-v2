import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,existsSync} from 'node:fs';import {join,resolve,dirname} from 'node:path';import {tmpdir} from 'node:os';import {createHash} from 'node:crypto';
import {buildComparisonSchedule} from './comparison-schedule.mjs';import {verifyComparisonProductionFreeze,qualifyComparisonProduction,COMPARISON_GROWTH_BYTES} from './comparison-compact-production-base.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {runComparisonProduction,verifyComparisonProductionR2Freeze} from './comparison-compact-production.mjs';
import {createComparisonGenerationProcess} from './comparison-compact-generation-process.mjs';
const dir=import.meta.dirname,hash=x=>createHash('sha256').update(x).digest('hex');
function fixture(t){
 const root=mkdtempSync(join(tmpdir(),'comparison-production-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const sources={config_path:join(dir,'discovery-v1/live-config.json'),cohort_path:join(dir,'RECOVERY-TRAJECTORY-COHORT-R1.json')};sources.cohort_sha256=hash(readFileSync(sources.cohort_path));const schedule=buildComparisonSchedule(sources);
 const request={schedule,sources,binding:JSON.parse(readFileSync(join(dir,'../storage-host-binding.json'))),credential_path:join(root,'credential.json'),...Object.fromEntries(['outcome_root','runs_root','metadata_root','source_root'].map(k=>[k,join(root,k)]))};writeFileSync(request.credential_path,'{}');
 const rows=schedule.slots.map(slot=>{const prompt_path=join(root,slot.sequence+'.json'),prompt=stable({model:'glm-5.3-flash',messages:[{role:'user',content:'Synthetic qualification fixture'}],tools:[]});writeFileSync(prompt_path,prompt);return {slot_id:slot.slot_id,task_sha256:slot.task_sha256,cell_sha256:slot.cell_sha256,prompt_path,prompt_sha256:hash(prompt),projected_tokens:20+slot.cell.provider_profile.token_margin+slot.cell.limits.output_cap,receipt:{kind:'tokenizer',dispatched:true,status:200,input_tokens:20,request_sha256:hash(prompt)}};});
 const evidence={amendment:join(dir,'COMPARISON-REPAIR-AMENDMENT-R1.json'),capacity:join(dir,'COMPARISON-CAPACITY-QUALIFICATION-R1.json'),request_qualification:join(root,'requests.json')};writeFileSync(evidence.request_qualification,stable({schema:'are.comparison-request-qualification/v1',qualified:true,model_calls:0,schedule_sha256:schedule.schedule_sha256,rows}));
 const files=new Map();function add(p){p=resolve(p);if(files.has(p))return;const b=readFileSync(p);files.set(p,{path:p,sha256:hash(b)});if(p.endsWith('.mjs'))for(const spec of new vm.SourceTextModule(b.toString(),{identifier:p}).dependencySpecifiers)if(!spec.startsWith('node:'))add(resolve(dirname(p),spec));}
 for(const p of ['run-comparison-compact-production.mjs','comparison-compact-production.mjs','comparison-compact-production-stage-worker.mjs','comparison-compact-production-base.mjs','comparison-compact-generation-worker.mjs','packet-diversity-v1/score-native-bounded-v3.py'])add(join(dir,p));
 const config=JSON.parse(readFileSync(sources.config_path));for(const p of [...Object.values(sources).filter(x=>x.includes('/')),...Object.values(evidence),request.credential_path,config.scorer,config.source_manifest,...schedule.slots.map(s=>s.task_path),...rows.map(r=>r.prompt_path)])add(p);
 const freeze={schema:'are.comparison-production-freeze/v1',files:[...files.values()],request,evidence,score_root:join(root,'score'),supervision_root:join(root,'supervision'),generation_deadline_ms:9000000,combined_growth_bytes:COMPARISON_GROWTH_BYTES};
 const args={manifest_path:join(root,'freeze.json'),manifest_sha256:''};const save=()=>{writeFileSync(args.manifest_path,stable(freeze));args.manifest_sha256=hash(readFileSync(args.manifest_path));};save();
 const calls=[],deps={host_guard:a=>{calls.push(['storage',a.growth_reservation_bytes]);return {admitted:true};},verify_source:t=>{calls.push(['source',t.id]);return true;},verify_credential:p=>{calls.push(['credential',p]);}};
 return {root,freeze,args,save,calls,deps};
}
test('exact freeze and all twelve qualification rows validate without provider calls',t=>{
 const f=fixture(t),r=qualifyComparisonProduction(f.args,f.deps);assert.equal(r.admitted,true);assert.equal(r.windows.requests,12);assert.equal(r.new_provider_calls,0);assert.equal(f.calls.filter(c=>c[0]==='source').length,4);assert.equal(f.calls.filter(c=>c[0]==='storage').length,6);assert.ok(f.calls.filter(c=>c[0]==='storage').every(c=>c[1]===2583691264));
});
test('source drift and omitted transitive dependency reject',t=>{
 const f=fixture(t);writeFileSync(join(f.root,'0.json'),'{}');assert.throws(()=>verifyComparisonProductionFreeze(f.args),/source-drift/);
 const g=fixture(t);g.freeze.files=g.freeze.files.filter(b=>!b.path.endsWith('/comparison-accounting.mjs'));g.save();assert.throws(()=>verifyComparisonProductionFreeze(g.args),/unbound-static-dependency/);
});
test('reordered or oversized qualification cannot pass a newly hashed freeze',t=>{
 for(const mode of ['order','window','model']){const f=fixture(t),p=f.freeze.evidence.request_qualification,q=JSON.parse(readFileSync(p));if(mode==='order')q.rows.reverse();if(mode==='window')q.rows[0].receipt.input_tokens=8001;if(mode==='model')q.model_calls=1;writeFileSync(p,stable(q));f.freeze.files.find(b=>b.path===p).sha256=hash(readFileSync(p));f.save();assert.throws(()=>qualifyComparisonProduction(f.args,f.deps),/qualification-slot|initial-request-window|request-qualification/);}
});
test('source and current storage failures prevent admission',t=>{
 const f=fixture(t);assert.throws(()=>qualifyComparisonProduction(f.args,{...f.deps,verify_source:()=>false}),/source-qualification/);assert.throws(()=>qualifyComparisonProduction(f.args,{...f.deps,host_guard:()=>({admitted:false})}),/current-storage/);
});
test('review must explicitly admit the exact freeze before launch or directory creation',async t=>{
 const f=fixture(t),review_path=join(f.root,'review.json');writeFileSync(review_path,stable({approved:true,live_execution_admitted:false,manifest_sha256:f.args.manifest_sha256}));let calls=0;
 await assert.rejects(runComparisonProduction({...f.args,review_path,signal:new AbortController().signal},{qualify:()=>{calls++;},launch:()=>{calls++;}}),/exact-live-review/);assert.equal(calls,0);assert.equal(existsSync(f.freeze.score_root),false);
 writeFileSync(review_path,stable({approved:true,live_execution_admitted:true,manifest_sha256:'0'.repeat(64)}));await assert.rejects(runComparisonProduction({...f.args,review_path,signal:new AbortController().signal}),/exact-live-review/);
});
test('accepted review requalifies immutable request at launcher boundary',async t=>{
 const f=fixture(t),review_path=join(f.root,'review.json');writeFileSync(review_path,stable({approved:true,live_execution_admitted:true,manifest_sha256:f.args.manifest_sha256}));let calls=0;
 const r=await runComparisonProduction({...f.args,review_path,signal:new AbortController().signal},{qualify:args=>{calls++;return qualifyComparisonProduction(args,f.deps);},launch:async args=>{assert.equal(existsSync(args.request.source_root),false);assert.equal((await args.qualify({request:args.request})).admitted,true);return {fixture:true};}});assert.equal(calls,2);assert.deepEqual(r,{fixture:true});
});
test('source drift after generation cannot skip settlement or enter scoring',async t=>{
 const f=fixture(t),review_path=join(f.root,'review.json');writeFileSync(review_path,stable({approved:true,live_execution_admitted:true,manifest_sha256:f.args.manifest_sha256}));const calls=[];
 await runComparisonProduction({...f.args,review_path,signal:new AbortController().signal},{qualify:()=>({admitted:true}),create_process:()=>({generate:async()=>{calls.push('generate');return {fixture:true};},settle:async()=>{calls.push('settle');return {local_settled:true};}}),evaluate:async()=>{calls.push('evaluate');},launch:async(_args,deps)=>{const terminal=await deps.process_adapter.generate({});writeFileSync(join(f.root,'0.json'),'changed');await assert.rejects(deps.process_adapter.settle({terminal}),/source-drift/);await assert.rejects(deps.score({}),/source-drift/);return null;}});
 assert.deepEqual(calls,['generate','settle']);
});

test('asynchronous qualification failure is awaited before any output directory',async t=>{
 const f=fixture(t),review_path=join(f.root,'review.json');writeFileSync(review_path,stable({approved:true,live_execution_admitted:true,manifest_sha256:f.args.manifest_sha256}));
 await assert.rejects(runComparisonProduction({...f.args,review_path,signal:new AbortController().signal},{qualify:async()=>{await new Promise(r=>setTimeout(r,5));throw Error('async preflight denied');}}),/async preflight denied/);
 assert.equal(existsSync(f.freeze.score_root),false);
});
test('parent post-score settlement rejection cannot return evaluator success',async t=>{
 const f=fixture(t),review_path=join(f.root,'review.json');writeFileSync(review_path,stable({approved:true,live_execution_admitted:true,manifest_sha256:f.args.manifest_sha256}));let checks=0,evaluations=0;
 await runComparisonProduction({...f.args,review_path,signal:new AbortController().signal},{qualify:async()=>({admitted:true}),evaluate:async()=>{evaluations++;return {development_target_passed:true};},launch:async(_args,deps)=>{
  await assert.rejects(deps.score({expected_manifest_sha256:'fixture',verify_settlement:async()=>++checks===1}),/parent-post-score-settlement/);return null;
 }});
 assert.equal(checks,2);assert.equal(evaluations,1);
});

test('production closure binds compact CLI, workers, arms, factory, transport and scorer',t=>{
 const f=fixture(t),bound=new Set(verifyComparisonProductionR2Freeze(f.args).files.map(b=>b.path));
 for(const name of ['run-comparison-compact-production.mjs','comparison-compact-generation-worker.mjs','comparison-compact-production-stage-worker.mjs','comparison-compact-campaign-runner.mjs','comparison-compact-arm.mjs','comparison-compact-live-client.mjs','packet-diversity-v1/live-client-bounded-v4.mjs','packet-diversity-v1/transport-bounded-v4.mjs','score-comparison-compact-campaign.mjs','comparison-compact-prediction.mjs']){
  assert.ok(bound.has(join(dir,name)),name);
 }
});
test('omitting actual CLI or a dynamic worker invalidates the compact freeze',t=>{
 for(const name of ['run-comparison-compact-production.mjs','comparison-compact-generation-worker.mjs','comparison-compact-production-stage-worker.mjs']){
  const f=fixture(t);f.freeze.files=f.freeze.files.filter(b=>b.path!==join(dir,name));f.save();
  assert.throws(()=>verifyComparisonProductionR2Freeze(f.args),/required-binding|stage-binding/);
 }
});
test('actual default generation worker fails invalid schedule and settles without provider access',async()=>{
 const process=createComparisonGenerationProcess({kill_grace_ms:1000});
 await assert.rejects(process.generate({request:{},signal:new AbortController().signal}));
 const settled=await process.settle({terminal:null});
 assert.equal(settled.local_settled,true);assert.equal(settled.process_group_absent,true);assert.equal(settled.exit_code,2);
});
