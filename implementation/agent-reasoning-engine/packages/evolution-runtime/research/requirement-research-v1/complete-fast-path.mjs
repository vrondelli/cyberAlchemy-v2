import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {digest} from '../../../request-intent-runtime/src/canonical.mjs';
import {assessResearchHypothesis,createHypothesisObservation,createResearchExperiment,verifyEvolutionRecord} from '../../index.mjs';
import {replayResearchWork} from '../../src/research-work.mjs';
import {buildFastPathManifest,plan,registrations,verifyFastPathResult} from './run-fast-path-experiment.mjs';

const root=resolve(fileURLToPath(new URL('../../../../../../../',import.meta.url)));
const read=name=>JSON.parse(readFileSync(new URL(name,import.meta.url),'utf8'));
const sha=path=>createHash('sha256').update(readFileSync(join(root,path))).digest('hex');
const manifest=read('fast-path-manifest-003.json');
const result=read('fast-path-result-003.json');
const hypothesis=read('latency-assessment-001.json').revised_hypothesis;

function verifyCurrentManifest(){
  assert.equal(verifyFastPathResult(result,manifest),true);
}

export function buildFastPathArtifacts(){
  verifyCurrentManifest();
  const freeze={schema_version:'are.research-task-artifact/v1',plan_digest:plan.plan_digest,task_id:'fast-path.freeze',criterion_id:'exact-fast-path-manifest',
    manifest_ref:'fast-path-manifest-003.json',manifest_digest:manifest.manifest_digest,dataset_ref:manifest.dataset_ref,dataset_digest:manifest.dataset_digest,
    schedule_rows:manifest.schedule.length,repetitions:5,eligible_cases:12,fallback_cases:12,authority_effect:'none'};
  const implementationBindings=Object.entries(manifest.source_digests).filter(([path])=>path.includes('request-intent-runtime')).map(([path,sha256])=>({path,sha256}));
  const build={schema_version:'are.research-task-artifact/v1',plan_digest:plan.plan_digest,task_id:'fast-path.build',criterion_id:'source-bound-fast-path-candidate',
    manifest_ref:'fast-path-manifest-003.json',manifest_digest:manifest.manifest_digest,implementation_bindings:implementationBindings,
    operations:['add','maintain','remove'],fallback_posture:'required-for-unmatched-conditional-compound-negated-or-noncanonical-input',
    candidate_digest:digest({implementation_bindings:implementationBindings,hypothesis_ref:manifest.hypothesis_ref}),authority_effect:'none'};
  const benchmark={schema_version:'are.research-task-artifact/v1',plan_digest:plan.plan_digest,task_id:'fast-path.benchmark',criterion_id:'completed-fast-path-result',
    manifest_ref:'fast-path-manifest-003.json',manifest_digest:manifest.manifest_digest,result_ref:'fast-path-result-003.json',result_digest:result.result_digest,
    gates:result.gates,summary:result.summary,timing:result.timing,disposition:result.disposition,limitations:result.limitations,authority_effect:'none'};
  const observation=createHypothesisObservation({hypothesis_ref:hypothesis.record_id,source_result_ref:`fast-path-result:${result.result_digest}`,
    source_result_digest:result.result_digest,observation_kind:'supporting',phase:'experiment',
    claim:`Local controlled checks passed: ${JSON.stringify(result.gates)}.`,evaluator_id:'are.fast-path-experiment-validator/v1',
    evidence_refs:[`manifest:${manifest.manifest_digest}`,`result:${result.result_digest}`],limitations:result.limitations});
  const experiment=createResearchExperiment({...hypothesis.experiment_template,hypothesis_ref:hypothesis.record_id,metrics:hypothesis.metrics,observation_refs:[observation.record_id]});
  const assessed=assessResearchHypothesis(hypothesis,[observation],experiment);
  assert.equal(assessed.ok,true);
  const assessment={schema_version:'are.research-task-artifact/v1',plan_digest:plan.plan_digest,task_id:'fast-path.assess',criterion_id:'fast-path-learning-result',
    manifest_ref:'fast-path-manifest-003.json',result_ref:'fast-path-result-003.json',hypothesis_ref:hypothesis.record_id,
    observation,experiment,decision:assessed.decision,
    scoped_lesson:'The strict local fast path removed model calls from half of the balanced holdout while routing every ambiguous case to the unchanged fallback contract. This supports the mechanism locally but does not establish independent language coverage or live end-to-end savings.',
    next_step:'Collect an independently authored adversarial holdout, then run a controlled Codex fallback canary before considering wrapper integration.',
    claim_ceiling:'Source-bound local candidate evidence. No production adoption, activation, generalization, or model-latency claim.',authority_effect:'none'};
  return {freeze,build,benchmark,assessment};
}

export function verifyFastPathArtifact(artifact){
  const artifacts=buildFastPathArtifacts();
  const expected=Object.values(artifacts).find(value=>value.task_id===artifact.task_id);
  assert.ok(expected);assert.deepEqual(artifact,expected);
  if(artifact.task_id==='fast-path.assess'){
    assert.equal(verifyEvolutionRecord(artifact.observation).ok,true);assert.equal(verifyEvolutionRecord(artifact.experiment).ok,true);
    assert.equal(verifyEvolutionRecord(artifact.decision).ok,true);assert.equal(artifact.decision.disposition,'collect-replications');
  }
  return true;
}

const files={
  'fast-path.freeze':'fast-path-freeze-evidence-002.json',
  'fast-path.build':'fast-path-build-evidence-002.json',
  'fast-path.benchmark':'fast-path-benchmark-evidence-002.json',
  'fast-path.assess':'fast-path-learning-evidence-002.json'};
function verifyEvidence(binding){
  assert.equal(files[binding.task_id],binding.artifact_ref);
  const artifact=read(binding.artifact_ref);verifyFastPathArtifact(artifact);
  assert.equal(binding.plan_digest,artifact.plan_digest);assert.equal(binding.criterion_id,artifact.criterion_id);
  assert.equal(binding.validator_ref,'are.fast-path-experiment-validator/v1');assert.equal(binding.artifact_digest,digest(artifact));
  return {ok:true,binding};
}

export function completedFastPathProgress(){
  const artifacts=buildFastPathArtifacts(),order=['fast-path.freeze','fast-path.build','fast-path.benchmark','fast-path.assess'];
  const artifactKeys={'fast-path.freeze':'freeze','fast-path.build':'build','fast-path.benchmark':'benchmark','fast-path.assess':'assessment'};
  const events=order.flatMap(taskId=>{const artifact=artifacts[artifactKeys[taskId]];return [
    {event_id:`${taskId}.start.001`,task_id:taskId,action:'start'},
    {event_id:`${taskId}.complete.001`,task_id:taskId,action:'complete',evidence:[{criterion_id:artifact.criterion_id,artifact_ref:files[taskId],artifact_digest:digest(artifact)}]}];});
  return replayResearchWork({plan,registrations,events,verify_evidence:verifyEvidence});
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const artifacts=buildFastPathArtifacts();
  if(process.argv.includes('--artifacts'))console.log(JSON.stringify(artifacts,null,2));
  else {const progress=completedFastPathProgress();console.log(JSON.stringify({ok:true,frontier:progress.frontier,state_digest:progress.state_digest,
    decision:artifacts.assessment.decision.disposition,result_digest:result.result_digest},null,2));}
}
