// Entire8 public outputs; post-hoc source-only diagnostic, not repaired r82.
// Open Questions: evidence/G03-SEMANTIC-INSERT-DECODER-R83.json.
import{readFileSync,writeFileSync,existsSync}from'node:fs';import{join,dirname}from'node:path';import{fileURLToPath}from'node:url';import{createHash}from'node:crypto';
import{decodeAndBindNote}from'./semantic-insert-note-decoder-r83.mjs';
const base='/home/vlad_/are-benchmark-archive/g03-semantic-insert-pilot-r81-20261006',run=join(base,'provider-run-r82'),out=join(base,'DECODER-CALIBRATION-R83.json'),here=dirname(fileURLToPath(import.meta.url));
const sha=x=>createHash('sha256').update(x).digest('hex'),bytes=p=>readFileSync(p),read=p=>JSON.parse(bytes(p)),need=(v,r)=>{if(!v)throw Error('decoder-calibration.'+r);};
need(!existsSync(out),'no-overwrite');
const resultBytes=bytes(join(run,'RESULT.json'));need(sha(resultBytes)==='4f8a14defad00eebb53d593fa547b9caf3ab1d648836c2c7b3b8fb737e129a06','prior-result');
const result=JSON.parse(resultBytes),freeze=read(join(run,'FREEZE.json')),packetBytes=bytes(join(base,'PACKETS.json'));
need(sha(packetBytes)===freeze.packets_sha256&&result.rows.length===8,'whole8');
const packets=JSON.parse(packetBytes).packets,rows=[];
for(const[i,p]of packets.entries()){
 const replyBytes=bytes(join(run,'requests',(i+1)+'-generate-REPLY.json')),reply=JSON.parse(replyBytes);let bound=null,error=null;
 need(reply.status===200&&reply.public_response?.finish_reason==='stop','terminal-response');
 try{bound=decodeAndBindNote(p,reply.public_response.message.content);}catch(e){error=String(e.message).replace(/[^A-Za-z0-9_.:-]/g,'').slice(0,100);}
 rows.push({ordinal:i+1,trajectory_id:p.trajectory_id,raw_response_sha256:sha(replyBytes),original_valid:result.rows[i].valid,decoder_valid:!!bound,error,metadata:bound});
}
const output={status:'posthoc-source-only-decoder-calibration',prior_result_sha256:sha(resultBytes),packets_sha256:sha(packetBytes),source_sha256:Object.fromEntries(['calibrate-semantic-insert-decoder-r83.mjs','semantic-insert-note-decoder-r83.mjs','semantic-insert-note-r81.mjs'].map(n=>[n,sha(bytes(join(here,n)))])),rows,full_cohort_size:8,decoder_valid_notes:rows.filter(r=>r.decoder_valid).length,original_valid_notes:4,new_provider_calls:0,original_r82_result_changed:false,claim_ceiling:'Post-hoc metadata decoder/source quotation calibration only; no prospective qualification, semantic entailment, reader admission, answer accuracy or superiority.',authority_effect:'none',open_questions_owner:'G03-SEMANTIC-INSERT-DECODER-R83.json'};
writeFileSync(out,JSON.stringify(output,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({status:output.status,decoder_valid_notes:output.decoder_valid_notes,original_valid_notes:4,new_provider_calls:0,sha256:sha(bytes(out))}));
