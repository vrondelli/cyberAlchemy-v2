// Additive compact runtime binding. Open questions: COMPACT-RUNTIME.md.
import {bindRankedReadDelivery as bindDelivery} from './ranked-read-delivery-r2.mjs';
// Branch-aware final selection; unchanged native projection/export. Open questions: INDEPENDENT-TERMINAL-EXPORT.md.
import {createHash} from 'node:crypto';
import {bindInvestigationEvidence,verifyInvestigationJoin} from './ranked-read-evidence-join-r1.mjs';
import {buildTerminalEvidence,diagnoseTerminalEvidence,EXPANDED,EXPANDED_TOOL} from './measured-terminal-catalog-packet-r1.mjs';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {projectObservationsToBase} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/source-map.mjs';
import {diagnoseSourceSelection} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/provenance-validator.mjs';
import {exportTrajectory} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/export.mjs';
const hash=x=>createHash('sha256').update(typeof x==='string'?x:stable(x)).digest('hex');
const need=(v,m)=>{if(!v)throw Error('independent-terminal.'+m);};
export async function buildIndependentTerminalEvidence({branch_inputs,...options}){
 const joined=bindInvestigationEvidence(branch_inputs);
 const packet=await buildTerminalEvidence({...options,version:EXPANDED,reads:joined.read_observations});return {joined,packet};
}
export function exportIndependentTerminalSelection({joined,branch_inputs,packet,terminal_captures,receipts,response_capture,snapshots,task,repoRoot}){
 need(verifyInvestigationJoin(joined,branch_inputs),'join-integrity');
 need(Array.isArray(receipts)&&receipts.length>branch_inputs.receipts.length&&stable(receipts.slice(0,branch_inputs.receipts.length))===stable(branch_inputs.receipts),'receipt-prefix');
 const c=response_capture;need(c&&typeof c==='object','response-required');const {capture_sha256,...material}=c;need(hash(material)===capture_sha256,'response-integrity');
 need(Number.isSafeInteger(c.receipt_index)&&c.receipt_index>=branch_inputs.receipts.length&&c.receipt_index<receipts.length,'terminal-receipt-index');
 const receipt=receipts[c.receipt_index];need(receipt&&hash(receipt)===c.receipt_sha256&&receipt.request_sha256===c.request_sha256,'response-receipt-binding');
 need(!receipts.slice(c.receipt_index+1).some(r=>r.kind==='model'&&r.dispatched),'not-terminal-response');
 // Every post-branch model request must be bound to the separately supplied join captures.
 const terminalBinding=bindDelivery({captures:terminal_captures,receipts:receipts.slice(branch_inputs.receipts.length)});
 need(terminalBinding.unmapped.length===0&&terminalBinding.token_accounting.cost_complete&&terminalBinding.requests.every(r=>r.posture==='confirmed-successful-request'),'terminal-delivery');
 need(terminalBinding.requests.some(r=>r.receipt_index+branch_inputs.receipts.length===c.receipt_index),'terminal-request-unconfirmed');
 need(terminalBinding.read_observations.length===0,'unregistered-join-source');
 const capture=terminal_captures.find(p=>hash(stable(bodyForReceipt(p.prompt,receipt)))===c.request_sha256);need(capture,'terminal-capture');const wire=JSON.parse(capture.prompt);
 need(packet?.version===EXPANDED,'packet-version');
 need(wire.messages.some(m=>m.role==='user'&&m.content===packet.model?.text)&&wire.tools.some(t=>stable(t)===stable(packet.model?.tool)),'packet-not-delivered');
 const response=c.public_response,calls=response?.message?.tool_calls;
 need(response?.finish_reason==='tool_calls'&&receipt.finish_reason==='tool_calls'&&response.message?.role==='assistant'&&Array.isArray(calls)&&calls.length===1&&calls[0]?.function?.name===EXPANDED_TOOL&&typeof calls[0].function.arguments==='string','submission-required');
 const diagnostic=diagnoseTerminalEvidence(calls[0].function.arguments,packet);need(diagnostic.ok,'submission-schema');
 const projection=projectObservationsToBase(joined.read_observations,snapshots,repoRoot),live=new Map(joined.read_observations.map(r=>[r.id,r])),projected=new Map(projection.projections.map(p=>[p.read_id,p]));
 for(const b of packet.private.bindings){const r=live.get(b.read_id),p=projected.get(b.read_id);need(r&&r.path===b.path&&r.start_line===b.start_line&&r.end_line===b.end_line&&r.source_sha256===b.source_sha256,'packet-read-binding');need(p&&!p.unmapped_current_lines.length&&p.event_ids.length>0&&p.base_source_sha256===b.base_source_sha256&&stable(p.fragments.map(f=>({start_line:f.start,end_line:f.end})))===stable(b.base_spans),'packet-source-binding');}
 const native=diagnoseSourceSelection({raw:stable({summary:diagnostic.value.summary,context_read_ids:diagnostic.value.context_read_ids}),reads:joined.read_observations,snapshots,repoRoot});need(native.ok,'source-selection');
 const final_read_ids=native.value.context_read_ids;
 need(!projection.projections.some(p=>final_read_ids.includes(p.read_id)&&p.unmapped_current_lines.length),'selected-unmapped-lines');
 const final_event_ids=projection.projections.filter(p=>final_read_ids.includes(p.read_id)).flatMap(p=>p.event_ids);
 const exported=exportTrajectory({schema_version:'are.context-delivery-ledger/v1',instance_id:task.instance_id,repo_url:task.repo_url,commit:task.base_commit,events:projection.events,final_event_ids},repoRoot);
 return {...exported,source_projection:projection,delivery_join_sha256:joined.join_sha256,selection:{final_read_ids,summary:native.value.summary,model_context_handles:diagnostic.value.context_handles,response_capture_sha256:c.capture_sha256,terminal_submission_call_id:calls[0].id},selection_posture:'Exact terminal packet and response over independently receipt-bound branch evidence; explicit selected handles only.'};
}
