// Qualification prototype only. Open questions: TOOL-PAYLOAD-CODEC.md.
import {stable,observationMaterial} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
export const PAYLOAD_ENCODING='source-dictionary-v1';
export const PAYLOAD_GUIDE='Search results may use observation_encoding: source-dictionary-v1. Each observation source_ref indexes sources; merge that source record with the observation. derived_retrieval_handle:true means retrieval_handle is observed-read: followed by read_id. All source text and provenance fields are retained.';
const keys=['base_commit','path','source_revision','source_sha256','total_lines'];
const need=(v,m)=>{if(!v)throw Error('tool-payload.'+m);};
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const size=v=>Buffer.byteLength(stable(v));
function jsonCopy(value){
 let nodes=0,stringBytes=0;const ancestors=new Set();
 function check(v,depth){
  need(++nodes<=20000&&depth<=32,'structure-bound');
  if(typeof v==='string'){stringBytes+=Buffer.byteLength(v);need(stringBytes<=262144,'string-bound');return;}
  if(v===null||typeof v==='boolean')return;
  if(typeof v==='number'){need(Number.isFinite(v)&&!Object.is(v,-0),'json-number');return;}
  need(v&&typeof v==='object'&&!ancestors.has(v),'json-value');
  need(Array.isArray(v)?Object.getPrototypeOf(v)===Array.prototype:Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null,'json-object');
  need(Object.getOwnPropertySymbols(v).length===0,'json-symbol');ancestors.add(v);
  const descriptors=Object.getOwnPropertyDescriptors(v);
  if(Array.isArray(v)){need(Object.keys(v).length===v.length&&Object.getOwnPropertyNames(v).length===v.length+1,'dense-array');for(let i=0;i<v.length;i++){const d=descriptors[i];need(d&&Object.hasOwn(d,'value')&&d.enumerable,'json-property');check(d.value,depth+1);}}
  else for(const [key,d] of Object.entries(descriptors)){stringBytes+=Buffer.byteLength(key);need(stringBytes<=262144,'string-bound');need(Object.hasOwn(d,'value')&&d.enumerable,'json-property');check(d.value,depth+1);}
  ancestors.delete(v);
 }
 check(value,0);need(size(value)<=262144,'byte-bound');return JSON.parse(stable(value));
}
function validateObservation(o){
 need(object(o),'observation');observationMaterial('codec-validation',o);
 need(typeof o.base_commit==='string'&&o.base_commit.length>0&&o.base_commit.length<=128,'base-commit');
 need(['base','current'].includes(o.source_revision),'source-revision');
 need(Number.isSafeInteger(o.total_lines)&&o.total_lines>=o.end_line,'total-lines');
}
export function encodeToolPayload({tool,result}){
 need(typeof tool==='string','tool');const payload=jsonCopy(result),original_bytes=size(payload);need(object(payload),'result-object');
 need(!object(payload.output)||!Object.hasOwn(payload.output,'observation_encoding'),'reserved-encoding');
 if(tool!=='search'||payload.ok!==true)return {payload,encoded:false,original_bytes,payload_bytes:original_bytes};
 need(object(payload.output)&&Array.isArray(payload.output.observations),'search-shape');
 need(payload.output.observations.length<=30,'observation-bound');
 need(!Object.hasOwn(payload.output,'sources'),'reserved-sources');
 if(payload.output.observations.length===0)return {payload,encoded:false,original_bytes,payload_bytes:original_bytes};
 const sources=[],byKey=new Map();
 payload.output.observations=payload.output.observations.map(o=>{
  validateObservation(o);need(!Object.hasOwn(o,'source_ref')&&!Object.hasOwn(o,'derived_retrieval_handle'),'reserved-row');
  const source=Object.fromEntries(keys.map(k=>[k,o[k]])),key=stable(source);
  let source_ref=byKey.get(key);if(source_ref===undefined){source_ref=sources.length;byKey.set(key,source_ref);sources.push(source);}
  const row=Object.fromEntries(Object.entries(o).filter(([k])=>!keys.includes(k)));
  if(typeof row.read_id==='string'&&row.retrieval_handle==='observed-read:'+row.read_id){delete row.retrieval_handle;row.derived_retrieval_handle=true;}
  return {source_ref,...row};
 });
 payload.output.sources=sources;payload.output.observation_encoding=PAYLOAD_ENCODING;
 const payload_bytes=size(payload);need(payload_bytes<=262144,'encoded-byte-bound');
 if(payload_bytes>=original_bytes)return {payload:jsonCopy(result),encoded:false,original_bytes,payload_bytes:original_bytes};
 return {payload,encoded:true,original_bytes,payload_bytes};
}
export function decodeToolPayload({tool,payload}){
 const result=jsonCopy(payload);need(object(result),'result-object');
 if(!object(result.output)||!Object.hasOwn(result.output,'observation_encoding'))return result;
 need(tool==='search'&&result.ok===true&&result.output.observation_encoding===PAYLOAD_ENCODING,'encoding');
 const {sources,observations}=result.output;
 need(Array.isArray(sources)&&sources.length>0&&sources.length<=30&&Array.isArray(observations)&&observations.length>0&&observations.length<=30,'encoded-shape');
 for(const source of sources)need(object(source)&&Object.keys(source).sort().join(',')===[...keys].sort().join(','),'source-fields');
 result.output.observations=observations.map(o=>{
  need(object(o),'encoded-observation');
  const {source_ref,derived_retrieval_handle,...row}=o;
  need(Number.isSafeInteger(source_ref)&&source_ref>=0&&source_ref<sources.length,'source-reference');
  need(keys.every(k=>!Object.hasOwn(row,k)),'row-source-conflict');
  if(Object.hasOwn(o,'derived_retrieval_handle')){
   need(derived_retrieval_handle===true&&typeof row.read_id==='string'&&!Object.hasOwn(row,'retrieval_handle'),'derived-handle');
   row.retrieval_handle='observed-read:'+row.read_id;
  }
  const full={...sources[source_ref],...row};validateObservation(full);return full;
 });
 delete result.output.sources;delete result.output.observation_encoding;
 need(size(result)<=262144,'decoded-byte-bound');
 const canonical=encodeToolPayload({tool,result});need(canonical.encoded&&stable(canonical.payload)===stable(payload),'noncanonical-encoding');
 return result;
}
