#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
const repo=resolve(here,'../../../../..');
const manifestPath=resolve(here,'manifest.json');
const manifest=JSON.parse(readFileSync(manifestPath,'utf8'));
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const read=path=>JSON.parse(readFileSync(resolve(repo,path),'utf8'));
const checks=[];
const check=(name,ok,details={})=>checks.push({name,passed:Boolean(ok),...details});

for(const entry of manifest.files){
  const path=resolve(repo,entry.path);
  let actual=null;
  try{actual=sha(path);}catch{}
  check(`sha256:${entry.path}`,actual===entry.sha256,{expected:entry.sha256,actual});
}

const outcome=read('agent-reasoning-engine/research/contextbench-v1/round55-confirmation-outcome.json');
const closeout=read('agent-reasoning-engine/research/contextbench-v1/round55-closeout.json');
const acceptance=read('agent-reasoning-engine/research/contextbench-v1/acceptance.json');
const freeze=read('agent-reasoning-engine/research/contextbench-v1/freeze-round55-confirmation.json');
const tasks=read('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/confirmation-tasks-round55/manifest.json');
const regression=readFileSync(resolve(here,'regression.log'),'utf8');
const largerRoot=resolve(repo,'agent-reasoning-engine/research/contextbench-v1/larger-window-v1');
const largerPlan=readFileSync(resolve(largerRoot,'PLAN.md'),'utf8');
const hypotheses=JSON.parse(readFileSync(resolve(largerRoot,'hypotheses.json'),'utf8'));
const dag=JSON.parse(readFileSync(resolve(largerRoot,'dag.json'),'utf8'));
const workPlan=JSON.parse(readFileSync(resolve(largerRoot,'work-plan.json'),'utf8'));
const eq=(a,b)=>Math.abs(a-b)<1e-15;

check('round55-status',outcome.status==='complete-accounted-confirmation-passed');
check('round55-eight-complete-pairs',outcome.evaluation?.instrument?.complete_pairs===8);
check('round55-zero-censored-pairs',outcome.evaluation?.instrument?.censored_pairs===0);
check('round55-all-gates-pass',outcome.evaluation?.passed===true);
check('round55-span-f1-gain',eq(outcome.evaluation?.gains?.span_f1,0.13146573894672994));
check('round55-token-difference',outcome.model_accounting?.treatment_minus_control_conservative_tokens===-3568);
check('round55-zero-unknown-receipts',outcome.model_accounting?.exact_unknown_model_receipts===0);
check('closeout-reviewed',closeout.status==='reviewed-confirmation-pass');
check('confirmation-task-count',tasks.tasks?.length===8);
check('recorded-freeze-digest',freeze.freeze_sha256==='4d8df17a5017f5a8914be35adff6a5bd82b6f0fc0b3e04bba8b7fc1cff6edc86');
check('acceptance-window-ladder',JSON.stringify(acceptance.windows_tokens)===JSON.stringify([8000,10000,12000]));
check('acceptance-full-denominator',acceptance.scope?.full_dataset_tasks===1136);
check('normalized-8k-milestone-cleared',manifest.normalized_status?.milestone_cleared===true);
check('normalized-full-acceptance-open',manifest.normalized_status?.full_contextbench_acceptance_cleared===false);
check('no-credential-files',manifest.files.every(x=>!/(credential|secret|\.env)/i.test(x.path)));
check('raw-overclaim-recorded',manifest.known_limitations.some(x=>x.code==='RAW_BENCHMARK_CLEARED_SCOPE'));
check('release-regression-447-pass',/ℹ tests 447/.test(regression)&&/ℹ pass 447/.test(regression)&&/ℹ fail 0/.test(regression));
check('larger-plan-method-marker',largerPlan.includes('objective → gap → question → competing hypotheses → selection → experiment/tasks/criteria → results → observations → reviewed decision → successor'));
check('larger-plan-window-order',largerPlan.includes('10K')&&largerPlan.includes('12K'));
check('larger-plan-hypothesis-selected',hypotheses.selected==='LW-H1');
const bindingPath=resolve(largerRoot,hypotheses.continuity_binding.ref);
check('larger-plan-continuity-digest',sha(bindingPath)===hypotheses.continuity_binding.sha256);
const nodeIds=new Set(dag.nodes.map(x=>x.id)),adj=new Map([...nodeIds].map(x=>[x,[]]));
let dagShape=dag.edges.every(([a,b])=>nodeIds.has(a)&&nodeIds.has(b));
for(const [a,b] of dag.edges)if(adj.has(a))adj.get(a).push(b);
const seen=new Set(),active=new Set();
const visit=id=>{if(active.has(id))return false;if(seen.has(id))return true;active.add(id);for(const next of adj.get(id)??[])if(!visit(next))return false;active.delete(id);seen.add(id);return true;};
check('larger-plan-dag-acyclic',dagShape&&[...nodeIds].every(visit));
const taskIds=new Set(workPlan.tasks.map(x=>x.id));
check('larger-plan-task-dependencies-resolve',workPlan.tasks.every(x=>x.depends_on.every(id=>taskIds.has(id))));

const failed=checks.filter(x=>!x.passed);
const result={
  schema_version:'are.contextbench-8k-release-verification/v1',
  release_id:manifest.release_id,
  status:failed.length?'failed':'passed',
  checked_at:new Date().toISOString(),
  manifest_sha256:sha(manifestPath),
  checks,
  failures:failed,
  validation_scope:{
    release_regression:{tests:447,passed:447,failed:0,log_ref:'regression.log'},
    broader_workspace_audit:{tests:1183,passed:1162,failed:21,status:'failed-outside-release-scope',note:'Failures are in unrelated router/generated AlchLang and requirement-research fixtures; see release README.'}
  },
  authority_effect:'none'
};
if(process.argv.includes('--write'))writeFileSync(resolve(here,'validation.json'),JSON.stringify(result,null,2)+'\n');
process.stdout.write(JSON.stringify(result,null,2)+'\n');
if(failed.length)process.exitCode=1;
