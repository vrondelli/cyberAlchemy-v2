// Fixed paired trajectory evidence. Open questions: TRAJECTORY-GENERATION-SEAL.md.
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {createReferencedSeal,hydrateReferencedSeal} from './referenced-generation-seal.mjs';
import {accountReceipts} from './discovery-v1/run.mjs';
const need=(x,m)=>{if(!x)throw Error('trajectory-seal.'+m);};
const uint=x=>Number.isSafeInteger(x)&&x>=0;
export function trajectorySealContract({task_ids}){
 need(Array.isArray(task_ids)&&task_ids.length>0&&task_ids.every(x=>typeof x==='string'&&/^[a-zA-Z0-9_-]+$/.test(x))&&new Set(task_ids).size===task_ids.length,'fixed-tasks');
 const expected=task_ids.flatMap(task_id=>['control','treatment'].map(arm=>({slot_id:task_id+':'+arm,task_id,arm})));
 const validate=({slot_id,result:r})=>{
  const e=expected.find(e=>e.slot_id===slot_id);need(e&&r&&r.schema==='are.trajectory-slot/v1','slot-schema');
  need(r.task_id===e.task_id&&r.arm===e.arm&&r.slot_id===slot_id,'slot-identity');
  need(['completed','failed','not-started'].includes(r.status)&&r.transport_settled===true,'terminal-settled');
  need(Array.isArray(r.receipts)&&Array.isArray(r.dispatches),'receipts-and-dispatches');
  for(const receipt of r.receipts)if(receipt?.kind==='model'&&receipt.dispatched===false)
   need(['input_tokens','output_tokens','reasoning_tokens','cached_tokens'].every(k=>receipt[k]===undefined||receipt[k]===null||receipt[k]===0),'undispatched-spend');
  const usage=accountReceipts(r.receipts);assert.deepEqual(r.usage,usage,'receipt accounting must match');
  need(uint(usage.conservative_total_tokens),'conservative-overflow');
  const models=r.receipts.filter(x=>x?.kind==='model'&&x.dispatched!==false);
  need(r.dispatches.length===models.length,'dispatch-count');
  for(const [i,d] of r.dispatches.entries()){
   const receipt=models[i];
   need(uint(d.input_upper_bound)&&uint(d.output_reservation)&&d.output_reservation>0&&uint(d.projected_upper_bound)&&d.projected_upper_bound===d.input_upper_bound+d.output_reservation&&d.projected_upper_bound<=8000,'exact-window-admission');
   need(receipt.reserved_input_tokens===d.input_upper_bound&&receipt.output_cap===d.output_reservation,'receipt-reservation-mismatch');
   if(uint(receipt.input_tokens))need(receipt.input_tokens<=d.input_upper_bound,'actual-input-over-reservation');
   if(uint(receipt.output_tokens))need(receipt.output_tokens<=d.output_reservation,'actual-output-over-reservation');
  }
  if(r.status==='completed')need(!usage.unknown_usage&&usage.model_calls>0&&r.native_export?.prediction&&r.episode_status==='final_context_selected','complete-evidence');
  else need(typeof r.reason==='string'&&r.reason.length>0&&!r.native_export,'incomplete-reason');
  if(r.status==='not-started')need(r.receipts.length===0&&r.dispatches.length===0,'undispatched-must-be-empty');
  return true;
 };
 const summarize=rows=>{
  assert.deepEqual(rows.map(r=>r.slot_id),expected.map(e=>e.slot_id),'fixed denominator and order');
  const arms={};
  for(const arm of ['control','treatment']){
   const selected=rows.filter(r=>r.result.arm===arm);const totals={};
   for(const key of ['prompt_tokens','completion_tokens','total_tokens','model_calls','unknown_usage_calls','conservative_total_tokens']){
    totals[key]=selected.reduce((n,r)=>n+r.result.usage[key],0);need(uint(totals[key]),'aggregate-overflow');
   }
   arms[arm]={assigned:selected.length,completed:selected.filter(r=>r.result.status==='completed').length,...totals};
  }
  return {assigned:expected.length,complete:rows.every(r=>r.result.status==='completed'),arms,quality_scored:false,benchmark_cleared:false};
 };
 const checkSlots=slots=>assert.deepEqual(slots.map(s=>s.slot_id),expected.map(e=>e.slot_id),'fixed denominator and order');
 return Object.freeze({expected,validate,summarize,checkSlots});
}
export function persistTrajectorySeal({root,task_ids,slots,persistence,workers_settled}){
 need(workers_settled===true,'workers-not-settled');need(typeof persistence?.writeJson==='function','guarded-persistence-required');
 const contract=trajectorySealContract({task_ids});contract.checkSlots(slots);
 const seal=createReferencedSeal({root,slots,...contract});
 persistence.writeJson(join(root,'GENERATION-SEAL.json'),seal,{final:true});return seal;
}
export function loadTrajectorySeal({root,task_ids,slots,seal}){
 const contract=trajectorySealContract({task_ids});contract.checkSlots(slots);
 return hydrateReferencedSeal({root,seal,expected_slots:slots,...contract});
}
