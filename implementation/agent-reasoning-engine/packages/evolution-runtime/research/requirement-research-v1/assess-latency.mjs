import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {digest} from '../../../request-intent-runtime/src/canonical.mjs';
import {createResearchHypothesis,verifyEvolutionRecord} from '../../index.mjs';
import {verifyBenchmarkRegistration} from '../../src/benchmark-registration.mjs';
import {verifyLatencyManifest} from '../../src/requirement-latency-control.mjs';
import {materializeResearchDag} from '../../src/research-dag.mjs';
import {materializeResearchPlan,replayResearchWork} from '../../src/research-work.mjs';
import {verifyReplicationManifest} from '../../src/requirement-replication.mjs';
import {verifyAssessment as verifyReplicationAssessment} from './assess-replication.mjs';
import {verifyLatencyRunEvidence,completedLatencyProgress} from './complete-latency.mjs';
import {verifyRunEvidence} from './complete-run.mjs';
import {validateHypotheses} from './prepare-next.mjs';
import {validateArtifact} from './verify-start.mjs';

const read=name=>JSON.parse(readFileSync(new URL(name,import.meta.url),'utf8'));
const registrationName='cef063f80f998047ff245642b428852b7e438a8a756df684725a474bfa076a61.json';
const registration=read('../../research-records/'+registrationName);
const input=read('../../plans/requirement-research-v1.json');
const registrations=input.registration_digests.map(id=>read('../../research-records/'+id+'.json'));
const plan=materializeResearchPlan({research_dag:materializeResearchDag({registrations}),registrations,tasks:input.tasks});
const median=values=>[...values].sort((a,b)=>a-b)[Math.ceil(values.length*.5)-1];

function currentResult(){
  assert.equal(verifyBenchmarkRegistration(registration),true);
  assert.equal(registration.experiment_id,'requirement-latency-002');
  const evidence=read('latency-run-evidence-001.json');
  verifyLatencyRunEvidence(evidence);
  assert.equal(evidence.registration_digest,registration.registration_digest);
  return {evidence,result:registration.evidence.result};
}

