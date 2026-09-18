import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {sha,verifyFreeze} from './verify-freeze.mjs';

function fixture(stage,claim){
  const root=mkdtempSync(resolve(tmpdir(),'contextbench-freeze-')),matrix=resolve(root,'matrix.json'),preflight=resolve(root,'preflight.json'),source=resolve(root,'source');
  writeFileSync(matrix,JSON.stringify({tasks:[{}],cells:[{}]}));writeFileSync(preflight,JSON.stringify({status:'passed-initial-envelope',model_calls:0,rows:[{}]}));writeFileSync(source,'fixed');
  const material={status:'frozen',node_version:process.version,evaluation_stage:stage,expected_tasks:1,expected_cells:1,matrix_ref:matrix,preflight_ref:preflight,sources:[{path:source,sha256:sha('fixed')}],continuity_review:{passed:true},claim_ceiling:claim};
  const path=resolve(root,'freeze.json');writeFileSync(path,JSON.stringify({...material,freeze_sha256:sha(material)}));return path;
}

test('known evaluation stages accept only their exact claim ceilings',()=>{
  assert.equal(verifyFreeze(fixture('development','development diagnostic only; not benchmark clearance')).freeze.evaluation_stage,'development');
  assert.equal(verifyFreeze(fixture('replication','8K replication diagnostic only; not complete benchmark clearance')).freeze.evaluation_stage,'replication');
  assert.equal(verifyFreeze(fixture('reserved-confirmation','untouched 8K confirmation only; not benchmark clearance')).freeze.evaluation_stage,'reserved-confirmation');
  assert.equal(verifyFreeze(fixture('10k-development-transfer','10K development transfer only; not confirmation or benchmark clearance')).freeze.evaluation_stage,'10k-development-transfer');
  assert.equal(verifyFreeze(fixture('10k-confirmation','fresh 10K confirmation only; not 12K or benchmark clearance')).freeze.evaluation_stage,'10k-confirmation');
  assert.equal(verifyFreeze(fixture('10k-conditional-development','fresh 10K conditional development only; not confirmation, 12K, or benchmark clearance')).freeze.evaluation_stage,'10k-conditional-development');
});
test('confirmation mode rejects a broader clearance claim',()=>assert.throws(()=>verifyFreeze(fixture('reserved-confirmation','benchmark cleared')),/freeze.claim-invalid/));
test('replication mode rejects a complete benchmark claim',()=>assert.throws(()=>verifyFreeze(fixture('replication','benchmark cleared')),/freeze.claim-invalid/));
test('10K development mode rejects confirmation and unknown stages',()=>{
  assert.throws(()=>verifyFreeze(fixture('10k-development-transfer','10K confirmation passed')),/freeze.claim-invalid/);
  assert.throws(()=>verifyFreeze(fixture('future-stage','development diagnostic only; not benchmark clearance')),/freeze.claim-invalid/);
});
test('10K confirmation rejects 12K and broader claims',()=>assert.throws(()=>verifyFreeze(fixture('10k-confirmation','12K qualified')),/freeze.claim-invalid/));
test('10K conditional development rejects confirmation and 12K claims',()=>assert.throws(()=>verifyFreeze(fixture('10k-conditional-development','10K confirmation passed')),/freeze.claim-invalid/));
