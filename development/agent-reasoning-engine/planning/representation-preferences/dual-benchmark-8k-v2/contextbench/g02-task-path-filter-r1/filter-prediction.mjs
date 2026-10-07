// Gold-blind diagnostic over an already sealed native prediction.
// It does not alter delivered steps, source bytes, or model execution.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {basename} from 'node:path';
import {fileURLToPath} from 'node:url';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const need=(ok,code)=>{if(!ok)throw Error('task-path-filter.'+code);};
const stop=new Set(['bug','issue','error','actual','expected','behavior','after','before','recent','changes','change','when','with','from','into','this','that','there','their','should','could','would','always','sometimes','proper','stable','including','using','display','displays','render','renders','source','file','files','code','test','tests','topic','module','modules','client','public','src','template','templates','index','main']);
function words(text){
  const separated=String(text).replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/([A-Z])([A-Z][a-z])/g,'$1 $2');
  return new Set((separated.toLowerCase().match(/[a-z][a-z0-9]{2,}/g)??[]).map(word=>word.endsWith('ies')?word.slice(0,-3)+'y':word.endsWith('s')&&!word.endsWith('ss')?word.slice(0,-1):word).filter(word=>!stop.has(word)));
}
function changedPaths(patch){
  need(typeof patch==='string','patch-type');
  return new Set([...patch.matchAll(/^diff --git a\/([^\n]+) b\/([^\n]+)$/gm)].filter(([,a,b])=>a===b).map(([,a])=>a));
}
export function filterTaskSupportedPrediction({prediction,problem_statement,patch}){
  need(prediction?.traj_data&&typeof problem_statement==='string','input');
  const original=prediction.traj_data.pred_files,spans=prediction.traj_data.pred_spans;
  need(Array.isArray(original)&&original.length>0&&spans&&typeof spans==='object','prediction-shape');
  const task=words(problem_statement),edited=changedPaths(patch),decisions=original.map(path=>{
    const stem=basename(path).replace(/\.[^.]+$/,'');
    const matches=[...words(stem)].filter(word=>task.has(word));
    return {path,matched_task_terms:matches,edited:edited.has(path),retain:matches.length>0||edited.has(path)};
  });
  // A task with little path-name support must not silently lose its final view.
  const supported=decisions.filter(x=>x.retain).length;
  const applied=supported>=2&&supported<decisions.length;
  const keep=new Set((applied?decisions.filter(x=>x.retain):decisions).map(x=>x.path));
  const pred_files=original.filter(path=>keep.has(path));
  need(pred_files.length>0&&pred_files.every(path=>Array.isArray(spans[path])&&spans[path].length>0),'empty-or-unbound');
  return {prediction:{...prediction,traj_data:{...prediction.traj_data,pred_files,pred_spans:Object.fromEntries(Object.entries(spans).filter(([path])=>keep.has(path)))}},
    diagnostic:{schema_version:'are.g02-task-path-filter-diagnostic/v1',applied,task_terms:[...task].sort(),decisions,
      source:'task statement, sealed model patch, and sealed final prediction only; no reference/gold data',
      claim_ceiling:'Post-hoc exposed-task diagnostic, not candidate qualification or comparative evidence.',authority_effect:'none'}};
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const [resultPath,runPath,taskPath,outPrediction,outDiagnostic]=process.argv.slice(2);
  need([resultPath,runPath,taskPath,outPrediction,outDiagnostic].every(Boolean),'arguments');
  const result=JSON.parse(readFileSync(resultPath,'utf8'));
  const run=JSON.parse(readFileSync(runPath,'utf8'));
  const task=JSON.parse(readFileSync(taskPath,'utf8'));
  need(result.status==='final_context_selected'&&result.native_export?.prediction?.instance_id===task.instance_id&&run.instance_id===task.instance_id,'sealed-identity');
  const output=filterTaskSupportedPrediction({prediction:result.native_export.prediction,problem_statement:task.problem_statement,patch:run.patch});
  const predictionBytes=Buffer.from(JSON.stringify(output.prediction,null,2)+'\n');
  writeFileSync(outPrediction,predictionBytes,{flag:'wx',mode:0o600});
  writeFileSync(outDiagnostic,JSON.stringify({...output.diagnostic,input_hashes:{result:hash(readFileSync(resultPath)),run:hash(readFileSync(runPath)),task:hash(readFileSync(taskPath))},prediction_sha256:hash(predictionBytes)},null,2)+'\n',{flag:'wx',mode:0o600});
  console.log(JSON.stringify({applied:output.diagnostic.applied,retained:output.prediction.traj_data.pred_files.length,removed:output.diagnostic.decisions.filter(x=>!x.retain).map(x=>x.path)}));
}
