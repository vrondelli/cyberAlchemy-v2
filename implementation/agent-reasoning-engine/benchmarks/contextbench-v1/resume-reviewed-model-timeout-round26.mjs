// Continue only unstarted cells after one exact, reviewed dispatched-model timeout.
// The failed cell is retained, never rerun, and contributes one unknown-usage receipt.
import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,openSync,closeSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {verifyFreeze} from './verify-freeze.mjs';
import {validateDispatchCompletion} from './dispatch-validation.mjs';
import {persistLocalFailureLedger} from './local-failure-ledger.mjs';

const [freezePath,credentialPath,outRoot,adjudicationPath,continuationFreezePath,mode]=process.argv.slice(2);
if(!continuationFreezePath)throw Error('freeze credential output-root adjudication continuation-freeze required');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),read=path=>JSON.parse(readFileSync(path));
const absoluteSelf=fileURLToPath(import.meta.url),continuationFreeze=read(resolve(continuationFreezePath));
if(continuationFreeze.schema_version!=='are.contextbench-timeout-continuation-freeze/v1'||continuationFreeze.round!==26)throw Error('resume.continuation-freeze-invalid');
if(hash(readFileSync(absoluteSelf))!==continuationFreeze.driver_sha256)throw Error('resume.driver-drift');
if(hash(readFileSync(resolve(freezePath)))!==continuationFreeze.source_freeze_sha256)throw Error('resume.source-freeze-drift');
if(hash(readFileSync(resolve(adjudicationPath)))!==continuationFreeze.adjudication_sha256)throw Error('resume.adjudication-drift');
if(hash(readFileSync(resolve(continuationFreeze.preserved_runtime_ref)))!==continuationFreeze.preserved_runtime_sha256)throw Error('resume.preserved-runtime-drift');
if(hash(readFileSync(resolve(continuationFreeze.prior_failure_ledger_ref)))!==continuationFreeze.prior_failure_ledger_sha256)throw Error('resume.prior-failure-ledger-drift');

const adjudication=read(resolve(adjudicationPath));
if(adjudication.schema_version!=='are.contextbench-reviewed-model-timeout-adjudication/v1'||adjudication.decision!=='retain-as-unknown-usage-model-timeout-and-continue-unstarted-identities'||adjudication.rerun_cell!==false)throw Error('resume.adjudication-invalid');
const resultPath=resolve(adjudication.result_ref),completionPath=resolve(adjudication.completion_ref),pausePath=resolve(adjudication.pause_ref);
if(hash(readFileSync(resultPath))!==adjudication.result_sha256||hash(readFileSync(completionPath))!==adjudication.completion_sha256||hash(readFileSync(pausePath))!==adjudication.pause_sha256)throw Error('resume.failure-artifact-drift');
const failedResult=read(resultPath),failedCompletion=read(completionPath),pause=read(pausePath),terminal=failedResult.receipts?.at(-1);
if(failedResult.cell_id!==adjudication.cell_id||failedResult.status!=='run_error'||failedResult.error!=='glm.deadline-exceeded'||failedCompletion.status!=='run_error'||failedCompletion.result_sha256!==adjudication.result_sha256)throw Error('resume.failure-result-invalid');
if(terminal?.kind!=='model'||terminal.dispatched!==true||terminal.status!==null||terminal.response_bytes!==0||terminal.failure_code!=='deadline-exceeded'||terminal.timeout_ms!==300000||terminal.input_tokens!=null||terminal.output_tokens!=null)throw Error('resume.timeout-receipt-invalid');
if(pause.cell_id!==adjudication.cell_id||pause.directive!=='pause-unstarted'||pause.ok!==false||!pause.issues?.some(issue=>issue.code==='dispatch.shared-runtime-failure'))throw Error('resume.pause-invalid');
const knownModels=failedResult.receipts.filter(receipt=>receipt.kind==='model'&&receipt.dispatched===true&&Number.isSafeInteger(receipt.input_tokens)&&Number.isSafeInteger(receipt.output_tokens));
if(knownModels.reduce((sum,receipt)=>sum+receipt.input_tokens+receipt.output_tokens,0)!==adjudication.known_model_tokens||adjudication.unknown_model_receipts!==1)throw Error('resume.usage-adjudication-invalid');

