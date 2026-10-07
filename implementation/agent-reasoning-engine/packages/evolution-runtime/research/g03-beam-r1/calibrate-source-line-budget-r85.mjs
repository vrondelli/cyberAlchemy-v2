// Full8 archived outputs; no new providers, no repaired historical gate.
// Open Questions: evidence/G03-SOURCE-LINE-INSERT-BUDGET-R85.json.
import{readFileSync,writeFileSync,existsSync}from'node:fs';import{join,dirname}from'node:path';import{fileURLToPath}from'node:url';import{createHash}from'node:crypto';import{decodeAndProjectLineNote}from'./source-line-insert-budget-r85.mjs';
const base='/home/vlad_/are-benchmark-archive/g03-source-line-insert-pilot-r84-20261006',run=join(base,'provider-run'),out=join(base,'BUDGET-CALIBRATION-R85.json'),here=dirname(fileURLToPath(import.meta.url));
const bytes=p=>readFileSync(p),sha=x=>createHash('sha256').update(x).digest('hex'),read=p=>JSON.parse(bytes(p)),need=(v,r)=>{if(!v)throw Error('line-budget-calibration.'+r);};
need(!existsSync(out),'no-overwrite');const resultBytes=bytes(join(run,'RESULT.json'));
need(sha(resultBytes)==='cd22a4fa05e934f6ab0af30cdb4a84c7046dfa3f5fb2351fc89ef4ddeda4902c','original-result');
const result=JSON.parse(resultBytes),freeze=read(join(run,'FREEZE.json')),packetBytes=bytes(join(base,'PACKETS.json'));
need(result.rows.length===8&&sha(packetBytes)===freeze.packets_sha256,'full8-source');
const rows=[];
for(const[i,p]of JSON.parse(packetBytes).packets.entries()){
 const replyBytes=bytes(join(run,'requests',(i+1)+'-generate-REPLY.json')),reply=JSON.parse(replyBytes);let metadata=null,error=null;
 try{need(reply.status===200&&reply.public_response.finish_reason==='stop','public-response');metadata=decodeAndProjectLineNote(p,reply.public_response.message.content);}catch(e){error=String(e.message).replace(/[^A-Za-z0-9_.:-]/g,'').slice(0,100);}
 rows.push({ordinal:i+1,trajectory_id:p.trajectory_id,original_valid:result.rows[i].valid,projected_valid:!!metadata,error,reply_sha256:sha(replyBytes),metadata});
}
const report={status:'posthoc-source-only-budget-calibration',original_result_sha256:sha(resultBytes),packets_sha256:sha(packetBytes),source_sha256:Object.fromEntries(['calibrate-source-line-budget-r85.mjs','source-line-insert-budget-r85.mjs','source-line-insert-note-r84.mjs'].map(n=>[n,sha(bytes(join(here,n)))])),rows,original_valid_notes:7,projected_valid_notes:rows.filter(r=>r.projected_valid).length,full_cohort_size:8,new_provider_calls:0,original_r84_result_changed:false,claim_ceiling:'Post-hoc proposal/presentation source calibration only, not prospective qualification, semantic/source-reach improvement, reader admission or superiority.',authority_effect:'none',open_questions_owner:'G03-SOURCE-LINE-INSERT-BUDGET-R85.json'};
writeFileSync(out,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({status:report.status,projected_valid_notes:report.projected_valid_notes,original_valid_notes:7,new_provider_calls:0,sha256:sha(bytes(out))}));
