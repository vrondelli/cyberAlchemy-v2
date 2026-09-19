// Read-only replay of recorded failures. Open questions: INDEPENDENT-FINDING-DIAGNOSIS-R1.md.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {bindInvestigationEvidence,validateInvestigationFinding} from './compact-repair-evidence-join.mjs';
const stage=new URL('./independent-candidate-production-live-r1/',import.meta.url);
const bindings=[];
function read(url){const bytes=readFileSync(url);bindings.push({path:fileURLToPath(url),sha256:createHash('sha256').update(bytes).digest('hex')});return bytes.toString();}
read(new URL(import.meta.url));
read(new URL('./compact-repair-evidence-join.mjs',import.meta.url));
const rows=[];
for(const sequence of ['00','03']){
 const result=JSON.parse(read(new URL(`runs_root/${sequence}/result.json`,stage)));
 const events=read(new URL(`runs_root/${sequence}/events.jsonl`,stage)).trim().split('\n').map(JSON.parse);
 assert.equal(result.status,'run_error');assert.equal(result.error,'independent-join.finding-unbound-claim');
 const phase=result.phase_state.phase,start=result.phase_state.phase_receipt_start;
 const last=events.filter(e=>e.kind==='response-capture').at(-1);
 assert.equal(last.phase,phase);
 const calls=last.response_capture.public_response.message.tool_calls;
 assert.equal(calls.length,1);assert.equal(calls[0].function.name,'submit_investigation');
 const raw=calls[0].function.arguments,value=JSON.parse(raw),branch_id=`q${phase.split('-').at(-1)}`;
 const inputs={branches:[{branch_id,receipt_indices:Array.from({length:result.receipts.length-start},(_,i)=>start+i),captures:events.filter(e=>e.kind==='request-capture'&&e.phase===phase).map(e=>e.capture)}],receipts:result.receipts};
 const joined=bindInvestigationEvidence(inputs),allowed=new Set(joined.branch_bindings[0].read_ids);
 assert.throws(()=>validateInvestigationFinding({raw,branch_id,joined,inputs}),{message:result.error});
 const issues=[];
 for(const [i,claim]of value.claims.entries()){
  const add=(field,code,detail)=>issues.push({path:`/claims/${i}/${field}`,code,...detail});
  if(!claim||typeof claim!=='object'||Array.isArray(claim)){add('','object-required',{});continue;}
  if(Object.keys(claim).sort().join(',')!=='read_ids,text')add('','closed-fields',{});
  if(typeof claim.text!=='string'||!claim.text.trim()||claim.text.length>1000)add('text','invalid-text',{});
  if(!Array.isArray(claim.read_ids)||claim.read_ids.length<1||claim.read_ids.length>16){add('read_ids','invalid-array',{});continue;}
  if(new Set(claim.read_ids).size!==claim.read_ids.length)add('read_ids','duplicate-ids',{});
  for(const [j,id]of claim.read_ids.entries())if(!allowed.has(id)){
   // Similarity is diagnostic only: never repair, accept or promote a reference.
   const singleDeletionMatches=typeof id==='string'?[...allowed].filter(candidate=>candidate.length===id.length+1&&[...candidate].some((_,k)=>candidate.slice(0,k)+candidate.slice(k+1)===id)):[];
   add(`read_ids/${j}`,'unbound-id',{value:id,length:typeof id==='string'?id.length:null,single_deletion_matches:singleDeletionMatches});
  }
 }
 assert.ok(issues.length>0);
 rows.push({sequence:Number(sequence),phase,branch_id,confirmed_read_count:allowed.size,claim_count:value.claims.length,issues,join_sha256:joined.join_sha256,error_reproduced:true});
}
console.log(JSON.stringify({schema:'are.independent-finding-diagnosis/v1',rows,bindings,new_model_calls:0,original_outputs_modified:false,claim_ceiling:'Exact rejected references and claim-shape diagnostics only; no automatic repair or benchmark quality claim.',open_questions_ref:'INDEPENDENT-FINDING-DIAGNOSIS-R1.md'},null,2));
