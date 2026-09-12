// Candidate workflow schemas. Open questions: README.md.
import Ajv from '../node_modules/ajv/dist/ajv.js';import {schemas as base,validateTask} from '../contract.mjs';import {parseBoundedJSON} from '../../../packages/coding-agent-runtime/patch-schema.mjs';
export {validateTask};
const s={type:'string',minLength:1,maxLength:2000};const obj=p=>({type:'object',properties:p,required:Object.keys(p),additionalProperties:false});
const id={type:'string',pattern:'^[a-f0-9]{64}$'};
export const schemas={list_files:base.list_files,search:base.search,read_file:base.read_file,read_archive:base.read_archive,
 record_hypotheses:obj({hypotheses:{type:'array',minItems:2,maxItems:3,items:obj({claim:s,evidence_refs:{type:'array',minItems:1,maxItems:6,items:s},prediction:s,falsifier:s})}}),
 stage_patch_candidate:base.submit_patch_candidate,
 run_public_reproducer:obj({candidate_id:{anyOf:[id,{const:'baseline'}]},probe_id:{const:'public-snippet-controls-v1'}}),
 report_unable:obj({reason:s,evidence_refs:{type:'array',minItems:1,maxItems:6,items:s}}),
 submit_patch_candidate:obj({candidate_id:id})};
const ajv=new Ajv({allErrors:true,strict:true}),validators=Object.fromEntries(Object.entries(schemas).map(([k,v])=>[k,ajv.compile(v)]));
export function validateArgs(name,raw){const p=parseBoundedJSON(raw);if(!p.ok)return p;const v=validators[name];if(!v)return {ok:false,issues:['unknown tool']};return v(p.value)?{ok:true,value:p.value}:{ok:false,issues:v.errors.slice(0,32).map(e=>({path:e.instancePath,message:e.message}))};}
const descriptions={report_unable:'Finish honestly without a repair when evidence or remaining budget is insufficient. Include the specific obstacle and source/test evidence. This is an unresolved outcome, not a successful patch.',list_files:'List tracked paths containing query.',search:'Search literal text in tracked files.',read_file:'Read base source by exact path and line range. Staged patches do not alter this base.',read_archive:'Read next archive page with the active stable digest and next_offset.',record_hypotheses:'Record two or three concise competing explanations with source evidence and a discriminating prediction. Do this before staging a patch.',stage_patch_candidate:'Stage complete exact replacement edits against the original base source. Nonterminal: returns candidate_id and source-only diff. At most two distinct candidates. Only read source files may change.',run_public_reproducer:'Run both the fixed asynchronous issue probe and synchronous snippet preservation control on baseline or a staged candidate. Returns runtime evidence and generated client code. At most four probe requests.',submit_patch_candidate:'Finish by submitting a staged candidate_id. Final submission does not edit or regenerate the patch.'};
export const tools=Object.entries(schemas).map(([name,parameters])=>({type:'function',function:{name,description:descriptions[name],parameters}}));
