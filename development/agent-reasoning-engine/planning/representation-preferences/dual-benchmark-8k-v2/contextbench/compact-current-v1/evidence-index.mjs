// Additive current-ARE codec integration. Open questions: README.md.
// Receipt-derived state presentation. Open questions: README.md.
import {bindDelivery, stable} from './delivery.mjs';

const uint = x => Number.isSafeInteger(x) && x >= 0;
const envelope = entries => entries.length ? stable({observed_source_index: entries}) : '';

export async function buildEvidenceIndex({captures, receipts, max_entries, max_tokens, measure_tokens}) {
  if (!uint(max_entries) || !uint(max_tokens) || typeof measure_tokens !== 'function') {
    throw Error('evidence-index.invalid-limits');
  }
  const binding = bindDelivery({captures, receipts});
  if (binding.unmapped.length) throw Error('evidence-index.unmapped-delivery');
  // Recency means actual confirmed presentation, not filesystem access or archive age.
  const observations = [...binding.read_observations].sort((a, b) =>
    Math.max(...b.confirmed_receipts) - Math.max(...a.confirmed_receipts) || a.id.localeCompare(b.id));
  const seen = new Set(), entries = [];
  for (const r of observations) {
    const key = stable([r.path, r.source_sha256, r.start_line, r.end_line]);
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({read_id: r.id, path: r.path, source_sha256: r.source_sha256,
      start_line: r.start_line, end_line: r.end_line, retrieval_handle: `observed-read:${r.id}`});
  }
  const retained = entries.slice(0, max_entries);
  let text = envelope(retained), tokens = text ? await measure_tokens(text) : 0;
  if (!uint(tokens)) throw Error('evidence-index.invalid-token-measurement');
  // Measure complete serialized presentation, including its envelope. Evict oldest;
  // do not skip a larger recent entry to optimize against particular task contents.
  while (tokens > max_tokens && retained.length) {
    retained.pop();
    text = envelope(retained);
    tokens = text ? await measure_tokens(text) : 0;
    if (!uint(tokens)) throw Error('evidence-index.invalid-token-measurement');
  }
  return {text, entries: retained, measured_tokens: tokens,
    confirmed_unique_ranges: entries.length, omitted_ranges: entries.length - retained.length,
    claim_ceiling: 'Index of receipt-confirmed observations, not proof of source correctness, current source freshness, semantic use or benchmark gain.'};
}

export function recoverObservedRead({captures, receipts, retrieval_handle}) {
  const binding = bindDelivery({captures, receipts});
  if (binding.unmapped.length) throw Error('evidence-index.unmapped-delivery');
  const read = binding.read_observations.find(r => `observed-read:${r.id}` === retrieval_handle);
  if (!read) throw Error('evidence-index.unknown-handle');
  // Return exact historical observed bytes and their claimed source identity.
  // Never read current disk contents under an old handle after the agent edits a file.
  return {read_id: read.id, path: read.path, start_line: read.start_line,
    end_line: read.end_line, source_sha256: read.source_sha256, utf8: read.body,
    source_posture: 'historical-delivered-observation', current_source_verified: false};
}
