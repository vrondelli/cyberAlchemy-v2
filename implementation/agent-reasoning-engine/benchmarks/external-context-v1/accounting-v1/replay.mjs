// Offline chronological replay. Open questions: PLAN.md.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {hash} from '../common.mjs';
import {retainedReasoning,reasoningEvidence} from './accounting.mjs';
const root=new URL('./',import.meta.url),read=p=>JSON.parse(readFileSync(new URL(p,root)));
const paths=['../evidence/live-v2-baseline/','../evidence/live-v3-payload/','../recovery-v1/evidence/live/','../pressure-v1/evidence/live/'];
const runs=paths.map(path=>{
 const result=read(path+'result.json'),captures=read(path+'captures.json'),models=result.receipts.filter(r=>r.kind==='model');
 const responseFile=existsSync(new URL(path+'responses.json',root));
 const messages=responseFile?read(path+'responses.json').map(r=>r.message):read(path+'state/checkpoint.json').history.filter(m=>m.role==='assistant');
 const known=[],rows=[];
 for(let i=0;i<models.length;i++){
  const m=models[i];const matched=captures.filter(c=>hash({...JSON.parse(c.prompt),model:'glm-5.3-flash',stream:false,max_tokens:2048,thinking:{type:'enabled',clear_thinking:false},reasoning_effort:'low'})===m.request_sha256);if(matched.length!==1)throw Error('capture binding mismatch');
  const c=matched[0];let a,error=null;try{a=retainedReasoning(JSON.parse(c.prompt).messages,known);}catch(e){error=e.message;}
  const bound=a?result.recycling.dispatches[i].input_upper_bound+a.tokens:null;
  rows.push({turn:i+1,error,added_reservation:a?.tokens??null,old_bound:result.recycling.dispatches[i].input_upper_bound,new_bound:bound,observed_input:m.input_tokens??null,covered:Number.isInteger(m.input_tokens)&&bound!==null?m.input_tokens<=bound:null,would_require_recycling:bound!==null?bound+2048>=12000:null});
  if(messages[i]){const evidence=reasoningEvidence(messages[i],m);known.push({...m,...(evidence?{retained_reasoning:evidence}:{})});}
 }
 return {path,message_evidence:responseFile?'received responses':'completed checkpoint assistant order; terminal response unavailable',rows};
});
const rows=runs.flatMap(r=>r.rows),report={runs,requests:rows.length,with_observed_usage:rows.filter(r=>r.covered!==null).length,covered:rows.filter(r=>r.covered===true).length,uncovered:rows.filter(r=>r.covered===false).length,unknown_message_evidence:rows.filter(r=>r.error).length,additional_recycling_candidates:rows.filter(r=>r.would_require_recycling).length,limitations:['Replay only; additional recycling changes later prompts, so this does not predict new trajectories.','Timeout usage remains unknown.'],authority_effect:'none',open_questions_ref:'PLAN.md'};
writeFileSync(new URL('replay.json',root),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({...report,runs:undefined}));if(report.uncovered||report.unknown_message_evidence)process.exitCode=1;
