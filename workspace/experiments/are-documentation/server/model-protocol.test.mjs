import test from 'node:test';
import assert from 'node:assert/strict';
import {parseProviderResponse} from './model-protocol.mjs';

const valid = () => ({
  id: 'fixture',
  choices: [{index: 0, message: {role: 'assistant', content: 'Safe answer.', reasoning_content: null}, finish_reason: 'stop', logprobs: null}],
  usage: {prompt_tokens: 20, completion_tokens: 4, prompt_tokens_details: {cached_tokens: 3}, completion_tokens_details: {reasoning_tokens: 2}},
});

test('admits exactly one plain assistant-text choice with bounded accounting', () => {
  assert.deepEqual(parseProviderResponse(valid()), {
    text: 'Safe answer.',
    usage: {prompt_tokens: 20, completion_tokens: 4, reasoning_tokens: 2, cached_tokens: 3},
  });
});

test('rejects every executable or unsupported message variant even when empty or malformed', () => {
  for (const mutation of [
    message => {message.tool_calls = [];},
    message => {message.tool_calls = {};},
    message => {message.tool_calls = [{type: 'function', function: {name: 'run', arguments: '{}'}}];},
    message => {message.function_call = {name: 'run', arguments: '{}'};},
    message => {message.audio = {id: 'audio'};},
    message => {message.refusal = 'no';},
    message => {message.execute = true;},
  ]) {
    const payload = valid(); mutation(payload.choices[0].message);
    assert.throws(() => parseProviderResponse(payload), error => error.code === 'provider-response-invalid');
  }
});

test('rejects alternate choice types, ambiguous multiplicity and invalid text', () => {
  for (const mutate of [
    payload => {payload.choices[0].finish_reason = 'tool_calls';},
    payload => {payload.choices[0].finish_reason = 'content_filter';},
    payload => {payload.choices[0].message.role = 'tool';},
    payload => {payload.choices[0].message.content = '   ';},
    payload => {payload.choices.push(structuredClone(payload.choices[0]));},
    payload => {payload.choices[0].delta = {content: 'stream'};},
  ]) {
    const payload = valid(); mutate(payload);
    assert.throws(() => parseProviderResponse(payload), error => error.code === 'provider-response-invalid');
  }
});

test('maps token truncation separately and rejects unbounded or malformed usage', () => {
  const limited = valid(); limited.choices[0].finish_reason = 'length';
  assert.throws(() => parseProviderResponse(limited), error => error.code === 'provider-output-limit');
  for (const mutate of [
    payload => {payload.usage.prompt_tokens = -1;},
    payload => {payload.usage.prompt_tokens = 34801;},
    payload => {payload.usage.completion_tokens = 2049;},
    payload => {payload.usage.completion_tokens_details.reasoning_tokens = '2';},
    payload => {delete payload.usage;},
  ]) {
    const payload = valid(); mutate(payload);
    assert.throws(() => parseProviderResponse(payload), error => error.code === 'provider-usage-invalid');
  }
});
