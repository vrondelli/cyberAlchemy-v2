import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_EXECUTABLE_TOOL_CALLS,
  assessToolBatch,
  rejectOverLimitToolBatch
} from './tool-batch-policy.mjs';

const call = index => ({
  id: `call-${index}`,
  type: 'function',
  function: {name: 'read_file', arguments: JSON.stringify({path: 'x'})}
});

test('eight calls remain executable', () => {
  assert.deepEqual(
    assessToolBatch({tool_calls: Array.from({length: 8}, (_, i) => call(i))}, 'tool_calls'),
    {valid: true, over_limit: false, count: 8}
  );
});

test('nine calls are captured but never executable', () => {
  const message = {tool_calls: Array.from({length: 9}, (_, i) => call(i))};
  const assessment = assessToolBatch(message, 'tool_calls');
  assert.deepEqual(assessment, {valid: true, over_limit: true, count: 9});
  const rejected = rejectOverLimitToolBatch(message);
  assert.equal(rejected.tool_messages.length, 9);
  assert(rejected.tool_messages.every(item =>
    JSON.parse(item.content).execution_succeeded === false
  ));
  assert.match(rejected.feedback, new RegExp(String(MAX_EXECUTABLE_TOOL_CALLS)));
});

test('malformed and duplicate calls remain invalid', () => {
  const duplicate = [call(1), call(1)];
  assert.equal(assessToolBatch({tool_calls: duplicate}, 'tool_calls').valid, false);
  assert.equal(assessToolBatch({tool_calls: []}, 'tool_calls').valid, false);
  assert.equal(assessToolBatch({}, 'tool_calls').valid, false);
});
