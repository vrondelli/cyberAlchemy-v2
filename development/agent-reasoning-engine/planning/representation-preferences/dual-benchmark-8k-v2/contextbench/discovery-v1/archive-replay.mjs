// Read-only archive shape validation. No providers/gold/text output. Open questions: ARCHIVE-REPLAY.md.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {projectHistory} from './history.mjs';
import {stable,bodyForReceipt} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const root=resolve(import.meta.dirname,'../../../../../../..'),read=p=>JSON.parse(readFileSync(p)),hash=x=>createHash('sha256').update(x).digest('hex');
const bind=p=>({path:relative(root,p),sha256:hash(readFileSync(p))});
const sourcePath=resolve(import.meta.dirname,'../INPUT-ATTRIBUTION.json'),source=read(sourcePath),inputs=[bind(sourcePath),bind(resolve(import.meta.dirname,'history.mjs')),bind(new URL(import.meta.url).pathname)],rows=[];
for(const row of source.rows){
 const path=resolve(root,row.source.path);assert.equal(hash(readFileSync(path)),row.source.sha256);inputs.push(bind(path));
 const r=read(path),receipts=r.receipts.filter(x=>x.kind==='model'&&x.dispatched),profiles=new Map();
 for(const [index,receipt]of receipts.entries()){
  const key=stable([receipt.model,receipt.output_cap,receipt.reasoning_effort]);
  if(!profiles.has(key)){const captures=new Map();for(const c of r.captures??[])captures.set(hash(stable(bodyForReceipt(c.prompt,receipt))),c.prompt);profiles.set(key,captures);}
  const prompt=profiles.get(key).get(receipt.request_sha256);assert.ok(prompt,'receipt lacks actual capture');
  const messages=JSON.parse(prompt).messages,before=stable(messages),entry={stage:row.stage,task_id:row.task_id,arm:row.arm,source_result:row.source.path,model_call_index:index,request_sha256:receipt.request_sha256,input_messages:messages.length,input_message_array_bytes:Buffer.byteLength(before)};
  try{
   const projected=projectHistory({history:messages}),after=projected.history;
   assert.equal(stable(messages),before,'input mutation');
   // User/system/developer messages must retain exact sequence and bytes.
   const protectedRoles=x=>x.filter(m=>['user','system','developer'].includes(m.role));
   assert.deepEqual(protectedRoles(after),protectedRoles(messages));
   const d=projected.diagnostics;assert.equal(d.input_bytes,d.normalized_bytes);assert.equal(d.normalized_bytes-d.selected_bytes,d.removed_bytes);
   rows.push({...entry,status:'accepted',selected_message_array_bytes:d.selected_bytes,removed_message_array_bytes:d.removed_bytes,removed_fraction:d.removed_bytes/d.input_bytes,selected_messages:d.selected_messages,omitted_groups:d.omitted_old_history.length,complete_exchanges_before:d.complete_exchanges_before,complete_exchanges_after:d.complete_exchanges_after});
  }catch(error){
   assert.equal(stable(messages),before,'input mutation after rejection');
   if(!String(error.message).startsWith('history-projection.'))throw error;
   rows.push({...entry,status:'rejected',issue:error.message});
  }
 }
}
assert.equal(rows.length,434);
for(const input of inputs)assert.equal(hash(readFileSync(resolve(root,input.path))),input.sha256,'input changed during replay');
const distribution=values=>{const v=values.toSorted((a,b)=>a-b),pct=p=>v[Math.max(0,Math.ceil(v.length*p)-1)]??null;return {count:v.length,min:v[0]??null,p50:pct(.5),p95:pct(.95),max:v.at(-1)??null,sum:v.reduce((a,b)=>a+b,0)};};
const summary={};
for(const arm of ['control','treatment']){
 const all=rows.filter(r=>r.arm===arm),ok=all.filter(r=>r.status==='accepted'),bad=all.filter(r=>r.status==='rejected');
 summary[arm]={requests:all.length,accepted:ok.length,rejected:bad.length,issues:Object.fromEntries([...new Set(bad.map(r=>r.issue))].map(k=>[k,bad.filter(r=>r.issue===k).length])),input_bytes:distribution(ok.map(r=>r.input_message_array_bytes)),selected_bytes:distribution(ok.map(r=>r.selected_message_array_bytes)),removed_bytes:distribution(ok.map(r=>r.removed_message_array_bytes)),removed_fraction:distribution(ok.map(r=>r.removed_fraction)),changed_requests:ok.filter(r=>r.removed_message_array_bytes>0).length};
}
const result={schema_version:'dual8k.history-archive-replay/v1',shape_check_completed:true,all_requests_accepted:rows.every(r=>r.status==='accepted'),unit:'UTF-8 stable JSON message-array bytes; NOT tokens',summary,rows,bound_inputs:inputs,original_inputs_unchanged:true,provider_calls:0,gold_access:false,pending_policy:'pending=[]; already-dispatched prompt replay cannot establish pending first-delivery safety or correction/terminal protected-index integration',archive_refs_policy:'none supplied; archive remains unchanged; immutable opaque-ref behavior tested separately in history.test.mjs',limitations:['No source/body/hidden-reasoning text emitted.','Byte reductions omit schemas and provider overhead, and are not input token savings.','No episode evolution, source recovery, next-call behavior, native score, output cost, or8K admission tested.'],authority_effect:'none',open_questions_ref:'ARCHIVE-REPLAY.md'};
writeFileSync(resolve(import.meta.dirname,'ARCHIVE-REPLAY.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({summary,all_requests_accepted:result.all_requests_accepted}));
