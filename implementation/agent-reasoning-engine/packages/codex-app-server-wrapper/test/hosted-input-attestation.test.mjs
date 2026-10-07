import assert from "node:assert/strict";
import test from "node:test";

import {signHostedInput, verifyHostedInput} from "../src/hosted-input-attestation.mjs";

const key = "a".repeat(64);
const request = {consumer_id: "codex:human-chat", method: "turn/start",
  params: {threadId: "thread-one", input: [{type: "text", text: "Correct this answer"}]},
  request_key: "turn:one"};

test("hosted input proof binds the consumer, operation, exact text, and stable request key", () => {
  const signature = signHostedInput({key, ...request});
  assert.equal(verifyHostedInput({key, signature, ...request}), true);
  assert.equal(verifyHostedInput({key, signature, ...request, consumer_id: "codex:other"}), false);
  assert.equal(verifyHostedInput({key, signature, ...request, request_key: "turn:two"}), false);
  assert.equal(verifyHostedInput({key, signature, ...request,
    params: {threadId: "thread-one", input: [{type: "text", text: "Different text"}]}}), false);
  assert.equal(verifyHostedInput({key, signature, ...request, method: "cyberalchemy/learning/submitFeedback"}), false);
});

test("hosted input proof fails closed for invalid keys, signatures, and methods", () => {
  assert.equal(verifyHostedInput({key: "short", signature: "b".repeat(64), ...request}), false);
  assert.equal(verifyHostedInput({key, signature: "not-hex", ...request}), false);
  assert.throws(() => signHostedInput({key, ...request, method: "thread/read"}), /supported request/);
});

test("hosted steering proof binds the exact active turn, correction, and retry key", () => {
  const steer = {consumer_id: "codex:human-chat", method: "turn/steer",
    params: {threadId: "thread-one", expectedTurnId: "turn-one",
      input: [{type: "text", text: "Use the second source"}]}, request_key: "steer:one"};
  const signature = signHostedInput({key, ...steer});
  assert.equal(verifyHostedInput({key, signature, ...steer}), true);
  assert.equal(verifyHostedInput({key, signature, ...steer, request_key: "steer:two"}), false);
  assert.equal(verifyHostedInput({key, signature, ...steer,
    params: {...steer.params, expectedTurnId: "turn-two"}}), false);
  assert.equal(verifyHostedInput({key, signature, ...steer,
    params: {...steer.params, input: [{type: "text", text: "Different correction"}]}}), false);
});
