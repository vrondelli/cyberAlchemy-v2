// Full-source successor equivalence; no providers/labels or receipt mutation.
// Open Questions: evidence/G01-NATIVE-METHOD-LIVE-R3.json.
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8'),sha=s=>createHash('sha256').update(s).digest('hex');
test('r3 runner differs only at declared adapter/identity/qualification/test seams',()=>{
 let source=read('run-native-method-live-r2.mjs');assert.equal(sha(source),'de1a4ff1bdaa92abdc638f6544861dfbc55ff81b9b9ddccfd40e2aa83b6ca2cb');
 for(const[a,b]of [["// Separately versioned explicit-native successor of frozen r1; no gate/transport widening.","// Separately versioned reliable-native successor of frozen r2; no gate/transport widening."],["import {loadNativeMethodEpisode} from './native-method-episode-r1.mjs';","import {loadReliableMethodEpisode as loadNativeMethodEpisode} from './native-method-episode-r3.mjs';"],["import {runExplicitMethodEpisode as runNativeMethodEpisode} from './native-method-episode-r2.mjs';","import {runReliableMethodEpisode as runNativeMethodEpisode} from './native-method-episode-r3.mjs';"],["import {providerAdmitted,generationAdmitted,nativeFilePrediction,uint} from './native-method-live-policy-r1.mjs';","import {providerAdmitted,generationAdmitted,nativeFilePredictionR3 as nativeFilePrediction,uint} from './native-method-live-policy-r3.mjs';"],["g01-native-method-live-r2-20261007","g01-native-method-live-r3-20261007"],["g01-native-method-episode-r2-20261007/RESULT.json","g01-native-method-episode-r3-20261007/RESULT.json"],["7ad6395ff7b1522c7939b6d99c1fd9e6033d7eb5a2e406a16c133c3ad33b0cdc","e33952fd006d1b3a8ff231b27084ed82ab82e35dfa6c45e2f39109d9769b5739"],["join(HERE,'score-native-method-live-r2.py')","join(HERE,'score-native-method-live-r3.py')"],["join(HERE,'native-method-live-policy-r1.test.mjs')","join(HERE,'native-method-live-policy-r3.test.mjs')"],["join(HERE,'native-method-live-r2-wiring.test.mjs')","join(HERE,'native-method-live-r3-wiring.test.mjs'),join(HERE,'audit-native-method-live-r3.mjs'),join(HERE,'audit-native-method-live-r3.test.mjs')"],["join(HERE,'native-method-episode-r2.test.mjs')","join(HERE,'native-method-episode-r3.test.mjs')"],["request_id:'g01-native-method-r2-'","request_id:'g01-native-method-r3-'"],["adapter_id:'native-method-vps-r2'","adapter_id:'native-method-vps-r3'"]]){assert.equal(source.split(a).length,2,a);source=source.replace(a,()=>b);}
 source=source.replaceAll('G01-NATIVE-METHOD-LIVE-R2.json','G01-NATIVE-METHOD-LIVE-R3.json');
 assert.equal(read('run-native-method-live-r3.mjs'),source);
});
test('r3 scorer preserves the full seal barrier, mappings, formulas and failed denominators',()=>{
 const expected=read('score-native-method-live-r2.py').replace('g01-native-method-live-r2-20261007','g01-native-method-live-r3-20261007')
  .replaceAll('G01-NATIVE-METHOD-LIVE-R2.json','G01-NATIVE-METHOD-LIVE-R3.json');
 assert.equal(read('score-native-method-live-r3.py'),expected);
});
test('r3 retains all quality/cost gates, numeric limits and internal finalization reserves',()=>{
 const a=JSON.parse(read('../../evidence/G01-NATIVE-METHOD-LIVE-R2.json')),b=JSON.parse(read('../../evidence/G01-NATIVE-METHOD-LIVE-R3.json'));
 assert.deepEqual(b.development_gate,a.development_gate);assert.deepEqual(b.limits,a.limits);assert.deepEqual(b.finalization,a.finalization);
 assert.equal(b.terminal.raw_json_alternative,true);assert.equal(b.terminal.physical_line_provenance_claimed,false);
});
