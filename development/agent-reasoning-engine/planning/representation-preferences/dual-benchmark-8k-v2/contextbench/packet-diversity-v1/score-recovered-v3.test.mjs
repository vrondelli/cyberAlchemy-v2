import {createStageOutputGuard} from './stage-output-guard.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,truncateSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {hash} from './prepare.mjs';import {accountReceipts} from '../discovery-v1/run.mjs';
import {scoreRecovered,validateSeal,offeredPrediction,nativeMetrics} from './score-recovered-v3.mjs';
const metric=n=>({span_coverage:n,span_precision:n,span_f1:n,file_coverage:n,file_precision:n,file_f1:n});
function fixture(){
 const directory=mkdtempSync(join(tmpdir(),'packet-score-recovered-v3-')),output=directory+'-evaluation-recovered-v3',prefix=[{kind:'model',dispatched:true,status:200,input_tokens:30,output_tokens:10}],prefixUsage=accountReceipts(prefix);
 const jobs=Array.from({length:8},(_,i)=>({donor:{donor_id:'d'+i,donor_index:i,receipts:structuredClone(prefix),prefix_receipts_sha256:hash(prefix),prefix_usage:structuredClone(prefixUsage),snapshots:[],task:{instance_id:'t'+Math.floor(i/2),repo_url:'https://example.invalid/repo',base_commit:'a'.repeat(40)}},prepared:{pair:Object.fromEntries(['legacy','diversity'].map(v=>[v,{private:{bindings:[{path:v+'.js',base_spans:[{start_line:2,end_line:4}]}]}}]))},repoRoot:directory}));
 const scorerURL=new URL('./score-recovered-v3.mjs',import.meta.url),scorer=join(directory,'synthetic-scorer.py'),source_manifest=join(directory,'synthetic-manifest.json');writeFileSync(scorer,'# synthetic; never executed\n');writeFileSync(source_manifest,'{"synthetic":true}');const verified={freeze:{bindings:[scorerURL.pathname,scorer,source_manifest].map(path=>({path,sha256:hash(readFileSync(path))}))},freeze_sha256:'f'.repeat(64),jobs,config:{synthetic:true,scorer,source_manifest}};
 const exported={prediction:{synthetic:true},selection:{final_read_ids:['x']}};
 const slots=jobs.flatMap(j=>['legacy','diversity'].map(variant=>{const suffix={kind:'model',dispatched:true,status:200,input_tokens:100,output_tokens:20,reasoning_tokens:7};return {donor_id:j.donor.donor_id,variant,status:'completed',usage:accountReceipts([suffix]),unknown_usage:false,entered:true,admission:{output_reservation:2048,projected_upper_bound:2667},receipts:[...prefix,suffix],suffix_receipt_start:1,response_capture:{synthetic:true},native_export:structuredClone(exported),packet:j.prepared.pair[variant],captures:[]};}));
 const seal={schema:'are.packet-component-generation-seal/bounded-v3',terminal:true,status:'completed',transport_settled:true,source_integrity_verified:true,planned_slots:16,slots,freeze_sha256:verified.freeze_sha256,maximum_new_model_tokens:128000,maximum_pair_concurrency:2,completed_at:new Date().toISOString(),wrapper_error:null,health_errors:[],interruptions:[],historical_prefix_tokens:320};
 const update=()=>{const usage=accountReceipts([]);for(const k of ['prompt_tokens','completion_tokens','total_tokens','model_calls','unknown_usage_calls','conservative_total_tokens'])usage[k]=slots.reduce((n,s)=>n+s.usage[k],0);usage.unknown_usage=slots.some(s=>s.unknown_usage);seal.usage=usage;seal.logical_totals=Object.fromEntries(['legacy','diversity'].map(v=>[v,320+slots.filter(s=>s.variant===v).reduce((n,s)=>n+s.usage.total_tokens,0)]));writeFileSync(join(directory,'RECOVERED-GENERATION.json'),JSON.stringify(seal));};update();let calls=0;
 const reviewPath=join(directory,'analysis-review.json');writeFileSync(reviewPath,JSON.stringify({approved:true,scope:'packet-component-recovered-scoring-v3',source_bindings:[{path:scorerURL.pathname,sha256:hash(readFileSync(scorerURL))}]}));
 const options={hydrate:path=>({seal:JSON.parse(readFileSync(path)),recovery:{synthetic:true}}),verify:async()=>verified,checkStorage:()=>{},reconstruct:()=>structuredClone(exported),score:async(_config,_prediction,path)=>{calls++;return metric(path.endsWith('offered')?(path.includes('diversity')?.8:.5):.6);}};
 return {directory,output,reviewPath,seal,verified,slots,options,update,calls:()=>calls,cleanup:()=>{rmSync(directory,{recursive:true,force:true});rmSync(output,{recursive:true,force:true});}};
}

