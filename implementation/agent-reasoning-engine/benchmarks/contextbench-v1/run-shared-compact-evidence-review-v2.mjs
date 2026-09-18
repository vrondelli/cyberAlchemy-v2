// Sequential terminal-candidate prefix and one-call paired-review dispatcher.
import {existsSync,mkdirSync,openSync,closeSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {verifyFreeze} from './verify-freeze.mjs';
import {validateDispatchCompletion} from './dispatch-validation.mjs';
import {persistLocalFailureLedger} from './local-failure-ledger.mjs';
import {classifyInputAvailability,unavailableBranchRows} from './input-availability.mjs';
import {assertStorageCapacity,cleanupCellSourceTrees,pruneCompletedCellSourceTrees} from './storage-lifecycle.mjs';
import {validateTerminalReviewPair} from './accounted-response-review-validation.mjs';
const [freezePath,credentialPath,outRoot]=process.argv.slice(2);
if(!outRoot)throw Error('freeze credential output-root required');
const {matrix}=verifyFreeze(freezePath),root=resolve(outRoot),driver=resolve(root,'sequence');mkdirSync(driver,{recursive:true});
pruneCompletedCellSourceTrees(root);
const writeExact=(path,value)=>{const bytes=JSON.stringify(value,null,2)+'\n';if(existsSync(path)){if(readFileSync(path,'utf8')!==bytes)throw Error('sequence.artifact-drift:'+path);}else writeFileSync(path,bytes,{flag:'wx'});};
const runProcess=(script,cellId)=>{const log=resolve(driver,cellId+'.log'),fd=openSync(log,'wx',0o600);try{return spawnSync(process.execPath,[fileURLToPath(new URL(script,import.meta.url)),freezePath,cellId,credentialPath,root],{stdio:['ignore',fd,fd]});}finally{closeSync(fd);}};
const allowedEarly=new Set(['final_context_selected','no_context_selected','invalid_final_response','token_budget_stopped','context_budget_stopped','call_budget_exhausted']);
const skipped=[],localFailures=[],unavailablePrefixes=[];
for(const prefix of matrix.prefixes){
  assertStorageCapacity({outRoot:root});
  const task=matrix.tasks.find(candidate=>candidate.instance_id===prefix.instance_id),availability=classifyInputAvailability(task);
  if(!availability.available){const branches=matrix.branches.filter(cell=>cell.prefix_cell_id===prefix.cell_id),rows=unavailableBranchRows(prefix,branches,availability.reason);skipped.push(...rows);unavailablePrefixes.push({cell_id:prefix.cell_id,instance_id:prefix.instance_id,status:'input_unavailable',reason:availability.reason,model_calls:0,tokenizer_calls:0});console.log(JSON.stringify({cell_id:prefix.cell_id,status:'input_unavailable',directive:'retain-fixed-zero',skipped_branches:branches.length}));continue;}
  verifyFreeze(freezePath);const prefixRoot=resolve(root,prefix.cell_id),completed=resolve(prefixRoot,'completed.json');
  if(!existsSync(completed)){if(existsSync(prefixRoot))throw Error('sequence.incomplete-existing-prefix:'+prefix.cell_id);console.log(JSON.stringify({cell_id:prefix.cell_id,status:'starting-prefix'}));const run=runProcess('./run-prefix-compact-evidence-review-v2.mjs',prefix.cell_id);if(run.status!==0)throw Error('sequence.prefix-process-failed:'+prefix.cell_id);}
  const result=JSON.parse(readFileSync(resolve(prefixRoot,'result.json'))),completion=JSON.parse(readFileSync(completed));
  if(result.status!==completion.status)throw Error('sequence.prefix-status-mismatch:'+prefix.cell_id);
  const branches=matrix.branches.filter(cell=>cell.prefix_cell_id===prefix.cell_id);
  if(result.status!=='shared_prefix_ready'){
    if(!allowedEarly.has(result.status))throw Error('sequence.shared-prefix-failure:'+prefix.cell_id);
    for(const branch of branches)skipped.push({cell_id:branch.cell_id,prefix_cell_id:prefix.cell_id,instance_id:branch.instance_id,status:'not_started_prefix_ineligible',prefix_status:result.status});
    console.log(JSON.stringify({cell_id:prefix.cell_id,status:result.status,directive:'retain-prefix-ineligible',skipped_branches:branches.length}));cleanupCellSourceTrees({cellRoot:prefixRoot});continue;
  }
  if(!['terminal-candidate','context-pressure','output-pressure','response-pressure'].includes(result.shared_prefix_boundary?.kind)||result.continuation?.state?.terminal_review_pending!==true||result.recycling?.phase!=='idle')throw Error('sequence.prefix-boundary-invalid:'+prefix.cell_id);
  for(const cell of branches){
    assertStorageCapacity({outRoot:root});
    verifyFreeze(freezePath);const out=resolve(root,cell.cell_id),done=resolve(out,'completed.json');
    if(!existsSync(done)){if(existsSync(out))throw Error('sequence.incomplete-existing-branch:'+cell.cell_id);console.log(JSON.stringify({cell_id:cell.cell_id,status:'starting-branch'}));const run=runProcess('./run-branch-compact-evidence-review-v2.mjs',cell.cell_id);if(run.status!==0)throw Error('sequence.branch-process-failed:'+cell.cell_id);}
    const validation=validateDispatchCompletion({cell,root:out});console.log(JSON.stringify(validation));
    if(!validation.ok){writeExact(resolve(driver,cell.cell_id+'.paused.json'),validation);throw Error('sequence.completion-review-required:'+cell.cell_id);}
    if(validation.directive==='continue-after-local-failure'){
      localFailures.push({cell_id:cell.cell_id,prefix_cell_id:cell.prefix_cell_id,instance_id:cell.instance_id,status:validation.status,...validation.local_failure});
      persistLocalFailureLedger(driver,localFailures);
    }
    const branch=JSON.parse(readFileSync(resolve(out,'result.json')));if(branch.prefix_ancestry?.prefix_result_sha256!==completion.result_sha256||branch.prefix_ancestry?.continuation_digest!==result.continuation?.continuation_digest)throw Error('sequence.branch-ancestry-mismatch:'+cell.cell_id);
    cleanupCellSourceTrees({cellRoot:out});
  }
  const controlCell=branches.find(cell=>cell.state_arm==='control'),treatmentCell=branches.find(cell=>cell.state_arm==='state');
  if(!controlCell||!treatmentCell)throw Error('sequence.review-pair-shape:'+prefix.cell_id);
  const pairValidation=validateTerminalReviewPair({prefix:result,control:JSON.parse(readFileSync(resolve(root,controlCell.cell_id,'result.json'))),treatment:JSON.parse(readFileSync(resolve(root,treatmentCell.cell_id,'result.json'))),maximum_slate_tokens:1024,maximum_paired_token_difference:3072});
  writeExact(resolve(driver,prefix.cell_id+'.pair-validation.json'),{prefix_cell_id:prefix.cell_id,control_cell_id:controlCell.cell_id,treatment_cell_id:treatmentCell.cell_id,...pairValidation});
  console.log(JSON.stringify({prefix_cell_id:prefix.cell_id,pair_validation:pairValidation}));if(!pairValidation.ok)throw Error('sequence.review-pair-invalid:'+prefix.cell_id);
  cleanupCellSourceTrees({cellRoot:prefixRoot});
}
writeFileSync(resolve(driver,'skipped.json'),JSON.stringify({rows:skipped,authority_effect:'none'},null,2)+'\n',{flag:'wx'});
writeFileSync(resolve(driver,'input-unavailable.json'),JSON.stringify({rows:unavailablePrefixes,model_calls:0,tokenizer_calls:0,authority_effect:'none'},null,2)+'\n',{flag:'wx'});
persistLocalFailureLedger(driver,localFailures);
writeFileSync(resolve(driver,'completed.json'),JSON.stringify({scheduled_prefixes:matrix.prefixes.length,scheduled_branches:matrix.branches.length,completed_or_retained:true,skipped_prefixes:unavailablePrefixes.length,skipped_branches:skipped.length,local_branch_failures:localFailures.length,benchmark_cleared:false,authority_effect:'none'},null,2)+'\n',{flag:'wx'});
