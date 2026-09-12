// Public asynchronous reproducer plus synchronous preservation control.
// Open questions: CONTROLS-PLAN.md.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {fileURLToPath} from 'node:url';
import {runProbe as singleProbe} from './probe.mjs';import {hash} from '../common.mjs';
const root=fileURLToPath(new URL('./',import.meta.url));
export function combine(candidate_id,asyncReport,syncReport){
 const reports=[asyncReport,syncReport];
 if(reports.some(r=>!r.cleanup_verified))throw Error('public probe cleanup not verified');
 if(reports.some(r=>r.candidate_id!==candidate_id))throw Error('public probe candidate mismatch');
 const status=reports.every(r=>r.status==='passed')?'passed':reports.some(r=>r.status==='execution_error')?'execution_error':asyncReport.status==='intended_failure'&&syncReport.status==='passed'?'intended_failure':'failed';
 const excerpt='ASYNC REPRODUCER\n'+asyncReport.excerpt.slice(-4000)+'\nSYNC PRESERVATION CONTROL\n'+syncReport.excerpt.slice(-4000);
 return {candidate_id,probe_id:'public-snippet-controls-v1',status,checks:{async:asyncReport.status,sync:syncReport.status},log_sha256:hash(reports.map(r=>r.log_sha256)),excerpt,compiled_client:asyncReport.compiled_client,compiled_sync:syncReport.compiled_client,cleanup_verified:true,authority_effect:'none',open_questions_ref:'CONTROLS-PLAN.md'};
}
export function runProbe({candidate=null,out}){
 mkdirSync(out,{recursive:true});
 const a=singleProbe({candidate,out:out+'/async'});
 if(!a.cleanup_verified||a.status==='execution_error')throw Error('async probe infrastructure failure');
 const s=singleProbe({candidate,out:out+'/sync',fixture:root+'sync-probe'});
 const r=combine(candidate?.candidate_id??'baseline',a,s);
 writeFileSync(out+'/report.json',JSON.stringify(r,null,2)+'\n',{flag:'wx'});return r;
}
