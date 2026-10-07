// Assemble a transparently recovered 80-question generation result, without hiding failed attempts.
import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

const source='/opt/are/evolution-runtime/g03-product-replication-r1/source/manifest.json';
const origin='/opt/are-benchmark-runs/longmemeval-product80-20260927-v1/output-pids128-r2';
const recovery='/opt/are-benchmark-runs/longmemeval-product80-20260927-v1/output-resume-r3';
const freezePath='/opt/are/evolution-runtime/g03-product80-recovery-r3-FREEZE.json';
const output='/opt/are-benchmark-runs/longmemeval-product80-20260927-v1/output-composite-r3';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const parse=path=>JSON.parse(readFileSync(path));
const sourceBytes=readFileSync(source),manifest=JSON.parse(sourceBytes),sourceSha=sha(sourceBytes);
const freezeBytes=readFileSync(freezePath),freeze=JSON.parse(freezeBytes);
const originRunBytes=readFileSync(join(origin,'RUN.json')),originRun=JSON.parse(originRunBytes);
const recoveryRunBytes=readFileSync(join(recovery,'RUN.json')),recoveryRun=JSON.parse(recoveryRunBytes);
const recoveryResultBytes=readFileSync(join(recovery,'RESULT.json')),
  recoveryResult=JSON.parse(recoveryResultBytes);
if(existsSync(output)||manifest.question_ids?.length!==80||
  freeze.status!=='frozen-before-recovery-model-dispatch'||freeze.source_manifest_sha256!==sourceSha||
  freeze.origin_run_sha256!==sha(originRunBytes)||freeze.completed_prefix?.length!==56||
  freeze.recovery_start_index!==56||freeze.attempted_usage_unknown!==true||
  originRun.source_manifest_file_sha256!==sourceSha||originRun.maximum_workers!==2||
  recoveryRun.source_manifest_file_sha256!==sourceSha||recoveryRun.start_index!==56||
  recoveryRun.script_sha256!==freeze.recovery_code_sha256||
  recoveryRun.maximum_workers!==2||
  JSON.stringify(recoveryRun.attempted_question_ids)!==JSON.stringify(manifest.question_ids.slice(56))||
  recoveryResult.schema_version!=='are.longmemeval-product-replication-recovery-result/v1'||
  recoveryResult.status!=='completed'||recoveryResult.completed!==24||recoveryResult.assignments!==24||
  recoveryResult.unknown_usage!==false||recoveryResult.results?.length!==24||
  JSON.stringify(recoveryResult.question_ids)!==JSON.stringify(manifest.question_ids.slice(56)))
  throw Error('g03-composite.source-or-recovery-drift');
const results=[];
for(let index=0;index<80;index++){
  const id=manifest.question_ids[index];
  const path=join(index<56?origin:recovery,`task-${String(index).padStart(2,'0')}-${id}`,'RESULT.json');
  const bytes=readFileSync(path),result=JSON.parse(bytes);
  if(result.question_id!==id||result.status!=='completed'||result.answers?.length!==2||
    result.unknown_usage!==false||
    result.known_tokens!==result.calls.reduce((sum,call)=>sum+call.usage.total_tokens,0))
    throw Error('g03-composite.invalid-task:'+index);
  if(index<56){
    if(freeze.completed_prefix[index].question_id!==id||freeze.completed_prefix[index].result_sha256!==sha(bytes))
      throw Error('g03-composite.origin-task-drift:'+index);
  }else if(JSON.stringify(result)!==JSON.stringify(recoveryResult.results[index-56]))
    throw Error('g03-composite.recovery-task-drift:'+index);
  results.push(result);
}
const recoveryLineage={schema_version:'are.g03-product80-recovery-lineage/v1',
  origin_run_sha256:sha(originRunBytes),recovery_run_sha256:sha(recoveryRunBytes),
  recovery_result_sha256:sha(recoveryResultBytes),recovery_freeze_sha256:sha(freezeBytes),
  completed_origin_prefix:56,recovered_suffix:24,
  interrupted_partial_attempts:freeze.partial_attempts,
  interrupted_attempted_usage_unknown:true,
  cost_scope:'successful per-question attempts only; interrupted attempt has one unsettled dispatched model call',
  public_claim_gate:'No complete all-in token or time efficiency headline from this composite'};
mkdirSync(output,{mode:0o700});
const run={...originRun,started_at:new Date().toISOString(),
  schema_version:'are.longmemeval-product-replication-paired-run/v1',
  source_manifest_file_sha256:sourceSha,question_ids:manifest.question_ids,
  assembly_script_sha256:sha(readFileSync(import.meta.filename)),
  recovery_lineage:recoveryLineage,
  claim_ceiling:'Recovered fixed cohort; quality may be scored after reference projection, but all-in efficiency is incomplete'};
writeFileSync(join(output,'RUN.json'),JSON.stringify(run,null,2)+'\n',{flag:'wx',mode:0o600});
const terminal={schema_version:'are.longmemeval-product-replication-paired-result/v1',status:'completed',
  question_ids:manifest.question_ids,results,assignments:80,completed:80,
  model_calls:results.reduce((sum,row)=>sum+row.model_calls,0),
  known_tokens:results.reduce((sum,row)=>sum+row.known_tokens,0),
  unknown_usage:false,successful_attempts_unknown_usage:false,
  interrupted_attempted_usage_unknown:true,failure_count:0,campaign_wall_ms:null,
  campaign_wall_basis:'not-known-after-SSH-transport-interruption',
  evaluator_reference_access:false,recovery_lineage:recoveryLineage,
  claim_ceiling:'Fixed 80-question recovered generation; no complete all-in cost or wall-time claim',
  finished_at:new Date().toISOString()};
writeFileSync(join(output,'RESULT.json'),JSON.stringify(terminal,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({status:'completed',output,run_sha256:sha(readFileSync(join(output,'RUN.json'))),
  result_sha256:sha(readFileSync(join(output,'RESULT.json'))),completed:80,
  interrupted_attempted_usage_unknown:true}));
