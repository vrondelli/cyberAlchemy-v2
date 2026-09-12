// Experimental scheduling only. Open questions: PLAN.md.
import {phaseFor as baseline} from '../feedback-timing-v1/phases.mjs';
export {stagingFeedback} from '../feedback-timing-v1/phases.mjs';
export function phaseFor(step,state,allTools,policy='baseline') {
 if(!['baseline','reserved'].includes(policy))throw Error('unknown reservation policy');
 const original=baseline(step,state,allTools);
 if(policy==='baseline'||state.candidates.length||step>=22)return original;
 let names,phase;
 if(step>=10&&state.hypotheses.length<2){
  names=['record_hypotheses','report_unable'];
  phase='construction checkpoint: record concise competing hypotheses using inspected evidence, or report inability; preserve calls for a candidate and recovery';
 }else if(step>=14){
  names=['stage_patch_candidate','report_unable'];
  phase='construction checkpoint: stage a concrete candidate from inspected evidence, or report inability; remaining calls are reserved for evaluation and recovery';
 }else return original;
 return {...original,phase,tools:original.tools.filter(t=>names.includes(t.function.name))};
}
