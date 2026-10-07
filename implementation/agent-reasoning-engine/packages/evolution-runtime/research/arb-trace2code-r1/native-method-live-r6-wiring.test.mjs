// Exact prospective runner/scorer equivalence, no providers or labels.
// Open Questions: evidence/G01-NATIVE-METHOD-LIVE-R6.json.
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
test('r6 live runner changes only adapter/identity/qualification pin and test pin closure',()=>{
 let source=read('run-native-method-live-r5.mjs').replaceAll('r5','r6').replaceAll('R5','R6')
  .replaceAll('loadAcquisitionMethodEpisode','loadNavigationMethodEpisode').replaceAll('runAcquisitionMethodEpisode','runNavigationMethodEpisode')
  .replace('acquisition-first native successor of frozen r4','navigation-state native successor of frozen r5')
  .replaceAll('g02-product-r6','g02-product-r4')
  .replace('b4e517f7bb792c4e3ab529b2cf8b4c94d77cc5d1cd7bef5bea347d41e7919c5c','e3006473dc62ebfa466b1b1fb55496a6d8426614586396c70cbb4ca8e38ba01e')
  .replace('g01-native-method-episode-r6-20261007','g01-native-method-episode-r6b-20261007')
  .replace('method-selection-terminal-r6.test.mjs','method-selection-terminal-r5.test.mjs')
  .replace("join(HERE,'method-selection-terminal-r5.test.mjs')","join(HERE,'method-selection-terminal-r5.test.mjs'),join(HERE,'method-navigation-state-r6.test.mjs'),join(HERE,'native-navigation-state-r6.test.mjs'),join(HERE,'native-method-navigation-recycle-r6b.test.mjs'),join(HERE,'audit-navigation-state-r6.test.mjs')");
 assert.equal(read('run-native-method-live-r6.mjs'),source);
});
test('r6 scorer preserves full32 barrier, invalid denominator and frozen formulas',()=>{
 assert.equal(read('score-native-method-live-r6.py'),read('score-native-method-live-r5.py').replaceAll('r5','r6').replaceAll('R5','R6'));
});
test('r6 retains all numeric gates/budgets and common terminal rules',()=>{
 const a=JSON.parse(read('../../evidence/G01-NATIVE-METHOD-LIVE-R5.json')),b=JSON.parse(read('../../evidence/G01-NATIVE-METHOD-LIVE-R6.json'));
 for(const k of ['development_gate','limits','finalization','terminal','parity','dispatch','labels','cost','capacity','action_budget'])assert.deepEqual(b[k],a[k]);
 assert.deepEqual(b.navigation,{maximum_tokens:512,maximum_bytes:4096,maximum_fitting_measurements:4,source_credit:false,policy:'Confirmed observed metadata with deterministic recency/whole-item eviction, no inferred relevance or new source access.'});
});
