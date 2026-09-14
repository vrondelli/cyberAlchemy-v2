import {existsSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {sha,verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';
import {buildTerminalEffectState} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/terminal-effect-state.mjs';
import {exportModelSelectedContext} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/final-selection.mjs';
import {stable} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';

const repository=resolve('.'),research=resolve('agent-reasoning-engine/research/contextbench-v1'),implementation=resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1'),live='/home/vrondelli/.cache/are/contextbench-round29-live';
const freezePath=resolve(research,'freeze-round29-execution.json'),read=path=>JSON.parse(readFileSync(path)),fileSha=path=>sha(readFileSync(path));
const f1=value=>value&&(value.coverage+value.precision)?2*value.coverage*value.precision/(value.coverage+value.precision):value?0:null;
const mean=values=>values.reduce((sum,value)=>sum+value,0)/values.length;
const writeExact=(path,value)=>{const bytes=JSON.stringify(value,null,2)+'\n';if(existsSync(path)){if(readFileSync(path,'utf8')!==bytes)throw Error('round29.output-drift:'+path);}else writeFileSync(path,bytes,{flag:'wx'});};

async function scoreBaseline({cell,result,run,manifest}){
  if(result.selection.model_read_ids.length===0)return {span_f1:0,file_f1:0,score_source:'explicit-empty-model-selection-derived-zero'};
  const taskEntry=manifest.tasks.find(item=>item.instance_id===cell.instance_id);if(!taskEntry)throw Error('round29.task:'+cell.cell_id);
  const task=read(resolve(implementation,'development-tasks',taskEntry.file));
  const source_snapshots=readdirSync(resolve(run,'snapshots')).filter(name=>name.endsWith('.json')).sort().map(name=>read(resolve(run,'snapshots',name)));
  const exported=exportModelSelectedContext({...result,selection:undefined,task,source_snapshots,response_capture:result.response_captures.at(-1)},resolve(run,'base'));
  if(stable(exported.selection.final_read_ids)!==stable(result.selection.model_read_ids))throw Error('round29.baseline-selection:'+cell.cell_id);
  const predictionPath=resolve(run,'native-prediction-model-only.json'),scorePath=resolve(run,'native-score-model-only.json');
  writeExact(predictionPath,exported.prediction);
  if(!existsSync(scorePath)){
    const scored=spawnSync('/tmp/are-contextbench-venv-117/bin/python',[resolve(implementation,'score_native.py'),'--upstream','/tmp/are-contextbench-upstream-117','--gold','/tmp/are-contextbench-upstream-117/data/full.parquet','--pred',predictionPath,'--cache','/tmp/are-contextbench-native-score-cache-v1','--out',scorePath],{encoding:'utf8',timeout:180000,maxBuffer:2_000_000});
    if(scored.status!==0)throw Error('round29.baseline-score:'+cell.cell_id+':'+scored.stderr);
  }
  const final=read(scorePath).native.final;
  return {span_f1:f1(final.span),file_f1:f1(final.file),score_source:'native-scorer',prediction_sha256:fileSha(predictionPath),score_sha256:fileSha(scorePath)};
}

export async function score(){
  const {matrix}=verifyFreeze(freezePath),completionPath=resolve(live,'sequence/completed.json');if(!existsSync(completionPath))throw Error('round29.sequence-incomplete');
  const completion=read(completionPath);if(completion.scheduled_prefixes!==8||completion.scheduled_branches!==24||completion.completed_or_retained!==true)throw Error('round29.sequence-completion');
  const skipped=read(resolve(live,'sequence/skipped.json')).rows,skipById=new Map(skipped.map(row=>[row.cell_id,row])),manifest=read(resolve(implementation,'development-tasks/manifest.json')),prefixRows=[],prefixTokens=new Map(),rows=[];
  for(const cell of matrix.prefixes){
    const run=resolve(live,cell.cell_id),resultPath=resolve(run,'result.json'),completedPath=resolve(run,'completed.json');
    if(!existsSync(resultPath)||!existsSync(completedPath))throw Error('round29.prefix-missing:'+cell.cell_id);
    const result=read(resultPath),completed=read(completedPath);if(completed.result_sha256!==fileSha(resultPath)||completed.status!==result.status)throw Error('round29.prefix-integrity:'+cell.cell_id);
    const receipts=result.receipts.filter(r=>r.kind==='model'&&r.dispatched),unknown=receipts.filter(r=>!Number.isSafeInteger(r.input_tokens)||!Number.isSafeInteger(r.output_tokens)).length,tokens=receipts.reduce((sum,r)=>sum+(r.input_tokens??0)+(r.output_tokens??0),0);
    prefixTokens.set(cell.cell_id,tokens);prefixRows.push({cell_id:cell.cell_id,instance_id:cell.instance_id,status:result.status,model_calls:receipts.length,model_tokens:tokens,unknown_usage_calls:unknown,result_sha256:completed.result_sha256});
  }
  for(const cell of matrix.branches){
    const run=resolve(live,cell.cell_id),resultPath=resolve(run,'result.json'),completedPath=resolve(run,'completed.json');
    if(!existsSync(resultPath)){
      const skip=skipById.get(cell.cell_id);if(!skip)throw Error('round29.unaccounted:'+cell.cell_id);
      rows.push({cell_id:cell.cell_id,instance_id:cell.instance_id,repetition:cell.repetition,status:skip.status,baseline_span_f1:0,treatment_span_f1:0,span_f1_delta:0,baseline_file_f1:0,treatment_file_f1:0,file_f1_delta:0,baseline_valid:false,treatment_valid:false,closure_ids:0,additional_model_calls:0,additional_model_tokens:0,model_calls:0,model_tokens:0,unknown_usage_calls:0});continue;
    }
    if(!existsSync(completedPath))throw Error('round29.branch-completion:'+cell.cell_id);
    const result=read(resultPath),completed=read(completedPath);if(completed.result_sha256!==fileSha(resultPath)||completed.status!==result.status)throw Error('round29.branch-integrity:'+cell.cell_id);
    const receipts=result.receipts.filter(r=>r.kind==='model'&&r.dispatched),unknown=receipts.filter(r=>!Number.isSafeInteger(r.input_tokens)||!Number.isSafeInteger(r.output_tokens)).length,tokens=receipts.reduce((sum,r)=>sum+(r.input_tokens??0)+(r.output_tokens??0),0),incremental=tokens-(prefixTokens.get(cell.prefix_cell_id)??0);
    if(!result.selection){rows.push({cell_id:cell.cell_id,instance_id:cell.instance_id,repetition:cell.repetition,status:result.status,baseline_span_f1:0,treatment_span_f1:0,span_f1_delta:0,baseline_file_f1:0,treatment_file_f1:0,file_f1_delta:0,baseline_valid:false,treatment_valid:false,closure_ids:0,additional_model_calls:0,additional_model_tokens:0,model_calls:receipts.length,model_tokens:tokens,incremental_model_tokens:incremental,unknown_usage_calls:unknown,result_sha256:completed.result_sha256});continue;}
    const selection=result.selection;if(!Array.isArray(selection.model_read_ids)||!Array.isArray(selection.terminal_effect_read_ids)||!Array.isArray(selection.final_read_ids))throw Error('round29.selection-shape:'+cell.cell_id);
    const rebuilt=await buildTerminalEffectState({captures:result.captures,receipts:result.receipts,patch:result.patch,repoRoot:resolve(run,'base'),max_evidence:6});
    if(stable(rebuilt.selection_read_ids)!==stable(selection.terminal_effect_read_ids))throw Error('round29.closure-rebuild:'+cell.cell_id);
    const union=[...new Set([...selection.model_read_ids,...selection.terminal_effect_read_ids])];if(stable(union)!==stable(selection.final_read_ids))throw Error('round29.selection-union:'+cell.cell_id);
    if(rebuilt.evidence.length>6||rebuilt.model_tokens!==0&&rebuilt.model_tokens!==undefined)throw Error('round29.closure-policy:'+cell.cell_id);
    const events=readFileSync(resolve(run,'events.jsonl'),'utf8').split('\n').filter(Boolean).map(line=>JSON.parse(line)).filter(event=>event.kind==='terminal-effect-selection-closure');if(events.length!==1||events[0].additional_model_calls!==0||events[0].additional_model_tokens!==0||stable(events[0].evidence??[])!==stable(rebuilt.evidence))throw Error('round29.closure-event:'+cell.cell_id);
    const baseline=await scoreBaseline({cell,result,run,manifest});
    let treatment={span_f1:0,file_f1:0,score_source:'explicit-empty-final-selection-derived-zero'};
    if(selection.final_read_ids.length){const scorePath=resolve(run,'native-score.json');if(!existsSync(scorePath))throw Error('round29.treatment-score:'+cell.cell_id);const final=read(scorePath).native.final;treatment={span_f1:f1(final.span),file_f1:f1(final.file),score_source:'native-scorer',score_sha256:fileSha(scorePath)};}
    rows.push({cell_id:cell.cell_id,instance_id:cell.instance_id,repetition:cell.repetition,status:result.status,baseline_span_f1:baseline.span_f1,treatment_span_f1:treatment.span_f1,span_f1_delta:treatment.span_f1-baseline.span_f1,baseline_file_f1:baseline.file_f1,treatment_file_f1:treatment.file_f1,file_f1_delta:treatment.file_f1-baseline.file_f1,baseline_valid:selection.model_read_ids.length>0,treatment_valid:selection.final_read_ids.length>0,model_read_ids:selection.model_read_ids,closure_read_ids:selection.terminal_effect_read_ids,final_read_ids:selection.final_read_ids,closure_ids:selection.terminal_effect_read_ids.length,closure_reason:rebuilt.reason,closure_evidence:rebuilt.evidence,additional_model_calls:0,additional_model_tokens:0,model_calls:receipts.length,model_tokens:tokens,incremental_model_tokens:incremental,unknown_usage_calls:unknown,result_sha256:completed.result_sha256,baseline,treatment});
  }
  if(rows.length!==24||prefixRows.length!==8)throw Error('round29.denominator');
  const spanGain=mean(rows.map(row=>row.span_f1_delta)),fileGain=mean(rows.map(row=>row.file_f1_delta)),unknown=prefixRows.reduce((s,r)=>s+r.unknown_usage_calls,0)+rows.reduce((s,r)=>s+r.unknown_usage_calls,0),baselineValid=rows.filter(r=>r.baseline_valid).length,treatmentValid=rows.filter(r=>r.treatment_valid).length,integrity=rows.every(r=>r.additional_model_calls===0&&r.additional_model_tokens===0&&r.closure_ids<=6),passed=spanGain>=0.05&&fileGain>=0&&treatmentValid>=baselineValid&&unknown===0&&integrity;
  const report={schema_version:'are.contextbench-round29-outcome-review/v1',status:passed?'complete-accounted-development-gate-passed':'complete-accounted-development-denominator-target-missed',scheduled:{prefixes:8,trajectories:24,cells:32},accounted:{prefixes:prefixRows.length,trajectories:rows.length,skipped:skipped.length},status_counts:Object.fromEntries([...new Set(rows.map(r=>r.status))].sort().map(status=>[status,rows.filter(r=>r.status===status).length])),model_accounting:{physical_known_model_tokens:prefixRows.reduce((s,r)=>s+r.model_tokens,0)+rows.reduce((s,r)=>s+(r.incremental_model_tokens??0),0),same_trajectory_token_difference:0,unknown_model_receipts:unknown},closure:{applied_trajectories:rows.filter(r=>r.closure_ids>0).length,selection_changed:rows.filter(r=>r.closure_read_ids?.some(id=>!r.model_read_ids.includes(id))).length,maximum_evidence:6,additional_model_calls:0,additional_model_tokens:0,integrity_passed:integrity},gate_review:{scheduled_zero_filled_span_f1_gain:spanGain,minimum_required:0.05,scheduled_zero_filled_file_f1_gain:fileGain,valid_completions:{baseline:baselineValid,treatment:treatmentValid,difference:treatmentValid-baselineValid},quality_threshold_met:spanGain>=0.05,file_non_degradation_met:fileGain>=0,valid_completion_non_degradation_met:treatmentValid>=baselineValid,model_token_non_increase_met:true,all_model_tokens_accounted:unknown===0,passed},rows,prefixes:prefixRows,benchmark_cleared:false,claim_ceiling:'Fresh exposed GLM-5.3-flash 8K development result. A pass advances to untouched confirmation and does not itself clear ContextBench.',authority_effect:'none',open_questions_ref:'PLAN-round29.md#open-questions'};
  writeExact(resolve(research,'round29-outcome-review.json'),report);writeExact(resolve(research,'round29-analysis.json'),{schema_version:'are.contextbench-round29-analysis/v1',status:report.status,span_gain:spanGain,file_gain:fileGain,valid_difference:treatmentValid-baselineValid,token_difference:0,closure_applied:report.closure.applied_trajectories,selection_changed:report.closure.selection_changed,unknown_model_receipts:unknown,authority_effect:'none',open_questions_ref:'PLAN-round29.md#open-questions'});return report;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const report=await score();console.log(JSON.stringify({status:report.status,span_gain:report.gate_review.scheduled_zero_filled_span_f1_gain,file_gain:report.gate_review.scheduled_zero_filled_file_f1_gain,valid_difference:report.gate_review.valid_completions.difference,token_difference:0,closure_applied:report.closure.applied_trajectories,selection_changed:report.closure.selection_changed,unknown_model_receipts:report.model_accounting.unknown_model_receipts}));}
