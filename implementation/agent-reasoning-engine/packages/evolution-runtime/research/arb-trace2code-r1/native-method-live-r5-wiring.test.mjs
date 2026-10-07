// Prospective full-source equivalence; no providers or evaluator labels.
// Open Questions: evidence/G01-NATIVE-METHOD-LIVE-R5.json.
import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8'),sha=x=>createHash('sha256').update(x).digest('hex');
test('r5 runner preserves full r4 control flow except declared acquisition interface and pins',()=>{
 let source=read('run-native-method-live-r4.mjs');assert.equal(sha(source),'141038f89f0de33d94595bd8c1c264ad8375adee79ff8cacd304b0192b592397');
 source=source.replaceAll('r4','r5').replaceAll('R4','R5').replaceAll('g02-product-r5','g02-product-r4').replaceAll('loadCompactMethodEpisode','loadAcquisitionMethodEpisode').replaceAll('runCompactMethodEpisode','runAcquisitionMethodEpisode');
 for(const[a,b]of [["compact-native successor of frozen r3","acquisition-first native successor of frozen r4"],["b8c4f4db779b82df4721e1b731f3cecf72fbee4a0744c1ba786ccbda4c221487","b4e517f7bb792c4e3ab529b2cf8b4c94d77cc5d1cd7bef5bea347d41e7919c5c"],["Return summary (at most160 characters) and context_handles from the exact current-request table, with up to8 distinct files","Return only context_handles from the exact eligible current-request table, with up to8 distinct files; no summary or other fields"],["join(HERE,'compact-method-terminal-r5.test.mjs'),join(HERE,'compact-method-terminal-r5b.test.mjs')","join(HERE,'method-selection-terminal-r5.test.mjs')"]]){assert.equal(source.split(a).length,2,a);source=source.replace(a,()=>b);}
 assert.equal(read('run-native-method-live-r5.mjs'),source);
});
test('r5 scorer changes only archive identity, preserving full32 seal barrier and formulas',()=>{
 assert.equal(read('score-native-method-live-r5.py'),read('score-native-method-live-r4.py').replaceAll('r4','r5').replaceAll('R4','R5'));
});
test('r5 retains every numeric gate and exact source/phase-bound selection-only contract',()=>{
 const a=JSON.parse(read('../../evidence/G01-NATIVE-METHOD-LIVE-R4.json')),b=JSON.parse(read('../../evidence/G01-NATIVE-METHOD-LIVE-R5.json'));
 for(const k of ['development_gate','limits','finalization'])assert.deepEqual(b[k],a[k]);
 assert.equal(b.terminal.tool,'submit_source_handles');assert.deepEqual(b.terminal.payload_fields,['context_handles']);
 assert.equal(b.terminal.raw_json_alternative,true);assert.equal(b.terminal.empty_selection_is_valid_prediction,false);
 assert.equal(b.terminal.all_eligible_reads_addressable,true);assert.equal(b.terminal.exact_successful_request_table_required,true);
 assert.equal(b.terminal.acquisition_first,true);assert.equal(b.terminal.exact_finalization_phase_required,true);
 assert.equal(b.terminal.whole_envelope_validation,true);assert.equal(b.terminal.physical_line_provenance_claimed,false);
 assert.equal('maximum_summary_utf16_units' in b.terminal,false);
});
