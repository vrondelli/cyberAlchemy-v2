// One bounded RWO -> ARE command. Open questions: README.md#open-questions
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {connect} from 'node:net';
import {createServer} from 'node:http';
import {readFileSync, mkdirSync, openSync, writeFileSync, fsyncSync, closeSync, renameSync, unlinkSync, existsSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {pathToFileURL} from 'node:url';

const sha = value => createHash('sha256').update(value).digest('hex');
const MODEL = 'gpt-5.6-luna', MARKER = 'ARE_LUNA_LIVE_OK';
const PROMPT = `For this architecture integration smoke test, reply with exactly ${MARKER}. Do not call tools or read files.`;
const tuple = {contract_id: 'RWO-SEMANTIC-CONTRACT', contract_version: '1.0.0', profile_id: 'RWO-JCS-IJSON-SAFEINT', profile_version: '1.0.0'};
export const composition = {...tuple, schema_id: 'ExplicitComposition', schema_version: '1.0.0', composition_id: 'rwo-are-luna-smoke-v1',
  nodes: [{node_id: 'LunaPilot', node_type: 'DomainSpecWorkflow'}, {node_id: 'AreLuna', node_type: 'DomainSpecOperation'}],
  edges: [{edge_id: 'dispatch-are', source_node_id: 'LunaPilot', target_node_id: 'AreLuna', event_type: 'LunaRequested', command_type: 'RunAreLunaSmoke',
    payload_derivation: 'copy-event-payload', event_payload_schema: {schema_id: 'FixtureEventPayload', schema_version: '1.0.0'},
    command_payload_schema: {schema_id: 'FixtureCommandPayload', schema_version: '1.0.0'}}]};

function save(path, value) {
  const temp = path + '.tmp';
  const fd = openSync(temp, 'wx', 0o600);
  try { writeFileSync(fd, JSON.stringify(value) + '\n'); fsyncSync(fd); } finally { closeSync(fd); }
  renameSync(temp, path);
  const dir = openSync(dirname(path), 'r'); try { fsyncSync(dir); } finally { closeSync(dir); }
}
export function control(socketPath, request, timeout = 100000) {
  return new Promise((resolveResult, reject) => {
    const socket = connect(socketPath); let output = '';
    socket.setTimeout(timeout, () => socket.destroy(new Error('ARE_TIMEOUT_RECONCILIATION_REQUIRED')));
    socket.on('connect', () => socket.write(JSON.stringify(request) + '\n'));
    socket.on('data', chunk => { output += chunk; if (Buffer.byteLength(output) > 65536) socket.destroy(new Error('ARE_OUTPUT_LIMIT')); });
    socket.on('error', reject);
    socket.on('end', () => { try { const reply = JSON.parse(output); assert.equal(reply.ok, true, 'ARE_REJECTED'); resolveResult(reply.result); } catch (error) { reject(error); } });
  });
}
export function createAdapter(config, transport = control, {taskContract = null} = {}) {
  assert.equal(Boolean(config.task), Boolean(taskContract), 'TASK_ENTRY_REQUIRED');
  if (taskContract) { assert.deepEqual(config.task, taskContract.task); assert.equal(config.request_id, taskContract.task.task_id); }
  const selectedComposition = taskContract ? {...composition, composition_id: 'rwo-are-text-v1', edges: composition.edges.map(edge => ({...edge, command_type: 'RunAreLunaText'}))} : composition;
  for (const key of ['kernel', 'state', 'socket']) assert.ok(config[key]?.startsWith('/'), `PATH_REQUIRED:${key}`);
  assert.match(config.request_id, /^[A-Za-z0-9_-]{1,80}$/);
  assert.equal(sha(readFileSync(config.kernel)), config.kernel_sha256, 'KERNEL_DRIFT');
  const binding = {schema_version: 'rwo-are-pilot-binding/v1', kernel_sha256: config.kernel_sha256,
    composition_sha256: sha(JSON.stringify(selectedComposition)), socket: config.socket, request_id: config.request_id,
    model: MODEL, prompt_sha256: sha(taskContract?.prompt ?? PROMPT), ...(taskContract ? {task_digest: taskContract.digest} : {}), max_output_tokens: 512, tools_enabled: false};
  const bindingDigest = sha(JSON.stringify(binding));
  const stream = `rwo:${config.request_id}`;
  const path = resolve(config.state, 'history.json'), lock = resolve(config.state, 'dispatch.lock');
  const kernel = (event, cursor) => JSON.parse(execFileSync(config.kernel, [], {input: JSON.stringify({composition: selectedComposition, stream_id: stream, ...(event ? {event} : {}), ...(cursor ? {cursor} : {})}), timeout: 5000, maxBuffer: 1048576}));
  const event = (type, node, payload) => ({...tuple, schema_id: 'AcceptedEventView', schema_version: '1.0.0', stream_id: stream,
    event_id: `${config.request_id}:${type}`, event_type: type, source_node_id: node, payload});
  const requested = event('LunaRequested', 'LunaPilot', {job_id: bindingDigest});
  function verifyResult(result) {
    assert.equal(result.request_id, config.request_id); assert.equal(result.status, 'passed');
    assert.equal(result.model, MODEL); assert.equal(result.prompt_sha256, binding.prompt_sha256);
    assert.equal(result.verified, true); assert.equal(result.provider_calls, 1);
    assert.equal(result.max_output_tokens, 512); assert.equal(result.tools_enabled, false);
    if (taskContract) { assert.equal(result.task_digest, taskContract.digest); taskContract.verifyOutput(result.output); }
    else assert.equal(result.output, MARKER);
    assert.match(result.completion_binding_digest, /^[a-f0-9]{64}$/);
    for (const key of ['thread_id', 'turn_id']) assert.match(result[key], /^[A-Za-z0-9-]{1,100}$/);
    return result;
  }
  function verify(history) {
    assert.equal(history.schema_version, 'rwo-are-pilot-history/v1');
    assert.equal(history.binding_digest, bindingDigest, 'REQUEST_BINDING_CONFLICT'); assert.deepEqual(history.binding, binding);
    assert.ok(['prepared', 'dispatching', 'uncertain', 'succeeded'].includes(history.status));
    const initial = kernel();
    assert.deepEqual(history.initial, initial, 'INITIAL_HISTORY_DRIFT');
    assert.equal(history.transitions.length, history.status === 'succeeded' ? 2 : 1);
    assert.deepEqual(history.transitions[0].event, requested);
    const first = kernel(requested, initial.initial_cursor).transition;
    assert.equal(first.kind, 'Applied'); assert.equal(first.defects.length, 0);
    assert.equal(first.command?.command_type, taskContract ? 'RunAreLunaText' : 'RunAreLunaSmoke'); assert.ok(first.command_intent_identity);
    assert.equal(first.command.target_node_id, 'AreLuna'); assert.deepEqual(first.command.payload, {job_id: bindingDigest});
    assert.deepEqual(history.transitions[0].reduction, first, 'COMMAND_HISTORY_DRIFT');
    if (history.status === 'succeeded') {
      verifyResult(history.result);
      const terminal = event('LunaVerified', 'AreLuna', {job_id: sha(JSON.stringify({command_intent_identity: first.command_intent_identity, result: history.result}))});
      assert.deepEqual(history.transitions[1].event, terminal);
      const last = kernel(terminal, first.cursor).transition;
      assert.equal(last.kind, 'Applied'); assert.equal(last.command, null); assert.equal(last.defects.length, 0);
      assert.deepEqual(history.transitions[1].reduction, last, 'COMPLETION_HISTORY_DRIFT');
      const duplicate = kernel(requested, last.cursor).transition;
      assert.equal(duplicate.kind, 'Duplicate'); assert.equal(duplicate.command, null);
    } else assert.equal(history.result, undefined);
    return history;
  }
  function read() { return existsSync(path) ? verify(JSON.parse(readFileSync(path, 'utf8'))) : null; }
  async function run() {
    mkdirSync(config.state, {recursive: true, mode: 0o700});
    const parentFd = openSync(dirname(config.state), 'r'); try { fsyncSync(parentFd); } finally { closeSync(parentFd); }
    let history = read();
    if (history?.status === 'succeeded') return {history, replay: true, new_provider_calls: 0};
    if (history && history.status !== 'prepared') throw new Error('DISPATCH_RECONCILIATION_REQUIRED');
    const fd = openSync(lock, 'wx', 0o600); writeFileSync(fd, JSON.stringify({pid: process.pid, binding_digest: bindingDigest})); fsyncSync(fd); closeSync(fd);
    // A crash retains this lock. State directories are never reset automatically.
    try {
      if (!history) {
        const initial = kernel(), first = kernel(requested, initial.initial_cursor).transition;
        history = {schema_version: 'rwo-are-pilot-history/v1', binding, binding_digest: bindingDigest, status: 'prepared', initial,
          transitions: [{event: requested, reduction: first}], updated_at: new Date().toISOString(), authority_effect: 'none'};
        verify(history); save(path, history);
      }
      // Command acceptance and dispatch intent are fsynced before the external call.
      history.status = 'dispatching'; history.updated_at = new Date().toISOString(); save(path, history);
      const result = verifyResult(await transport(config.socket, {op: taskContract ? 'run' : 'smoke', request_id: config.request_id, ...(taskContract ? {task_digest: taskContract.digest} : {})}));
      const first = history.transitions[0].reduction;
      const terminal = event('LunaVerified', 'AreLuna', {job_id: sha(JSON.stringify({command_intent_identity: first.command_intent_identity, result}))});
      const completed = {...history, status: 'succeeded', result, updated_at: new Date().toISOString(),
        transitions: [...history.transitions, {event: terminal, reduction: kernel(terminal, first.cursor).transition}]};
      verify(completed); save(path, completed); unlinkSync(lock);
      return {history: completed, replay: false, new_provider_calls: result.provider_calls};
    } catch (error) {
      if (history && history.status !== 'succeeded') { history.status = 'uncertain'; history.updated_at = new Date().toISOString(); save(path, history); }
      throw error;
    }
  }
  function projection() {
    const history = read();
    const status = history?.status ?? 'not-started';
    const evidence = history?.status === 'succeeded' ? {thread_id: history.result.thread_id, turn_id: history.result.turn_id,
      completion_binding_digest: history.result.completion_binding_digest, command_intent_identity: history.transitions[0].reduction.command_intent_identity,
      graph_identity: history.initial.graph_identity, history_verified: true} : undefined;
    return {source_mode: 'rwo-are-luna-candidate', generated_at: new Date().toISOString(), observed_history_at: history?.updated_at ?? null,
      runs: history ? [{run_key: stream, title: taskContract?.task.title ?? 'RWO → ARE → Luna smoke', strategy: {model: MODEL, nodes: [{node_id: 'AreLuna', role_id: taskContract ? 'text-worker' : 'integration-smoke',
        stage: status === 'succeeded' ? 'Verified completion' : 'Bounded execution', status, ...(evidence ? {execution_evidence: evidence} : {})}]}}] : [],
      executor_pool: [{id: 'rwo-are-luna-pilot', name: 'ARE Luna pilot', model: MODEL, availability: status === 'succeeded' ? 'single-request-budget-consumed' : 'activity-unknown', active: null}],
      authority_effect: 'none', claim_ceiling: 'One bounded candidate RWO stream; no worker liveness inferred from stored history'};
  }
  return {run, read, projection};
}
function loopbackOrigin(origin) {
  try { const url = new URL(origin); return url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) && url.origin === origin; } catch { return false; }
}
export async function serve(adapter, port) {
  assert.ok(Number.isInteger(port) && port >= 0 && port <= 65535);
  const server = createServer((request, response) => {
    response.setHeader('Cache-Control', 'no-store'); response.setHeader('Content-Type', 'application/json');
    if (!loopbackOrigin(`http://${request.headers.host}`)) { response.writeHead(403); return response.end('{}'); }
    const origin = request.headers.origin;
    if (origin && !loopbackOrigin(origin)) { response.writeHead(403); return response.end('{}'); }
    if (origin) { response.setHeader('Access-Control-Allow-Origin', origin); response.setHeader('Vary', 'Origin'); }
    if (request.url !== '/api/v1/state') { response.writeHead(404); return response.end('{}'); }
    if (request.method === 'OPTIONS') { response.setHeader('Access-Control-Allow-Methods', 'GET'); response.writeHead(204); return response.end(); }
    if (request.method !== 'GET') { response.writeHead(405); return response.end('{}'); }
    try { response.end(JSON.stringify(adapter.projection())); } catch { response.writeHead(503); response.end(JSON.stringify({error: 'RWO_HISTORY_UNAVAILABLE'})); }
  });
  server.requestTimeout = 5000; server.maxConnections = 8;
  await new Promise((ok, fail) => { server.once('error', fail); server.listen(port, '127.0.0.1', ok); });
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [configPath, op] = process.argv.slice(2), config = JSON.parse(readFileSync(configPath, 'utf8'));
  const adapter = createAdapter(config);
  if (op === 'run') process.stdout.write(JSON.stringify(await adapter.run()) + '\n');
  else if (op === 'verify') process.stdout.write(JSON.stringify(adapter.projection()) + '\n');
  else if (op === 'serve') await serve(adapter, config.port);
  else throw new Error('usage: adapter.mjs config.json run|verify|serve');
}
