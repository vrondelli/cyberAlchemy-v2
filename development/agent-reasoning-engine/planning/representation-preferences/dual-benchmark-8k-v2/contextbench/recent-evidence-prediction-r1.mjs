// Schema-agreement candidate. Open questions: RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md.
// Reconstruct saved source evidence before evaluator access.
// Open questions: RANKED-READ-PROJECTION-R1.md.
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {exportIndependentTerminalSelection} from './ranked-read-export-r1.mjs';
import {restoreRankedReadEvidenceMap} from './ranked-read-evidence-r1.mjs';
const hash=x=>createHash('sha256').update(typeof x==='string'?x:stable(x)).digest('hex');
const need=(v,m)=>{if(!v)throw Error('ranked-prediction.'+m);};
export function restoreRankedContext({source_index,snapshots,task}){
 const v=source_index;need(v?.schema==='are.ranked-source-worker/v1'&&v.ok===true&&v.base_commit===task.base_commit,'index-identity');
 need(hash({base_commit:v.base_commit,normalizer:v.normalizer,limits:v.index_limits,manifest:v.manifest})===v.index_digest,'index-digest');
 need(Array.isArray(v.manifest?.entries),'index-entries');
 const files=new Map();let bytes=0,postings=0;
 for(const e of v.manifest.entries){
  if(e.status==='excluded'){need(typeof e.reason==='string','index-exclusion');continue;}
  need(e.status==='admitted'&&typeof e.path==='string'&&!files.has(e.path)&&/^[a-f0-9]{64}$/.test(e.content_sha256)&&Number.isSafeInteger(e.bytes)&&e.bytes>=0&&Number.isSafeInteger(e.postings)&&e.postings>=0,'index-entry');
  files.set(e.path,e.content_sha256);bytes+=e.bytes;postings+=e.postings;
 }
 need(v.manifest.admitted_files===files.size&&v.manifest.admitted_bytes===bytes&&v.manifest.postings===postings&&v.manifest.partial===v.manifest.entries.some(e=>e.status==='excluded'),'index-counts');
 need(Array.isArray(snapshots),'snapshots');const sources=new Map();
 for(const s of snapshots){need(typeof s?.utf8==='string'&&hash(s.utf8)===s.source_sha256,'snapshot-digest');if(files.get(s.path)===s.source_sha256)sources.set(s.path,s.utf8);}
 return {expected:{base_commit:v.base_commit,index_digest:v.index_digest,partial_index:v.manifest.partial,files},sources};
}
export function reconstructRankedReadPrediction({arm,result,events,snapshots,source_index,task,repoRoot}){
 need(arm==='recent-evidence-ledger'&&result?.arm===arm,'arm');
 need(result.status==='final_context_selected'&&result.native_export?.prediction&&Array.isArray(result.receipts)&&result.instance_id===task.instance_id,'completed-result');
 need(result.task_protocol==='issue-resolution-attempt-v1'&&result.phase_state?.closed===true&&Array.isArray(events),'protocol');
 assert.deepEqual(result.branches?.map(b=>b.branch_id),['q1']);
 const ranked_context=restoreRankedContext({source_index,snapshots,task});
 const records=result.branches[0].ranked_evidence_records;need(Array.isArray(records),'records');
 assert.deepEqual(events.filter(e=>e.kind==='ranked-read-evidence').map(e=>e.record),records,'ranked-prediction.persisted-records');
 const evidence=restoreRankedReadEvidenceMap(records,ranked_context);
 for(const e of evidence.values()){
  const responses=events.filter(x=>x.kind==='response-capture'&&x.phase==='discover'&&x.response_capture?.public_response?.message?.tool_calls?.some(c=>c.id===e.call.id));
  need(responses.length===1,'model-call-record');
  const capture=responses[0].response_capture,{capture_sha256,...material}=capture,r=result.receipts[capture.receipt_index];
  need(hash(material)===capture_sha256&&r?.kind==='model'&&r.dispatched===true&&r.status===200&&!r.failure_code&&hash(r)===capture.receipt_sha256&&r.request_sha256===capture.request_sha256,'model-response-binding');
  need(stable(capture.public_response.message.tool_calls.find(c=>c.id===e.call.id))===stable(e.call),'model-call-arguments');
  const outputs=events.filter(x=>x.kind==='source-tool-result'&&x.call?.id===e.call.id);
  need(outputs.length===1&&stable(outputs[0].call)===stable(e.call)&&stable(outputs[0].output)===stable(e.result),'execution-record');
  const queries=events.filter(x=>x.kind==='source-index-query'&&x.index_digest===e.hints.index_digest&&x.query_sha256===e.hints.query_digest&&x.query_result_sha256===hash(e.hints));
  need(queries.some(q=>q.model_calls===0&&q.settlement?.process_group_absent===true&&q.settlement.forced===false&&q.settlement.exit_code===0&&q.python_settlement?.process_group_absent===true&&q.python_settlement.forced===false&&q.python_settlement.exit_code===0),'index-query-record');
 }
 const end=result.branches[0].receipt_indices.at(-1)+1;need(Number.isSafeInteger(end)&&end>0&&end<result.receipts.length,'terminal-boundary');
 const packets=events.flatMap((e,i)=>e.kind==='terminal-packet'?[{e,i}]:[]);need(packets.length===1,'terminal-packet-count');
 const {e:packet,i}=packets[0],final=events.slice(i+1);
 const exported=exportIndependentTerminalSelection({joined:packet.joined,packet:packet.packet,branch_inputs:{branches:result.branches,receipts:result.receipts.slice(0,end),ranked_context},terminal_captures:final.filter(e=>e.kind==='request-capture'&&e.phase==='join').map(e=>e.capture),receipts:result.receipts,response_capture:final.filter(e=>e.kind==='response-capture'&&e.phase==='join').at(-1)?.response_capture,snapshots,task,repoRoot});
 assert.deepEqual(exported,result.exported,'ranked-prediction.episode-export');assert.deepEqual(exported,result.native_export,'ranked-prediction.saved-export');
 return {prediction:exported.prediction,selection:exported.selection,reconstructed:true,source_projection:exported.source_projection,benchmark_cleared:false};
}
