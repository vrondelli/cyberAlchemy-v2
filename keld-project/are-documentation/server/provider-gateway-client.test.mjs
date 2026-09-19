import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer, request as httpRequest} from 'node:http';
import {postProvider} from './provider-gateway-client.mjs';

test('broker provider client uses only the fixed internal gateway route and bounded JSON response', async () => {
  const server = createServer((req, res) => {
    assert.equal(req.method, 'POST');
    assert.equal(req.url, '/v1/provider');
    res.writeHead(200, {'content-type': 'application/json'});
    res.end('{"answer":"fixture"}');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let fixed;
  const requestImpl = (options, callback) => {
    fixed = options;
    return httpRequest({...options, host: '127.0.0.1', port: server.address().port}, callback);
  };
  try {
    const response = await postProvider('{"fixture":true}', {requestImpl});
    assert.deepEqual(response.payload, {answer: 'fixture'});
    assert.equal(fixed.host, 'provider-gateway');
    assert.equal(fixed.port, 4195);
    assert.equal(fixed.path, '/v1/provider');
    assert.equal(fixed.method, 'POST');
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('broker provider client fails closed on invalid input and oversized or non-JSON response', async () => {
  assert.throws(() => postProvider('x'.repeat(32769)), /provider-request-invalid/);
  for (const headers of [
    {'content-type': 'text/plain'},
    {'content-type': 'application/json', 'content-length': '262145'},
    {'content-type': 'application/json', 'content-encoding': 'gzip'},
  ]) {
    const server = createServer((_req, res) => { res.writeHead(200, headers); res.end('{}'); });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const requestImpl = (options, callback) => httpRequest({...options, host: '127.0.0.1', port: server.address().port}, callback);
      await assert.rejects(postProvider('{}', {requestImpl}), /provider-response-invalid/);
    } finally { await new Promise(resolve => server.close(resolve)); }
  }
});
