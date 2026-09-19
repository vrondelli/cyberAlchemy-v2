import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createChatSession, validateInterpretation, boundedHistory} from './chat.mjs';
import {chatMiddleware} from './http.mjs';

const receipt = {model: 'test-fixture', live_model_invoked: false, input_tokens: 10, output_tokens: 5};
const interpreted = (preference = null) => JSON.stringify({objective: 'Explain signup', kind: 'understand', preference});
const signal = () => new AbortController().signal;
const currentRequest = input => input.json ? JSON.parse(input.messages.at(-1).content).current_request : input.messages.at(-1).content;

test('real ARE routing, context selection, checkpoint and scoped preference reuse', async () => {
  const requests = [], events = [];
  const model = async input => {requests.push(input); return {text: input.json ? interpreted(currentRequest(input).includes('teammates') ? 'Call users teammates.' : null) : 'Teammates need valid invitations.', receipt};};
  const chat = createChatSession({model});
  await chat.submit('Call users teammates. Explain signup.', {signal: signal(), emit: e => events.push(e)});
  await chat.submit('What happens when an invitation expires?', {signal: signal(), emit: e => events.push(e)});
  assert.ok(events.some(e => e.kind === 'route' && e.route_id === 'CA2-ROUTE-UNDERSTAND' && /^[a-f0-9]{64}$/.test(e.decision_digest)));
  assert.ok(events.some(e => e.kind === 'context' && e.selected.includes('signup')));
  assert.equal(events.filter(e => e.kind === 'checkpoint').length, 2);
  assert.match(requests[1].messages[0].content, /route independently for each request/);
  assert.match(requests[1].messages[0].content, /valid invitation never marks an email verified/);
  assert.ok(requests[3].messages[0].content.includes('Call users teammates.'));
  assert.equal(chat.inspect().value.messages.length, 4);
  assert.equal(events.filter(e => e.type === 'done').length, 2);
});

test('transient invalid intent output is retried without exposing the rejected output', async () => {
  let calls = 0; const events = [];
  const chat = createChatSession({model: async input => {
    calls++;
    if (input.json) return {text: calls === 1 ? 'not-json' : interpreted(), receipt};
    return {text: 'Recovered reply.', receipt};
  }});
  await chat.submit('Hello', {signal: signal(), emit: e => events.push(e)});
  assert.equal(calls, 3);
  assert.ok(events.some(e => e.kind === 'validation' && e.valid === false && e.attempt === 1 && e.retrying === true && e.issues.includes('root.invalid-json')));
  assert.ok(events.some(e => e.kind === 'validation' && e.valid === true && e.attempt === 2 && e.recovered === true));
  assert.ok(events.some(e => e.type === 'message' && e.text === 'Recovered reply.'));
  assert.ok(!JSON.stringify(events).includes('not-json'));
});

test('persistent invalid intent output falls back to host understand with no retained preference', async () => {
  let calls = 0; const events = [];
  const chat = createChatSession({model: async input => {
    calls++;
    return {text: input.json ? JSON.stringify({objective: 'publish it', kind: 'publish', preference: 'invented'}) : 'Safe fallback reply.', receipt};
  }});
  await chat.submit('Hello', {signal: signal(), emit: e => events.push(e)});
  assert.equal(calls, 3);
  assert.ok(events.some(e => e.kind === 'validation' && e.attempt === 2 && e.fallback === 'host-understand'));
  assert.ok(events.some(e => e.kind === 'intent-recovery' && e.strategy === 'host-understand' && e.authority_effect === 'none'));
  assert.ok(events.some(e => e.kind === 'route' && e.route_id === 'CA2-ROUTE-UNDERSTAND'));
  assert.ok(events.some(e => e.type === 'message' && e.text === 'Safe fallback reply.'));
  assert.deepEqual(chat.state().preferences, []);
  assert.equal(chat.busy, false);
  assert.throws(() => validateInterpretation({objective: 'x', kind: 'understand', preference: null, execute: true}, 'x'));
});

test('provider failure produces no prepared success or checkpoint', async () => {
  const events = []; const chat = createChatSession({model: async input => {if (!input.json) throw new Error('private-provider-error'); return {text: interpreted(), receipt};}});
  await assert.rejects(chat.submit('Explain signup', {signal: signal(), emit: e => events.push(e)}));
  assert.ok(!events.some(e => e.type === 'message' || e.kind === 'checkpoint')); assert.equal(chat.busy, false);
});

