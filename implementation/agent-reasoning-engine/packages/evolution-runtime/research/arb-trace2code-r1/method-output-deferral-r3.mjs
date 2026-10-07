// Method-native projection only; original executed results remain in the journal.
// Open Questions: evidence/G01-NATIVE-METHOD-EPISODE-R3.json.
import {createHash} from 'node:crypto';
import {stable} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
import {retainPendingToolExchange} from '../../../../benchmarks/contextbench-v1/pending-delivery.mjs';
const catalog = new Set(['list_files','list_methods','list_references','list_runtime_methods']);
const allowed = new Set([...catalog,'runtime_status','read_file','recover_observed_read']);
export function deferMethodOutputs(pending,{maximum_inline_bytes=512}={}) {
 if(!Number.isSafeInteger(maximum_inline_bytes)||maximum_inline_bytes<1||maximum_inline_bytes>4096)
  throw Error('method-deferral.invalid-inline-bound');
 if(!Array.isArray(pending))throw Error('method-deferral.exchange-required');
 if(!pending.length)return {exchange:[],deferrals:[],authority_effect:'none'};
 retainPendingToolExchange([],pending); // Full call/result identity, not partial batches.
 const calls=new Map(pending[0].tool_calls.map(c=>[c.id,c])),deferrals=[];
 const exchange=pending.map((message,i)=>{
  if(i===0)return message;
  const name=calls.get(message.tool_call_id)?.function?.name;
  if(!allowed.has(name)||typeof message.content!=='string'||Buffer.byteLength(message.content)<=maximum_inline_bytes)return message;
  let result;try{result=JSON.parse(message.content);}catch{return message;}
  if(result?.ok!==true)return message; // Never hide a validation/capacity error.
  const result_digest=createHash('sha256').update(message.content).digest('hex');
  const guidance=catalog.has(name)
   ?'Full catalog reply cannot fit this fresh request. Repeat with limit:1 and explicit pagination/exact filters; missing or withheld entries are not irrelevant.'
   :name==='runtime_status'
    ?'Full status reply cannot fit this fresh request. Availability is unresolved here, not negative evidence; source remains eligible.'
    :'Complete source reply cannot fit this fresh request. No source/read ID was delivered by this notice. Choose another complete catalog method; do not request or select partial methods. Recovery cannot acquire withheld source.';
  const notice={ok:false,error:'tool-output-deferred',execution_succeeded:true,effects:'read-only',payload_delivered:false,
   original_result_bytes:Buffer.byteLength(message.content),result_digest,guidance};
  const content=stable(notice);
  if(Buffer.byteLength(content)>768)throw Error('method-deferral.notice-too-large');
  deferrals.push({tool_call_id:message.tool_call_id,tool:name,result_digest,
   original_result_bytes:notice.original_result_bytes,notice_bytes:Buffer.byteLength(content)});
  return {...message,content};
 });
 return {exchange,deferrals,authority_effect:'none',
  claim_ceiling:'Admission-driven projection, not source truncation. Originals retained; withheld bytes receive no first-delivery credit.'};
}
