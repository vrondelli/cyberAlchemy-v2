// Gold-free historical metric parity. Open questions: RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md.
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {censusRecentEvidence} from './recent-evidence-census-r1.mjs';
const c = import.meta.dirname, stage = join(c, 'schema-agreement-production-live-r1');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const bindings = [], reviewPath = join(stage, 'RESULT-REVIEW-R1.json');
const reviewBytes = readFileSync(reviewPath), review = JSON.parse(reviewBytes);
assert.ok(review.approved && review.result_integrity_approved);
bindings.push({path: reviewPath, sha256: hash(reviewBytes)});
const reviewed = new Map(review.source_bindings.map(b => [resolve(b.path), b.sha256]));
function read(file, checked = true) {
  const bytes = readFileSync(file), sha256 = hash(bytes);
  if (checked) assert.equal(reviewed.get(file), sha256, 'census-replay.review-binding');
  bindings.push({path: file, sha256}); return JSON.parse(bytes);
}
const audit = read(join(c, 'LEDGER-VISIBILITY-AUDIT-R1.json'), false);
const fields = ['successful_direct_read_calls', 'fully_repeated_direct_read_calls', 'returned_direct_read_lines',
  'previously_returned_direct_read_lines', 'ledger_requests_after_successful_direct_read', 'latest_returned_path_absent_from_ledger_requests'];
const rows = [];
for (let slot = 0; slot < 4; slot++) {
  const dir = join(stage, 'runs_root', String(slot).padStart(2, '0'));
  const result = read(join(dir, 'result.json'));
  const eventPath = join(dir, 'events.jsonl'), bytes = readFileSync(eventPath);
  assert.equal(hash(bytes), reviewed.get(eventPath)); bindings.push({path: eventPath, sha256: hash(bytes)});
  const events = bytes.toString().trim().split('\n').map(s => JSON.parse(s));
  const snapshots = readdirSync(join(dir, 'snapshots')).sort().map(name => read(join(dir, 'snapshots', name)));
  const census = censusRecentEvidence({events, receipts: result.receipts, snapshots});
  assert.equal(census.counters_reconstructed, true); assert.equal(census.mechanism_evaluable, true);
  for (const field of fields) assert.equal(census[field], audit.rows[slot][field], 'historical-parity:' + field);
  rows.push({slot, census});
}
for (const name of ['recent-evidence-census-r1.mjs', 'recent-evidence-census-r1.test.mjs', 'replay-recent-evidence-census-r1.mjs']) {
  const path = join(c, name); bindings.push({path, sha256: hash(readFileSync(path))});
}
console.log(JSON.stringify({schema: 'are.recent-evidence-census-replay/v1', rows, source_bindings: bindings,
  historical_metric_parity: true, new_provider_calls: 0,
  open_questions_ref: 'RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md'}, null, 2));
