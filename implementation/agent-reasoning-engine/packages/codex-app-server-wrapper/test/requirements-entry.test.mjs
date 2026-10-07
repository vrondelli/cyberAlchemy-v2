import assert from "node:assert/strict";
import test from "node:test";

import {prepareRequirementEntry} from "../client/requirements-entry.js";

test("hosted form distinguishes absent, explicit empty, and explicit requirements", () => {
  assert.deepEqual(prepareRequirementEntry("", false), {ok: true});
  assert.deepEqual(prepareRequirementEntry("", true), {ok: true, requirements: []});
  assert.deepEqual(prepareRequirementEntry("citations\n table ", false),
    {ok: false, reason: "confirmation-required"});
  assert.deepEqual(prepareRequirementEntry("citations\r\ntable", true),
    {ok: true, requirements: ["citations", "table"]});
});

test("hosted form rejects duplicate and oversized requirement lists", () => {
  assert.deepEqual(prepareRequirementEntry("citations\ncitations", true),
    {ok: false, reason: "invalid-list"});
  assert.deepEqual(prepareRequirementEntry("a".repeat(2049), true),
    {ok: false, reason: "invalid-list"});
  assert.deepEqual(prepareRequirementEntry(Array.from({length: 65}, (_, index) => `item ${index}`).join("\n"), true),
    {ok: false, reason: "invalid-list"});
});
