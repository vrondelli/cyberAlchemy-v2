// Symmetric workflow: feedback delivery never controls tool availability.
// Open questions: PLAN.md.
export {stagingFeedback} from '../success-v1/revision-phases.mjs';
export function phaseFor(step,state,allTools){
 const latest=state.candidates.at(-1),green=state.candidates.find(c=>c.test?.status==='passed');
 let names,phase,required_candidate_id=null;
 if(green){names=['submit_patch_candidate'];phase='submit verified public-green candidate';required_candidate_id=green.candidate_id;}
 else if(step>=23){names=['report_unable'];phase='report unresolved outcome; no public-green candidate';}
 else {
  names=['list_files','search','read_file','read_archive','record_hypotheses','report_unable'];
  if(state.hypotheses.length>=2&&state.candidates.length<2&&step<22)names.push('stage_patch_candidate');
  if(latest&&state.probe_requests<4)names.push('run_public_reproducer');
  phase=state.hypotheses.length<2?'inspect evidence and record competing hypotheses before staging':latest?'inspect available feedback, evaluate or revise the candidate, or report inability':'stage when evidence supports a concrete edit, or continue investigation';
 }
 return {phase,required_candidate_id,tools:allTools.filter(t=>names.includes(t.function.name))};
}
