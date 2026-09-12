// Enforced finite diagnostic phases. Open questions: README.md.
export function phaseFor(step,state,allTools){
 const latest=state.candidates.at(-1);let names=null,required_candidate_id=null,phase='inspect and discriminate';
 if(step>=20){names=['submit_patch_candidate'];phase='finalize';}
 else if(latest&&!latest.test){names=['run_public_reproducer'];required_candidate_id=latest.candidate_id;phase='test staged candidate';}
 else if(latest?.test?.status==='passed'){names=['submit_patch_candidate'];required_candidate_id=latest.candidate_id;phase='finalize green candidate';}
 else if(state.hypotheses.length<2&&step>=2){names=['record_hypotheses'];phase='record competing hypotheses';}
 else if(!latest&&step>=10){names=['stage_patch_candidate'];phase='stage first candidate';}
 else if(latest&&state.candidates.length<2&&step>=18){names=['stage_patch_candidate','submit_patch_candidate'];phase='revise or finalize';}
 return {phase,required_candidate_id,tools:names?allTools.filter(t=>names.includes(t.function.name)):allTools};
}
