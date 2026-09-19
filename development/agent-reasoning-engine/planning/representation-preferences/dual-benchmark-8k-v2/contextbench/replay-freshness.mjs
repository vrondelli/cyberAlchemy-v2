// Offline boundary replay; Open questions: RECOVERY-FRESHNESS.md.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {createFreshRecoverySession} from './recovery-freshness.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const need=(x,m)=>{if(!x)throw Error(m);};
const dir=new URL('./',import.meta.url),root=new URL('../../../../../../',dir);
const source=readFileSync(new URL('RECOVERY-VISIBILITY.json',dir)),audit=JSON.parse(source),rows=[];
const bindings=[{path:'RECOVERY-VISIBILITY.json',sha256:hash(source)}];
for(const row of audit.rows){
 const binding=audit.source_bindings.find(x=>x.path.endsWith('/'+row.task_id+'/run/treatment/result.json'));
 need(binding,'source binding missing');const raw=readFileSync(new URL(binding.path,root));need(hash(raw)===binding.sha256,'source drift');bindings.push(binding);
 const result=JSON.parse(raw),session=createFreshRecoverySession({measure_tokens:async text=>Math.ceil(Buffer.byteLength(text)/4)}),boundaries=[];
 for(const presentation of row.requests){
  const indices=result.receipts.flatMap((r,i)=>r.kind==='model'&&r.dispatched&&r.request_sha256===presentation.request_sha256?[i]:[]);
  need(indices.length===1,'receipt ambiguity');const index=indices[0],receipt=result.receipts[index];
  const captureIndex=result.captures.findIndex(c=>hash(stable(bodyForReceipt(c.prompt,receipt)))===receipt.request_sha256);
  need(captureIndex>=0,'capture missing');
  // Exclude the current request: only earlier calls establish delivery.
  const archive={captures:result.captures.slice(0,captureIndex),receipts:result.receipts.slice(0,index)};
  const page=await session.prepare(archive);need(page.model?.text,'synthetic page unfit');
  const model=JSON.parse(page.model.text);
  boundaries.push({request_sha256:receipt.request_sha256,receipt_index:index,prior_capture_count:archive.captures.length,prior_receipt_count:archive.receipts.length,original_total:presentation.total,replayed_total:model.total,replayed_entries:model.entries.length,available_observations:page.freshness.available_observations,new_observations:page.freshness.new_observations});
 }
 rows.push({task_id:row.task_id,boundaries,original_empty:boundaries.filter(x=>x.original_total===0).length,replayed_empty:boundaries.filter(x=>x.replayed_total===0).length,replayed_populated:boundaries.filter(x=>x.replayed_total>0).length,populated_when_evidence_available:boundaries.every(x=>x.available_observations===0||x.replayed_total>0)});
}
for(const b of bindings){const u=b.path.includes('/')?new URL(b.path,root):new URL(b.path,dir);need(hash(readFileSync(u))===b.sha256,'post-replay source drift');}
const report={schema:'are.recovery-freshness-replay/v1',status:'completed',rows,source_bindings:bindings,implementation_sha256:hash(readFileSync(new URL(import.meta.url))),controller_sha256:hash(readFileSync(new URL('recovery-freshness.mjs',dir))),model_calls:0,provider_tokenizer_calls:0,reference_access:false,limitations:['Synthetic byte-based page measurement is not provider-token admission.','No model response was generated or reused to simulate behavior under the changed prompt.','No refresh/opening actions are simulated; only empty auto-refresh and newer-evidence notice.','Existing exposed development histories; not independent confirmation.'],campaign_goal_achieved:false,open_questions_ref:'RECOVERY-FRESHNESS.md'};
const serialized=JSON.stringify(report,null,2)+'\n';need(Buffer.byteLength(serialized)<1048576,'output cap');const output=process.argv[2]??'FRESHNESS-REPLAY.json';need(/^FRESHNESS-REPLAY(?:-R[1-9][0-9]*)?\.json$/.test(output),'output name');writeFileSync(new URL(output,dir),serialized,{flag:'wx'});
console.log(JSON.stringify(rows.map(({task_id,original_empty,replayed_empty,replayed_populated,populated_when_evidence_available})=>({task_id,original_empty,replayed_empty,replayed_populated,populated_when_evidence_available}))));
