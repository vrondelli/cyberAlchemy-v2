import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {loadRecentFinalDonorR2} from './recent-evidence-final-donor-r2.mjs';
import {buildIndependentTerminalEvidence} from './ranked-read-export-r1.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');

test('all four donors pass the native terminal evidence join', async () => {
  const root = import.meta.dirname;
  const stage = join(root, 'schema-agreement-production-live-r1');
  const review_sha256 = hash(readFileSync(join(stage, 'RESULT-REVIEW-R1.json')));
  const schedule = JSON.parse(readFileSync(join(root, 'RECENT-EVIDENCE-LEDGER-SCHEDULE-R1.json')));
  for (const slot of schedule.slots) {
    const donor = loadRecentFinalDonorR2({stage, review_sha256, sequence: slot.sequence,
      candidate_slot: slot});
    assert.ok(donor.branch_inputs.ranked_context.expected.files instanceof Map);
    assert.ok(donor.branch_inputs.ranked_context.sources instanceof Map);
    assert.equal(Object.hasOwn(donor.branch_inputs.ranked_context, 'files'), false);
    const terminal = await buildIndependentTerminalEvidence({...donor,
      problem_statement: donor.task.problem_statement,
      measure_tokens: async text => Math.ceil(Buffer.byteLength(text) / 4)});
    assert.equal(terminal.packet.status, 'ready');
    assert.ok(terminal.joined.read_observations.length > 0);
    assert.ok(terminal.packet.private.bindings.length > 0);
  }
});
