import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve('agent-reasoning-engine/research/contextbench-v1'),path=name=>resolve(root,name),read=name=>JSON.parse(readFileSync(path(name))),hash=name=>createHash('sha256').update(readFileSync(path(name))).digest('hex');
const matrix=read('round46-matrix.json'),preflight=read('initial-envelope-round46.json'),inventory=read('round46-repository-inventory.json'),tests=readFileSync(path('round46-runtime-tests.log'),'utf8'),scoreability=read('round46-sealed-scoreability.json'),selection=read('round46-task-selection.json'),smoke=read('round46-native-scorer-smoke.json');
const readiness={schema_version:'are.contextbench-round46-scorer-readiness/v1',status:'ready',native_scorer_sha256:createHash('sha256').update(readFileSync(resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py'))).digest('hex'),sealed_scoreability_sha256:createHash('sha256').update(readFileSync(resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/sealed-scoreability.py'))).digest('hex'),sealed_projection_ref:'round46-sealed-scoreability.json',sealed_projection_sha256:hash('round46-sealed-scoreability.json'),native_smoke_ref:'round46-native-scorer-smoke.json',native_smoke_sha256:hash('round46-native-scorer-smoke.json'),native_smoke_passed:smoke.passed,confirmation_scorer_ref:'score-round46.mjs',confirmation_scorer_sha256:hash('score-round46.mjs'),model_calls:0,authority_effect:'none',open_questions_ref:'PLAN-round46.md#open-questions'};
writeFileSync(path('round46-scorer-readiness.json'),JSON.stringify(readiness,null,2)+'\n');
const selected=new Set(selection.tasks.map(row=>row.instance_id)),projected=new Map(scoreability.rows.map(row=>[row.instance_id,row]));
const checks={
  matrix_shape:matrix.tasks.length===8&&matrix.prefixes.length===8&&matrix.branches.length===16&&matrix.cells.length===24,
  model_timeout_bound:matrix.cells.every(cell=>cell.provider_profile.model_timeout_ms===120000),
  hypothesis_bound:matrix.hypothesis_ref!=null&&matrix.instrument_hypothesis_ref!=null&&matrix.success_criteria?.effect_readiness_boundary_exact===true&&matrix.success_criteria?.aggregate_treatment_tokens_not_above_control===true,
  sole_treatment_difference:matrix.cells.every(cell=>cell.limits.evidence_slate===(cell.state_arm==='state')),
  correction_loops_disabled:matrix.cells.every(cell=>cell.limits.maximum_terminal_corrections===0&&cell.limits.incomplete_output_corrections===0),
  paired_token_limit_declared:matrix.success_criteria?.treatment_minus_control_tokens_per_pair_maximum===3072,
  repositories_ready:inventory.status==='ready'&&inventory.repositories.length===8&&inventory.repositories.every(row=>row.status==='commit-present'&&row.clone_transfer_verified===true),
  sealed_scoreability:scoreability.schema_version==='are.contextbench-sealed-scoreability/v1'&&[...selected].every(id=>projected.get(id)?.scoreable===true),
  sealed_non_disclosure:scoreability.disclosure.includes('no gold paths')&&!JSON.stringify(scoreability).includes('gold_context'),
  native_scorer_smoke:smoke.status==='passed'&&smoke.passed===8&&smoke.scheduled===8&&smoke.rows.every(row=>row.status==='scoreable'&&row.model_calls===0),
  tokenizer_preflight:preflight.status==='passed-initial-envelope'&&preflight.rows.length===8&&preflight.rows.every(row=>row.status==='token_budget_stopped'&&row.model_calls===0),
  model_calls_zero:preflight.model_calls===0&&smoke.model_calls===0,
  benchmark_local_tests_passed:tests.includes('tests 426')&&tests.includes('pass 426')&&tests.includes('fail 0'),
  causal_boundary_tested:tests.includes('effect and verification fork survives an incomplete confirming response and guides treatment once'),
  exact_delivery_tested:tests.includes('readiness requires effect confirmation before a later verification receipt'),
  recycling_checkpoint_tested:tests.includes('an explicit shared boundary archives completed history before either branch renders'),
  bounded_timeout_tested:tests.includes('zero-byte timeout debits the admitted input and output upper bound'),
  symmetric_censoring_tested:tests.includes('bounded prefix failure becomes a symmetric fixed zero and preserves raw metrics'),
  unbounded_unknown_stops:tests.includes('unmatched unknown usage, malformed bounds, too many failures, and too few pairs fail separately'),
  continuity_method_tested:tests.includes('requires the objective hierarchy and research method in reviewed plans when policy declares markers')
};
const evidence=['round46-matrix.json','round46-repository-inventory.json','round46-sealed-scoreability.json','round46-task-selection.json','round46-native-scorer-smoke.json','initial-envelope-round46.json','round46-runtime-tests.log','round46-scorer-readiness.json','round46-public-input-screening.json'].map(name=>({path:`agent-reasoning-engine/research/contextbench-v1/${name}`,sha256:hash(name)}));
const output={schema_version:'are.contextbench-round46-local-gate/v1',status:Object.values(checks).every(Boolean)?'pass':'fail',checks,evidence_refs:evidence,decision:'Freeze H65 only if exact receipt binding, effect then verification ordering, held-effect, ancestry, sole-readiness, storage, scorer, preflight, accounting, and continuity checks pass.',claim_ceiling:'Local admission, integrity, tokenizer, scorer, and causal-boundary readiness only; no quality or ContextBench clearance claim.',model_calls:0,benchmark_cleared:false,authority_effect:'none',open_questions_ref:'PLAN-round46.md#open-questions'};
if(output.status!=='pass')throw Error('round46.local-gate:'+Object.entries(checks).filter(([,ok])=>!ok).map(([name])=>name).join(','));
writeFileSync(path('round46-local-gate.json'),JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify({status:output.status,checks:Object.keys(checks).length}));
