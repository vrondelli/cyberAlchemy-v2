// Prospective full-source equivalence checks; no providers or evaluator labels.
// Open Questions: evidence/G01-NATIVE-METHOD-LIVE-R4.json.
import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8'),sha=x=>createHash('sha256').update(x).digest('hex');
test('r4 runner preserves complete r3 control flow except declared compact adapter, input format and pins',()=>{
 let source=read('run-native-method-live-r3.mjs');assert.equal(sha(source),'3e0529cbfa30c845e77d85f484e09fde9acb684f2807215abfd95710fdd9181b');
 source=source.replaceAll('r3','r4').replaceAll('R3','R4').replaceAll('loadReliableMethodEpisode','loadCompactMethodEpisode').replaceAll('runReliableMethodEpisode','runCompactMethodEpisode');
 for(const[a,b]of [
  ['reliable-native successor of frozen r2','compact-native successor of frozen r3'],
  ['e33952fd006d1b3a8ff231b27084ed82ab82e35dfa6c45e2f39109d9769b5739','b8c4f4db779b82df4721e1b731f3cecf72fbee4a0744c1ba786ccbda4c221487'],
  ['Return the native summary/context_read_ids schema with up to8 distinct files','Return summary (at most160 characters) and context_handles from the exact current-request table, with up to8 distinct files'],
  ["join(HERE,'explicit-method-tools-r2.test.mjs')","join(HERE,'explicit-method-tools-r2.test.mjs'),join(HERE,'compact-method-terminal-r4.test.mjs'),join(HERE,'compact-method-terminal-r4b.test.mjs')"],
  ['for(const path of [SCREEN,offline,protocolPath,',"for(const path of [join(HERE,'../../../../packages/coding-agent-runtime/schemas/patch-set-candidate.schema.json'),SCREEN,offline,protocolPath,"]
 ]){assert.equal(source.split(a).length,2,a);source=source.replace(a,()=>b);}
 assert.equal(read('run-native-method-live-r4.mjs'),source);
});
test('r4 scorer changes only archive identity, preserving full32 seal barrier and formulas',()=>{
 assert.equal(read('score-native-method-live-r4.py'),read('score-native-method-live-r3.py').replaceAll('r3','r4').replaceAll('R3','R4'));
});
test('r4 retains every numeric quality, cost, capacity and finalization gate',()=>{
 const a=JSON.parse(read('../../evidence/G01-NATIVE-METHOD-LIVE-R3.json')),b=JSON.parse(read('../../evidence/G01-NATIVE-METHOD-LIVE-R4.json'));
 for(const k of ['development_gate','limits','finalization'])assert.deepEqual(b[k],a[k]);
 assert.equal(b.terminal.tool,'submit_method_handles');assert.equal(b.terminal.raw_json_alternative,true);
 assert.equal(b.terminal.empty_selection_is_valid_prediction,false);assert.equal(b.terminal.all_eligible_reads_addressable,true);
 assert.equal(b.terminal.physical_line_provenance_claimed,false);
});
