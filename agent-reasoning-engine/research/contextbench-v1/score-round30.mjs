import {existsSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {sha,verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';
import {buildTerminalEffectState} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/terminal-effect-state.mjs';
import {exportModelSelectedContext} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/final-selection.mjs';
import {evaluateConfirmation,f1} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/confirmation-statistics.mjs';
import {stable} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';

const read=path=>JSON.parse(readFileSync(path)),fileSha=path=>sha(readFileSync(path));
const writeExact=(path,value)=>{const bytes=JSON.stringify(value,null,2)+'\n';if(existsSync(path)){if(readFileSync(path,'utf8')!==bytes)throw Error('round30.output-drift:'+path);}else writeFileSync(path,bytes,{flag:'wx'});};
const zeroMetrics=()=>({span_coverage:0,span_precision:0,span_f1:0,file_coverage:0,file_precision:0});
const number=value=>Number.isFinite(value)?value:0;
const nativeMetrics=final=>({span_coverage:number(final.span.coverage),span_precision:number(final.span.precision),span_f1:f1(final.span),file_coverage:number(final.file.coverage),file_precision:number(final.file.precision)});

function scorePrediction({freeze,predictionPath,scorePath}){
  if(!existsSync(scorePath)){
    const scored=spawnSync(freeze.python,[freeze.scorer,'--upstream',freeze.upstream,'--gold',resolve(freeze.upstream,'data/full.parquet'),'--pred',predictionPath,'--cache',freeze.scoring_cache,'--out',scorePath],{encoding:'utf8',timeout:180000,maxBuffer:2_000_000});
    if(scored.status!==0)throw Error('round30.native-score:'+scored.stderr);
  }
  return read(scorePath).native.final;
}

async function reconstructSelections({freeze,cell,result,run,task}){
  const source_snapshots=readdirSync(resolve(run,'snapshots')).filter(name=>name.endsWith('.json')).sort().map(name=>read(resolve(run,'snapshots',name)));
  const common={...result,task,source_snapshots,response_capture:result.response_captures.at(-1)};
  const treatment=exportModelSelectedContext(common,resolve(run,'base'));
  if(stable(treatment.selection)!==stable(result.selection)||stable(treatment.prediction)!==stable(result.native_export?.prediction)||stable(treatment.prediction)!==stable(read(resolve(run,'prediction.json'))))throw Error('round30.treatment-reconstruction:'+cell.cell_id);
  const baseline=exportModelSelectedContext({...common,selection:undefined},resolve(run,'base'));
  if(stable(baseline.selection.final_read_ids)!==stable(result.selection.model_read_ids))throw Error('round30.baseline-selection:'+cell.cell_id);
  const baselinePrediction=resolve(run,'native-prediction-model-only.json'),baselineScore=resolve(run,'native-score-model-only.json'),treatmentPrediction=resolve(run,'native-prediction-treatment-reconstructed.json'),treatmentScore=resolve(run,'native-score-treatment-reconstructed.json');writeExact(baselinePrediction,baseline.prediction);writeExact(treatmentPrediction,treatment.prediction);
  const baselineFinal=scorePrediction({freeze,predictionPath:baselinePrediction,scorePath:baselineScore}),treatmentFinal=scorePrediction({freeze,predictionPath:treatmentPrediction,scorePath:treatmentScore}),originalTreatment=read(resolve(run,'native-score.json')).native.final;
  if(stable(treatmentFinal)!==stable(originalTreatment))throw Error('round30.treatment-score-reconstruction:'+cell.cell_id);
  return{baseline:nativeMetrics(baselineFinal),treatment:nativeMetrics(treatmentFinal),baseline_prediction_sha256:fileSha(baselinePrediction),baseline_score_sha256:fileSha(baselineScore),treatment_prediction_sha256:fileSha(treatmentPrediction),treatment_score_sha256:fileSha(treatmentScore),original_treatment_score_sha256:fileSha(resolve(run,'native-score.json'))};
}

export async function scoreRound30({freezePath,liveRoot,reportPath}){
  const {freeze,matrix}=verifyFreeze(freezePath),completion=read(resolve(liveRoot,'sequence/completed.json'));
  if(completion.scheduled_prefixes!==matrix.prefixes.length||completion.scheduled_branches!==matrix.branches.length||completion.completed_or_retained!==true)throw Error('round30.sequence-completion');
  const skipped=read(resolve(liveRoot,'sequence/skipped.json')).rows,skipById=new Map(skipped.map(row=>[row.cell_id,row]));if(skipById.size!==skipped.length||skipped.some(row=>!matrix.branches.some(cell=>cell.cell_id===row.cell_id)))throw Error('round30.skipped-ledger');
  const manifest=read(freeze.task_manifest_ref),taskRoot=dirname(freeze.task_manifest_ref),taskById=new Map(manifest.tasks.map(row=>[row.instance_id,row])),taskMeta=new Map(matrix.tasks.map(row=>[row.instance_id,row])),prefixRows=[],prefixTokens=new Map(),rows=[];
  for(const cell of matrix.prefixes){
    const unavailable=taskMeta.get(cell.instance_id)?.input_status==='input-unavailable',run=resolve(liveRoot,cell.cell_id),resultPath=resolve(run,'result.json'),completedPath=resolve(run,'completed.json');
    if(unavailable){if(existsSync(resultPath)||existsSync(completedPath))throw Error('round30.unavailable-dispatched:'+cell.cell_id);prefixTokens.set(cell.cell_id,0);prefixRows.push({cell_id:cell.cell_id,instance_id:cell.instance_id,status:'input_unavailable',model_calls:0,model_tokens:0,unknown_usage_calls:0});continue;}
    if(!existsSync(resultPath)||!existsSync(completedPath))throw Error('round30.prefix-missing:'+cell.cell_id);
    const result=read(resultPath),completed=read(completedPath);if(completed.result_sha256!==fileSha(resultPath)||completed.status!==result.status)throw Error('round30.prefix-integrity:'+cell.cell_id);
    const receipts=result.receipts.filter(r=>r.kind==='model'&&r.dispatched),unknown=receipts.filter(r=>!Number.isSafeInteger(r.input_tokens)||!Number.isSafeInteger(r.output_tokens)).length,tokens=receipts.reduce((sum,r)=>sum+r.input_tokens+r.output_tokens,0);
    prefixTokens.set(cell.cell_id,tokens);prefixRows.push({cell_id:cell.cell_id,instance_id:cell.instance_id,status:result.status,model_calls:receipts.length,model_tokens:tokens,unknown_usage_calls:unknown,result_sha256:completed.result_sha256});
  }
  for(const cell of matrix.branches){
    const meta=taskMeta.get(cell.instance_id),base={cell_id:cell.cell_id,prefix_cell_id:cell.prefix_cell_id,instance_id:cell.instance_id,repo:meta.repo,repetition:cell.repetition},run=resolve(liveRoot,cell.cell_id),resultPath=resolve(run,'result.json'),completedPath=resolve(run,'completed.json');
    if(!existsSync(resultPath)){
      const skip=skipById.get(cell.cell_id);if(!skip)throw Error('round30.unaccounted:'+cell.cell_id);
      const prefix=prefixRows.find(row=>row.cell_id===cell.prefix_cell_id),allowedSkip=new Set(['not_started_prefix_ineligible','not_started_input_unavailable']);if(!allowedSkip.has(skip.status)||skip.prefix_cell_id!==cell.prefix_cell_id||skip.instance_id!==cell.instance_id||!prefix||skip.prefix_status!==prefix.status)throw Error('round30.skip-integrity:'+cell.cell_id);
      rows.push({...base,status:skip.status,...Object.fromEntries(Object.entries(zeroMetrics()).flatMap(([key,value])=>[[`baseline_${key}`,value],[`treatment_${key}`,value]])),baseline_valid:false,treatment_valid:false,closure_ids:0,additional_model_calls:0,additional_model_tokens:0,model_calls:0,model_tokens:0,incremental_model_tokens:0,unknown_usage_calls:0,independent_reconstruction_agrees:true});continue;
    }
    if(!existsSync(completedPath))throw Error('round30.branch-completion:'+cell.cell_id);
    const result=read(resultPath),completed=read(completedPath);if(completed.result_sha256!==fileSha(resultPath)||completed.status!==result.status)throw Error('round30.branch-integrity:'+cell.cell_id);
    const receipts=result.receipts.filter(r=>r.kind==='model'&&r.dispatched),unknown=receipts.filter(r=>!Number.isSafeInteger(r.input_tokens)||!Number.isSafeInteger(r.output_tokens)).length,tokens=receipts.reduce((sum,r)=>sum+(r.input_tokens??0)+(r.output_tokens??0),0),incremental=tokens-(prefixTokens.get(cell.prefix_cell_id)??0);
    if(!result.selection){rows.push({...base,status:result.status,...Object.fromEntries(Object.entries(zeroMetrics()).flatMap(([key,value])=>[[`baseline_${key}`,value],[`treatment_${key}`,value]])),baseline_valid:false,treatment_valid:false,closure_ids:0,additional_model_calls:0,additional_model_tokens:0,model_calls:receipts.length,model_tokens:tokens,incremental_model_tokens:incremental,unknown_usage_calls:unknown,independent_reconstruction_agrees:true,result_sha256:completed.result_sha256});continue;}
    const selection=result.selection,rebuilt=await buildTerminalEffectState({captures:result.captures,receipts:result.receipts,patch:result.patch,repoRoot:resolve(run,'base'),max_evidence:freeze.maximum_closure_evidence});
    if(stable(rebuilt.selection_read_ids)!==stable(selection.terminal_effect_read_ids))throw Error('round30.closure-rebuild:'+cell.cell_id);
    const union=[...new Set([...selection.model_read_ids,...selection.terminal_effect_read_ids])];if(stable(union)!==stable(selection.final_read_ids)||rebuilt.evidence.length>freeze.maximum_closure_evidence||rebuilt.model_tokens!==0&&rebuilt.model_tokens!==undefined)throw Error('round30.closure-policy:'+cell.cell_id);
    const events=readFileSync(resolve(run,'events.jsonl'),'utf8').split('\n').filter(Boolean).map(line=>JSON.parse(line)).filter(event=>event.kind==='terminal-effect-selection-closure');if(events.length!==1||events[0].additional_model_calls!==0||events[0].additional_model_tokens!==0||stable(events[0].evidence??[])!==stable(rebuilt.evidence))throw Error('round30.closure-event:'+cell.cell_id);
    const taskEntry=taskById.get(cell.instance_id);if(!taskEntry?.file)throw Error('round30.task:'+cell.cell_id);const task=read(resolve(taskRoot,taskEntry.file));
    let scored;
    if(selection.final_read_ids.length===0){if(selection.model_read_ids.length!==0||result.native_export!=null||existsSync(resolve(run,'prediction.json'))||existsSync(resolve(run,'native-score.json')))throw Error('round30.empty-selection-artifacts:'+cell.cell_id);scored={baseline:zeroMetrics(),treatment:zeroMetrics(),empty_selection:true};}
    else scored=await reconstructSelections({freeze,cell,result,run,task});
    rows.push({...base,status:result.status,...Object.fromEntries(Object.entries(scored.baseline).map(([key,value])=>[`baseline_${key}`,value])),...Object.fromEntries(Object.entries(scored.treatment).map(([key,value])=>[`treatment_${key}`,value])),baseline_valid:selection.model_read_ids.length>0,treatment_valid:selection.final_read_ids.length>0,model_read_ids:selection.model_read_ids,closure_read_ids:selection.terminal_effect_read_ids,final_read_ids:selection.final_read_ids,closure_ids:selection.terminal_effect_read_ids.length,closure_reason:rebuilt.reason,closure_evidence:rebuilt.evidence,additional_model_calls:0,additional_model_tokens:0,model_calls:receipts.length,model_tokens:tokens,incremental_model_tokens:incremental,unknown_usage_calls:unknown,independent_reconstruction_agrees:true,result_sha256:completed.result_sha256,score_evidence:scored});
  }
  const evaluation=evaluateConfirmation(rows,matrix.success_criteria,freeze.bootstrap),physicalTokens=prefixRows.reduce((sum,row)=>sum+row.model_tokens,0)+rows.reduce((sum,row)=>sum+row.incremental_model_tokens,0),report={schema_version:'are.contextbench-round30-confirmation/v1',status:evaluation.passed?'complete-accounted-confirmation-passed':'complete-accounted-confirmation-failed',scheduled:{identities:matrix.tasks.length,prefixes:matrix.prefixes.length,trajectories:matrix.branches.length,cells:matrix.cells.length},accounted:{identities:new Set(rows.map(row=>row.instance_id)).size,prefixes:prefixRows.length,trajectories:rows.length,skipped:skipped.length},model_accounting:{physical_known_model_tokens:physicalTokens,same_trajectory_token_difference:0,unknown_model_receipts:evaluation.unknown_model_receipts},evaluation,rows,prefixes:prefixRows,benchmark_cleared:false,claim_ceiling:'Untouched GLM-5.3-flash 8K confirmation only. Full 1,136-identity accounting and larger windows remain required.',authority_effect:'none',open_questions_ref:'PLAN-round30.md#open-questions'};
  writeExact(reportPath,report);return report;
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const [freezePath,liveRoot,reportPath]=process.argv.slice(2);if(!reportPath)throw Error('freeze live-root report required');const report=await scoreRound30({freezePath,liveRoot,reportPath});console.log(JSON.stringify({status:report.status,span_f1_gain:report.evaluation.gains.span_f1,bootstrap_lower_95:report.evaluation.bootstrap.lower_95,repetitions:report.evaluation.repetitions,checks:report.evaluation.checks,physical_model_tokens:report.model_accounting.physical_known_model_tokens}));}
