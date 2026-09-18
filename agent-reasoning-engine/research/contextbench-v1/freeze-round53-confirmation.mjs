import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {verifyFreeze,sha} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';

const root=resolve('agent-reasoning-engine/research/contextbench-v1');
const impl=resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1');
const round=Number(process.argv[2]??53);
const read=path=>JSON.parse(readFileSync(path));
const fileSha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const matrixPath=resolve(root,`round${round}-confirmation-matrix.json`);
const preflightPath=resolve(root,`initial-envelope-round${round}.json`);
const inventoryPath=resolve(root,`round${round}-repository-inventory.json`);
const taskManifest=resolve(impl,`confirmation-tasks-round${round}/manifest.json`);
const matrix=read(matrixPath),preflight=read(preflightPath),inventory=read(inventoryPath),selection=read(resolve(root,`round${round}-task-selection.json`));
if(matrix.evaluation_stage!=='confirmation'||matrix.tasks.length!==8||matrix.prefixes.length!==8||matrix.branches.length!==16||matrix.cells.length!==24)throw Error('round53.matrix');
if(preflight.status!=='passed-initial-envelope'||preflight.model_calls!==0||preflight.rows.length!==8||preflight.rows.some(row=>row.status!=='token_budget_stopped'))throw Error('round53.preflight');
if(inventory.repositories.length!==8||inventory.repositories.some(row=>row.status!=='commit-present'||row.clone_transfer_verified!==true))throw Error('round53.inventory');
if(selection.tasks.some(row=>row.prior_exposure!=='none-in-recorded-contextbench-matrices'||row.sealed_scoreable!==true))throw Error(`round${round}.selection`);
const developmentFreeze=read(resolve(root,'freeze-round52-execution.json'));
const local=[
  resolve(root,`round${round}-confirmation-plan.json`),resolve(root,`round${round}-task-selection.json`),resolve(root,`round${round}-scoreability-input.json`),
  resolve(root,`round${round}-sealed-scoreability.json`),matrixPath,inventoryPath,preflightPath,
  resolve(root,'select-round53-confirmation.py'),resolve(root,'prepare-round53-repositories.py'),resolve(root,'build-round53-confirmation.mjs'),
  resolve(root,'score-round53-confirmation.mjs'),resolve(root,'freeze-round53-confirmation.mjs'),taskManifest,
  resolve(root,'round52-outcome.json'),resolve(root,'freeze-round52-execution.json'),
  '/home/vrondelli/.config/are/glm-flash-credential.json'
];
if(round>=54)local.push(resolve(root,`round${round}-runtime-tests.log`));
for(const item of read(taskManifest).tasks)local.push(resolve(dirname(taskManifest),item.file));
if(round>=54)local.push(resolve(root,'round53-interrupted-outcome.json'));
if(round>=55)local.push(resolve(root,'round54-interrupted-outcome.json'));
const predecessorSources=developmentFreeze.sources.map(row=>({path:row.path,sha256:fileSha(row.path)}));
const sources=[...new Map([...predecessorSources,...local.map(path=>({path,sha256:fileSha(path)}))].map(row=>[row.path,row])).values()].sort((a,b)=>a.path.localeCompare(b.path));
const material={
  schema_version:'are.contextbench-freeze/v1',status:'frozen',authority_effect:'none',node_version:process.version,
  evaluation_stage:'reserved-confirmation',expected_tasks:8,expected_cells:24,matrix_ref:matrixPath,preflight_ref:preflightPath,
  task_manifest_ref:taskManifest,task_directory:dirname(taskManifest),repository_inventory_ref:inventoryPath,
  repository_inventory_sha256:fileSha(inventoryPath),upstream:'/home/vrondelli/.local/share/are/contextbench-upstream-117',
  python:'/home/vrondelli/.local/share/are/contextbench-venv-117/bin/python',scorer:resolve(impl,'score_native.py'),
  scoring_cache:`/home/vrondelli/.local/share/are/contextbench-retained-v1/contextbench-round${round}-score-cache`,
  native_worktree_root:`/home/vrondelli/.local/share/are/contextbench-retained-v1/contextbench-round${round}-native-worktrees`,
  confirmation_scorer:resolve(root,'score-round53-confirmation.mjs'),model_timeout_ms:120000,maximum_bounded_indeterminate_calls:2,
  minimum_complete_pairs:6,indeterminate_call_accounting:'full-admitted-reservation-debit',bounded_failure_scoring:'symmetric-fixed-zero',
  maximum_evidence_handles:3,maximum_evidence_handle_bytes:1024,maximum_evidence_handle_tokens:160,
  minimum_first_request_input_token_reduction:128,treatment_added_full_read_id_occurrences:0,inherited_full_read_id_occurrences_paired:true,
  execution:{runner:resolve(impl,'run-shared-terminal-evidence-handles-incremental-v1.mjs'),shards:1,partition:'sequential untouched independent confirmation; exact Round 52 treatment and stopping rules'},
  sources,continuity_review:{passed:true,reviewer:'executing parent agent',method:'objective → gap → question → competing hypotheses → selection → experiment/tasks/criteria → results → observations → reviewed decision → successor'},
  claim_ceiling:'untouched 8K confirmation only; not benchmark clearance',predecessor_freeze_ref:resolve(root,'freeze-round52-execution.json'),
  successor_reason:round>=55?'Round 52 passed development; Rounds 53 and 54 exposed bounded instrument gaps; Round 55 retains tokenizer failures and nonterminal prefixes as symmetric fixed zeros while requiring six valid terminal pairs on untouched identities.':round===54?'Round 52 passed development; Round 53 exposed a bounded zero-model tokenizer-failure accounting gap; Round 54 tests the unchanged H72 treatment with the corrected instrument on untouched identities.':'Round 52 passed all development gates; Round 53 is the required untouched independent confirmation.'
};
const freeze={...material,freeze_sha256:sha(material)},out=resolve(root,`freeze-round${round}-confirmation.json`);
writeFileSync(out,JSON.stringify(freeze,null,2)+'\n',{flag:'wx'});verifyFreeze(out);
console.log(JSON.stringify({status:'frozen-confirmation-run-ready',sources:sources.length,freeze_sha256:freeze.freeze_sha256,tasks:8,cells:24,model_calls:0}));
