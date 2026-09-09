// Explicit backend. Open questions: ../../benchmarks/glm-episodes-v1/ISOLATED-VALIDATION.md
import {readFileSync,writeFileSync,mkdtempSync,chmodSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {runOwnedContainer} from './owned-container.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const config=Object.freeze({type:'container',engine:'/usr/bin/docker',image:'node@sha256:367679cf9792759492a486e4aa4b421764d71a9546a6dae8aab81a99eb797b3e',allowed_commands:['node'],timeout_ms:120000,maximum_output_bytes:131072,memory:'512m',cpus:'2',pids_limit:64});
const worker="import {readFileSync} from 'node:fs';import {validatePublicCases} from './validator.mjs';const plan=JSON.parse(readFileSync('/workspace/plan.json','utf8'));process.stdout.write(JSON.stringify(validatePublicCases({subject:'/workspace/subject.mjs',plan,child_timeout_ms:5000,batch_timeout_ms:120000})));";
const validator=readFileSync(new URL('./public-case-validation.mjs',import.meta.url));
const identity=hash(JSON.stringify({config,worker_sha256:hash(worker),validator_sha256:hash(validator)}));
export function createContainerPublicValidator({run_container=runOwnedContainer}={}) {
 return Object.freeze({id:'container-public-v1:'+identity,validate({subject,plan}) {
  const original=structuredClone(plan),mapped=structuredClone(plan),bytes=readFileSync(subject);
  if(bytes.length>65536||JSON.stringify(plan).length>131072||!Array.isArray(plan.sources)||!plan.sources.length||plan.sources.length>16||!Array.isArray(plan.checks)||!plan.checks.length||plan.checks.length>32)throw Error('container-validation-input-budget');
  const inputs=plan.sources.map((s,i)=>{const bytes=readFileSync(s.path);if(hash(bytes)!==s.sha256||bytes.length>131072)throw Error('container-validation-source-drift');return {original:s.path,name:`evidence-${i}.json`,bytes};});
  for(const [i,s] of mapped.sources.entries())s.path='/workspace/'+inputs[i].name;
  for(const c of mapped.checks)for(const ref of c.evidence){const i=inputs.findIndex(x=>x.original===ref.path);if(i<0)throw Error('container-validation-evidence-missing');ref.path='/workspace/'+inputs[i].name;}
  const root=mkdtempSync(join(tmpdir(),'are-feedback-worker-'));chmodSync(root,0o755);let execution,validation=null;
  try {
   for(const [name,value] of [['subject.mjs',bytes],['validator.mjs',validator],['worker.mjs',worker],['plan.json',JSON.stringify(mapped)],...inputs.map(i=>[i.name,i.bytes])])writeFileSync(join(root,name),value,{flag:'wx',mode:0o444});
   execution=run_container({config,repository_root:root,command:['node','/workspace/worker.mjs']});
   if(execution.ok)try{validation=JSON.parse(execution.sandbox.stdout);}catch{}
  }finally{rmSync(root,{recursive:true,force:true});}
  if(hash(readFileSync(subject))!==hash(bytes)||inputs.some(i=>hash(readFileSync(i.original))!==hash(i.bytes)))throw Error('container-validation-input-drift');
  const valid=execution.ok&&validation?.schema_version==='are.public-case-result/v1'&&validation.subject_sha256===hash(bytes)&&validation.plan_sha256===hash(JSON.stringify(mapped))&&Array.isArray(validation.results)&&validation.results.length===plan.checks.length&&validation.results.every((r,i)=>r.id===plan.checks[i].id&&typeof r.passed==='boolean'&&['matched','output-mismatch','child-timeout','child-output-limit','invalid-or-failed-child-output','batch-deadline'].includes(r.reason)&&r.passed===(r.reason==='matched'))&&validation.ok===validation.results.every(r=>r.passed)&&validation.passed===validation.results.filter(r=>r.passed).length&&validation.total===plan.checks.length;
  const results=valid?validation.results:plan.checks.map(c=>({id:c.id,passed:false,reason:'container-validation-failed'}));
  return {schema_version:'are.public-case-result/v1',backend_id:'container-public-v1:'+identity,ok:valid&&validation.ok,subject_sha256:hash(bytes),plan_sha256:hash(JSON.stringify(original)),results,passed:results.filter(r=>r.passed).length,total:results.length,worker_validation:validation,worker_execution:execution,worker_cleanup_verified:execution.cleanup?.verified_absent===true,authority_effect:'none'};
 }});
}
