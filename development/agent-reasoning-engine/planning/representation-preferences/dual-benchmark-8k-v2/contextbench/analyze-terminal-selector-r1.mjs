// Offline terminal-selection analysis over completed traces. No provider calls.
// Open questions: RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md.
import {mkdirSync,readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {scoreNativeBounded} from './packet-diversity-v1/scorer-bridge-bounded-v4.mjs';
import {createStageOutputGuard} from './packet-diversity-v1/stage-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';

const here=import.meta.dirname;
const live=join(here,'recent-evidence-production-live-r1');
const stage=join(live,'offline-terminal-selector-r1');
const read=path=>JSON.parse(readFileSync(path));
const config=read(join(here,'discovery-v1/live-config.json'));
const taskCount=4;
const historical=[
  'candidate-only-production-live-r1',
  'finding-reference-production-live-r2',
  'measured-terminal-catalog-production-live-r1',
  'ranked-read-production-live-r1',
  'ranked-source-production-live-r1',
  'receipt-budget-production-live-r2',
  'schema-agreement-production-live-r1',
  'recent-evidence-production-live-r1',
].filter(name=>readdirSync(join(here,name,'score')).includes('RESULTS.json'));

const unique=xs=>[...new Set(xs)];
function unionSpans(predictions,allowed){
  const spans={};
  for(const prediction of predictions){
    for(const [path,ranges] of Object.entries(prediction.traj_data.pred_spans??{})){
      if(allowed&&!allowed.has(path))continue;
      const rows=spans[path]??=[];
      for(const range of ranges)if(!rows.some(r=>r.start===range.start&&r.end===range.end))rows.push(range);
    }
  }
  for(const rows of Object.values(spans))rows.sort((a,b)=>a.start-b.start||a.end-b.end);
  return spans;
}
function fromSteps(base,selectionSteps,trajectorySteps,allowed){
  const predictions=selectionSteps.map(step=>({traj_data:{pred_spans:step.spans??{}}}));
  const spans=unionSpans(predictions,allowed);
  return {...base,traj_data:{pred_files:Object.keys(spans).sort(),pred_spans:spans,pred_steps:trajectorySteps}};
}
function terminal(base,predictions,trajectorySteps,allowed){
  const spans=unionSpans(predictions,allowed);
  return {...base,traj_data:{pred_files:Object.keys(spans).sort(),pred_spans:spans,pred_steps:trajectorySteps}};
}
function harmonic(metric){
  const {coverage,precision}=metric;
  return coverage+precision===0?0:2*coverage*precision/(coverage+precision);
}
function taskVariants(index){
  const current=read(join(live,'score',String(index).padStart(2,'0'),'prediction.json'));
  const base={instance_id:current.instance_id,repo_url:current.repo_url,commit:current.commit};
  const steps=current.traj_data.pred_steps??[];
  const stepPathCount=new Map();
  for(const step of steps)for(const path of unique(step.files??Object.keys(step.spans??{})))
    stepPathCount.set(path,(stepPathCount.get(path)??0)+1);
  const topStep=k=>new Set([...stepPathCount].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,k).map(x=>x[0]));
  const terminals=historical.map(name=>read(join(here,name,'score',String(index).padStart(2,'0'),'prediction.json')));
  const votes=new Map();
  for(const prediction of terminals)for(const path of unique(prediction.traj_data.pred_files??Object.keys(prediction.traj_data.pred_spans??{})))
    votes.set(path,(votes.get(path)??0)+1);
  const voted=n=>new Set([...votes].filter(([,count])=>count>=n).map(([path])=>path));
  const topVote=k=>new Set([...votes].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,k).map(x=>x[0]));
  const fileSets=terminals.map(p=>new Set(p.traj_data.pred_files??Object.keys(p.traj_data.pred_spans??{})));
  const jaccard=(a,b)=>{const intersection=[...a].filter(x=>b.has(x)).length;return intersection/(new Set([...a,...b]).size||1);};
  const medoid=terminals.map((prediction,i)=>({prediction,score:fileSets.reduce((n,set,j)=>n+(i===j?0:jaccard(fileSets[i],set)),0)})).sort((a,b)=>b.score-a.score)[0].prediction;
  return new Map([
    ['trace-union',fromSteps(base,steps,steps)],
    ['trace-suffix-8',fromSteps(base,steps.slice(-8),steps)],
    ['trace-suffix-16',fromSteps(base,steps.slice(-16),steps)],
    ['trace-top-files-2',fromSteps(base,steps,steps,topStep(2))],
    ['trace-top-files-4',fromSteps(base,steps,steps,topStep(4))],
    ['trace-top-files-6',fromSteps(base,steps,steps,topStep(6))],
    ['history-union',terminal(base,terminals,steps)],
    ['history-vote-2',terminal(base,terminals,steps,voted(2))],
    ['history-vote-3',terminal(base,terminals,steps,voted(3))],
    ['history-vote-4',terminal(base,terminals,steps,voted(4))],
    ['history-top-files-4',terminal(base,terminals,steps,topVote(4))],
    ['history-top-files-6',terminal(base,terminals,steps,topVote(6))],
    ['history-medoid',terminal(base,[medoid],steps)],
  ]);
}

mkdirSync(stage,{mode:0o700});
const guard=createStageOutputGuard({root:stage,maximum_bytes:512*1024**2});
const persistence=createStagePersistence({stage_guard:guard,stage_root:stage});
const byStrategy=new Map();
for(let task=0;task<taskCount;task++){
  for(const [strategy,prediction] of taskVariants(task)){
    const directory=join(stage,strategy,String(task).padStart(2,'0'));
    const score=await scoreNativeBounded({config,prediction,directory,stage_guard:guard,stage_root:stage,persistence});
    const span=score.native.final.span,file=score.native.final.file;
    const row={task_id:`contextbench-${task+1}`,span_f1:harmonic(span),file_f1:harmonic(file),span_coverage:span.coverage,span_precision:span.precision,file_coverage:file.coverage,file_precision:file.precision,predicted_files:prediction.traj_data.pred_files.length,predicted_ranges:Object.values(prediction.traj_data.pred_spans).reduce((n,ranges)=>n+ranges.length,0)};
    const rows=byStrategy.get(strategy)??[];rows.push(row);byStrategy.set(strategy,rows);
  }
}
const strategies=[...byStrategy].map(([strategy,rows])=>({
  strategy,rows,
  mean_span_f1:rows.reduce((n,row)=>n+row.span_f1,0)/rows.length,
  mean_file_f1:rows.reduce((n,row)=>n+row.file_f1,0)/rows.length,
})).sort((a,b)=>b.mean_span_f1-a.mean_span_f1);
const result={schema:'are.offline-terminal-selector-analysis/v1',source_run:'recent-evidence-production-live-r1',historical_runs:historical,strategies,provider_calls:0,model_calls:0,claim_ceiling:'Post-run hypothesis analysis on the exposed fixed cohort. It selects the next mechanism to test; it is not confirmation evidence.',open_questions_ref:'../RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md'};
persistence.writeJson(join(stage,'RESULTS.json'),result,{final:true});
console.log(JSON.stringify({best:strategies[0],strategies:strategies.map(x=>({strategy:x.strategy,mean_span_f1:x.mean_span_f1,mean_file_f1:x.mean_file_f1})),provider_calls:0,model_calls:0}));