test('cancellation prevents late model output and releases the session', async () => {
  const abort = new AbortController(), events = []; let release, started;
  const waiting = new Promise(resolve => {started = resolve;});
  const chat = createChatSession({model: async input => {
    if (input.json) return {text: interpreted(), receipt};
    started(); await new Promise(resolve => {release = resolve;}); return {text: 'late reply', receipt};
  }});
  const task = chat.submit('Explain signup', {signal: abort.signal, emit: e => events.push(e)});
  await waiting;
  await assert.rejects(chat.submit('Another turn', {signal: signal(), emit: () => {}}), /turn-active/);
  abort.abort(); release(); await assert.rejects(task);
  assert.ok(!events.some(e => e.type === 'message' || e.kind === 'checkpoint')); assert.equal(chat.busy, false);
});

test('sessions do not share conversation messages or preferences', async () => {
  const calls = [];
  const model = async input => {calls.push(input); return {text: input.json ? interpreted(currentRequest(input).includes('teammates') ? 'Call users teammates.' : null) : 'Done.', receipt};};
  const first = createChatSession({model}), second = createChatSession({model});
  await first.submit('Call users teammates.', {signal: signal(), emit: () => {}});
  await second.submit('Explain signup', {signal: signal(), emit: () => {}});
  assert.ok(!JSON.stringify(calls[3].messages).includes('Call users teammates.'));
  assert.notEqual(first.id, second.id);
});

test('history retains a bounded complete suffix and counts omissions', () => {
  const input = [{role: 'human', text: 'x'.repeat(200)}, {role: 'agent', text: 'old reply'}, {role: 'human', text: 'latest'}];
  const result = boundedHistory(input, 100);
  assert.deepEqual(result.messages, [{role: 'user', content: 'latest'}]); assert.equal(result.omitted, 2);
});

test('largest admitted input is present during intent interpretation', async () => {
  const input = 'Explain ' + 'a'.repeat(5992); let first;
  const chat = createChatSession({model: async request => {if (request.json) first = currentRequest(request); return {text: request.json ? interpreted() : 'Done.', receipt};}});
  await chat.submit(input, {signal: signal(), emit: () => {}});
  assert.equal(first, input);
});

test('HTTP reset cancels the active provider and removes its session', async () => {
  let began, aborted = false;
  const started = new Promise(resolve => {began = resolve;});
  const server = createServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const middleware = chatMiddleware({port, model: async request => {
    if (request.json) return {text: interpreted(), receipt};
    began(); await new Promise((resolve, reject) => request.signal.addEventListener('abort', () => {aborted = true; reject(new Error('cancelled'));}, {once: true}));
  }});
  server.on('request', (req, res) => middleware(req, res, () => res.end()));
  const base = `http://127.0.0.1:${port}`, headers = {origin: base, 'content-type': 'application/json', 'x-are-chat': '1'};
  try {
    const response = await fetch(base + '/api/are/chat', {method: 'POST', headers, body: JSON.stringify({text: 'Explain signup'})});
    const reader = response.body.getReader(); let initial = '';
    while (!initial.includes('\n')) initial += new TextDecoder().decode((await reader.read()).value);
    const {conversation_id, session_token} = JSON.parse(initial.split('\n')[0]);
    headers['x-are-session'] = session_token;
    await started;
    const removed = await fetch(base + '/api/are/session', {method: 'DELETE', headers, body: JSON.stringify({conversation_id})});
    assert.equal(removed.status, 200);
    while (!(await reader.read()).done) {}
    assert.equal(aborted, true);
    const retry = await fetch(base + '/api/are/chat', {method: 'POST', headers, body: JSON.stringify({text: 'Hello', conversation_id})});
    assert.equal(retry.status, 404);
  } finally {middleware.close(); await new Promise(resolve => server.close(resolve));}
});

test('forgetting language excludes the old quote from both model calls, while preserving route history', async () => {
  const requests = [];
  const model = async input => {requests.push(input); return {text: input.json ? interpreted(currentRequest(input).includes('orbiters') ? 'Call users orbiters.' : null) : 'A generated answer.', receipt};};
  const first = createChatSession({model});
  await first.submit('Call users orbiters. Explain signup.', {signal: signal(), emit: () => {}});
  const fresh = first.restart('language'); first.close();
  assert.deepEqual(fresh.state().preferences, []);
  assert.equal(fresh.state().routes.length, 1);
  assert.equal(fresh.state().context_messages, 0);
  assert.equal(fresh.state().turns_remaining, 19);
  await fresh.submit('Explain signup again.', {signal: signal(), emit: () => {}});
  assert.ok(!JSON.stringify(requests.slice(2)).includes('orbiters'));
  assert.equal(fresh.state().preferences.length, 0);
});

