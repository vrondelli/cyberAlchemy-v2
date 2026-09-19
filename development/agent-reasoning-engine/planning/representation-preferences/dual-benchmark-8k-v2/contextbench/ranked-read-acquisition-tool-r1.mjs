// Source-bound candidate adapter. Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
import {createHash} from 'node:crypto';
import {stable,attachObservationHandles} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {validateHintOutput} from './ranked-source-hints-tool-r1.mjs';
import {classifySearchArguments,rankedSearchSchema} from './ranked-read-arguments-r1.mjs';
const need=(x,m)=>{if(!x)throw Error('ranked-read.'+m);};
const hash=x=>createHash('sha256').update(x).digest('hex');
const keys=(x,k)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join(',')===[...k].sort().join(',');
const nat=x=>Number.isSafeInteger(x)&&x>=0,sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
export const rankedReadTool={type:'function',function:{name:'search',description:'Search source. Default literal mode returns literal matches. Set mode ranked, revision base, path_prefix empty, offset 0 and limit 1..5 to retrieve ranked exact source windows directly.',parameters:rankedSearchSchema}};
const metadataKeys=['schema','index_digest','query_digest','partial_index','omitted_query_terms','matching_windows','available_hints','requested_limit','attempted_reads','successful_reads','returned_windows','omitted_hints','unattempted_hints','byte_omitted_windows','read_stop_code','read_stop_index'];
export function validateRankedReadResult({call,args,result}){
 need(keys(result,['ok','output'])&&result.ok===true&&keys(result.output,['observations','ranked_read']),'result-schema');
 const {observations:o,ranked_read:m}=result.output;
 need(Array.isArray(o)&&keys(m,metadataKeys),'output-schema');
 need(m.schema==='are.ranked-read/v1'&&sha(m.index_digest)&&m.query_digest===hash(stable({query:args.query}))&&typeof m.partial_index==='boolean','metadata-binding');
 for(const k of ['omitted_query_terms','matching_windows','available_hints','requested_limit','attempted_reads','successful_reads','returned_windows','omitted_hints','unattempted_hints','byte_omitted_windows'])need(nat(m[k]),'metadata-count');
 need(m.available_hints<=5&&m.available_hints<=m.matching_windows&&m.requested_limit===args.limit&&m.successful_reads<=m.attempted_reads&&m.attempted_reads<=Math.min(m.available_hints,args.limit),'read-counts');
 need(m.returned_windows===o.length&&o.length<=m.successful_reads&&m.omitted_hints===m.matching_windows-o.length&&m.unattempted_hints===m.available_hints-m.attempted_reads&&m.byte_omitted_windows===m.successful_reads-o.length,'omission-counts');
 if(m.read_stop_code===null)need(m.read_stop_index===null&&m.successful_reads===m.attempted_reads&&m.attempted_reads===Math.min(m.available_hints,args.limit),'complete-prefix');
 else need(m.read_stop_code==='read-size-limit'&&nat(m.read_stop_index)&&m.read_stop_index<5&&m.read_stop_index===m.successful_reads&&m.attempted_reads===m.successful_reads+1,'stopped-prefix');
 need(stable(attachObservationHandles(call,result))===stable(result),'handle-binding');
 need(Buffer.byteLength(stable(result))<=8192,'result-byte-limit');
 return result;
}
export function verifyRankedObservation({observation:o,hint:h,fullSource}){
 need(typeof fullSource==='string'&&Buffer.from(fullSource).toString('utf8')===fullSource&&hash(fullSource)===h.content_sha256,'snapshot-hash');
 const lines=fullSource.split('\n');if(fullSource.endsWith('\n'))lines.pop();
 need(h.end_line<=lines.length,'snapshot-range');
 const expected={path:h.path,start_line:h.start_line,end_line:h.end_line,total_lines:lines.length,utf8:lines.slice(h.start_line-1,h.end_line).join('\n'),source_sha256:h.content_sha256,source_revision:'base',base_commit:h.base_commit};
 expected.byte_count=Buffer.byteLength(expected.utf8);
 need(keys(o,Object.keys(expected))&&stable(o)===stable(expected),'source-observation');
 return o;
}
// snapshot(path,hash) must return the full source recorded by the native reader.
// Query and snapshot failures abort; only the exact native read-size error stops.
export function createRankedReadAdapter({native,source_hints,snapshot}){
 need(typeof native==='function'&&typeof snapshot==='function'&&typeof source_hints?.query==='function'&&source_hints.expected,'dependencies');
 return async function execute(call,args){
  need(typeof call?.id==='string'&&call.id.length>0&&call.function?.name==='search','actual-search-call');
  const decoded=classifySearchArguments(args);
  if(decoded.kind==='reject')return decoded.result;
  if(decoded.kind==='literal')return native('search',decoded.args);
  const hints=validateHintOutput({query:args.query,output:await source_hints.query(args.query),expected:source_hints.expected});
  const observations=[];let attempted=0,stop=null,stopIndex=null;
  for(const [i,h] of hints.hints.slice(0,args.limit).entries()){
   attempted++;
   const r=await native('read_file',{path:h.path,start_line:h.start_line,line_count:h.end_line-h.start_line+1,revision:'base'});
   if(r?.ok===false&&r.error==='repository.read-too-large-use-smaller-range'){
    need(keys(r,['ok','error']),'read-error-schema');stop='read-size-limit';stopIndex=i;break;
   }
   need(keys(r,['ok','output'])&&r.ok===true,'native-read-failed');
   observations.push(verifyRankedObservation({observation:r.output,hint:h,fullSource:await snapshot(h.path,h.content_sha256)}));
  }
  for(let n=observations.length;n>=0;n--){
   const m={schema:'are.ranked-read/v1',index_digest:hints.index_digest,query_digest:hints.query_digest,partial_index:hints.partial_index,omitted_query_terms:hints.omitted_query_terms,matching_windows:hints.matching_windows,available_hints:hints.hints.length,requested_limit:args.limit,attempted_reads:attempted,successful_reads:observations.length,returned_windows:n,omitted_hints:hints.matching_windows-n,unattempted_hints:hints.hints.length-attempted,byte_omitted_windows:observations.length-n,read_stop_code:stop,read_stop_index:stopIndex};
   const result=attachObservationHandles(call,{ok:true,output:{observations:observations.slice(0,n),ranked_read:m}});
   if(Buffer.byteLength(stable(result))<=8192)return validateRankedReadResult({call,args,result});
  }
  throw Error('ranked-read.zero-envelope-too-large');
 };
}
