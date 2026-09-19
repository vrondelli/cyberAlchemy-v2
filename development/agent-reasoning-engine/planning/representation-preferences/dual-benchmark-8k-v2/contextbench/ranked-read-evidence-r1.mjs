// Persist provenance by reference, not duplicate full source per call.
// Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
import {createHash} from 'node:crypto';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {validateRankedReadResult} from './ranked-read-acquisition-tool-r2.mjs';
const hash=x=>createHash('sha256').update(typeof x==='string'?x:stable(x)).digest('hex');
const need=(v,m)=>{if(!v)throw Error('ranked-evidence.'+m);};
function indexDigest(expected){
 need(expected?.files instanceof Map,'expected-index');
 return hash({...expected,files:[...expected.files].sort(([a],[b])=>a<b?-1:a>b?1:0)});
}
export function createRankedReadEvidenceRecord(evidence){
 const {call,result,hints,expected,sources}=evidence;
 const args=JSON.parse(call.function.arguments);
 validateRankedReadResult({call,args,result,hints,expected,sources});
 const paths=[...new Set(result.output.observations.map(o=>o.path))].sort();
 const record={schema:'are.ranked-read-evidence/v1',call:structuredClone(call),result:structuredClone(result),hints:structuredClone(hints),expected_sha256:indexDigest(expected),source_refs:paths.map(path=>({path,sha256:hash(sources.get(path))})),authority_effect:'none'};
 return {...record,record_sha256:hash(record)};
}
export function restoreRankedReadEvidence(record,{expected,sources}){
 need(record&&typeof record==='object'&&!Array.isArray(record),'record');
 const {record_sha256,...body}=record;
 need(record_sha256===hash(body)&&body.schema==='are.ranked-read-evidence/v1','record-digest');
 need(body.expected_sha256===indexDigest(expected)&&sources instanceof Map,'index-binding');
 need(Array.isArray(body.source_refs),'source-refs');
 for(const ref of body.source_refs)need(typeof sources.get(ref.path)==='string'&&hash(sources.get(ref.path))===ref.sha256,'source-binding');
 const evidence={call:structuredClone(body.call),result:structuredClone(body.result),hints:structuredClone(body.hints),expected,sources};
 need(stable(createRankedReadEvidenceRecord(evidence))===stable(record),'canonical-record');
 return evidence;
}
export function restoreRankedReadEvidenceMap(records,context){
 need(Array.isArray(records),'records');const map=new Map();
 for(const record of records){const e=restoreRankedReadEvidence(record,context);need(!map.has(e.call.id),'duplicate-call');map.set(e.call.id,e);}
 return map;
}
