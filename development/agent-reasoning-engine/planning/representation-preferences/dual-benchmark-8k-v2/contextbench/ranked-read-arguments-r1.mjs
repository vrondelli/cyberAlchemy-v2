// Candidate-only search contract. Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
import Ajv from '../../../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/node_modules/ajv/dist/ajv.js';
import {schemas} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/repository-tools.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
export const rankedSearchSchema={...structuredClone(schemas.search),properties:{...structuredClone(schemas.search.properties),mode:{enum:['literal','ranked']}}};
const rankedSchema={...structuredClone(rankedSearchSchema),properties:{...structuredClone(rankedSearchSchema.properties),revision:{const:'base'},path_prefix:{const:''},offset:{const:0},limit:{type:'integer',minimum:1,maximum:5}}};
const validate=new Ajv({strict:true,allErrors:true}).compile(rankedSchema);
const byteLength=x=>Buffer.byteLength(stable(x));
const pointer=x=>{let result='';for(const c of x){if(Buffer.byteLength(result+c)>256)break;result+=c;}return result;};
function rejection(issues){
 for(let n=Math.min(32,issues.length);n>=0;n--){
  const result={ok:false,issues:issues.slice(0,n),total_issues:issues.length,omitted_issues:issues.length-n};
  if(byteLength(result)<=8192)return result;
 }
 throw Error('ranked-read.diagnostic-envelope');
}
const issue=(code,path)=>({code,path:pointer(path)});
// Literal input is delegated unchanged except the explicit mode field. Native
// validation owns its schema/errors. No defaults, coercion, or caller mutation.
export function classifySearchArguments(args){
 if(!args||typeof args!=='object'||Array.isArray(args))return {kind:'reject',result:rejection([issue('type','')])};
 if(!Object.hasOwn(args,'mode')||args.mode==='literal'){
  const literal={...args};delete literal.mode;return {kind:'literal',args:literal};
 }
 if(args.mode!=='ranked')return {kind:'reject',result:rejection([issue('enum','/mode')])};
 let bytes;try{bytes=byteLength(args);}catch{return {kind:'reject',result:rejection([issue('json-input','')])};}
 if(bytes>8192)return {kind:'reject',result:rejection([issue('input-size','')])};
 const issues=[];
 if(!validate(args))for(const e of validate.errors){
  const field=e.keyword==='required'?e.params.missingProperty:e.keyword==='additionalProperties'?e.params.additionalProperty:null;
  const path=e.instancePath+(field===null?'':'/'+field.replaceAll('~','~0').replaceAll('/','~1'));
  issues.push(issue(e.keyword,path));
 }
 if(typeof args.query==='string'){
  if(Buffer.from(args.query).toString('utf8')!==args.query)issues.push(issue('utf8','/query'));
  if(Buffer.byteLength(args.query)>4096)issues.push(issue('byte-limit','/query'));
 }
 return issues.length?{kind:'reject',result:rejection(issues)}:{kind:'ranked',args:structuredClone(args)};
}
