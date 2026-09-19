// Shared terminal receipt validation. Open questions: PROVIDER-ATTEMPT-HEALTH.md.
const uint=n=>Number.isSafeInteger(n)&&n>=0;
export function providerAttemptHealth(receipts){
 if(!Array.isArray(receipts))throw Error('provider-health.receipts-required');
 const failures=[];
 for(const [receipt_index,r]of receipts.entries()){
  const reasons=[],kind=r?.kind;
  if(!['model','tokenizer','index-tokenizer'].includes(kind))reasons.push('unknown-attempt-kind');
  if(typeof r?.dispatched!=='boolean')reasons.push('dispatch-state-missing');
  if(r?.failure_code)reasons.push('explicit-provider-or-transport-failure');
  if(r?.dispatched!==true)reasons.push('attempt-not-dispatched');
  if(r?.status!==200)reasons.push('attempt-not-successfully-terminal');
  if(kind==='model'&&(!uint(r.input_tokens)||!uint(r.output_tokens)))reasons.push('model-usage-missing');
  if(kind==='tokenizer'&&(!uint(r.input_tokens)))reasons.push('tokenizer-measurement-missing');
  if(kind==='index-tokenizer'){
   if(!uint(r.tokens))reasons.push('index-measurement-missing');
   if(!Array.isArray(r.transport_attempts)||r.transport_attempts.length!==1||r.transport_attempts.some(a=>a.status!==200||a.failure_code))reasons.push('index-attempt-not-single-success');
  }else if(['model','tokenizer'].includes(kind)&&r.automatic_retries!==0)reasons.push('unexpected-retry');
  if(reasons.length)failures.push({receipt_index,kind:kind??null,reason_codes:reasons});
 }
 return {healthy:failures.length===0,attempts:receipts.length,failures};
}
