// Sequential compact-evidence dispatcher with conservative accounting for a
// narrowly proven, zero-byte indeterminate model transport failure.
import {existsSync,mkdirSync,openSync,closeSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {verifyFreeze} from './verify-freeze.mjs';
import {validateDispatchCompletion} from './dispatch-validation.mjs';
import {persistLocalFailureLedger} from './local-failure-ledger.mjs';
import {classifyInputAvailability,unavailableBranchRows} from './input-availability.mjs';
import {assertStorageCapacity,cleanupCellSourceTrees,pruneCompletedCellSourceTrees} from './storage-lifecycle.mjs';
import {minimumPairCountReachable} from './decision-state-validation.mjs';
import {validateTerminalEvidenceHandleIncrementalPair} from './terminal-evidence-handle-incremental-validation.mjs';
import {stable} from './delivery.mjs';
const [freezePath,credentialPath,outRoot]=process.argv.slice(2);
if(!outRoot)throw Error('freeze credential output-root required');
const {matrix}=verifyFreeze(freezePath),root=resolve(outRoot),driver=resolve(root,'sequence');mkdirSync(driver,{recursive:true});
pruneCompletedCellSourceTrees(root);
const writeExact=(path,value)=>{const bytes=JSON.stringify(value,null,2)+'\n';if(existsSync(path)){if(readFileSync(path,'utf8')!==bytes)throw Error('sequence.artifact-drift:'+path);}else writeFileSync(path,bytes,{flag:'wx'});};
const runProcess=(script,cellId)=>{const log=resolve(driver,cellId+'.log'),fd=openSync(log,'wx',0o600);try{return spawnSync(process.execPath,[fileURLToPath(new URL(script,import.meta.url)),freezePath,cellId,credentialPath,root],{stdio:['ignore',fd,fd]});}finally{closeSync(fd);}};
const skipped=[],localFailures=[],unavailablePrefixes=[];
let eligiblePairs=0,processedPrefixes=0,stoppedInfeasible=false;
const minimumPairs=matrix.success_criteria?.minimum_complete_pairs??6;
const stopIfInfeasible=()=>{const remaining=matrix.prefixes.length-processedPrefixes;if(minimumPairCountReachable({eligible_pairs:eligiblePairs,processed_prefixes:processedPrefixes,scheduled_prefixes:matrix.prefixes.length,minimum_pairs:minimumPairs}))return false;stoppedInfeasible=true;writeExact(resolve(driver,'infeasibility-stop.json'),{processed_prefixes:processedPrefixes,eligible_pairs:eligiblePairs,remaining_prefixes:remaining,minimum_complete_pairs:minimumPairs,reason:'minimum-pairs-unreachable',authority_effect:'none'});return true;};
for(const prefix of matrix.prefixes){
  processedPrefixes++;
  assertStorageCapacity({outRoot:root});
  const task=matrix.tasks.find(candidate=>candidate.instance_id===prefix.instance_id),availability=classifyInputAvailability(task);
  if(!availability.available){const branches=matrix.branches.filter(cell=>cell.prefix_cell_id===prefix.cell_id),rows=unavailableBranchRows(prefix,branches,availability.reason);skipped.push(...rows);unavailablePrefixes.push({cell_id:prefix.cell_id,instance_id:prefix.instance_id,status:'input_unavailable',reason:availability.reason,model_calls:0,tokenizer_calls:0});console.log(JSON.stringify({cell_id:prefix.cell_id,status:'input_unavailable',directive:'retain-fixed-zero',skipped_branches:branches.length}));if(stopIfInfeasible())break;continue;}
  verifyFreeze(freezePath);const prefixRoot=resolve(root,prefix.cell_id),completed=resolve(prefixRoot,'completed.json');
  if(!existsSync(completed)){if(existsSync(prefixRoot))throw Error('sequence.incomplete-existing-prefix:'+prefix.cell_id);console.log(JSON.stringify({cell_id:prefix.cell_id,status:'starting-prefix'}));const run=runProcess('./run-prefix-terminal-decision-substitution-v1.mjs',prefix.cell_id);if(run.status!==0)throw Error('sequence.prefix-process-failed:'+prefix.cell_id);}
  const result=JSON.parse(readFileSync(resolve(prefixRoot,'result.json'))),completion=JSON.parse(readFileSync(completed));
  if(result.status!==completion.status)throw Error('sequence.prefix-status-mismatch:'+prefix.cell_id);
  const prefixValidation=validateDispatchCompletion({cell:prefix,root:prefixRoot});
  if(!prefixValidation.ok){writeExact(resolve(driver,prefix.cell_id+'.paused.json'),prefixValidation);throw Error('sequence.prefix-completion-review-required:'+prefix.cell_id);}
  const branches=matrix.branches.filter(cell=>cell.prefix_cell_id===prefix.cell_id);
  if(result.status!=='shared_prefix_ready'){
    const localFailure=prefixValidation.local_failure;
    const skipStatus=localFailure?'not_started_accounted_prefix_failure':'not_started_prefix_ineligible';
    for(const branch of branches)skipped.push({cell_id:branch.cell_id,prefix_cell_id:prefix.cell_id,instance_id:branch.instance_id,status:skipStatus,prefix_status:result.status});
    if(localFailure){localFailures.push({cell_id:prefix.cell_id,instance_id:prefix.instance_id,status:result.status,...localFailure});persistLocalFailureLedger(driver,localFailures);}
    console.log(JSON.stringify({cell_id:prefix.cell_id,status:result.status,directive:localFailure?'retain-accounted-prefix-failure':'retain-prefix-ineligible',skipped_branches:branches.length,failure_family:localFailure?.failure_family??null,conservative_token_upper_bound:localFailure?.conservative_model_token_upper_bound??localFailure?.known_model_tokens??null}));cleanupCellSourceTrees({cellRoot:prefixRoot});if(stopIfInfeasible())break;continue;
  }
  if(result.shared_prefix_boundary?.kind!=='terminal-candidate'){
    const failure={cell_id:prefix.cell_id,instance_id:prefix.instance_id,status:result.status,scope:'local-prefix',failure_family:'nonterminal-boundary',boundary_kind:result.shared_prefix_boundary?.kind??null,known_model_tokens:0,unknown_model_receipts:0};
    localFailures.push(failure);persistLocalFailureLedger(driver,localFailures);
    for(const branch of branches)skipped.push({cell_id:branch.cell_id,prefix_cell_id:prefix.cell_id,instance_id:branch.instance_id,status:'not_started_nonterminal_boundary',prefix_status:result.status});
    console.log(JSON.stringify({cell_id:prefix.cell_id,status:result.status,directive:'retain-nonterminal-fixed-zero',boundary_kind:failure.boundary_kind,skipped_branches:branches.length}));
    cleanupCellSourceTrees({cellRoot:prefixRoot});if(stopIfInfeasible())break;continue;
  }
  if(stable(result.continuation?.state?.decision_boundary)!==stable(result.shared_prefix_boundary)||result.continuation?.state?.terminal_review_pending!==true||result.recycling?.phase!=='idle')throw Error('sequence.prefix-boundary-invalid:'+prefix.cell_id);
  for(const cell of branches){
    assertStorageCapacity({outRoot:root});verifyFreeze(freezePath);const out=resolve(root,cell.cell_id),done=resolve(out,'completed.json');
    if(!existsSync(done)){if(existsSync(out))throw Error('sequence.incomplete-existing-branch:'+cell.cell_id);console.log(JSON.stringify({cell_id:cell.cell_id,status:'starting-branch'}));const run=runProcess('./run-branch-decision-state-v1.mjs',cell.cell_id);if(run.status!==0)throw Error('sequence.branch-process-failed:'+cell.cell_id);}
    const validation=validateDispatchCompletion({cell,root:out});console.log(JSON.stringify(validation));if(!validation.ok){writeExact(resolve(driver,cell.cell_id+'.paused.json'),validation);throw Error('sequence.completion-review-required:'+cell.cell_id);}
    if(validation.directive==='continue-after-local-failure'){localFailures.push({cell_id:cell.cell_id,prefix_cell_id:cell.prefix_cell_id,instance_id:cell.instance_id,status:validation.status,...validation.local_failure});persistLocalFailureLedger(driver,localFailures);}
    const branch=JSON.parse(readFileSync(resolve(out,'result.json')));if(branch.prefix_ancestry?.prefix_result_sha256!==completion.result_sha256||branch.prefix_ancestry?.continuation_digest!==result.continuation?.continuation_digest)throw Error('sequence.branch-ancestry-mismatch:'+cell.cell_id);cleanupCellSourceTrees({cellRoot:out});
  }
  const controlCell=branches.find(cell=>cell.state_arm==='control'),treatmentCell=branches.find(cell=>cell.state_arm==='state');if(!controlCell||!treatmentCell)throw Error('sequence.review-pair-shape:'+prefix.cell_id);
  const pairValidation=validateTerminalEvidenceHandleIncrementalPair({prefix:result,control:JSON.parse(readFileSync(resolve(root,controlCell.cell_id,'result.json'))),treatment:JSON.parse(readFileSync(resolve(root,treatmentCell.cell_id,'result.json'))),maximum_state_tokens:160,maximum_state_bytes:1024,maximum_handles:3,minimum_input_token_reduction:128,maximum_paired_token_difference:3072,total_token_limit:96000});
  const boundedBranchFailure=localFailures.some(row=>row.prefix_cell_id===prefix.cell_id&&(row.failure_family==='model-transport-indeterminate'||(row.failure_family==='tokenizer-transport'&&row.terminal_kind==='tokenizer'&&row.response_bytes===0&&row.unknown_model_receipts===0)));
  const retainedPair={prefix_cell_id:prefix.cell_id,control_cell_id:controlCell.cell_id,treatment_cell_id:treatmentCell.cell_id,...pairValidation,...(!pairValidation.ok&&boundedBranchFailure?{disposition:'symmetric-fixed-zero',cost_bounded:true}:{})};
  writeExact(resolve(driver,prefix.cell_id+'.pair-validation.json'),retainedPair);console.log(JSON.stringify({prefix_cell_id:prefix.cell_id,pair_validation:retainedPair}));if(!pairValidation.ok&&!boundedBranchFailure)throw Error('sequence.review-pair-invalid:'+prefix.cell_id);if(pairValidation.ok)eligiblePairs++;cleanupCellSourceTrees({cellRoot:prefixRoot});
  if(stopIfInfeasible())break;
}
writeFileSync(resolve(driver,'skipped.json'),JSON.stringify({rows:skipped,authority_effect:'none'},null,2)+'\n',{flag:'wx'});
writeFileSync(resolve(driver,'input-unavailable.json'),JSON.stringify({rows:unavailablePrefixes,model_calls:0,tokenizer_calls:0,authority_effect:'none'},null,2)+'\n',{flag:'wx'});
persistLocalFailureLedger(driver,localFailures);
writeFileSync(resolve(driver,'completed.json'),JSON.stringify({scheduled_prefixes:matrix.prefixes.length,scheduled_branches:matrix.branches.length,completed_or_retained:!stoppedInfeasible,stopped_infeasible:stoppedInfeasible,processed_prefixes:processedPrefixes,eligible_pairs:eligiblePairs,skipped_prefixes:unavailablePrefixes.length,skipped_branches:skipped.length,local_failures:localFailures.length,conservative_indeterminate_token_debit:localFailures.reduce((sum,row)=>sum+(row.indeterminate_token_debit??0),0),benchmark_cleared:false,authority_effect:'none'},null,2)+'\n',{flag:'wx'});
