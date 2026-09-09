import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {digest} from '../../../request-intent-runtime/src/canonical.mjs';
import {createResearchHypothesis,verifyEvolutionRecord} from '../../index.mjs';
import {verifyBenchmarkRegistration} from '../../src/benchmark-registration.mjs';
import {materializeResearchDag} from '../../src/research-dag.mjs';
import {materializeResearchPlan,replayResearchWork} from '../../src/research-work.mjs';
import {completedRunProgress,verifyRunEvidence} from './complete-run.mjs';
import {validateHypotheses} from './prepare-next.mjs';
import {verifyReplicationManifest} from '../../src/requirement-replication.mjs';
import {validateArtifact} from './verify-start.mjs';
const directory=dirname(fileURLToPath(import.meta.url));
const read=name=>JSON.parse(readFileSync(new URL(name,import.meta.url),'utf8'));
const registrationName='fbc7c1a6b01810478c5800fa07dba4f1cd3bd3e9a6fa2bb68bda5072198c30f9.json';
const registration=read('../../research-records/'+registrationName);
const input=read('../../plans/requirement-research-v1.json');
const registrations=input.registration_digests.map(id=>read('../../research-records/'+id+'.json'));
const plan=materializeResearchPlan({research_dag:materializeResearchDag({registrations}),registrations,tasks:input.tasks});

function currentResult() {
  assert.equal(verifyBenchmarkRegistration(registration),true);
  assert.equal(registration.experiment_id,'requirement-replication-001');
  const evidence=read('replication-run-evidence-001.json');verifyRunEvidence(evidence);
  assert.equal(evidence.registration_digest,registration.registration_digest);
  return registration.evidence.result;
}

export function buildAssessment() {
  const result=currentResult(),failures=result.runs.filter(row=>row.variant==='treatment'&&!row.passed);
  const removalRetained=failures.filter(row=>row.case_id.endsWith('remove.present'));
  const negativeReified=failures.filter(row=>row.case_id.endsWith('remove.absent'));
  const affectedCases=new Set(failures.map(row=>row.case_id));
  const repeatCounts=Object.fromEntries([...affectedCases].sort().map(id=>[id,failures.filter(row=>row.case_id===id).length]));
  const first=result.runs.find(row=>row.ordinal===2),second=result.runs.find(row=>row.ordinal===3);
  const parent=registration.records.find(record=>record.schema_version==='are.research-hypothesis/v1');
  const experiment=registration.records.find(record=>record.schema_version==='are.research-experiment/v1');
  const observation=registration.records.find(record=>record.schema_version==='are.hypothesis-observation/v1');
  const decision=registration.records.find(record=>record.schema_version==='are.learning-decision/v1');
  const hypothesis=createResearchHypothesis({
    hypothesis_key:'requirement-polarity-accounting-002',
    statement:'A polarity-first requirement operation record followed by deterministic set application will improve removal reliability and prevent negative instructions from becoming requirements without regressing addition accuracy.',
    mechanism:'Resolve a request into target plus add, remove, maintain, or ambiguous before changing the requirement set. Apply explicit operations against the frozen set locally; defer ambiguous polarity and reject a negated instruction as an added requirement.',
    falsifier:'Any registered treatment row reifies a negative instruction, retains a correctly identified present removal, regresses addition classification or set preservation, or omits required runtime and latency telemetry.',
    scope:'new requirement-change holdout with removal paraphrases, polarity contrasts, empty/singleton/multi-requirement initial sets',
    metrics:['classification-accuracy','exact-requirement-preservation','remove-absent-accuracy','remove-present-accuracy','turn-p95-ms'],
    provenance_refs:[`benchmark-registration:${registration.registration_digest}`,observation.record_id,decision.record_id,
      ...failures.map(row=>`result-row:${row.ordinal}:${row.output_digest}`)],
    parent_hypothesis_ref:parent.record_id,supersedes_experiment_ref:experiment.record_id,
    strategy_ref:'counterevidence-to-polarity-hypothesis/v1',implementation_pattern:'polarity-first-operation-then-deterministic-set-application',
    experiment_template:{
      research_question:'Does polarity-first operation extraction repair removal and negative-constraint failures without losing the measured classification gain?',
      baseline_ref:`benchmark-registration:${registration.registration_digest}`,
      treatment_ref:'implementation-pattern:polarity-first-operation-then-deterministic-set-application',
      dataset_refs:['holdout:new-removal-paraphrases','holdout:multi-requirement-sets','stratum:add-absent','stratum:add-present','stratum:remove-absent','stratum:remove-present'],
      required_repetitions:3,
      success_criteria:{all_treatment_sets_preserved:true,remove_absent_accuracy:1,remove_present_accuracy:1,
        treatment_classification_strictly_above_registered_baseline:true,no_addition_accuracy_regression:true,runtime_integrity:true,latency_reported_separately:true},
      stop_conditions:['selected implementation or dataset bytes drift','runtime identity mismatch','negative instruction enters added requirements','previously passing addition stratum regresses']}
  });
  assert.equal(verifyEvolutionRecord(hypothesis).ok,true);
  return {schema_version:'are.research-task-artifact/v1',plan_digest:plan.plan_digest,task_id:'replication.assess',criterion_id:'registered-learning-result',
    source_registration_ref:`../../research-records/${registrationName}`,source_registration_digest:registration.registration_digest,
    registered_learning:{observation_ref:observation.record_id,decision_ref:decision.record_id,disposition:decision.disposition,
      question_ref:registration.question.record_id,question:registration.next_research_question},
    failure_clusters:[
      {cluster_id:'removal-retained',count:removalRetained.length,case_ids:removalRetained.map(row=>row.case_id).sort(),
        interpretation:'A present requirement was retained even though the request expressed removal.'},
      {cluster_id:'negative-instruction-reified',count:negativeReified.length,case_ids:negativeReified.map(row=>row.case_id).sort(),
        interpretation:'An absent target under negation was added as a negative sentence instead of producing no set change.'}],
    recurrence:{affected_unique_cases:affectedCases.size,total_candidate_cases:24,failures_per_affected_case:repeatCounts,
      interpretation:'Each affected case failed one of three repetitions; the evidence shows directional instability, not deterministic failure for every removal.'},
    adjacency_anomaly:{ordinals:[2,3],same_output_digest:first.output_digest===second.output_digest,distinct_prompt_digests:first.prompt_digest!==second.prompt_digest,
      interpretation:'Adjacent add-present and remove-present turns returned identical bytes. This is consistent with overlooked request polarity; it is insufficient to prove cache or cross-thread leakage.'},
    scoped_lesson:'Explicit requirement accounting improves classification but cannot repair a wrong operation. Operation polarity must be represented and checked before deterministic requirement-set application.',
    causal_alternatives:['Removal and negation language was underweighted.','The treatment instruction and schema were more complex than the baseline.','Stochastic variation or order/cache conditions contributed.','Cross-thread leakage is not established by these observations.'],
    revised_hypothesis:hypothesis,
    next_experiment_constraints:{new_domains:8,required_strata:['add-absent','add-present','remove-absent','remove-present'],
      initial_set_shapes:['empty','singleton','multiple'],freeze_before_calls:['cases','labels','operation markers','prompts','scorer','schedule','implementation bindings'],
      required_observations:['operation prediction','target prediction','resulting set','reason codes','token usage','cache usage','first-text and turn latency']},
    claim_ceiling:'This assessment explains observed patterns and proposes a falsifiable successor. It does not prove causality, leakage, generalization, or a product improvement.',
    authority_effect:'none'};
}

