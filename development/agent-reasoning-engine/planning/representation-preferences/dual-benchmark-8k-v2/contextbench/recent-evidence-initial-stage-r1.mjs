// Tokenizer-only initial stage. Open questions: RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md.
import {readFileSync,realpathSync,readdirSync,existsSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {verifyCandidateSources,fileHash} from './candidate-only-source-freeze.mjs';
import {verifyRecentEvidenceSchedule} from './recent-evidence-schedule-r1.mjs';
import {runComparisonQualification} from './recent-evidence-qualification-process-r1.mjs';
import {guardStorage} from '../storage-host-small-run.mjs';
const need=(v,m)=>{if(!v)throw Error('ranked-initial-stage.'+m);};
export const INITIAL_GROWTH_BYTES=2*1024**3+416*1024**2;
export function verifyRankedInitialFreeze({manifest_path,manifest_sha256}){
 need(fileHash(manifest_path)===manifest_sha256,'manifest-drift');
 const f=JSON.parse(readFileSync(manifest_path)),r=f.request;
 need(f.schema==='are.recent-evidence-initial-freeze/v1','schema');
 const entries=['recent-evidence-initial-stage-r1.mjs','recent-evidence-qualification-worker-r1.mjs','recent-evidence-qualification-process-r1.mjs','ranked_source_supervisor_r1.py','ranked_source_worker_r2.py','ranked_source_hints_r3.py'].map(n=>join(import.meta.dirname,n));
 entries.push(process.execPath,realpathSync('/usr/bin/python3'),r.sources.config_path,r.sources.cohort_path,r.credential_path,r.binding.provenance.path);
 verifyCandidateSources(f.files,entries);
 const pins=new Map(f.files.map(b=>[resolve(b.path),b.sha256]));
 verifyRecentEvidenceSchedule({schedule:r.schedule,...r.sources});
 need(r.schedule.fresh_control_runs===false&&r.schedule.slots.length===4,'candidate-only');
 for(const slot of r.schedule.slots)need(pins.get(resolve(slot.task_path))===slot.task_sha256,'task-binding');
 need(Array.isArray(f.reviews)&&f.reviews.length>=3,'reviews');
 for(const p of f.reviews){
  need(pins.has(resolve(p)),'review-binding');const review=JSON.parse(readFileSync(p));
  need(review.approved===true&&review.findings.length===0,'construction-review');
  for(const b of review.source_bindings)need(pins.get(resolve(b.path))===b.sha256,'review-source-binding');
 }
 return f;
}
export async function runRankedInitialStage(args,{run=runComparisonQualification,host_guard=guardStorage}={}){
 const f=verifyRankedInitialFreeze(args),r=f.request;
 for(const p of [r.outcome_root,r.runs_root,r.metadata_root])need(realpathSync(p)===resolve(p)&&readdirSync(p).length===0,'fresh-root');
 need(!existsSync(r.source_root)&&realpathSync(dirname(r.source_root))===dirname(r.source_root),'fresh-source');
 const check=()=>{verifyRankedInitialFreeze(args);need(host_guard({binding:r.binding,output:r.metadata_root,growth_reservation_bytes:INITIAL_GROWTH_BYTES}).admitted===true,'storage');};
 check();let result;
 try{result=await run({request:r,signal:args.signal});check();return result;}
 catch(error){if(!error.result&&result)error.result={...result,qualified:false,postcheck_error:String(error.message)};throw error;}
}
