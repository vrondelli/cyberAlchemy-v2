import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {
  buildFastPathCanaryManifest,
  runAdversarialHoldout,
  validateAdversarialHoldout,
  verifyAdversarialResult,
  verifyFastPathCanaryManifest,
  verifyLiveCanaryResult,
} from './run-fast-path-canary.mjs';

const read=name=>JSON.parse(readFileSync(new URL(name,import.meta.url),'utf8'));

test('sequestered holdout has exact positive, adversarial, and live partitions',()=>{
  const value=read('fast-path-adversarial-holdout-001.json');
  assert.equal(validateAdversarialHoldout(value),true);
  assert.equal(value.cases.filter(item=>item.expected_disposition==='fast-path').length,6);
  assert.equal(value.cases.filter(item=>item.expected_disposition==='fallback-required').length,18);
  assert.equal(value.cases.filter(item=>item.live_canary).length,6);
});

test('saved manifest remains historical and detects successor source drift',()=>{
  const saved=read('fast-path-canary-manifest-001.json');
  assert.notDeepEqual(saved,buildFastPathCanaryManifest());
  assert.equal(verifyFastPathCanaryManifest(saved,false),true);
  assert.equal(verifyFastPathCanaryManifest(saved,true),false);
  assert.equal(verifyFastPathCanaryManifest({...saved,dataset_digest:'0'.repeat(64)},false),false);
});

test('adversarial local run admits every control and no adversarial input',()=>{
  const manifest=read('fast-path-canary-manifest-001.json');
  const result=runAdversarialHoldout(manifest,false);
  assert.equal(verifyAdversarialResult(result,manifest,false),true);
  assert.equal(result.summary.passed,24);
  assert.equal(result.summary.adversarial_false_admission_rate,0);
  assert.equal(result.summary.model_calls,0);
});

test('saved local result is exact and tampering fails',()=>{
  const saved=read('fast-path-adversarial-result-001.json');
  const manifest=read('fast-path-canary-manifest-001.json');
  assert.equal(verifyAdversarialResult(saved,manifest,false),true);
  assert.equal(verifyAdversarialResult({...saved,disposition:'accepted'},manifest,false),false);
});

test('saved live result remains structurally verifiable when present',()=>{
  const saved=read('fast-path-live-canary-result-001.json');
  const manifest=read('fast-path-canary-manifest-001.json');
  assert.equal(verifyLiveCanaryResult(saved,manifest),true);
  assert.equal(verifyLiveCanaryResult({...saved,summary:{...saved.summary,model_calls:0}},manifest),false);
});
