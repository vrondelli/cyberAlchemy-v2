// Both arms compute exactly this check; only visibility differs. Open questions: PLAN.md.
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {start,cleanup,docker,applyCandidate} from '../success-v1/container.mjs';
import {hash} from '../common.mjs';
export function checkSyntax({task,image,candidate,out}){
 mkdirSync(out,{recursive:true});const name='are108-syntax-'+randomUUID(),started=Date.now();let report,error;
 try{
  start(name,image.id);
  if(docker(['exec',name,'git','rev-parse','HEAD']).trim()!==task.base_commit)throw Error('syntax base mismatch');
  docker(['cp',fileURLToPath(new URL('./syntax.cjs',import.meta.url)),name+':/tmp/are-syntax.cjs']);
  const check=()=>JSON.parse(docker(['exec','-i',name,'node','/tmp/are-syntax.cjs'],JSON.stringify(candidate.files.map(f=>f.path)),45000));
  const base=check();if(base.status!=='valid')throw Error('base syntax not supported or invalid');
  applyCandidate(name,candidate);const checked=check();
  if(checked.files.some(f=>f.sha256!==candidate.files.find(c=>c.path===f.path)?.after_sha256))throw Error('checked source mismatch');
  report={...checked,candidate_id:candidate.candidate_id,base,checker_runtime:docker(['exec',name,'node','--version']).trim()};
 }catch(e){error=e;report={status:'execution_error',error:String(e.message).slice(0,1000),candidate_id:candidate.candidate_id};}
 finally{
  try{cleanup(name);report.cleanup_verified=true;}catch(e){error=e;report.cleanup_verified=false;}
  report.elapsed_ms=Date.now()-started;writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 }
 if(error){const e=new Error('syntax checker infrastructure: '+report.error);e.code='syntax-infrastructure';throw e;}
 return report;
}
export function diagnosticView(report){
 return {candidate_id:report.candidate_id,status:report.status,files:report.files};
}
export function stageView(candidate,report,arm){
 if(!['early','delayed'].includes(arm))throw Error('unknown feedback arm');
 return {ok:true,...candidate,syntax:arm==='early'?diagnosticView(report):{status:'pending_evaluation'}};
}
export function syntaxProbe(report){
 const syntax=diagnosticView(report),excerpt=report.files.flatMap(f=>f.diagnostics).join('\n');
 return {candidate_id:report.candidate_id,probe_id:'public-holdout-v1',status:'failed',syntax,excerpt,log_sha256:hash(excerpt),runtime_probe_executed:false};
}
