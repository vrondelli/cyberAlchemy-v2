// Companion binding over sealed outcomes and per-run evidence. Open questions: COMPARISON-EVIDENCE-MANIFEST-R2.md.
import assert from 'node:assert/strict';
import {readFileSync,realpathSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {verifyComparisonSchedule} from './comparison-schedule.mjs';
import {verifyComparisonOutcomeSeal} from './comparison-outcome-store.mjs';
import {reconcileComparisonRunFiles} from './comparison-run-files-r2.mjs';
import {accountComparisonOutcome} from './comparison-accounting.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(typeof x==='string'||Buffer.isBuffer(x)?x:stable(x)).digest('hex');
const need=(v,m)=>{if(!v)throw Error('comparison-evidence.'+m);};
const sha=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
export function createComparisonEvidenceManifest({schedule,sources,outcome_seal_sha256,entries}){
 verifyComparisonSchedule({schedule,...sources});need(sha(outcome_seal_sha256)&&Array.isArray(entries)&&entries.length===12,'inputs');
 const rows=entries.map((entry,i)=>{
  assert.deepEqual(Object.keys(entry).sort(),['files','slot_id','transport_identity'],'comparison-evidence.entry-fields');
  need(entry.slot_id===schedule.slots[i].slot_id,'slot-order');
  if(entry.files===null)need(entry.transport_identity===null,'absent-identity');
  else{
   need(entry.files&&typeof entry.files==='object'&&!Array.isArray(entry.files)&&sha(entry.transport_identity),'file-entry');
   const names=['started.json','result.json','completed.json','events.jsonl','state/glm-transport-ledger.json',...(schedule.slots[i].arm==='current-are'?[]:['state/driver-binding.json'])];
   assert.deepEqual(Object.keys(entry.files).sort(),names.sort(),'comparison-evidence.file-set');
   need(Object.values(entry.files).every(sha),'file-digests');
  }
  return structuredClone(entry);
 });
 return {schema:'are.comparison-evidence-manifest/v1',schedule_sha256:schedule.schedule_sha256,outcome_seal_sha256,entries:rows,authority_effect:'none'};
}
export function reconcileComparisonCampaignEvidence({outcome_root,runs_root,schedule,sources,manifest,expected_manifest_sha256}){
 need(sha(expected_manifest_sha256)&&hash(manifest)===expected_manifest_sha256,'external-manifest-pin');
 assert.deepEqual(manifest,createComparisonEvidenceManifest({schedule,sources,outcome_seal_sha256:manifest.outcome_seal_sha256,entries:manifest.entries}),'comparison-evidence.manifest-reconstruction');
 runs_root=resolve(runs_root);need(realpathSync(runs_root)===runs_root,'canonical-runs-root');
 const sealed=verifyComparisonOutcomeSeal({root:outcome_root,schedule,sources,expected_seal_sha256:manifest.outcome_seal_sha256});
 const rows=sealed.map(({result:outcome},i)=>{
  const slot=schedule.slots[i],entry=manifest.entries[i];
  const row={slot_id:slot.slot_id,task_id:slot.task_id,arm:slot.arm,outcome_status:outcome.status,attempted:outcome.attempted,raw_accounting:accountComparisonOutcome(outcome),reconciled:false};
  if(!outcome.attempted){need(entry.files===null,'unstarted-has-run-evidence');return {...row,status:'not-started'};}
  if(entry.files===null)return {...row,status:'missing-run-evidence'};
  try{
   const taskBytes=readFileSync(slot.task_path);need(hash(taskBytes)===slot.task_sha256,'task-digest');const task=JSON.parse(taskBytes);
   need(task.instance_id===slot.instance_id&&task.base_commit===slot.base_commit,'task-identity');
   const evidence=reconcileComparisonRunFiles({root:join(runs_root,String(i).padStart(2,'0')),cell:slot.cell,task,task_sha256:slot.task_sha256,outcome_result:outcome.result,expected_identity:entry.transport_identity,expected_files:entry.files});
   need(row.raw_accounting.raw_accounting_complete&&row.raw_accounting.provider_healthy,'raw-accounting-unresolved');
   need(row.raw_accounting.known_token_lower_bound===evidence.ledger.total_tokens&&row.raw_accounting.conservative_total_tokens===evidence.ledger.total_tokens&&row.raw_accounting.observed_input_tokens===evidence.ledger.input_tokens&&row.raw_accounting.observed_output_tokens===evidence.ledger.output_tokens&&row.raw_accounting.model_receipts===evidence.ledger.model_calls,'raw-durable-accounting-disagrees');
   return {...row,status:'reconciled',reconciled:true,evidence};
  }catch(error){return {...row,status:'reconciliation-failed',error:String(error.message)};}
 });
 return {schema:'are.comparison-campaign-evidence/v1',manifest_sha256:expected_manifest_sha256,outcome_seal_sha256:manifest.outcome_seal_sha256,schedule_sha256:schedule.schedule_sha256,assigned_outcomes:12,rows,reconciled_outcomes:rows.filter(r=>r.reconciled).length,all_run_evidence_reconciled:rows.every(r=>r.reconciled),outer_process_settlement_pending:true,native_scoring_pending:true,accepted_savings:null,benchmark_cleared:false};
}
