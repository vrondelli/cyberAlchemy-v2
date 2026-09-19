import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync, mkdirSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {createStatelessRecyclingTransport, openContextRecycling} from '../../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/context-recycling.mjs';
import {createGlmClient} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/holdout-v1/transport.mjs';
import {runEpisode} from './episode.mjs';
import {stable, bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash = x => createHash('sha256').update(x).digest('hex');
async function fixture({budget = 4500, reserve = 2500, calls = 96, unknown = false, malformedFinal = false, toolInFinal = false, model_dispatch_enabled = true} = {}) {
  const root = mkdtempSync(join(tmpdir(), 'are-budget-phase-')), base = join(root, 'base');
  mkdirSync(base); writeFileSync(join(base, 'a.txt'), 'source');
  const receipts = [], prompts = [], journal = []; let requests = 0, finalRequests = 0, executions = 0;
  const transport = createStatelessRecyclingTransport({adapter_id: 'budget-fixture', source_ref: 'episode-budget.test.mjs', maximum_output_tokens: 1024,
    measure_request: async () => 200,
    request_once: async ({prompt}) => {
      requests++; const p = JSON.parse(prompt); prompts.push(p);
      const final = p.tools.length === 0; if (final) finalRequests++;
      let message, finish_reason;
      if (!final || toolInFinal) {
        message = {role: 'assistant', tool_calls: [{id: 'r' + requests, type: 'function', function: {name: 'read_file', arguments: stable({path: 'a.txt', start_line: 1, line_count: 1, revision: 'base'})}}]};
        finish_reason = 'tool_calls';
      } else {
        const ids = p.messages.filter(m => m.role === 'tool').map(m => JSON.parse(m.content).output.read_id);
        const content = stable({summary: ids.length ? 'Source selected; repair not verified.' : 'No source evidence.', context_read_ids: ids.slice(-1)});
        message = {role: 'assistant', content: malformedFinal && finalRequests === 1 ? 'Prose\n' + content : content}; finish_reason = 'stop';
      }
      const receipt = {kind: 'model', model: 'glm-5.3-flash', output_cap: 1024, reasoning_effort: 'low', dispatched: true, status: 200, input_tokens: unknown ? null : 200, output_tokens: 10, finish_reason};
      receipt.request_sha256 = hash(stable(bodyForReceipt(prompt, receipt))); receipts.push(receipt);
      return {receipt, final_bytes: stable({message, finish_reason})};
    }});
  const task = {problem_statement: 'Inspect source and report evidence.'};
  const recycler = openContextRecycling({transport, fixture_root: base, scope: {request: task.problem_statement}, options: {directory: join(root, 'state'), context_limit: 8000, recycle_at: 7000, safety_margin: 1000, state: {objective: task.problem_statement, constraints: [], completed: [], pending: [], facts: [], lessons: [], evidence_refs: ['fixture-base']}}});
  try {
    const result = await runEpisode({task, arm: 'baseline', client: {transport, receipts, maximum_model_retries: 0}, recycler,
      tools: [{type: 'function', function: {name: 'read_file', parameters: {type: 'object'}}}],
      execute_tool: async () => { executions++; return {ok: true, output: {path: 'a.txt', start_line: 1, end_line: 1, utf8: 'source', source_sha256: hash('source')}}; },
      source_context: () => ({snapshots: [], repoRoot: base}), measure_index_tokens: async () => 100,
      limits: {maximum_calls: calls, output_cap: 1024, total_tokens: budget, index_entries: 8, index_tokens: 1024, finalization_reserve_tokens: reserve, finalization_calls: 2},
      run_id: 'fixture', model_dispatch_enabled, on_event: async e => journal.push(e)});
    return {result, prompts, requests, finalRequests, executions, journal};
  } finally { recycler.close(); rmSync(root, {recursive: true, force: true}); }
}
test('measured reserve boundary changes phase without a model retry or extra dispatch', async () => {
  const r = await fixture();
  assert.equal(r.result.status, 'final_context_selected', r.result.error);
  assert.equal(r.requests, 5); assert.equal(r.executions, 4); assert.equal(r.finalRequests, 1);
  assert.equal(r.result.recycling.dispatches.length, 5);
  assert.equal(r.journal.filter(e => e.kind === 'finalization-start').length, 1);
  assert.ok(r.result.admissions.some(a => a.reason === 'token-budget.finalization-reserved' && !a.admissible));
  assert.ok(r.prompts.at(-1).messages.some(m => m.role === 'tool'));
  assert.deepEqual(r.prompts.at(-1).tools, []);
});
test('larger safety ceiling permits more than 24 calls and reserves the final calls', async () => {
  const r = await fixture({calls: 30, budget: 30000, reserve: 2000});
  assert.equal(r.requests, 29); assert.equal(r.executions, 28);
  assert.equal(r.result.status, 'final_context_selected', r.result.error);
});
test('malformed finalization response receives only the normal bounded correction', async () => {
  const r = await fixture({malformedFinal: true});
  assert.equal(r.result.status, 'final_context_selected', r.result.error);
  assert.equal(r.finalRequests, 2); assert.equal(r.requests, 6);
  assert.equal(r.result.terminal_corrections, 1);
  assert.ok(r.result.receipts.reduce((n, x) => n + x.input_tokens + x.output_tokens, 0) <= 4500);
});
test('unknown usage cannot obtain a finalization request', async () => {
  const r = await fixture({unknown: true});
  assert.equal(r.result.status, 'token_budget_stopped'); assert.equal(r.requests, 1);
  assert.equal(r.finalRequests, 0);
});
test('insufficient total budget still denies tools-disabled finalization', async () => {
  const r = await fixture({budget: 1100, reserve: 1000});
  assert.equal(r.result.status, 'token_budget_stopped'); assert.equal(r.requests, 0);
});
test('tool calls emitted during finalization have no effects', async () => {
  const r = await fixture({toolInFinal: true});
  assert.equal(r.result.status, 'invalid_final_response'); assert.equal(r.executions, 4);
  assert.equal(r.result.error, 'final-selection.tools-forbidden-in-finalization');
});
test('ContextBench transport cap is explicit and legacy caps remain unchanged', () => {
  const endpoints = {chat_endpoint: 'http://127.0.0.1:1/chat/completions', tokenizer_endpoint: 'http://127.0.0.1:1/tokenizer'};
  assert.equal(createGlmClient({...endpoints, request_budget: 'contextbench-budget-v1', maximum_requests: 96}).maximum_requests, 96);
  assert.throws(() => createGlmClient({...endpoints, request_budget: 'contextbench-budget-v1', maximum_requests: 97}), /limits-exceed-candidate/);
  assert.throws(() => createGlmClient({...endpoints, request_budget: 'holdout-window-v1', maximum_requests: 25}), /limits-exceed-candidate/);
  assert.throws(() => createGlmClient({...endpoints, maximum_requests: 13}), /limits-exceed-candidate/);
});
test('preflight measures the unchanged policy but dispatches no model request', async () => {
  const r = await fixture({model_dispatch_enabled: false});
  assert.equal(r.requests, 0); assert.equal(r.result.recycling.dispatches.length, 0);
  assert.equal(r.result.admissions[0].total_token_limit, 4500);
  assert.equal(r.result.admissions[0].reason, 'token-budget.preflight-disabled');
  assert.equal(r.result.captures.length, 1);
});