test('routing reset preserves language but discards decisions, intent chain and conversation', async () => {
  const requests = [];
  const model = async input => {requests.push(input); return {text: input.json ? interpreted(currentRequest(input).includes('orbiters') ? 'Call users orbiters.' : null) : 'Done.', receipt};};
  const original = createChatSession({model});
  await original.submit('Call users orbiters. Explain signup.', {signal: signal(), emit: () => {}});
  const fresh = original.restart('routing'); original.close();
  assert.equal(fresh.state().routes.length, 0);
  assert.equal(fresh.state().context_messages, 0);
  assert.deepEqual(fresh.state().preferences, ['Call users orbiters.']);
  assert.equal(fresh.inspect().value.current_intent_contract_digest, null);
  await fresh.submit('Explain signup', {signal: signal(), emit: () => {}});
  assert.ok(requests[3].messages[0].content.includes('Call users orbiters.'));
  const empty = fresh.restart('all'); fresh.close();
  assert.deepEqual(empty.state().preferences, []); assert.deepEqual(empty.state().routes, []);
  assert.equal(empty.state().context_messages, 0); assert.equal(empty.state().turns_remaining, 18);
  assert.notEqual(empty.id, original.id);
});

test('session access requires its private token; reset rotates identity and cannot bypass global quota', async () => {
  const server = createServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const middleware = chatMiddleware({port, hourlyTurnLimit: 2, model: async input => ({text: input.json ? interpreted() : 'Done.', receipt})});
  server.on('request', (req, res) => middleware(req, res, () => res.end()));
  const base = `http://127.0.0.1:${port}`, headers = {origin: base, 'content-type': 'application/json', 'x-are-chat': '1'};
  const post = (path, body, token) => fetch(base + '/api/are/' + path, {method: 'POST', headers: {...headers, ...(token ? {'x-are-session': token} : {})}, body: JSON.stringify(body)});
  const begin = async () => (await (await post('chat', {text: 'Explain signup'})).text()).trim().split('\n').map(line => JSON.parse(line))[0];
  try {
    const a = await begin(), b = await begin();
    assert.notEqual(a.conversation_id, b.conversation_id); assert.notEqual(a.session_token, b.session_token);
    for (const path of ['chat', 'state', 'reset']) {
      const body = {conversation_id: a.conversation_id, ...(path === 'chat' ? {text: 'Hello'} : path === 'reset' ? {scope: 'all'} : {})};
      assert.equal((await post(path, body, b.session_token)).status, 403);
      assert.equal((await post(path, body)).status, 403);
    }
    assert.equal((await post('state', {conversation_id: a.conversation_id}, a.session_token)).status, 200);
    assert.equal((await post('reset', {conversation_id: a.conversation_id, scope: 'unsupported'}, a.session_token)).status, 400);
    const reset = await (await post('reset', {conversation_id: a.conversation_id, scope: 'all'}, a.session_token)).json();
    assert.notEqual(reset.conversation_id, a.conversation_id); assert.notEqual(reset.session_token, a.session_token);
    assert.equal(reset.state.context_messages, 0); assert.equal(reset.state.turns_remaining, 19);
    assert.equal((await post('state', {conversation_id: a.conversation_id}, a.session_token)).status, 404);
    assert.equal((await post('chat', {conversation_id: reset.conversation_id, text: 'Hello'}, reset.session_token)).status, 429);
    assert.equal((await post('chat', {text: 'Hello'})).status, 429);
  } finally {middleware.close(); await new Promise(resolve => server.close(resolve));}
});

