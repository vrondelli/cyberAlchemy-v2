import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {validateLargerWindowMatrix} from '../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/larger-window-contract.mjs';

const project=resolve('.');
const root=resolve(project,'agent-reasoning-engine/research/contextbench-v1/larger-window-v1');
const parent=resolve(root,'..');
const read=path=>JSON.parse(readFileSync(path));
const local=name=>read(resolve(root,name));
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const matrix=local('round59-matrix.json');
const hypotheses=local('round59-hypotheses.json');
const selection=local('round59-task-selection.json');
const scoreability=local('round59-sealed-scoreability.json');
const inventory=local('round59-repository-inventory.json');
const preflight=local('initial-envelope-round59.json');
const tokenizer=local('tokenizer-preflight-10k.json');
const smoke=local('round59-native-scorer-smoke.json');
const screening=local('round59-public-input-screening.json');
const policy=local('window-policy.json');
const calibration=read(resolve(parent,'round52-provider-token-calibration.json'));
const tests=readFileSync(resolve(root,'round59-runtime-tests.log'),'utf8');
const taskManifest=read(resolve(project,'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/confirmation-tasks-round59/manifest.json'));
const validation=validateLargerWindowMatrix(matrix,10000,'10k-conditional-development','LW-H3a');
const selected=new Set(selection.tasks.map(row=>row.instance_id));
const prior=new Set();
for(const reference of selection.prior_matrix_refs){
  for(const task of read(resolve(project,reference.path)).tasks)prior.add(task.instance_id);
}
const projected=new Map(scoreability.rows.map(row=>[row.instance_id,row]));
const checks={
  whole_schema_matrix_validator:validation.ok,
  matrix_shape:matrix.tasks.length===8&&matrix.prefixes.length===8&&matrix.branches.length===16&&matrix.cells.length===24,
  exact_10k_window:matrix.cells.every(row=>row.context_limit===10000&&row.recycle_at===9000&&row.safety_margin===1000),
  fixed_h3a:matrix.hypothesis_ref==='LW-H3a'&&matrix.cells.every(row=>row.limits.total_tokens===96000&&row.limits.output_cap===2048&&row.limits.maximum_calls===96),
  hypothesis_registry_bound:hypotheses.selection?.selected==='LW-H3a'&&matrix.hypothesis_records_ref==='round59-hypotheses.json',
  sole_treatment_difference:matrix.branches.every(row=>row.limits.decision_state===(row.state_arm==='state')&&row.limits.decision_state_substitution===(row.state_arm==='state')&&row.limits.decision_state_handles===(row.state_arm==='state')&&row.limits.decision_state_handle_activation_minimum===(row.state_arm==='state'?3:undefined)),
  fresh_identity_exclusion:[...selected].every(id=>!prior.has(id))&&selected.size===8,
  task_manifest_exact:taskManifest.tasks.length===8&&taskManifest.tasks.every(row=>selected.has(row.instance_id)),
  repositories_ready:inventory.status==='ready'&&inventory.repositories.length===8&&inventory.repositories.every(row=>row.status==='commit-present'&&row.clone_transfer_verified===true),
  sealed_scoreability:scoreability.schema_version==='are.contextbench-sealed-scoreability/v1'&&[...selected].every(id=>projected.get(id)?.scoreable===true),
  sealed_non_disclosure:scoreability.disclosure.includes('no gold paths')&&!JSON.stringify(scoreability).includes('gold_context'),
  public_input_screening:screening.status==='passed'&&screening.rows.length===8&&screening.rows.every(row=>selected.has(row.instance_id)&&row.security_sensitive===false),
  native_scorer_smoke:smoke.status==='passed'&&smoke.passed===8&&smoke.scheduled===8&&smoke.rows.every(row=>row.status==='scoreable'&&row.model_calls===0),
  tokenizer_endpoint_preflight:tokenizer.status==='passed'&&tokenizer.probes.length===3&&new Set(tokenizer.probes.map(row=>row.tokens)).size===3&&tokenizer.model_calls===0,
  initial_envelope:preflight.status==='passed-initial-envelope'&&preflight.rows.length===8&&preflight.rows.every(row=>row.status==='token_budget_stopped'&&row.error==='recycling.dispatch-admission-denied'&&row.model_calls===0),
  zero_preflight_model_calls:preflight.model_calls===0&&smoke.model_calls===0&&tokenizer.model_calls===0,
  full_runtime_regression:/# tests \d+/u.test(tests)&&tests.includes('# fail 0'),
  parity_tested:tests.includes('Round 59 preregisters fresh prefix-only three-handle conditional activation'),
  conditional_activation_mutation_tested:tests.includes('Round 59 conditional activation mutations are rejected together')&&tests.includes('terminal evidence handles resolve exactly without disclosing full IDs in the prompt'),
  whole_schema_mutation_tested:tests.includes('the larger-window validator reports every independently corrupted contract field'),
  exact_freeze_claim_tested:tests.includes('known evaluation stages accept only their exact claim ceilings'),
  handle_contract_tested:tests.includes('handle schema and resolution retain exact private read IDs')&&tests.includes('handle diagnostics report all schema, duplicate, and unknown defects'),
  prompt_substitution_tested:tests.includes('terminal evidence handles resolve exactly without disclosing full IDs in the prompt'),
  incremental_disclosure_tested:tests.includes('incremental disclosure permits exactly paired inherited identifiers')&&tests.includes('incremental disclosure rejects a full identifier in treatment state'),
  storage_cleanup_tested:tests.includes('cleanup removes only reconstructible source trees and retains evidence')&&tests.includes('capacity guard reports free-space and active-tree failures'),
  window_policy_bound:policy.status==='selected-before-live-outcomes'&&policy.policies.some(row=>row.window_tokens===10000&&row.context_limit===10000&&row.recycle_at===9000&&row.safety_margin===1000),
  provider_token_calibration_preserved:calibration.status==='passed'&&calibration.input_token_reduction>=128&&calibration.receipts.every(row=>row.full_read_id_occurrences===0),
  physical_call_ceiling:matrix.physical_call_ceiling.total_model_calls===784&&matrix.success_criteria.maximum_physical_model_calls===784
};
const evidenceNames=['PLAN.md','continuity-binding.json','dag.json','hypotheses.json','work-plan.json','window-policy.json','round58-reviewed-decision.json','round59-successor-plan.json','build-round59-hypotheses.mjs','round59-hypotheses.json','round59-task-selection.json','round59-scoreability-input.json','round59-sealed-scoreability.json','round59-public-input-screening.json','round59-matrix.json','round59-repository-inventory.json','tokenizer-preflight-10k.json','initial-envelope-round59.json','round59-native-scorer-smoke.json','round59-runtime-tests.log'];
const output={
  schema_version:'are.contextbench-round59-10k-conditional-development-local-gate/v1',
  status:Object.values(checks).every(Boolean)?'pass':'fail',
  validation_issues:validation.issues,
  checks,
  evidence_refs:evidenceNames.map(name=>({path:`agent-reasoning-engine/research/contextbench-v1/larger-window-v1/${name}`,sha256:sha(resolve(root,name))})),
  model_calls:0,
  decision:'Freeze one immutable fresh LW-H3a 10K conditional-development run only when every matrix, freshness, scoreability, tokenizer, runtime, activation, disclosure, accounting, storage, and continuity prerequisite passes.',
  claim_ceiling:'Local fresh 10K conditional-development readiness only; no live result, confirmation, 12K, product capability, or benchmark-clearance claim.',
  benchmark_cleared:false,
  authority_effect:'none',
  open_questions_ref:'PLAN.md#open-questions'
};
if(output.status!=='pass')throw Error('round59.local-gate:'+Object.entries(checks).filter(([,ok])=>!ok).map(([name])=>name).join(',')+(validation.issues.length?':'+validation.issues.join(','):''));
writeFileSync(resolve(root,'round59-local-gate.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({status:output.status,checks:Object.keys(checks).length}));
