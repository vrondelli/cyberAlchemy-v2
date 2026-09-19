// Offline ordering replay only. Open questions: RECENT-EVIDENCE-LEDGER-R1.md.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {buildCoverageLedger as original} from './ranked-read-ledger-r1.mjs';
import {buildCoverageLedger as recent} from './recent-evidence-ledger-r1.mjs';
import {restoreRankedContext} from './ranked-read-prediction-r1.mjs';
import {restoreRankedReadEvidenceMap} from './ranked-read-evidence-r1.mjs';
const root = path.dirname(fileURLToPath(import.meta.url));
const stage = path.join(root, 'schema-agreement-production-live-r1');
const hash = value => createHash('sha256').update(value).digest('hex');
const bindings = [];
const reviewPath = path.join(stage, 'RESULT-REVIEW-R1.json');
const reviewBytes = await fs.readFile(reviewPath), review = JSON.parse(reviewBytes);
assert.ok(review.approved && review.result_integrity_approved);
bindings.push({path: reviewPath, sha256: hash(reviewBytes)});
const reviewed = new Map(review.source_bindings.map(b => [path.resolve(b.path), b.sha256]));
async function read(file) {
  const bytes = await fs.readFile(file), sha256 = hash(bytes);
  assert.equal(reviewed.get(file), sha256, `reviewed-input:${file}`);
  bindings.push({path: file, sha256});
  return bytes.toString('utf8');
}
const PREFIX = 'Evidence coverage ledger (not relevance or gold coverage): ';
const rows = [];
for (let slot = 0; slot < 4; slot++) {
  const dir = path.join(stage, 'runs_root', String(slot).padStart(2, '0'));
  const result = JSON.parse(await read(path.join(dir, 'result.json')));
  const events = (await read(path.join(dir, 'events.jsonl'))).trim().split('\n').map(s => JSON.parse(s));
  const source_index = JSON.parse(await read(path.join(dir, 'source-index.json')));
  const snapshots = [];
  for (const file of (await fs.readdir(path.join(dir, 'snapshots'))).sort()) {
    assert.ok(file.endsWith('.json'));
    snapshots.push(JSON.parse(await read(path.join(dir, 'snapshots', file))));
  }
  const context = restoreRankedContext({source_index, snapshots, task: {base_commit: source_index.base_commit}});
  const ranked_evidence = restoreRankedReadEvidenceMap(result.branches[0].ranked_evidence_records, context);
  const captures = [], requests = [];
  let lastPath = null;
  for (const [index, event] of events.entries()) {
    if (event.kind === 'source-tool-result' && event.call.function.name === 'read_file' && event.output.ok === true) {
      lastPath = event.output.output.path;
    }
    if (event.kind !== 'request-capture' || event.phase !== 'discover') continue;
    const prompt = JSON.parse(event.capture.prompt);
    const messages = prompt.messages.filter(m => m.role === 'system' && m.content?.startsWith(PREFIX));
    assert.equal(messages.length, 1);
    const visible = JSON.parse(messages[0].content.slice(PREFIX.length));
    const response = events.slice(index + 1).find(e => e.kind === 'response-capture');
    assert.equal(response.phase, 'discover');
    const end = response.response_capture.receipt_index;
    const input = {captures, receipts: result.receipts.slice(0, end), snapshots, ranked_evidence};
    const before = original(input), after = recent(input);
    // Candidate must only reorder evidence; no added, removed, or altered ranges.
    const canonicalEntries = ledger => ledger.entries.map(e => JSON.stringify(e)).sort();
    assert.deepEqual(canonicalEntries(after), canonicalEntries(before));
    const oldVisible = before.entries.slice(0, visible.entries.length).map(({observation_ids, ...entry}) => entry);
    assert.deepEqual(oldVisible, visible.entries);
    assert.equal(before.entries.length - visible.entries.length, visible.omitted_entries);
    const candidate = after.entries.slice(0, visible.entries.length).map(({observation_ids, ...entry}) => entry);
    const latestEligible = lastPath !== null && before.entries.some(e => e.path === lastPath);
    requests.push({receipt_index: end, visible_entry_count: visible.entries.length,
      latest_returned_path: lastPath, latest_returned_path_confirmed_in_ledger: latestEligible,
      historical_paths: visible.entries.map(e => e.path), candidate_same_count_paths: candidate.map(e => e.path),
      historical_latest_path_present: lastPath !== null && visible.entries.some(e => e.path === lastPath),
      candidate_same_count_latest_path_present: lastPath !== null && candidate.some(e => e.path === lastPath),
      historical_utf8_bytes: Buffer.byteLength(JSON.stringify(visible)),
      candidate_same_count_utf8_bytes: Buffer.byteLength(JSON.stringify({...visible, entries: candidate})),
    });
    captures.push(event.capture);
  }
  const eligible = requests.filter(r => r.latest_returned_path_confirmed_in_ledger);
  rows.push({slot, requests, eligible_requests: eligible.length,
    historical_omissions: eligible.filter(r => !r.historical_latest_path_present).length,
    candidate_same_count_omissions: eligible.filter(r => !r.candidate_same_count_latest_path_present).length});
}
for (const name of ['recent-evidence-ledger-r1.mjs', 'recent-evidence-ledger-r1.test.mjs', 'replay-recent-evidence-ledger-r1.mjs']) {
  const file = path.join(root, name); bindings.push({path: file, sha256: hash(await fs.readFile(file))});
}
process.stdout.write(JSON.stringify({schema: 'are.recent-ledger-ordering-replay/v1', rows, source_bindings: bindings,
  new_provider_calls: 0, token_fit_verified: false, behavioral_improvement_measured: false,
  claim_ceiling: 'Same-entry-count replay verifies ordering and unchanged confirmed evidence. Candidate byte size can differ; real tokenizer and full-request qualification remain required. No new model behavior or benchmark score is measured.',
  open_questions_ref: 'RECENT-EVIDENCE-LEDGER-R1.md'}, null, 2) + '\n');
