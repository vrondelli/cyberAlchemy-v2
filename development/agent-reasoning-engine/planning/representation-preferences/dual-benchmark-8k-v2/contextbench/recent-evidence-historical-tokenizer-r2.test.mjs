import test from 'node:test';
import assert from 'node:assert/strict';
import {createHistoricalPromptTokenizer} from './recent-evidence-historical-tokenizer-r2.mjs';
import {reasoningEvidence} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/accounting-v1/accounting.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';

function fixture({tokens = 100, fail = false, maximum_calls = 2} = {}) {
  const message = {role: 'assistant', content: null, reasoning_content: 'preserve this reasoning', tool_calls: []};
  const historical = {kind: 'model', status: 200, dispatched: true, output_tokens: 10, reasoning_tokens: 7};
  historical.retained_reasoning = reasoningEvidence(message, historical);
  const prompt = stable({messages: [{role: 'user', content: 'task'}, message], tools: []});
  let dispatches = 0;
  const events = [];
  const client = createHistoricalPromptTokenizer({credential_path: '/fixture',
    signal: new AbortController().signal, maximum_calls, token_margin: 512, output_cap: 2048,
    before_dispatch: async () => true, record: async event => events.push(event),
    resolve_credentials: () => ({reference: {provider: 'fixture'}, registry: {consume: async ({consumer}) =>
      consumer(Buffer.from('secret'))}}),
    post: async (url, raw, options) => {
      dispatches++;
      assert.equal(url.href, 'https://api.z.ai/api/paas/v4/tokenizer');
      assert.equal(raw, stable({model: 'glm-5.3-flash', messages: JSON.parse(prompt).messages, tools: []}));
      assert.equal(options.apiKey, 'secret');
      if (fail) { const error = Error('network'); error.code = 'request-failed'; throw error; }
      return {status: 200, bytes: 10, payload: {usage: {prompt_tokens: tokens}}};
    }});
  return {client, prompt, historical, message, events, dispatches: () => dispatches};
}

test('binds historical reasoning without adding a model receipt', async () => {
  const f = fixture();
  const envelope = await f.client.measureHistoricalEnvelope(f.prompt, [f.historical]);
  assert.equal(envelope, 100 + 512 + 7 + 2048 + 2);
  assert.equal(f.dispatches(), 1);
  assert.equal(f.client.receipts.length, 1);
  assert.equal(f.client.receipts[0].kind, 'tokenizer');
  assert.equal(f.client.receipts[0].retained_reasoning_reservation, 7);
  assert.equal(f.client.receipts[0].retained_reasoning_occurrences, 1);
  assert.ok(f.events.length >= 3);
});

test('preserves exact assistant bytes and caches only the same provenance', async () => {
  const f = fixture(), before = f.prompt;
  const first = await f.client.measureHistoricalEnvelope(f.prompt, [f.historical]);
  const second = await f.client.measureHistoricalEnvelope(f.prompt, [f.historical]);
  assert.equal(first, second);
  assert.equal(f.prompt, before);
  assert.equal(f.dispatches(), 1);
  const changed = {...f.historical, output_tokens: 8, reasoning_tokens: 8};
  changed.retained_reasoning = reasoningEvidence(f.message, changed);
  await assert.rejects(f.client.measureHistoricalEnvelope(f.prompt, [changed]), /cached-provenance-drift/);
});

test('fails before dispatch when retained reasoning lacks reviewed provenance', async () => {
  const f = fixture();
  await assert.rejects(f.client.measureHistoricalEnvelope(f.prompt, []), /unbound-retained-reasoning/);
  assert.equal(f.dispatches(), 0);
  assert.equal(f.client.receipts.length, 0);
});

test('records a single failed attempt and never retries', async () => {
  const f = fixture({fail: true});
  await assert.rejects(f.client.measureHistoricalEnvelope(f.prompt, [f.historical]), /network/);
  assert.equal(f.dispatches(), 1);
  assert.equal(f.client.receipts.length, 1);
  assert.equal(f.client.receipts[0].automatic_retries, 0);
  assert.equal(f.client.receipts[0].failure_code, 'request-failed');
});
