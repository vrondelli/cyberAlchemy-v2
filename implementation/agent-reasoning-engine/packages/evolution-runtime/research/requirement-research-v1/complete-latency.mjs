import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {digest} from '../../../request-intent-runtime/src/canonical.mjs';
import {verifyBenchmarkRegistration} from '../../src/benchmark-registration.mjs';
import {verifyLatencyManifest} from '../../src/requirement-latency-control.mjs';
import {materializeResearchDag} from '../../src/research-dag.mjs';
import {materializeResearchPlan,replayResearchWork} from '../../src/research-work.mjs';
import {verifyReplicationManifest} from '../../src/requirement-replication.mjs';
import {verifyAssessment} from './assess-replication.mjs';
import {verifyRunEvidence} from './complete-run.mjs';
import {latencyRegisteredProgress} from './prepare-latency.mjs';
import {validateHypotheses} from './prepare-next.mjs';
import {validateArtifact} from './verify-start.mjs';

const read=name=>JSON.parse(readFileSync(new URL(name,import.meta.url),'utf8'));
const registrationName='cef063f80f998047ff245642b428852b7e438a8a756df684725a474bfa076a61.json';
const registration=read('../../research-records/'+registrationName);
const input=read('../../plans/requirement-research-v1.json');
const registrations=input.registration_digests.map(id=>read('../../research-records/'+id+'.json'));
const plan=materializeResearchPlan({research_dag:materializeResearchDag({registrations}),registrations,tasks:input.tasks});

function verifiedRegistration(){
  assert.equal(registration.registration_digest,registrationName.slice(0,-5));
  assert.equal(verifyBenchmarkRegistration(registration),true);
  assert.equal(registration.experiment_id,'requirement-latency-002');
  const manifest=read('latency-execution-001.json');
  assert.equal(verifyLatencyManifest(manifest),true);
  assert.deepEqual(registration.evidence.manifest,manifest);
  assert.equal(registration.manifest_digest,digest(manifest));
  const result=registration.evidence.result;
  assert.equal(result.status,'completed');
  assert.equal(result.runs.length,80);
  assert.equal(result.manifest_digest,digest(manifest));
  return {manifest,result};
}

export function buildLatencyRunEvidence(){
  const {manifest,result}=verifiedRegistration();
  const full=result.summary.full,compact=result.summary.compact;
  const turnP95Ratio=compact.turn_p95_ms/full.turn_p95_ms;
  const cacheDifference=Math.abs(full.mean_cached_input_tokens-compact.mean_cached_input_tokens)/Math.max(full.mean_cached_input_tokens,compact.mean_cached_input_tokens,1);
  return {
    schema_version:'are.research-task-artifact/v1',plan_digest:plan.plan_digest,task_id:'latency.run',criterion_id:'completed-benchmark-result',
    registration_ref:`../../research-records/${registrationName}`,registration_digest:registration.registration_digest,
    result_digest:registration.result_digest,embedded_result_digest:result.result_digest,
    manifest_digest:manifest.manifest_digest,embedded_manifest_digest:registration.manifest_digest,
    gates:result.gates,summary:result.summary,
    comparisons:{turn_p95_ratio:turnP95Ratio,turn_p95_reduction:1-turnP95Ratio,
      first_text_p95_ratio:compact.first_text_p95_ms/full.first_text_p95_ms,
      cache_mean_relative_difference:cacheDifference,
      output_token_reduction:1-compact.mean_output_tokens/full.mean_output_tokens},
    failures:result.runs.filter(row=>!row.passed).map(row=>({ordinal:row.ordinal,case_id:row.case_id,repetition:row.repetition,
      variant:row.variant,reason_codes:row.reason_codes,output_digest:row.output_digest})),
    findings:[
      'Compact passed 40/40 rows while full passed 38/40; the all-arms quality gate therefore failed.',
      'Compact turn p95 was 5021 ms versus 5353 ms for full, a 6.2 percent reduction that did not meet the registered 15 percent threshold.',
      'Compact mean output tokens were 38.1 percent lower; this output reduction did not translate into the required p95 latency reduction.',
      'Cache means differed by 7.0 percent, within the registered 10 percent balance threshold, and all 80 rows satisfied runtime integrity.'
    ],
    disposition:'revise-hypothesis',next_research_question:registration.next_research_question,
    limitations:result.limitations,
    claim_ceiling:'This repeated synthetic run measures the combined output-representation and host-expansion treatment under uncontrolled provider load. It does not establish a general latency effect.',
    authority_effect:'none'
  };
}

export function verifyLatencyRunEvidence(artifact){
  assert.deepEqual(artifact,buildLatencyRunEvidence());
  assert.deepEqual(artifact.gates,{cache_balance:true,quality:false,relative_latency:false,runtime_integrity:true});
  assert.equal(artifact.summary.compact.passed,40);
  assert.equal(artifact.summary.full.passed,38);
  assert.equal(artifact.failures.length,2);
  assert.ok(artifact.comparisons.turn_p95_ratio>0.85);
  return true;
}

function verifyEvidence(binding){
  const artifact=read(binding.artifact_ref);
  if(artifact.task_id==='latency.hypothesize')validateHypotheses(artifact);
  else if(artifact.task_id==='replication.register')assert.equal(verifyReplicationManifest(read(artifact.manifest_ref)),true);
  else if(artifact.task_id==='replication.run')verifyRunEvidence(artifact);
  else if(artifact.task_id==='replication.assess')verifyAssessment(artifact);
  else if(artifact.task_id==='latency.register'){
    const manifest=read(artifact.manifest_ref);assert.equal(verifyLatencyManifest(manifest),true);assert.equal(artifact.manifest_digest,manifest.manifest_digest);
  } else if(artifact.task_id==='latency.run')verifyLatencyRunEvidence(artifact);
  else validateArtifact(artifact);
  assert.equal(binding.plan_digest,artifact.plan_digest);
  assert.equal(binding.task_id,artifact.task_id);
  assert.equal(binding.criterion_id,artifact.criterion_id);
  assert.equal(binding.artifact_digest,digest(artifact));
  assert.equal(binding.validator_ref,'are.research-artifact-validator/v1');
  return {ok:true,binding};
}

export function completedLatencyProgress(){
  const prior=latencyRegisteredProgress();
  assert.deepEqual(prior,read('progress-006.json'));
  const artifact=read('latency-run-evidence-001.json');
  verifyLatencyRunEvidence(artifact);
  const events=[...prior.events,
    {event_id:'latency.run.start.001',task_id:'latency.run',action:'start'},
    {event_id:'latency.run.complete.001',task_id:'latency.run',action:'complete',evidence:[{criterion_id:artifact.criterion_id,
      artifact_ref:'latency-run-evidence-001.json',artifact_digest:digest(artifact)}]}];
  return replayResearchWork({plan,registrations,events,verify_evidence:verifyEvidence});
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.includes('--check-saved')){
    const progress=completedLatencyProgress();
    console.log(JSON.stringify({ok:true,evidence:buildLatencyRunEvidence(),frontier:progress.frontier,state_digest:progress.state_digest}));
  } else console.log(JSON.stringify({evidence:buildLatencyRunEvidence()},null,2));
}