export function buildLatencyAssessment(){
  const {evidence,result}=currentResult();
  const full=result.runs.filter(row=>row.variant==='full');
  const compact=result.runs.filter(row=>row.variant==='compact');
  const pairs=new Map();
  for(const row of result.runs){const key=`${row.case_id}:${row.repetition}`,pair=pairs.get(key)??{};pair[row.variant]=row;pairs.set(key,pair);}
  const deltas=[...pairs.values()].map(pair=>({turn_ms:pair.compact.elapsed_ms-pair.full.elapsed_ms,
    first_text_ms:pair.compact.first_text_ms-pair.full.first_text_ms,
    output_tokens:pair.compact.token_usage.total.outputTokens-pair.full.token_usage.total.outputTokens}));
  const mean=(rows,select)=>rows.reduce((sum,row)=>sum+select(row),0)/rows.length;
  const parent=registration.records.find(record=>record.schema_version==='are.research-hypothesis/v1');
  const experiment=registration.records.find(record=>record.schema_version==='are.research-experiment/v1');
  const observation=registration.records.find(record=>record.schema_version==='are.hypothesis-observation/v1');
  const decision=registration.records.find(record=>record.schema_version==='are.learning-decision/v1');
  const hypothesis=createResearchHypothesis({
    hypothesis_key:'requirement-explicit-operation-fast-path-003',
    statement:'An exact deterministic fast path for explicitly stated requirement additions, removals, and maintenance will avoid model latency on eligible requests while preserving the compact model path unchanged for ambiguous language.',
    mechanism:'Parse only a closed, preregistered set of explicit operation forms into add, remove, or maintain plus an exact target. Apply the operation locally to the frozen requirement set. Any unmatched, conflicting, negated, or structurally ambiguous request takes the existing context-bound compact model path without reduced context.',
    falsifier:'Any fast-path-eligible request produces the wrong transition or requirement set, any ambiguous request enters the fast path, eligible p95 exceeds 50 ms on the current host, fallback contract behavior changes, or required runtime and latency telemetry is absent.',
    scope:'new mixed holdout of explicit and ambiguous requirement operations across empty, singleton, and multi-requirement states',
    metrics:['fast-path-precision','fast-path-coverage','exact-requirement-preservation','model-calls-per-request','eligible-turn-p95-ms','fallback-turn-p95-ms'],
    provenance_refs:[`benchmark-registration:${registration.registration_digest}`,observation.record_id,decision.record_id,
      `research-artifact:${digest(evidence)}`,...evidence.failures.map(row=>`result-row:${row.ordinal}:${row.output_digest}`)],
    parent_hypothesis_ref:parent.record_id,supersedes_experiment_ref:experiment.record_id,
    strategy_ref:'counterevidence-to-deterministic-fast-path/v1',
    implementation_pattern:'deterministic-explicit-operation-fast-path-with-context-bound-model-fallback',
    experiment_template:{
      research_question:'Can an exact explicit-operation fast path remove model latency from eligible requirement changes without misrouting ambiguous language or weakening the existing fallback?',
      baseline_ref:`benchmark-registration:${registration.registration_digest}`,
      treatment_ref:'implementation-pattern:deterministic-explicit-operation-fast-path-with-context-bound-model-fallback',
      dataset_refs:['holdout:new-explicit-operation-forms','holdout:new-ambiguous-operation-forms','stratum:add','stratum:remove','stratum:maintain','stratum:ambiguous','state:empty','state:singleton','state:multiple'],
      required_repetitions:5,
      success_criteria:{fast_path_precision:1,ambiguous_fast_path_rate:0,minimum_fast_path_coverage:.5,
        exact_requirement_preservation:1,maximum_model_calls_per_request:.5,maximum_eligible_turn_p95_ms:50,
        fallback_contract_unchanged:true,runtime_integrity:true},
      stop_conditions:['selected implementation or dataset bytes drift','any ambiguous request enters the fast path','any eligible request changes the wrong requirement set','fallback context or compact contract changes','runtime identity or telemetry is missing']
    }
  });
  assert.equal(verifyEvolutionRecord(hypothesis).ok,true);
  return {
    schema_version:'are.research-task-artifact/v1',plan_digest:plan.plan_digest,task_id:'latency.assess',criterion_id:'registered-learning-result',
    source_registration_ref:`../../research-records/${registrationName}`,source_registration_digest:registration.registration_digest,
    registered_learning:{observation_ref:observation.record_id,decision_ref:decision.record_id,disposition:decision.disposition,
      question_ref:registration.question.record_id,question:registration.next_research_question},
    measured_decomposition:{
      full:{mean_input_tokens:result.summary.full.mean_input_tokens,mean_output_tokens:result.summary.full.mean_output_tokens,
        mean_reasoning_output_tokens:mean(full,row=>row.token_usage.total.reasoningOutputTokens),mean_post_first_text_ms:mean(full,row=>row.elapsed_ms-row.first_text_ms),zero_cache_rows:full.filter(row=>row.token_usage.total.cachedInputTokens===0).length},
      compact:{mean_input_tokens:result.summary.compact.mean_input_tokens,mean_output_tokens:result.summary.compact.mean_output_tokens,
        mean_reasoning_output_tokens:mean(compact,row=>row.token_usage.total.reasoningOutputTokens),mean_post_first_text_ms:mean(compact,row=>row.elapsed_ms-row.first_text_ms),zero_cache_rows:compact.filter(row=>row.token_usage.total.cachedInputTokens===0).length},
      paired:{pairs:deltas.length,compact_turn_wins:deltas.filter(row=>row.turn_ms<0).length,median_turn_delta_ms:median(deltas.map(row=>row.turn_ms)),
        mean_turn_delta_ms:mean(deltas,row=>row.turn_ms),compact_first_text_wins:deltas.filter(row=>row.first_text_ms<0).length,
        median_first_text_delta_ms:median(deltas.map(row=>row.first_text_ms)),mean_first_text_delta_ms:mean(deltas,row=>row.first_text_ms),
        median_output_delta_tokens:median(deltas.map(row=>row.output_tokens))}},
    scoped_lesson:'Output compression removed 38.1 percent of output tokens but only 0.13 percent of mean total token traffic and delivered a 6.2 percent p95 turn reduction. The remaining boundary is dominated by model invocation and time to first text, so another output-only compression is a weak next target.',
    causal_alternatives:['Provider-load variation contributed to paired timing differences.','Two compact cache misses reduced cache symmetry despite the aggregate balance pass.','Shorter reasoning and response generation contributed to the compact advantage.','The experiment does not decompose the provider system prefix or prove that input tokens cause latency.'],
    rejected_next_moves:['Adopt compact output as a demonstrated 15 percent latency improvement.','Remove required Context Envelope material without a separate relevance and safety experiment.','Treat cache balance as proof of causal isolation.','Continue output-schema micro-optimization without a new impact hypothesis.'],
    revised_hypothesis:hypothesis,
    next_experiment_constraints:{holdout_authored_before_implementation:true,required_request_classes:['explicit-add','explicit-remove','explicit-maintain','ambiguous','conflicting','negated'],
      initial_set_shapes:['empty','singleton','multiple'],freeze_before_calls:['cases','labels','eligibility grammar','scorer','fallback contract','schedule','implementation bindings'],
      required_observations:['eligibility decision','operation and target','resulting set','fallback invocation count','reason codes','first-text and turn latency','token and cache usage']},
    claim_ceiling:'This assessment identifies the best next test from the measured boundary. It does not prove that deterministic routing will generalize or that provider latency has one cause.',
    authority_effect:'none'
  };
}

