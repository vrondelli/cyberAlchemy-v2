// Execute one deterministic task shard. Each task's shared prefix precedes both branches.
import {existsSync,mkdirSync,openSync,closeSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {verifyFreeze} from './verify-freeze.mjs';
import {validateDispatchCompletion} from './dispatch-validation.mjs';
import {classifyInputAvailability,unavailableBranchRows} from './input-availability.mjs';
import {expectedShardCells} from './shared-shards.mjs';
import {assertStorageCapacity,cleanupCellSourceTrees,pruneCompletedCellSourceTrees} from './storage-lifecycle.mjs';

const [freezePath,credentialPath,outRoot,indexRaw,countRaw]=process.argv.slice(2);
if(countRaw===undefined)throw Error('freeze credential output-root shard-index shard-count required');
const shard_index=Number(indexRaw),shard_count=Number(countRaw),{matrix}=verifyFreeze(freezePath),root=resolve(outRoot);
const selected=expectedShardCells(matrix,{shard_index,shard_count}),driver=resolve(root,'sequence',`shard-${String(shard_index).padStart(2,'0')}`);mkdirSync(driver,{recursive:true});
pruneCompletedCellSourceTrees(root);
const branchByPrefix=new Map(selected.prefixes.map(prefix=>[prefix.cell_id,selected.branches.filter(branch=>branch.prefix_cell_id===prefix.cell_id)]));
const runProcess=(script,cellId)=>{const log=resolve(driver,cellId+'.log'),fd=openSync(log,'wx',0o600);try{return spawnSync(process.execPath,[fileURLToPath(new URL(script,import.meta.url)),freezePath,cellId,credentialPath,root],{stdio:['ignore',fd,fd]});}finally{closeSync(fd);}};
const allowedEarly=new Set(['final_context_selected','no_context_selected','invalid_final_response','token_budget_stopped','context_budget_stopped','call_budget_exhausted']);
const skipped=[],localFailures=[],unavailablePrefixes=[];
for(const prefix of selected.prefixes){
  assertStorageCapacity({outRoot:root});
  const task=matrix.tasks.find(candidate=>candidate.instance_id===prefix.instance_id),availability=classifyInputAvailability(task),branches=branchByPrefix.get(prefix.cell_id);
  if(!availability.available){skipped.push(...unavailableBranchRows(prefix,branches,availability.reason));unavailablePrefixes.push({cell_id:prefix.cell_id,instance_id:prefix.instance_id,status:'input_unavailable',reason:availability.reason,model_calls:0,tokenizer_calls:0});console.log(JSON.stringify({shard_index,cell_id:prefix.cell_id,status:'input_unavailable',skipped_branches:branches.length}));continue;}
  verifyFreeze(freezePath);const prefixRoot=resolve(root,prefix.cell_id),completed=resolve(prefixRoot,'completed.json');
  if(!existsSync(completed)){if(existsSync(prefixRoot))throw Error('shard.incomplete-existing-prefix:'+prefix.cell_id);console.log(JSON.stringify({shard_index,cell_id:prefix.cell_id,status:'starting-prefix'}));const run=runProcess('./run-prefix-cell-storage-bounded.mjs',prefix.cell_id);if(run.status!==0)throw Error('shard.prefix-process-failed:'+prefix.cell_id);}
  const result=JSON.parse(readFileSync(resolve(prefixRoot,'result.json'))),completion=JSON.parse(readFileSync(completed));
  if(result.status!==completion.status)throw Error('shard.prefix-status-mismatch:'+prefix.cell_id);
  if(result.status!=='shared_prefix_ready'){
    if(!allowedEarly.has(result.status))throw Error('shard.shared-prefix-failure:'+prefix.cell_id);
    for(const branch of branches)skipped.push({cell_id:branch.cell_id,prefix_cell_id:prefix.cell_id,instance_id:branch.instance_id,status:'not_started_prefix_ineligible',prefix_status:result.status});
    console.log(JSON.stringify({shard_index,cell_id:prefix.cell_id,status:result.status,skipped_branches:branches.length}));cleanupCellSourceTrees({cellRoot:prefixRoot});continue;
  }
  if(result.shared_prefix_boundary?.generation!==1||result.recycling?.phase!=='idle')throw Error('shard.prefix-boundary-invalid:'+prefix.cell_id);
  for(const cell of branches){
    assertStorageCapacity({outRoot:root});
    verifyFreeze(freezePath);const out=resolve(root,cell.cell_id),done=resolve(out,'completed.json');
    if(!existsSync(done)){if(existsSync(out))throw Error('shard.incomplete-existing-branch:'+cell.cell_id);console.log(JSON.stringify({shard_index,cell_id:cell.cell_id,status:'starting-branch'}));const run=runProcess('./run-branch-cell-storage-bounded.mjs',cell.cell_id);if(run.status!==0)throw Error('shard.branch-process-failed:'+cell.cell_id);}
    const validation=validateDispatchCompletion({cell,root:out});console.log(JSON.stringify({shard_index,...validation}));
    if(!validation.ok){writeFileSync(resolve(driver,cell.cell_id+'.paused.json'),JSON.stringify(validation,null,2)+'\n',{flag:'wx'});throw Error('shard.completion-review-required:'+cell.cell_id);}
    if(validation.directive==='continue-after-local-failure')localFailures.push({cell_id:cell.cell_id,prefix_cell_id:cell.prefix_cell_id,instance_id:cell.instance_id,status:validation.status,...validation.local_failure});
    const branch=JSON.parse(readFileSync(resolve(out,'result.json')));if(branch.prefix_ancestry?.prefix_result_sha256!==completion.result_sha256||branch.prefix_ancestry?.continuation_digest!==result.continuation?.continuation_digest)throw Error('shard.branch-ancestry-mismatch:'+cell.cell_id);
    cleanupCellSourceTrees({cellRoot:out});
  }
  cleanupCellSourceTrees({cellRoot:prefixRoot});
}
const record={schema_version:'are.contextbench-shard-completion/v1',shard_index,shard_count,scheduled_prefix_ids:selected.prefixes.map(row=>row.cell_id),scheduled_branch_ids:selected.branches.map(row=>row.cell_id),skipped,unavailable_prefixes:unavailablePrefixes,local_failures:localFailures,completed_or_retained:true,benchmark_cleared:false,authority_effect:'none'};
writeFileSync(resolve(driver,'completed.json'),JSON.stringify(record,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'shard-complete',shard_index,prefixes:selected.prefixes.length,branches:selected.branches.length,skipped:skipped.length,local_failures:localFailures.length}));
