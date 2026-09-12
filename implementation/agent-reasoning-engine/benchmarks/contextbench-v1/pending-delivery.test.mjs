import test from 'node:test';
import assert from 'node:assert/strict';
import {retainPendingToolExchange} from './pending-delivery.mjs';
const exchange = [
  {role: 'assistant', tool_calls: [{id: 'a', function: {name: 'read_file', arguments: '{}'}}, {id: 'b', function: {name: 'search', arguments: '{}'}}]},
  {role: 'tool', tool_call_id: 'a', content: 'source a'},
  {role: 'tool', tool_call_id: 'b', content: 'source b'}];
test('restore complete first-delivery exchange after full recycling', () => {
  assert.deepEqual(retainPendingToolExchange([], exchange), exchange);
});
test('full visible exchange remains once without added presentation tokens', () => {
  const visible = [{role: 'user', content: 'earlier'}, ...exchange];
  assert.equal(retainPendingToolExchange(visible, exchange), visible);
});
test('partial retained results are reassembled in valid order once', () => {
  assert.deepEqual(retainPendingToolExchange([exchange[2]], exchange), exchange);
});
test('incomplete or ambiguous tool groups fail explicitly', () => {
  assert.throws(() => retainPendingToolExchange([], exchange.slice(0, 2)), /complete-results-required/);
  assert.throws(() => retainPendingToolExchange([], [exchange[0], exchange[1], exchange[1]]), /complete-results-required/);
});
