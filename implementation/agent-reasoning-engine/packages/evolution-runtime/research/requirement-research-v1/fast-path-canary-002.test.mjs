import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {buildFastPathCanaryManifest002,runLocalCanary002,verifyFastPathCanaryManifest002,verifyLiveCanary002,verifyLocalCanary002} from './run-fast-path-canary-002.mjs';
const read=name=>JSON.parse(readFileSync(new URL(name,import.meta.url),'utf8'));

test('successor manifest remains historical and detects reconciliation source drift',()=>{
  const saved=read('fast-path-canary-manifest-002.json');assert.notDeepEqual(saved,buildFastPathCanaryManifest002());
  assert.equal(verifyFastPathCanaryManifest002(saved,false),true);assert.equal(verifyFastPathCanaryManifest002(saved,true),false);
  assert.equal(saved.counterevidence_result_digest,read('fast-path-live-canary-result-001.json').result_digest);
});
test('successor local result preserves strict routing behavior',()=>{
  const manifest=read('fast-path-canary-manifest-002.json');
  assert.throws(()=>runLocalCanary002(manifest));
  const historical=runLocalCanary002(manifest,false);assert.equal(verifyLocalCanary002(historical,manifest,false),true);
  assert.equal(historical.summary.passed,24);assert.equal(historical.summary.model_calls,0);
});
test('saved successor results are exact and tamper evident',()=>{
  const manifest=read('fast-path-canary-manifest-002.json'),local=read('fast-path-local-result-002.json'),live=read('fast-path-live-canary-result-002.json');
  assert.equal(verifyLocalCanary002(local,manifest,false),true);assert.equal(verifyLiveCanary002(live,manifest),true);
  assert.equal(verifyLiveCanary002({...live,summary:{...live.summary,model_calls:0}},manifest),false);
});
