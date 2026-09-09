export {hash,score} from '../fresh-thread-transfer-v1/experiment.mjs';
import {feedbackFor as baseFeedback} from '../fresh-thread-transfer-v1/experiment.mjs';
export function feedbackFor(family,episode_ref,predecessor){
 return {...baseFeedback(family,episode_ref),...(predecessor?{revises_lesson_id:predecessor.lesson_id}:{})};
}
export function prepareArm(wrapper,arm,entry,families,controlId,history){
 const changed=wrapper.controlLearning({action:'set-mode',control_id:controlId,mode:arm==='B'?'observe':'apply-scoped'});
 if(!changed.ok)throw Error(JSON.stringify(changed));
 const state=wrapper.inspectLearningState({detail:true}),family=families.find(f=>f.id===entry.family);
 const lesson=Object.values(state.lessons).find(l=>l.preference.instruction===(family.revision?.instruction??family.instruction));
 if(!lesson)throw Error('experiment.lesson-missing');
 const input={...(entry.override?{override_lesson_ids:[lesson.lesson_id]}:{}),...(entry.invalidate?{invalidated_refs:[lesson.preference.grounding.source.request_ref]}:{})};
 const summary=['Retained product conventions. Apply only current supported conventions whose conditions match. Current explicit instructions take priority. Superseded, invalidated or overridden conventions must not guide this response.',...history.map(l=>{
  const current=state.lessons[l.lesson_id];
  const status=current.record_digest!==l.record_digest?'superseded':entry.invalidate&&l.lesson_id===lesson.lesson_id?'invalidated for this request':entry.override&&l.lesson_id===lesson.lesson_id?'overridden for this request':'current';
  return `Convention ${l.lesson_id}, revision ${l.revision}, status ${status}. Instruction: ${l.preference.instruction} Target: ${l.preference.target}. Apply when request contains all of: ${l.preference.conditions.join(', ')}. Exclude when it contains any of: ${l.preference.exclusions.join(', ')||'(none)'}. Source: ${l.preference.grounding.source.request_ref}.`;
 })].join('\n');
 return {input,additionalContext:arm==='B'?{'experiment.memory-summary':{kind:'application',value:summary}}:undefined};
}
