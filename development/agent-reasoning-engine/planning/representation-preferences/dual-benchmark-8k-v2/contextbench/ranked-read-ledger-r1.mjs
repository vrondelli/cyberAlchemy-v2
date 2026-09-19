import {observationItems,recoveryName} from './bounded-archive-frontier-recovery-r1.mjs';
// Candidate source adapter. Open questions: BOUNDED-ARCHIVE-FRONTIER-R1.md.
import {createHash} from 'node:crypto';
import {bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {decodeToolPayload} from './tool-payload-codec.mjs';
import {bindRankedReadDelivery as bindCompactDelivery} from './ranked-read-delivery-r2.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
const need=(v,m)=>{if(!v)throw Error(`frontier.${m}`);};
const key=o=>JSON.stringify([o.path,o.source_sha256]);
function lines(text){const result=text.split('\n');if(text.endsWith('\n'))result.pop();return result;}
function merge(ranges){const out=[];for(const [a,b] of ranges.sort((x,y)=>x[0]-y[0]||x[1]-y[1])){const last=out.at(-1);if(last&&a<=last[1]+1)last[1]=Math.max(last[1],b);else out.push([a,b]);}return out;}
export function buildCoverageLedger({captures,receipts,snapshots,ranked_evidence}){
 need(Array.isArray(snapshots),'snapshots');
 const delivery=bindCompactDelivery({captures,receipts,ranked_evidence});
 need(delivery.unmapped.length===0,'unmapped-delivery');
 const sources=new Map();
 for(const s of snapshots){need(typeof s.path==='string'&&typeof s.utf8==='string'&&hash(s.utf8)===s.source_sha256,'source-digest');sources.set(key(s),s);}
 const metadata=new Map();
 for(const request of delivery.requests){
  if(request.posture!=='confirmed-successful-request')continue;
  const body=bodyForReceipt(captures[request.capture_indices[0]].prompt,receipts[request.receipt_index]),calls=new Map();
  for(const message of body.messages){
   if(message.role==='assistant')for(const call of message.tool_calls??[])calls.set(call.id,call);
   if(message.role!=='tool')continue;
   const call=calls.get(message.tool_call_id);if(!['read_file','read-file','search',recoveryName].includes(call?.function?.name))continue;
   const result=decodeToolPayload({tool:call.function.name,payload:JSON.parse(message.content)});if(result.ok!==true)continue;
   const args=JSON.parse(call.function.arguments);
   for(const {tool_call_id,o} of observationItems(call,result)){
    const revision=o.source_revision??null;
    need(revision===null||['base','current'].includes(revision),'revision-value');
    need(revision===null||args.revision===revision,'revision-arguments');
    const value={revision,base_commit:o.base_commit??null,total_lines:o.total_lines??null};
    if(metadata.has(tool_call_id))need(JSON.stringify(metadata.get(tool_call_id))===JSON.stringify(value),'revision-replay-conflict');
    metadata.set(tool_call_id,value);
   }
  }
 }
 const groups=new Map();
 for(const o of delivery.read_observations){
  const s=sources.get(key(o));need(s,'missing-source');const sourceLines=lines(s.utf8);
  need(o.start_line>=1&&o.end_line<=sourceLines.length&&o.end_line>=o.start_line,'source-range');
  need(sourceLines.slice(o.start_line-1,o.end_line).join('\n')===o.body,'source-bytes');
  const meta=metadata.get(o.tool_call_id);need(meta,'missing-confirmed-metadata');
  need(meta.total_lines===null||meta.total_lines===sourceLines.length,'source-extent-mismatch');
  const k=JSON.stringify([o.path,o.source_sha256,meta.revision,meta.base_commit]);
  if(!groups.has(k))groups.set(k,{path:o.path,source_sha256:o.source_sha256,source_revision:meta.revision,base_commit:meta.base_commit,revision_status:meta.revision==='current'?'current at read time; later edits may differ':meta.revision==='base'?'base as declared by confirmed tool result':'revision unknown',total_lines:sourceLines.length,ranges:[],observation_ids:[]});
  const g=groups.get(k);g.ranges.push([o.start_line,o.end_line]);g.observation_ids.push(o.id);
 }
 const entries=[...groups.values()].sort((a,b)=>a.path.localeCompare(b.path)||a.source_sha256.localeCompare(b.source_sha256)).map(g=>{
  const seen=merge(g.ranges),gaps=[];let next=1;for(const [a,b] of seen){if(next<a)gaps.push([next,a-1]);next=b+1;}if(next<=g.total_lines)gaps.push([next,g.total_lines]);
  const {ranges,...rest}=g;return {...rest,seen_ranges:seen,unseen_ranges:gaps};
 });
 return {schema_version:'are.receipt-coverage-ledger/v1',entries,claim:'Confirmed visible source ranges only; unseen ranges are not relevance judgments. Source hashes and confirmed revision labels separate versions; current means current at read time, not current now.',authority_effect:'none',open_questions_ref:'BOUNDED-ARCHIVE-FRONTIER-R1.md'};
}
// Prefix selection is deterministic. Measure the complete rendered ledger, including
// omissions; final full-request admission is still required by the runtime.
export async function renderCoverageLedger({ledger,measure_tokens,maximum_tokens=384,maximum_entries=4}){
 need(Number.isSafeInteger(maximum_entries)&&maximum_entries>=0,'entry-budget');
 need(Number.isSafeInteger(maximum_tokens)&&maximum_tokens>0&&typeof measure_tokens==='function','render-budget');
 const entries=[];
 const render=()=>JSON.stringify({claim:ledger.claim,entries,omitted_entries:ledger.entries.length-entries.length});
 let text=render(),tokens=await measure_tokens(text);need(Number.isSafeInteger(tokens)&&tokens>=0,'measurement');need(tokens<=maximum_tokens,'framing-over-budget');
 for(const entry of ledger.entries.slice(0,maximum_entries)){const {observation_ids,...visible}=entry;entries.push(visible);const candidate=render(),count=await measure_tokens(candidate);need(Number.isSafeInteger(count)&&count>=0,'measurement');if(count>maximum_tokens){entries.pop();break;}text=candidate;tokens=count;}
 return {text,tokens,included_entries:entries.length,omitted_entries:ledger.entries.length-entries.length};
}
