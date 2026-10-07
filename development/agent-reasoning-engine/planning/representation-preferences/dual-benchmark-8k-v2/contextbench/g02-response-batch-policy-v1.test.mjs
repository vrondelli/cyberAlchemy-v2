import assert from "node:assert/strict";
import test from "node:test";
import {assessResponseBatch, correctiveBatchMessages} from "./g02-response-batch-policy-v1.mjs";

const validators = {read_file: (args) => typeof args.path === "string"};
const calls = (count, name = "read_file", args = '{"path":"x"}') => Array.from({length: count}, (_, index) => ({id: `call-${index}`, type: "function", function: {name, arguments: args}}));

test("accepts terminal stop only without tool calls and accepts one through eight executable calls", () => {
  assert.equal(assessResponseBatch({content: "done"}, "stop", {validators}).kind, "terminal");
  for (const tool_calls of [calls(1), {}, "bad", null, []]) assert.equal(assessResponseBatch({content: "done", tool_calls}, "stop", {validators}).valid, false);
  for (const count of [1, 8]) { const result = assessResponseBatch({tool_calls: calls(count)}, "tool_calls", {validators}); assert.equal(result.valid, true); assert.equal(result.recoverable, false); }
});

test("only structurally and schema-valid batches from nine through 32 are recoverable", () => {
  for (const count of [9, 32]) { const message = {tool_calls: calls(count)}, result = assessResponseBatch(message, "tool_calls", {validators}); assert.equal(result.recoverable, true); assert.equal(correctiveBatchMessages(message, result, {validators}).tool_messages.length, count); }
  for (const value of [undefined, [], calls(33)]) assert.equal(assessResponseBatch({tool_calls: value}, "tool_calls", {validators}).valid, false);
  const duplicate = calls(9); duplicate[8].id = duplicate[0].id; assert.equal(assessResponseBatch({tool_calls: duplicate}, "tool_calls", {validators}).valid, false);
  assert.equal(assessResponseBatch({tool_calls: calls(9, "read_file", "bad-json")}, "tool_calls", {validators}).valid, false);
  assert.equal(assessResponseBatch({tool_calls: calls(9, "unknown")}, "tool_calls", {validators}).valid, false);
  assert.equal(assessResponseBatch({tool_calls: calls(9, "toString")}, "tool_calls", {validators}).valid, false);
  assert.equal(assessResponseBatch({tool_calls: calls(9)}, "tool_calls", {validators: {read_file: () => { throw new Error("validator"); }}}).valid, false);
  for (const count of [8, 9, 32, 33]) { const batch = calls(count); batch[Math.min(count - 1, 4)].function.arguments = "bad"; assert.equal(assessResponseBatch({tool_calls: batch}, "tool_calls", {validators}).valid, false); }
});

test("correction is bound to the exact assessed response and clones private replay", () => {
  const message = {tool_calls: calls(9)}, assessment = assessResponseBatch(message, "tool_calls", {validators});
  const other = {tool_calls: calls(9)}; other.tool_calls[0].function.arguments = '{"path":"different"}';
  assert.throws(() => correctiveBatchMessages(other, assessment, {validators}), /not-recoverable/);
  const correction = correctiveBatchMessages(message, assessment, {validators}); message.tool_calls[0].id = "mutated";
  assert.equal(correction.assistant_message.tool_calls[0].id, "call-0");
});

test("diagnostics are bounded and redact ids, arguments and unknown names", () => {
  const result = assessResponseBatch({tool_calls: calls(33, "private_tool_name", '{"secret":"value"}')}, "tool_calls", {validators});
  assert.equal(result.diagnostic.calls.length, 16); assert.equal(result.diagnostic.truncated, true);
  const serialized = JSON.stringify(result.diagnostic);
  assert.equal(serialized.includes("call-0"), false); assert.equal(serialized.includes("secret"), false); assert.equal(serialized.includes("private_tool_name"), false);
});
