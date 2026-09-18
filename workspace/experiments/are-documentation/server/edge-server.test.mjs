import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer as createHttpServer, request as httpRequest} from 'node:http';
import {createEdgeServer} from './edge-server.mjs';

async function listen(server) {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return server.address().port;
}

async function close(server) {
  await new Promise(resolve => server.close(resolve));
}

function raw(port, path, {host = 'public.example', method = 'GET', headers = {}, body} = {}) {
  return new Promise((resolve, reject) => {
    const request = httpRequest({host: '127.0.0.1', port, path, method, headers: {host, ...headers}}, response => {
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
  const upstream = createHttpServer((req, res) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      seen.push({method: req.method, url: req.url, host: req.headers.host, authorization: req.headers.authorization, body: Buffer.concat(chunks).toString()});
      res.writeHead(200, {'content-type': 'application/json', 'x-frame-options': 'DENY', connection: 'close'});
      res.end('{"ok":true}');
    });
  });
  const upstreamPort = await listen(upstream);
  const edge = createEdgeServer({port: 8080, publicHost: 'public.example', upstream: new URL(`http://127.0.0.1:${upstreamPort}`)});
  const edgePort = await listen(edge);
  try {
    const health = await raw(edgePort, '/healthz', {host: 'container-local'});
    assert.equal(health.status, 200);
    assert.deepEqual(JSON.parse(health.body), {status: 'ready', upstream_calls: 0});
    assert.equal((await raw(edgePort, '/', {host: 'attacker.example'})).status, 421);
    assert.equal((await raw(edgePort, '/', {method: 'TRACE'})).status, 405);
    assert.equal((await raw(edgePort, 'http://attacker.example/')).status, 400);
    assert.equal((await raw(edgePort, '/not-chat', {method: 'POST'})).status, 400);
    const response = await raw(edgePort, '/api/chat?mode=public', {
      method: 'POST', headers: {'content-type': 'application/json', authorization: 'Bearer must-not-forward'}, body: '{"message":"hello"}',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers['x-frame-options'], 'DENY');
    assert.notEqual(response.headers.connection, 'close');
    assert.deepEqual(seen, [{method: 'POST', url: '/api/chat?mode=public', host: 'public.example', authorization: undefined, body: '{"message":"hello"}'}]);
  } finally {
    await close(edge);
    await close(upstream);
  }
});

test('edge rejects oversized request bodies before contacting the upstream', async () => {
  let calls = 0;
  const upstream = createHttpServer((_req, res) => { calls += 1; res.end('unexpected'); });
  const upstreamPort = await listen(upstream);
  const edge = createEdgeServer({port: 8080, publicHost: 'public.example', upstream: new URL(`http://127.0.0.1:${upstreamPort}`)});
  const edgePort = await listen(edge);
  try {
    const response = await raw(edgePort, '/api/chat', {
      method: 'POST', headers: {'content-type': 'application/json'}, body: 'x'.repeat(64 * 1024 + 1),
    });
    assert.equal(response.status, 413);
    assert.equal(calls, 0);
  } finally {
    await close(edge);
    await close(upstream);
  }
});
