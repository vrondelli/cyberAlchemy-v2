// Request-scoped candidate, not a provider-wide tokenization guarantee. Open questions: PLAN.md.
import {hash} from '../common.mjs';
export function reasoningEvidence(message,usage){
 if(message?.role!=='assistant'||typeof message.reasoning_content!=='string'||!message.reasoning_content.length)return null;
 const n=usage.reasoning_tokens??usage.output_tokens;
 if(!Number.isSafeInteger(n)||n<0||!Number.isSafeInteger(usage.output_tokens)||n>usage.output_tokens)throw Error('reasoning-usage-invalid');
 return {message_sha256:hash(message),token_reservation:n};
}
export function retainedReasoning(messages,receipts){
 const known=new Map();
 for(const r of receipts){
  const e=r.retained_reasoning;if(!e)continue;
  if(r.kind!=='model'||r.status!==200||r.failure_code||!Number.isSafeInteger(e.token_reservation)||e.token_reservation<0||e.token_reservation!==(r.reasoning_tokens??r.output_tokens)||e.token_reservation>r.output_tokens||!/^[a-f0-9]{64}$/.test(e.message_sha256))throw Error('reasoning-receipt-invalid');
  known.set(e.message_sha256,Math.max(known.get(e.message_sha256)??0,e.token_reservation));
 }
 let tokens=0,count=0;
 for(const m of messages){
  if(m.role!=='assistant'||m.reasoning_content===undefined||m.reasoning_content==='')continue;
  if(typeof m.reasoning_content!=='string')throw Error('reasoning-content-invalid');
  const bound=known.get(hash(m));if(bound===undefined)throw Error('unbound-retained-reasoning');
  tokens+=bound;count++;
 }
 if(!Number.isSafeInteger(tokens))throw Error('reasoning-reservation-overflow');
 return {tokens,message_occurrences:count};
}