export function verifyAssessment(artifact) {
  assert.deepEqual(artifact,buildAssessment());
  assert.equal(artifact.registered_learning.disposition,'revise-hypothesis');
  assert.deepEqual(artifact.failure_clusters.map(cluster=>cluster.count),[3,1]);
  assert.equal(verifyEvolutionRecord(artifact.revised_hypothesis).ok,true);return true;
}

function verifyEvidence(binding) {
  const artifact=read(binding.artifact_ref);
  if(artifact.task_id==='latency.hypothesize')validateHypotheses(artifact);
  else if(artifact.task_id==='replication.register'){const manifest=read(artifact.manifest_ref);assert.equal(verifyReplicationManifest(manifest),true);}
  else if(artifact.task_id==='replication.run')verifyRunEvidence(artifact);
  else if(artifact.task_id==='replication.assess')verifyAssessment(artifact);else validateArtifact(artifact);
  assert.equal(binding.plan_digest,artifact.plan_digest);assert.equal(binding.task_id,artifact.task_id);
  assert.equal(binding.criterion_id,artifact.criterion_id);assert.equal(binding.artifact_digest,digest(artifact));
  assert.equal(binding.validator_ref,'are.research-artifact-validator/v1');return {ok:true,binding};
}

export function assessedProgress() {
  const prior=completedRunProgress();assert.deepEqual(prior,read('progress-004.json'));
  const artifact=read('replication-assessment-001.json');verifyAssessment(artifact);
  const events=[...prior.events,{event_id:'replication.assess.start.001',task_id:'replication.assess',action:'start'},
    {event_id:'replication.assess.complete.001',task_id:'replication.assess',action:'complete',evidence:[{criterion_id:artifact.criterion_id,
      artifact_ref:'replication-assessment-001.json',artifact_digest:digest(artifact)}]}];
  return replayResearchWork({plan,registrations,events,verify_evidence:verifyEvidence});
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  if(process.argv.includes('--check-saved')){const state=assessedProgress();console.log(JSON.stringify({ok:true,state_digest:state.state_digest,frontier:state.frontier,hypothesis_ref:buildAssessment().revised_hypothesis.record_id}));}
  else console.log(JSON.stringify({assessment:buildAssessment()},null,2));
}
