// Development-only refinement: diversify confirmed source reads by line region.
// No gold, model dispatch, or repository mutation is accepted by this module.
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {selectSourceFloor} from './source-floor-selection-r1.mjs';

const need=(value,reason)=>{if(!value)throw Error('source-floor-diversity.'+reason);};
const tokens=value=>new Set(String(value??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').split(/\s+/).filter(x=>x.length>=4));

export function selectSourceFloorDiverse({result,task}){
  const base=selectSourceFloor({result,task});
  const projection=result.native_export.source_projection;
  const byEvent=new Map(projection.events.map(event=>[event.id,event]));
  const byRead=new Map(projection.projections.map(read=>[read.read_id,read]));
  const original=base.selection.original_read_ids,chosen=new Set(original);
  const issue=tokens(task.problem_statement),added=[];
  for(const selected of base.selection.selected_paths){
    const buckets=new Map();
    for(const read of projection.projections){
      if(!read.event_ids.length||read.unmapped_current_lines.length)continue;
      const events=read.event_ids.map(id=>byEvent.get(id));
      if(events.some(event=>!event?.delivered||event.path!==selected.path))continue;
      const first=events[0],bucket=Math.floor((first.start_line-1)/64);
      const matches=[...tokens(events.map(event=>event.body).join(' '))].filter(term=>issue.has(term)).length;
      const items=buckets.get(bucket)??[];
      items.push({id:read.read_id,line:first.start_line,matches});buckets.set(bucket,items);
    }
    const regions=[...buckets].map(([bucket,items])=>({bucket,items,
      support:items.length,match:Math.max(...items.map(item=>item.matches))}))
      .sort((a,b)=>b.support-a.support||b.match-a.match||a.bucket-b.bucket);
    for(const region of regions.slice(0,3)){
      if(chosen.size>=8)break;
      const item=[...region.items].sort((a,b)=>b.matches-a.matches||a.line-b.line||a.id.localeCompare(b.id))[0];
      if(!chosen.has(item.id)){chosen.add(item.id);added.push({read_id:item.id,path:selected.path,line:item.line,region:region.bucket});}
    }
  }
  const events=[...new Set([...chosen].flatMap(id=>{
    const read=byRead.get(id);need(read?.event_ids.length&&!read.unmapped_current_lines.length,'unmapped-read');
    return read.event_ids;
  }))].map(id=>byEvent.get(id));
  need(events.every(event=>event?.delivered),'undelivered-event');
  const predFiles=[...new Set(events.map(event=>event.path))].sort(),predSpans={};
  for(const event of events)(predSpans[event.path]??=[]).push({start:event.start_line,end:event.end_line});
  return {prediction:{...base.prediction,traj_data:{...base.prediction.traj_data,
    pred_files:predFiles,pred_spans:predSpans}},selection:{...base.selection,
    schema_version:'are.g01-source-floor-diversity/v1',selected_read_ids:[...chosen],added,
    claim_ceiling:'Gold-exposed offline diagnostic only; no prospective or live 8K claim.'}};
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const [rowPath,taskPath,predPath,receiptPath]=process.argv.slice(2);
  need([rowPath,taskPath,predPath,receiptPath].every(Boolean),'arguments');
  const row=JSON.parse(readFileSync(rowPath,'utf8'));
  const task=JSON.parse(readFileSync(taskPath,'utf8'));
  const output=selectSourceFloorDiverse({result:row.result,task});
  writeFileSync(predPath,JSON.stringify(output.prediction,null,2)+'\n',{flag:'wx'});
  writeFileSync(receiptPath,JSON.stringify(output.selection,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({files:output.prediction.traj_data.pred_files,added:output.selection.added}));
}
