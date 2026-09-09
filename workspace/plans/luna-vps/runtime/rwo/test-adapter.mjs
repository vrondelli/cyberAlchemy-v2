// Actual kernel + controlled transport failures. Open questions: README.md.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {createServer} from 'node:net';
import {get} from 'node:http';
import {createAdapter, serve, control} from './adapter.mjs';
import {projectWorkers, workerEndpoint} from '../../../../../workspace/runtime/src/features/control-center/workers.ts';
const root = mkdtempSync(resolve(tmpdir(), 'rwo-are-test-'));
const kernel = resolve(process.argv[2]);
const sha = data => createHash('sha256').update(data).digest('hex');
const base = {kernel, kernel_sha256: sha(readFileSync(kernel)), socket: resolve(root, 'control.sock'), request_id: 'rwo_fixture_01'};
const config = name => ({...base, state: resolve(root, name)});
const result = {request_id: base.request_id, status: 'passed', model: 'gpt-5.6-luna',
  prompt_sha256: sha('For this architecture integration smoke test, reply with exactly ARE_LUNA_LIVE_OK. Do not call tools or read files.'),
  verified: true, provider_calls: 1, max_output_tokens: 512, tools_enabled: false, output: 'ARE_LUNA_LIVE_OK',
  thread_id: 'fixture-thread', turn_id: 'fixture-turn', completion_binding_digest: 'a'.repeat(64)};
let calls = 0, server, socketServer;
try {
  const goodConfig = config('good');
  const adapter = createAdapter(goodConfig, async (_socket, command) => {
    calls++; assert.equal(command.op, 'smoke');
    const persisted = JSON.parse(readFileSync(resolve(goodConfig.state, 'history.json')));
    assert.equal(persisted.status, 'dispatching'); assert.equal(persisted.transitions.length, 1);
    assert.ok(existsSync(resolve(goodConfig.state, 'dispatch.lock')));
    return result;
  });
  const first = await adapter.run(); assert.equal(first.history.status, 'succeeded'); assert.equal(first.replay, false);
  const restarted = createAdapter(goodConfig, async () => { throw new Error('REPLAY_DISPATCHED'); });
  assert.equal((await restarted.run()).replay, true); assert.equal(calls, 1);
  await assert.rejects(createAdapter({...goodConfig, request_id: 'changed'}, async () => result).run(), /BINDING_CONFLICT/);
  server = await serve(adapter, 0);
  const endpoint = workerEndpoint(`http://127.0.0.1:${server.address().port}`);
  const response = await fetch(endpoint, {headers: {Origin: 'http://localhost:5173'}});
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'http://localhost:5173');
  const projected = projectWorkers(await response.json());
  assert.equal(projected.tasks[0].evidence.turnId, result.turn_id); assert.equal(projected.tasks[0].status, 'succeeded');
  assert.equal(projected.pool[0].active, null);
  const invalidProjection = adapter.projection(); invalidProjection.runs[0].strategy.nodes[0].execution_evidence.history_verified = false;
  assert.throws(() => projectWorkers(invalidProjection), /Unverified/);
  const legacy = {source_mode: 'existing-orchestrator', generated_at: 'now', runs: [{run_key: 'old', title: 'Existing task',
    strategy: {model: 'gpt-5.6-luna', nodes: [{node_id: 'node', role_id: 'builder', stage: 'build', status: 'blocked'}]}}], executor_pool: []};
  assert.deepEqual(projectWorkers(legacy).tasks, [{id: 'old:node', run: 'Existing task', role: 'builder', stage: 'build', status: 'blocked'}]);
  for (const input of [null, {}, {runs: [], executor_pool: []}]) assert.throws(() => projectWorkers(input));
  for (const endpoint of ['https://example.com', 'http://user:secret@localhost', 'http://localhost/private']) assert.throws(() => workerEndpoint(endpoint));
  assert.equal((await fetch(endpoint, {method: 'POST'})).status, 405);
  assert.equal((await fetch(endpoint, {headers: {Origin: 'https://untrusted.example'}})).status, 403);
  assert.equal(await new Promise((ok, fail) => get(endpoint, {headers: {Host: 'untrusted.example'}}, response => {response.resume(); ok(response.statusCode);}).on('error', fail)), 403);
  for (const [name, mutate] of Object.entries({unverified: r => ({...r, verified: false}), wrong_request: r => ({...r, request_id: 'wrong'}),
    wrong_digest: r => ({...r, completion_binding_digest: 'wrong'}), wrong_output: r => ({...r, output: 'wrong'}),
    wrong_budget: r => ({...r, provider_calls: 2}), wrong_prompt: r => ({...r, prompt_sha256: 'wrong'})})) {
    let attempts = 0;
    const failedConfig = config(name), failed = createAdapter(failedConfig, async () => { attempts++; return mutate(result); });
    await assert.rejects(failed.run()); assert.equal(failed.read().status, 'uncertain');
    await assert.rejects(createAdapter(failedConfig, async () => { attempts++; return result; }).run(), /RECONCILIATION/);
    assert.equal(attempts, 1); assert.ok(existsSync(resolve(failedConfig.state, 'dispatch.lock')));
  }
  let finish;
  const concurrentConfig = config('concurrent'), concurrent = createAdapter(concurrentConfig, () => new Promise(resolveResult => {finish = resolveResult;}));
  const pending = concurrent.run();
  await assert.rejects(concurrent.run(), /RECONCILIATION/); finish(result); await pending;
  socketServer = createServer(socket => { socket.on('error', () => {}); socket.resume(); });
  await new Promise(ok => socketServer.listen(base.socket, ok));
  const timeoutConfig = config('timeout'), timeout = createAdapter(timeoutConfig, (path, request) => control(path, request, 20));
  await assert.rejects(timeout.run(), /TIMEOUT/); await assert.rejects(timeout.run(), /RECONCILIATION/);
  const file = resolve(goodConfig.state, 'history.json'), corrupt = JSON.parse(readFileSync(file));
  corrupt.transitions[0].reduction.command.command_type = 'Forged'; writeFileSync(file, JSON.stringify(corrupt));
  assert.throws(() => adapter.read(), /HISTORY_DRIFT/); assert.equal((await fetch(endpoint)).status, 503);
  assert.throws(() => createAdapter({...base, state: root, kernel_sha256: '0'.repeat(64)}), /KERNEL_DRIFT/);
  console.log(JSON.stringify({status: 'PASS', actual_rwo_kernel: true, acceptance_before_dispatch: true, replay_without_dispatch: true,
    changed_request_rejected: true, malformed_results_rejected: 6, uncertain_timeout_blocks_retry: true, concurrent_dispatch_blocked: true,
    corrupt_history_unavailable: true, workspace_projection_verified: true, loopback_read_only_http: true, external_model_calls: 0,
    open_questions_ref: '../runtime/rwo/README.md#open-questions'}, null, 2));
} finally {
  server?.closeAllConnections(); if (server) await new Promise(ok => server.close(ok));
  if (socketServer) await new Promise(ok => socketServer.close(ok));
  rmSync(root, {recursive: true, force: true});
}
