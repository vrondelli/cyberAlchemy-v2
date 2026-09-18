import test from "node:test";
import assert from "node:assert/strict";
import {generateCandidateHistory} from "./generate-candidate-history.mjs";

test("candidate history is deterministic and preserves evidence gaps", () => {
  const first = generateCandidateHistory();
  assert.equal(first, generateCandidateHistory());
  const history = JSON.parse(first);
  assert.equal(new Set(history.candidates.map(candidate => candidate.candidate_id)).size, history.candidates.length);
  assert.deepEqual(history.missing_candidate_numbers, [9]);
  const candidateNumbers = history.candidates.map(candidate => Number(candidate.candidate_id.match(/\d+$/u)[0]));
  assert.equal(Number(history.candidates.at(-1).candidate_id.match(/\d+$/u)[0]), Math.max(...candidateNumbers));
  assert(history.candidates.at(-1).source_file_count > 100);
  assert(history.candidates.at(-1).delta_from_predecessor.changed > 0);
});
