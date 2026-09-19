import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer as createHttpServer, request as httpRequest} from 'node:http';
import {createEdgeServer, PUBLIC_ACCESS_MODE, PUBLIC_BASE_PATH} from './edge-server.mjs';

async function listen(server) {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return server.address().port;
}

async function close(server) {
  await new Promise(resolve => server.close(resolve));
}

function raw(port, path, {host = 'public.example', method = 'GET', headers = {}, body} = {}) {
  return new Promise((resolve, reject) => {
    const request = httpRequest({host: '127.0.0.1', port, path, method, headers: {host, ...(body === undefined ? {} : {'content-length': Buffer.byteLength(body)}), ...headers}}, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks).toString()}));
    });
    request.on('error', reject);
    if (body !== undefined) request.write(body);
    request.end();
  });
}

test('edge admits only the public host and closed public route surface', async () => {
  const seen = [];
  const forwardedSessionHeaders = [];
  const upstream = createHttpServer((req, res) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      if (req.headers['x-are-chat'] || req.headers['x-are-session']) forwardedSessionHeaders.push({
        chat: req.headers['x-are-chat'], session: req.headers['x-are-session'],
      });
      seen.push({method: req.method, url: req.url, host: req.headers.host, authorization: req.headers.authorization, body: Buffer.concat(chunks).toString()});
      res.writeHead(200, {'content-type': 'application/json', 'x-frame-options': 'DENY', connection: 'close'});
      res.end('{"ok":true}');
    });
  });
  const upstreamPort = await listen(upstream);
  const edge = createEdgeServer({port: 8080, publicHost: 'public.example', accessMode: PUBLIC_ACCESS_MODE, upstream: new URL(`http://127.0.0.1:${upstreamPort}`)});
  const edgePort = await listen(edge);
  try {
    const health = await raw(edgePort, '/healthz', {host: 'container-local'});
    assert.equal(health.status, 200);
    assert.deepEqual(JSON.parse(health.body), {status: 'ready', upstream_calls: 0});
    assert.equal((await raw(edgePort, '/', {host: 'attacker.example'})).status, 421);
    assert.equal((await raw(edgePort, PUBLIC_BASE_PATH + '/', {method: 'TRACE'})).status, 405);
    assert.equal((await raw(edgePort, 'http://attacker.example/')).status, 400);
    assert.equal((await raw(edgePort, '/', {host: 'public.example'})).status, 400);
    assert.equal((await raw(edgePort, PUBLIC_BASE_PATH + '/not-chat', {method: 'POST'})).status, 400);
    assert.equal((await raw(edgePort, PUBLIC_BASE_PATH + '/api/are/unknown', {method: 'POST'})).status, 400);
    assert.equal((await raw(edgePort, PUBLIC_BASE_PATH + '/', {host: 'public.example'})).status, 200);
    assert.equal((await raw(edgePort, PUBLIC_BASE_PATH + '/assets/app.js?v=1', {host: 'public.example'})).status, 200);
    assert.equal((await raw(edgePort, PUBLIC_BASE_PATH + '/api/are/status', {host: 'public.example'})).status, 200);
    assert.equal((await raw(edgePort, PUBLIC_BASE_PATH + '/api/are/state', {method: 'POST', body: '{}'})).status, 200);
    assert.equal((await raw(edgePort, PUBLIC_BASE_PATH + '/api/are/reset', {method: 'POST', body: '{}'})).status, 200);
    assert.equal((await raw(edgePort, PUBLIC_BASE_PATH + '/api/are/session', {method: 'DELETE', body: '{}'})).status, 200);
    assert.equal((await raw(edgePort, PUBLIC_BASE_PATH + '/api/are/chat', {method: 'OPTIONS'})).status, 200);
    const anonymous = await raw(edgePort, PUBLIC_BASE_PATH + '/api/are/chat?mode=public', {
      method: 'POST', headers: {'content-type': 'application/json'}, body: '{"message":"anonymous"}',
    });
    assert.equal(anonymous.status, 200);
    const response = await raw(edgePort, PUBLIC_BASE_PATH + '/api/are/chat?mode=public', {
      method: 'POST', headers: {'content-type': 'application/json', authorization: 'Bearer must-not-forward', 'x-are-chat': '1', 'x-are-session': 'a'.repeat(64)}, body: '{"message":"header-stripped"}',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['x-frame-options'], 'DENY');
    assert.notEqual(response.headers.connection, 'close');
    assert.deepEqual(seen, [
      {method: 'GET', url: '/', host: 'public.example', authorization: undefined, body: ''},
      {method: 'GET', url: '/assets/app.js?v=1', host: 'public.example', authorization: undefined, body: ''},
      {method: 'GET', url: '/api/are/status', host: 'public.example', authorization: undefined, body: ''},
      {method: 'POST', url: '/api/are/state', host: 'public.example', authorization: undefined, body: '{}'},
      {method: 'POST', url: '/api/are/reset', host: 'public.example', authorization: undefined, body: '{}'},
      {method: 'DELETE', url: '/api/are/session', host: 'public.example', authorization: undefined, body: '{}'},
      {method: 'OPTIONS', url: '/api/are/chat', host: 'public.example', authorization: undefined, body: ''},
      {method: 'POST', url: '/api/are/chat?mode=public', host: 'public.example', authorization: undefined, body: '{"message":"anonymous"}'},
      {method: 'POST', url: '/api/are/chat?mode=public', host: 'public.example', authorization: undefined, body: '{"message":"header-stripped"}'},
    ]);
    assert.deepEqual(forwardedSessionHeaders, [{chat: '1', session: 'a'.repeat(64)}]);
  } finally {
    await close(edge);
    await close(upstream);
  }
});

test('edge fails closed for any access mode not implemented by this candidate', () => {
  assert.throws(() => createEdgeServer({publicHost: 'public.example', accessMode: 'invitation-only'}), /edge-access-mode-unsupported/);
  assert.throws(() => createEdgeServer({publicHost: 'public.example', accessMode: 'authenticated'}), /edge-access-mode-unsupported/);
});

test('edge rejects oversized request bodies before contacting the upstream', async () => {
  let calls = 0;
  const upstream = createHttpServer((_req, res) => { calls += 1; res.end('unexpected'); });
  const upstreamPort = await listen(upstream);
  const edge = createEdgeServer({port: 8080, publicHost: 'public.example', upstream: new URL(`http://127.0.0.1:${upstreamPort}`)});
  const edgePort = await listen(edge);
  try {
    const response = await raw(edgePort, PUBLIC_BASE_PATH + '/api/are/chat', {
      method: 'POST', headers: {'content-type': 'application/json'}, body: 'x'.repeat(64 * 1024 + 1),
    });
    assert.equal(response.status, 413);
    assert.equal(calls, 0);
  } finally {
    await close(edge);
    await close(upstream);
  }
});
