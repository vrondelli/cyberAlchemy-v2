import test from 'node:test';
import assert from 'node:assert/strict';
import {createModel} from './glm.mjs';

test('broker-side model sends one fixed closed provider body without credential custody', async () => {
  let observed;
  const model = createModel({post: async (body, options) => {
    observed = {body: JSON.parse(body), optionKeys: Object.keys(options)};
    return {status: 200, payload: {choices: [{index: 0, message: {role: 'assistant', content: 'answer'}, finish_reason: 'stop', logprobs: null}], usage: {prompt_tokens: 3, completion_tokens: 1}}, bytes: 1};
  }});
  const result = await model({messages: [{role: 'user', content: 'hello'}], json: false, signal: new AbortController().signal});
  assert.equal(result.text, 'answer');
  assert.deepEqual(observed.optionKeys, ['signal']);
  assert.equal(observed.body.model, 'glm-5.3-flash'); assert.equal(observed.body.tools, undefined);
  assert.deepEqual(Object.keys(observed.body).sort(), ['max_tokens', 'messages', 'model', 'reasoning_effort', 'stream', 'thinking']);
});

test('invalid broker request fails closed before gateway dispatch', async () => {
  let calls = 0;
  const post = async () => {calls++;};
  const model = createModel({post});
  await assert.rejects(model({messages: [{role: 'user', content: 'hello', tool_calls: []}]}), /broker-request-invalid/);
  assert.equal(calls, 0);
});
