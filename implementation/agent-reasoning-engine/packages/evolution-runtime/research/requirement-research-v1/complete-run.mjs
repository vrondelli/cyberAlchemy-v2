import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {digest} from '../../../request-intent-runtime/src/canonical.mjs';
import {verifyBenchmarkRegistration} from '../../src/benchmark-registration.mjs';
import {verifyReplicationManifest} from '../../src/requirement-replication.mjs';
import {materializeResearchDag} from '../../src/research-dag.mjs';
import {materializeResearchPlan,replayResearchWork} from '../../src/research-work.mjs';
import {validateHypotheses} from './prepare-next.mjs';
import {validateArtifact} from './verify-start.mjs';
const directory=dirname(fileURLToPath(import.meta.url));
const read=name=>JSON.parse(readFileSync(new URL(name,import.meta.url),'utf8'));
const registrationName='fbc7c1a6b01810478c5800fa07dba4f1cd3bd3e9a6fa2bb68bda5072198c30f9.json';
const registrationPath=resolve(directory,'../../research-records',registrationName);
const input=read('../../plans/requirement-research-v1.json');
const registrations=input.registration_digests.map(id=>read('../../research-records/'+id+'.json'));
const plan=materializeResearchPlan({research_dag:materializeResearchDag({registrations}),registrations,tasks:input.tasks});
const percentile=(values,q)=>[...values].sort((a,b)=>a-b)[Math.ceil(values.length*q)-1];

function verifiedRegistration() {
  const record=JSON.parse(readFileSync(registrationPath,'utf8'));
  assert.equal(record.registration_digest,registrationName.slice(0,-5));assert.equal(verifyBenchmarkRegistration(record),true);
  assert.equal(record.experiment_id,'requirement-replication-001');assert.equal(record.evidence.result.status,'completed');
  assert.equal(record.evidence.result.runs.length,144);assert.equal(record.records.at(-1).disposition,'revise-hypothesis');
  const manifest=read('replication-execution-002.json');assert.equal(verifyReplicationManifest(manifest),true);
  assert.equal(record.evidence.result.manifest_digest,digest(manifest));
  return record;
}

export function buildRunEvidence() {
  const record=verifiedRegistration(),result=record.evidence.result,pairs=new Map();
  for(const row of result.runs){const key=`${row.case_id}:${row.repetition}`,pair=pairs.get(key)??{};pair[row.variant]=row;pairs.set(key,pair);}
  const discordances={both_correct:0,baseline_only:0,treatment_only:0,neither:0};
  for(const pair of pairs.values()){const b=pair.baseline.label_matched,t=pair.treatment.label_matched;
    discordances[b&&t?'both_correct':b?'baseline_only':t?'treatment_only':'neither']++;}
  const timing=Object.fromEntries(['baseline','treatment'].map(variant=>{const rows=result.runs.filter(row=>row.variant===variant);
    return [variant,{first_text_p50_ms:percentile(rows.map(r=>r.first_text_ms),.5),first_text_p95_ms:percentile(rows.map(r=>r.first_text_ms),.95),
      turn_p50_ms:percentile(rows.map(r=>r.elapsed_ms),.5),turn_p95_ms:percentile(rows.map(r=>r.elapsed_ms),.95),
      startup_p50_ms:percentile(rows.map(r=>r.startup_ms),.5),startup_p95_ms:percentile(rows.map(r=>r.startup_ms),.95),
      mean_input_tokens:rows.reduce((n,r)=>n+r.token_usage.total.inputTokens,0)/rows.length,
      mean_cached_input_tokens:rows.reduce((n,r)=>n+r.token_usage.total.cachedInputTokens,0)/rows.length,
      mean_output_tokens:rows.reduce((n,r)=>n+r.token_usage.total.outputTokens,0)/rows.length}];}));
  return {schema_version:'are.research-task-artifact/v1',plan_digest:plan.plan_digest,task_id:'replication.run',criterion_id:'completed-benchmark-result',
    registration_ref:`../../research-records/${registrationName}`,registration_digest:record.registration_digest,
    result_digest:record.result_digest,embedded_result_digest:result.result_digest,manifest_digest:read('replication-execution-002.json').manifest_digest,
    gates:result.gates,summary:result.summary,discordances,timing,
    treatment_failures:result.runs.filter(r=>r.variant==='treatment'&&!r.passed).map(r=>({ordinal:r.ordinal,case_id:r.case_id,repetition:r.repetition,reason_codes:r.reason_codes,output_digest:r.output_digest})),
    findings:[
      'Treatment classification rose from 53/72 to 68/72; the paired classification comparison has 18 treatment-only wins, 3 baseline-only wins, 50 both correct and 1 neither correct.',
      'Treatment preservation was 68/72, so the required all-treatment preservation gate failed.',
      'All 144 rows satisfied runtime integrity; this does not repair the four semantic failures.',
      'Treatment turn p95 was slower than baseline and used longer outputs; cache means were unequal, so this run is not a clean isolated latency estimate.'
    ],
    disposition:'revise-hypothesis',next_research_question:record.next_research_question,
    limitations:result.limitations,authority_effect:'none'};
}

export function verifyRunEvidence(artifact) {
  assert.deepEqual(artifact,buildRunEvidence());
  assert.equal(artifact.gates.classification_improved,true);assert.equal(artifact.gates.requirement_preservation,false);
  assert.equal(artifact.gates.runtime_integrity,true);assert.equal(artifact.treatment_failures.length,4);return true;
}

function verifyEvidence(binding) {
  const artifact=read(binding.artifact_ref);
  if(artifact.task_id==='latency.hypothesize')validateHypotheses(artifact);
  else if(artifact.task_id==='replication.register') {
    const manifest=read(artifact.manifest_ref);assert.equal(verifyReplicationManifest(manifest),true);assert.equal(artifact.manifest_digest,manifest.manifest_digest);
  } else if(artifact.task_id==='replication.run')verifyRunEvidence(artifact);else validateArtifact(artifact);
  assert.equal(binding.plan_digest,artifact.plan_digest);assert.equal(binding.task_id,artifact.task_id);
  assert.equal(binding.criterion_id,artifact.criterion_id);assert.equal(binding.artifact_digest,digest(artifact));
  assert.equal(binding.validator_ref,'are.research-artifact-validator/v1');return {ok:true,binding};
}

export function completedRunProgress() {
  const savedPrior=read('progress-003.json');
  const prior=replayResearchWork({plan,registrations,events:savedPrior.events,verify_evidence:verifyEvidence});assert.deepEqual(prior,savedPrior);
  const artifact=read('replication-run-evidence-001.json');verifyRunEvidence(artifact);
  const events=[...prior.events,{event_id:'replication.run.start.001',task_id:'replication.run',action:'start'},
    {event_id:'replication.run.complete.001',task_id:'replication.run',action:'complete',evidence:[{criterion_id:artifact.criterion_id,
      artifact_ref:'replication-run-evidence-001.json',artifact_digest:digest(artifact)}]}];
  return replayResearchWork({plan,registrations,events,verify_evidence:verifyEvidence});
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  if(process.argv.includes('--check-saved')) {const progress=completedRunProgress();console.log(JSON.stringify({ok:true,evidence:buildRunEvidence(),frontier:progress.frontier,state_digest:progress.state_digest}));}
  else console.log(JSON.stringify({evidence:buildRunEvidence()},null,2));
}