const {matrix}=verifyFreeze(freezePath),root=resolve(outRoot),driver=resolve(root,'sequence');mkdirSync(driver,{recursive:true});
for(const name of ['skipped.json','completed.json'])if(existsSync(resolve(driver,name)))throw Error('resume.terminal-ledger-exists:'+name);
const priorFailureLedger=read(resolve(continuationFreeze.prior_failure_ledger_ref));
if(priorFailureLedger.schema_version!=='are.contextbench-local-failure-ledger/v1'||priorFailureLedger.recorded_failures!==priorFailureLedger.rows.length)throw Error('resume.prior-failure-ledger-invalid');
if(mode==='--verify-only'){
  console.log(JSON.stringify({ok:true,directive:'verified-only',cell_id:adjudication.cell_id,rerun_cell:false,known_model_tokens:adjudication.known_model_tokens,unknown_model_receipts:1,authority_effect:'none'}));
  process.exit(0);
}
if(mode!==undefined)throw Error('resume.mode-invalid');
const runProcess=(script,cellId)=>{const log=resolve(driver,cellId+'.log'),fd=openSync(log,'wx',0o600);try{return spawnSync(process.execPath,[fileURLToPath(new URL(script,import.meta.url)),freezePath,cellId,credentialPath,root],{stdio:['ignore',fd,fd]});}finally{closeSync(fd);}};
const allowedEarly=new Set(['final_context_selected','no_context_selected','invalid_final_response','token_budget_stopped','context_budget_stopped','call_budget_exhausted']);
const skipped=[],failures=structuredClone(priorFailureLedger.rows);let adjudicationConsumed=false;
for(const prefix of matrix.prefixes){
  verifyFreeze(freezePath);const prefixRoot=resolve(root,prefix.cell_id),completed=resolve(prefixRoot,'completed.json');
  if(!existsSync(completed)){if(existsSync(prefixRoot))throw Error('resume.incomplete-existing-prefix:'+prefix.cell_id);console.log(JSON.stringify({cell_id:prefix.cell_id,status:'starting-prefix'}));const run=runProcess('./run-prefix-cell.mjs',prefix.cell_id);if(run.status!==0)throw Error('resume.prefix-process-failed:'+prefix.cell_id);}
  const result=read(resolve(prefixRoot,'result.json')),completion=read(completed);
  if(result.status!==completion.status)throw Error('resume.prefix-status-mismatch:'+prefix.cell_id);
  const branches=matrix.branches.filter(cell=>cell.prefix_cell_id===prefix.cell_id);
  if(result.status!=='shared_prefix_ready'){
    if(!allowedEarly.has(result.status))throw Error('resume.shared-prefix-failure:'+prefix.cell_id);
    for(const branch of branches)skipped.push({cell_id:branch.cell_id,prefix_cell_id:prefix.cell_id,instance_id:branch.instance_id,status:'not_started_prefix_ineligible',prefix_status:result.status});
    console.log(JSON.stringify({cell_id:prefix.cell_id,status:result.status,directive:'retain-prefix-ineligible',skipped_branches:branches.length}));continue;
  }
  if(result.shared_prefix_boundary?.generation!==1||result.recycling?.phase!=='idle')throw Error('resume.prefix-boundary-invalid:'+prefix.cell_id);
  for(const cell of branches){
    verifyFreeze(freezePath);const out=resolve(root,cell.cell_id),done=resolve(out,'completed.json');
    if(!existsSync(done)){if(existsSync(out))throw Error('resume.incomplete-existing-branch:'+cell.cell_id);console.log(JSON.stringify({cell_id:cell.cell_id,status:'starting-branch'}));const run=runProcess('./run-branch-cell.mjs',cell.cell_id);if(run.status!==0)throw Error('resume.branch-process-failed:'+cell.cell_id);}
    const validation=validateDispatchCompletion({cell,root:out});
    if(!validation.ok){
      if(cell.cell_id!==adjudication.cell_id||adjudicationConsumed||resolve(out,'result.json')!==resultPath)throw Error('resume.completion-review-required:'+cell.cell_id);
      adjudicationConsumed=true;
      failures.push({cell_id:cell.cell_id,prefix_cell_id:cell.prefix_cell_id,instance_id:cell.instance_id,status:'run_error',scope:'external-provider',failure_family:'model-transport',failure_code:'deadline-exceeded',terminal_kind:'model',terminal_status:null,response_bytes:0,known_model_tokens:adjudication.known_model_tokens,unknown_model_receipts:1,rerun_cell:false,adjudication_ref:resolve(adjudicationPath),result_sha256:adjudication.result_sha256});
      console.log(JSON.stringify({ok:true,directive:'continue-after-reviewed-model-timeout',cell_id:cell.cell_id,status:'run_error',rerun_cell:false,unknown_model_receipts:1,authority_effect:'none',benchmark_cleared:false}));
    }else{
      console.log(JSON.stringify(validation));
      if(validation.directive==='continue-after-local-failure'&&!failures.some(failure=>failure.cell_id===cell.cell_id))failures.push({cell_id:cell.cell_id,prefix_cell_id:cell.prefix_cell_id,instance_id:cell.instance_id,status:validation.status,...validation.local_failure});
    }
    const branch=read(resolve(out,'result.json'));
    if(branch.prefix_ancestry?.prefix_result_sha256!==completion.result_sha256||branch.prefix_ancestry?.continuation_digest!==result.continuation?.continuation_digest)throw Error('resume.branch-ancestry-mismatch:'+cell.cell_id);
  }
}
if(!adjudicationConsumed)throw Error('resume.adjudication-not-consumed');
writeFileSync(resolve(driver,'skipped.json'),JSON.stringify({rows:skipped,authority_effect:'none'},null,2)+'\n',{flag:'wx'});
persistLocalFailureLedger(driver,failures);
writeFileSync(resolve(driver,'completed.json'),JSON.stringify({scheduled_prefixes:matrix.prefixes.length,scheduled_branches:matrix.branches.length,completed_or_retained:true,skipped_branches:skipped.length,local_branch_failures:failures.length,reviewed_external_failures:1,benchmark_cleared:false,authority_effect:'none'},null,2)+'\n',{flag:'wx'});
