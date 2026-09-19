// Label-free facet generation followed by exposed-cohort acquisition evaluation.
// No provider or model calls. Open questions: RECENT-EVIDENCE-POSTRUN-R1.md.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {join,basename} from 'node:path';
import {spawnSync} from 'node:child_process';

const here=import.meta.dirname;
const live=join(here,'recent-evidence-production-live-r1');
const read=path=>JSON.parse(readFileSync(path));
const config=read(join(here,'discovery-v1/live-config.json'));
const worker=join(here,'ranked_source_frontier_worker_r1.py');
const facets=(problem,repository,prediction)=>{
  const project=basename(repository).replace(/\.git$/,'');
  const visitedPaths=prediction.traj_data.pred_files??[],visited=visitedPaths.join(' ');
  const testTrees=[...new Set(visitedPaths.filter(path=>path.includes('/tests/')).map(path=>{
    const parts=path.split('/'),at=parts.indexOf('tests');return parts.slice(0,Math.min(parts.length-1,at+2)).join('/');
  }))].join(' ');
  return {
    task:problem,
    verification:`${problem} test tests regression fixture`,
    documentation:`${problem} documentation docs readme example`,
    cmake:`${project} cmake CMakeLists build library programs`,
    make:`${project} Makefile library programs static shared`,
    ci_package:`${project} appveyor github workflow package manifest build`,
    visited_neighborhood:`${visited} test tests fixture package integration documentation`,
    visited_test_tree:`${testTrees} test harness configuration fixture`,
  };
};

const rows=[];
for(const [index,task] of config.tasks.entries()){
  const taskInput=read(task.task_path);
  const prediction=read(join(live,'score',String(index).padStart(2,'0'),'prediction.json'));
  const queries=facets(taskInput.problem_statement,taskInput.repo_url,prediction);
  const repository=join(live,'source_root',String(index).padStart(2,'0'),'base');
  const beforeStatus=spawnSync('git',['--no-optional-locks','-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false','-C',repository,'status','--porcelain'],{encoding:'utf8',timeout:10000});
  assert.equal(beforeStatus.status,0);assert.equal(beforeStatus.stdout,'');
  const child=spawnSync(config.python,['-B',worker],{
    input:JSON.stringify({repository,base_commit:task.base_commit,queries}),
    encoding:'utf8',timeout:60000,maxBuffer:128*1024**2,
  });
  assert.equal(child.status,0,`frontier-worker-${index}`);
  const workerResult=JSON.parse(child.stdout);
  assert.equal(workerResult.ok,true);assert.equal(workerResult.model_calls,0);
  assert.equal(workerResult.post_verification_required,true);
  const status=spawnSync('git',['--no-optional-locks','-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false','-C',repository,'status','--porcelain'],{encoding:'utf8',timeout:10000});
  assert.equal(status.status,0);assert.equal(status.stdout,'');
  const head=spawnSync('git',['--no-optional-locks','-C',repository,'rev-parse','HEAD'],{encoding:'utf8',timeout:10000});
  assert.equal(head.status,0);assert.equal(head.stdout.trim(),task.base_commit);
  const results=Object.entries(workerResult.query_results).map(([facet,result])=>({
    facet,query_digest:result.query_digest,hints:result.hints,
    omitted_hints:result.omitted_hints,index_digest:workerResult.index_digest,
  }));
  const observed=new Set(prediction.traj_data.pred_steps.flatMap(step=>step.files));
  const materialized=read(join(live,'score',String(index).padStart(2,'0'),'private-source-manifest.json'));
  const missingLabeled=materialized.files.map(file=>file.path).filter(path=>!observed.has(path));
  const frontierPaths=new Set(results.flatMap(result=>result.hints.map(hint=>hint.path)));
  const acquiredMissing=missingLabeled.filter(path=>frontierPaths.has(path));
  const native=read(join(live,'score',String(index).padStart(2,'0'),'native-score.json')).native;
  const goldFiles=native.final.file.gold_size;
  const observedGold=goldFiles-missingLabeled.length;
  assert.equal(native.trajectory.steps.at(-1).coverage.file,observedGold/goldFiles);
  rows.push({task_id:task.id,instance_id:task.instance_id,facets:Object.keys(queries),
    returned_hints:results.reduce((n,result)=>n+result.hints.length,0),
    unique_hint_paths:frontierPaths.size,observed_paths:observed.size,gold_files:goldFiles,
    labeled_unvisited_paths:missingLabeled,acquired_labeled_unvisited_paths:acquiredMissing,
    trajectory_file_recall:observedGold/goldFiles,
    projected_frontier_file_recall:(observedGold+acquiredMissing.length)/goldFiles,
    query_results:results});
}
const result={schema:'are.evidence-neighborhood-frontier-replay/v6',
  mechanism:'Eight label-blind facets: task, verification, documentation, CMake/build, Make/build, CI/package, a visited-source neighborhood, and a visited test-tree neighborhood. Each uses the additive deterministic top-ten path-diverse source frontier. Facets are generated before label comparison.',
  rows,mean_trajectory_file_recall:rows.reduce((n,row)=>n+row.trajectory_file_recall,0)/rows.length,
  mean_projected_frontier_file_recall:rows.reduce((n,row)=>n+row.projected_frontier_file_recall,0)/rows.length,
  all_missing_labeled_paths_acquired:rows.every(row=>row.acquired_labeled_unvisited_paths.length===row.labeled_unvisited_paths.length),
  provider_calls:0,model_calls:0,
  claim_ceiling:'Exposed-cohort path-acquisition replay only. A returned hint is not delivered evidence, model use, exact-span retrieval, native quality, token savings, or untouched confirmation.',
  open_questions_ref:'RECENT-EVIDENCE-POSTRUN-R1.md'};
const output=join(here,'EVIDENCE-NEIGHBORHOOD-FRONTIER-REPLAY-R6.json');
writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({rows:rows.map(row=>({task_id:row.task_id,missing:row.labeled_unvisited_paths,acquired:row.acquired_labeled_unvisited_paths,before:row.trajectory_file_recall,after:row.projected_frontier_file_recall,hints:row.returned_hints})),mean_before:result.mean_trajectory_file_recall,mean_after:result.mean_projected_frontier_file_recall,all_missing_acquired:result.all_missing_labeled_paths_acquired,provider_calls:0,model_calls:0}));
