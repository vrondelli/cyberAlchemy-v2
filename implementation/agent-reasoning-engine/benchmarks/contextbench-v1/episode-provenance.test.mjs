import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {createStatelessRecyclingTransport, openContextRecycling} from '../../packages/coding-agent-runtime/context-recycling.mjs';
import {runEpisode} from './episode.mjs';
import {exportModelSelectedContext} from './final-selection.mjs';
import {stable, bodyForReceipt} from './delivery.mjs';
const hash = x => createHash('sha256').update(x).digest('hex');
async function exercise({budget = 10000, maxCalls = 4, corrupt = false, repeatInvalid = false, secondCorrection = false, maximumTerminalCorrections, pressure = false, emptyFinal = false, arm = 'baseline'} = {}) {
  const root = mkdtempSync(join(tmpdir(), 'are-episode-provenance-')), baseRoot = join(root, 'base');
  mkdirSync(baseRoot); const tail = pressure === 'long-source' ? 'x'.repeat(12000) : 'three';
  const base = 'one\ntwo\n' + tail + '\n', current = 'one\nchanged\n' + tail + '\n';
  writeFileSync(join(baseRoot, 'a.txt'), base);
  const snapshots = [{path: 'a.txt', source_sha256: hash(current), utf8: corrupt ? 'corrupt' : current}];
  const receipts = [], journal = [], prompts = []; let requests = 0, currentId;
  const transport = createStatelessRecyclingTransport({adapter_id: 'provenance-fixture', source_ref: 'episode-provenance.test.mjs', maximum_output_tokens: 1024,
    measure_request: async ({prompt}) => pressure === 'long-source' ? Math.ceil(prompt.length / 4) :
      pressure && (pressure === 'repeated' || requests === 2) && JSON.parse(prompt).messages.length > 6 ? 6500 : 200,
    request_once: async ({prompt}) => {
      requests++; const p = JSON.parse(prompt); prompts.push(p);
      let message, finish_reason;
      if (emptyFinal) {
        message = {role: 'assistant', content: stable({summary: 'Unable to identify relevant source evidence.', context_read_ids: []})};
        finish_reason = 'stop';
      } else if (requests === 1 || requests === 3) {
        if (requests === 3) {
          assert.ok(p.tools.some(t => t.function.name === 'read_file'));
          assert.ok(p.messages.some(m => m.content?.includes('final-selection.changed-source-lines')));
        }
        message = {role: 'assistant', tool_calls: [{id: 'read-' + requests, type: 'function', function: {name: 'read_file', arguments: stable({path: 'a.txt', start_line: 1, line_count: 3, revision: requests === 1 ? 'current' : 'base'})}}]};
        finish_reason = 'tool_calls';
      } else {
        const ids = p.messages.filter(m => m.role === 'tool').map(m => JSON.parse(m.content).output.read_id);
        if (requests === 2) currentId = ids.at(-1);
        message = {role: 'assistant', content: stable({summary: 'Source reviewed', context_read_ids: [repeatInvalid || (secondCorrection && requests === 4) ? currentId : ids.at(-1)]})};
        finish_reason = 'stop';
      }
      const receipt = {kind: 'model', model: 'glm-5.3-flash', output_cap: 1024, reasoning_effort: 'low', dispatched: true, status: 200, input_tokens: 200, output_tokens: 10, finish_reason};
      receipt.request_sha256 = hash(stable(bodyForReceipt(prompt, receipt))); receipts.push(receipt);
      return {receipt, final_bytes: stable({message, finish_reason})};
    }});
  const task = {instance_id: 'fixture', repo_url: 'https://github.com/example/fixture.git', base_commit: 'a'.repeat(40), problem_statement: 'Review and repair the source.'};
  const recycler = openContextRecycling({transport, fixture_root: baseRoot, scope: {request: task.problem_statement}, options: {directory: join(root, 'state'), context_limit: 8000, recycle_at: 7000, safety_margin: 1000, state: {objective: task.problem_statement, constraints: [], completed: [], pending: [], facts: [], lessons: [], evidence_refs: ['base']}}});
  try {
    const result = await runEpisode({task, arm, client: {transport, receipts, maximum_model_retries: 0}, recycler,
      tools: [{type: 'function', function: {name: 'read_file', parameters: {type: 'object'}}}],
      execute_tool: async (name, args) => { const text = args.revision === 'base' ? base : current;
        return {ok: true, output: {path: 'a.txt', start_line: 1, end_line: 3, utf8: text.split('\n').slice(0, 3).join('\n'), source_sha256: hash(text)}}; },
      source_context: () => ({snapshots, repoRoot: baseRoot}),
      measure_index_tokens: async () => 100, limits: {maximum_calls: maxCalls, output_cap: 1024, total_tokens: budget, index_entries: 8, index_tokens: 1024,...(maximumTerminalCorrections===undefined?{}:{maximum_terminal_corrections:maximumTerminalCorrections})}, run_id: 'fixture', on_event: async e => journal.push(e)});
    const exported = result.status === 'final_context_selected' ? exportModelSelectedContext({...result, task, source_snapshots: snapshots, response_capture: result.response_captures.at(-1)}, baseRoot) : null;
    return {result, journal, requests, prompts, exported};
  } finally { recycler.close(); rmSync(root, {recursive: true, force: true}); }
}
test('both arms reject changed evidence, retrieve base and export corrected selection', async () => {
  for (const arm of ['baseline', 'index']) {
    const r = await exercise({arm});
    assert.equal(r.result.status, 'final_context_selected', r.result.error); assert.equal(r.requests, 4);
    assert.equal(r.result.terminal_corrections, 1);
    assert.ok(r.journal.some(e => e.kind === 'terminal-diagnostic' && e.diagnostic.category === 'invalid-source-provenance'));
    assert.deepEqual(r.exported.prediction.traj_data.pred_spans, {'a.txt': [{start: 1, end: 3}]});
    assert.equal(r.result.admissions.at(-1).known_consumed, 630);
    assert.ok(r.prompts[0].messages[0].content.includes('pinned base revision'));
  }
});
test('provenance correction cannot spend beyond cumulative token admission', async () => {
  const r = await exercise({budget: 1500});
  assert.equal(r.result.status, 'token_budget_stopped'); assert.equal(r.requests, 2);
  assert.equal(r.result.events.length, 1); assert.equal(r.result.selection, null);
});
test('last-call provenance failure cannot receive a free correction', async () => {
  const r = await exercise({maxCalls: 2});
  assert.equal(r.result.status, 'invalid_final_response'); assert.equal(r.requests, 2);
  assert.equal(r.result.terminal_corrections, 0); assert.equal(r.result.selection, null);
});
test('snapshot integrity failure halts without asking model to repair evidence', async () => {
  const r = await exercise({corrupt: true});
  assert.equal(r.result.status, 'run_error'); assert.equal(r.requests, 2);
  assert.equal(r.result.terminal_corrections, 0); assert.equal(r.result.selection, null);
});
test('repeated invalid provenance stops after the bounded correction opportunity', async () => {
  const r = await exercise({repeatInvalid: true});
  assert.equal(r.result.status, 'invalid_final_response'); assert.equal(r.requests, 4);
  assert.equal(r.result.terminal_corrections, 1); assert.equal(r.result.selection, null);
});

