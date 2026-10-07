// Exact prospective runner/scorer equivalence; no provider/label reads.
// Open Questions: evidence/G01-NATIVE-METHOD-LIVE-R7.json.
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
test('r7 runner changes only adapter identities, qualification pin and explicit test closure',()=>{
 let s=read('run-native-method-live-r6.mjs');
 s=s.replaceAll('G01-NATIVE-METHOD-LIVE-R6','G01-NATIVE-METHOD-LIVE-R7').replaceAll('g01-native-method-live-r6-','g01-native-method-live-r7-').replaceAll('g01-native-method-r6-','g01-native-method-r7-').replace('native-method-vps-r6','native-method-vps-r7')
 .replaceAll('loadNavigationMethodEpisode','loadEvidenceGuidedMethodEpisode').replaceAll('runNavigationMethodEpisode','runEvidenceGuidedMethodEpisode')
 .replaceAll('native-method-episode-r6.mjs','native-method-episode-r7.mjs').replaceAll('native-method-live-policy-r6','native-method-live-policy-r7').replaceAll('nativeFilePredictionR6','nativeFilePredictionR7')
 .replaceAll('native-method-live-r6-wiring','native-method-live-r7-wiring').replaceAll('score-native-method-live-r6','score-native-method-live-r7').replaceAll('audit-native-method-live-r6','audit-native-method-live-r7')
 .replaceAll('native-method-episode-r6.test','native-method-episode-r7.test').replaceAll('native-method-navigation-recycle-r6b.test','native-method-navigation-recycle-r7.test')
 .replace('g01-native-method-episode-r6b-20261007','g01-native-method-episode-r7-20261007').replace('e3006473dc62ebfa466b1b1fb55496a6d8426614586396c70cbb4ca8e38ba01e','89ef884e7f3f2ef5daebcbe69757667f80e84cf216f1faa87d5d7f669e2f0490')
 .replace('navigation-state native successor of frozen r5','evidence-guided native successor of frozen r6')
 .replace("join(HERE,'audit-navigation-state-r6.test.mjs')","join(HERE,'audit-navigation-state-r6b.test.mjs'),join(HERE,'audit-navigation-state-r6b-equivalence.test.mjs'),join(HERE,'audit-acquisition-guidance-r7.test.mjs'),join(HERE,'evidence-acquisition-guidance-r7.test.mjs'),join(HERE,'native-method-guidance-parity-r7.test.mjs')");
 assert.equal(read('run-native-method-live-r7.mjs'),s);
});
test('scorer preserves formulas and original source cohort, adding only pre-label audit barrier',()=>{
 const barrier="    audit = read(ROOT / 'AUDIT.json')\n    assert audit['status'] == 'post-seal-native-request-source-accounting-audit-passed'\n    assert audit['result_sha256'] == seal['result_sha256']\n    assert audit['prediction_seal_sha256'] == sha((ROOT / 'PREDICTION-SEAL.json').read_bytes())\n    assert audit['completed'] == 32 and audit['labels_read'] is False\n    # Exposed evaluator-only labels, only after the complete seal and audit above.";
 const expected=read('score-native-method-live-r6.py').replaceAll('r6','r7').replaceAll('R6','R7')
 .replace('g01-jacoco-project-capacity-r7','g01-jacoco-project-capacity-r6')
 .replace('    # Exposed evaluator-only labels, only after the complete seal above.',barrier);
 assert.equal(read('score-native-method-live-r7.py'),expected);
 assert.ok(expected.indexOf('audit = read')<expected.indexOf('labels ='));
});
test('all gates, budgets, common access and terminal contracts equal frozen r6',()=>{
 const a=JSON.parse(read('../../evidence/G01-NATIVE-METHOD-LIVE-R6.json')),b=JSON.parse(read('../../evidence/G01-NATIVE-METHOD-LIVE-R7.json'));
 for(const k of ['development_gate','limits','finalization','terminal','parity','dispatch','labels','cost','capacity','action_budget','navigation'])assert.deepEqual(b[k],a[k]);
});
