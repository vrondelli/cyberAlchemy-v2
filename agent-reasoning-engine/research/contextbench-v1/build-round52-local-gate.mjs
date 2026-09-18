import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve('agent-reasoning-engine/research/contextbench-v1');
const path=name=>resolve(root,name);
const read=name=>JSON.parse(readFileSync(path(name)));
const hash=name=>createHash('sha256').update(readFileSync(path(name))).digest('hex');
const fileHash=file=>createHash('sha256').update(readFileSync(resolve(file))).digest('hex');
const matrix=read('round52-matrix.json');
const preflight=read('initial-envelope-round52.json');
const inventory=read('round52-repository-inventory.json');
const tests=readFileSync(path('round52-runtime-tests.log'),'utf8');
const scoreability=read('round52-sealed-scoreability.json');
const selection=read('round52-task-selection.json');
const smoke=read('round52-native-scorer-smoke.json');
const calibration=read('round52-provider-token-calibration.json');
const replay=read('round52-round51-replay.json');

const readiness={
  schema_version:'are.contextbench-round52-scorer-readiness/v1',
  status:'ready',
  native_scorer_sha256:fileHash('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py'),
  sealed_scoreability_sha256:fileHash('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/sealed-scoreability.py'),
  sealed_projection_ref:'round52-sealed-scoreability.json',
  sealed_projection_sha256:hash('round52-sealed-scoreability.json'),
  native_smoke_ref:'round52-native-scorer-smoke.json',
  native_smoke_sha256:hash('round52-native-scorer-smoke.json'),
  native_smoke_passed:smoke.passed,
  confirmation_scorer_ref:'score-round52.mjs',
  confirmation_scorer_sha256:hash('score-round52.mjs'),
  model_calls:0,
  authority_effect:'none',
  open_questions_ref:'PLAN-round52.md#open-questions'
};
writeFileSync(path('round52-scorer-readiness.json'),JSON.stringify(readiness,null,2)+'\n');

