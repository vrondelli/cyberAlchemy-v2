import {existsSync,readdirSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import {dirname,extname,resolve} from 'node:path';
import {verifyResearchContinuity} from '../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {sha,verifyFreeze} from '../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';
import {validateLargerWindowMatrix} from '../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/larger-window-contract.mjs';

const project=resolve('.');
const parent=resolve(project,'agent-reasoning-engine/research/contextbench-v1');
const root=resolve(parent,'larger-window-v1');
const impl=resolve(project,'implementation/agent-reasoning-engine/benchmarks/contextbench-v1');
const path=name=>resolve(root,name);
const read=target=>JSON.parse(readFileSync(target));
const fileSha=target=>sha(readFileSync(target));
const writeExact=(target,value)=>{const bytes=JSON.stringify(value,null,2)+'\n';if(existsSync(target)){if(readFileSync(target,'utf8')!==bytes)throw Error('round56.drift:'+target);}else writeFileSync(target,bytes,{flag:'wx'});};

function regularFiles(directory,{recursive=false,extensions=null}={}){
  const rows=[];
  for(const entry of readdirSync(directory,{withFileTypes:true})){
    const target=resolve(directory,entry.name);
    if(entry.isDirectory()&&recursive){if(!['node_modules','.git','generated','cache'].includes(entry.name))rows.push(...regularFiles(target,{recursive,extensions}));}
    else if(entry.isFile()&&(!extensions||extensions.has(extname(entry.name))))rows.push(target);
  }
  return rows;
}

export function freezeRound56(){
  const matrixPath=path('round56-matrix.json'),preflightPath=path('initial-envelope-round56.json'),inventoryPath=path('round56-repository-inventory.json');
  const taskManifest=resolve(impl,'development-tasks-round56/manifest.json');
  const matrix=read(matrixPath),preflight=read(preflightPath),inventory=read(inventoryPath),gate=read(path('round56-local-gate.json'));
  const validation=validateLargerWindowMatrix(matrix,10000);
  if(!validation.ok)throw Error('round56.matrix:'+validation.issues.join(','));
  if(gate.status!=='pass'||Object.values(gate.checks).some(value=>value!==true))throw Error('round56.local-gate');
  if(preflight.status!=='passed-initial-envelope'||preflight.model_calls!==0||preflight.rows.length!==8||preflight.rows.some(row=>row.status!=='token_budget_stopped'||row.model_calls!==0))throw Error('round56.preflight');
  if(inventory.status!=='ready'||inventory.repositories.length!==8||inventory.repositories.some(row=>row.status!=='commit-present'||row.clone_transfer_verified!==true))throw Error('round56.inventory');
  const continuity=structuredClone(read(path('continuity-binding.json')));
  continuity.status='freeze-reviewed-run-ready';
  delete continuity.experiment_and_task_refs.unresolved;
  continuity.continuity_review.run_ready=true;
  continuity.continuity_review.passed=true;
  continuity.continuity_review.passed_for_freeze=true;
  continuity.continuity_review.unresolved_bindings=[];
  const reviewed=['PLAN.md','dag.json','hypotheses.json','work-plan.json','window-policy.json','round56-task-selection.json','round56-sealed-scoreability.json','round56-public-input-screening.json','round56-matrix.json','round56-repository-inventory.json','tokenizer-preflight-10k.json','initial-envelope-round56.json','round56-native-scorer-smoke.json','round56-runtime-tests.log','round56-local-gate.json','score-round56.mjs','freeze-round56.mjs'];
  const byPath=new Map(continuity.continuity_review.reviewed_artifacts.map(row=>[row.path,row]));
  for(const relative of [...byPath.keys()])if(relative.endsWith('/PLAN.md'))byPath.delete(relative);
  for(const relative of ['agent-reasoning-engine/LIGHTHOUSE.md','agent-reasoning-engine/research/continuity-policy-v4.json'])byPath.set(relative,{path:relative,sha256:fileSha(resolve(project,relative))});
  for(const name of reviewed){const target=path(name),relative=`agent-reasoning-engine/research/contextbench-v1/larger-window-v1/${name}`;byPath.set(relative,{path:relative,sha256:fileSha(target)});}
  continuity.continuity_review.reviewed_artifacts=[...byPath.values()];
  const continuityVerdict=verifyResearchContinuity({binding:continuity,policy:read(resolve(project,'agent-reasoning-engine/research/continuity-policy-v4.json')),hypotheses:read(path('hypotheses.json')),phase:'freeze',root:project});
  if(!continuityVerdict.ok)throw Error('round56.continuity:'+continuityVerdict.reason_codes.join(','));
  const freezeContinuity=path('round56-freeze-continuity.json');
  writeExact(freezeContinuity,continuity);

  const taskFiles=[taskManifest,...read(taskManifest).tasks.map(row=>resolve(dirname(taskManifest),row.file))];
  const largerWindowFiles=regularFiles(root).filter(target=>!target.endsWith('freeze-round56-execution.json'));
  const implementationFiles=regularFiles(impl,{extensions:new Set(['.mjs','.py','.json'])});
  const codingFiles=regularFiles(resolve(project,'implementation/agent-reasoning-engine/packages/coding-agent-runtime'),{recursive:true,extensions:new Set(['.mjs','.json'])});
  const fixed=[
    '/home/vrondelli/.config/are/glm-flash-credential.json',
    resolve(project,'agent-reasoning-engine/LIGHTHOUSE.md'),
    resolve(project,'agent-reasoning-engine/research/tool-state-audit-v1/OBJECTIVE.md'),
    resolve(project,'agent-reasoning-engine/research/continuity-policy-v4.json'),
    resolve(parent,'acceptance.json'),resolve(parent,'round52-provider-token-calibration.json'),resolve(parent,'score-round52.mjs'),
    resolve(parent,'round52-outcome.json'),resolve(parent,'round55-confirmation-matrix.json'),resolve(parent,'round55-confirmation-outcome.json'),resolve(parent,'round55-closeout.json'),
    resolve(parent,'releases/glm-5.3-flash-8k-v1/README.md')
  ];
  const all=[...fixed,...largerWindowFiles,...implementationFiles,...codingFiles,...taskFiles];
  const sources=[...new Set(all)].filter(target=>statSync(target).isFile()).sort().map(target=>({path:target,sha256:fileSha(target)}));
  const material={
    schema_version:'are.contextbench-freeze/v1',status:'frozen',authority_effect:'none',node_version:process.version,
    evaluation_stage:'10k-development-transfer',expected_tasks:8,expected_cells:24,matrix_ref:matrixPath,preflight_ref:preflightPath,
    task_manifest_ref:taskManifest,task_directory:dirname(taskManifest),repository_inventory_ref:inventoryPath,repository_inventory_sha256:fileSha(inventoryPath),
    upstream:'/home/vrondelli/.local/share/are/contextbench-upstream-117',python:'/home/vrondelli/.local/share/are/contextbench-venv-117/bin/python',scorer:resolve(impl,'score_native.py'),
    scoring_cache:'/home/vrondelli/.local/share/are/contextbench-retained-v1/contextbench-round56-score-cache',
    native_worktree_root:'/home/vrondelli/.local/share/are/contextbench-retained-v1/contextbench-round56-native-worktrees',
    confirmation_scorer:path('score-round56.mjs'),model_timeout_ms:120000,maximum_bounded_indeterminate_calls:2,minimum_complete_pairs:6,
    indeterminate_call_accounting:'full-admitted-reservation-debit',bounded_failure_scoring:'symmetric-fixed-zero',maximum_evidence_handles:3,
    maximum_evidence_handle_bytes:1024,maximum_evidence_handle_tokens:160,minimum_first_request_input_token_reduction:128,
    treatment_added_full_read_id_occurrences:0,inherited_full_read_id_occurrences_paired:true,maximum_physical_model_calls:784,
    execution:{runner:resolve(impl,'run-shared-terminal-evidence-handles-incremental-v1.mjs'),shards:1,partition:'one sequential frozen 10K development transfer; alternating control and treatment order by identity'},
    sources,continuity_review:{passed:true,reviewer:'executing root agent',method:'objective → gap → question → competing hypotheses → selection → experiment/tasks/criteria → results → observations → reviewed decision → successor',binding_ref:freezeContinuity},
    claim_ceiling:'10K development transfer only; not confirmation or benchmark clearance',predecessor_freeze_ref:resolve(parent,'freeze-round55-confirmation.json'),
    successor_reason:'Round 55 confirmed H72 at 8K; Round 56 changes only the native context window and recycle threshold to test unchanged transfer at 10K.'
  };
  const freeze={...material,freeze_sha256:sha(material)},out=path('freeze-round56-execution.json');
  writeExact(out,freeze);
  verifyFreeze(out);
  return {status:'frozen-10k-development-run-ready',sources:sources.length,freeze_sha256:freeze.freeze_sha256,tasks:8,cells:24,model_calls:0};
}

console.log(JSON.stringify(freezeRound56()));
