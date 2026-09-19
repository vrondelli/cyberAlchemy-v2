// Open questions: RANKED-READ-PROJECTION-R1.md.
import {createHash} from 'node:crypto';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {validateRankedReadResult} from './ranked-read-acquisition-tool-r2.mjs';
import {recoveryName} from './bounded-archive-frontier-recovery-r1.mjs';
const hash=x=>createHash('sha256').update(stable(x)).digest('hex');
const need=(v,m)=>{if(!v)throw Error('ranked-projection.'+m);};
export function projectRankedRead({evidence,keep}){
 const {call,result,hints,expected,sources}=evidence,args=JSON.parse(call.function.arguments);
 validateRankedReadResult({call,args,result,hints,expected,sources});
 const observations=result.output.observations;
 need(Number.isSafeInteger(keep)&&keep>=0&&keep<=observations.length,'prefix');
 if(keep===observations.length)return structuredClone(result);
 const archive_sha256=hash(result);
 const deferred={archive_sha256,omitted_units:observations.length-keep,delivery:'unconfirmed',source_revision:'base',archive_recovery:{tool:recoveryName,archive_sha256,observation_indices:observations.slice(keep).map((_,i)=>keep+i),observations:observations.slice(keep).map((o,i)=>({observation_index:keep+i,path:o.path,revision:o.source_revision,start_line:o.start_line,line_count:o.end_line-o.start_line+1}))}};
 if(keep===0)return {ok:false,error:'output-deferred-by-aggregate-request-limit',deferred};
 return {ok:true,output:{...structuredClone(result.output),observations:structuredClone(observations.slice(0,keep))},deferred};
}
export function validateRankedReadView({call,result,evidence}){
 need(evidence&&stable(call)===stable(evidence.call),'call-binding');
 const keep=result?.ok===true?result.output?.observations?.length:0;
 need(stable(result)===stable(projectRankedRead({evidence,keep})),'view-binding');
 need(Buffer.byteLength(stable(result))<=8192,'view-byte-limit');
 return result;
}
