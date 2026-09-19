// Receipt-bound H-L measures. Open questions: RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import Ajv from '../../../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/node_modules/ajv/dist/ajv.js';
import {tools} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/repository-tools.mjs';
import {stable, bodyForReceipt, attachObservationHandles} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash = value => createHash('sha256').update(typeof value === 'string' ? value : stable(value)).digest('hex');
const uint = n => Number.isSafeInteger(n) && n >= 0;
const validateRead = new Ajv({strict: true, allErrors: true}).compile(tools.find(t => t.function.name === 'read_file').function.parameters);
const PREFIX = 'Evidence coverage ledger (not relevance or gold coverage): ';

export function censusRecentEvidence({events, receipts, snapshots}) {
  assert.ok(Array.isArray(events) && Array.isArray(receipts) && Array.isArray(snapshots));
  const sources = new Map();
  for (const snapshot of snapshots) {
    assert.equal(typeof snapshot.path, 'string'); assert.equal(typeof snapshot.utf8, 'string');
    assert.equal(hash(snapshot.utf8), snapshot.source_sha256, 'recent-census.snapshot-digest');
    sources.set(stable([snapshot.path, snapshot.source_sha256]), snapshot.utf8);
  }
  const modelReceipts = new Map(); let knownTokens = 0, unknownUsage = 0;
  for (const [index, receipt] of receipts.entries()) {
    if (receipt.kind !== 'model') continue;
    assert.equal(typeof receipt.dispatched, 'boolean', 'recent-census.dispatch-status');
    if (!receipt.dispatched) continue;
    modelReceipts.set(index, receipt);
    const inputKnown = uint(receipt.input_tokens), outputKnown = uint(receipt.output_tokens);
    knownTokens += (inputKnown ? receipt.input_tokens : 0) + (outputKnown ? receipt.output_tokens : 0);
    assert.ok(Number.isSafeInteger(knownTokens));
    if (!inputKnown || !outputKnown) unknownUsage++;
  }
  const calls = new Map(), outputs = new Set(), responseIndices = new Set();
  const readRows = [], requestRows = [], returned = new Map();
  let pending = null, abandonedCaptures = 0, lastPath = null, totalLines = 0, repeatedLines = 0;
  for (const event of events) {
    if (event.kind === 'request-capture') {
      if (pending !== null) abandonedCaptures++;
      assert.ok(['discover', 'join'].includes(event.phase), 'recent-census.request-phase');
      const capture = event.capture;
      assert.equal(typeof capture?.prompt, 'string');
      assert.equal(hash(capture.prompt), capture.prompt_sha256, 'recent-census.prompt-digest');
      const prompt = JSON.parse(capture.prompt); assert.ok(Array.isArray(prompt.messages));
      const ledgerMessages = prompt.messages.filter(m => m.role === 'system' && typeof m.content === 'string' && m.content.startsWith(PREFIX));
      assert.equal(ledgerMessages.length, event.phase === 'discover' ? 1 : 0, 'recent-census.ledger-count');
      let row = null;
      if (event.phase === 'discover') {
        const ledger = JSON.parse(ledgerMessages[0].content.slice(PREFIX.length));
        assert.ok(Array.isArray(ledger.entries) && uint(ledger.omitted_entries));
        const paths = ledger.entries.map(entry => {assert.ok(typeof entry.path === 'string' && entry.path.length); return entry.path;});
        row = {request_index: requestRows.length, receipt_index: null, latest_returned_path: lastPath,
          eligible: lastPath !== null, latest_path_absent: lastPath !== null && !paths.includes(lastPath)};
        requestRows.push(row);
      }
      pending = {capture, phase: event.phase, row};
      continue;
    }
    if (event.kind === 'response-capture') {
      const capture = event.response_capture, {capture_sha256, ...body} = capture;
      const index = capture.receipt_index, receipt = modelReceipts.get(index);
      assert.ok(receipt && !responseIndices.has(index), 'recent-census.response-identity');
      assert.equal(hash(body), capture_sha256, 'recent-census.response-digest');
      assert.equal(hash(receipt), capture.receipt_sha256, 'recent-census.receipt-digest');
      assert.equal(receipt.request_sha256, capture.request_sha256, 'recent-census.receipt-request');
      assert.ok(pending && event.phase === pending.phase, 'recent-census.pending-request');
      assert.equal(hash(bodyForReceipt(pending.capture.prompt, receipt)), receipt.request_sha256, 'recent-census.request-binding');
      responseIndices.add(index);
      if (pending.row) pending.row.receipt_index = index;
      pending = null;
      if (receipt.status !== 200 || receipt.failure_code) continue;
      const batch = capture.public_response?.message?.tool_calls;
      assert.ok(Array.isArray(batch), 'recent-census.response-calls');
      for (const call of batch) {
        assert.ok(typeof call.id === 'string' && call.id.length && !calls.has(call.id), 'recent-census.call-identity');
        calls.set(call.id, {call, receipt_index: index, phase: event.phase});
      }
      continue;
    }
    if (event.kind !== 'source-tool-result') continue;
    const expected = calls.get(event.call?.id);
    assert.ok(expected && expected.phase === 'discover' && pending === null, 'recent-census.orphan-output');
    assert.equal(stable(event.call), stable(expected.call), 'recent-census.call-substitution');
    assert.ok(!outputs.has(event.call.id), 'recent-census.duplicate-output'); outputs.add(event.call.id);
    if (event.call.function.name !== 'read_file') continue;
    const row = {call_id: event.call.id, receipt_index: expected.receipt_index,
      outcome: event.output?.ok === true ? 'accepted' : event.output?.ok === false ? 'rejected' : 'unresolved',
      fully_repeated: null, returned_lines: 0, repeated_lines: 0};
    if (row.outcome === 'accepted') {
      const args = JSON.parse(event.call.function.arguments);
      assert.equal(validateRead(args), true, 'recent-census.read-arguments');
      const observed = event.output.output;
      const source = sources.get(stable([observed.path, observed.source_sha256]));
      assert.equal(typeof source, 'string', 'recent-census.missing-source');
      const lines = source.split('\n'); if (source.endsWith('\n')) lines.pop();
      assert.ok(args.start_line <= lines.length);
      assert.match(observed.base_commit, /^[a-f0-9]{40}$/);
      const end = Math.min(lines.length, args.start_line + args.line_count - 1);
      const utf8 = lines.slice(args.start_line - 1, end).join('\n');
      const verified = {path: args.path, start_line: args.start_line, end_line: end, total_lines: lines.length,
        utf8, byte_count: Buffer.byteLength(utf8), source_sha256: hash(source),
        source_revision: args.revision, base_commit: observed.base_commit};
      assert.equal(stable(event.output), stable(attachObservationHandles(event.call, {ok: true, output: verified})), 'recent-census.source-output');
      const key = stable([observed.path, observed.source_sha256, observed.source_revision, observed.base_commit]);
      if (!returned.has(key)) returned.set(key, new Set());
      const seen = returned.get(key); let overlap = 0;
      for (let line = args.start_line; line <= end; line++) {if (seen.has(line)) overlap++; seen.add(line);}
      row.returned_lines = end - args.start_line + 1; row.repeated_lines = overlap;
      row.fully_repeated = overlap === row.returned_lines;
      totalLines += row.returned_lines; repeatedLines += overlap; lastPath = observed.path;
    }
    readRows.push(row);
  }
  for (const {call, receipt_index} of calls.values()) {
    if (call.function?.name === 'read_file' && !outputs.has(call.id)) {
      readRows.push({call_id: call.id, receipt_index, outcome: 'unresolved', fully_repeated: null, returned_lines: 0, repeated_lines: 0});
    }
  }
  const missingResponses = [...modelReceipts.keys()].filter(i => !responseIndices.has(i)).length;
  const failedResponses = [...modelReceipts.values()].filter(r => r.status !== 200 || r.failure_code).length;
  const unresolved = readRows.filter(r => r.outcome === 'unresolved').length;
  const unboundRequests = abandonedCaptures + Number(pending !== null);
  const successful = readRows.filter(r => r.outcome === 'accepted').length;
  const repeated = readRows.filter(r => r.fully_repeated === true).length;
  const eligible = requestRows.filter(r => r.eligible).length;
  const omissions = requestRows.filter(r => r.eligible && r.latest_path_absent).length;
  const complete = unknownUsage === 0 && missingResponses === 0 && failedResponses === 0 && unresolved === 0 && unboundRequests === 0;
  return {schema: 'are.recent-evidence-ledger-census/v1', read_rows: readRows, request_rows: requestRows,
    requested_direct_read_calls: readRows.length, successful_direct_read_calls: successful,
    rejected_direct_read_calls: readRows.filter(r => r.outcome === 'rejected').length,
    unresolved_direct_read_calls: unresolved, fully_repeated_direct_read_calls: repeated,
    returned_direct_read_lines: totalLines, previously_returned_direct_read_lines: repeatedLines,
    ledger_requests_after_successful_direct_read: eligible, latest_returned_path_absent_from_ledger_requests: omissions,
    known_model_tokens: knownTokens, unknown_usage_receipts: unknownUsage, missing_model_responses: missingResponses,
    failed_model_responses: failedResponses, unbound_request_captures: unboundRequests,
    counters_reconstructed: complete, mechanism_evaluable: complete && successful > 0 && eligible > 0,
    direct_read_repetition_rate: complete && successful > 0 ? repeated / successful : null,
    ledger_omission_rate: complete && eligible > 0 ? omissions / eligible : null,
    claim_ceiling: 'Raw returned direct-read overlap and actual captured ledger omission only. Not model use, raw relevant coverage, causality or saved tokens.',
    authority_effect: 'none', open_questions_ref: 'RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md'};
}
