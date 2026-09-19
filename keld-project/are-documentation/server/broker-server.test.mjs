import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {brokerQuotaOptionsFromEnv, createBrokerHandler} from './broker-server.mjs';
import {digest, MODEL} from './model-protocol.mjs';

const fixture = text => ({text, receipt: {model: MODEL, live_model_invoked: true, input_tokens: 8, output_tokens: 2,
  reasoning_tokens: null, cached_tokens: null, elapsed_ms: 3, request_digest: 'c'.repeat(64), response_digest: digest(text)}});

test('broker admits only the fixed generate route and closed request shape', async () => {
  let calls = 0, charged;
  const quota = {acquire: async () => ({complete: async usage => {charged = usage;}})};
  const server = createServer(createBrokerHandler({model: async input => {calls++; assert.equal(input.signal instanceof AbortSignal, true); return fixture('ok');}, quota}));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const good = await fetch(base + '/v1/generate', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({messages: [{role: 'user', content: 'hello'}], json: false})});
    assert.equal(good.status, 200); assert.equal((await good.json()).text, 'ok');
    for (const [path, body, status] of [
      ['/v1/other', {messages: [{role: 'user', content: 'hello'}], json: false}, 404],
      ['/v1/generate', {messages: [{role: 'user', content: 'hello'}], json: false, url: 'https://example.com'}, 400],
      ['/v1/generate', {messages: [{role: 'tool', content: 'hello'}], json: false}, 400],
    ]) {
      const response = await fetch(base + path, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(body)});
      assert.equal(response.status, status);
    }
    assert.equal(calls, 1);
    assert.deepEqual(charged, {inputTokens: 8, outputTokens: 2});
  } finally {await new Promise(resolve => server.close(resolve));}
});

test('broker fails closed when durable quota rejects or cannot persist', async () => {
  for (const [message, status] of [
    ['broker-token-limit', 429], ['broker-hourly-spend-limit', 429],
    ['broker-monthly-spend-limit', 429], ['broker-quota-unavailable', 503],
  ]) {
    let calls = 0;
    const server = createServer(createBrokerHandler({model: async () => {calls++; return fixture('unexpected');},
      quota: {acquire: async () => {throw new Error(message);}}}));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/v1/generate`, {method: 'POST', headers: {'content-type': 'application/json'},
        body: JSON.stringify({messages: [{role: 'user', content: 'hello'}], json: false})});
      assert.equal(response.status, status);
      assert.equal((await response.json()).error, message);
      assert.equal(calls, 0);
    } finally {await new Promise(resolve => server.close(resolve));}
  }
});

test('broker requires explicit owner-supplied monetary ceilings and rates', () => {
  assert.throws(() => brokerQuotaOptionsFromEnv({}), /broker-config-are_broker_hourly_call_limit-required/);
  assert.deepEqual(brokerQuotaOptionsFromEnv({
    ARE_BROKER_HOURLY_CALL_LIMIT: '240',
    ARE_BROKER_HOURLY_TOKEN_LIMIT: '500000',
    ARE_BROKER_HOURLY_MICROUSD_LIMIT: '500000',
    ARE_BROKER_MONTHLY_MICROUSD_LIMIT: '5000000',
    ARE_PROVIDER_INPUT_MICROUSD_PER_MILLION_TOKENS: '200000',
    ARE_PROVIDER_OUTPUT_MICROUSD_PER_MILLION_TOKENS: '1000000',
  }), {
    maximumCalls: 240,
    maximumTokens: 500000,
    maximumHourlyMicrousd: 500000,
    maximumMonthlyMicrousd: 5000000,
    inputMicrousdPerMillionTokens: 200000,
    outputMicrousdPerMillionTokens: 1000000,
  });
});
