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

test('legacy development and exact reserved confirmation claims are accepted',()=>{
  assert.equal(verifyFreeze(fixture('development','development diagnostic only; not benchmark clearance')).freeze.evaluation_stage,'development');
  assert.equal(verifyFreeze(fixture('reserved-confirmation','untouched 8K confirmation only; not benchmark clearance')).freeze.evaluation_stage,'reserved-confirmation');
});
test('confirmation mode rejects a broader clearance claim',()=>assert.throws(()=>verifyFreeze(fixture('reserved-confirmation','benchmark cleared')),/freeze.claim-invalid/));
