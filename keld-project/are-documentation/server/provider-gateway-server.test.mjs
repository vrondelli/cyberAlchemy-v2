import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createProviderGatewayHandler} from './provider-gateway-server.mjs';

const provider = {model: 'glm-5.3-flash', messages: [{role: 'user', content: 'hello'}], stream: false,
  max_tokens: 2048, thinking: {type: 'enabled'}, reasoning_effort: 'low'};

async function withServer(handler, run) {
  const server = createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

test('provider gateway admits one closed request and supplies only its dedicated credential', async () => {
  let observed;
  const handler = createProviderGatewayHandler({apiKey: 'fixture-key', post: async (body, options) => {
    observed = {body: JSON.parse(body), apiKey: options.apiKey, signal: options.signal};
    return {status: 200, payload: {choices: [], usage: {}}};
  }});
  await withServer(handler, async base => {
    const response = await fetch(`${base}/v1/provider`, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(provider)});
    assert.equal(response.status, 200);
    assert.equal(observed.apiKey, 'fixture-key');
    assert.ok(observed.signal instanceof AbortSignal);
    assert.deepEqual(observed.body, provider);
  });
});

test('provider gateway rejects routes, content types and executable or destination fields before dispatch', async () => {
  let calls = 0;
  const handler = createProviderGatewayHandler({apiKey: 'fixture-key', post: async () => { calls++; }});
  await withServer(handler, async base => {
    assert.equal((await fetch(`${base}/other`)).status, 404);
    assert.equal((await fetch(`${base}/v1/provider`, {method: 'POST', body: '{}'})).status, 415);
    for (const value of [
      {...provider, url: 'https://example.com'},
      {...provider, tools: []},
      {...provider, messages: [{role: 'assistant', content: 'x', tool_calls: []}]},
      {...provider, stream: true},
      {...provider, model: 'other'},
    ]) {
      const response = await fetch(`${base}/v1/provider`, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(value)});
      assert.equal(response.status, 400);
    }
  });
  assert.equal(calls, 0);
});

test('provider gateway fails closed when the transport returns an invalid response envelope', async () => {
  for (const result of [null, {}, {status: 199, payload: {}}, {status: 600, payload: {}}, {status: 200}]) {
    const handler = createProviderGatewayHandler({apiKey: 'fixture-key', post: async () => result});
    await withServer(handler, async base => {
      const response = await fetch(`${base}/v1/provider`, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(provider)});
      assert.equal(response.status, 502);
      assert.deepEqual(await response.json(), {error: 'provider-response-invalid'});
    });
  }
});
