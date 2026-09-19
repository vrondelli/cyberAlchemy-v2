// Raw lower bounds and unresolved reservations, not durable reconciliation. Open questions: COMPARISON-ACCOUNTING.md.
import assert from 'node:assert/strict';
import {verifyComparisonSchedule} from './comparison-schedule.mjs';
import {COMPARISON_ARMS} from './comparison-arm.mjs';
import {providerAttemptHealth} from './provider-attempt-health.mjs';
const uint=x=>Number.isSafeInteger(x)&&x>=0;
const need=(v,m)=>{if(!v)throw Error('comparison-accounting.'+m);};
const sum=(a,b)=>{need(uint(a)&&uint(b)&&uint(a+b),'overflow');return a+b;};
export function accountComparisonOutcome(outcome){
 need(outcome&&typeof outcome.attempted==='boolean','attempted-state');
 if(!outcome.attempted){need(outcome.status==='not-started'&&outcome.result===null,'unstarted-evidence');return {known_token_lower_bound:0,observed_input_tokens:0,observed_output_tokens:0,model_receipts:0,unknown_model_receipts:0,conservative_total_tokens:0,raw_accounting_complete:true,provider_healthy:true,issues:[]};}
 need(['returned','failed'].includes(outcome.status),'attempted-status');
 const result=outcome.result,issues=[];let input=0,output=0,models=0,unknown=0,reserved=0,uncertainScope=false;
 if(!result||!Array.isArray(result.receipts)){issues.push('missing-model-receipts');uncertainScope=true;}
 const receipts=Array.isArray(result?.receipts)?result.receipts:[];
 for(const r of receipts){
  if(!r||typeof r!=='object'||!['model','tokenizer'].includes(r.kind)){issues.push('invalid-receipt');uncertainScope=true;continue;}
  if(r.kind!=='model')continue;models++;
  const partialIn=uint(r.input_tokens)?r.input_tokens:0,partialOut=uint(r.output_tokens)?r.output_tokens:0,partial=sum(partialIn,partialOut);input=sum(input,partialIn);output=sum(output,partialOut);
  if(r.dispatched!==true||!uint(r.input_tokens)||!uint(r.output_tokens)){unknown++;reserved=sum(reserved,Math.max(0,8000-partial));issues.push('unknown-or-contradictory-model-usage');}
 }
 const observed=sum(input,output);let lower=observed;
 const usage=result?.usage;
 if(usage!==undefined){
  if(usage&&typeof usage==='object'&&!Array.isArray(usage)){
   const partial=sum(uint(usage.prompt_tokens)?usage.prompt_tokens:0,uint(usage.completion_tokens)?usage.completion_tokens:0);
   lower=Math.max(lower,partial,uint(usage.total_tokens)?usage.total_tokens:0);
   if(!uint(usage.prompt_tokens)||!uint(usage.completion_tokens)||!uint(usage.total_tokens)||partial!==usage.total_tokens){issues.push('invalid-usage-summary');uncertainScope=true;}
   else if(usage.total_tokens!==observed||usage.prompt_tokens!==input||usage.completion_tokens!==output){issues.push('usage-summary-disagrees');uncertainScope=true;}
  }else{issues.push('invalid-usage-summary');uncertainScope=true;}
 }
 for(const key of ['unknown_usage','accounting_requires_reconciliation'])if(result&&Object.hasOwn(result,key)){
  if(typeof result[key]!=='boolean'){issues.push('invalid-accounting-flag');uncertainScope=true;}
  else if(result[key]){issues.push('unresolved-accounting-scope');uncertainScope=true;}
 }
 if(result?.unknown_usage_calls!==undefined&&(!uint(result.unknown_usage_calls)||result.unknown_usage_calls!==unknown)){issues.push('unknown-count-disagrees');uncertainScope=true;}
 const phase=result?.phase_state;
 if(result&&Object.hasOwn(result,'phase_state')){
  if(!phase||typeof phase!=='object'||Array.isArray(phase)){issues.push('invalid-phase-state');uncertainScope=true;}
  else{
   if(!uint(phase.known_tokens)||!uint(phase.unknown_calls)){issues.push('invalid-phase-accounting');uncertainScope=true;}
   if(uint(phase.known_tokens)&&phase.known_tokens!==observed){issues.push('phase-known-usage-disagrees');uncertainScope=true;lower=Math.max(lower,phase.known_tokens);}
   if(uint(phase.unknown_calls)&&phase.unknown_calls!==unknown){issues.push('phase-unknown-count-disagrees');uncertainScope=true;}
   if(phase.pending!==null){
    uncertainScope=true;issues.push('unresolved-phase-reservation');
    const pending=phase.pending;
    if(!pending||typeof pending!=='object'||Array.isArray(pending)||!uint(pending.reservation)||pending.reservation===0||pending.reservation>8000||!uint(pending.input_upper_bound)||!uint(pending.output_cap)||pending.output_cap===0||sum(pending.input_upper_bound,pending.output_cap)!==pending.reservation||!uint(pending.receipt_start)||!(/^[a-f0-9]{64}$/).test(pending.request_sha256)){issues.push('invalid-pending-reservation');}
   }
  }
 }
 if(!Array.isArray(result?.index_tokenizer_receipts)){issues.push('missing-index-receipts');uncertainScope=true;}
 const health=providerAttemptHealth([...receipts,...(Array.isArray(result?.index_tokenizer_receipts)?result.index_tokenizer_receipts:[])]);
 const conservative=Math.max(sum(lower,reserved),uncertainScope?96000:0);
 return {known_token_lower_bound:lower,observed_input_tokens:input,observed_output_tokens:output,model_receipts:models,unknown_model_receipts:unknown,conservative_total_tokens:conservative,raw_accounting_complete:unknown===0&&!uncertainScope,provider_healthy:health.healthy,issues:[...new Set(issues)]};
}
export function accountComparisonQueue({terminal,schedule,sources}){
 verifyComparisonSchedule({schedule,...sources});need(terminal?.workers_settled===true&&terminal.assigned_outcomes===12&&terminal.schedule_sha256===schedule.schedule_sha256,'terminal-binding');
 need(Array.isArray(terminal.outcomes)&&terminal.outcomes.length===12,'fixed-denominator');
 const rows=terminal.outcomes.map((outcome,i)=>{
  const slot=schedule.slots[i];assert.deepEqual(['sequence','slot_id','task_id','arm'].map(k=>outcome[k]),['sequence','slot_id','task_id','arm'].map(k=>slot[k]),'comparison-accounting.slot-identity');
  const accounting=accountComparisonOutcome(outcome);return {slot_id:slot.slot_id,task_id:slot.task_id,arm:slot.arm,status:outcome.status,attempted:outcome.attempted,...accounting};
 });
 const aggregate=values=>({known_token_lower_bound:values.reduce((n,r)=>sum(n,r.known_token_lower_bound),0),conservative_total_tokens:values.reduce((n,r)=>sum(n,r.conservative_total_tokens),0),raw_accounting_complete:values.every(r=>r.raw_accounting_complete),provider_healthy:values.every(r=>r.provider_healthy)});
 return {schema:'are.comparison-raw-accounting/v1',schedule_sha256:schedule.schedule_sha256,assigned_outcomes:12,attempted_outcomes:rows.filter(r=>r.attempted).length,rows,by_arm:Object.fromEntries(COMPARISON_ARMS.map(arm=>[arm,aggregate(rows.filter(r=>r.arm===arm))])),...aggregate(rows),all_outcomes_returned:rows.every(r=>r.status==='returned'),durable_reconciliation_pending:true,accepted_savings:null,benchmark_cleared:false,authority_effect:'none'};
}
