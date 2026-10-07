// Open Questions: evidence/G01-JACOCO-PROJECT-CAPACITY-R5-INTERRUPTION.json.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync, mkdirSync, readFileSync, symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {census} from './census-interrupted-campaign-r1.mjs';
test('all slots retained; empty receipt and stale status never become success', () => {
  const root = mkdtempSync(join(tmpdir(), 'are-census-'));
  writeFileSync(join(root,'FREEZE.json'), JSON.stringify({cases:['A','B','C','D'].map(case_id=>({case_id}))}));
  const freeze_sha256 = createHash('sha256').update(readFileSync(join(root,'FREEZE.json'))).digest('hex');
  for (const id of ['A','B','C']) mkdirSync(join(root,id));
  writeFileSync(join(root,'A','RESULT.json'),JSON.stringify({case_id:'A',freeze_sha256,status:'terminal-jacoco-execution-complete'}));
  writeFileSync(join(root,'B','RESULT.json'),'');
  writeFileSync(join(root,'STATUS.json'),JSON.stringify({last:{case_id:'B',result_sha256:'old-success-hash'}}));
  // Even an unsafe fixture symlink is not followed by the receipt census.
  symlinkSync('/nonexistent-private-fixture',join(root,'A','trusted-fixture'));
  const before=readFileSync(join(root,'B','RESULT.json'));
  const c=census(root);
  assert.equal(c.expected,4);
  assert.deepEqual(c.cases.map(x=>x.disposition),['parseable-bound-terminal-receipt-not-execution-audit','invalid-terminal-receipt','started-without-terminal-result','not-started']);
  assert.equal(c.status_last_result_hash_matches_current_bytes,false);
  assert.equal(c.campaign_terminal_present,false);
  assert.deepEqual(readFileSync(join(root,'B','RESULT.json')),before);
});
test('receipt symlinks rejected rather than read',()=>{
  const root=mkdtempSync(join(tmpdir(),'are-census-'));
  writeFileSync(join(root,'FREEZE.json'),JSON.stringify({cases:[{case_id:'A'}]}));
  mkdirSync(join(root,'A'));symlinkSync('/nonexistent-private-receipt',join(root,'A','RESULT.json'));
  assert.throws(()=>census(root),/not-regular-file/);
});
