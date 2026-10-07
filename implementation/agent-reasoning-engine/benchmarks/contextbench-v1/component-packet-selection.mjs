// Label-free final context selection from confirmed packet evidence.
// This adapter is opt-in research code; it never dispatches a model.
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {exportTrajectory} from './export.mjs';

const need=(condition,reason)=>{if(!condition)throw Error('component-packet.'+reason);};

export function inferActiveComponent(problem_statement){
  need(typeof problem_statement==='string','invalid-problem');
  let issue=problem_statement;
  if(issue.startsWith('"'))try{const decoded=JSON.parse(issue);if(typeof decoded==='string')issue=decoded;}catch{}
  const typed=issue.match(/\b([a-z][a-z0-9_]*)\.type\s*:\s*([a-z][a-z0-9_-]*)/i);
  if(typed)return {group:typed[1].toLowerCase(),variant:typed[2].toLowerCase(),evidence:'explicit-config-type'};
  const dotted=issue.match(/\b([a-z][a-z0-9_]*)\.([a-z][a-z0-9_-]*)\.enabled\b/i);
  if(dotted)return {group:dotted[1].toLowerCase(),variant:dotted[2].toLowerCase(),evidence:'explicit-dotted-variant'};
  return null;
}

export function selectComponentPacketReadIds({task,model_read_ids,read_observations,source_projection}){
  need(Array.isArray(model_read_ids)&&Array.isArray(read_observations)&&Array.isArray(source_projection?.projections),'invalid-input');
  const active=inferActiveComponent(task?.problem_statement);
  const reads=new Map(read_observations.map(read=>[read.id,read]));
  const projected=new Map(source_projection.projections.map(item=>[item.read_id,item]));
  const usable=id=>projected.has(id)&&projected.get(id).event_ids.length>0&&!projected.get(id).unmapped_current_lines.length;
  for(const id of model_read_ids)need(reads.has(id)&&usable(id),'unbound-model-read');
  const prefixes=[];
  if(active)for(const read of read_observations){
    const parts=read.path.toLowerCase().split('/');
    const group=parts.indexOf(active.group),variant=parts.indexOf(active.variant,group+1);
    if(group<0||variant<0||variant===parts.length-1)continue;
    const prefix=parts.slice(0,variant);
    if(!prefixes.some(item=>item.length===prefix.length&&item.every((part,index)=>part===prefix[index])))prefixes.push(prefix);
    if(prefixes.length===4)break;
  }
  const dropped=[],selected=[];
  for(const id of model_read_ids){
    const read=reads.get(id),parts=read.path.toLowerCase().split('/');
    const alternative=prefixes.find(prefix=>parts.length>prefix.length&&prefix.every((part,index)=>parts[index]===part)&&parts[prefix.length]!==active.variant);
    if(alternative){dropped.push({read_id:id,path:read.path,reason:'alternative-component-sibling'});continue;}
    selected.push(id);
  }
  const selectedSet=new Set(selected),added=[];
  for(const read of read_observations){
    if(!usable(read.id))continue;
    const focused=/^initial-source-focused-\d+-/.test(read.tool_call_id)||
      Number(read.tool_call_id.match(/^initial-source-(\d+)-/)?.[1])>=6;
    const named=active&&read.path.toLowerCase().split('/').includes(active.variant)&&/^initial-source-/.test(read.tool_call_id);
    if(!focused&&!named||selectedSet.has(read.id))continue;
    selected.push(read.id);selectedSet.add(read.id);
    added.push({read_id:read.id,path:read.path,reason:focused?'focused-packet':'named-component-packet'});
  }
  need(selected.length>0,'empty-selection');
  return {schema_version:'are.component-packet-selection/v1',active_component:active,
    model_read_ids,final_read_ids:selected,dropped,added,
    claim_ceiling:'Deterministic runtime-selected confirmed evidence; not identical to terminal model selection, not a gold-aware decision.'};
}

const pathLayer=path=>/\/(?:views|templates)\/|\.tpl$/i.test(path)?'view':
  /\/(?:client|frontend)\//i.test(path)?'client':
  /\/(?:openapi|schema|schemas)\//i.test(path)?'schema':
  /\/(?:language|locale|locales|i18n)\//i.test(path)?'locale':'server';
