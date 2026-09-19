// Read-only historical reconstruction; no provider or evaluator calls.
// Open questions: MEASURED-TERMINAL-CATALOG-PROTOCOL-R2.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {loadCatalogDonor} from './measured-terminal-catalog-donor-r1.mjs';
const stage=join(import.meta.dirname,'ranked-source-production-live-r1');
const review_sha256='9d6cfe42c012fa46950477d3c8f586adb6924c911cde17073f12d0b37bc4dca7';
const schedule=JSON.parse(readFileSync(new URL('./MEASURED-TERMINAL-CATALOG-SCHEDULE-R1.json',import.meta.url)));
const args=sequence=>({stage,review_sha256,sequence,candidate_slot:schedule.slots[sequence]});
test('all four reviewed historical donors reconstruct confirmed delivery',()=>{
 const expected=[93,68,3,124];
 for(let i=0;i<4;i++){
  const d=loadCatalogDonor(args(i));
  assert.equal(d.confirmed_reads,expected[i]);assert.equal(d.model_calls,0);
  assert.equal(d.task.instance_id,schedule.slots[i].instance_id);
  assert.ok(d.source_bindings.some(b=>b.path.endsWith('/events.jsonl')));
  assert.ok(d.source_bindings.every(b=>!b.path.includes('/score/')));
  assert.deepEqual(Object.keys(d).sort(),['task','branch_inputs','snapshots','repoRoot','source_bindings','donor_sha256','confirmed_reads','model_calls','scope'].sort());
 }
});
test('wrong review anchor rejects before donor reconstruction',()=>{
 assert.throws(()=>loadCatalogDonor({...args(0),review_sha256:'0'.repeat(64)}),/file-drift/);
});
test('task substitution and invalid fixed cohort positions reject',()=>{
 assert.throws(()=>loadCatalogDonor({...args(0),candidate_slot:schedule.slots[1]}),/candidate-task-binding/);
 assert.throws(()=>loadCatalogDonor({...args(0),sequence:4}),/sequence/);
 assert.throws(()=>loadCatalogDonor({...args(0),candidate_slot:{...schedule.slots[0],task_sha256:'0'.repeat(64)}}),/candidate-task-binding/);
});
