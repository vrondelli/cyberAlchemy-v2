// HTTP launch semantics and persistence. Open questions: WORKSPACE-LAUNCH.md#open-questions
import assert from 'node:assert/strict';
import {mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {get} from 'node:http';
import {startTaskBridge} from './workspace-task-bridge.mjs';
import {compileTask} from './task-contract.mjs';
const root = mkdtempSync(resolve(tmpdir(), 'workspace-bridge-test-'));
const kernel = resolve(process.argv[2]), token = 'fixture-control-token';
const task = JSON.parse(readFileSync(new URL('./task.example.json', import.meta.url)));
task.objective_kind = 'understand';
const sha = value => createHash('sha256').update(value).digest('hex');
const config = name => ({state: resolve(root, name), kernel, port: 0, max_tasks: 2, ssh_target: 'root@187.77.248.154'});
let bridge, base, calls = 0, finish;
const invoke = async (path, body, headers = {}) => fetch(base + path, {method: body === undefined ? 'GET' : 'POST', headers: {Authorization: `Bearer ${token}`, ...(body === undefined ? {} : {'Content-Type': 'application/json'}), ...headers}, ...(body === undefined ? {} : {body: JSON.stringify(body)})});
function report(task) {
  const compiled = compileTask(task);
  return {status: 'PASS', offline_replay: true, replay_provider_calls: 0, transient_host_stopped: true, result: {history: {status: 'succeeded', result: {
    request_id: task.task_id, task_digest: compiled.digest, prompt_sha256: sha(compiled.prompt), status: 'passed', verified: true,
    model: 'gpt-5.6-luna', provider_calls: 1, max_output_tokens: 512, tools_enabled: false, output: 'A verified task result.',
    thread_id: 'fixture-thread', turn_id: 'fixture-turn', completion_binding_digest: 'a'.repeat(64),
  }}}};
}
try {
  const good = config('good');
  bridge = await startTaskBridge(good, {token, execute: async submitted => {
    calls++; const persisted = JSON.parse(readFileSync(resolve(good.state, 'launches.json'))).state;
    assert.equal(persisted.tasks[0].status, 'dispatching');
    await new Promise(ok => {finish = ok;}); return report(submitted);
  }}); base = `http://127.0.0.1:${bridge.port}`;
  assert.equal((await fetch(base + '/api/v1/tasks')).status, 401);
  assert.equal((await invoke('/api/v1/tasks', undefined, {Origin: 'https://untrusted.example'})).status, 403);
  assert.equal(await new Promise((ok, fail) => get(base + '/api/v1/tasks', {headers: {Host: 'untrusted.example'}}, res => {res.resume(); ok(res.statusCode);}).on('error', fail)), 403);
  const preflight = await fetch(base + '/api/v1/tasks/launch', {method: 'OPTIONS', headers: {Origin: 'http://localhost:5173'}});
  assert.equal(preflight.status, 204); assert.equal(preflight.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  assert.equal((await invoke('/api/v1/tasks/review', {task: {...task, tools: []}})).status, 400);
  const review = await (await invoke('/api/v1/tasks/review', {task})).json();
  const launch = {review_id: review.review_id, digest: review.digest, budget_accepted: true};
  assert.equal((await invoke('/api/v1/tasks/launch', {...launch, budget_accepted: false})).status, 400);
  assert.equal((await invoke('/api/v1/tasks/launch', {...launch, digest: 'wrong'})).status, 400); assert.equal(calls, 0);
  assert.equal((await invoke('/api/v1/tasks/launch', launch)).status, 202);
  assert.equal((await invoke('/api/v1/tasks/launch', launch)).status, 200); assert.equal(calls, 1);
  assert.equal((await invoke('/api/v1/tasks/review', {task: {...task, task_id: 'another'}})).status, 409);
  finish(); await bridge.close(); bridge = null;
  bridge = await startTaskBridge(good, {token, execute: async () => {throw new Error('Unexpected redispatch');}}); base = `http://127.0.0.1:${bridge.port}`;
  const completed = await (await invoke('/api/v1/tasks')).json(); assert.equal(completed.tasks[0].status, 'succeeded'); assert.equal(completed.tasks[0].output, 'A verified task result.');
  assert.equal((await invoke('/api/v1/tasks/review', {task})).status, 400);
  await bridge.close(); bridge = null;
  const storedPath = resolve(good.state, 'launches.json'), stored = JSON.parse(readFileSync(storedPath));
  stored.state.tasks[0].status = 'uncertain'; writeFileSync(storedPath, JSON.stringify(stored));
  await assert.rejects(startTaskBridge(good, {token, execute: async () => null}), /JOURNAL_INTEGRITY/);
  const bad = config('bad');
  bridge = await startTaskBridge(bad, {token, execute: async submitted => {const value = report(submitted); value.result.history.result.task_digest = 'wrong'; return value;}}); base = `http://127.0.0.1:${bridge.port}`;
  const badReview = await (await invoke('/api/v1/tasks/review', {task})).json();
  await invoke('/api/v1/tasks/launch', {review_id: badReview.review_id, digest: badReview.digest, budget_accepted: true});
  await bridge.close(); bridge = null;
  bridge = await startTaskBridge(bad, {token, execute: async () => {throw new Error('Unexpected retry');}}); base = `http://127.0.0.1:${bridge.port}`;
  assert.equal((await (await invoke('/api/v1/tasks')).json()).tasks[0].status, 'uncertain');
  assert.equal((await invoke('/api/v1/tasks/review', {task: {...task, task_id: 'next'}})).status, 409);
  await bridge.close(); bridge = null;
  const stale = config('stale');
  bridge = await startTaskBridge(stale, {token, execute: async () => null});
  await assert.rejects(startTaskBridge(stale, {token, execute: async () => null}), /EEXIST/);
  assert.ok(existsSync(resolve(stale.state, 'bridge.lock')));
  console.log(JSON.stringify({status: 'PASS', authorization_required: true, loopback_origin_enforced: true, review_budget_and_digest_required: true,
    intent_persisted_before_dispatch: true, duplicate_launch_one_execution: true, single_worker_enforced: true,
    completed_result_survives_restart: true, corrupted_journal_rejected: true, invalid_receipt_blocks_further_dispatch: true,
    existing_bridge_lock_preserved: true, external_model_calls: 0, open_questions_ref: '../runtime/WORKSPACE-LAUNCH.md#open-questions'}, null, 2));
} finally {await bridge?.close(); rmSync(root, {recursive: true, force: true});}
