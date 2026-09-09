// Local admission evidence only. Open questions: ../../benchmarks/glm-episodes-v1/EXECUTION-READINESS.md
import {execFileSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import {secretResolutionFailure} from './secret-provider.mjs';
const program="import {createHash} from 'node:crypto'; process.stdout.write(createHash('sha256').update('are-readiness-v1').digest('hex'));";
import {createHash} from 'node:crypto';
const expected=createHash('sha256').update('are-readiness-v1').digest('hex');
export const READINESS_LIMITS=Object.freeze({child_probes:3,child_timeout_ms:1000,maximum_child_latency_ms:500,maximum_secret_latency_ms:1000});
// The injected callbacks are trusted tests/host adapters, never model-controlled configuration.
export async function measureExecutionReadiness({consume_secret},{execute=execFileSync,now=()=>performance.now()}={}) {
 if(typeof consume_secret!=='function')throw Error('readiness-secret-consumer-required');
 const started_at=new Date().toISOString(),children=[];
 for(let index=0;index<READINESS_LIMITS.child_probes;index++) {
  const started=now();let reason=null;
  try {
   const output=execute(process.execPath,['--permission','--max-old-space-size=64','--input-type=module','-e',program],{env:{},encoding:'utf8',timeout:1000,maxBuffer:1024,stdio:['ignore','pipe','pipe']});
   if(output!==expected)reason='unexpected-output';
  }catch(error){reason=error?.code==='ETIMEDOUT'?'child-timeout':'child-execution-failed';}
  const elapsed_ms=Math.max(0,now()-started);
  if(!Number.isFinite(elapsed_ms)||elapsed_ms>READINESS_LIMITS.maximum_child_latency_ms)reason??='child-latency';
  children.push({index,elapsed_ms,reason,passed:reason===null});
 }
 // No credential access when the cheap execution probes already fail.
 let secret={attempted:false,passed:false,elapsed_ms:null,reason:null};
 if(children.every(c=>c.passed)) {
  const started=now();let reason=null;
  try {await consume_secret();}catch(error){reason=secretResolutionFailure(error);}
  const elapsed_ms=Math.max(0,now()-started);
  if(!Number.isFinite(elapsed_ms)||elapsed_ms>READINESS_LIMITS.maximum_secret_latency_ms)reason??='secret-latency';
  secret={attempted:true,passed:reason===null,elapsed_ms,reason};
 }
 return {schema_version:'are.execution-readiness/v1',ready:children.every(c=>c.passed)&&secret.passed,limits:READINESS_LIMITS,started_at,children,secret,automatic_retries:0,authority_effect:'none'};
}
