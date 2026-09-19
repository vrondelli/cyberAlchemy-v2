// Additive query-archive production candidate. Open questions: QUERY-ARCHIVE-CANDIDATE-R1.md.
// Candidate-only descendant of comparison-queue.mjs. Open questions: CANDIDATE-ONLY-PLAN.md.
// Cooperative fixed two-worker queue; no implicit live executor. Open questions: COMPARISON-QUEUE.md.
import {verifyQueryArchiveSchedule as verifyComparisonSchedule} from './query-archive-schedule-r1.mjs';
import {providerAttemptHealth} from './provider-attempt-health.mjs';
const need=(v,m)=>{if(!v)throw Error('comparison-queue.'+m);};
export async function runComparisonQueue({schedule,sources,execute,persist,signal}){
 need(typeof execute==='function'&&typeof persist==='function'&&signal instanceof AbortSignal,'dependencies');
 const plan=structuredClone(schedule);verifyComparisonSchedule({schedule:plan,...sources});
 const controller=new AbortController(),outcomes=plan.slots.map(slot=>({sequence:slot.sequence,slot_id:slot.slot_id,task_id:slot.task_id,arm:slot.arm,status:'not-started',attempted:false,result:null})),persistence_failures=[];
 let next=0,stop_reason=null;
 const stop=reason=>{stop_reason??=reason;controller.abort();};
 const parentAbort=()=>stop('parent-abort');signal.addEventListener('abort',parentAbort,{once:true});if(signal.aborted)parentAbort();
 const save=event=>{const value=persist(event);need(!value||typeof value.then!=='function','synchronous-persistence');};
 const terminal=()=>({schema:'are.candidate-only-queue-terminal/v1',schedule_sha256:plan.schedule_sha256,workers_settled:true,assigned_outcomes:plan.assigned_outcomes,outcomes,persistence_failures,stop_reason,status:outcomes.every(o=>o.status==='returned')&&!persistence_failures.length&&!stop_reason?'settled':'incomplete',accounting_pending:true,generation_sealed:false,benchmark_cleared:false});
 const stopFor=result=>{
  if(!result||!Array.isArray(result.receipts)||!Array.isArray(result.index_tokenizer_receipts))return 'missing-attempt-evidence';
  if(['native_export_error','orchestration_error'].includes(result.status)||result.persistence_failure||(result.persistence_failures&&(!Array.isArray(result.persistence_failures)||result.persistence_failures.length>0)))return 'infrastructure-or-accounting-failure';
  if(result.infrastructure_failure||result.accounting_requires_reconciliation||result.unknown_usage||result.phase_state?.unknown_calls||result.phase_state?.pending)return 'infrastructure-or-accounting-failure';
  if(!providerAttemptHealth([...result.receipts,...result.index_tokenizer_receipts]).healthy)return 'provider-attempt-failure';
  return null;
 };
 async function worker(){
  while(next<plan.slots.length){const i=next++,slot=plan.slots[i];if(controller.signal.aborted)continue;
   const outcome=outcomes[i];
   try{
    verifyComparisonSchedule({schedule:plan,...sources});
    save({kind:'queue-start',slot_id:slot.slot_id,sequence:i});
    if(controller.signal.aborted)continue;
    outcome.attempted=true;
    outcome.result=await execute({slot:structuredClone(slot),signal:controller.signal});outcome.status='returned';
    const reason=stopFor(outcome.result);if(reason)stop(reason);
   }catch(error){outcome.status='failed';outcome.error=String(error.message);outcome.result=error.result??outcome.result??{status:'queue-executor-error',receipts:Array.isArray(error.receipts)?structuredClone(error.receipts):[],index_tokenizer_receipts:[],accounting_requires_reconciliation:outcome.attempted,benchmark_cleared:false};stop('executor-failure');}
   try{save({kind:'queue-outcome',outcome:structuredClone(outcome)});}catch(error){outcome.persistence_failure=String(error.message);persistence_failures.push({slot_id:slot.slot_id,error:String(error.message)});stop('outcome-persistence-failure');}
  }
 }
 try{
  try{save({kind:'queue-plan',schedule:plan});}catch(error){stop('plan-persistence-failure');throw error;}
  const workers=await Promise.allSettled([worker(),worker()]);need(workers.every(w=>w.status==='fulfilled'),'worker-settlement');
  const result=terminal();save({kind:'queue-terminal',terminal:{...result,outcomes:outcomes.map(({result,...metadata})=>metadata)}});return result;
 }catch(error){error.result=terminal();throw error;}
 finally{signal.removeEventListener('abort',parentAbort);}
}
