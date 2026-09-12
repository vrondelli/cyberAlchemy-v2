// Reproducible round-four source closure and D08 freeze transition.
// Open questions: PROTOCOL-round4.md. This performs no model requests.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {sha,verifyFreeze} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';
import {stable} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {replayResearchWork} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {build,verifyPredecessor,verifyFreezeEvidence} from './bind-round4.mjs';

const repository=resolve('.');
const research=resolve('agent-reasoning-engine/research/contextbench-v1');
const path=name=>resolve(research,name);
const read=name=>JSON.parse(readFileSync(path(name)));
const fileSha=file=>sha(readFileSync(file));
const write=(name,value)=>writeFileSync(path(name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});

function preflightBinding(){
  const report=read('initial-envelope-round4.json');
  if(report.status!=='passed-initial-envelope'||report.model_calls!==0||report.rows.length!==8)throw Error('round4.preflight-report');
  const rows=report.rows.map(row=>{
    const resultRef=resolve(row.output_path,'result.json'),result=JSON.parse(readFileSync(resultRef));
    if(result.status!=='token_budget_stopped'||result.error!=='recycling.dispatch-admission-denied'||
      result.receipts.some(r=>r.kind==='model'&&r.dispatched)||result.captures.length!==1||
      result.admissions.length!==1||result.admissions[0].reason!=='token-budget.preflight-disabled'||
      result.admissions[0].total_token_limit!==96000)throw Error('round4.preflight-row:'+row.instance_id);
    return {instance_id:row.instance_id,result_ref:resultRef,result_sha256:fileSha(resultRef),capture_sha256:result.captures[0].prompt_sha256};
  });
  return {status:'verified',rows,model_calls:0,authority_effect:'none',open_questions_ref:'PROTOCOL-round4.md#open-questions'};
}

function freezeValidation(){
  const log=path('tokenizer-policy-tests-v1.log'),text=readFileSync(log,'utf8');
  if(!text.includes('ℹ tests 118')||!text.includes('ℹ pass 118')||!text.includes('ℹ fail 0'))throw Error('round4.tests');
  return {status:'passed',contextbench_and_transport_tests:118,failed:0,log_ref:log,log_sha256:fileSha(log),
    provider_model_calls:0,tokenizer_policy_ref:'tokenizer-policy-review-v1.json',authority_effect:'none',open_questions_ref:'PROTOCOL-round4.md#open-questions'};
}

function continuityReview(){
  const names=['development-matrix-v4.json','PROTOCOL-round4.md','experiment-round4.json','work-plan-v4.json',
    'initial-envelope-round4.json','preflight-binding-round4.json','freeze-validation-v4.json','round4-continuity.json'];
  return {passed:true,reviewer:'executing parent agent',
    objective:'Reusable useful reasoning state, recovery, correctness and completed outcomes within cumulative model input plus output tokens; finish initial GLM qualification, small windows first.',
    method:'Exact reviewed round-three H1 inconclusive decision and counterevidence open the H7/H8/H0 question through verified D01-D08 records. H7 is selected as a common instrument repair while H1 remains the matched index comparison.',
    scope:'Same eight exposed development tasks, 16 matched cells, one 8K repetition; fixed full acceptance, 10K/12K, other token tiers and reserved confirmation unchanged; SWE-bench excluded.',
    contribution:'Tests whether truthful measured deferral makes the small-window comparison interpretable by enabling model-directed smaller retrieval without false source delivery.',
    measurement:'Native final source metrics, explicit post-delivery observations and cumulative model tokens remain distinct. Patch presence, archive integrity, a fitting notice or one valid pair cannot prove semantic retention, repair correctness, transfer or clearance.',
    counterevidence:'Round three spent 94,260 model tokens across six attempted cells: five context stops, one empty selection, no native scores and ten unstarted cells. Earlier H1 results remain inconclusive.',
    terminal_policy:'Full fresh delivery is attempted first. Only known successful read-only payloads may be deferred after measured failure. Exact notice delivery and subsequent smaller reads require successful request receipts. Mutations/errors remain exact; finalization is tools-disabled and stays inside the original token cap.',
    limitations:['No independent patch-correctness oracle.','The common H7 repair does not identify its own causal benefit in the baseline/index comparison.','This development round cannot clear full ContextBench.','Three empty-gold annotations remain a full-clearance protocol gap.'],
    successor_review_ref:path('round4-continuity.json'),
    resolved_bindings:names.map(name=>({path:path(name),sha256:fileSha(path(name))})),
    criterion_verdicts:{objectives:'preserved',method_and_predecessor:'bound and semantically reviewed',instrument:'118 tests plus seven recovery integrations and five failed-envelope tokenizer replays',initial_admission:'eight provider tokenizer requests verified with model dispatch disabled',exposure:'development only; every prior outcome retained',scope:'acceptance unchanged',run_readiness:'exact source closure and D08 freeze criterion verified by this generator'},
    authority_effect:'none',open_questions_ref:'PROTOCOL-round4.md#open-questions'};
}

