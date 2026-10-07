import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import test from "node:test";

import {sha256PinnedBackend} from "../src/pinned-backend-digest.mjs";

test("pinned backend digest restarts at byte zero after bounded ENOMEM reads", async () => {
  let attempts = 0;
  const delays = [];
  const result = await sha256PinnedBackend("/fixture/codex", {
    streamFactory: () => ({async *[Symbol.asyncIterator]() {
      attempts += 1;
      yield Buffer.from("first");
      if (attempts < 3) throw Object.assign(new Error("not enough memory"), {code: "ENOMEM"});
      yield Buffer.from("second");
    }}),
    delay: async milliseconds => { delays.push(milliseconds); },
  });
  assert.equal(result, createHash("sha256").update("firstsecond").digest("hex"));
  assert.equal(attempts, 3);
  assert.deepEqual(delays, [100, 200]);
});

test("pinned backend digest never retries an unrelated read failure", async () => {
  let attempts = 0;
  const error = Object.assign(new Error("read failed"), {code: "EIO"});
  await assert.rejects(sha256PinnedBackend("/fixture/codex", {
    streamFactory: () => ({async *[Symbol.asyncIterator]() { attempts += 1; throw error; }}),
    delay: async () => { throw new Error("unexpected delay"); },
  }), error);
  assert.equal(attempts, 1);
});

test("pinned backend digest fails closed after three ENOMEM reads", async () => {
  let attempts = 0;
  const error = Object.assign(new Error("not enough memory"), {code: "ENOMEM"});
  await assert.rejects(sha256PinnedBackend("/fixture/codex", {
    streamFactory: () => ({async *[Symbol.asyncIterator]() { attempts += 1; throw error; }}),
    delay: async () => {},
  }), error);
  assert.equal(attempts, 3);
});
