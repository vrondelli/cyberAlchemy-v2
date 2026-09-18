import test from 'node:test';
import assert from 'node:assert/strict';
import {createBrokerModel} from './broker-client.mjs';
import {digest, MODEL} from './model-protocol.mjs';

const reply = text => ({text, receipt: {model: MODEL, live_model_invoked: true, input_tokens: 10, output_tokens: 2,
  reasoning_tokens: null, cached_tokens: null, elapsed_ms: 5, request_digest: 'a'.repeat(64), response_digest: digest(text)}});

test('broker client sends only the closed inference envelope and validates the reply', async () => {
  let observed;
  const model = createBrokerModel({fetchImpl: async (url, options) => {
    observed = {url, options}; return new Response(JSON.stringify(reply('hello')), {status: 200, headers: {'content-type': 'application/json'}});
  }});
  assert.equal((await model({messages: [{role: 'user', content: 'hi'}], json: false})).text, 'hello');
  assert.equal(observed.url, 'http://127.0.0.1:4194/v1/generate');
  assert.deepEqual(JSON.parse(observed.options.body), {messages: [{role: 'user', content: 'hi'}], json: false});
  assert.equal(observed.options.redirect, 'error');
});

test('broker endpoint and response fail closed', async () => {
  assert.throws(() => createBrokerModel({endpoint: 'http://127.0.0.1:4194/other'}), /broker-endpoint-forbidden/);
  assert.throws(() => createBrokerModel({endpoint: 'https://example.com/v1/generate'}), /broker-endpoint-forbidden/);
  for (const value of [
    {...reply('hello'), tool_calls: []},
    {text: 'hello', receipt: {...reply('hello').receipt, response_digest: 'b'.repeat(64)}},
  ]) {
    const model = createBrokerModel({fetchImpl: async () => new Response(JSON.stringify(value), {status: 200, headers: {'content-type': 'application/json'}})});
    await assert.rejects(model({messages: [{role: 'user', content: 'hi'}]}), /broker-response-invalid/);
  }
});

test('visitor-controlled fields cannot select a URL or add protocol keys', async () => {
  const model = createBrokerModel({fetchImpl: async () => {throw new Error('must-not-dispatch');}});
  await assert.rejects(model({messages: [{role: 'user', content: 'hi'}], endpoint: 'https://example.com', tools: []}), /broker-request-invalid/);
  await assert.rejects(model({messages: [{role: 'user', content: 'hi', tool_calls: []}]}), /broker-request-invalid/);
});
