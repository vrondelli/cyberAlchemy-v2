// Source audit primitives remain frozen; offline terminal reconstruction.
// Open Questions: evidence/G01-NATIVE-METHOD-LIVE-R7.json.
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {selectEpisodeTerminal,checkCanonicalMethodObservation} from './audit-native-method-live-r7.mjs';
import {selectEpisodeTerminal as previous,checkCanonicalMethodObservation as priorCanonical} from './audit-native-method-live-r5.mjs';
test('all32 frozen r6 terminals preserve exact r5 audit semantics',()=>{const root='/home/vlad_/are-benchmark-archive/g01-native-method-episode-r7-20261007';const c=JSON.parse(readFileSync(root+'/RESULT.json'));for(const row of c.rows){const e=JSON.parse(readFileSync(root+'/'+row.case_id+'-'+row.arm+'/RESULT.json')).result;assert.deepEqual(selectEpisodeTerminal(e),previous(e));const b=structuredClone(e);b.method_handle_presentations.at(-1).receipt_index++;assert.throws(()=>selectEpisodeTerminal(b));}assert.equal(checkCanonicalMethodObservation.toString(),priorCanonical.toString());});
