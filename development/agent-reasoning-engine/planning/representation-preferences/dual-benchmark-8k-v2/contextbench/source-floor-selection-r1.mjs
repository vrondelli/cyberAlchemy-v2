// HEN-12 development prototype: preserve model selection but add bounded,
// source-verified implementation evidence from the whole trajectory.
// It accepts no gold data and performs no model dispatch.
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const need=(condition,reason)=>{if(!condition)throw Error('source-floor.'+reason);};
const STOP=new Set(['about','after','also','before','being','during','first','from','have','into','only','that','their','there','these','this','those','with','would','usage','valid','ensure','fix','chore','test','tests','change','changes','source']);
const terms=value=>[...new Set(String(value??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').split(/\s+/).filter(term=>term.length>=3&&!STOP.has(term)))];
const isImplementation=path=>/(^|\/)(src|lib|internal)\//.test(path)&&/\.(?:[ch]|cc|cpp|go|js|jsx|ts|tsx|rs|py)$/.test(path)&&!/(^|\/)(test|tests|__tests__)\//.test(path);
const issuePathOverlap=(issue,path)=>{const tokens=new Set(terms(path));return terms(issue).filter(term=>tokens.has(term)).length;};
const issueBodyOverlap=(issue,body)=>{const tokens=new Set(terms(body));return terms(issue).filter(term=>tokens.has(term)).length;};

export function selectSourceFloor({result,task,max_paths=2,max_reads_per_path=3}){
  need(result?.status==='final_context_selected'&&result?.native_export?.source_projection,'invalid-result');
  need(result.instance_id===task?.instance_id,'task-identity');
  need(Number.isSafeInteger(max_paths)&&max_paths>=1&&max_paths<=4,'max-paths');
  need(Number.isSafeInteger(max_reads_per_path)&&max_reads_per_path>=1&&max_reads_per_path<=16,'max-reads');
  const projection=result.native_export.source_projection;
  const eventById=new Map(projection.events.map(event=>[event.id,event]));
  const readById=new Map(projection.projections.map(read=>[read.read_id,read]));
  const original=result.native_export.selection.final_read_ids;
  need(Array.isArray(original)&&original.length>0&&original.length<=8,'original-handle-cap');
  const groups=new Map();
  for(const read of projection.projections){
    if(!read.event_ids.length||read.unmapped_current_lines.length)continue;
    const events=read.event_ids.map(id=>eventById.get(id));
    if(events.some(event=>!event?.delivered)||new Set(events.map(event=>event.path)).size!==1)continue;
    const path=events[0].path;
    if(!isImplementation(path))continue;
    const items=groups.get(path)??[];
    items.push({read_id:read.read_id,events,body_score:Math.max(...events.map(event=>issueBodyOverlap(task.problem_statement,event.body)))});
    groups.set(path,items);
  }
  const ranked=[...groups].map(([path,items])=>({path,items,
    score:4+Math.min(items.length,5)*0.5+2*issuePathOverlap(task.problem_statement,path)}))
    .sort((a,b)=>b.score-a.score||b.items.length-a.items.length||a.path.localeCompare(b.path));
  const selectedPaths=ranked.slice(0,max_paths),final=new Set(original),added=[];
  for(const group of selectedPaths){
    const reads=[...group.items].sort((a,b)=>b.body_score-a.body_score||a.events[0].start_line-b.events[0].start_line||a.read_id.localeCompare(b.read_id));
    for(const item of reads.slice(0,max_reads_per_path))if(final.size<8&&!final.has(item.read_id)){
      final.add(item.read_id);added.push({read_id:item.read_id,path:group.path,body_score:item.body_score});
    }
  }
  const eventIds=[...new Set([...final].flatMap(id=>{
    const read=readById.get(id);need(read?.event_ids.length&&!read.unmapped_current_lines.length,'unmapped-selection');
    return read.event_ids;
  }))];
  const events=eventIds.map(id=>eventById.get(id));
  need(events.every(event=>event?.delivered),'undelivered-selection');
  const predFiles=[...new Set(events.map(event=>event.path))].sort(),predSpans={};
  for(const event of events)(predSpans[event.path]??=[]).push({start:event.start_line,end:event.end_line});
  const model=result.native_export.prediction;
  need(model.instance_id===task.instance_id&&model.commit===task.base_commit&&model.repo_url===task.repo_url,'prediction-identity');
  return {prediction:{...model,traj_data:{...model.traj_data,pred_files:predFiles,pred_spans:predSpans}},
    selection:{schema_version:'are.g01-source-floor-selection/v1',original_read_ids:original,
      selected_read_ids:[...final],selected_paths:selectedPaths.map(({path,score})=>({path,score})),added,
      claim_ceiling:'Exposed-task label-free offline screen; no prospective G01 result or model call.'}};
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const [rowPath,taskPath,predPath,receiptPath]=process.argv.slice(2);
  need([rowPath,taskPath,predPath,receiptPath].every(Boolean),'arguments');
  const row=JSON.parse(readFileSync(rowPath,'utf8'));
  const task=JSON.parse(readFileSync(taskPath,'utf8'));
  const output=selectSourceFloor({result:row.result,task});
  writeFileSync(predPath,JSON.stringify(output.prediction,null,2)+'\n',{flag:'wx'});
  writeFileSync(receiptPath,JSON.stringify(output.selection,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({files:output.prediction.traj_data.pred_files,added:output.selection.added.length}));
}
