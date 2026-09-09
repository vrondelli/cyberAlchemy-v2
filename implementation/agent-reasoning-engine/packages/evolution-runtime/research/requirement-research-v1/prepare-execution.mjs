import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {digest} from '../../../request-intent-runtime/src/canonical.mjs';
import {REPLICATION_SOURCE_PATHS,materializeReplicationManifest,verifyReplicationManifest} from '../../src/requirement-replication.mjs';
import {materializeResearchDag} from '../../src/research-dag.mjs';
import {materializeResearchPlan,replayResearchWork} from '../../src/research-work.mjs';
import {nextProgress,validateHypotheses} from './prepare-next.mjs';
import {validateArtifact} from './verify-start.mjs';
const directory=dirname(fileURLToPath(import.meta.url));
const root=resolve(directory,'../../../../../../..');
const read=name=>JSON.parse(readFileSync(new URL(name,import.meta.url),'utf8'));
const selectedSources=REPLICATION_SOURCE_PATHS;
const hash=path=>createHash('sha256').update(readFileSync(join(root,path))).digest('hex');
const input=read('../../plans/requirement-research-v1.json');
const registrations=input.registration_digests.map(id=>read('../../research-records/'+id+'.json'));
const plan=materializeResearchPlan({research_dag:materializeResearchDag({registrations}),registrations,tasks:input.tasks});

export function buildExecutionManifest() {
  const preparation=read('replication-manifest-001.json');
  const manifest=materializeReplicationManifest({preparation,source_digests:Object.fromEntries(selectedSources.map(path=>[path,hash(path)])),environment:{
    node_version:'v26.8.1',binary_version:'codex-cli 0.153.1',model:'gpt-5.6-luna',effort:'low',cwd:'/tmp',approval_policy:'never',sandbox:'read-only',
    ephemeral:true,shell_tool:false,base_instructions:'Classify supplied synthetic data only. Return JSON. Do not use tools.',
    thread_start_timeout_ms:180000,completion_timeout_ms:60000}});
  assert.equal(verifyReplicationManifest(manifest),true);
  return manifest;
}

function verifyEvidence(binding) {
  const artifact=read(binding.artifact_ref);
  if(artifact.task_id==='latency.hypothesize')validateHypotheses(artifact);else validateArtifact(artifact);
  assert.equal(binding.plan_digest,artifact.plan_digest);assert.equal(binding.task_id,artifact.task_id);
  assert.equal(binding.criterion_id,artifact.criterion_id);assert.equal(binding.artifact_digest,digest(artifact));
  assert.equal(binding.validator_ref,'are.research-artifact-validator/v1');return {ok:true,binding};
}

export function executionProgress() {
  const prior=nextProgress();assert.deepEqual(prior,read('progress-002.json'));
  const manifest=read('replication-execution-002.json');assert.deepEqual(manifest,buildExecutionManifest());
  const evidence={schema_version:'are.research-task-artifact/v1',plan_digest:plan.plan_digest,task_id:'replication.register',
    criterion_id:'exact-replication-manifest',manifest_ref:'replication-execution-002.json',manifest_digest:manifest.manifest_digest,
    execution_status:'explicit-live-only',authority_effect:'none'};
  assert.deepEqual(evidence,read('replication-registration-evidence-002.json'));
  const events=[...prior.events,{event_id:'replication.register.complete.001',task_id:'replication.register',action:'complete',evidence:[{
    criterion_id:evidence.criterion_id,artifact_ref:'replication-registration-evidence-002.json',artifact_digest:digest(evidence)}]}];
  return replayResearchWork({plan,registrations,events,verify_evidence:binding=>{
    if(binding.artifact_ref!=='replication-registration-evidence-002.json')return verifyEvidence(binding);
    assert.equal(binding.plan_digest,evidence.plan_digest);assert.equal(binding.task_id,evidence.task_id);
    assert.equal(binding.criterion_id,evidence.criterion_id);assert.equal(binding.artifact_digest,digest(evidence));
    assert.equal(binding.validator_ref,'are.research-artifact-validator/v1');assert.equal(verifyReplicationManifest(manifest),true);
    for(const [path,expected] of Object.entries(manifest.source_digests))assert.equal(hash(path),expected);
    return {ok:true,binding};
  }});
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const output={manifest:buildExecutionManifest()};
  if(process.argv.includes('--check-saved')) {output.progress=executionProgress();console.log(JSON.stringify({ok:true,manifest_digest:output.manifest.manifest_digest,frontier:output.progress.frontier}));}
  else console.log(JSON.stringify(output,null,2));
}
