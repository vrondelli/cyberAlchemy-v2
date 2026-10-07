// Offline, label-free replay of receipt-confirmed contract packet reads.
import {readFileSync,writeFileSync} from 'node:fs';
import {selectComponentPacketReadIds} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/component-packet-selection.mjs';
import {exportTrajectory} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/export.mjs';

const [resultPath,taskPath,repoRoot,predictionPath,receiptPath]=process.argv.slice(2);
if([resultPath,taskPath,repoRoot,predictionPath,receiptPath].some(value=>!value))throw Error('contract-replay.arguments');
const result=JSON.parse(readFileSync(resultPath)),task=JSON.parse(readFileSync(taskPath));
if(result.status!=='final_context_selected'||result.instance_id!==task.instance_id)throw Error('contract-replay.invalid-result');
const {delivery_binding:binding,source_projection:projection}=result.native_export;
const baseline=selectComponentPacketReadIds({task,model_read_ids:result.selection.final_read_ids,
  read_observations:binding.read_observations,source_projection:projection});
const byId=new Map(projection.projections.map(value=>[value.read_id,value]));
const selected=[...baseline.final_read_ids],selectedSet=new Set(selected),added=[];
for(const read of binding.read_observations){
  if(!/^initial-source-neighbor-/.test(read.tool_call_id)||!/\.schema\.(?:cue|json|ya?ml)$/i.test(read.path)||selectedSet.has(read.id))continue;
  const component=baseline.active_component;
  if(!component||!read.body.toLowerCase().includes(component.group)||!read.body.toLowerCase().includes(component.variant))continue;
  const projected=byId.get(read.id);
  if(!projected?.event_ids.length||projected.unmapped_current_lines.length)continue;
  selected.push(read.id);selectedSet.add(read.id);added.push({path:read.path,read_id:read.id,reason:'confirmed-named-contract'});
}
const eventIds=[...new Set(selected.flatMap(id=>byId.get(id).event_ids))];
const exported=exportTrajectory({schema_version:'are.context-delivery-ledger/v1',instance_id:task.instance_id,
  repo_url:task.repo_url,commit:task.base_commit,events:projection.events,final_event_ids:eventIds},repoRoot);
writeFileSync(predictionPath,JSON.stringify(exported.prediction,null,2)+'\n',{flag:'wx'});
writeFileSync(receiptPath,JSON.stringify({schema_version:'are.offline-contract-selection/v1',
  active_component:baseline.active_component,base_selection:baseline,added,
  final_read_ids:selected,claim_ceiling:'exposed offline diagnostic, not prospective evidence'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({files:exported.prediction.traj_data.pred_files.length,added:added.map(value=>value.path)}));
