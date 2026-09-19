// Candidate history/finalization policy. Open questions: INVESTIGATION-RETENTION.md.
import {projectMinimalHistory} from './minimal-history.mjs';
const need=(v,m)=>{if(!v)throw Error('investigation-retention.'+m);};
export function requireFindingSubmission(calls){
 need(Array.isArray(calls)&&calls.length===1&&calls[0]?.function?.name==='submit_investigation','finalization-tool-required');
}
export function projectInvestigationHistory(history){
 const projected=projectMinimalHistory({history}).history;
 let start=projected.length-1;
 while(start>=0&&projected[start].role==='tool')start--;
 need(start<0||projected[start].role==='assistant','exchange');
 return start<0?[]:projected.slice(start);
}
export function assessInvestigationExploration({receipts,envelope_tokens}){
 need(Array.isArray(receipts)&&Number.isSafeInteger(envelope_tokens)&&envelope_tokens>0&&envelope_tokens<=8000,'inputs');
 const models=receipts.filter(r=>r.kind==='model');let spent=0;
 for(const r of models){need(r.dispatched===true&&r.status===200&&!r.failure_code&&[r.input_tokens,r.output_tokens].every(n=>Number.isSafeInteger(n)&&n>=0),'unknown-or-failed-usage');spent+=r.input_tokens+r.output_tokens;}
 need(Number.isSafeInteger(spent),'usage-overflow');
 return {explore:spent+envelope_tokens+8000<=24000&&models.length+2<=24,spent_tokens:spent,model_calls:models.length,measured_request_reservation:envelope_tokens,finalization_reserve_tokens:8000,finalization_reserve_calls:1,phase_token_limit:24000,phase_call_limit:24};
}
