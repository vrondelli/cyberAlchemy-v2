import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {buildComparisonSchedule,verifyComparisonSchedule} from './comparison-schedule.mjs';
import {scoreComparisonCampaign} from './score-comparison-compact-campaign.mjs';
const cohort_path=fileURLToPath(new URL('./RECOVERY-TRAJECTORY-COHORT-R1.json',import.meta.url));
const sources={cohort_path,cohort_sha256:createHash('sha256').update(readFileSync(cohort_path)).digest('hex'),config_path:fileURLToPath(new URL('./discovery-v1/live-config.json',import.meta.url))};
function fixture(t){
 const root=mkdtempSync(join(tmpdir(),'comparison-score-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const paths=Object.fromEntries(['outcome_root','runs_root','source_root','score_root'].map(k=>{const path=join(root,k);mkdirSync(path);return [k,path];}));
 const localSources={...sources,config_path:join(root,'config.json')};writeFileSync(localSources.config_path,readFileSync(sources.config_path));
 const schedule=buildComparisonSchedule(localSources),prepared=[],scored=[],verified=[];
 const rows=schedule.slots.map(s=>{const tokens=s.arm==='independent-investigations'?17000:20000;return {slot_id:s.slot_id,task_id:s.task_id,arm:s.arm,status:'reconciled',attempted:true,outcome_status:'returned',reconciled:true,raw_accounting:{known_token_lower_bound:tokens,conservative_total_tokens:tokens,raw_accounting_complete:true,provider_healthy:true},evidence:{ledger:{total_tokens:tokens,model_calls:4,evidence_consistent:true},windows:{measured_windows_verified:true,requests:Array.from({length:4},()=>({projected_tokens:7500}))}}};});
 const evidence={schedule_sha256:schedule.schedule_sha256,assigned_outcomes:12,rows};
 const args={...paths,schedule,sources:localSources,manifest:{entries:schedule.slots.map(()=>({})),outcome_seal_sha256:'a'.repeat(64)},expected_manifest_sha256:'b'.repeat(64),verify_settlement:async()=>true,admit_score:async()=>true};
 const deps={reconcile:()=>{verifyComparisonSchedule({schedule,...localSources});return structuredClone(evidence);},hydrate:()=>schedule.slots.map(s=>({result:{sequence:s.sequence}})),prepare:({slot,outcome})=>{assert.equal(slot.sequence,outcome.sequence);prepared.push(slot.sequence);return {prediction:{sequence:slot.sequence},verify:()=>{verified.push(slot.sequence);return true;}};},native_score:async({prediction})=>{assert.equal(prepared.length,12);scored.push(prediction.sequence);return {native:{final:{span:{coverage:1,precision:1},file:{coverage:1,precision:1}}}};}};
 return {args,deps,evidence,prepared,scored,verified};
}
test('all twelve predictions precede scoring; persistence and exact development gates',async t=>{
 const f=fixture(t),r=await scoreComparisonCampaign(f.args,f.deps);
 assert.equal(r.development_target_passed,true);assert.equal(r.benchmark_cleared,false);assert.equal(r.new_provider_calls,0);
 assert.equal(f.scored.length,12);assert.equal(f.verified.length,12);
 assert.deepEqual(JSON.parse(readFileSync(join(f.args.score_root,'RESULTS.json'))),r);
});
test('one reconstruction failure prevents every evaluator invocation',async t=>{
 const f=fixture(t),prepare=f.deps.prepare;f.deps.prepare=a=>{if(a.slot.sequence===4)throw Error('broken reconstruction');return prepare(a);};
 const r=await scoreComparisonCampaign(f.args,f.deps);assert.equal(f.scored.length,0);assert.equal(r.assigned_outcomes,12);assert.equal(r.native_outcomes[4].status,'prediction-preflight-failed');assert.equal(r.development_target_passed,false);
});
test('evaluator failure stops remaining scoring without dropping denominator or costs',async t=>{
 const f=fixture(t),score=f.deps.native_score;f.deps.native_score=async a=>{if(a.prediction.sequence===2)throw Error('evaluator failed');return score(a);};
 const r=await scoreComparisonCampaign(f.args,f.deps);assert.equal(f.scored.length,2);assert.equal(r.assigned_outcomes,12);assert.equal(r.native_outcomes[2].status,'native-evaluation-failed');assert.equal(r.totals['current-are'].known_tokens,80000);assert.equal(r.comparisons['current-are'].relative_token_reduction,null);
});
test('post-score source drift invalidates all provisional scores',async t=>{
 const f=fixture(t),prepare=f.deps.prepare;f.deps.prepare=a=>({...prepare(a),verify:()=>{throw Error('source drift');}});
 const r=await scoreComparisonCampaign(f.args,f.deps);assert.equal(f.scored.length,12);assert.equal(r.post_score_integrity_verified,false);assert.ok(r.native_outcomes.every(r=>!r.valid&&r.native===null&&r.unverified_native));assert.equal(r.development_target_passed,false);
});
test('unsettled process denies evaluation; post-score settlement loss denies success',async t=>{
 const f=fixture(t);f.args.verify_settlement=async()=>false;await assert.rejects(scoreComparisonCampaign(f.args,f.deps),/process-not-settled/);assert.equal(f.prepared.length,0);
 let calls=0;f.args.verify_settlement=async()=>++calls===1;const r=await scoreComparisonCampaign(f.args,f.deps);assert.equal(r.gates.outer_process_settled,false);assert.equal(r.development_target_passed,false);
});
test('storage denial and native error objects stop scoring',async t=>{
 const f=fixture(t);f.args.admit_score=async()=>false;const r=await scoreComparisonCampaign(f.args,f.deps);assert.equal(f.scored.length,0);assert.equal(r.native_outcomes[0].status,'native-evaluation-failed');
 const g=fixture(t),score=g.deps.native_score;g.deps.native_score=async a=>({...await score(a),native:{error:'invalid'}});const s=await scoreComparisonCampaign(g.args,g.deps);assert.equal(g.scored.length,1);assert.equal(s.development_target_passed,false);
});

test('actual config drift still persists twelve invalidated rows and generation costs',async t=>{
 const f=fixture(t),score=f.deps.native_score;f.deps.native_score=async a=>{const r=await score(a);if(a.prediction.sequence===11)writeFileSync(f.args.sources.config_path,'{}');return r;};
 const r=await scoreComparisonCampaign(f.args,f.deps);assert.equal(r.assigned_outcomes,12);assert.equal(r.post_score_integrity_verified,false);assert.equal(r.development_target_passed,false);assert.equal(r.totals['current-are'].known_tokens,80000);assert.ok(r.native_outcomes.every(r=>r.valid===false));assert.deepEqual(JSON.parse(readFileSync(join(f.args.score_root,'RESULTS.json'))),r);
});
