import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {buildFastPathCanaryManifest004,runLocalCanary004,verifyFastPathCanaryManifest004,verifyLiveCanary004,verifyLocalCanary004} from './run-fast-path-canary-004.mjs';
const read=name=>JSON.parse(readFileSync(new URL(name,import.meta.url),'utf8'));

test('canary 004 binds the expanded grammar and predecessor counterevidence',()=>{
  const saved=read('fast-path-canary-manifest-004.json');assert.deepEqual(saved,buildFastPathCanaryManifest004());assert.equal(verifyFastPathCanaryManifest004(saved),true);
  assert.equal(saved.predecessor_manifest_digest,read('fast-path-canary-manifest-003.json').manifest_digest);
  assert.equal(saved.counterevidence_result_digest,read('fast-path-live-canary-result-003.json').result_digest);
});
test('canary 004 local result admits all positives and no exclusions',()=>{
  const manifest=read('fast-path-canary-manifest-004.json'),result=runLocalCanary004(manifest);
  assert.equal(verifyLocalCanary004(result,manifest),true);assert.equal(result.summary.passed,24);assert.equal(result.summary.positive_recall,1);
  assert.equal(result.summary.false_admission_rate,0);assert.equal(result.summary.model_calls,0);
});
test('saved canary 004 results are exact and tamper evident',()=>{
  const manifest=read('fast-path-canary-manifest-004.json'),local=read('fast-path-local-result-004.json'),live=read('fast-path-live-canary-result-004.json');
  assert.equal(verifyLocalCanary004(local,manifest),true);assert.equal(verifyLiveCanary004(live,manifest),true);
  assert.equal(verifyLiveCanary004({...live,summary:{...live.summary,model_calls:1}},manifest),false);
});
