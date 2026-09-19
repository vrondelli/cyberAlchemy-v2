import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {qualifyRecentPopulatedRequests} from './recent-evidence-populated-qualification-r1.mjs';
import {stable, bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';

const PREFIX = 'Evidence coverage ledger (not relevance or gold coverage): ';
const CLAIM = 'Confirmed visible source ranges only; unseen ranges are not relevance judgments. Source hashes and confirmed revision labels separate versions; current means current at read time, not current now.';
const hash = value => createHash('sha256').update(value).digest('hex');
const cell = {comparison_arm: 'recent-evidence-ledger', instance_id: 'fixture', context_limit: 8000,
  limits: {output_cap: 2048, total_tokens: 96000, maximum_calls: 96},
  provider_profile: {token_margin: 512}};

function historical({populated = true, badLedger = false} = {}) {
  const utf8 = 'export const needle = 1;\n', source_sha256 = hash(utf8);
  const snapshot = {path: 'src/needle.js', utf8, source_sha256};
  const call = {id: 'read-1', type: 'function', function: {name: 'read_file',
    arguments: stable({path: snapshot.path, start_line: 1, line_count: 1, revision: 'base'})}};
  const tool = {role: 'tool', tool_call_id: call.id, content: stable({ok: true, output: {path: snapshot.path,
    start_line: 1, end_line: 1, utf8: utf8.trim(), source_sha256, source_revision: 'base', total_lines: 1,
    base_commit: 'a'.repeat(40)}})};
  const empty = stable({claim: CLAIM, entries: [], omitted_entries: 0});
  const visible = stable({claim: CLAIM, entries: badLedger ? [] : [{path: snapshot.path,
    source_sha256, source_revision: 'base', base_commit: 'a'.repeat(40),
    revision_status: 'base as declared by confirmed tool result', total_lines: 1,
    seen_ranges: [[1, 1]], unseen_ranges: []}],
    omitted_entries: 0});
  const tools = [];
  const wire0 = {messages: [{role: 'system', content: PREFIX + empty},
    {role: 'assistant', content: '', tool_calls: [call]}, tool], tools};
  const wire1 = {messages: [{role: 'system', content: PREFIX + (populated ? visible : empty)}], tools};
  const prompts = populated ? [stable(wire0), stable(wire1)] : [stable(wire0)];
  const receipts = prompts.map(prompt => {
    const profile = {model: 'glm-5.3-flash', reasoning_effort: 'low', output_cap: 2048};
    return {kind: 'model', dispatched: true, status: 200, automatic_retries: 0, input_tokens: 100,
      output_tokens: 10, ...profile, request_sha256: hash(stable(bodyForReceipt(prompt, profile)))};
  });
  const events = prompts.map((prompt, index) => [{kind: 'request-capture', phase: 'discover',
    capture: {prompt, prompt_sha256: hash(prompt)}}, {kind: 'response-capture', phase: 'discover',
    response_capture: {receipt_index: index}}]).flat();
  return {events, receipts, snapshots: [snapshot], ranked_evidence: new Map()};
}

function dependencies({envelope = 2662, modelWitness = false} = {}) {
  const writes = [];
  return {writes, persistence: {append: () => {}, writeJson: (path, value) => writes.push({path, value})},
    before_measure: async () => true,
    create_client: async () => {
      const receipts = [], index_receipts = [];
      return {model: 'glm-5.3-flash', receipts, index_receipts,
        measureEnvelope: async prompt => {
          const wire = JSON.parse(prompt);
          if (modelWitness) receipts.push({kind: 'model', dispatched: true, status: 200,
            input_tokens: 1, output_tokens: 1});
          receipts.push({kind: 'tokenizer', dispatched: true, status: 200, automatic_retries: 0,
            input_tokens: envelope - 512 - 2048 - 2,
            request_sha256: hash(stable({model: 'glm-5.3-flash', messages: wire.messages, tools: wire.tools}))});
          return envelope;
        }};
    },
    measure_index_tokens: async (text, client) => {
      const tokens = Math.ceil(text.length / 4);
      client.index_receipts.push({kind: 'index-tokenizer', dispatched: true, status: 200, tokens,
        transport_attempts: [{attempt: 1, status: 200, response_bytes: 1}]});
      return tokens;
    }};
}

async function run(history, options) {
  const deps = dependencies(options);
  const report = await qualifyRecentPopulatedRequests({task: {instance_id: 'fixture'}, cell, ...history,
    donor_sha256: 'b'.repeat(64), out: '/fixture', signal: new AbortController().signal, ...deps});
  return {report, deps};
}

test('measures empty and populated historical requests with the recent ledger', async () => {
  const {report, deps} = await run(historical());
  assert.equal(report.qualified, true);
  assert.equal(report.model_calls, 0);
  assert.equal(report.requests_measured, 2);
  assert.equal(report.populated_requests, 1);
  assert.equal(report.maximum_envelope_tokens, 2662);
  assert.deepEqual(report.rows[1].candidate_paths, ['src/needle.js']);
  assert.equal(report.receipts.length, 2);
  assert.ok(report.index_receipts.length >= 2);
  assert.equal(deps.writes.length, 1);
});

test('rejects a trace with no populated ledger', async () => {
  await assert.rejects(run(historical({populated: false})), /no-populated-ledger/);
});

test('rejects historical ledger drift before measuring the changed request', async () => {
  await assert.rejects(run(historical({badLedger: true})), /historical-ledger-binding/);
});

test('rejects over-window requests and any model witness', async () => {
  await assert.rejects(run(historical(), {envelope: 8001}), /request-envelope/);
  await assert.rejects(run(historical(), {modelWitness: true}), /tokenizer-only/);
});
