import assert from "node:assert/strict";
import test from "node:test";

import {readVerifiedRuntime} from "../client/runtime-verification.js";

const unavailable = () => Object.assign(new Error("private host detail"), {reason: "windows-client.history-unavailable"});

test("browser runtime verification retries only typed unsettled history", async () => {
  let reads = 0;
  const delays = [];
  const runtime = await readVerifiedRuntime(async () => {
    reads += 1;
    if (reads < 3) throw unavailable();
    return {disposition: "idle"};
  }, {delays: [1, 2, 3], pause: async (delay) => { delays.push(delay); }});
  assert.deepEqual(runtime, {disposition: "idle"});
  assert.equal(reads, 3);
  assert.deepEqual(delays, [1, 2]);
});

test("browser runtime verification keeps persistent unavailable history unresolved", async () => {
  let reads = 0;
  await assert.rejects(readVerifiedRuntime(async () => { reads += 1; throw unavailable(); },
    {delays: [1, 2], pause: async () => {}}), (error) => error.reason === "windows-client.history-unavailable");
  assert.equal(reads, 3);
});

test("browser runtime verification does not retry other failures", async () => {
  let reads = 0;
  await assert.rejects(readVerifiedRuntime(async () => { reads += 1; throw new Error("transport stopped"); },
    {delays: [1, 2], pause: async () => {}}), /transport stopped/);
  assert.equal(reads, 1);
});
