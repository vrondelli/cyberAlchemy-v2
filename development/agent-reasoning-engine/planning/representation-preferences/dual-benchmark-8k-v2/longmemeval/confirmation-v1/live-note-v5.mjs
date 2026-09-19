// Single-use full-S generation. No evaluator imports or automatic retries.
// Open questions: NOTE-V5-READINESS.md. Importing this module performs no effects.
import assert from 'node:assert/strict';
import {budgetWrite} from './output-budget.mjs';
const durableWrite=budgetWrite;
import {readFileSync,existsSync,mkdirSync,openSync,writeFileSync,fsyncSync,closeSync} from 'node:fs';
import {resolve,join,dirname,basename} from 'node:path';
import {pathToFileURL} from 'node:url';
import {sha,loadSourceManifest,IDS} from './adapter-note-v5.mjs';
import {generationPlan,runGeneration} from './runner-note-v5.mjs';
import {createProviders} from './provider-note-v5.mjs';
import {verifyResearchContinuity,verifyEvolutionRecord} from '../../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {guardStorage} from '../../storage-host-small-run.mjs';
const dir=import.meta.dirname,root=resolve(dir,'../../../../../../..'),read=p=>JSON.parse(readFileSync(p));
export const HOST_BINDING_PATH=resolve(dir,'../../storage-host-binding.json');
export function guard(growth_reservation_bytes=0){return guardStorage({binding:read(HOST_BINDING_PATH),output:dir,growth_reservation_bytes});}
export function verifyHostBindings(freeze){
 const binding=read(HOST_BINDING_PATH);
 for(const path of [join(dir,'OPERATING-RESERVE-AMENDMENT.md'),join(dir,'NOTE-V5-PROTOCOL.md'),HOST_BINDING_PATH,resolve(dir,'../../storage-host-small-run.mjs'),resolve(binding.provenance.path)]){const entry=freeze.bindings.find(b=>resolve(root,b.path)===path);assert.ok(entry,'explicit host binding: '+path);bound(entry);}
 assert.deepEqual(freeze.storage_policy,{host_binding:HOST_BINDING_PATH,minimum_host_bytes:1073741824,minimum_guest_bytes:8589934592,launch_growth_bytes:33554432,maximum_output_bytes:33554432,final_reserve_bytes:8388608});
}
export {budgetWrite as durableWrite};
export function bound(binding){assert.ok(binding&&typeof binding.path==='string'&&/^[a-f0-9]{64}$/.test(binding.sha256));const path=resolve(root,binding.path);assert.equal(sha(readFileSync(path)),binding.sha256,binding.path);return path;}
export function verifyFreeze(path){
 const freeze=read(path);assert.equal(freeze.schema,'are.full-s-live-freeze/note-v5');assert.equal(freeze.approved,true);
 for(const [key,value]of Object.entries({model:'glm-5.3-flash',context_limit:8000,workers:2,answer_slots:8,judge_token_budget:64000,tokenizer_calls:256,deadline_ms:7200000}))assert.equal(freeze[key],value,key);
 assert.ok(freeze.bindings.length);freeze.bindings.forEach(bound);verifyHostBindings(freeze);for(const n of ['output-budget.mjs','live-note-v5.mjs','score-note-v5.mjs','prepare-freeze-note-v5.mjs','runner-note-v5.mjs','adapter-note-v5.mjs','provider-note-v5.mjs','qualify-note-v5.mjs'])assert.ok(freeze.bindings.some(b=>resolve(root,b.path)===join(dir,n)),n);
 const referenceDirectory=resolve(root,freeze.reference_directory);assert.equal(dirname(referenceDirectory),join(dir,'evaluator'));assert.match(basename(referenceDirectory),/^reference-s-v[1-9][0-9]*$/);
 const review=read(bound(freeze.review));assert.ok(review.approved&&review.scope==='full-s-generation-note-v5');review.bindings.forEach(bound);assert.ok(review.bindings.some(b=>resolve(root,b.path)===join(dir,'live-note-v5.mjs')));
 const manifest=read(bound(freeze.source_manifest)),qualification=read(bound(freeze.qualification)),loaded=loadSourceManifest(manifest),plan=generationPlan(loaded.rows,qualification);
 assert.ok(plan.planned_model_calls<=248);assert.equal(plan.planned_model_calls,freeze.maximum_generation_calls);assert.equal(plan.token_budget,freeze.generation_token_budget);assert.equal(sha(plan),freeze.plan_sha256);
 const continuity=read(bound(freeze.continuity)),hypotheses=read(bound(freeze.hypotheses)),experiment=read(bound(freeze.experiment)),policy=read(resolve(root,continuity.policy_ref));assert.ok(verifyResearchContinuity({binding:continuity,hypotheses,policy,phase:'freeze',root}).ok);for(const r of [...hypotheses.records,experiment])assert.ok(verifyEvolutionRecord(r).ok);
 // Evaluator manifest contains hashes only. Do not load reference values here.
 bound(freeze.evaluator_binding);
 return {freeze,plan,manifest,qualification,freeze_sha256:sha(readFileSync(path))};
}
const zero=()=>({prompt_tokens:0,completion_tokens:0,total_tokens:0});
const valid=u=>Number.isSafeInteger(u?.prompt_tokens)&&u.prompt_tokens>=0&&Number.isSafeInteger(u?.completion_tokens)&&u.completion_tokens>=0&&u.total_tokens===u.prompt_tokens+u.completion_tokens;
export function interruptedResult(plan,events){
 const results=plan.pairs.map(pair=>{
  const completed=events.findLast(e=>e.kind==='pair-result'&&e.result.question_id===pair.question_id);if(completed)return completed.result;
  const calls=events.filter(e=>e.kind==='call-start'&&e.pair_sha256===pair.pair_sha256).map(start=>{
   const done=events.findLast(e=>e.kind==='call-result'&&e.id===start.id);if(done)return done;
   const records=events.filter(e=>e.channel==='model'&&e.id===start.id),receipt=records.at(-1),started=records.some(r=>r.dispatched===true),usage=valid(receipt?.usage)?receipt.usage:started?null:zero();
   return {...start,status:'interrupted',model_started:started,usage,unknown_usage:started&&!valid(usage),receipt:receipt??null};
  });const usage=zero();for(const c of calls)if(valid(c.usage))for(const k of Object.keys(usage))usage[k]+=c.usage[k];
  return {question_id:pair.question_id,status:'failed',answers:['control','treatment'].map(arm=>({arm,status:'blocked',text:null,reason:'wrapper-interrupted'})),calls,usage,unknown_usage:calls.some(c=>c.unknown_usage),held_tokens:calls.filter(c=>c.unknown_usage).reduce((n,c)=>n+c.reservation_tokens,0),persistence_failure:true};
 });const usage=zero();for(const r of results)for(const k of Object.keys(usage))usage[k]+=r.usage[k];return {schema:'are.full-s-generation-result/v1',status:'failed',planned_pairs:4,planned_answer_slots:8,maximum_pair_concurrency:2,results,usage,unknown_usage:results.some(r=>r.unknown_usage),held_tokens:results.reduce((n,r)=>n+r.held_tokens,0),model_generation_calls:results.reduce((n,r)=>n+r.calls.filter(c=>c.model_started).length,0),campaign_goal_achieved:false};
}
export async function executeLive(freezePath,name,{verify=verifyFreeze,checkStorage=guard,makeProviders=createProviders,run=runGeneration,output_root=dir}={}){
 assert.match(name,/^live-note-v5-r[1-9][0-9]*$/);const output=join(output_root,name);assert.ok(!existsSync(output),'single-use live directory');const verified=verify(freezePath);checkStorage(33554432);mkdirSync(output,{mode:0o700});
 const controller=new AbortController(),events=[],healthState={stopped:false,reason:null,reserved_tokens:0,token_budget:verified.plan.token_budget};let sequence=0,providers,result,failure=null,sourceIntegrity=true,settlement=null;
 const record=async event=>{const snapshot=structuredClone(event);events.push(snapshot);checkStorage();durableWrite(output,'event-'+String(++sequence).padStart(5,'0')+'.json',snapshot);};
 const abort=()=>controller.abort();process.once('SIGINT',abort);process.once('SIGTERM',abort);const timer=setTimeout(abort,verified.freeze.deadline_ms);
 try{
  durableWrite(output,'STARTED.json',{freeze_sha256:verified.freeze_sha256,at:new Date().toISOString(),planned_answer_slots:8,planned_model_calls:verified.plan.planned_model_calls});
  providers=makeProviders({credential:verified.freeze.credential_path,record,before:()=>{checkStorage();assert.ok(!healthState.stopped&&!controller.signal.aborted,'shared-health-stop');},maximum_calls:verified.plan.planned_model_calls});
  result=await run({plan:verified.plan,meter:providers.meter,generate:providers.generate,record,tokenizer_limits:{max_calls:256,timeout_ms:verified.freeze.deadline_ms},signal:controller.signal,health_state:healthState});
 }catch(error){failure=String(error.message);result=error.result??null;}
 finally{
  clearTimeout(timer);controller.abort();
  const settled=await Promise.allSettled([Promise.resolve().then(()=>providers?.meter.settle({timeout_ms:35000})),Promise.resolve().then(()=>providers?.generate.settle({timeout_ms:35000}))]);settlement=settled.map(s=>s.status==='fulfilled'?s.value:{settled:false,reason:'settlement-rejected'}).filter(Boolean);process.removeListener('SIGINT',abort);process.removeListener('SIGTERM',abort);
 }
 result??=interruptedResult(verified.plan,events);
 try{verify(freezePath);}catch(error){sourceIntegrity=false;failure??=String(error.message);}
 const seal={schema:'are.full-s-generation-seal/v1',terminal:true,status:!sourceIntegrity||!settlement.every(s=>s.settled)||failure?'failed':result.status,result,source_integrity_verified:sourceIntegrity,transport_settled:settlement.every(s=>s.settled),settlement,freeze_sha256:verified.freeze_sha256,wrapper_error:failure,completed_at:new Date().toISOString(),campaign_goal_achieved:false};
 try{durableWrite(output,'GENERATION-SEAL.json',seal);}catch(error){throw Object.assign(error,{generation_seal:seal,persistence_failure:true});}return seal;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const seal=await executeLive(process.argv[2],process.argv[3]);console.log(JSON.stringify({status:seal.result.status,usage:seal.result.usage,unknown_usage:seal.result.unknown_usage,held_tokens:seal.result.held_tokens,model_calls:seal.result.model_generation_calls,source_integrity_verified:seal.source_integrity_verified,transport_settled:seal.transport_settled}));}
