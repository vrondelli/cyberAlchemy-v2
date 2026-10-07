// Post-run, label-free diagnostic. A named backend narrows selected sibling
// backend paths; confirmed focused packet reads are added as runtime evidence.
import {readFileSync,writeFileSync} from 'node:fs';
import {exportTrajectory} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/export.mjs';

const [resultPath,taskPath,baseRoot,predictionPath,analysisPath]=process.argv.slice(2);
if([resultPath,taskPath,baseRoot,predictionPath,analysisPath].some(value=>!value))throw Error('backend-replay.arguments');
const result=JSON.parse(readFileSync(resultPath,'utf8'));
const task=JSON.parse(readFileSync(taskPath,'utf8'));
const issue=(()=>{try{return JSON.parse(task.problem_statement);}catch{return task.problem_statement;}})();
const active=issue.match(/\bstorage\.type\s*:\s*([a-z][a-z0-9_-]*)/i)?.[1]?.toLowerCase();
if(!active||result.status!=='final_context_selected'||!result.native_export?.source_projection)throw Error('backend-replay.invalid-input');
const reads=result.native_export.delivery_binding.read_observations;
const byId=new Map(reads.map(read=>[read.id,read]));
const projections=new Map(result.native_export.source_projection.projections.map(item=>[item.read_id,item]));
const selected=new Set();const dropped=[],added=[];
for(const id of result.selection.final_read_ids){
  const read=byId.get(id);if(!read)throw Error('backend-replay.unbound-selection');
  const sibling=read.path.match(/(?:^|\/)storage\/fs\/([^/]+)\//)?.[1]?.toLowerCase();
  if(sibling&&sibling!==active){dropped.push({path:read.path,read_id:id,reason:'alternate-storage-backend'});continue;}
  selected.add(id);
}
for(const read of reads){
  const index=Number(read.tool_call_id.match(/^initial-source-(\d+)-/)?.[1]);
  if(!Number.isSafeInteger(index)||!projections.has(read.id)||projections.get(read.id).unmapped_current_lines.length)continue;
  const focused=index>=6;
  const activePath=read.path.split('/').some(segment=>segment.toLowerCase()===active);
  if(!focused&&!activePath)continue;
  if(!selected.has(read.id)){selected.add(read.id);added.push({path:read.path,read_id:read.id,reason:focused?'focused-packet':'named-backend-packet'});}
}
const projection=result.native_export.source_projection;
const final_event_ids=[...new Set([...selected].flatMap(id=>projections.get(id)?.event_ids??[]))];
const original=result.native_export.prediction;
const replay=exportTrajectory({schema_version:'are.context-delivery-ledger/v1',instance_id:original.instance_id,
  repo_url:original.repo_url,commit:original.commit,events:projection.events,final_event_ids},baseRoot);
writeFileSync(predictionPath,JSON.stringify(replay.prediction,null,2)+'\n',{flag:'wx'});
writeFileSync(analysisPath,JSON.stringify({selection_rule:'named-backend-filter-plus-confirmed-focused-and-named-backend-packet',
  active_backend:active,dropped,added,original_paths:original.traj_data.pred_files,
  replay_paths:replay.prediction.traj_data.pred_files,gold_used:false,
  claim_ceiling:'Post-run exposed-task diagnostic only; no prospective or model-selected claim.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({active,dropped:dropped.map(x=>x.path),added:added.map(x=>x.path),paths:replay.prediction.traj_data.pred_files.length}));
