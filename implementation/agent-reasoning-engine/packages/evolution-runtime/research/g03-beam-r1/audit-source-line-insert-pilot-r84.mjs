// Independent arithmetic and exact source-quotation reconstruction; no QA labels.
// Open Questions: evidence/G03-SOURCE-LINE-INSERT-PILOT-R84.json.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';import{join}from'node:path';import{createHash}from'node:crypto';
const base='/home/vlad_/are-benchmark-archive/g03-source-line-insert-pilot-r84-20261006',root=join(base,'provider-run');
const bytes=p=>readFileSync(p),read=p=>JSON.parse(bytes(p)),sha=x=>createHash('sha256').update(x).digest('hex');
const need=(v,r)=>{if(!v)throw Error('semantic-insert-audit.'+r);};
need(!existsSync(join(root,'AUDIT.json')),'no-overwrite');
const resultBytes=bytes(join(root,'RESULT.json')),result=JSON.parse(resultBytes),freeze=read(join(root,'FREEZE.json'));
need(result.freeze_sha256===sha(bytes(join(root,'FREEZE.json'))),'freeze-pin');
const packetBytes=bytes(join(base,'PACKETS.json')),packets=JSON.parse(packetBytes).packets;
need(sha(packetBytes)===freeze.packets_sha256&&packets.length===8&&result.full_cohort_size===8,'packet-pin');
let total=0,unknown=0,attempts=0,valid=0;const rows=[];
for(const[i,p]of packets.entries()){
 const prefix=join(root,'requests',String(i+1)),startPath=prefix+'-generate-STARTED.json',replyPath=prefix+'-generate-REPLY.json';
 if(!existsSync(startPath)){rows.push({ordinal:i+1,status:'unattempted-retained'});continue;}
 attempts++;const start=read(startPath);
 need(start.input.operation==='generate','generation-input');
 const actual=JSON.parse(start.input.messages[1].content);
 for(const key of ['trajectory_id','domain','environment','goal','action','observed_control','outcome','source_trajectory_sha256','scope'])need(JSON.stringify(actual[key])===JSON.stringify(p[key]),'actual-packet-'+key);
 need(actual.sources.length===2,'actual-sources');
 for(const[j,a]of actual.sources.entries()){
  const original=p.sources[j];need(a.source_id===original.source_id&&a.source_sha256===original.source_sha256&&a.state_index===original.state_index&&a.complete_projected_tree===true&&a.lines.map(l=>l.text).join('\n')===original.accessibility_tree,'lossless-actual-source');
  for(const[k,l]of a.lines.entries())need(l.id===a.source_id+':L'+(k+1)&&l.eligible===(l.text.length>=8&&l.text.length<=300),'actual-line-catalog');
 }
 need(start.request_sha256===freeze.ordered_requests[i].request_sha256,'request-pin');
 if(!existsSync(replyPath)){unknown++;rows.push({ordinal:i+1,status:'unknown-attempt-retained'});continue;}
 const reply=read(replyPath),known=Number.isSafeInteger(reply.prompt_tokens)&&reply.prompt_tokens>=0&&Number.isSafeInteger(reply.completion_tokens)&&reply.completion_tokens>=0&&!reply.dispatch_uncertain;
 if(!known){unknown++;rows.push({ordinal:i+1,status:'unknown-usage-retained'});continue;}
 total+=reply.prompt_tokens+reply.completion_tokens;
 const row=result.rows.find(r=>r.ordinal===i+1);
 if(!row){rows.push({ordinal:i+1,status:'failed-provider-retained'});continue;}
 need(row.trajectory_id===p.trajectory_id&&row.known_tokens===reply.prompt_tokens+reply.completion_tokens,'usage-row');
 if(row.valid){
  need(reply.status===200&&reply.public_response.finish_reason==='stop'&&reply.request_sha256===start.request_sha256,'response');
  const content=reply.public_response.message.content.trim(),fence=content.match(/^```(?:json)?[ \t]*\r?\n([\s\S]*)\r?\n```$/),raw=JSON.parse(fence?fence[1]:content),note=row.metadata;
  need(note.metadata_only&&note.semantic_support_not_certified&&note.outcome==='unverified'&&raw.title.startsWith(note.title)&&raw.summary.startsWith(note.summary)&&raw.source_line_ids.length===note.quotes.length&&note.title.length<=120&&note.summary.length<=600&&note.quotation_origin==='canonical-source-lines-not-model-text','metadata-not-certified');
  const phases=new Set();
  for(const[j,q]of note.quotes.entries()){
   const s=p.sources.find(s=>s.source_id===q.source_id),original=raw.source_line_ids[j];
   need(s&&original===q.line_id&&note.model_selected_line_ids[j]===original&&sha(s.accessibility_tree)===q.source_sha256,'source-line-id');
   const lineNumber=Number(q.line_id.split(':L')[1]),lines=s.accessibility_tree.split('\n');
   need(q.line_id===q.source_id+':L'+lineNumber&&Number.isSafeInteger(lineNumber)&&lineNumber>=1&&lineNumber<=lines.length&&q.quote===lines[lineNumber-1]&&q.start_line===lineNumber&&q.end_line===lineNumber,'line-coordinate');
   const prefix=lines.slice(0,lineNumber-1).join('\n')+(lineNumber>1?'\n':'');need(q.start_byte===Buffer.byteLength(prefix),'independent-start-byte');
   const text=Buffer.from(s.accessibility_tree),quote=Buffer.from(q.quote);
   need(text.subarray(q.start_byte,q.end_byte).equals(quote)&&q.end_byte-q.start_byte===quote.length,'exact-selected-line-byte-quotation');
   need(q.state_index===s.state_index&&q.trajectory_id===p.trajectory_id,'source-coordinates');phases.add(q.source_id);
  }
  need(phases.size===2,'both-phases');valid++;
 }
 rows.push({ordinal:i+1,trajectory_id:p.trajectory_id,valid:row.valid,known_generation_tokens:row.known_tokens,reply_sha256:sha(bytes(replyPath))});
}
need(total===result.total_known_generation_tokens&&unknown===result.unknown_generation_usage&&valid===result.valid_notes,'aggregate');
const gate=!result.error&&!result.transport_error&&attempts===8&&valid===8&&unknown===0;
need(result.status===(gate?'eight-source-line-notes-structurally-bound':'insertion-pilot-not-qualified'),'gate');
const audit={status:'independent-usage-and-source-quotation-audit-passed',result_sha256:sha(resultBytes),generation_attempts:attempts,valid_notes:valid,unknown_generation_usage:unknown,total_known_generation_tokens:total,rows,semantic_usefulness_verified:false,claim_ceiling:'Exact quotation/usage report consistency only. No independent semantic entailment, source reach, answer accuracy or superiority.',authority_effect:'none',open_questions_owner:'G03-SOURCE-LINE-INSERT-PILOT-R84.json'};
writeFileSync(join(root,'AUDIT.json'),JSON.stringify(audit,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({status:audit.status,valid_notes:valid,total_known_generation_tokens:total,sha256:sha(bytes(join(root,'AUDIT.json')))}));
