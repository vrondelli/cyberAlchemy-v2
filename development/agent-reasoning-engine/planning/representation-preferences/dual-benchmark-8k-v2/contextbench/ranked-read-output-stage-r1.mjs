// Exact tokenizer-only final stage. Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
import {readFileSync,realpathSync,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {verifyCandidateSources,fileHash} from './candidate-only-source-freeze.mjs';
import {loadRankedOutputDonor} from './ranked-read-output-donor-r1.mjs';
import {qualifyRankedOutputCampaign} from './ranked-read-output-campaign-r1.mjs';
import {verifyRankedReadAcquisitionSchedule} from './ranked-read-acquisition-schedule-r1.mjs';
import {createStageOutputGuard} from './comparison-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
import {guardStorage} from '../storage-host-small-run.mjs';
const need=(v,m)=>{if(!v)throw Error('catalog-final-stage.'+m);};
export const OUTPUT_STAGE_BYTES=64*1024**2;
export function verifyRankedOutputFreeze({manifest_path,manifest_sha256}){
 need(fileHash(manifest_path)===manifest_sha256,'manifest-drift');
 const f=JSON.parse(readFileSync(manifest_path));
 need(f.schema==='are.ranked-read-output-stage-freeze/v1','schema');
 const c=import.meta.dirname,entries=['ranked-read-output-stage-r1.mjs','ranked-read-output-worker-r1.mjs','ranked-read-output-process-r1.mjs'].map(n=>join(c,n));
 entries.push(realpathSync('/usr/bin/python3'),...['ranked_source_supervisor_r1.py','ranked_source_worker_r2.py','ranked_source_hints_r3.py'].map(n=>join(c,n)),process.execPath,f.request.sources.config_path,f.request.sources.cohort_path,f.request.credential_path,f.request.binding.provenance.path);
 verifyCandidateSources(f.files,entries);
 const pins=new Map(f.files.map(b=>[b.path,b.sha256]));
 verifyRankedReadAcquisitionSchedule({schedule:f.request.schedule,...f.request.sources});
 need(f.request.schedule.fresh_control_runs===false,'no-controls');
 const donors=f.request.schedule.slots.map(slot=>loadRankedOutputDonor({stage:f.request.donor_stage,review_sha256:f.request.donor_review_sha256,sequence:slot.sequence,candidate_slot:slot}));
 for(const d of donors)for(const b of d.source_bindings)need(pins.get(b.path)===b.sha256,'donor-binding');
 need(Array.isArray(f.reviews)&&f.reviews.length>=3,'reviews');
 for(const path of f.reviews){
  need(pins.has(resolve(path)),'review-binding');const review=JSON.parse(readFileSync(path));
  need(review.approved===true&&review.findings.length===0,'construction-review');
  for(const b of review.source_bindings)need(pins.get(resolve(b.path))===b.sha256,'review-source-binding');
 }
 return f;
}
export async function runRankedOutputStage(args,{host_guard=guardStorage}={}){
 const f=verifyRankedOutputFreeze(args),request=f.request,root=resolve(request.out);
 need(realpathSync(root)===root&&readdirSync(root).length===0,'fresh-root');
 const guard=createStageOutputGuard({root,maximum_bytes:OUTPUT_STAGE_BYTES});
 const persistence=createStagePersistence({stage_root:root,stage_guard:guard});
 const before_measure=()=>{
  const state=guard.snapshot();need(!state.poisoned,'poisoned-storage');
  need(host_guard({binding:request.binding,output:root,growth_reservation_bytes:Math.max(0,OUTPUT_STAGE_BYTES-state.bytes)}).admitted===true,'host-storage');return true;
 };
 before_measure();let report;
 try{
  report=await qualifyRankedOutputCampaign({...request,persistence,signal:args.signal,before_measure});
  verifyRankedOutputFreeze(args);before_measure();return report;
 }catch(error){
  if(!error.result&&report)error.result={...report,qualified:false,postcheck_error:String(error.message)};
  throw error;
 }
}
