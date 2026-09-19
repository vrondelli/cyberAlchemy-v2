// Additive query-archive production candidate. Open questions: QUERY-ARCHIVE-CANDIDATE-R1.md.
// Rebuild model-selected source before evaluator access. Open questions: COMPARISON-PREDICTION.md.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {exportTerminalEvidenceSelection} from './compact-current-v1/terminal-evidence.mjs';
import {exportIndependentTerminalSelection} from './compact-terminal-export.mjs';
import {exportIndependentTerminalSelection as exportRepairSelection} from './compact-repair-terminal-export.mjs';
const need=(v,m)=>{if(!v)throw Error('comparison-prediction.'+m);};
export function reconstructComparisonPrediction({arm,result,events,snapshots,task,repoRoot}){
 need(['query-archive'].includes(arm),'arm');
 need(result?.status==='final_context_selected'&&result.native_export?.prediction&&Array.isArray(result.receipts)&&result.instance_id===task.instance_id,'completed-result');
 need(Array.isArray(events)&&Array.isArray(snapshots),'evidence');
 for(const snapshot of snapshots)need(typeof snapshot?.utf8==='string'&&createHash('sha256').update(snapshot.utf8).digest('hex')===snapshot.source_sha256,'snapshot-digest');
 let exported;
 if(arm==='current-are'){
  const response_capture=result.response_captures?.at(-1),packet=result.terminal_evidence_presentations?.find(p=>p.request_sha256===response_capture?.request_sha256)?.packet;
  need(packet,'current-terminal-packet');
  exported=exportTerminalEvidenceSelection({...result,packet,task,source_snapshots:snapshots,response_capture},repoRoot);
  assert.deepEqual(exported.selection,result.selection,'comparison-prediction.current-selection');
 }else{
  const expected=arm==='query-archive'?['q1']:['q1','q2','q3','synthesis'];
  need(result.task_protocol==='issue-resolution-attempt-v1'&&result.phase_state?.closed===true,'repair-protocol');
  assert.deepEqual(result.branches?.map(b=>b.branch_id),expected,'comparison-prediction.branch-order');
  const end=result.branches.at(-1).receipt_indices.at(-1)+1;
  need(Number.isSafeInteger(end)&&end>0&&end<result.receipts.length,'terminal-boundary');
  const packets=events.flatMap((e,i)=>e.kind==='terminal-packet'?[{event:e,index:i}]:[]);need(packets.length===1,'terminal-packet-count');
  const {event:packet,index}=packets[0],finalEvents=events.slice(index+1);
  const terminal_captures=finalEvents.filter(e=>e.kind==='request-capture'&&e.phase==='join').map(e=>e.capture);
  const response_capture=finalEvents.filter(e=>e.kind==='response-capture'&&e.phase==='join').at(-1)?.response_capture;
  exported=(arm==='query-archive'?exportIndependentTerminalSelection:exportRepairSelection)({joined:packet.joined,packet:packet.packet,branch_inputs:{branches:result.branches,receipts:result.receipts.slice(0,end)},terminal_captures,receipts:result.receipts,response_capture,snapshots,task,repoRoot});
  assert.deepEqual(exported,result.exported,'comparison-prediction.episode-export');
 }
 assert.deepEqual(exported,result.native_export,'comparison-prediction.saved-export');
 return {prediction:exported.prediction,selection:exported.selection,reconstructed:true,source_projection:exported.source_projection,benchmark_cleared:false};
}
