import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decodeCandidateIds} from './candidate-id-decoder-r1.mjs';
test('preserves ordering of integers, exact decimal strings, and bracketed strings', () => {
  assert.deepEqual(decodeCandidateIds('{"candidate_ids":[3,"1","[2]"]}', 3), [3,1,2]);
  assert.deepEqual(decodeCandidateIds('{"candidate_ids":[]}', 3), []);
});
test('rejects ambiguous, duplicate, out-of-range, and expanded output', () => {
  for (const value of [[1,"1"], [0], [4], [true], ["file.java"], [" 1 "], ["1.0"], ["[1"]])
    assert.throws(() => decodeCandidateIds(JSON.stringify({candidate_ids:value}), 3));
  assert.throws(() => decodeCandidateIds('{"candidate_ids":[1],"extra":true}', 3));
  assert.throws(() => decodeCandidateIds('{"candidate_ids":[1,2,3,4,5,6,7,8,9]}', 10));
});