test('offered packet spans convert to native coordinates and malformed metrics reject',()=>{
 const f=fixture();try{const p=offeredPrediction(f.verified.jobs[0].donor,f.verified.jobs[0].prepared.pair.legacy);assert.deepEqual(p.traj_data.pred_spans,{'legacy.js':[{start:2,end:4}]});assert.throws(()=>nativeMetrics({native:{final:{span:{coverage:NaN,precision:1},file:{coverage:1,precision:1}}}}),/native-metrics/);}finally{f.cleanup();}
});
test('sealed complete component reconciles physical and logical costs with fixed denominator',async()=>{
 const f=fixture();try{const r=await scoreRecovered('synthetic-freeze',f.directory,f.reviewPath,f.options);assert.equal(r.status,'scored');assert.equal(r.classification,'supporting');assert.equal(r.outcomes.length,16);assert.equal(r.physical_new_tokens,1920);assert.equal(r.physical_historical_prefix_tokens,320);assert.equal(r.totals.legacy.logical_tokens,1280);assert.equal(r.totals.diversity.logical_tokens,1280);assert.equal(r.native_scorer_calls,32);assert.equal(f.calls(),32);assert.equal(r.campaign_goal_achieved,false);await assert.rejects(scoreRecovered('x',f.directory,f.reviewPath,f.options),/single-use/);}finally{f.cleanup();}
});
test('absent, old, active and unsettled seals reject before any scorer access',async()=>{
 for(const mode of ['absent','old','active','unsettled','unbound-scorer']){const f=fixture();try{
  if(mode==='unbound-scorer')writeFileSync(f.reviewPath,JSON.stringify({approved:true,scope:'packet-component-recovered-scoring-v3',source_bindings:[]}));if(mode==='absent')rmSync(join(f.directory,'RECOVERED-GENERATION.json'));if(mode==='old'){f.seal.schema='are.packet-component-generation-seal/v1';f.update();}if(mode==='active')writeFileSync(join(f.directory,'active.lock'),'active');if(mode==='unsettled'){f.seal.transport_settled=false;f.update();}
  await assert.rejects(scoreRecovered('x',f.directory,f.reviewPath,f.options));assert.equal(f.calls(),0);
 }finally{f.cleanup();}}
});
test('every accounting identity and fixed slot is checked before native scoring',async()=>{
 for(const mode of ['sum','suffix','prefix','slot','logical','window','detail','model-count','unknown-hidden']){const f=fixture();try{
  if(mode==='sum')f.seal.usage.total_tokens++;if(mode==='suffix')f.slots[0].usage.prompt_tokens++;if(mode==='prefix')f.slots[0].receipts[0].input_tokens++;if(mode==='slot')f.slots[0].variant='diversity';if(mode==='logical')f.seal.logical_totals.legacy++;if(mode==='window')f.slots[0].admission.projected_upper_bound=8001;if(mode==='detail')f.slots[0].receipts[1].reasoning_tokens=21;if(mode==='model-count')f.slots[0].receipts.push(structuredClone(f.slots[0].receipts[1]));if(mode==='unknown-hidden')f.slots[0].receipts[1].dispatched=false;
  writeFileSync(join(f.directory,'RECOVERED-GENERATION.json'),JSON.stringify(f.seal));await assert.rejects(scoreRecovered('x',f.directory,f.reviewPath,f.options));assert.equal(f.calls(),0);
 }finally{f.cleanup();}}
});
test('unknown entered dispatch and infrastructure retain fixed costs without native scoring',async()=>{
 for(const mode of ['unknown','infrastructure','wrapper']){const f=fixture();try{
  const s=f.slots[0];if(mode==='unknown'){s.status='failed';s.receipts=s.receipts.slice(0,1);s.usage={...accountReceipts([]),unknown_usage:true,unknown_usage_calls:1,conservative_total_tokens:8000};s.unknown_usage=true;}if(mode==='infrastructure'){s.status='infrastructure-failure';s.infrastructure_failure=true;}if(mode==='wrapper')f.seal.wrapper_error='failure';f.seal.status='completed-with-failures';f.update();
  const r=await scoreRecovered('x',f.directory,f.reviewPath,f.options);assert.equal(r.classification,'inconclusive');assert.equal(r.native_scorer_calls,0);assert.equal(r.outcomes.length,16);assert.equal(r.physical_new_tokens,mode==='unknown'?1800:1920);assert.equal(r.physical_new_conservative_tokens,mode==='unknown'?9800:1920);assert.equal(r.criteria.all_16_valid_accounted,false);
 }finally{f.cleanup();}}
});
test('ordinary invalid model selection remains zero quality and counterevidence',async()=>{
 const f=fixture();try{f.slots[0].status='invalid_terminal_selection';f.seal.status='completed-with-failures';f.update();const r=await scoreRecovered('x',f.directory,f.reviewPath,f.options);assert.equal(r.classification,'counterevidence');assert.equal(r.totals.legacy.valid,7);assert.equal(r.totals.legacy.mean_span_f1,7*.6/8);assert.equal(r.native_scorer_calls,31);}finally{f.cleanup();}
});
test('native evaluation failure seals partial results with all slots and unchanged total spend',async()=>{
 const f=fixture();try{let calls=0;const r=await scoreRecovered('x',f.directory,f.reviewPath,{...f.options,score:async()=>{if(++calls===4)throw Error('synthetic evaluator failure');return metric(.5);}});assert.equal(r.status,'failed');assert.equal(r.classification,'inconclusive');assert.equal(r.outcomes.length,16);assert.equal(r.outcomes.filter(x=>x.valid).length,1);assert.equal(r.outcomes.filter(x=>x.scoring_status==='blocked-infrastructure').length,14);assert.equal(r.physical_new_tokens,1920);assert.equal(r.native_scorer_calls,4);assert.equal(JSON.parse(readFileSync(join(f.output,'RESULTS.json'))).terminal,true);}finally{f.cleanup();}
});
test('post-score source drift cannot support and final persistence failure attaches full report',async()=>{
 for(const mode of ['drift','persistence']){const f=fixture();try{let verified=0;const options={...f.options};if(mode==='drift')options.verify=async()=>{if(++verified===2)throw Error('source drift');return f.verified;};else options.persist=(path,value)=>{if(path.endsWith('RESULTS.json'))throw Object.assign(Error('disk full'),{code:'ENOSPC'});writeFileSync(path,JSON.stringify(value));};
  if(mode==='drift'){const r=await scoreRecovered('x',f.directory,f.reviewPath,options);assert.equal(r.classification,'inconclusive');assert.equal(r.source_integrity_verified,false);}else await assert.rejects(scoreRecovered('x',f.directory,f.reviewPath,options),e=>e.persistence_failure&&e.report.outcomes.length===16&&e.report.physical_new_tokens===1920&&e.report.classification==='inconclusive'&&e.report.status==='failed');
 }finally{f.cleanup();}}
});

