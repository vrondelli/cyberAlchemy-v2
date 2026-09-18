// Build the preregistered H72 incremental-disclosure matrix from locked public tasks.
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const research=resolve('agent-reasoning-engine/research/contextbench-v1');
const taskDirectory=resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks-round52');
const read=path=>JSON.parse(readFileSync(path));
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const write=(name,value)=>{
  const path=resolve(research,name),bytes=JSON.stringify(value,null,2)+'\n';
  if(existsSync(path)){if(readFileSync(path,'utf8')!==bytes)throw Error('round52.drift:'+name);}
  else writeFileSync(path,bytes,{flag:'wx'});
};
const provider_profile={
  token_margin:512,
  reasoning_effort:'low',
  model_timeout_ms:120000,
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
  incomplete_output_corrections:0,
  task_state_presentations_per_generation:1,
  task_state_include_outcomes:false,
  maximum_terminal_corrections:0,
  terminal_content_fallback:true,
  task_state_max_paths:8,
  task_state_handles_per_path:1,
  task_state_handle_selection:'widest',
  task_state_novelty_gate:false,
  terminal_effect_state:false,
  terminal_effect_state_tokens:3072,
  terminal_effect_state_evidence:6,
  evidence_slate:false,
  evidence_slate_candidates:8,
  evidence_slate_bytes:4096,
  evidence_slate_tokens:1024,
  decision_state_evidence:3,
  decision_state_bytes:1024,
  decision_state_tokens:160,
  decision_state_substitution:false,
  decision_state_handles:false
};
const base=task=>({
  instance_id:task.instance_id,
  arm:'baseline',
  context_limit:8000,
  recycle_at:7000,
  safety_margin:1000,
  provider_profile,
  repetition:1,
  limits:{...commonLimits,decision_state:false}
});

export function build(){
  const selection=read(resolve(research,'round52-task-selection.json'));
  const hypotheses=read(resolve(research,'hypotheses-round52.json'));
  const experiment=read(resolve(research,'experiment-round52.json'));
  const manifestPath=resolve(taskDirectory,'manifest.json');
  const manifest=read(manifestPath);
  const inventory=read(resolve(research,'round52-repository-inventory.json'));
  if(selection.status!=='selected-fresh-scoreable-development-canary'||selection.task_count!==8||
    selection.tasks.some(row=>row.sealed_scoreable!==true)||manifest.gold_fields_present!==false||
    manifest.tasks.length!==8||inventory.status!=='ready'||inventory.repositories.length!==8)throw Error('round52.inputs');
  if(experiment.hypothesis_ref!==hypotheses.selection.selected)throw Error('round52.hypothesis-binding');
  const tasks=selection.tasks.map((row,index)=>{
    const item=manifest.tasks.find(x=>x.instance_id===row.instance_id),path=resolve(taskDirectory,item.file),bytes=readFileSync(path),task=JSON.parse(bytes);
    if(digest(bytes)!==item.sha256||item.sha256!==row.task_sha256)throw Error('round52.task-sha:'+row.instance_id);
    for(const forbidden of ['gold_context','patch','test_patch','f2p','p2p'])if(Object.hasOwn(task,forbidden))throw Error('round52.gold-field:'+row.instance_id);
    return {instance_id:task.instance_id,original_inst_id:task.original_inst_id,repo:task.repo,repo_url:task.repo_url,base_commit:task.base_commit,source:task.source,language:task.language,locked_order:index+1};
  });
  const prefixes=[],branches=[];
  for(const [index,task] of tasks.entries()){
    const n=String(index+1).padStart(2,'0'),prefixId=`r52-${n}-terminal-prefix-8k`,common=base(task);
    prefixes.push({...common,cell_id:prefixId,cell_kind:'shared-prefix',state_arm:'prefix',repetition:0});
    const control={...common,cell_id:`r52-${n}-control-review-rep1-8k`,cell_kind:'branch',prefix_cell_id:prefixId,state_arm:'control',order_in_pair:index%2===0?1:2};
    const state={...common,cell_id:`r52-${n}-terminal-handles-rep1-8k`,cell_kind:'branch',prefix_cell_id:prefixId,state_arm:'state',order_in_pair:index%2===0?2:1,limits:{...common.limits,decision_state:true,decision_state_substitution:true,decision_state_handles:true}};
    branches.push(...(index%2===0?[control,state]:[state,control]));
  }
  const matrix={
    schema_version:'are.contextbench-development-matrix/v1',
    round:'contextbench-development-round52',
    hypothesis_ref:hypotheses.selection.selected,
    instrument_hypothesis_ref:hypotheses.retained_instrument_hypothesis_ref,
    window_tokens:8000,
    tasks,prefixes,branches,cells:[...prefixes,...branches],
    task_manifest_ref:manifestPath,
    selection:'Eight locked, never-matrix-exposed, scoreability-admitted public identities from distinct repositories. Each shared trajectory pauses at its first held terminal candidate.',
    protocol_ref:'PLAN-round52.md',
    continuity_ref:'round52-continuity.json',
    instrument_treatment:'Validator-proven indeterminate calls debit their full admitted bound; affected pairs are symmetric zeros and later independent tasks continue.',
    treatment:'Control receives the existing terminal review. Treatment substitutes one request-local terminal evidence-handle projection and a handle-constrained terminal tool for the registered repeated review and finalization messages. The model sees at most three handle/path/range tuples, 1,024 bytes, and 160 measured tokens; treatment-added state and schema contain zero full read IDs; inherited full-ID occurrences remain exactly paired; handles resolve exactly before provenance validation. Treatment must reduce first-request input by at least 128 tokens.',
    branch_order:{method:'alternating control-first and treatment-first by locked task order',paired_task_outcomes:8,shared_prefixes:8,review_branches:16,physical_cells:24},
    stopping_rules:[
      'No reruns or replacements.',
      'No within-round changes after freeze.',
      'Every scheduled identity remains in the fixed denominator.',
      'A validator-proven zero-byte indeterminate call is debited at its full admitted bound and its pair is retained as symmetric zeros.',
      'Stop as soon as six eligible pairs are mathematically unreachable.',
      'Any unbounded usage, nonterminal boundary, held-effect, ancestry, treatment-added full-ID disclosure, inherited prompt drift, exposure, input-reduction, or token-bound violation pauses before the next task.'
    ],
    success_criteria:{...experiment.success_criteria,window_tokens:8000},
    claim_ceiling:'Fresh GLM-5.3-flash 8K development canary only; not benchmark clearance',
    authority_effect:'none',
    open_questions_ref:'PLAN-round52.md#open-questions'
  };
  const screening=read(resolve(research,'round52-public-input-screening.json'));
  if(screening.status!=='passed'||screening.round!==52||screening.rows?.length!==8||screening.rows.some(row=>row.security_sensitive!==false))throw Error('round52.public-input-screening');
  write('round52-matrix.json',matrix);
  return {status:'matrix-ready',tasks:8,prefixes:8,review_branches:16,cells:24,hypothesis_ref:matrix.hypothesis_ref,model_calls:0};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(build()));
