// Open Questions: evidence/G01-RUNTIME-LINKED-READER-R1.json.
import {decodeCandidateIds} from './candidate-id-decoder-r1.mjs';
const uint=x=>Number.isSafeInteger(x)&&x>=0;
export function tokenizerAdmission(reply){
 return reply?.dispatched===true&&reply.status===200&&!reply.failure_code&&!reply.dispatch_uncertain&&
  uint(reply.prompt_tokens)&&reply.prompt_tokens+512<=8192;
}
export function publicSelection(reply,candidateCount){
 if(reply?.dispatched!==true||reply.status!==200||reply.failure_code||reply.dispatch_uncertain||
  !uint(reply.prompt_tokens)||!uint(reply.completion_tokens)||reply.prompt_tokens+512>8192||reply.completion_tokens>512||
  reply.public_response?.finish_reason!=='stop'||reply.public_response?.message?.role!=='assistant')return null;
 try{return decodeCandidateIds(reply.public_response.message.content,candidateCount);}catch{return null;}
}
export function fullPredictions(packets,rows){
 const byOrdinal=new Map(rows.map(r=>[r.ordinal,r]));
 if(byOrdinal.size!==rows.length)throw Error('prediction.duplicate');
 return packets.map(p=>{
  const r=byOrdinal.get(p.ordinal);
  if(r&&(r.case_id!==p.case_id||r.arm!==p.arm||r.prompt_sha256!==p.prompt_sha256))throw Error('prediction.identity');
  return {ordinal:p.ordinal,case_id:p.case_id,arm:p.arm,valid:r?.valid===true,
   missing:!r,ranked_files:r?.valid?r.selected_ids.map(id=>p.candidates[id-1].path):[]};
 });
}
