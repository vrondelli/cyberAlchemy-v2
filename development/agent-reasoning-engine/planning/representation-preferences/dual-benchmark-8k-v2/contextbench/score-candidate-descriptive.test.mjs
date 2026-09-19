import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {buildCandidateOnlySchedule as buildComparisonSchedule,verifyCandidateOnlySchedule as verifyComparisonSchedule} from './candidate-only-schedule.mjs';
import {scoreDescriptiveComparison} from './score-candidate-descriptive.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const digest=x=>createHash('sha256').update(stable(x)).digest('hex');
const cohort_path=fileURLToPath(new URL('./RECOVERY-TRAJECTORY-COHORT-R1.json',import.meta.url));
const sources={cohort_path,cohort_sha256:createHash('sha256').update(readFileSync(cohort_path)).digest('hex'),config_path:fileURLToPath(new URL('./discovery-v1/live-config.json',import.meta.url))};
function fixture(t){
 const root=mkdtempSync(join(tmpdir(),'comparison-score-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const paths=Object.fromEntries(['outcome_root','runs_root','source_root','score_root'].map(k=>{const path=join(root,k);mkdirSync(path);return [k,path];}));
 const localSources={...sources,config_path:join(root,'config.json')};writeFileSync(localSources.config_path,readFileSync(sources.config_path));
 const schedule=buildComparisonSchedule({...localSources,candidates:['independent-investigations']}),prepared=[],scored=[],verified=[];
 const rows=schedule.slots.map(s=>{const tokens=s.arm==='independent-investigations'?17000:20000;return {slot_id:s.slot_id,task_id:s.task_id,arm:s.arm,status:'reconciled',attempted:true,outcome_status:'returned',reconciled:true,raw_accounting:{known_token_lower_bound:tokens,conservative_total_tokens:tokens,raw_accounting_complete:true,provider_healthy:true},evidence:{ledger:{total_tokens:tokens,model_calls:4,evidence_consistent:true},windows:{measured_windows_verified:true,requests:Array.from({length:4},()=>({projected_tokens:7500}))}}};});
 const evidence={schedule_sha256:schedule.schedule_sha256,assigned_outcomes:4,rows};
 const args={...paths,schedule,sources:localSources,manifest:{entries:schedule.slots.map(()=>({})),outcome_seal_sha256:'a'.repeat(64)},expected_manifest_sha256:'b'.repeat(64),verify_settlement:async()=>true,admit_score:async()=>true};
 const deps={reconcile:()=>{verifyComparisonSchedule({schedule,...localSources});return structuredClone(evidence);},hydrate:()=>schedule.slots.map(s=>({result:{sequence:s.sequence}})),prepare:({slot,outcome})=>{assert.equal(slot.sequence,outcome.sequence);prepared.push(slot.sequence);return {prediction:{sequence:slot.sequence},verify:()=>{verified.push(slot.sequence);return true;}};},native_score:async({prediction})=>{assert.equal(prepared.length,2);scored.push(prediction.sequence);return {native:{final:{span:{coverage:1,precision:1},file:{coverage:1,precision:1}}}};}};
 args.verify_audit=async()=>true;
 const seal=deps.hydrate();
 args.diagnostic_contract={schema:'are.candidate-descriptive-contract/v1',eligible_sequences:[1,2],reconciliation_sha256:digest(evidence),sealed_outcomes_sha256:digest(seal)};
 return {args,deps,evidence,prepared,scored,verified};

}
test('scores only selected survivors while retaining four rows and every cost; cannot pass campaign',async t=>{
 const f=fixture(t),r=await scoreDescriptiveComparison(f.args,f.deps);
 assert.deepEqual(f.scored,[1,2]);assert.deepEqual(f.verified,[1,2]);
 assert.equal(r.assigned_outcomes,4);assert.equal(r.reconciliation.rows.length,4);
 assert.deepEqual(r.reconciliation,f.evidence);
 assert.equal(r.development_target_passed,false);assert.equal(r.benchmark_cleared,false);
 assert.equal(r.accepted_relative_token_reduction,null);
 assert.deepEqual(JSON.parse(readFileSync(join(f.args.score_root,'RESULTS.json'))),r);
});
test('selected corrupt prediction prevents all evaluator calls',async t=>{
 const f=fixture(t),prepare=f.deps.prepare;f.deps.prepare=a=>{if(a.slot.sequence===2)throw Error('bad receipt');return prepare(a);};
 const r=await scoreDescriptiveComparison(f.args,f.deps);
 assert.deepEqual(f.scored,[]);assert.equal(r.native_outcomes[2].status,'prediction-preflight-failed');
});
test('unreviewed changes in excluded rows or unknown costs prevent evaluation',async t=>{
 const f=fixture(t);f.evidence.rows[3].raw_accounting.conservative_total_tokens+=8000;
 await assert.rejects(scoreDescriptiveComparison(f.args,f.deps),/audited-evidence-mismatch/);assert.deepEqual(f.scored,[]);
});
test('explicitly audited unknown usage remains visible without invalidating unrelated descriptive quality',async t=>{
 const f=fixture(t);f.evidence.rows[3].reconciled=false;
 f.evidence.rows[3].raw_accounting={known_token_lower_bound:10,conservative_total_tokens:8010,raw_accounting_complete:false,provider_healthy:false};
 f.args.diagnostic_contract.reconciliation_sha256=digest(f.evidence);
 const r=await scoreDescriptiveComparison(f.args,f.deps);
 assert.deepEqual(f.scored,[1,2]);assert.equal(r.reconciliation.rows[3].reconciled,false);
 assert.equal(r.reconciliation.rows[3].raw_accounting.conservative_total_tokens,8010);
 assert.equal(r.accepted_relative_token_reduction,null);
});
test('post-score evidence drift invalidates every score',async t=>{
 const f=fixture(t);let n=0;f.args.verify_audit=async()=>++n===1;
 const r=await scoreDescriptiveComparison(f.args,f.deps);
 assert.equal(r.post_score_integrity_verified,false);
 assert.ok(r.native_outcomes.every(x=>x.native===null&&!x.valid));
});
test('native failure stops remaining evaluation',async t=>{
 const f=fixture(t);f.deps.native_score=async()=>{throw Error('evaluator failed');};
 const r=await scoreDescriptiveComparison(f.args,f.deps);
 assert.equal(r.native_outcomes[1].status,'native-evaluation-failed');
 assert.equal(r.native_outcomes[2].status,'not-scored-after-failure');
});
test('storage denial, absent audit and unsettled workers prevent evaluator calls',async t=>{
 for(const kind of ['storage','audit','settlement']){
 const f=fixture(t);
 if(kind==='storage'){f.args.admit_score=async()=>false;await scoreDescriptiveComparison(f.args,f.deps);}
 if(kind==='audit'){f.args.verify_audit=async()=>false;await assert.rejects(scoreDescriptiveComparison(f.args,f.deps),/audit-not-verified/);}
 if(kind==='settlement'){f.args.verify_settlement=async()=>false;await assert.rejects(scoreDescriptiveComparison(f.args,f.deps),/process-not-settled/);}
 assert.deepEqual(f.scored,[]);
 }
});
test('on-disk config drift invalidates provisional metrics',async t=>{
 const f=fixture(t),score=f.deps.native_score;
 f.deps.native_score=async a=>{const r=await score(a);writeFileSync(f.args.sources.config_path,'{}');return r;};
 const r=await scoreDescriptiveComparison(f.args,f.deps);assert.equal(r.post_score_integrity_verified,false);
 assert.ok(r.native_outcomes.every(x=>!x.valid&&x.native===null));
});
