// Build the preregistered Round 33 paired matrix from locked public tasks.
// No gold/reference columns are read and no model call is made.
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const repository=resolve('.');
const research=resolve('agent-reasoning-engine/research/contextbench-v1');
const taskDirectory=resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks-round33');
const read=path=>JSON.parse(readFileSync(path));
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const writeExact=(path,value)=>{
  const bytes=JSON.stringify(value,null,2)+'\n';
  if(existsSync(path)&&readFileSync(path,'utf8')!==bytes)throw Error(`round33.drift:${path}`);
  if(!existsSync(path))writeFileSync(path,bytes,{flag:'wx'});
};

const providerProfile={
  token_margin:512,
  reasoning_effort:'low',
  model_timeout_ms:300000,
  index_tokenizer_maximum_calls:512,
  request_budget:'contextbench-deferral-v1',
  request_tokenizer_maximum_calls:291,
  index_tokenizer_transport_attempts:2,
  request_tokenizer_transport_attempts:2
};
const commonLimits={
  maximum_calls:96,
  output_cap:2048,
  total_tokens:96000,
  index_entries:8,
  index_tokens:1024,
  finalization_reserve_tokens:14000,
  finalization_calls:2,
  output_deferral:true,
  terminal_submission:true,
  task_state_bytes:4096,
  task_state_tokens:1024,
  task_state_evidence:8,
  task_state_outcomes:12,
  task_state_projection:false,
  incomplete_output_corrections:2,
  task_state_presentations_per_generation:1,
  task_state_include_outcomes:false,
  maximum_terminal_corrections:2,
  terminal_content_fallback:true,
  task_state_max_paths:8,
  task_state_handles_per_path:1,
  task_state_handle_selection:'widest',
  task_state_novelty_gate:false,
  terminal_effect_state:false,
  terminal_effect_state_tokens:3072,
  terminal_effect_state_evidence:6,
  evidence_slate_candidates:8,
  evidence_slate_bytes:4096,
  evidence_slate_tokens:1024
};
const cellBase=(task,index)=>({
  instance_id:task.instance_id,
  arm:'baseline',
  context_limit:8000,
  recycle_at:7000,
  safety_margin:1000,
  provider_profile:providerProfile,
  repetition:1,
  limits:{...commonLimits,evidence_slate:false}
});

export function build(){
  const selection=read(resolve(research,'round33-task-selection.json'));
  const hypotheses=read(resolve(research,'hypotheses-round33.json'));
  const experiment=read(resolve(research,'experiment-round33.json'));
  const manifestPath=resolve(taskDirectory,'manifest.json');
  const manifest=read(manifestPath);
  const inventory=read(resolve(research,'round33-repository-inventory.json'));
  if(selection.gold_inspected_for_selection!==false||selection.task_count!==8||selection.tasks.length!==8)throw Error('round33.selection-invalid');
  if(manifest.gold_fields_present!==false||manifest.tasks.length!==8)throw Error('round33.manifest-invalid');
  if(inventory.status!=='ready'||inventory.repositories.length!==8||inventory.repositories.some(row=>row.status!=='commit-present'))throw Error('round33.inventory-invalid');
  const selected=hypotheses.selection.selected;
  if(experiment.hypothesis_ref!==selected)throw Error('round33.hypothesis-binding');
  const tasks=selection.tasks.map((row,index)=>{
    const item=manifest.tasks.find(candidate=>candidate.instance_id===row.instance_id);
    if(!item)throw Error(`round33.task-manifest-missing:${row.instance_id}`);
    const path=resolve(taskDirectory,item.file),bytes=readFileSync(path),task=JSON.parse(bytes);
    if(digest(bytes)!==item.sha256||item.sha256!==row.task_sha256)throw Error(`round33.task-sha:${row.instance_id}`);
    for(const forbidden of ['gold_context','patch','test_patch','f2p','p2p'])if(Object.hasOwn(task,forbidden))throw Error(`round33.gold-field:${row.instance_id}:${forbidden}`);
    if(task.instance_id!==row.instance_id||task.base_commit!==row.base_commit||task.repo_url!==row.repo_url)throw Error(`round33.task-binding:${row.instance_id}`);
    return {instance_id:task.instance_id,original_inst_id:task.original_inst_id,repo:task.repo,repo_url:task.repo_url,base_commit:task.base_commit,source:task.source,language:task.language,locked_order:index+1};
  });
  const prefixes=[],branches=[];
  for(const [index,task] of tasks.entries()){
    const ordinal=String(index+1).padStart(2,'0'),prefixId=`r33-${ordinal}-prefix-8k`,base=cellBase(task,index);
    prefixes.push({...base,cell_id:prefixId,cell_kind:'shared-prefix',state_arm:'prefix',repetition:0});
    const control={...base,cell_id:`r33-${ordinal}-control-rep1-8k`,cell_kind:'branch',prefix_cell_id:prefixId,state_arm:'control',order_in_pair:index%2===0?1:2};
    const slate={...base,cell_id:`r33-${ordinal}-slate-rep1-8k`,cell_kind:'branch',prefix_cell_id:prefixId,state_arm:'state',order_in_pair:index%2===0?2:1,limits:{...base.limits,evidence_slate:true}};
    branches.push(...(index%2===0?[control,slate]:[slate,control]));
  }
  const matrix={
    schema_version:'are.contextbench-development-matrix/v1',round:'contextbench-development-round33',hypothesis_ref:selected,window_tokens:8000,
    tasks,prefixes,branches,cells:[...prefixes,...branches],task_manifest_ref:manifestPath,
    selection:'Eight locked, never-matrix-exposed public identities selected before gold access. Each task shares one prefix and forks to independent control and evidence-slate branches.',
    protocol_ref:'PLAN-round33.md',continuity_ref:'round33-continuity.json',
    treatment:'One receipt-bound pinned-base metadata slate, at most eight input candidates and exactly evicted within 4,096 bytes and 1,024 provider-measured tokens, presented once during reserved finalization.',
    branch_order:{method:'alternating control-first and slate-first by locked task order',paired_task_outcomes:8,shared_prefixes:8,branch_trajectories:16,physical_cells:24},
    stopping_rules:['No reruns or replacements.','No within-round changes after freeze.','Every scheduled identity remains in the fixed denominator, including unavailable or failed cells.'],
    success_criteria:{...experiment.success_criteria,window_tokens:8000},
    claim_ceiling:'Fresh GLM-5.3-flash 8K development canary only; not benchmark clearance',authority_effect:'none',open_questions_ref:'PLAN-round33.md#open-questions'
  };
  const screening={schema_version:'are.contextbench-public-input-screening/v1',round:33,status:'passed',locked_before_screening:true,task_count:tasks.length,
    review_scope:'Public problem statements only; no gold/reference columns loaded.',security_sensitive_tasks:[],replacement_allowed:false,model_calls:0,authority_effect:'none',open_questions_ref:'PLAN-round33.md#open-questions'};
  writeExact(resolve(research,'round33-public-input-screening.json'),screening);
  writeExact(resolve(research,'round33-matrix.json'),matrix);
  return {status:'matrix-ready',tasks:tasks.length,prefixes:prefixes.length,branches:branches.length,cells:matrix.cells.length,hypothesis_ref:selected,model_calls:0};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(build()));
