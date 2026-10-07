// Gold-free offline replay: retain selected reads and add confirmed source
// paths explicitly cited in the terminal summary or a selected Go test sibling.
// This is an exposed-task development diagnostic, never a fresh result.
import {readFileSync,writeFileSync} from 'node:fs';
import {exportTrajectory} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/export.mjs';

const [resultPath,baseRoot,predictionPath,analysisPath,readChoice='widest',collapse='none']=process.argv.slice(2);
if([resultPath,baseRoot,predictionPath,analysisPath].some(value=>!value))throw Error('summary-replay.arguments');
if(!['widest','narrowest'].includes(readChoice))throw Error('summary-replay.read-choice');
if(!['none','one-per-path'].includes(collapse))throw Error('summary-replay.collapse');
const result=JSON.parse(readFileSync(resultPath,'utf8'));
if(result.status!=='final_context_selected'||!result.native_export?.delivery_binding||!result.native_export?.source_projection)throw Error('summary-replay.invalid-result');
const selected=new Set(result.selection.final_read_ids);
const reads=result.native_export.delivery_binding.read_observations;
const projections=new Map(result.native_export.source_projection.projections.map(item=>[item.read_id,item]));
const sortReads=(a,b)=>(readChoice==='widest'?1:-1)*((b.end_line-b.start_line)-(a.end_line-a.start_line))||a.first_confirmed_receipt-b.first_confirmed_receipt;
if(collapse==='one-per-path'){
  const keep=new Set();
  for(const path of new Set(reads.filter(read=>selected.has(read.id)).map(read=>read.path))){
    const available=reads.filter(read=>read.path===path&&selected.has(read.id)&&projections.has(read.id)&&!projections.get(read.id).unmapped_current_lines.length);
    available.sort(sortReads);
    if(available[0])keep.add(available[0].id);
  }
  selected.clear();for(const id of keep)selected.add(id);
}
const paths=[...new Set(reads.map(read=>read.path))];
const summary=result.selection.summary;
const selectedPaths=new Set(reads.filter(read=>selected.has(read.id)).map(read=>read.path));
const escaped=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const mentioned=path=>{
  const exact=new RegExp('(?<![a-zA-Z0-9_./-])'+escaped(path)+'(?![a-zA-Z0-9_./-])');
  if(exact.test(summary))return 'exact-summary-path';
  const basename=path.split('/').at(-1);
  if(paths.filter(candidate=>candidate.split('/').at(-1)===basename).length!==1)return null;
  return new RegExp('(?<![a-zA-Z0-9_.-])'+escaped(basename)+'(?![a-zA-Z0-9_.-])').test(summary)?'unique-summary-basename':null;
};
const reasons=[];
for(const path of paths){
  if(selectedPaths.has(path))continue;
  let reason=mentioned(path);
  if(!reason&&path.endsWith('_test.go')){
    const source=path.replace(/_test\.go$/,'.go');
    if(selectedPaths.has(source))reason='selected-go-test-sibling';
  }
  if(!reason)continue;
  const available=reads.filter(read=>read.path===path&&projections.has(read.id)&&!projections.get(read.id).unmapped_current_lines.length);
  if(!available.length)continue;
  available.sort(sortReads);
  const chosen=available[0];selected.add(chosen.id);reasons.push({path,read_id:chosen.id,reason,start_line:chosen.start_line,end_line:chosen.end_line});
}
const projection=result.native_export.source_projection;
const final_event_ids=[...new Set([...selected].flatMap(id=>projections.get(id)?.event_ids??[]))];
const original=result.native_export.prediction;
const ledger={schema_version:'are.context-delivery-ledger/v1',instance_id:original.instance_id,repo_url:original.repo_url,commit:original.commit,
  events:projection.events,final_event_ids};
const replay=exportTrajectory(ledger,baseRoot);
writeFileSync(predictionPath,JSON.stringify(replay.prediction,null,2)+'\n',{flag:'wx'});
writeFileSync(analysisPath,JSON.stringify({selection_rule:'summary-mentions-and-selected-go-test-siblings',read_choice:readChoice,collapse,added:reasons,
  original_paths:original.traj_data.pred_files,replay_paths:replay.prediction.traj_data.pred_files,
  original_read_count:result.selection.final_read_ids.length,replay_read_count:selected.size,
  gold_used:false,claim_ceiling:'Exposed-task offline replay only; no new model delivery or prospective quality claim.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({added:reasons.map(x=>x.path),paths:replay.prediction.traj_data.pred_files.length}));
