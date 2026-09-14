// Resume one Round 30 shard after reviewed infrastructure failures.
// Completed or interrupted identities named by the recovery manifest are retained;
// only identities with no output directory are dispatched.
import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,openSync,closeSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';
import {validateDispatchCompletion} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/dispatch-validation.mjs';
import {classifyInputAvailability,unavailableBranchRows} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/input-availability.mjs';
import {expectedShardCells} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/shared-shards.mjs';

const args=process.argv.slice(2),verifyOnly=args.at(-1)==='--verify-only';
if(verifyOnly)args.pop();
const [freezePath,credentialPath,outRoot,indexRaw,countRaw,recoveryPath,continuationPath]=args;
if(!continuationPath)throw Error('freeze credential output-root shard-index shard-count recovery continuation required');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),read=path=>JSON.parse(readFileSync(path));
const fileHash=path=>hash(readFileSync(path)),absoluteSelf=fileURLToPath(import.meta.url);
const continuation=read(resolve(continuationPath)),recovery=read(resolve(recoveryPath));
if(continuation.schema_version!=='are.contextbench-round30-continuation-freeze/v1'||continuation.round!==30)throw Error('round30-resume.continuation-invalid');
if(fileHash(absoluteSelf)!==continuation.driver_sha256||fileHash(resolve(freezePath))!==continuation.source_freeze_sha256||fileHash(resolve(recoveryPath))!==continuation.recovery_manifest_sha256)throw Error('round30-resume.freeze-drift');
if(recovery.schema_version!=='are.contextbench-round30-recovery/v1'||recovery.round!==30||recovery.rerun_retained_cells!==false)throw Error('round30-resume.recovery-invalid');
const recoveries=new Map(recovery.entries.map(row=>[row.cell_id,row]));
if(recoveries.size!==recovery.entries.length)throw Error('round30-resume.recovery-duplicate');

const shard_index=Number(indexRaw),shard_count=Number(countRaw),{matrix}=verifyFreeze(freezePath),root=resolve(outRoot);
const selected=expectedShardCells(matrix,{shard_index,shard_count}),driver=resolve(root,'sequence',`shard-${String(shard_index).padStart(2,'0')}`);mkdirSync(driver,{recursive:true});
const branchByPrefix=new Map(selected.prefixes.map(prefix=>[prefix.cell_id,selected.branches.filter(branch=>branch.prefix_cell_id===prefix.cell_id)]));
const runProcess=(script,cellId)=>{const log=resolve(driver,cellId+'.log'),fd=openSync(log,'wx',0o600);try{return spawnSync(process.execPath,[fileURLToPath(new URL(script,import.meta.url)),freezePath,cellId,credentialPath,root],{stdio:['ignore',fd,fd]});}finally{closeSync(fd);}};
const allowedEarly=new Set(['final_context_selected','no_context_selected','invalid_final_response','token_budget_stopped','context_budget_stopped','call_budget_exhausted']);
const skipped=[],localFailures=[],unavailablePrefixes=[],consumedRecoveries=new Set();

function retainedFailure(cell,out,validation){
  const row=recoveries.get(cell.cell_id);if(!row)return null;
  const resultPath=resolve(out,'result.json'),completionPath=resolve(out,'completed.json');
  if(!existsSync(resultPath)||!existsSync(completionPath)||fileHash(resultPath)!==row.result_sha256||fileHash(completionPath)!==row.completion_sha256)throw Error('round30-resume.recovery-artifact-drift:'+cell.cell_id);
  if(JSON.stringify(validation.issues.map(x=>x.code).sort())!==JSON.stringify([...row.expected_issue_codes].sort()))throw Error('round30-resume.recovery-issue-drift:'+cell.cell_id);
  for(const artifact of row.evidence)if(fileHash(resolve(artifact.path))!==artifact.sha256)throw Error('round30-resume.recovery-evidence-drift:'+cell.cell_id+':'+artifact.path);
  consumedRecoveries.add(cell.cell_id);
  return {cell_id:cell.cell_id,prefix_cell_id:cell.prefix_cell_id,instance_id:cell.instance_id,status:read(resultPath).status,scope:row.scope,failure_family:row.failure_family,failure_code:row.failure_code,known_model_tokens:row.known_model_tokens,unknown_model_receipts:row.unknown_model_receipts,rerun_cell:false,recovery_ref:resolve(recoveryPath),result_sha256:row.result_sha256};
}

