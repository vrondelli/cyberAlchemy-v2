import {createHash} from 'node:crypto';
export const hash=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
export function feedbackFor(family,episode_ref){return {episode_ref,quote:family.quote,instruction:family.instruction,target:'response',posture:'explicit',retention_scope:'current-product',user_selected:true,correction_kind:'new-preference',conditions:family.conditions,exclusions:family.exclusions,expected_checks:family.expected_checks};}
export function memorySummary(state){return Object.values(state.lessons).filter(l=>!state.disabled.includes(l.lesson_id)).map(l=>{
 const p=l.preference;return `Retained product convention: ${p.instruction} Applies to target ${p.target} when the current request contains all of: ${p.conditions.join(', ')}. Do not use it if the request contains any of: ${p.exclusions.join(', ')||'(none)'}. Current explicit instructions take priority.`;
}).join('\n');}
export function prepareArm(wrapper,arm,entry,families,controlId){
 const mode=arm==='A'?'off':arm==='B'?'observe':'apply-scoped';
 const changed=wrapper.controlLearning({action:'set-mode',control_id:controlId,mode});if(!changed.ok)throw Error(JSON.stringify(changed));
 const state=wrapper.inspectLearningState({detail:true});
 const family=families.find(f=>f.id===entry.family);
 const lesson=Object.values(state.lessons).find(l=>l.preference.instruction===family.instruction);
 if(!lesson)throw Error('experiment.trained-lesson-missing');
 return {input:entry.override?{override_lesson_ids:[lesson.lesson_id]}:{},additionalContext:arm==='B'?{'experiment.memory-summary':{kind:'application',value:memorySummary(state)}}:undefined};
}
export function score(text,status,rule){
 if(status!=='completed'||typeof text!=='string'||!text.trim())return {passed:false,reason:'output-unavailable'};
 const value=text.trim(),fold=value.toLowerCase();const checks=[];
 if(rule.exact)checks.push(value===rule.exact);
 for(const x of rule.includes??[])checks.push(fold.includes(x.toLowerCase()));
 for(const x of rule.excludes??[])checks.push(!fold.includes(x.toLowerCase()));
 if(rule.starts)checks.push(value.startsWith(rule.starts));if(rule.ends)checks.push(value.endsWith(rule.ends));
 if(rule.ordered){const positions=rule.ordered.map(x=>value.indexOf(x));checks.push(positions.every((x,i)=>x>=0&&(i===0||x>positions[i-1])));}
 return {passed:checks.length>0&&checks.every(Boolean),checks,evaluator:'frozen-literal-transfer/v1'};
}
