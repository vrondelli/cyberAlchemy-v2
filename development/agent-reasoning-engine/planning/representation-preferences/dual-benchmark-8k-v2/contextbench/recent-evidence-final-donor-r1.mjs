// Reviewed historical H-L terminal evidence donor; no evaluator or scorer access.
// Open questions: RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md.
import {createHash} from 'node:crypto';
import {loadRecentPopulatedDonor} from './recent-evidence-populated-donor-r1.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';

const hash = value => createHash('sha256').update(stable(value)).digest('hex');
const need = (value, message) => { if (!value) throw Error('recent-final-donor.' + message); };

export function loadRecentFinalDonor(args) {
  const donor = loadRecentPopulatedDonor(args);
  const terminalEvents = donor.events.filter(event => event.kind === 'episode-result');
  need(terminalEvents.length === 1, 'episode-result');
  const episode = terminalEvents[0].result;
  need(episode?.status === 'final_context_selected' && episode.arm === 'schema-agreement' &&
    Array.isArray(episode.branches) && episode.branches.length === 1 &&
    Array.isArray(episode.receipts), 'episode-shape');
  const lastReceipt = episode.branches.at(-1).receipt_indices.at(-1);
  need(Number.isSafeInteger(lastReceipt) && lastReceipt >= 0 && lastReceipt < episode.receipts.length,
    'branch-receipt-boundary');
  const ranked = [...donor.ranked_evidence.values()];
  need(ranked.length > 0, 'ranked-context');
  const expected = ranked[0].expected;
  need(expected?.files instanceof Map && ranked.every(item => item.expected.base_commit === expected.base_commit &&
    item.expected.index_digest === expected.index_digest), 'ranked-identity');
  const sources = new Map();
  for (const item of ranked) for (const [path, utf8] of item.sources) {
    need(!sources.has(path) || sources.get(path) === utf8, 'source-conflict');
    sources.set(path, utf8);
  }
  const branch_inputs = {branches: structuredClone(episode.branches),
    receipts: structuredClone(episode.receipts.slice(0, lastReceipt + 1)),
    ranked_context: {...expected, files: new Map(expected.files), sources}};
  const material = {task: donor.task, branch_inputs, snapshots: donor.snapshots,
    repoRoot: donor.repoRoot, source_bindings: donor.source_bindings};
  return {...material, donor_sha256: hash(material), model_calls: 0,
    scope: 'Reviewed historical delivered evidence for representative H-L final tokenizer qualification only; no gold, scorer, or new model generation.'};
}