export function verifyLatencyAssessment(artifact){
  assert.deepEqual(artifact,buildLatencyAssessment());
  assert.equal(artifact.registered_learning.disposition,'revise-hypothesis');
  assert.equal(artifact.measured_decomposition.paired.pairs,40);
  assert.equal(artifact.measured_decomposition.paired.compact_turn_wins,25);
  assert.equal(artifact.measured_decomposition.compact.zero_cache_rows,2);
  assert.equal(verifyEvolutionRecord(artifact.revised_hypothesis).ok,true);
  return true;
}

function verifyEvidence(binding){
  const artifact=read(binding.artifact_ref);
  if(artifact.task_id==='latency.hypothesize')validateHypotheses(artifact);
  else if(artifact.task_id==='replication.register')assert.equal(verifyReplicationManifest(read(artifact.manifest_ref)),true);
  else if(artifact.task_id==='replication.run')verifyRunEvidence(artifact);
  else if(artifact.task_id==='replication.assess')verifyReplicationAssessment(artifact);
  else if(artifact.task_id==='latency.register'){
    const manifest=read(artifact.manifest_ref);assert.equal(verifyLatencyManifest(manifest),true);assert.equal(artifact.manifest_digest,manifest.manifest_digest);
  } else if(artifact.task_id==='latency.run')verifyLatencyRunEvidence(artifact);
  else if(artifact.task_id==='latency.assess')verifyLatencyAssessment(artifact);
  else validateArtifact(artifact);
  assert.equal(binding.plan_digest,artifact.plan_digest);assert.equal(binding.task_id,artifact.task_id);
  assert.equal(binding.criterion_id,artifact.criterion_id);assert.equal(binding.artifact_digest,digest(artifact));
  assert.equal(binding.validator_ref,'are.research-artifact-validator/v1');return {ok:true,binding};
}

export function assessedLatencyProgress(){
  const prior=completedLatencyProgress();assert.deepEqual(prior,read('progress-007.json'));
  const artifact=read('latency-assessment-001.json');verifyLatencyAssessment(artifact);
  const events=[...prior.events,{event_id:'latency.assess.start.001',task_id:'latency.assess',action:'start'},
    {event_id:'latency.assess.complete.001',task_id:'latency.assess',action:'complete',evidence:[{criterion_id:artifact.criterion_id,
      artifact_ref:'latency-assessment-001.json',artifact_digest:digest(artifact)}]}];
  return replayResearchWork({plan,registrations,events,verify_evidence:verifyEvidence});
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.includes('--check-saved')){const state=assessedLatencyProgress();console.log(JSON.stringify({ok:true,state_digest:state.state_digest,frontier:state.frontier,hypothesis_ref:buildLatencyAssessment().revised_hypothesis.record_id}));}
  else console.log(JSON.stringify({assessment:buildLatencyAssessment()},null,2));
}