const selected=new Set(selection.tasks.map(row=>row.instance_id));
const projected=new Map(scoreability.rows.map(row=>[row.instance_id,row]));
const checks={
  matrix_shape:matrix.tasks.length===8&&matrix.prefixes.length===8&&matrix.branches.length===16&&matrix.cells.length===24,
  round52_cell_identity:matrix.cells.every(cell=>cell.cell_id.startsWith('r52-')),
  model_timeout_bound:matrix.cells.every(cell=>cell.provider_profile.model_timeout_ms===120000),
  hypothesis_bound:matrix.hypothesis_ref!=null&&matrix.instrument_hypothesis_ref!=null,
  terminal_only_contract:matrix.success_criteria?.terminal_boundary_only===true&&matrix.prefixes.every(cell=>cell.cell_id.includes('terminal-prefix')),
  sole_treatment_difference:matrix.cells.every(cell=>cell.limits.decision_state===(cell.state_arm==='state')&&cell.limits.decision_state_substitution===(cell.state_arm==='state')&&cell.limits.decision_state_handles===(cell.state_arm==='state')),
  compact_state_limits:matrix.cells.every(cell=>cell.limits.decision_state_evidence===3&&cell.limits.decision_state_bytes===1024&&cell.limits.decision_state_tokens===160),
  input_reduction_declared:matrix.success_criteria?.minimum_first_request_input_token_reduction===128,
  provider_token_calibration:calibration.status==='passed'&&calibration.input_token_reduction>=128&&calibration.treatment_minus_control_input_tokens<=-128&&calibration.receipts.every(row=>row.full_read_id_occurrences===0),
  incremental_round51_replay:replay.status==='passed'&&Object.values(replay.checks).every(Boolean)&&replay.rows.every(row=>row.ok&&row.measurements.treatment_added_full_read_id_occurrences===0&&row.measurements.inherited_full_read_id_occurrences_paired===true),
  correction_loops_disabled:matrix.cells.every(cell=>cell.limits.maximum_terminal_corrections===0&&cell.limits.incomplete_output_corrections===0),
  paired_token_limit_declared:matrix.success_criteria?.treatment_minus_control_tokens_per_pair_maximum===3072,
  repositories_ready:inventory.status==='ready'&&inventory.repositories.length===8&&inventory.repositories.every(row=>row.status==='commit-present'&&row.clone_transfer_verified===true),
  sealed_scoreability:scoreability.schema_version==='are.contextbench-sealed-scoreability/v1'&&[...selected].every(id=>projected.get(id)?.scoreable===true),
  sealed_non_disclosure:scoreability.disclosure.includes('no gold paths')&&!JSON.stringify(scoreability).includes('gold_context'),
  public_input_screening:read('round52-public-input-screening.json').rows.length===8&&read('round52-public-input-screening.json').rows.every(row=>row.security_sensitive===false),
  native_scorer_smoke:smoke.status==='passed'&&smoke.passed===8&&smoke.scheduled===8&&smoke.rows.every(row=>row.status==='scoreable'&&row.model_calls===0),
  tokenizer_preflight:preflight.status==='passed-initial-envelope'&&preflight.rows.length===8&&preflight.rows.every(row=>row.status==='token_budget_stopped'&&row.model_calls===0),
  model_calls_zero:preflight.model_calls===0&&smoke.model_calls===0,
  benchmark_local_tests_passed:tests.includes('fail 0'),
  incremental_disclosure_mutations_tested:tests.includes('incremental disclosure permits exactly paired inherited identifiers')&&tests.includes('incremental disclosure rejects a full identifier in treatment state')&&tests.includes('incremental disclosure rejects a full identifier in treatment tool schema')&&tests.includes('incremental disclosure rejects treatment-only common identifier content'),
  prompt_substitution_tested:tests.includes('terminal evidence handles resolve exactly without disclosing full IDs in the prompt'),
  handle_contract_tested:tests.includes('handle schema and resolution retain exact private read IDs')&&tests.includes('handle diagnostics report all schema, duplicate, and unknown defects'),
  terminal_boundary_tested:tests.includes('universal boundary falls back to terminal and exposes one decision state'),
  recycling_checkpoint_tested:tests.includes('an explicit shared boundary archives completed history before either branch renders'),
  infeasibility_stop_tested:tests.includes('stops exactly when the minimum pair count becomes unreachable'),
  bounded_timeout_tested:tests.includes('zero-byte timeout debits the admitted input and output upper bound'),
  symmetric_censoring_tested:tests.includes('bounded prefix failure becomes a symmetric fixed zero and preserves raw metrics'),
  storage_cleanup_tested:tests.includes('cleanup removes only reconstructible source trees and retains evidence')&&tests.includes('capacity guard reports free-space and active-tree failures'),
  continuity_method_tested:tests.includes('requires the objective hierarchy and research method in reviewed plans when policy declares markers')
};
const evidence=['round52-matrix.json','round52-repository-inventory.json','round52-sealed-scoreability.json','round52-task-selection.json','round52-native-scorer-smoke.json','initial-envelope-round52.json','round52-runtime-tests.log','round52-scorer-readiness.json','round52-public-input-screening.json','round52-provider-token-calibration.json','round52-round51-replay.json','hypotheses-round52.json','experiment-round52.json','round52-continuity.json'].map(name=>({path:`agent-reasoning-engine/research/contextbench-v1/${name}`,sha256:hash(name)}));
const output={
  schema_version:'are.contextbench-round52-local-gate/v1',
  status:Object.values(checks).every(Boolean)?'pass':'fail',
  checks,evidence_refs:evidence,
  decision:'Freeze H72 only if terminal-only ancestry, exact private-handle resolution, zero treatment-added full-ID disclosure, paired inherited occurrences, registered prompt substitution, provider-token input reduction, replay and mutation proof, one-call review, storage, scorer, preflight, accounting, and continuity checks all pass.',
  claim_ceiling:'Local admission, integrity, tokenizer, scorer, and terminal-handle readiness only; no quality or ContextBench clearance claim.',
  model_calls:0,
  benchmark_cleared:false,
  authority_effect:'none',
  open_questions_ref:'PLAN-round52.md#open-questions'
};
if(output.status!=='pass')throw Error('round52.local-gate:'+Object.entries(checks).filter(([,ok])=>!ok).map(([name])=>name).join(','));
writeFileSync(path('round52-local-gate.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({status:output.status,checks:Object.keys(checks).length}));
