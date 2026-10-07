// Freeze a same-cohort G03 recovery after a detached SSH generation attempt ended.
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

const source='/opt/are/evolution-runtime/g03-product-replication-r1/source/manifest.json';
const origin='/opt/are-benchmark-runs/longmemeval-product80-20260927-v1/output-pids128-r2';
const code='/opt/are/evolution-runtime/g03-product-replication-code-r3/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/longmemeval/confirmation-v1/unexposed-live-v1/replication-cohort-paired-v1.mjs';
const output='/opt/are-benchmark-runs/longmemeval-product80-20260927-v1/output-resume-r3';
const freeze='/opt/are/evolution-runtime/g03-product80-recovery-r3-FREEZE.json';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifestBytes=readFileSync(source),manifest=JSON.parse(manifestBytes);
const originRunBytes=readFileSync(join(origin,'RUN.json')),originRun=JSON.parse(originRunBytes);
if(manifest.question_ids?.length!==80||manifest.rows?.length!==80||
  sha(manifestBytes)!=='dc9d04b064c8fbd58e94eaecf9f4adb20c61b70e55c08b3e68495038aed67413'||
  originRun.source_manifest_file_sha256!==sha(manifestBytes)||
  originRun.maximum_workers!==2||originRun.model!=='glm-5.3-flash'||
  existsSync(join(origin,'RESULT.json'))||existsSync(output)||existsSync(freeze))
  throw Error('g03-recovery.origin-or-target');
const completed=[];
for(let index=0;index<56;index++){
  const id=manifest.question_ids[index],dir=join(origin,`task-${String(index).padStart(2,'0')}-${id}`),path=join(dir,'RESULT.json');
  const bytes=readFileSync(path),result=JSON.parse(bytes);
  if(result.question_id!==id||result.status!=='completed'||result.answers?.length!==2||
    result.unknown_usage!==false||result.known_tokens!==result.calls.reduce((sum,call)=>sum+call.usage.total_tokens,0))
    throw Error('g03-recovery.completed-row:'+index);
  completed.push({index,question_id:id,result_sha256:sha(bytes),known_tokens:result.known_tokens});
}
const partial=[];
for(const index of [56,57]){
  const id=manifest.question_ids[index],dir=join(origin,`task-${String(index).padStart(2,'0')}-${id}`);
  if(existsSync(join(dir,'RESULT.json')))throw Error('g03-recovery.partial-was-terminal:'+index);
  const files=readdirSync(dir).filter(name=>/^event-\d+\.json$/.test(name)).sort(),latest=new Map();
  for(const name of files){const event=JSON.parse(readFileSync(join(dir,name)));latest.set(`${event.channel}:${event.id}`,event);}
  const events=[...latest.values()],model=events.filter(event=>event.channel==='model'),
    unsettled=model.filter(event=>event.dispatched&&event.phase!=='completed');
  partial.push({index,question_id:id,events:files.length,
    completed_model_calls:model.filter(event=>event.phase==='completed').length,
    known_model_tokens:model.reduce((sum,event)=>sum+(event.phase==='completed'?(event.usage?.total_tokens??0):0),0),
    unsettled_dispatched_model_ids:unsettled.map(event=>event.id),
    unsettled_tokenizer_requests:events.filter(event=>event.channel==='tokenizer'&&event.dispatched&&event.status!=='measured').length,
    partial_event_inventory_sha256:sha(Buffer.from(files.map(name=>name+':'+sha(readFileSync(join(dir,name)))).join('\n')))});
}
if(partial[0].unsettled_dispatched_model_ids.length!==1||partial[1].completed_model_calls!==0||
  partial[1].unsettled_dispatched_model_ids.length!==0)throw Error('g03-recovery.partial-drift');
const receipt={schema_version:'are.g03-product80-recovery-freeze/v1',status:'frozen-before-recovery-model-dispatch',
  source_manifest_sha256:sha(manifestBytes),origin_run_sha256:sha(originRunBytes),origin_output:origin,
  completed_prefix:completed,recovery_start_index:56,recovery_question_ids:manifest.question_ids.slice(56),
  partial_attempts:partial,attempted_usage_unknown:true,
  cause:'SSH transport timed out while VPS remained up; attached generation process exited without terminal result',
  recovery_code_sha256:sha(readFileSync(code)),recovery_output:output,
  policy:'Run the unchanged 80-row source-only cohort from index 56, preserving original arm order and caps; never replace a question. Combine only 56 sealed successes with 24 recovery successes. Preserve partial-attempt costs and deny a complete-cost superiority headline.',
  evaluator_reference_access:false,claim_ceiling:'Operational recovery of a fixed cohort; no public claim before scoring and independent review',
  open_questions_ref:'G03-PRODUCT-REPLICATION-SCORING-RUNBOOK.md'};
writeFileSync(freeze,JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({freeze,sha256:sha(readFileSync(freeze)),completed:completed.length,partial}));
