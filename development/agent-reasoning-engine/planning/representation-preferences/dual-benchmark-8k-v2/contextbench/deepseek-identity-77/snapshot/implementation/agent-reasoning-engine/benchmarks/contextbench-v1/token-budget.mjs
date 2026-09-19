// Prospective cumulative model-token admission. Open questions: README.md.
const uint=x=>Number.isSafeInteger(x)&&x>=0;
export function assessTokenBudget({receipts,total_token_limit,input_upper_bound,output_cap}){
 if(!Array.isArray(receipts)||!uint(total_token_limit)||!uint(input_upper_bound)||!uint(output_cap)||output_cap===0)throw Error('token-budget.invalid-input');
 let consumed=0,unknown=0;
 for(const r of receipts){
  if(r.kind!=='model')continue;
  if(typeof r.dispatched!=='boolean')throw Error('token-budget.dispatch-unknown');
  if(!r.dispatched)continue;
  if(!uint(r.input_tokens)||!uint(r.output_tokens)){unknown++;continue;}
  consumed+=r.input_tokens+r.output_tokens;if(!Number.isSafeInteger(consumed))throw Error('token-budget.overflow');
 }
 if(unknown)return {admissible:false,reason:'token-budget.unknown-usage',known_consumed:consumed,unknown_requests:unknown};
 const reserved=input_upper_bound+output_cap;
 if(!Number.isSafeInteger(reserved))throw Error('token-budget.overflow');
 return {admissible:consumed+reserved<=total_token_limit,reason:consumed+reserved<=total_token_limit?'token-budget.within-cap':'token-budget.exhausted',known_consumed:consumed,request_reservation:reserved,total_token_limit,remaining:Math.max(0,total_token_limit-consumed)};
}
