// Hint-only contract; native reads alone earn source evidence.
// Open questions: RADICAL-SOURCE-ACQUISITION-PROTOCOL-R4.md.
import {createHash} from 'node:crypto';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
export const rankSourcesName='rank_sources';
export const rankSourcesTool={type:'function',function:{name:rankSourcesName,
 description:'Find ranked path and line-range hints in the pinned base repository, including unread files. Hints are not source observations. Use read_file with revision base to acquire evidence; index exclusions and omitted hints are explicit.',
 parameters:{type:'object',additionalProperties:false,required:['query'],properties:{query:{type:'string',maxLength:4096}}}}};
const need=(value,reason)=>{if(!value)throw Error('ranked-source-hints.'+reason);};
const digest=value=>createHash('sha256').update(stable(value)).digest('hex');
const keys=(object,names)=>object&&typeof object==='object'&&!Array.isArray(object)&&Object.keys(object).sort().join(',')===[...names].sort().join(',');
const natural=value=>Number.isSafeInteger(value)&&value>=0;
const sha=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const safePath=path=>typeof path==='string'&&path.length>0&&path.length<=4096&&!path.startsWith('/')&&!path.includes('\\')&&!path.includes('\0')&&!path.split('/').some(p=>['','.','..'].includes(p))&&Buffer.from(path).toString('utf8')===path;
export function validateRankQuery(args){
 need(keys(args,['query'])&&typeof args.query==='string','query-schema');
 need(Buffer.from(args.query).toString('utf8')===args.query&&Buffer.byteLength(args.query)<=4096,'query-byte-limit');
 return args;
}
export function validateHintOutput({query,output,expected=null}){
 validateRankQuery({query});
 need(keys(output,['schema','index_digest','query_digest','partial_index','omitted_query_terms','matching_windows','hints','omitted_hints','unreadable_matching_lines','unreadable_path_fallbacks']),'output-schema');
 need(output.schema==='are.ranked-source-hints/v1'&&sha(output.index_digest)&&output.query_digest===digest({query}),'query-index-binding');
 need(typeof output.partial_index==='boolean'&&['omitted_query_terms','matching_windows','omitted_hints','unreadable_matching_lines','unreadable_path_fallbacks'].every(k=>natural(output[k])),'output-counts');
 need(Array.isArray(output.hints)&&output.hints.length<=5&&output.matching_windows===output.hints.length+output.omitted_hints,'hint-counts');
 if(expected!==null){
  need(sha(expected.index_digest)&&/^[a-f0-9]{40}$/.test(expected.base_commit)&&expected.files instanceof Map,'expected-index');
  need(output.index_digest===expected.index_digest&&output.partial_index===expected.partial_index,'expected-index-binding');
 }
 const identities=new Set();
 for(const hint of output.hints){
  need(keys(hint,['path','base_commit','content_sha256','start_line','end_line','score_units']),'hint-schema');
  need(safePath(hint.path)&&/^[a-f0-9]{40}$/.test(hint.base_commit)&&sha(hint.content_sha256),'hint-source');
  need(natural(hint.start_line)&&hint.start_line>0&&natural(hint.end_line)&&hint.end_line>=hint.start_line&&hint.end_line-hint.start_line<40&&natural(hint.score_units)&&hint.score_units>0,'hint-range-score');
  const identity=stable([hint.path,hint.start_line,hint.end_line]);need(!identities.has(identity),'duplicate-hint');identities.add(identity);
  if(expected!==null)need(hint.base_commit===expected.base_commit&&expected.files.get(hint.path)===hint.content_sha256,'expected-source-binding');
 }
 need(Buffer.byteLength(stable(output))<=8192,'output-byte-limit');
 return output;
}
export function projectHintOutput({query,output,keep}){
 validateHintOutput({query,output});
 need(natural(keep)&&keep<=output.hints.length,'keep');
 const projected={...structuredClone(output),hints:structuredClone(output.hints.slice(0,keep)),omitted_hints:output.omitted_hints+output.hints.length-keep};
 validateHintOutput({query,output:projected});return projected;
}
