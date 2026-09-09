import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {materializeReplicationResult,scoreReplicationRun,verifyReplicationManifest} from '../../src/requirement-replication.mjs';
import {materializeBenchmarkRegistration} from '../../src/benchmark-registration.mjs';
import {digest} from '../../../request-intent-runtime/src/canonical.mjs';
import {buildExecutionManifest} from './prepare-execution.mjs';

function output(c,variant) {
  const retained=c.requirements.filter(x=>c.resulting_requirements.includes(x));
  const added=c.resulting_requirements.filter(x=>!c.requirements.includes(x));
  const removed=c.requirements.filter(x=>!c.resulting_requirements.includes(x));
  return JSON.stringify({transition:c.expected,resulting_requirements:c.resulting_requirements,
    ...(variant==='treatment'?{requirement_delta:{retained,added,removed}}:{})});
}
function observation(m,row) {const c=m.cases.find(x=>x.id===row.case_id);return {ordinal:row.ordinal,case_id:row.case_id,
  repetition:row.repetition,variant:row.variant,prompt_digest:row.prompt_digest,observed_model:m.model,observed_effort:m.effort,
  observed_binary_version:m.binary_version,thread_id:'thread-'+row.ordinal,turn_id:'turn-'+row.ordinal,completion_status:'completed',
  tool_events:0,startup_ms:10,first_text_ms:20,elapsed_ms:30,token_usage:{inputTokens:10,cachedInputTokens:0,outputTokens:5},raw_output:output(c,row.variant)};}

test('manifest and complete result are deterministic and registration recomputes gates',()=>{
  const m=buildExecutionManifest();assert.equal(verifyReplicationManifest(m),true);assert.deepEqual(m,buildExecutionManifest());
  const observations=m.schedule.map(row=>observation(m,row));
  const input={manifest:m,observations,status:'completed',started_at:'2026-09-05T00:00:00.000Z',finished_at:'2026-09-05T00:01:00.000Z'};
  const result=materializeReplicationResult(input);assert.deepEqual(result,materializeReplicationResult(input));
  assert.deepEqual(result.gates,{classification_improved:false,requirement_preservation:true,runtime_integrity:true});
  const registration=materializeBenchmarkRegistration({experiment_id:m.experiment_id,manifest:m,result,expected_result_digest:digest(result)});
  assert.deepEqual(registration.gates,result.gates);assert.equal(registration.records[1].observation_kind,'counterevidence');
});
test('malformed output is an explicit scored failure',()=>{
  const m=buildExecutionManifest(),o=observation(m,m.schedule[0]);o.raw_output='not json';
  const score=scoreReplicationRun({manifest:m,observation:o});assert.equal(score.passed,false);
  assert.ok(score.reason_codes.includes('replication.output-json-invalid'));assert.equal(score.output_digest,digest('not json'));
});
test('identity drift and incomplete completed runs fail closed while blocked prefix remains representable',()=>{
  const m=buildExecutionManifest(),o=observation(m,m.schedule[0]);o.observed_model='other';
  assert.throws(()=>scoreReplicationRun({manifest:m,observation:o}),/runtime-identity/);
  const good=observation(m,m.schedule[0]);
  assert.throws(()=>materializeReplicationResult({manifest:m,observations:[good],status:'completed',started_at:'a',finished_at:'b'}),/completed/);
  const blocked=materializeReplicationResult({manifest:m,observations:[good],status:'blocked',error:'transport',started_at:'a',finished_at:'b'});
  assert.equal(blocked.gates,null);assert.equal(blocked.runs.length,1);
});
test('manifest drift and registration gate tampering are rejected',()=>{
  const m=buildExecutionManifest(),tampered=structuredClone(m);tampered.environment.shell_tool=true;
  assert.equal(verifyReplicationManifest(tampered),false);
  const observations=m.schedule.map(row=>observation(m,row));
  const result=materializeReplicationResult({manifest:m,observations,status:'completed',started_at:'a',finished_at:'b'});
  const changed=structuredClone(result);changed.gates.classification_improved=true;
  assert.throws(()=>materializeBenchmarkRegistration({experiment_id:m.experiment_id,manifest:m,result:changed,expected_result_digest:digest(changed)}),/gates/);
});
test('runner refuses to start without explicit live flag',()=>{
  assert.throws(()=>execFileSync(process.execPath,[new URL('run-replication.mjs',import.meta.url).pathname],{stdio:'pipe'}),/Explicit --live/);
});