function retainedPrefixFailure(cell,out){
  const row=recoveries.get(cell.cell_id);if(!row)return null;
  const resultPath=resolve(out,'result.json'),completionPath=resolve(out,'completed.json');
  if(!existsSync(resultPath)||!existsSync(completionPath)||fileHash(resultPath)!==row.result_sha256||fileHash(completionPath)!==row.completion_sha256)throw Error('round30-resume.recovery-artifact-drift:'+cell.cell_id);
  const result=read(resultPath),completion=read(completionPath),expectedIssues=['dispatch.shared-runtime-failure'];
  if(row.scope!=='local-prefix'||JSON.stringify([...row.expected_issue_codes].sort())!==JSON.stringify(expectedIssues)||result.cell_id!==cell.cell_id||result.instance_id!==cell.instance_id||result.status!=='run_error'||completion.status!==result.status||completion.result_sha256!==row.result_sha256||result.error!=='glm.'+row.failure_code||result.selection!=null||result.native_export!=null||result.export_error!=null)throw Error('round30-resume.recovery-prefix-shape:'+cell.cell_id);
  const modelReceipts=result.receipts?.filter(receipt=>receipt?.kind==='model'&&receipt.dispatched===true)??[],known=modelReceipts.filter(receipt=>Number.isSafeInteger(receipt.input_tokens)&&Number.isSafeInteger(receipt.output_tokens)),knownTokens=known.reduce((sum,receipt)=>sum+receipt.input_tokens+receipt.output_tokens,0);
  if(knownTokens!==row.known_model_tokens||modelReceipts.length-known.length!==row.unknown_model_receipts)throw Error('round30-resume.recovery-prefix-accounting:'+cell.cell_id);
  for(const artifact of row.evidence)if(fileHash(resolve(artifact.path))!==artifact.sha256)throw Error('round30-resume.recovery-evidence-drift:'+cell.cell_id+':'+artifact.path);
  consumedRecoveries.add(cell.cell_id);
  return {cell_id:cell.cell_id,instance_id:cell.instance_id,status:result.status,scope:row.scope,failure_family:row.failure_family,failure_code:row.failure_code,known_model_tokens:row.known_model_tokens,unknown_model_receipts:row.unknown_model_receipts,rerun_cell:false,recovery_ref:resolve(recoveryPath),result_sha256:row.result_sha256};
}

if(verifyOnly){
  for(const cell of selected.prefixes){if(recoveries.has(cell.cell_id))retainedPrefixFailure(cell,resolve(root,cell.cell_id));}
  for(const cell of selected.branches){const row=recoveries.get(cell.cell_id);if(!row)continue;const out=resolve(root,cell.cell_id),validation=validateDispatchCompletion({cell,root:out});if(validation.ok)throw Error('round30-resume.recovery-no-longer-required:'+cell.cell_id);retainedFailure(cell,out,validation);}
  console.log(JSON.stringify({ok:true,directive:'verified-only',shard_index,recoveries:[...consumedRecoveries],rerun_retained_cells:false,authority_effect:'none'}));process.exit(0);
}

