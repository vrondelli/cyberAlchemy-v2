// Outcome-driven treatment. Open questions: REVISION-PLAN.md.
export function phaseFor(step,state,allTools) {
 const latest=state.candidates.at(-1), green=state.candidates.find(c=>c.test?.status==='passed');
 const reads=['list_files','search','read_file','read_archive'];
 let names,phase,required_candidate_id=null;
 if(green){names=['submit_patch_candidate'];phase='submit verified public-green candidate';required_candidate_id=green.candidate_id;}
 else if(step>=23){names=['report_unable'];phase='report unresolved outcome; no public-green candidate';}
 else if(latest&&!latest.test){names=['run_public_reproducer'];phase='test staged candidate immediately';required_candidate_id=latest.candidate_id;}
 else if(state.hypotheses.length<2){names=[...reads,'record_hypotheses','report_unable'];phase='inspect evidence and record competing hypotheses before staging';}
 else {names=[...reads,'record_hypotheses','report_unable'];if(state.candidates.length<2&&step<22)names.push('stage_patch_candidate');phase=latest?'public test failed: investigate the falsified prediction and revise, or report inability':'stage when evidence supports a concrete edit, or continue investigation';}
 return {phase,required_candidate_id,tools:allTools.filter(t=>names.includes(t.function.name))};
}
export function stagingFeedback(error) {
 const message=String(error?.message??error);
 return {ok:false,error:message.includes('old_text must match exactly once')?'old_text must match exactly once':message.slice(0,800),recovery:'The candidate was not staged. Read the ORIGINAL base source at the exact path; use a unique verbatim old_text and a complete replacement. If unable to construct a valid repair, call report_unable with evidence. Do not submit placeholder edits.'};
}
