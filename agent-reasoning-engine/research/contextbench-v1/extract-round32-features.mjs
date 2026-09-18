// Runtime-visible, gold-blind feature extraction for exposed no-effect trajectories.
// Open questions: PLAN-round32.md#open-questions.
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {basename,dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {bindDelivery} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {patchHunks} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/terminal-effect-state.mjs';
import {featureWords,featureOverlap} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/evidence-slate-v1.mjs';

const research=resolve('agent-reasoning-engine/research/contextbench-v1'),implementation=resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1');
const read=path=>JSON.parse(readFileSync(path)),sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const words=featureWords,overlap=featureOverlap;
const pathWords=path=>words(path.replace(/[._/\\-]+/g,' '));
const commonPrefix=(a,b)=>{let n=0;while(n<a.length&&n<b.length&&a[n]===b[n])n++;return n;};

function finalMessages(result){
  let best=[];
  for(const capture of result.captures??[]){try{const messages=JSON.parse(capture.prompt).messages;if(messages.length>best.length)best=messages;}catch{}}
  return best;
}

function toolHistory(result){
  const rows=[],seen=new Set();let index=0;
  for(const message of finalMessages(result)){
    if(message.role!=='assistant')continue;
    for(const call of message.tool_calls??[]){if(seen.has(call.id))continue;seen.add(call.id);let args={};try{args=JSON.parse(call.function.arguments);}catch{}rows.push({index:index++,id:call.id,name:call.function.name,args,content:String(message.content??'')});}
  }
  return rows;
}

function extractRound({round,outcomePath,freezePath,liveRoot}){
  const outcome=read(outcomePath),freeze=read(freezePath),matrix=read(freeze.matrix_ref),manifest=read(freeze.task_manifest_ref),taskRoot=resolve(freeze.task_directory),inventory=new Map(read(freeze.repository_inventory_ref).repositories.map(row=>[row.instance_id,row])),taskEntry=new Map(manifest.tasks.map(row=>[row.instance_id,row])),meta=new Map(matrix.tasks.map(row=>[row.instance_id,row])),rows=[],trajectories=[];
  for(const outcomeRow of outcome.rows){
    const run=resolve(liveRoot,outcomeRow.cell_id),resultPath=resolve(run,'result.json');if(!existsSync(resultPath))continue;
    const result=read(resultPath);if(patchHunks(result.patch).size||!result.selection)continue;
    const entry=taskEntry.get(outcomeRow.instance_id);if(!entry?.file)continue;const task=read(resolve(taskRoot,entry.file)),binding=bindDelivery({captures:result.captures,receipts:result.receipts}),history=toolHistory(result),callOrder=new Map(history.map(row=>[row.id,row.index])),model=new Set(result.selection.model_read_ids??[]),byId=new Map(binding.read_observations.map(item=>[item.id,item])),modelPaths=[...model].map(id=>byId.get(id)?.path).filter(Boolean),taskTokens=words(task.problem_statement),groups=new Map();
    for(const [index,item] of binding.read_observations.entries()){const row={...item,index,width:item.end_line-item.start_line+1,recency:Math.max(...(item.confirmed_receipts??[-1])),presentations:(item.confirmed_receipts??[]).length};if(!groups.has(item.path))groups.set(item.path,[]);groups.get(item.path).push(row);}
    const edits=history.filter(row=>row.name==='apply_edits').flatMap(row=>(row.args.edits??[]).map(edit=>({path:edit.path,index:row.index}))),assistantText=history.map(row=>row.content).join('\n').toLowerCase();
    for(const [path,items] of groups){
      const selected=[...items].sort((a,b)=>b.width-a.width||b.recency-a.recency||b.index-a.index||a.id.localeCompare(b.id))[0],pTokens=pathWords(path),bodyTokens=words(selected.body),readOrder=callOrder.get(selected.tool_call_id)??-1,base=basename(path).toLowerCase(),dir=dirname(path);
      rows.push({round,cell_id:outcomeRow.cell_id,instance_id:outcomeRow.instance_id,repo:meta.get(outcomeRow.instance_id)?.repo??task.repo,language:meta.get(outcomeRow.instance_id)?.language??task.language,candidate_read_id:selected.id,path,start_line:selected.start_line,end_line:selected.end_line,width:selected.width,distinct_path_observations:items.length,receipt_presentations:items.reduce((sum,item)=>sum+item.presentations,0),last_confirmed_receipt:Math.max(...items.map(item=>item.recency)),selected_by_model:items.some(item=>model.has(item.id)),model_path_same_directory:modelPaths.some(modelPath=>dirname(modelPath)===dir),maximum_model_path_prefix:modelPaths.reduce((maximum,modelPath)=>Math.max(maximum,commonPrefix(path,modelPath)),0),task_path_token_overlap:overlap(taskTokens,pTokens),task_body_token_overlap:overlap(taskTokens,bodyTokens),task_path_jaccard:taskTokens.size+pTokens.size?overlap(taskTokens,pTokens)/(new Set([...taskTokens,...pTokens]).size):0,edited_after_observation:edits.some(edit=>edit.path===path&&edit.index>readOrder),assistant_path_mentions:(assistantText.split(path.toLowerCase()).length-1),assistant_basename_mentions:base?(assistantText.split(base).length-1):0,runtime_visible_only:true,gold_used:false});
    }
    trajectories.push({round,cell_id:outcomeRow.cell_id,instance_id:outcomeRow.instance_id,repo:meta.get(outcomeRow.instance_id)?.repo??task.repo,candidate_paths:groups.size,model_selected_ids:model.size,model_selected_paths:new Set(modelPaths).size,model_calls:result.receipts.filter(receipt=>receipt.kind==='model'&&receipt.dispatched).length,model_tokens:result.receipts.filter(receipt=>receipt.kind==='model'&&receipt.dispatched).reduce((sum,receipt)=>sum+(receipt.input_tokens??0)+(receipt.output_tokens??0),0),repository_cache:inventory.get(outcomeRow.instance_id)?.cache_path??null,base_commit:inventory.get(outcomeRow.instance_id)?.base_commit??task.base_commit,result_ref:resultPath});
  }
  return{rows,trajectories};
}

export function extract(){
  const specs=[
    {round:30,outcomePath:resolve(research,'round30-confirmation-outcome.json'),freezePath:resolve(research,'freeze-round30-postprocess-recovery.json'),liveRoot:'/home/vrondelli/.cache/are/contextbench-round30-8k-live'},
    {round:31,outcomePath:resolve(research,'round31-outcome-review.json'),freezePath:resolve(research,'freeze-round31-execution.json'),liveRoot:'/home/vrondelli/.local/share/are/contextbench-retained-v1/contextbench-round31-live'}
  ],all={rows:[],trajectories:[]};
  for(const spec of specs){const part=extractRound(spec);all.rows.push(...part.rows);all.trajectories.push(...part.trajectories);}
  const artifact={schema_version:'are.contextbench-round32-runtime-features/v1',status:'extracted-gold-blind-exposed-evidence',source_refs:specs.flatMap(spec=>[{path:spec.outcomePath,sha256:sha(spec.outcomePath)},{path:spec.freezePath,sha256:sha(spec.freezePath)}]),trajectory_count:all.trajectories.length,candidate_path_count:all.rows.length,round_counts:Object.fromEntries([30,31].map(round=>[round,{trajectories:all.trajectories.filter(row=>row.round===round).length,candidate_paths:all.rows.filter(row=>row.round===round).length}])),feature_contract:{allowed:['path and observed body lexical features','distinct observation count','confirmed receipt presentation count','recency','width','model-selected path relationships','later apply_edits relationship','assistant public-content mentions'],forbidden:['gold','reference patch','task identity as feature','hidden reasoning','current revision bytes']},trajectories:all.trajectories,rows:all.rows,model_calls:0,additional_model_tokens:0,claim_ceiling:'Gold-blind feature extraction from exposed trajectories. No quality label, hypothesis support, or benchmark clearance.',benchmark_cleared:false,authority_effect:'none',open_questions_ref:'PLAN-round32.md#open-questions'};
  const target=resolve(research,'round32-runtime-features.json');writeFileSync(target,JSON.stringify(artifact,null,2)+'\n',{flag:'wx'});return artifact;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const result=extract();console.log(JSON.stringify({status:result.status,trajectories:result.trajectory_count,candidate_paths:result.candidate_path_count,round_counts:result.round_counts,model_calls:0}));}