test('failed dispatches reserve budget and new sessions cannot bypass the token allowance', async () => {
  let calls = 0;
  const server = createServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const middleware = chatMiddleware({port, hourlyTokenLimit: 37000, model: async () => {calls++; throw new Error('private-provider-detail');}});
  server.on('request', (req, res) => middleware(req, res, () => res.end()));
  const base = `http://127.0.0.1:${port}`, headers = {origin: base, 'content-type': 'application/json', 'x-are-chat': '1'};
  try {
    const first = await fetch(base + '/api/are/chat', {method: 'POST', headers, body: JSON.stringify({text: 'Hello'})});
    const body = await first.text(); assert.ok(!body.includes('private-provider-detail'));
    const second = await fetch(base + '/api/are/chat', {method: 'POST', headers, body: JSON.stringify({text: 'Hello'})});
    assert.equal(second.status, 429); const limited = await second.json(); assert.equal(limited.error, 'demo-token-limit'); assert.match(limited.allowance_resets_at, /Z$/); assert.equal(calls, 1);
    const status = await (await fetch(base + '/api/are/status')).json();
    assert.equal(status.configured, true); assert.equal(status.available, false); assert.equal(status.availability_reason, 'demo-token-limit'); assert.equal(status.allowance_resets_at, limited.allowance_resets_at);
  } finally {middleware.close(); await new Promise(resolve => server.close(resolve));}
});

test('idle retention expires isolated process-memory sessions at the configured boundary', async () => {
  let clock = 1_000;
  const server = createServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const middleware = chatMiddleware({
    port, now: () => clock, idleRetentionMs: 2_000,
    model: async input => ({text: input.json ? interpreted() : 'Done.', receipt}),
  });
  server.on('request', (req, res) => middleware(req, res, () => res.end()));
  const base = `http://127.0.0.1:${port}`, headers = {origin: base, 'content-type': 'application/json', 'x-are-chat': '1'};
  const post = (path, body, token) => fetch(base + '/api/are/' + path, {
    method: 'POST', headers: {...headers, ...(token ? {'x-are-session': token} : {})}, body: JSON.stringify(body),
  });
  try {
    const status = await (await fetch(base + '/api/are/status')).json();
    assert.equal(status.persistence, 'process-memory'); assert.equal(status.idle_retention_seconds, 2);
    const events = (await (await post('chat', {text: 'Explain signup'})).text()).trim().split('\n').map(line => JSON.parse(line));
    const {conversation_id, session_token} = events[0];
    clock = 2_999;
    assert.equal((await post('state', {conversation_id}, session_token)).status, 200);
    clock = 3_000;
    const expired = await post('state', {conversation_id}, session_token);
    assert.equal(expired.status, 404); assert.equal((await expired.json()).error, 'conversation-expired');
  } finally {middleware.close(); await new Promise(resolve => server.close(resolve));}
});

test('HTTP rejects cross-origin, oversized, unknown-session and excess fields without provider calls', async () => {
  let calls = 0;
  const server = createServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const middleware = chatMiddleware({port, model: async () => {calls++; throw new Error('unexpected');}});
  server.on('request', (req, res) => middleware(req, res, () => {res.writeHead(404); res.end();}));
  const base = `http://127.0.0.1:${port}`, headers = {origin: base, 'content-type': 'application/json', 'x-are-chat': '1'};
  try {
    assert.equal((await fetch(base + '/api/are/status')).status, 200);
    for (const [body, extra, status] of [
      [{text: 'hello'}, {origin: 'https://example.com'}, 403],
      [{text: 'hello', endpoint: 'https://example.com'}, {}, 400],
      [{text: 'x'.repeat(7000)}, {}, 400],
      [{text: 'hello', conversation_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'}, {}, 404],
    ]) assert.equal((await fetch(base + '/api/are/chat', {method: 'POST', headers: {...headers, ...extra}, body: JSON.stringify(body)})).status, status);
    assert.equal(calls, 0);
  } finally {middleware.close(); await new Promise(resolve => server.close(resolve));}
});

test('development middleware serves the API beneath the public /are base path', async () => {
  const server = createServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const middleware = chatMiddleware({port, publicBasePath: '/are', configurationError: true});
  server.on('request', (req, res) => middleware(req, res, () => {res.writeHead(404); res.end();}));
  const base = `http://127.0.0.1:${port}`;
  try {
    const status = await fetch(base + '/are/api/are/status');
    assert.equal(status.status, 200);
    assert.equal((await status.json()).configured, false);
    assert.equal((await fetch(base + '/api/are/status')).status, 404);
    assert.equal((await fetch(base + '/other/api/are/status')).status, 404);
  } finally {middleware.close(); await new Promise(resolve => server.close(resolve));}
});
