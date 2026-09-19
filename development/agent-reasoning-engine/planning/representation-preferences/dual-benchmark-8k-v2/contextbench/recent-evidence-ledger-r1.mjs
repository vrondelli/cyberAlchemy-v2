// Additive H-L candidate. Open questions: RECENT-EVIDENCE-LEDGER-R1.md.
// Retain the existing source verification and renderer. Only entry order changes.
import assert from 'node:assert/strict';
import {buildCoverageLedger as buildVerifiedLedger} from './ranked-read-ledger-r1.mjs';
import {bindRankedReadDelivery} from './ranked-read-delivery-r2.mjs';
export {renderCoverageLedger} from './ranked-read-ledger-r1.mjs';

const identity = entry => JSON.stringify([
  entry.path, entry.source_sha256, entry.source_revision, entry.base_commit,
]);
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;

export function buildCoverageLedger(input) {
  const ledger = buildVerifiedLedger(input);
  const delivery = bindRankedReadDelivery(input);
  const firstConfirmation = new Map();
  for (const observation of delivery.read_observations) {
    assert.ok(Number.isSafeInteger(observation.first_confirmed_receipt) &&
      observation.first_confirmed_receipt >= 0, 'recent-ledger.confirmation-order');
    assert.ok(!firstConfirmation.has(observation.id), 'recent-ledger.duplicate-observation');
    firstConfirmation.set(observation.id, observation.first_confirmed_receipt);
  }
  const ordered = ledger.entries.map(entry => {
    assert.ok(entry.observation_ids.length > 0, 'recent-ledger.empty-entry');
    let newest = -1;
    for (const id of entry.observation_ids) {
      assert.ok(firstConfirmation.has(id), 'recent-ledger.unconfirmed-observation');
      newest = Math.max(newest, firstConfirmation.get(id));
    }
    return {entry, newest};
  });
  // A replay can add confirmations, but cannot refresh an observation's first
  // confirmation. New tool observations can refresh their source version.
  ordered.sort((a, b) => b.newest - a.newest || compare(identity(a.entry), identity(b.entry)));
  return {...ledger, entries: ordered.map(item => item.entry),
    selection_policy: 'recent-first-confirmed-observation/v1',
    open_questions_ref: 'RECENT-EVIDENCE-LEDGER-R1.md'};
}