const sourceStem=path=>path.split('/').at(-1)?.replace(/\.[^.]+$/,'').toLowerCase()??'';
const genericStems=new Set(['index','main','mod','util','utils','helper','helpers','common','types','constants']);

// Add only already observed, base-projectable evidence in another source layer.
// This never invents a path or reads a label; acquisition remains a separate step.
export function selectCrossLayerPacketReadIds(input){
  const base=selectComponentPacketReadIds(input);
  const reads=new Map(input.read_observations.map(read=>[read.id,read]));
  const projected=new Map(input.source_projection.projections.map(item=>[item.read_id,item]));
  const objectiveTokens=new Set(String(input.task?.problem_statement??'').toLowerCase().split(/[^a-z0-9]+/));
  const anchors=new Map();
  for(const id of base.final_read_ids){
    const read=reads.get(id),stem=sourceStem(read.path);
    if(stem.length<4||genericStems.has(stem)||!objectiveTokens.has(stem))continue;
    if(!anchors.has(stem))anchors.set(stem,new Set());
    anchors.get(stem).add(pathLayer(read.path));
  }
  const final_read_ids=[...base.final_read_ids],added=[...base.added],paths=new Set(final_read_ids.map(id=>reads.get(id).path));
  for(const read of input.read_observations){
    if(added.length-base.added.length>=4)break;
    const projection=projected.get(read.id);
    if(paths.has(read.path)||!projection?.event_ids?.length||projection.unmapped_current_lines?.length)continue;
    const layer=pathLayer(read.path);
    const shared=[...anchors].find(([stem,layers])=>!layers.has(layer)&&read.path.toLowerCase().split(/[^a-z0-9]+/).includes(stem));
    if(!shared)continue;
    final_read_ids.push(read.id);paths.add(read.path);
    added.push({read_id:read.id,path:read.path,reason:'task-anchored-cross-layer',anchor:shared[0],layer});
  }
  return {...base,policy:'task-anchored-cross-layer-r1',final_read_ids,added};
}

export function exportComponentPacketSelection({result,task,repoRoot,policy='base'}){
  need(result?.status==='final_context_selected'&&result.native_export?.delivery_binding&&result.native_export?.source_projection,'invalid-result');
  const original=result.native_export.prediction;
  need(original?.instance_id===task.instance_id&&original.commit===task.base_commit,'task-mismatch');
  need(['base','task-anchored-cross-layer-r1'].includes(policy),'unknown-policy');
  const select=policy==='base'?selectComponentPacketReadIds:selectCrossLayerPacketReadIds;
  const selection=select({task,model_read_ids:result.selection.final_read_ids,
    read_observations:result.native_export.delivery_binding.read_observations,
    source_projection:result.native_export.source_projection});
  const projections=new Map(result.native_export.source_projection.projections.map(item=>[item.read_id,item]));
  const final_event_ids=[...new Set(selection.final_read_ids.flatMap(id=>projections.get(id).event_ids))];
  const exported=exportTrajectory({schema_version:'are.context-delivery-ledger/v1',instance_id:original.instance_id,
    repo_url:original.repo_url,commit:original.commit,events:result.native_export.source_projection.events,final_event_ids},repoRoot);
  return {prediction:exported.prediction,selection,sidecar:exported.sidecar};
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const [resultPath,taskPath,repoRoot,predictionPath,selectionPath,policy]=process.argv.slice(2);
  need([resultPath,taskPath,repoRoot,predictionPath,selectionPath].every(Boolean),'arguments');
  const exported=exportComponentPacketSelection({result:JSON.parse(readFileSync(resultPath,'utf8')),
    task:JSON.parse(readFileSync(taskPath,'utf8')),repoRoot,policy});
  writeFileSync(predictionPath,JSON.stringify(exported.prediction,null,2)+'\n',{flag:'wx'});
  writeFileSync(selectionPath,JSON.stringify(exported.selection,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({paths:exported.prediction.traj_data.pred_files.length,added:exported.selection.added.length,dropped:exported.selection.dropped.length}));
}
