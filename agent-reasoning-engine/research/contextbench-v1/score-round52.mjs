// Aggregate the preregistered Round 52 independent control/slate branches.
// Every locked identity remains in the denominator. No generation call occurs here.
import {existsSync,readFileSync,readdirSync,writeFileSync,rmSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {sha,verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';
import {exportModelSelectedContext} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/final-selection.mjs';
import {f1} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/confirmation-statistics.mjs';
import {stable} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {validateTerminalEvidenceHandleIncrementalPair} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/terminal-evidence-handle-incremental-validation.mjs';
import {applyBoundedFailureCensoring} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/censored-pair-accounting.mjs';

const read=path=>JSON.parse(readFileSync(path));
const fileSha=path=>sha(readFileSync(path));
const writeExact=(path,value)=>{const bytes=JSON.stringify(value,null,2)+'\n';if(existsSync(path)){if(readFileSync(path,'utf8')!==bytes)throw Error('round52.output-drift:'+path);}else writeFileSync(path,bytes,{flag:'wx'});};
const zeroMetrics=()=>({span_coverage:0,span_precision:0,span_f1:0,file_coverage:0,file_precision:0});
const number=value=>Number.isFinite(value)?value:0;
const nativeMetrics=final=>({span_coverage:number(final.span.coverage),span_precision:number(final.span.precision),span_f1:f1(final.span),file_coverage:number(final.file.coverage),file_precision:number(final.file.precision)});

function ensureScoringBase({cell,run,repositoryByInstance}){
  const base=resolve(run,'base');if(existsSync(base))return null;
  const source=repositoryByInstance.get(cell.instance_id);if(!source?.cache_path||!source?.base_commit)throw Error('round52.reconstruction-binding:'+cell.cell_id);
  let command=spawnSync('git',['-C',source.cache_path,'cat-file','-e',source.base_commit+'^{commit}'],{encoding:'utf8'});if(command.status!==0)throw Error('round52.reconstruction-commit:'+cell.cell_id);
  command=spawnSync('git',['-C',source.cache_path,'worktree','add','--detach',base,source.base_commit],{encoding:'utf8',maxBuffer:2_000_000});if(command.status!==0)throw Error('round52.reconstruction-worktree:'+cell.cell_id+':'+command.stderr);
  return source;
}
function removeScoringBase({source,run,cell}){
  const base=resolve(run,'base'),command=spawnSync('git',['-C',source.cache_path,'worktree','remove','--force',base],{encoding:'utf8',maxBuffer:2_000_000});
  if(command.status!==0){rmSync(base,{recursive:true,force:true});spawnSync('git',['-C',source.cache_path,'worktree','prune']);throw Error('round52.reconstruction-remove:'+cell.cell_id+':'+command.stderr);}
}
async function scorePrediction({freeze,predictionPath,scorePath}){
  if(!existsSync(scorePath))await new Promise((done,fail)=>{
    const child=spawn(freeze.python,[freeze.scorer,'--upstream',freeze.upstream,'--gold',resolve(freeze.upstream,'data/full.parquet'),'--pred',predictionPath,'--cache',freeze.scoring_cache,'--out',scorePath],{env:{...process.env,CONTEXTBENCH_TMP_ROOT:freeze.native_worktree_root}}),chunks=[];
    child.stderr.on('data',chunk=>{if(chunks.reduce((sum,x)=>sum+x.length,0)<2_000_000)chunks.push(chunk);});
    const timer=setTimeout(()=>{child.kill('SIGKILL');fail(Error('round52.native-score-timeout:'+predictionPath));},180000);
    child.on('error',error=>{clearTimeout(timer);fail(error);});child.on('close',code=>{clearTimeout(timer);if(code===0)done();else fail(Error('round52.native-score:'+Buffer.concat(chunks).toString()));});
  });
  const scored=read(scorePath);if(!scored?.native?.final)throw Error('round52.native-score-incomplete:'+scorePath);return scored.native.final;
}
async function scoreBranch({freeze,cell,run,result,repositoryByInstance,taskById,taskRoot,prefixTokens}){
  const modelReceipts=(result.receipts??[]).filter(receipt=>receipt.kind==='model'&&receipt.dispatched),unknown=modelReceipts.filter(receipt=>!Number.isSafeInteger(receipt.input_tokens)||!Number.isSafeInteger(receipt.output_tokens)).length;
  const tokens=modelReceipts.reduce((sum,receipt)=>sum+(receipt.input_tokens??0)+(receipt.output_tokens??0),0),incremental=tokens-prefixTokens;
  const statePresentations=result.decision_state_presentations??[],base={status:result.status,model_calls:modelReceipts.length,model_tokens:tokens,incremental_model_tokens:incremental,unknown_usage_calls:unknown,
    state_presentations:statePresentations.length,state_tokens:statePresentations.reduce((sum,row)=>sum+(row.measured_tokens??0),0),state_evidence:statePresentations.reduce((sum,row)=>sum+(row.handle_bindings?.length??row.evidence?.length??0),0),result_sha256:fileSha(resolve(run,'result.json'))};
  if(!result.selection)return {...base,...zeroMetrics(),valid:false,independent_reconstruction_agrees:true,selection_read_ids:[]};
  if(!result.selection.final_read_ids?.length){
    const clean=result.native_export==null&&!existsSync(resolve(run,'prediction.json'))&&!existsSync(resolve(run,'native-score.json'));
    return {...base,...zeroMetrics(),valid:false,independent_reconstruction_agrees:clean,selection_read_ids:[],empty_selection:true};
  }
  let source=null;
  try{
    source=ensureScoringBase({cell,run,repositoryByInstance});
    const taskEntry=taskById.get(cell.instance_id);if(!taskEntry)throw Error('round52.task:'+cell.cell_id);
    const task=read(resolve(taskRoot,taskEntry.file)),snapshots=readdirSync(resolve(run,'snapshots')).filter(name=>name.endsWith('.json')).sort().map(name=>read(resolve(run,'snapshots',name)));
    const rebuilt=exportModelSelectedContext({...result,task,source_snapshots:snapshots,response_capture:result.response_captures.at(-1)},resolve(run,'base'));
    const exact=stable(rebuilt.selection)===stable(result.selection)&&stable(rebuilt.prediction)===stable(result.native_export?.prediction)&&stable(rebuilt.prediction)===stable(read(resolve(run,'prediction.json')));
    const final=await scorePrediction({freeze,predictionPath:resolve(run,'prediction.json'),scorePath:resolve(run,'native-score.json')});
    return {...base,...nativeMetrics(final),valid:true,independent_reconstruction_agrees:exact,selection_read_ids:result.selection.final_read_ids,prediction_sha256:fileSha(resolve(run,'prediction.json')),native_score_sha256:fileSha(resolve(run,'native-score.json'))};
  }catch(error){return {...base,...zeroMetrics(),valid:false,independent_reconstruction_agrees:false,selection_read_ids:result.selection.final_read_ids??[],scoring_error:String(error.message)};}
  finally{if(source)removeScoringBase({source,run,cell});}
}

export async function scoreRound52({freezePath,liveRoot,reportPath}){
  const {freeze,matrix}=verifyFreeze(freezePath),completion=read(resolve(liveRoot,'sequence/completed.json'));
  if(completion.scheduled_prefixes!==8||completion.scheduled_branches!==16||completion.completed_or_retained!==true)throw Error('round52.sequence-completion');
  const skipped=read(resolve(liveRoot,'sequence/skipped.json')).rows,localFailures=read(resolve(liveRoot,'sequence/local-failures.json')).rows,skipById=new Map(skipped.map(row=>[row.cell_id,row]));
  if(skipById.size!==skipped.length||skipped.some(row=>!matrix.branches.some(cell=>cell.cell_id===row.cell_id)))throw Error('round52.skipped-ledger');
  const manifest=read(freeze.task_manifest_ref),taskRoot=dirname(freeze.task_manifest_ref),taskById=new Map(manifest.tasks.map(row=>[row.instance_id,row]));
  const repositoryByInstance=new Map(read(freeze.repository_inventory_ref).repositories.map(row=>[row.instance_id,row])),prefixRows=[],prefixTokens=new Map(),prefixResults=new Map();
  for(const cell of matrix.prefixes){
    const run=resolve(liveRoot,cell.cell_id),resultPath=resolve(run,'result.json'),completedPath=resolve(run,'completed.json');
    if(!existsSync(resultPath)||!existsSync(completedPath))throw Error('round52.prefix-missing:'+cell.cell_id);
    const result=read(resultPath),completed=read(completedPath);if(completed.result_sha256!==fileSha(resultPath)||completed.status!==result.status)throw Error('round52.prefix-integrity:'+cell.cell_id);
    const receipts=(result.receipts??[]).filter(row=>row.kind==='model'&&row.dispatched),unknown=receipts.filter(row=>!Number.isSafeInteger(row.input_tokens)||!Number.isSafeInteger(row.output_tokens)).length,tokens=receipts.reduce((sum,row)=>sum+(row.input_tokens??0)+(row.output_tokens??0),0);
    prefixTokens.set(cell.cell_id,tokens);prefixResults.set(cell.cell_id,result);prefixRows.push({cell_id:cell.cell_id,instance_id:cell.instance_id,status:result.status,model_calls:receipts.length,model_tokens:tokens,unknown_usage_calls:unknown,result_sha256:completed.result_sha256,boundary_kind:result.shared_prefix_boundary?.kind??null});
  }
  const branchRows=[],branchResults=new Map();
  for(const cell of matrix.branches){
    const run=resolve(liveRoot,cell.cell_id),resultPath=resolve(run,'result.json'),completedPath=resolve(run,'completed.json'),common={cell_id:cell.cell_id,prefix_cell_id:cell.prefix_cell_id,instance_id:cell.instance_id,state_arm:cell.state_arm,repetition:cell.repetition};
    if(!existsSync(resultPath)){
      const skip=skipById.get(cell.cell_id);if(!skip)throw Error('round52.unaccounted:'+cell.cell_id);
      branchRows.push({...common,status:skip.status,...zeroMetrics(),valid:false,model_calls:0,model_tokens:prefixTokens.get(cell.prefix_cell_id)??0,incremental_model_tokens:0,unknown_usage_calls:0,state_presentations:0,state_tokens:0,state_evidence:0,independent_reconstruction_agrees:true,selection_read_ids:[]});continue;
    }
    if(!existsSync(completedPath))throw Error('round52.branch-completion:'+cell.cell_id);
    const result=read(resultPath),completed=read(completedPath);if(completed.result_sha256!==fileSha(resultPath)||completed.status!==result.status)throw Error('round52.branch-integrity:'+cell.cell_id);branchResults.set(cell.cell_id,result);
    branchRows.push({...common,...await scoreBranch({freeze,cell,run,result,repositoryByInstance,taskById,taskRoot,prefixTokens:prefixTokens.get(cell.prefix_cell_id)??0})});
  }
  let rows=[];const pairValidations=[];
  for(const task of matrix.tasks){
    const pair=branchRows.filter(row=>row.instance_id===task.instance_id),control=pair.find(row=>row.state_arm==='control'),treatment=pair.find(row=>row.state_arm==='state');
    if(pair.length!==2||!control||!treatment)throw Error('round52.pair-shape:'+task.instance_id);
    const prefixCell=matrix.prefixes.find(cell=>cell.instance_id===task.instance_id),controlCell=matrix.branches.find(cell=>cell.instance_id===task.instance_id&&cell.state_arm==='control'),treatmentCell=matrix.branches.find(cell=>cell.instance_id===task.instance_id&&cell.state_arm==='state');
    const validation=prefixResults.has(prefixCell.cell_id)&&branchResults.has(controlCell.cell_id)&&branchResults.has(treatmentCell.cell_id)?validateTerminalEvidenceHandleIncrementalPair({prefix:prefixResults.get(prefixCell.cell_id),control:branchResults.get(controlCell.cell_id),treatment:branchResults.get(treatmentCell.cell_id),maximum_state_tokens:160,maximum_state_bytes:1024,maximum_handles:3,minimum_input_token_reduction:128,maximum_paired_token_difference:3072,total_token_limit:96000}):{ok:false,issues:[{code:'terminal-handles-incremental.unstarted-pair'}],measurements:{}};
    const pairValidation={instance_id:task.instance_id,prefix_cell_id:prefixCell.cell_id,control_cell_id:controlCell.cell_id,treatment_cell_id:treatmentCell.cell_id,...validation};pairValidations.push(pairValidation);rows.push({instance_id:task.instance_id,repo:task.repo,language:task.language,control,treatment,pair_validation:pairValidation});
  }
  const censoring=applyBoundedFailureCensoring({rows,prefixRows,localFailures,maximumIndeterminateCalls:2,minimumCompletePairs:6,totalTokenLimit:96000});rows=censoring.rows;
  const keys=['span_coverage','span_precision','span_f1','file_coverage','file_precision'],mean=values=>values.reduce((sum,value)=>sum+value,0)/values.length,control={},treatment={},gains={};
  for(const key of keys){control[key]=mean(rows.map(row=>row.control[key]));treatment[key]=mean(rows.map(row=>row.treatment[key]));gains[key]=treatment[key]-control[key];}
  const unknown=prefixRows.reduce((sum,row)=>sum+row.unknown_usage_calls,0)+branchRows.reduce((sum,row)=>sum+row.unknown_usage_calls,0),controlValid=rows.filter(row=>row.control.valid).length,treatmentValid=rows.filter(row=>row.treatment.valid).length;
  const phase_evaluation=Object.fromEntries(['effect','terminal','pressure'].map(phase=>{
    const phaseRows=rows.filter(row=>row.pair_validation?.measurements?.phase===phase);
    if(!phaseRows.length)return[phase,{pairs:0,control:null,treatment:null,gains:null,valid_selections:{control:0,treatment:0},treatment_minus_control_tokens:0}];
    const phaseControl={},phaseTreatment={},phaseGains={};
    for(const key of keys){phaseControl[key]=mean(phaseRows.map(row=>row.control[key]));phaseTreatment[key]=mean(phaseRows.map(row=>row.treatment[key]));phaseGains[key]=phaseTreatment[key]-phaseControl[key];}
    return[phase,{pairs:phaseRows.length,control:phaseControl,treatment:phaseTreatment,gains:phaseGains,valid_selections:{control:phaseRows.filter(row=>row.control.valid).length,treatment:phaseRows.filter(row=>row.treatment.valid).length},treatment_minus_control_tokens:phaseRows.reduce((sum,row)=>sum+row.treatment.conservative_model_tokens-row.control.conservative_model_tokens,0)}];
  }));
  const completeValidations=pairValidations.filter(row=>row.ok),uncensoredBranches=rows.filter(row=>!row.censored).flatMap(row=>[row.control,row.treatment]);
  const instrumentChecks={...censoring.checks,fixed_denominator:rows.length===8&&branchRows.length===16&&new Set(rows.map(row=>row.instance_id)).size===8,no_automatic_retries:[...prefixResults.values(),...branchResults.values()].flatMap(result=>(result.receipts??[]).filter(receipt=>receipt.kind==='model'&&receipt.dispatched)).every(receipt=>receipt.automatic_retries===0),independent_reconstruction:uncensoredBranches.every(row=>row.independent_reconstruction_agrees),complete_pair_causal_validation:completeValidations.length===censoring.accounting.complete_pairs,terminal_decision_boundary:completeValidations.every(row=>row.measurements.phase==='terminal'),held_response_zero_effect:completeValidations.every(row=>prefixResults.get(row.prefix_cell_id)?.shared_prefix_boundary?.kind==='terminal-candidate'),control_has_no_state:completeValidations.every(row=>row.measurements.control_state_presentations===0),treatment_state_once:completeValidations.every(row=>row.measurements.treatment_state_presentations===1&&row.measurements.treatment_state_tokens<=160&&row.measurements.treatment_state_bytes<=1024&&row.measurements.private_handle_count<=3&&row.measurements.first_request_input_token_difference<=-128),treatment_added_full_ids_zero:completeValidations.every(row=>row.measurements.treatment_added_full_read_id_occurrences===0),inherited_full_id_occurrences_paired:completeValidations.every(row=>row.measurements.inherited_full_read_id_occurrences_paired===true&&row.measurements.common_prompt_byte_equivalent===true),paired_token_bound:completeValidations.every(row=>row.measurements.paired_token_difference<=3072)};
  const physicalKnownTokens=prefixRows.reduce((sum,row)=>sum+row.model_tokens,0)+branchRows.reduce((sum,row)=>sum+Math.max(0,row.incremental_model_tokens),0),physicalConservativeTokens=physicalKnownTokens+censoring.accounting.conservative_token_debit,controlLogical=rows.reduce((sum,row)=>sum+row.control.conservative_model_tokens,0),treatmentLogical=rows.reduce((sum,row)=>sum+row.treatment.conservative_model_tokens,0);
  const semanticChecks={span_f1_gain:gains.span_f1>=0.05,span_coverage_nondegrade:gains.span_coverage>=0,span_precision_nondegrade:gains.span_precision>=0,file_coverage_nondegrade:gains.file_coverage>=0,file_precision_nondegrade:gains.file_precision>=0,valid_selection_nondegrade:treatmentValid>=controlValid,aggregate_treatment_tokens_not_above_control:treatmentLogical<=controlLogical};
  const instrumentPassed=Object.values(instrumentChecks).every(Boolean),semanticInterpretable=instrumentPassed&&censoring.accounting.complete_pairs>=6,semanticPassed=semanticInterpretable&&Object.values(semanticChecks).every(Boolean),evaluation={control,treatment,gains,valid_selections:{control:controlValid,treatment:treatmentValid},exact_unknown_model_receipts:unknown,instrument:{...censoring.accounting,checks:instrumentChecks,passed:instrumentPassed},semantic:{interpretable:semanticInterpretable,checks:semanticChecks,passed:semanticPassed},passed:instrumentPassed&&semanticPassed};
  const report={schema_version:'are.contextbench-round52-development/v1',status:evaluation.passed?'complete-accounted-canary-passed':instrumentPassed?'complete-accounted-semantic-failed':'instrument-failed',scheduled:{identities:8,prefixes:8,review_branches:16,cells:24},accounted:{identities:rows.length,prefixes:prefixRows.length,review_branches:branchRows.length,skipped:skipped.length,local_failures:localFailures.length},model_accounting:{physical_known_model_tokens:physicalKnownTokens,physical_conservative_model_token_upper_bound:physicalConservativeTokens,conservative_indeterminate_token_debit:censoring.accounting.conservative_token_debit,control_logical_model_token_upper_bound:controlLogical,treatment_logical_model_token_upper_bound:treatmentLogical,treatment_minus_control_conservative_tokens:treatmentLogical-controlLogical,exact_unknown_model_receipts:unknown,unbounded_unknown_model_receipts:censoring.accounting.unbounded_unknown_model_receipts},evaluation,phase_evaluation,pair_validations:pairValidations,local_failures:localFailures,rows,prefixes:prefixRows,benchmark_cleared:false,claim_ceiling:'Fresh GLM-5.3-flash 8K development canary only; passing selects independent confirmation but does not clear ContextBench.',authority_effect:'none',open_questions_ref:'PLAN-round52.md#open-questions'};
  writeExact(reportPath,report);return report;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const [freezePath,liveRoot,reportPath]=process.argv.slice(2);if(!reportPath)throw Error('freeze live-root report required');const report=await scoreRound52({freezePath,liveRoot,reportPath});console.log(JSON.stringify({status:report.status,span_f1_gain:report.evaluation.gains.span_f1,instrument:report.evaluation.instrument,semantic:report.evaluation.semantic,model_accounting:report.model_accounting}));}
