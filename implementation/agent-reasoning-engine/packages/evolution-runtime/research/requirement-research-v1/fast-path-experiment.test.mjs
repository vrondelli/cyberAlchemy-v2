import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {buildFastPathManifest,runFastPathExperiment,validateHoldout,verifyFastPathResult} from './run-fast-path-experiment.mjs';

const read=name=>JSON.parse(readFileSync(new URL(name,import.meta.url),'utf8'));
test('fast-path manifest freezes a balanced mixed holdout and exact sources',()=>{
  const manifest=buildFastPathManifest(),historical=read('fast-path-manifest-003.json');
  assert.equal(validateHoldout(read('fast-path-holdout-001.json')),true);
  assert.notDeepEqual(manifest,historical);
  assert.equal(verifyFastPathResult(read('fast-path-result-003.json'),historical),true);
  assert.equal(manifest.schedule.length,120);assert.equal(Object.keys(manifest.source_digests).length,10);
});
test('fast-path benchmark preserves every case and clears local gates',async()=>{
  const result=await runFastPathExperiment();
  assert.equal(verifyFastPathResult(result),true);
  assert.equal(result.summary.passed,120);assert.equal(result.summary.fast_path_coverage,.5);
  assert.equal(result.summary.model_calls_per_request,.5);assert.equal(result.disposition,'candidate-supported');
});
test('saved fast-path result is structurally verified and tampering fails',()=>{
  const saved=read('fast-path-result-003.json'),manifest=read('fast-path-manifest-003.json');assert.equal(verifyFastPathResult(saved,manifest),true);
  assert.equal(verifyFastPathResult({...saved,gates:{...saved.gates,eligible_latency:false}},manifest),false);
});