test('interruption and pre-import infrastructure failure preserve known zero slots',async()=>{
 const f=fixture();try{Object.assign(f.slots[0],{status:'infrastructure-failure',infrastructure_failure:true,entered:false,receipts:[],usage:accountReceipts([])});Object.assign(f.slots[1],{status:'not-started-interruption',entered:false,receipts:undefined,usage:accountReceipts([])});f.seal.status='interrupted';f.seal.interruptions=[{reason:'SIGINT'}];f.update();const r=await scoreRecovered('x',f.directory,f.reviewPath,f.options);assert.equal(r.classification,'inconclusive');assert.equal(r.physical_new_tokens,1680);assert.equal(r.outcomes.length,16);assert.equal(f.calls(),0);}finally{f.cleanup();}
});
test('checkpoint persistence and invalid native metrics stop scoring and seal failures',async()=>{
 for(const mode of ['checkpoint','metrics']){const f=fixture();try{const options={...f.options};if(mode==='checkpoint')options.persist=(path,value)=>{if(path.includes('/slot-'))throw Error('synthetic checkpoint failure');writeFileSync(path,JSON.stringify(value));};else options.score=async()=>({...metric(.5),span_f1:NaN});const r=await scoreRecovered('x',f.directory,f.reviewPath,options);assert.equal(r.classification,'inconclusive');assert.equal(r.status,'failed');assert.equal(r.outcomes.length,16);assert.equal(r.physical_new_tokens,1920);assert.equal(r.outcomes.filter(x=>x.valid).length,0);}finally{f.cleanup();}}
});

test('native evaluator and hash manifest must each have exact frozen bindings before scoring',async()=>{
 for(const key of ['scorer','source_manifest'])for(const mode of ['missing','drift']){const f=fixture();try{const path=f.verified.config[key];if(mode==='missing')f.verified.freeze.bindings=f.verified.freeze.bindings.filter(b=>b.path!==path);else writeFileSync(path,'synthetic drift');await assert.rejects(scoreRecovered('x',f.directory,f.reviewPath,f.options),/evaluator-freeze-binding/);assert.equal(f.calls(),0);}finally{f.cleanup();}}
});

