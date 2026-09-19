// Pure request-window reconstruction; pair with ledger R2. Open questions: COMPARISON-WINDOW.md.
import {createHash} from 'node:crypto';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {retainedReasoning} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/accounting-v1/accounting.mjs';
import {providerAttemptHealth} from './provider-attempt-health.mjs';
const hash=x=>createHash('sha256').update(typeof x==='string'?x:stable(x)).digest('hex');
const uint=n=>Number.isSafeInteger(n)&&n>=0;
const need=(v,m)=>{if(!v)throw Error('comparison-window.'+m);};
export function reconcileComparisonWindows({receipts,events,token_margin,output_cap}){
 need(Array.isArray(receipts)&&Array.isArray(events)&&uint(token_margin)&&token_margin>0&&token_margin<=4096&&uint(output_cap)&&output_cap>0&&output_cap<=2048,'inputs');
 need(receipts.every(r=>r&&['model','tokenizer'].includes(r.kind))&&providerAttemptHealth(receipts).healthy,'receipt-health');
 const captures=events.flatMap(e=>e.kind==='request-capture'?[e.capture]:Array.isArray(e.captures)?e.captures:[]),requests=[];
 for(const [i,r]of receipts.entries())if(r.kind==='model'){
  need(r.model==='glm-5.3-flash'&&r.output_cap===output_cap,'profile');
  const capture=captures.find(c=>typeof c?.prompt==='string'&&c.prompt_sha256===hash(c.prompt)&&hash(bodyForReceipt(c.prompt,r))===r.request_sha256);
  need(capture,'model-capture');const wire=JSON.parse(capture.prompt);
  const tokenizerHash=hash({model:r.model,messages:wire.messages,tools:wire.tools});
  const candidates=receipts.slice(0,i).flatMap((t,j)=>t.kind==='tokenizer'&&t.request_sha256===tokenizerHash?[{receipt:t,index:j}]:[]);
  need(candidates.length===1,'unique-prior-measurement');const {receipt:t,index}=candidates[0];
  const retained=retainedReasoning(wire.messages,receipts.slice(0,index));
  need(t.retained_reasoning_reservation===retained.tokens&&t.retained_reasoning_occurrences===retained.message_occurrences,'retained-reasoning');
  const measured=t.input_tokens+token_margin+retained.tokens;
  need(uint(measured)&&uint(r.reserved_input_tokens)&&r.reserved_input_tokens===measured,'input-reservation');
  need(measured+output_cap<=8000&&r.input_tokens<=measured&&r.output_tokens<=output_cap,'window-or-usage');
  requests.push({receipt_index:i,tokenizer_receipt_index:index,request_sha256:r.request_sha256,tokenizer_request_sha256:tokenizerHash,input_upper_bound:measured,output_reservation:output_cap,projected_tokens:measured+output_cap,retained_reasoning_tokens:retained.tokens});
 }
 need(requests.length>0,'no-model-requests');
 return {schema:'are.comparison-window-reconciliation/v1',context_limit:8000,token_margin,output_cap,requests,measured_windows_verified:true,filesystem_binding_pending:true,benchmark_cleared:false};
}
