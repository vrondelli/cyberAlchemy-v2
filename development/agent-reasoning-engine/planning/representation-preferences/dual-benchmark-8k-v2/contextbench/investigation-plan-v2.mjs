// Questions are provisional search intent, never source evidence. Open questions: INVESTIGATION-PLAN-V2.md.
import Ajv from '../../../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/node_modules/ajv/dist/ajv.js';
import {parseBoundedJSON} from '../../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/patch-schema.mjs';
const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
const text={type:'string',minLength:1,maxLength:1000,pattern:'\\S'};
export const INVESTIGATION_PLAN_SCHEMA=freeze({type:'object',additionalProperties:false,required:['questions'],properties:{questions:{type:'array',minItems:3,maxItems:3,items:{type:'object',additionalProperties:false,required:['question','investigates'],properties:{question:text,investigates:text}}}}});
const validate=new Ajv({strict:true,allErrors:true,ownProperties:true}).compile(INVESTIGATION_PLAN_SCHEMA);
export const PLAN_POSTURE='provisional-question-text-not-source-evidence';
export function diagnoseInvestigationPlan(raw){
 const issues=[];let truncated=false,bytes=2;
 const add=x=>{const size=Buffer.byteLength(JSON.stringify(x))+1;if(issues.length>=64||bytes+size>8192){truncated=true;return;}issues.push(x);bytes+=size;};
 if(typeof raw!=='string'||Buffer.byteLength(raw)>8192)return {ok:false,issues:[{path:'',keyword:'input',code:'plan-size'}],truncated:false};
 const parsed=parseBoundedJSON(raw);
 if(!parsed.ok){for(const i of parsed.issues)add({path:i.instance_path,keyword:i.keyword,code:i.code.replace(/^patch-set\./,'plan-')});return {ok:false,issues,truncated};}
 const value=parsed.value;
 if(!validate(value))for(const e of validate.errors)add({path:e.instancePath,keyword:e.keyword,code:'plan-schema',params:e.params});
 if(Array.isArray(value?.questions)){
  const seen=new Set();for(const [i,q]of value.questions.entries())if(typeof q?.question==='string'){
   const normalized=q.question.trim().toLowerCase().replace(/\s+/g,' ');
   if(seen.has(normalized))add({path:'/questions/'+i+'/question',keyword:'uniqueQuestion',code:'duplicate-question'});seen.add(normalized);
  }
 }
 if(issues.length||truncated)return {ok:false,issues,truncated};
 return {ok:true,issues:[],truncated:false,posture:PLAN_POSTURE,questions:freeze(value.questions.map((q,i)=>({id:'q'+(i+1),question:q.question.trim(),investigates:q.investigates.trim()})))};
}
export function validateInvestigationPlan(raw){
 const diagnostic=diagnoseInvestigationPlan(raw);
 if(!diagnostic.ok)throw Object.assign(Error('independent-phase.plan-invalid'),{diagnostic});
 return diagnostic.questions;
}
