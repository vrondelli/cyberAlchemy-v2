// Exposed-data diagnosis of Round 38 evidence representation. This selects a
// successor mechanism; it cannot establish support or benchmark clearance.
import {createHash} from 'node:crypto';
import {existsSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {bindDelivery} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {featureOverlap,featureWords} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/evidence-slate-v1.mjs';

const researchRoot=resolve('agent-reasoning-engine/research/contextbench-v1');
const liveRoot='/home/vrondelli/.local/share/are/contextbench-retained-v1/contextbench-round38-live';
const freeze=JSON.parse(readFileSync(resolve(researchRoot,'freeze-round38-execution.json')));
const matrix=JSON.parse(readFileSync(resolve(researchRoot,'round38-matrix.json')));
const outcome=JSON.parse(readFileSync(resolve(researchRoot,'round38-outcome.json')));
const hash=value=>createHash('sha256').update(value).digest('hex');
const mean=values=>values.reduce((sum,value)=>sum+value,0)/values.length;

function observationsFor(result,task){
  const taskWords=featureWords(task.problem_statement);
  return bindDelivery(result).read_observations.map((read,index)=>({
    id:read.id,path:read.path,start_line:read.start_line,end_line:read.end_line,
    width:read.end_line-read.start_line+1,index,
    body_overlap:featureOverlap(taskWords,featureWords(read.body)),
    path_overlap:featureOverlap(taskWords,featureWords(read.path.replace(/[._/\\-]+/g,' '))),
    presentations:read.confirmed_receipts.length,
    recency:Math.max(...read.confirmed_receipts)
  }));
}

function rankPaths(observations){
  const groups=new Map();
  for(const item of observations){if(!groups.has(item.path))groups.set(item.path,[]);groups.get(item.path).push(item);}
  return [...groups.entries()].map(([path,items])=>({path,items,
    body_overlap:Math.max(...items.map(x=>x.body_overlap)),path_overlap:Math.max(...items.map(x=>x.path_overlap)),
    presentations:items.reduce((sum,x)=>sum+x.presentations,0),recency:Math.max(...items.map(x=>x.recency))
  })).sort((a,b)=>b.body_overlap-a.body_overlap||b.path_overlap-a.path_overlap||b.items.length-a.items.length||b.presentations-a.presentations||b.recency-a.recency||a.path.localeCompare(b.path)).slice(0,4);
}

const selectors={
  widest:items=>[...items].sort((a,b)=>b.width-a.width||b.recency-a.recency||b.index-a.index)[0],
  narrowest:items=>[...items].sort((a,b)=>a.width-b.width||b.body_overlap-a.body_overlap||b.recency-a.recency)[0],
  overlap_then_narrow:items=>[...items].sort((a,b)=>b.body_overlap-a.body_overlap||b.path_overlap-a.path_overlap||a.width-b.width||b.recency-a.recency)[0],
  density:items=>[...items].sort((a,b)=>(b.body_overlap/Math.sqrt(b.width))-(a.body_overlap/Math.sqrt(a.width))||b.body_overlap-a.body_overlap||a.width-b.width||b.recency-a.recency)[0],
  latest:items=>[...items].sort((a,b)=>b.recency-a.recency||b.index-a.index||a.width-b.width)[0]
};

const taskManifest=JSON.parse(readFileSync(freeze.task_manifest_ref));
const taskRoot=dirname(freeze.task_manifest_ref);
const taskById=new Map(taskManifest.tasks.map(row=>[row.instance_id,JSON.parse(readFileSync(resolve(taskRoot,row.file)))]));
const scoreRows=[],diagnostic=[];
for(const taskCell of matrix.tasks){
  const result=JSON.parse(readFileSync(resolve(liveRoot,`r38-${String(taskCell.locked_order).padStart(2,'0')}-slate-review-rep1-8k/result.json`)));
  const task=taskById.get(taskCell.instance_id),observations=observationsFor(result,task),paths=rankPaths(observations);
  const strategies={};
  for(const [name,select] of Object.entries(selectors)){
    const selected=paths.map(path=>select(path.items));strategies[name]=selected.map(x=>x.id);
    scoreRows.push({cell_id:`${taskCell.instance_id}::${name}`,instance_id:taskCell.instance_id,selected});
  }
  diagnostic.push({instance_id:taskCell.instance_id,observation_count:observations.length,ranked_paths:paths.map(x=>x.path),strategies});
}
const temp=mkdtempSync(join(tmpdir(),'are-r38-representation-')),input=join(temp,'input.json'),scoredPath=join(temp,'scored.json');
writeFileSync(input,JSON.stringify({rows:scoreRows}));
const run=spawnSync(freeze.python,[resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score-selected-handles.py'),'--upstream',freeze.upstream,'--gold',resolve(freeze.upstream,'data/full.parquet'),'--input',input,'--cache',freeze.scoring_cache,'--out',scoredPath],{encoding:'utf8',timeout:180000,maxBuffer:32_000_000});
if(run.status!==0)throw Error(`round38.representation-score:${run.stderr}`);
const scored=JSON.parse(readFileSync(scoredPath)).rows;rmSync(temp,{recursive:true,force:true});
const aggregates={};
for(const name of Object.keys(selectors)){
  const rows=scored.filter(row=>row.cell_id.endsWith(`::${name}`));
  aggregates[name]={macro_span_f1:mean(rows.map(row=>row.span_f1)),macro_file_f1:mean(rows.map(row=>row.file_f1)),rows:rows.map(row=>({instance_id:row.instance_id,span_f1:row.span_f1,file_f1:row.file_f1,selected_read_ids:row.selected_read_ids}))};
}
const artifact={schema_version:'are.contextbench-round38-representation-analysis/v1',status:'candidate-mechanism-found',
  objective:'Retain the Round 38 file-discovery and validity gains while preventing coarse evidence spans from erasing Span-F1.',
  gap:'The v1 slate selects the widest observation per ranked path although ContextBench rewards exact useful spans.',
  question:'Which gold-blind representative rule best preserves path discovery while selecting compact delivered observations?',
  competing_hypotheses:[{id:'H62',mechanism:'rank paths by maximum task agreement, then choose the highest-overlap narrow observation per path'},{id:'H63',mechanism:'choose the highest overlap-density observation per path'},{id:'H58',mechanism:'inject the existing slate after first evidence and continue reasoning'},{id:'H0',mechanism:'observable trajectory metadata cannot improve final span selection'}],
  selected:'H62',selection_reason:'Round 38 directly isolates a coarse-representation failure. Overlap-then-narrow changes only the representative handle after gold-blind path ranking and has an explicit precision objective.',
  exposed_diagnostic:{round38_control_macro_span_f1:outcome.evaluation.control.span_f1,round38_treatment_macro_span_f1:outcome.evaluation.treatment.span_f1,round38_treatment_minus_control_span_f1:outcome.evaluation.gains.span_f1,round38_file_coverage_gain:outcome.evaluation.gains.file_coverage,round38_file_precision_gain:outcome.evaluation.gains.file_precision,strategies:aggregates},
  rows:diagnostic,claim_ceiling:'Exposed Round 38 diagnostic only. H62 requires a frozen fresh development comparison and cannot clear ContextBench.',
  source_refs:['round38-outcome.json','freeze-round38-execution.json','round38-matrix.json'].map(path=>({path,sha256:hash(readFileSync(resolve(researchRoot,path)))})),
  benchmark_cleared:false,authority_effect:'none',open_questions:['Does compact representative selection preserve the file gains on fresh identities?','Should a later experiment combine compact final representation with H58 early guidance?']};
const output=resolve(researchRoot,'round38-representation-analysis.json'),bytes=JSON.stringify(artifact,null,2)+'\n';
if(existsSync(output)&&readFileSync(output,'utf8')!==bytes)throw Error('round38.representation-drift');
if(!existsSync(output))writeFileSync(output,bytes,{flag:'wx'});
console.log(JSON.stringify({selected:artifact.selected,strategies:Object.fromEntries(Object.entries(aggregates).map(([name,row])=>[name,{span_f1:row.macro_span_f1,file_f1:row.macro_file_f1}]))}));
