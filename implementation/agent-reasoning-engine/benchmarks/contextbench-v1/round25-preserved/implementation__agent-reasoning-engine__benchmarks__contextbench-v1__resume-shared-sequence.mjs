// Resume only unstarted cells after one exact, externally reviewed local-failure
// adjudication. Completed identities are validated and never dispatched again.
import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,openSync,closeSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {verifyFreeze} from './verify-freeze.mjs';
import {validateDispatchCompletion} from './dispatch-validation.mjs';
import {persistLocalFailureLedger} from './local-failure-ledger.mjs';

const [freezePath,credentialPath,outRoot,adjudicationPath]=process.argv.slice(2);
if(!adjudicationPath)throw Error('freeze credential output-root adjudication required');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),read=path=>JSON.parse(readFileSync(path));
const adjudication=read(resolve(adjudicationPath));
if(adjudication.schema_version!=='are.contextbench-local-failure-adjudication/v1'||adjudication.decision!=='retain-as-local-no-dispatch-failure-and-continue-unstarted-identities'||adjudication.rerun_cell!==false)throw Error('resume.adjudication-invalid');
const healthPath=resolve(adjudication.health_ref),health=read(healthPath);
if(hash(readFileSync(healthPath))!==adjudication.health_sha256||health.successful!==health.attempts||health.attempts<3||health.provider_requests!==0||health.secret_exposed!==false)throw Error('resume.health-evidence-invalid');
const resultPath=resolve(adjudication.result_ref),failedResult=read(resultPath),terminal=failedResult.receipts?.at(-1);
if(hash(readFileSync(resultPath))!==adjudication.result_sha256||failedResult.cell_id!==adjudication.cell_id||failedResult.status!=='run_error'||failedResult.error!=='glm.secret-resolution-failed'||terminal?.kind!=='tokenizer'||terminal.dispatched!==false||terminal.status!==null||terminal.response_bytes!==0||terminal.failure_code!=='secret-resolution-failed'||terminal.secret_resolution_failure!=='timeout')throw Error('resume.failure-evidence-invalid');
const pausePath=resolve(adjudication.pause_ref);
if(hash(readFileSync(pausePath))!==adjudication.pause_sha256)throw Error('resume.pause-evidence-invalid');

const {matrix}=verifyFreeze(freezePath),root=resolve(outRoot),driver=resolve(root,'sequence');mkdirSync(driver,{recursive:true});
for(const name of ['skipped.json','local-failures.json','completed.json'])if(existsSync(resolve(driver,name)))throw Error('resume.terminal-ledger-exists:'+name);
const runProcess=(script,cellId)=>{const log=resolve(driver,cellId+'.log'),fd=openSync(log,'wx',0o600);try{return spawnSync(process.execPath,[fileURLToPath(new URL(script,import.meta.url)),freezePath,cellId,credentialPath,root],{stdio:['ignore',fd,fd]});}finally{closeSync(fd);}};
const allowedEarly=new Set(['final_context_selected','no_context_selected','invalid_final_response','token_budget_stopped','context_budget_stopped','call_budget_exhausted']);
const skipped=[],localFailures=[];let adjudicationConsumed=false;
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
      if(cell.cell_id!==adjudication.cell_id||adjudicationConsumed)throw Error('resume.completion-review-required:'+cell.cell_id);
      if(resolve(out,'result.json')!==resultPath)throw Error('resume.adjudicated-path-mismatch');
      adjudicationConsumed=true;
      const models=failedResult.receipts.filter(receipt=>receipt.kind==='model'&&receipt.dispatched);
      localFailures.push({cell_id:cell.cell_id,prefix_cell_id:cell.prefix_cell_id,instance_id:cell.instance_id,status:failedResult.status,scope:'local-branch',failure_family:'credential-resolution',failure_code:'secret-resolution-failed',terminal_kind:'tokenizer',terminal_status:null,response_bytes:0,known_model_tokens:models.reduce((sum,receipt)=>sum+receipt.input_tokens+receipt.output_tokens,0),unknown_model_receipts:0,adjudication_ref:resolve(adjudicationPath),result_sha256:adjudication.result_sha256});
      console.log(JSON.stringify({ok:true,directive:'continue-after-reviewed-local-failure',cell_id:cell.cell_id,status:failedResult.status,authority_effect:'none',benchmark_cleared:false}));
    }else{
      console.log(JSON.stringify(validation));
      if(validation.directive==='continue-after-local-failure')localFailures.push({cell_id:cell.cell_id,prefix_cell_id:cell.prefix_cell_id,instance_id:cell.instance_id,status:validation.status,...validation.local_failure});
    }
    const branch=read(resolve(out,'result.json'));
    if(branch.prefix_ancestry?.prefix_result_sha256!==completion.result_sha256||branch.prefix_ancestry?.continuation_digest!==result.continuation?.continuation_digest)throw Error('resume.branch-ancestry-mismatch:'+cell.cell_id);
  }
}
if(!adjudicationConsumed)throw Error('resume.adjudication-not-consumed');
writeFileSync(resolve(driver,'skipped.json'),JSON.stringify({rows:skipped,authority_effect:'none'},null,2)+'\n',{flag:'wx'});
persistLocalFailureLedger(driver,localFailures);
writeFileSync(resolve(driver,'completed.json'),JSON.stringify({scheduled_prefixes:matrix.prefixes.length,scheduled_branches:matrix.branches.length,completed_or_retained:true,skipped_branches:skipped.length,local_branch_failures:localFailures.length,benchmark_cleared:false,authority_effect:'none'},null,2)+'\n',{flag:'wx'});
