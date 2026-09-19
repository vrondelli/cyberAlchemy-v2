// Evaluator-only bridge. Open questions: SCORER-BRIDGE-BOUNDED-V4.md.
import {spawn} from 'node:child_process';import {readFileSync,existsSync} from 'node:fs';import {resolve,join} from 'node:path';import {createHash} from 'node:crypto';
import {materializeExactBlobs,cleanupMaterialized} from './sparse-scorer-source.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
/** No writable host mount/network namespace; bounded private pipes, whole-group kill. */
export function runReadOnlyPython({python,args,timeout_ms=180000,maximum_stdout=1048576,maximum_stderr=1048576}){
 if(!Number.isSafeInteger(timeout_ms)||timeout_ms<1||timeout_ms>180000||![maximum_stdout,maximum_stderr].every(n=>Number.isSafeInteger(n)&&n>0&&n<=1048576))throw Error('scorer-sandbox.limits');
 const command=['--unshare-all','--die-with-parent','--ro-bind','/','/','--dev-bind','/dev/null','/dev/null','--proc','/proc','--clearenv','--setenv','PATH','/usr/bin:/bin','--setenv','HOME',process.env.HOME,'--setenv','PYTHONDONTWRITEBYTECODE','1','--setenv','GIT_NO_LAZY_FETCH','1','--setenv','GIT_OPTIONAL_LOCKS','0','--setenv','GIT_ALLOW_PROTOCOL','','--',python,'-B',...args];
 return new Promise((yes,no)=>{const proc=spawn('/usr/bin/bwrap',command,{stdio:['ignore','pipe','pipe'],detached:true});let out=[],outputBytes=0,errorBytes=0,failure=null;const errorHash=createHash('sha256');const kill=reason=>{failure??=reason;try{process.kill(-proc.pid,'SIGKILL');}catch{try{proc.kill('SIGKILL');}catch{}}};const timer=setTimeout(()=>kill('deadline'),timeout_ms);
  proc.stdout.on('data',chunk=>{outputBytes+=chunk.length;if(outputBytes>maximum_stdout)kill('stdout-limit');else out.push(chunk);});proc.stderr.on('data',chunk=>{errorBytes+=chunk.length;if(errorBytes>maximum_stderr)kill('stderr-limit');else errorHash.update(chunk);});proc.on('error',()=>kill('spawn-failed'));proc.on('close',code=>{clearTimeout(timer);if(failure||code!==0){no(Object.assign(Error('scorer-sandbox.'+(failure??'process-failed')),{diagnostic:{code:failure??'process-failed',exit_code:code,stdout_bytes:outputBytes,stderr_bytes:errorBytes,stderr_sha256:errorHash.digest('hex')}}));return;}yes({stdout:Buffer.concat(out),stderr_bytes:errorBytes,stderr_sha256:errorHash.digest('hex')});});
 });
}
export function safeScorerFailure(phase,error){
 const result={phase:['plan','materialize','score','persist','cleanup'].includes(phase)?phase:'persist',code:'operation-failed'};
 const d=error?.diagnostic;if(d&&['deadline','stdout-limit','stderr-limit','spawn-failed','process-failed'].includes(d.code)){result.code=d.code;result.exit_code=Number.isInteger(d.exit_code)?d.exit_code:null;for(const key of ['stdout_bytes','stderr_bytes'])if(Number.isSafeInteger(d[key])&&d[key]>=0)result[key]=d[key];if(/^[a-f0-9]{64}$/.test(d.stderr_sha256))result.stderr_sha256=d.stderr_sha256;}return result;
}
export async function scoreNativeBounded({config,prediction,directory,stage_guard,stage_root,persistence}){
 const output=resolve(directory),base=join(output,'private-base');if(existsSync(output))throw Error('scorer-bridge.single-use-directory');let score,failed=null,cleanupFailed=false,phase='persist';
 try{
  persistence.writeJson(join(output,'prediction.json'),prediction);
  const common=[join(import.meta.dirname,'score-native-bounded-v3.py'),'--upstream',config.upstream,'--manifest',config.source_manifest,'--gold',join(config.upstream,'data/full.parquet'),'--pred',join(output,'prediction.json'),'--wrapper',config.scorer,'--cache',config.scoring_cache];
  phase='plan';const planned=await runReadOnlyPython({python:config.python,args:[...common,'--phase','plan']}),plan=JSON.parse(planned.stdout);
  if(plan.schema!=='are.private-scorer-plan/v1'||plan.commit!==prediction.commit||plan.prediction_sha256!==sha(readFileSync(join(output,'prediction.json'))))throw Error('private-plan-identity');
  const task=config.tasks?.find(t=>t.id===prediction.instance_id||t.instance_id===prediction.instance_id);
  // Caller may provide a pre-bound cache explicitly; no URL-to-path or clone fallback.
  const cache=config.repository_cache??task?.repository_cache;if(typeof cache!=='string')throw Error('bound-repository-cache-required');
  phase='materialize';const material=materializeExactBlobs({repository_cache:cache,commit:plan.commit,paths:plan.paths,directory:base,stage_root,stage_guard,persistence});
  phase='persist';persistence.writeJson(join(output,'private-source-manifest.json'),material.manifest);
  phase='score';const scored=await runReadOnlyPython({python:config.python,args:[...common,'--phase','score','--base',base]});score=JSON.parse(scored.stdout);if(score.upstream_revision!==plan.upstream_revision||!score.native||score.native.error)throw Error('native-score-invalid');
  phase='persist';persistence.writeJson(join(output,'native-score.json'),score);persistence.writeJson(join(output,'audit.json'),{source_manifest_sha256:sha(readFileSync(join(output,'private-source-manifest.json'))),source_files:material.manifest.files.length,source_bytes:material.manifest.bytes,plan_stderr_bytes:planned.stderr_bytes,score_stderr_bytes:scored.stderr_bytes,authority_effect:'none'});
 }catch(error){failed=Object.assign(Error('scorer-bridge.evaluation-or-persistence-failed'),{diagnostic:safeScorerFailure(phase,error)});}
 finally{if(existsSync(base))try{cleanupMaterialized({directory:base,stage_root});}catch{cleanupFailed=true;}}
 if(failed||cleanupFailed)throw Object.assign(failed??Error('scorer-bridge.cleanup-failed'),{cleanup_failure:cleanupFailed,infrastructure_failure:true,...(!failed?{diagnostic:safeScorerFailure('cleanup',null)}:{})});return score;
}
