import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,chmodSync,rmSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {runOwnedContainer} from '../../packages/coding-agent-runtime/owned-container.mjs';
import {publicCheckPlan} from './public-checks.mjs';
const here=dirname(fileURLToPath(import.meta.url)),hash=x=>createHash('sha256').update(x).digest('hex');
const [outputArg]=process.argv.slice(2);if(!outputArg||process.argv.length!==3)throw Error('usage: fresh-output-directory');
const output=resolve(outputArg);mkdirSync(output,{mode:0o700});
const save=(name,value)=>writeFileSync(join(output,name),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
const config={type:'container',engine:'/usr/bin/docker',image:'node@sha256:367679cf9792759492a486e4aa4b421764d71a9546a6dae8aab81a99eb797b3e',allowed_commands:['node'],timeout_ms:120000,maximum_output_bytes:131072,memory:'512m',cpus:'2',pids_limit:64};
const runtime=resolve(here,'../../packages/coding-agent-runtime');
const sources=[fileURLToPath(import.meta.url),join(here,'public-checks.mjs'),...['owned-container.mjs','sandbox.mjs','public-case-validation.mjs'].map(p=>join(runtime,p))].map(path=>({path,sha256:hash(readFileSync(path))}));
const check=()=>{if(sources.some(s=>hash(readFileSync(s.path))!==s.sha256))throw Error('isolated-source-drift');};
const worker="import {readFileSync} from 'node:fs';import {validatePublicCases} from './validator.mjs';const plan=JSON.parse(readFileSync('/workspace/plan.json','utf8'));const result=validatePublicCases({subject:'/workspace/subject.mjs',plan,child_timeout_ms:5000,batch_timeout_ms:120000});process.stdout.write(JSON.stringify(result));";
const historical=join(here,'evidence/fixed-repeatability-2026-09-08/run'),corrected=join(here,'evidence/ready-feedback-2026-09-08/run');
const schedule=JSON.parse(readFileSync(join(historical,'result.json'))).trials.filter(t=>t.gate).map(t=>({...t,use_correction:['long-recent-1','archive-recent-2'].includes(t.id)}));
save('manifest.json',{config,sources,worker_sha256:hash(worker),schedule,maximum_containers:7,model_calls:0,authority_effect:'none',open_questions_ref:'../README.md#open-questions'});
const canaryRoot=mkdtempSync(join(tmpdir(),'are-container-canary-'));chmodSync(canaryRoot,0o755);
try {
 const canary=runOwnedContainer({config:{...config,timeout_ms:1000},repository_root:canaryRoot,command:['node','-e','setTimeout(()=>{},30000)']});save('timeout-canary.json',canary);
 if(!canary.cleanup.verified_absent||!canary.sandbox.reason_codes.includes('sandbox.command-timeout'))throw Error('isolated-cleanup-canary-failed');
}finally{rmSync(canaryRoot,{recursive:true,force:true});}
const results=[];
for(const t of schedule) {
 check();const trial=join(historical,`trial-${String(t.index).padStart(2,'0')}`),task=JSON.parse(readFileSync(join(trial,'manifest.json'))).arms[0].task;
 const candidate=t.use_correction?JSON.parse(readFileSync(join(corrected,t.id,'result.json'))).candidate:JSON.parse(readFileSync(join(trial,'candidate.json')));
 if(candidate.expected_base_tree_sha256!==task.fixture_tree_sha256||candidate.changes.length!==1||candidate.changes[0].path!=='src/subject.mjs'||candidate.changes[0].expected_file_sha256!==task.fixture_files['src/subject.mjs'])throw Error('isolated-candidate-binding');
 const plan=publicCheckPlan(t.episode,join(here,'fixtures',t.episode,'cases.json'));if(plan.sources[0].sha256!==task.fixture_files['evidence/cases.json'])throw Error('isolated-evidence-drift');
 const cases=readFileSync(plan.sources[0].path);plan.sources[0].path='/workspace/cases.json';for(const c of plan.checks)for(const ref of c.evidence)ref.path='/workspace/cases.json';
 const root=mkdtempSync(join(tmpdir(),'are-isolated-input-'));chmodSync(root,0o755);
 try {
  for(const [name,bytes] of [['subject.mjs',candidate.changes[0].utf8],['plan.json',JSON.stringify(plan)],['cases.json',cases],['validator.mjs',readFileSync(join(runtime,'public-case-validation.mjs'))],['worker.mjs',worker]])writeFileSync(join(root,name),bytes,{flag:'wx',mode:0o444});
  save(t.id+'-started.json',{candidate_sha256:hash(JSON.stringify(candidate)),plan,authority_effect:'none'});
  const execution=runOwnedContainer({config,repository_root:root,command:['node','/workspace/worker.mjs']});let validation=null;
  if(execution.ok)try{validation=JSON.parse(execution.sandbox.stdout);}catch{}
  const valid=validation?.schema_version==='are.public-case-result/v1'&&validation.subject_sha256===hash(candidate.changes[0].utf8)&&validation.plan_sha256===hash(JSON.stringify(plan));
  const row={id:t.id,use_correction:t.use_correction,passed:valid&&validation.ok===true,execution,validation};results.push(row);save(t.id+'-result.json',row);console.log(JSON.stringify({id:t.id,passed:row.passed,cleanup:execution.cleanup.verified_absent}));
  if(!execution.cleanup.verified_absent)throw Error('isolated-cleanup-unconfirmed');
 }finally{rmSync(root,{recursive:true,force:true});}
 check();
}
save('result.json',{status:'COMPLETED',target_met:results.length===6&&results.every(r=>r.passed),passed:results.filter(r=>r.passed).length,total:results.length,results,model_calls:0,authority_effect:'none',open_questions_ref:'../README.md#open-questions'});
