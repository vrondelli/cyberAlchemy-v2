// Derived additively from reviewed independent-phase-runtime.mjs; same settlement checks.
// Open questions: QUERY-ARCHIVE-CANDIDATE-R1.md.
import {createHash} from 'node:crypto';
import {assessTokenBudget} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/token-budget.mjs';
import {providerAttemptHealth} from './provider-attempt-health.mjs';
const uint=n=>Number.isSafeInteger(n)&&n>=0,sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const need=(v,m)=>{if(!v)throw Error('query-archive-phase.'+m);};
export const PHASES=Object.freeze([{id:'discover',tokens:88000,calls:95},{id:'join',tokens:8000,calls:1}].map(Object.freeze));
/** One shared transport receipt list, sequential calls, synchronous guarded persistence.
 * The transport remains owner of HTTP attempt receipts. No resume/replay support here.
 */
export function createQueryArchivePhases({get_receipts,persist}){
 need(typeof get_receipts==='function'&&typeof persist==='function','dependencies');
 let phaseIndex=0,start=0,pending=null,failed=false,closed=false,seen=[];
 const receipts=()=>{const r=get_receipts();if(!Array.isArray(r)||r.some(x=>!x||typeof x!=='object'||Array.isArray(x))||r.length<seen.length||!seen.every((h,i)=>sha(r[i])===h)){failed=true;throw Error('query-archive-phase.receipt-prefix-drift');}return r;};
 const bind=r=>{seen=r.map(sha);};
 const totals=r=>{
  let known=0,unknown=0,calls=0,reserved=0,pendingCovered=false;
  for(const [i,x] of r.entries())if(x.kind==='model'){
   if(x.dispatched===true)calls++;
   const partial=(uint(x.input_tokens)?x.input_tokens:0)+(uint(x.output_tokens)?x.output_tokens:0);known+=partial;
   const covered=!!pending&&!pendingCovered&&i>=pending.receipt_start&&x.request_sha256===pending.request_sha256;
   if(covered)pendingCovered=true;
   const complete=uint(x.input_tokens)&&uint(x.output_tokens);
   if(!complete){unknown++;reserved+=Math.max(0,(covered?pending.reservation:8000)-partial);}
  }
  if(pending&&!pendingCovered)reserved+=pending.reservation;
  need(uint(known)&&uint(reserved)&&uint(known+reserved),'usage-overflow');
  return {known_tokens:known,unknown_calls:unknown,model_calls:calls,unresolved_reserved_attempts:unknown+(pending&&!pendingCovered?1:0),conservative_total_tokens:known+reserved};
 };
 const snapshot=()=>{const r=receipts(),t=totals(r);return {schema:'are.query-archive-phase-state/v1',phase:closed?null:PHASES[phaseIndex].id,phase_index:phaseIndex,phase_receipt_start:start,failed,closed,pending:pending?{...pending}:null,...t,receipt_count:r.length,receipts_sha256:sha(r),authority_effect:'none'};};
 const save=()=>{try{const result=persist(snapshot());need(!result||typeof result.then!=='function','synchronous-persistence-required');}catch(e){failed=true;throw e;}};
 const fail=m=>{failed=true;save();throw Error('query-archive-phase.'+m);};
 need(receipts().length===0,'fresh-arm-required');save();
 function reserve({input_upper_bound,output_cap,request_sha256}){
  need(!failed&&!closed&&!pending,'not-ready');const r=receipts();
  const fresh=r.slice(seen.length);if(fresh.some(x=>x.kind==='model'))return fail('unreserved-model-attempt');
  if(!providerAttemptHealth(fresh).healthy)return fail('provider-attempt-failed');bind(r);
  need(uint(input_upper_bound)&&uint(output_cap)&&output_cap>0&&/^[a-f0-9]{64}$/.test(request_sha256),'request');
  const phase=PHASES[phaseIndex],total=assessTokenBudget({receipts:r,total_token_limit:96000,input_upper_bound,output_cap}),local=assessTokenBudget({receipts:r.slice(start),total_token_limit:phase.tokens,input_upper_bound,output_cap});
  const count=xs=>xs.filter(x=>x.kind==='model'&&x.dispatched===true).length;
  const admissible=input_upper_bound+output_cap<=8000&&total.admissible&&local.admissible&&count(r)<96&&count(r.slice(start))<phase.calls;
  if(!admissible)return {admissible:false,phase:phase.id,total,local,reason:'phase-or-arm-or-window-limit'};
  pending={phase:phase.id,receipt_start:r.length,request_sha256,input_upper_bound,output_cap,reservation:input_upper_bound+output_cap};save();return {admissible:true,...pending};
 }
 function settle(){
  need(!failed&&!closed&&pending,'no-pending');const r=receipts(),fresh=r.slice(pending.receipt_start),models=fresh.filter(x=>x.kind==='model');
  // Retain the reservation if dispatch/usage cannot be proven, including a missing receipt.
  if(models.length!==1)return fail('one-attempt-required');const m=models[0];
  if(m.request_sha256!==pending.request_sha256)return fail('request-binding');
  if(!uint(m.input_tokens)||!uint(m.output_tokens)||m.dispatched!==true)return fail('unknown-or-undispatched');
  const reservation=pending;pending=null;bind(r);
  if(m.input_tokens>reservation.input_upper_bound||m.output_tokens>reservation.output_cap||!providerAttemptHealth(fresh).healthy)return fail('receipt-or-reservation-failed');
  save();return snapshot();
 }
 function finishPhase(){
  need(!failed&&!closed&&!pending,'phase-not-settled');const r=receipts();need(r.length===seen.length,'unsettled-receipts');
  if(phaseIndex===PHASES.length-1)closed=true;else{phaseIndex++;start=r.length;}save();return snapshot();
 }
 return Object.freeze({reserve,settle,finishPhase,snapshot});
}
