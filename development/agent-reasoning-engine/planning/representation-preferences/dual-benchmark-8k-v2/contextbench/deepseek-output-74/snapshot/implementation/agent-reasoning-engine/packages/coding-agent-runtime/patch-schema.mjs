// Contract and bounds: ../../benchmarks/glm-episodes-v1/SCHEMA-RECOVERY.md
import {readFileSync} from 'node:fs';
import {isAbsolute} from 'node:path';
const deepFreeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(deepFreeze);Object.freeze(x);}return x;};
export const PATCH_SCHEMA=deepFreeze(JSON.parse(readFileSync(new URL('./schemas/patch-set-candidate.schema.json',import.meta.url),'utf8')));
export const DIAGNOSTIC_LIMITS=Object.freeze({input_bytes:1048576,depth:32,issues:64,render_bytes:16384});
const pointer=s=>String(s).replaceAll('~','~0').replaceAll('/','~1');
const issue=(path,schema,keyword,code,expected={})=>({instance_path:path,schema_path:schema,keyword,code,expected});
const keywords=new Set(['$schema','$id','type','additionalProperties','required','properties','items','minItems','maxItems','minLength','pattern','enum','x-code','x-unknown-code']);
function checkSchema(s) {
 if(!s||typeof s!=='object'||Array.isArray(s)||Object.keys(s).some(k=>!keywords.has(k)))throw Error('patch-schema.unsupported-keyword');
 if(!['object','array','string'].includes(s.type))throw Error('patch-schema.unsupported-type');
 if(s.type==='object') {if(s.additionalProperties!==false||!Array.isArray(s.required)||!s.properties||s.required.some(k=>!Object.hasOwn(s.properties,k)))throw Error('patch-schema.object-config');Object.values(s.properties).forEach(checkSchema);}
 if(s.type==='array')checkSchema(s.items);
 if(s.pattern)new RegExp(s.pattern);
}
checkSchema(PATCH_SCHEMA);
// Bounded recursive JSON parser. Duplicate decoded keys are rejected before data loss.
export function parseBoundedJSON(raw) {
 const fail=(code,path='',keyword='parse')=>{throw {diagnostic:issue(path,'',keyword,code)};};
 let text=raw;
 try {
  if(typeof raw!=='string') {
   const ancestors=new Set();let visited=0;
   const inspect=(v,d)=>{if(++visited>65536)fail('patch-set.input-limit');if(typeof v==='string'&&Buffer.byteLength(v)>DIAGNOSTIC_LIMITS.input_bytes)fail('patch-set.input-limit');if(d>DIAGNOSTIC_LIMITS.depth)fail('patch-set.depth-limit');if(v===null||typeof v==='string'||typeof v==='boolean'||typeof v==='number'&&Number.isFinite(v))return;
    if(!v||typeof v!=='object'||ancestors.has(v)||![Object.prototype,null,Array.prototype].includes(Object.getPrototypeOf(v)))fail('patch-set.json-invalid');
    ancestors.add(v);if(Reflect.ownKeys(v).some(k=>typeof k==='symbol'))fail('patch-set.json-invalid');
    for(const [k,desc] of Object.entries(Object.getOwnPropertyDescriptors(v))){if(Array.isArray(v)&&k==='length')continue;if(!desc.enumerable||!Object.hasOwn(desc,'value'))fail('patch-set.json-invalid');inspect(desc.value,d+1);}
    if(Array.isArray(v)&&(Object.keys(v).length!==v.length||Object.keys(v).some((k,i)=>k!==String(i))))fail('patch-set.json-invalid');ancestors.delete(v);
   };inspect(raw,0);text=JSON.stringify(raw);
  }
  if(typeof text!=='string'||Buffer.byteLength(text)>DIAGNOSTIC_LIMITS.input_bytes)fail('patch-set.input-limit');
  let at=0;const ws=()=>{while(/[\t\n\r ]/.test(text[at]??'!'))at++;};
  const string=()=>{const start=at++;for(;at<text.length;at++){if(text[at]==='\\'){at++;continue;}if(text[at]==='"'){at++;try{return JSON.parse(text.slice(start,at));}catch{fail('patch-set.json-invalid');}}}fail('patch-set.json-invalid');};
  const value=(depth,path)=>{if(depth>DIAGNOSTIC_LIMITS.depth)fail('patch-set.depth-limit',path);ws();const c=text[at];
   if(c==='"')return string();
   if(c==='{'||c==='['){at++;ws();const object=c==='{',close=object?'}':']',out=object?Object.create(null):[];if(text[at]===close){at++;return out;}
    while(at<text.length){let key;if(object){if(text[at]!=='"')fail('patch-set.json-invalid');key=string();if(Object.hasOwn(out,key))fail('patch-set.duplicate-key',path+'/'+pointer(key),'uniqueKeys');ws();if(text[at++]!==':')fail('patch-set.json-invalid');}else key=out.length;
     out[key]=value(depth+1,path+'/'+pointer(key));ws();if(text[at]===close){at++;return out;}if(text[at++]!==',')fail('patch-set.json-invalid');ws();}
    fail('patch-set.json-invalid');
   }
   const match=/^(?:true|false|null|-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)/.exec(text.slice(at));if(!match)fail('patch-set.json-invalid');at+=match[0].length;const parsed=JSON.parse(match[0]);if(typeof parsed==='number'&&!Number.isFinite(parsed))fail('patch-set.json-invalid');return parsed;
  };
  const parsed=value(0,'');ws();if(at!==text.length)fail('patch-set.json-invalid');return {ok:true,value:parsed};
 }catch(e){return {ok:false,issues:[e?.diagnostic??issue('','','parse','patch-set.json-invalid')],truncated:false};}
}
export function validatePatchShape(value,schema=PATCH_SCHEMA) {
 checkSchema(schema);const issues=[];let truncated=false,bytes=2;
 const add=x=>{const size=Buffer.byteLength(JSON.stringify(x))+1;if(issues.length>=DIAGNOSTIC_LIMITS.issues||bytes+size>DIAGNOSTIC_LIMITS.render_bytes){truncated=true;return;}issues.push(x);bytes+=size;};
 const walk=(v,s,path,sp,depth)=>{
  if(truncated)return;
  if(depth>DIAGNOSTIC_LIMITS.depth){add(issue(path,sp,'depth','patch-set.depth-limit'));return;}
  const type=Array.isArray(v)?'array':v===null?'null':typeof v;
  if(type!==s.type){add(issue(path,sp+'/type','type',s['x-code']??'patch-set.schema-invalid',{type:s.type}));return;}
  if(s.enum&&!s.enum.includes(v))add(issue(path,sp+'/enum','enum',s['x-code']??'patch-set.schema-invalid',{enum:s.enum}));
  if(type==='string'){if(s.minLength!==undefined&&v.length<s.minLength)add(issue(path,sp+'/minLength','minLength',s['x-code']??'patch-set.schema-invalid',{minLength:s.minLength}));if(s.pattern&&!new RegExp(s.pattern).test(v))add(issue(path,sp+'/pattern','pattern',s['x-code']??'patch-set.schema-invalid',{pattern:s.pattern}));}
  if(type==='object'){
   for(const k of s.required)if(!Object.hasOwn(v,k))add(issue(path+'/'+pointer(k),sp+'/required','required',s.properties[k]['x-code']??'patch-set.schema-invalid',{field:k,...(s.properties[k].enum?{enum:s.properties[k].enum}:{})}));
   for(const k of Object.keys(v).sort()){if(!Object.hasOwn(s.properties,k))add(issue(path+'/'+pointer(k),sp+'/additionalProperties','additionalProperties',s['x-unknown-code']??s['x-code']??'patch-set.schema-invalid',{allowed:false}));else walk(v[k],s.properties[k],path+'/'+pointer(k),sp+'/properties/'+pointer(k),depth+1);}
  }
  if(type==='array'){for(const k of ['minItems','maxItems'])if(s[k]!==undefined&&(k==='minItems'?v.length<s[k]:v.length>s[k]))add(issue(path,sp+'/'+k,k,s['x-code']??'patch-set.schema-invalid',{[k]:s[k]}));for(let i=0;i<v.length&&!truncated;i++)walk(v[i],s.items,path+'/'+i,sp+'/items',depth+1);}
 };
 walk(value,schema,'','',0);
 return {ok:issues.length===0&&!truncated,issues,truncated};
}
export function diagnosePatch(raw) {
 const parsed=parseBoundedJSON(raw);if(!parsed.ok)return {...parsed,reason_codes:[...new Set(parsed.issues.map(x=>x.code))]};
 const diagnostic=validatePatchShape(parsed.value),issues=[...diagnostic.issues];let truncated=diagnostic.truncated;
 const add=x=>{if(issues.length>=DIAGNOSTIC_LIMITS.issues||Buffer.byteLength(JSON.stringify([...issues,x]))>DIAGNOSTIC_LIMITS.render_bytes){truncated=true;return;}issues.push(x);};
 const paths=new Set();
 if(Array.isArray(parsed.value?.changes))for(const [i,c] of parsed.value.changes.entries())if(c&&typeof c.path==='string'){
  if(isAbsolute(c.path)||c.path.includes('\0')||c.path.split(/[\\/]/u).includes('..'))add(issue('/changes/'+i+'/path','/bindings/path','binding','patch-set.path-invalid'));
  if(paths.has(c.path))add(issue('/changes/'+i+'/path','/bindings/uniquePaths','binding','patch-set.path-duplicate'));paths.add(c.path);
 }
 return {ok:issues.length===0&&!truncated,value:parsed.value,issues,truncated,reason_codes:[...new Set([...issues.map(x=>x.code),...(truncated?['patch-set.diagnostics-truncated']:[])])].sort()};
}
// Provider projection strips local annotations, retaining the exact shape contract.
export function patchToolSchema(base,paths) {
 const clean=s=>Object.fromEntries(Object.entries(s).filter(([k])=>!k.startsWith('$')&&!k.startsWith('x-')).map(([k,v])=>[k,k==='properties'?Object.fromEntries(Object.entries(v).map(([n,x])=>[n,clean(x)])):k==='items'?clean(v):v]));
 const schema=clean(PATCH_SCHEMA);schema.properties.expected_base_tree_sha256.enum=[base.tree_sha256];
 const changes=schema.properties.changes;changes.maxItems=Math.min(changes.maxItems,paths.length);changes.items.properties.path.enum=[...paths];changes.items.properties.expected_file_sha256.enum=paths.map(p=>base.files[p]);return schema;
}