test('a second exhaustive terminal correction can recover provenance within original budgets', async () => {
  const r = await exercise({secondCorrection: true, maximumTerminalCorrections: 2, maxCalls: 6});
  assert.equal(r.result.status, 'final_context_selected', r.result.error);
  assert.equal(r.requests, 5); assert.equal(r.result.terminal_corrections, 2);
  assert.equal(r.result.admissions.at(-1).known_consumed, 840);
  assert.equal(r.journal.filter(e => e.kind === 'terminal-diagnostic').length, 2);
  assert.deepEqual(r.exported.prediction.traj_data.pred_spans, {'a.txt': [{start: 1, end: 3}]});
});

test('a third invalid terminal response stops after exactly two corrections', async () => {
  const r = await exercise({repeatInvalid: true, maximumTerminalCorrections: 2, maxCalls: 6});
  assert.equal(r.result.status, 'invalid_final_response');
  assert.equal(r.requests, 5); assert.equal(r.result.terminal_corrections, 2);
  assert.equal(r.journal.filter(e => e.kind === 'terminal-diagnostic').length, 3);
});

test('provenance feedback survives real recycling before evidence recovery', async () => {
  for (const arm of ['baseline', 'index']) {
    const r = await exercise({arm, pressure: true});
    assert.equal(r.result.status, 'final_context_selected', arm + ': ' + r.result.error);
    assert.ok(r.result.recycling.recycles > 0);
    assert.equal(r.requests, 4);
  }
});

test('pending recovery evidence that cannot fit causes explicit admission stop', async () => {
  const r = await exercise({arm: 'index', pressure: 'repeated'});
  assert.equal(r.result.status, 'context_budget_stopped');
  assert.equal(r.result.error, 'recycling.fresh-context-too-large');
  assert.equal(r.requests, 3);
  assert.ok(JSON.parse(r.result.captures.at(-1).prompt).messages.some(m => m.role === 'tool'));
  assert.equal(r.result.selection, null);
  assert.equal(r.exported, null);
});

test('new long base evidence is delivered after recycling before its selection', async () => {
  for (const arm of ['baseline', 'index']) {
    const r = await exercise({arm, pressure: 'long-source'});
    assert.equal(r.result.status, 'final_context_selected', r.result.error);
    assert.ok(r.result.recycling.recycles > 0);
    assert.equal(r.requests, 4);
    const last = r.prompts.at(-1).messages;
    assert.ok(last.some(m => m.role === 'tool' && JSON.parse(m.content).output.source_sha256 === r.exported.source_projection.projections.at(-1).base_source_sha256));
    assert.deepEqual(r.exported.prediction.traj_data.pred_spans, {'a.txt': [{start: 1, end: 3}]});
  }
});

test('honest empty selection remains a no-context outcome without invented evidence', async () => {
  const r = await exercise({emptyFinal: true});
  assert.equal(r.result.status, 'no_context_selected');
  assert.deepEqual(r.result.selection.final_read_ids, []);
  assert.equal(r.requests, 1); assert.equal(r.result.terminal_corrections, 0);
  assert.equal(r.exported, null);
});