function sourceClosure(){
  const prior=read('freeze-round3.json').sources.map(s=>resolve(s.path));
  const additions=[
    'agent-reasoning-engine/LIGHTHOUSE.md','agent-reasoning-engine/research/AGENTS.md','agent-reasoning-engine/research/CONTINUITY.md',
    'agent-reasoning-engine/research/tool-state-audit-v1/OBJECTIVE.md','agent-reasoning-engine/research/tool-state-audit-v1/PLAN.md',
    'implementation/agent-reasoning-engine/GLM-FINISH-PLAN.md','implementation/agent-reasoning-engine/packages/evolution-runtime/ontology/research-learning-v1.json',
    ...['PLAN-round4.md','PROTOCOL-round4.md','bind-round4.mjs','freeze-round4.mjs','development-matrix-v4.json','experiment-round4.json','hypotheses-round4.json','work-plan-v4.json','round4-continuity.json','round4-freeze-continuity.json','initial-envelope-round4.json','preflight-binding-round4.json','freeze-validation-v4.json','output-deferral-component-review-v1.json','output-deferral-integration-review-v1.json','output-deferral-tokenizer-replay-v1.json','tokenizer-policy-review-v1.json','tokenizer-policy-tests-v1.log'].map(name=>'agent-reasoning-engine/research/contextbench-v1/'+name),
    ...['output-deferral.mjs','output-deferral.test.mjs','episode-deferral.test.mjs','tokenizer-allowance.test.mjs'].map(name=>'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/'+name)
  ].map(p=>resolve(repository,p));
  const unique=[...new Set([...prior,...additions])].sort();
  for(const p of unique)if(!existsSync(p))throw Error('round4.missing-source:'+p);
  return unique.map(path=>({path,sha256:fileSha(path)}));
}

export function createFreeze(){
  write('preflight-binding-round4.json',preflightBinding());
  write('freeze-validation-v4.json',freezeValidation());
  write('round4-freeze-continuity.json',continuityReview());
  const freezeMaterial={schema_version:'are.contextbench-freeze/v1',status:'frozen',authority_effect:'none',node_version:process.version,
    matrix_ref:path('development-matrix-v4.json'),preflight_ref:path('initial-envelope-round4.json'),
    task_manifest_ref:resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks/manifest.json'),
    task_directory:resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks'),
    repository_inventory_ref:'/tmp/are-contextbench-repositories-v1/inventory.json',upstream:'/tmp/are-contextbench-upstream-117',
    python:'/tmp/are-contextbench-venv-117/bin/python',scorer:resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py'),
    scoring_cache:'/tmp/are-contextbench-native-score-cache-v1',sources:sourceClosure(),continuity_review:read('round4-freeze-continuity.json'),
    claim_ceiling:'development diagnostic only; not benchmark clearance',predecessor_freeze_ref:path('freeze-round3.json'),
    successor_reason:'Measured full/fresh/read-only deferral enables truthful model-directed repaging after round-three pending-output admission failures.'};
  write('freeze-round4.json',{...freezeMaterial,freeze_sha256:sha(freezeMaterial)});
  verifyFreeze(path('freeze-round4.json'));
  const built=build(),artifactRef='agent-reasoning-engine/research/contextbench-v1/freeze-round4.json',artifactDigest=fileSha(path('freeze-round4.json'));
  const events=[{event_id:'r4-freeze-start',task_id:'contextbench.round4.freeze',action:'start'},
    {event_id:'r4-freeze-complete',task_id:'contextbench.round4.freeze',action:'complete',evidence:[{criterion_id:'exact-frozen-run-envelope',artifact_ref:artifactRef,artifact_digest:artifactDigest}]}];
  const state=replayResearchWork({plan:built.plan,registrations:built.registrations,events,verify_evidence:verifyFreezeEvidence,verify_registration:verifyPredecessor});
  if(!state.tasks.some(t=>t.task_id==='contextbench.round4.run'&&t.state==='ready'))throw Error('round4.run-not-ready');
  write('work-state-frozen-v4.json',state);
  return {sources:freezeMaterial.sources.length,freeze_sha256:sha(freezeMaterial),artifact_sha256:artifactDigest,frontier:state.frontier};
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(stable(createFreeze()));