for(const prefix of selected.prefixes){
  const task=matrix.tasks.find(candidate=>candidate.instance_id===prefix.instance_id),availability=classifyInputAvailability(task),branches=branchByPrefix.get(prefix.cell_id);
  if(!availability.available){skipped.push(...unavailableBranchRows(prefix,branches,availability.reason));unavailablePrefixes.push({cell_id:prefix.cell_id,instance_id:prefix.instance_id,status:'input_unavailable',reason:availability.reason,model_calls:0,tokenizer_calls:0});console.log(JSON.stringify({shard_index,cell_id:prefix.cell_id,status:'input_unavailable',skipped_branches:branches.length}));continue;}
  verifyFreeze(freezePath);const prefixRoot=resolve(root,prefix.cell_id),completed=resolve(prefixRoot,'completed.json');
  if(!existsSync(completed)){if(existsSync(prefixRoot))throw Error('round30-resume.incomplete-existing-prefix:'+prefix.cell_id);console.log(JSON.stringify({shard_index,cell_id:prefix.cell_id,status:'starting-prefix'}));const run=runProcess('../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/run-prefix-cell.mjs',prefix.cell_id);if(run.status!==0)throw Error('round30-resume.prefix-process-failed:'+prefix.cell_id);}
  const result=read(resolve(prefixRoot,'result.json')),completion=read(completed);if(result.status!==completion.status)throw Error('round30-resume.prefix-status-mismatch:'+prefix.cell_id);
  if(result.status!=='shared_prefix_ready'){
    const retained=!allowedEarly.has(result.status)?retainedPrefixFailure(prefix,prefixRoot):null;
    if(!allowedEarly.has(result.status)&&!retained)throw Error('round30-resume.shared-prefix-failure:'+prefix.cell_id);
    for(const branch of branches)skipped.push({cell_id:branch.cell_id,prefix_cell_id:prefix.cell_id,instance_id:branch.instance_id,status:'not_started_prefix_ineligible',prefix_status:result.status});
    if(retained)localFailures.push(retained);
    console.log(JSON.stringify({shard_index,cell_id:prefix.cell_id,status:result.status,directive:retained?'continue-after-reviewed-prefix-retention':'continue-sequence',skipped_branches:branches.length,retained_failure:retained}));continue;
  }
  if(result.shared_prefix_boundary?.generation!==1||result.recycling?.phase!=='idle')throw Error('round30-resume.prefix-boundary-invalid:'+prefix.cell_id);
  for(const cell of branches){
    verifyFreeze(freezePath);const out=resolve(root,cell.cell_id),done=resolve(out,'completed.json');
    if(!existsSync(done)){if(existsSync(out))throw Error('round30-resume.incomplete-existing-branch:'+cell.cell_id);console.log(JSON.stringify({shard_index,cell_id:cell.cell_id,status:'starting-branch'}));const run=runProcess('../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/run-branch-cell.mjs',cell.cell_id);if(run.status!==0)throw Error('round30-resume.branch-process-failed:'+cell.cell_id);}
    const validation=validateDispatchCompletion({cell,root:out});let retained=null;
    if(!validation.ok)retained=retainedFailure(cell,out,validation);
    console.log(JSON.stringify({shard_index,...validation,directive:retained?'continue-after-reviewed-retention':validation.directive,retained_failure:retained}));
    if(!validation.ok&&!retained)throw Error('round30-resume.completion-review-required:'+cell.cell_id);
    if(retained)localFailures.push(retained);else if(validation.directive==='continue-after-local-failure')localFailures.push({cell_id:cell.cell_id,prefix_cell_id:cell.prefix_cell_id,instance_id:cell.instance_id,status:validation.status,...validation.local_failure});
    const branch=read(resolve(out,'result.json'));if(branch.prefix_ancestry?.prefix_result_sha256!==completion.result_sha256||branch.prefix_ancestry?.continuation_digest!==result.continuation?.continuation_digest)throw Error('round30-resume.branch-ancestry-mismatch:'+cell.cell_id);
  }
}
for(const [cellId] of recoveries)if([...selected.prefixes,...selected.branches].some(x=>x.cell_id===cellId)&&!consumedRecoveries.has(cellId))throw Error('round30-resume.recovery-not-consumed:'+cellId);
const record={schema_version:'are.contextbench-shard-completion/v1',shard_index,shard_count,scheduled_prefix_ids:selected.prefixes.map(row=>row.cell_id),scheduled_branch_ids:selected.branches.map(row=>row.cell_id),skipped,unavailable_prefixes:unavailablePrefixes,local_failures:localFailures,completed_or_retained:true,benchmark_cleared:false,authority_effect:'none'};
writeFileSync(resolve(driver,'completed.json'),JSON.stringify(record,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:'shard-complete',shard_index,prefixes:selected.prefixes.length,branches:selected.branches.length,skipped:skipped.length,local_failures:localFailures.length}));
