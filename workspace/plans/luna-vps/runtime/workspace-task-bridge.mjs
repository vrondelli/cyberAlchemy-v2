// Private Workspace launch bridge. Open questions: WORKSPACE-LAUNCH.md#open-questions
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash, randomBytes, timingSafeEqual} from 'node:crypto';
import {readFileSync, writeFileSync, mkdirSync, openSync, closeSync, fsyncSync, renameSync, existsSync, unlinkSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {compileTask} from './task-contract.mjs';
const exec = promisify(execFile), here = dirname(fileURLToPath(import.meta.url));
const sha = value => createHash('sha256').update(value).digest('hex');
const budget = Object.freeze({provider_calls: 1, max_output_tokens: 512, tools_enabled: false});
const sourceNames = ['workspace-task-bridge.mjs', 'prepare-task.mjs', 'pilot-host.mjs', 'task-host.mjs', 'task-contract.mjs', 'run-task-vps.py', 'rwo/adapter.mjs', 'rwo/task-adapter.mjs', 'host.candidate.json', 'host.objective.candidate.json'];
const fingerprint = kernel => sha(JSON.stringify([...sourceNames.map(name => [name, sha(readFileSync(resolve(here, name)))]), ['kernel', sha(readFileSync(kernel))]]));
function durable(path, value) {
  const temp = path + '.tmp', fd = openSync(temp, 'wx', 0o600);
  try {writeFileSync(fd, JSON.stringify(value) + '\n'); fsyncSync(fd);} finally {closeSync(fd);}
  renameSync(temp, path);
  const directory = openSync(dirname(path), 'r'); try {fsyncSync(directory);} finally {closeSync(directory);}
}
function loopback(origin) {
  try {const url = new URL(origin); return url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && url.origin === origin;} catch {return false;}
}
export function sshExecutor(config) {
  // Only this selected deployment target is supported by the existing runner.
  assert.equal(config.ssh_target, 'root@187.77.248.154');
  return async (task, sourceDigest) => {
    assert.equal(fingerprint(config.kernel), sourceDigest, 'SOURCE_CHANGED');
    const key = sha(JSON.stringify(task)), root = resolve(config.state, 'jobs', key);
    mkdirSync(root, {recursive: true, mode: 0o700});
    const taskFile = resolve(root, 'task.json'), stage = resolve(root, `workspace-task-${key.slice(0, 24)}`);
    writeFileSync(taskFile, JSON.stringify(task), {flag: 'wx', mode: 0o600});
    await exec(process.execPath, [resolve(here, 'prepare-task.mjs'), stage, config.kernel, taskFile], {timeout: 10000, maxBuffer: 1048576});
    const options = ['-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o', 'ConnectTimeout=10'];
    await exec('scp', ['-q', '-r', ...options, stage, `${config.ssh_target}:/tmp/`], {timeout: 60000, maxBuffer: 1048576});
    // Shell-visible arguments contain only fixed paths and a generated hex identifier.
    const remote = `/tmp/workspace-task-${key.slice(0, 24)}`;
    const {stdout} = await exec('ssh', [...options, config.ssh_target, 'python3', `${remote}/run-task-vps.py`, remote], {timeout: 240000, maxBuffer: 2097152});
    return JSON.parse(stdout);
  };
}
export async function startTaskBridge(config, {execute = sshExecutor(config), token = randomBytes(32).toString('hex')} = {}) {
  assert.ok(config.state?.startsWith('/') && config.kernel?.startsWith('/'));
  assert.ok(Number.isInteger(config.max_tasks) && config.max_tasks >= 1 && config.max_tasks <= 10);
  assert.ok(Number.isInteger(config.port) && config.port >= 0 && config.port <= 65535);
  const sourceDigest = fingerprint(config.kernel);
  mkdirSync(config.state, {recursive: true, mode: 0o700});
  const file = resolve(config.state, 'launches.json'), lock = resolve(config.state, 'bridge.lock');
  const fd = openSync(lock, 'wx', 0o600); writeFileSync(fd, String(process.pid)); fsyncSync(fd); closeSync(fd);
  const binding = {ssh_target: config.ssh_target, max_tasks: config.max_tasks, source_digest: sourceDigest};
  let state, server, busy = false, closing = false;
  const pending = new Set(), reviews = new Map();
  try {
    if (existsSync(file)) {
      const stored = JSON.parse(readFileSync(file, 'utf8'));
      assert.equal(stored.digest, sha(JSON.stringify(stored.state)), 'JOURNAL_INTEGRITY_FAILED');
      state = stored.state;
    } else state = {binding, tasks: []};
    assert.deepEqual(state.binding, binding, 'BRIDGE_BINDING_CONFLICT');
    assert.ok(Array.isArray(state.tasks) && state.tasks.length <= config.max_tasks);
    // Never re-dispatch persisted intents after loss of the previous process.
    assert.ok(state.tasks.every(task => ['succeeded', 'uncertain'].includes(task.status)), 'RECONCILIATION_REQUIRED');
    const save = () => durable(file, {state, digest: sha(JSON.stringify(state))});
    save();
    writeFileSync(resolve(config.state, 'access-token'), token, {mode: 0o600});
    const expected = Buffer.from(`Bearer ${token}`);
    const snapshot = () => ({schema_version: 'workspace-task-bridge/v1', target: config.ssh_target, budget, max_tasks: config.max_tasks,
      remaining: config.max_tasks - state.tasks.length, busy, tasks: state.tasks.map(({task, digest, status, result}) => ({task_id: task.task_id, title: task.title, digest, status,
        ...(result ? {output: result.output, thread_id: result.thread_id, turn_id: result.turn_id, completion_binding_digest: result.completion_binding_digest} : {})}))});
    async function dispatch(entry) {
      try {
        const report = await execute(entry.task, sourceDigest);
        const contract = compileTask(entry.task), result = report?.result?.history?.result;
        assert.equal(report.status, 'PASS'); assert.equal(report.result.history.status, 'succeeded');
        assert.equal(report.offline_replay, true); assert.equal(report.replay_provider_calls, 0);
        assert.equal(report.transient_host_stopped, true);
        assert.equal(result.task_digest, contract.digest); assert.equal(result.request_id, entry.task.task_id);
        assert.equal(result.prompt_sha256, sha(contract.prompt)); assert.equal(result.status, 'passed');
        assert.equal(result.verified, true); assert.equal(result.model, 'gpt-5.6-luna');
        assert.equal(result.provider_calls, 1); assert.equal(result.max_output_tokens, 512); assert.equal(result.tools_enabled, false);
        for (const key of ['thread_id', 'turn_id']) assert.match(result[key], /^[A-Za-z0-9-]{1,100}$/);
        assert.match(result.completion_binding_digest, /^[a-f0-9]{64}$/); contract.verifyOutput(result.output);
        entry.status = 'succeeded'; entry.result = result; entry.report = report;
      } catch {
        entry.status = 'uncertain';
        // Provider or SSH diagnostics can contain task content. Do not return them to the browser.
      } finally {save(); busy = false;}
    }
    server = createServer(async (request, response) => {
      response.setHeader('Content-Type', 'application/json'); response.setHeader('Cache-Control', 'no-store');
      const send = (code, value) => {response.writeHead(code); response.end(JSON.stringify(value));};
      if (!loopback(`http://${request.headers.host}`)) return send(403, {error: 'Origin rejected'});
      const origin = request.headers.origin;
      if (origin && !loopback(origin)) return send(403, {error: 'Origin rejected'});
      if (origin) {response.setHeader('Access-Control-Allow-Origin', origin); response.setHeader('Vary', 'Origin');}
      if (request.method === 'OPTIONS') {
        response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type'); response.setHeader('Access-Control-Allow-Methods', 'GET, POST');
        return send(204, {});
      }
      const actual = Buffer.from(request.headers.authorization ?? '');
      if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return send(401, {error: 'Bridge token required'});
      if (request.method === 'GET' && request.url === '/api/v1/tasks') return send(200, snapshot());
      if (request.method !== 'POST' || !['/api/v1/tasks/review', '/api/v1/tasks/launch'].includes(request.url)) return send(404, {error: 'Unknown operation'});
      if (request.headers['content-type'] !== 'application/json') return send(415, {error: 'JSON required'});
      try {
        const chunks = []; let size = 0;
        for await (const chunk of request) {size += chunk.length; if (size > 65536) return send(413, {error: 'Task too large'}); chunks.push(chunk);}
        const input = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(Buffer.concat(chunks)));
        if (request.url.endsWith('/review')) {
          assert.deepEqual(Object.keys(input), ['task']);
          const compiled = compileTask(input.task);
          assert.equal(compiled.task.objective_kind, 'understand', 'EXPLICIT_TASK_OBJECTIVE_REQUIRED');
          for (const [key, review] of reviews) if (review.expires < Date.now()) reviews.delete(key);
          if (reviews.size >= 16) return send(429, {error: 'Too many pending reviews'});
          if (busy || state.tasks.length >= config.max_tasks || state.tasks.some(task => task.status === 'uncertain')) return send(409, {error: 'Worker unavailable or budget consumed'});
          assert.ok(!state.tasks.some(task => task.task.task_id === compiled.task.task_id), 'TASK_ID_USED');
          const reviewId = randomBytes(24).toString('hex');
          reviews.set(reviewId, {compiled, expires: Date.now() + 300000});
          return send(200, {review_id: reviewId, task: compiled.task, digest: compiled.digest, target: config.ssh_target, budget});
        }
        assert.deepEqual(Object.keys(input).sort(), ['budget_accepted', 'digest', 'review_id']);
        assert.equal(input.budget_accepted, true);
        const review = reviews.get(input.review_id);
        assert.ok(review && review.expires >= Date.now(), 'REVIEW_EXPIRED');
        assert.equal(input.digest, review.compiled.digest);
        const existing = state.tasks.find(task => task.task.task_id === review.compiled.task.task_id);
        if (existing) {assert.equal(existing.digest, input.digest); return send(200, snapshot());}
        if (busy || closing || state.tasks.length >= config.max_tasks || state.tasks.some(task => task.status === 'uncertain')) return send(409, {error: 'Worker unavailable or budget consumed'});
        assert.equal(fingerprint(config.kernel), sourceDigest, 'SOURCE_CHANGED');
        const entry = {task: review.compiled.task, digest: input.digest, status: 'dispatching'};
        state.tasks.push(entry); save(); busy = true;
        const work = dispatch(entry); pending.add(work); work.finally(() => pending.delete(work)).catch(() => {});
        return send(202, snapshot());
      } catch {return send(400, {error: 'Invalid task, review, or changed binding'});}
    });
    server.requestTimeout = 10000; server.maxConnections = 8;
    await new Promise((ok, fail) => {server.once('error', fail); server.listen(config.port, '127.0.0.1', ok);});
    return {port: server.address().port, async close() {
      closing = true; server.closeAllConnections(); await new Promise(ok => server.close(ok));
      await Promise.allSettled([...pending]); unlinkSync(lock);
    }};
  } catch (error) {if (server) server.close(); unlinkSync(lock); throw error;}
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const config = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  const bridge = await startTaskBridge(config);
  console.log(JSON.stringify({endpoint: `http://127.0.0.1:${bridge.port}`, token_file: resolve(config.state, 'access-token'), max_tasks: config.max_tasks}));
  for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, async () => {await bridge.close(); process.exit(0);});
}
