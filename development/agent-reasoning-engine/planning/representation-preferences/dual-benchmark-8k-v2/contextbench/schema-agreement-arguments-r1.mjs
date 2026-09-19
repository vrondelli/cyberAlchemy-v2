// Candidate-only search contract. Open questions: RANKED-SCHEMA-AGREEMENT-PROTOCOL-R1.md.
import Ajv from '../../../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/node_modules/ajv/dist/ajv.js';
import {schemas} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/repository-tools.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const freeze=x=>{if(x&&typeof x==='object'){for(const v of Object.values(x))freeze(v);Object.freeze(x);}return x;};
// This exact object is both advertised and compiled. Provider compatibility is
// a live qualification gate; local Ajv acceptance does not prove that gate.
export const rankedSearchSchema=freeze({...structuredClone(schemas.search),
 properties:{...structuredClone(schemas.search.properties),mode:{enum:['literal','ranked']}},
 allOf:[{if:{properties:{mode:{const:'ranked'}},required:['mode']},then:{properties:{revision:{const:'base'},path_prefix:{const:''},offset:{const:0},limit:{type:'integer',minimum:1,maximum:5}}}}]});
const validate=new Ajv({strict:true,allErrors:true}).compile(rankedSearchSchema);
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
// Structural errors are separate from semantic UTF8 and byte-size checks.
export function validateSearchStructure(args){
 if(validate(args))return {ok:true};
 const issues=validate.errors.map(e=>{
  const field=e.keyword==='required'?e.params.missingProperty:e.keyword==='additionalProperties'?e.params.additionalProperty:null;
  return issue(e.keyword,e.instancePath+(field===null?'':'/'+field.replaceAll('~','~0').replaceAll('/','~1')));
 });
 return rejection(issues);
}
export function classifySearchArguments(args){
 if(args?.mode==='ranked'){
  let bytes;try{bytes=byteLength(args);}catch{return {kind:'reject',result:rejection([issue('json-input','')])};}
  if(bytes>8192)return {kind:'reject',result:rejection([issue('input-size','')])};
 }
 const structural=validateSearchStructure(args);
 if(!structural.ok)return {kind:'reject',result:structural};
 if(!Object.hasOwn(args,'mode')||args.mode==='literal'){
  const literal={...args};delete literal.mode;return {kind:'literal',args:literal};
 }
 const issues=[];
 if(Buffer.from(args.query).toString('utf8')!==args.query)issues.push(issue('utf8','/query'));
 if(Buffer.byteLength(args.query)>4096)issues.push(issue('byte-limit','/query'));
 return issues.length?{kind:'reject',result:rejection(issues)}:{kind:'ranked',args:structuredClone(args)};
}
