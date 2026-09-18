import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';

const root=resolve('agent-reasoning-engine/research/contextbench-v1');
const path=name=>resolve(root,name);
const read=name=>JSON.parse(readFileSync(path(name)));
const hash=name=>createHash('sha256').update(readFileSync(path(name))).digest('hex');
const matrix=read('round34-matrix.json');
const preflight=read('initial-envelope-round34.json');
const inventory=read('round34-repository-inventory.json');
const environment=read('round34-scorer-environment.json');
const smoke=read('round34-scorer-smoke.json');
const tests=readFileSync(path('round34-local-tests.log'),'utf8');
const checks={
  matrix_shape:matrix.tasks.length===8&&matrix.prefixes.length===8&&matrix.branches.length===16&&matrix.cells.length===24,
  sole_treatment_difference:matrix.cells.every(cell=>cell.limits.evidence_slate===(cell.state_arm==='state')),
  correction_loops_disabled:matrix.cells.every(cell=>cell.limits.maximum_terminal_corrections===0&&cell.limits.incomplete_output_corrections===0),
  paired_token_limit_declared:matrix.success_criteria?.treatment_minus_control_tokens_per_pair_maximum===3072,
  repositories_ready:inventory.status==='ready'&&inventory.repositories.length===8&&inventory.repositories.every(row=>row.status==='commit-present'&&row.clone_transfer_verified===true),
  tokenizer_preflight:preflight.status==='passed-initial-envelope'&&preflight.rows.length===8&&preflight.rows.every(row=>row.status==='token_budget_stopped'&&row.model_calls===0),
  model_calls_zero:preflight.model_calls===0,
  tests_passed:tests.includes('tests 45')&&tests.includes('pass 45')&&tests.includes('fail 0'),
  scorer_dependencies_present:environment.status==='dependencies-present'&&Object.keys(environment.environment?.packages??{}).length===3,
  native_scorer_smoke:smoke.native?.final?.span?.gold_size>0&&smoke.native?.final?.file?.gold_size>0
};
const evidence=['round34-matrix.json','round34-repository-inventory.json','initial-envelope-round34.json','round34-local-tests.log','round34-scorer-environment.json','round34-scorer-smoke.json','round34-scorer-smoke-cleanup.json'].map(name=>({path:`agent-reasoning-engine/research/contextbench-v1/${name}`,sha256:hash(name)}));
const output={schema_version:'are.contextbench-round34-local-gate/v1',status:Object.values(checks).every(Boolean)?'pass':'fail',checks,evidence_refs:evidence,decision:'Freeze H57 only if exact shared ancestry, one review call per arm, sole slate prompt difference, and the 3,072-token paired bound remain machine-validated.',claim_ceiling:'Local integrity, tokenizer, and native scorer readiness only; no quality improvement or ContextBench clearance claim.',model_calls:0,benchmark_cleared:false,authority_effect:'none',open_questions_ref:'PLAN-round34.md#open-questions'};
if(output.status!=='pass')throw Error('round34.local-gate:'+Object.entries(checks).filter(([,ok])=>!ok).map(([name])=>name).join(','));
writeFileSync(path('round34-local-gate.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({status:output.status,checks:Object.keys(checks).length}));
