import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {loadRecentFinalDonor} from './recent-evidence-final-donor-r1.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');

test('loads all four reviewed historical donors without evaluator material', () => {
  const root = import.meta.dirname;
  const stage = join(root, 'schema-agreement-production-live-r1');
  const review_sha256 = hash(readFileSync(join(stage, 'RESULT-REVIEW-R1.json')));
  const schedule = JSON.parse(readFileSync(join(root, 'RECENT-EVIDENCE-LEDGER-SCHEDULE-R1.json')));
  for (const slot of schedule.slots) {
    const donor = loadRecentFinalDonor({stage, review_sha256, sequence: slot.sequence,
      candidate_slot: slot});
    assert.equal(donor.task.instance_id, slot.instance_id);
    assert.equal(donor.branch_inputs.branches.length, 1);
    assert.ok(donor.branch_inputs.receipts.length > 0);
    assert.ok(donor.branch_inputs.ranked_context.files instanceof Map);
    assert.ok(donor.branch_inputs.ranked_context.sources instanceof Map);
    assert.ok(donor.branch_inputs.ranked_context.sources.size > 0);
    assert.equal(donor.model_calls, 0);
    assert.match(donor.donor_sha256, /^[a-f0-9]{64}$/);
    assert.ok(!Object.hasOwn(donor, 'gold'));
  }
});
