// Deterministic full-file equivalence checks: no providers, labels or receipts.
// Open Questions: evidence/G01-NATIVE-METHOD-LIVE-R2.json.
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,'exact seam '+a);return s.replace(a,()=>b);};
test('successor runner differs only at declared identity/adapter/qualification/test seams',()=>{
 let source=read('run-native-method-live-r1.mjs');
 assert.equal(createHash('sha256').update(source).digest('hex'),'473207a0f6789187d48ce25695d009d9862f41e4c68e7dfc3f5ffa93a617e2ab');
 const seams=[
  ["import {runNativeMethodEpisode,loadNativeMethodEpisode} from './native-method-episode-r1.mjs';","import {loadNativeMethodEpisode} from './native-method-episode-r1.mjs';\nimport {runExplicitMethodEpisode as runNativeMethodEpisode} from './native-method-episode-r2.mjs';"],
  ['g01-native-method-live-r1-20261007','g01-native-method-live-r2-20261007'],
  ['g01-native-method-episode-r1-20261007/RESULT.json','g01-native-method-episode-r2-20261007/RESULT.json'],
  ['89e6de079181da334e9687711880ceec8c91ecf3588e7574eba7bb1be0348d3d','7ad6395ff7b1522c7939b6d99c1fd9e6033d7eb5a2e406a16c133c3ad33b0cdc'],
  ["join(HERE,'score-native-method-live-r1.py')","join(HERE,'score-native-method-live-r2.py')"],
  ["join(HERE,'test_native_method_live_score_r1.py')","join(HERE,'test_native_method_live_score_r1.py'),join(HERE,'native-method-live-r2-wiring.test.mjs'),\n  join(HERE,'native-method-episode-r2.test.mjs'),join(HERE,'explicit-method-tools-r2.test.mjs')"],
  ["request_id:'g01-native-method-r1-'","request_id:'g01-native-method-r2-'"],
  ["adapter_id:'native-method-vps-r1'","adapter_id:'native-method-vps-r2'"]
 ];
 for(const[a,b]of seams)source=once(source,a,b);
 source=source.replaceAll('G01-NATIVE-METHOD-LIVE-R1.json','G01-NATIVE-METHOD-LIVE-R2.json');
 assert.equal(read('run-native-method-live-r2.mjs'),'// Separately versioned explicit-native successor of frozen r1; no gate/transport widening.\n'+source);
});
test('successor scorer preserves full seal barrier and formulas, changing only campaign identity',()=>{
 const original=read('score-native-method-live-r1.py');
 assert.equal(createHash('sha256').update(original).digest('hex'),'0328c093e697478d2788089ef17e30bc7b8d2912e436ddec736de63fad758b26');
 const expected=once(original,'g01-native-method-live-r1-20261007','g01-native-method-live-r2-20261007')
  .replaceAll('G01-NATIVE-METHOD-LIVE-R1.json','G01-NATIVE-METHOD-LIVE-R2.json');
 assert.equal(read('score-native-method-live-r2.py'),expected);
});
test('all prospective quality/cost gates and numerical provider caps remain identical',()=>{
 const a=JSON.parse(read('../../evidence/G01-NATIVE-METHOD-LIVE-R1.json')),
  b=JSON.parse(read('../../evidence/G01-NATIVE-METHOD-LIVE-R2.json'));
 assert.deepEqual(b.development_gate,a.development_gate);assert.deepEqual(b.limits,a.limits);
 assert.equal(b.finalization.reserve_tokens_inside_original_total,16384);
 assert.equal(b.finalization.reserved_calls_inside_original_limit,2);
});