test('evidence growth admission blocks scoring before any native evaluator call',async()=>{const f=fixture();try{await assert.rejects(scoreRecovered('synthetic',f.directory,f.reviewPath,{...f.options,checkStorage:(path,limits)=>{assert.equal(path,f.output);assert.equal(limits.growth_reservation_bytes,33554432);throw Error('growth-capacity');}}),/growth-capacity/);assert.equal(f.calls(),0);}finally{f.cleanup();}});

test('proven native predispatch guard failure reconciles zero spend and blocks evaluation',async()=>{
 const f=fixture();try{
  const r={kind:'model',dispatched:false,failure_code:'pre-dispatch-guard',input_tokens:0,output_tokens:0,response_bytes:0,status:null,provider_code:null};
  Object.assign(f.slots[0],{status:'failed',persistence_failure:true,receipts:[...f.verified.jobs[0].donor.receipts,r],usage:accountReceipts([r]),unknown_usage:false});
  f.seal.status='completed-with-failures';f.update();const result=await scoreRecovered('x',f.directory,f.reviewPath,f.options);
  assert.equal(result.classification,'inconclusive');assert.equal(result.physical_new_tokens,1800);assert.equal(result.physical_new_conservative_tokens,1800);assert.equal(f.calls(),0);
 }finally{f.cleanup();}
});

test('all thirty-two native scoring calls share one evaluator stage budget',async()=>{
 const f=fixture();let first,count=0;
 try{const result=await scoreRecovered('x',f.directory,f.reviewPath,{...f.options,score:async(config,prediction,path,budget)=>{
  if(!first)first=budget;assert.strictEqual(budget,first);assert.equal(budget.stage_root,f.output);assert.ok(budget.stage_guard&&budget.persistence);
  count++;return f.options.score(config,prediction,path);
 }});assert.equal(count,32);assert.equal(result.status,'scored');assert.ok(createStageOutputGuard({root:f.output}).snapshot().bytes<=32*1024*1024);
 }finally{f.cleanup();}
});
test('real evaluator ordinary quota rejection preserves sixteen outcomes and final result reserve',async()=>{
 const f=fixture();let count=0;
 try{const result=await scoreRecovered('x',f.directory,f.reviewPath,{...f.options,score:async(_config,_prediction,_path,budget)=>{
  if(++count===2){const path=join(budget.stage_root,'synthetic-competing-output');writeFileSync(path,'');truncateSync(path,24*1024*1024);}
  return metric(.5);
 }});assert.equal(result.status,'failed');assert.equal(result.classification,'inconclusive');assert.equal(count,2);
 assert.equal(result.outcomes.length,16);assert.equal(result.physical_new_tokens,1920);assert.equal(result.outcomes.filter(x=>x.valid).length,0);
 const saved=JSON.parse(readFileSync(join(f.output,'RESULTS.json')));assert.equal(saved.outcomes.length,16);assert.equal(saved.physical_new_tokens,1920);
 assert.ok(createStageOutputGuard({root:f.output}).snapshot().bytes<=32*1024*1024);
 }finally{f.cleanup();}
});

test('failed scorer report exposes only sanitized infrastructure diagnostics',async()=>{
 const f=fixture();try{const report=await scoreRecovered('x',f.directory,f.reviewPath,{...f.options,score:async()=>{throw Object.assign(Error('private reference'),{diagnostic:{phase:'score',code:'process-failed',exit_code:2,stderr_bytes:9,stdout_bytes:0,stderr_sha256:'a'.repeat(64),private_path:'secret'}});}});
 assert.equal(report.status,'failed');assert.deepEqual(report.outcomes[0].scoring_diagnostic,{phase:'score',code:'process-failed',exit_code:2,stderr_bytes:9,stdout_bytes:0,stderr_sha256:'a'.repeat(64)});
 assert.equal(JSON.stringify(report).includes('private reference'),false);assert.equal(JSON.stringify(report).includes('secret'),false);
 }finally{f.cleanup();}
});

test('reference hydration failure bars scoring; later drift invalidates all support',async()=>{
 for(const at of [1,2]){const f=fixture();let calls=0;try{
  const options={...f.options,hydrate:(...args)=>{if(++calls===at)throw Error('synthetic reference drift');return f.options.hydrate(...args);}};
  if(at===1){await assert.rejects(scoreRecovered('x',f.directory,f.reviewPath,options),/reference drift/);assert.equal(f.calls(),0);}
  else{const r=await scoreRecovered('x',f.directory,f.reviewPath,options);assert.equal(r.classification,'inconclusive');assert.equal(r.source_integrity_verified,false);assert.equal(r.physical_new_tokens,1920);}
 }finally{f.cleanup();}}
});
