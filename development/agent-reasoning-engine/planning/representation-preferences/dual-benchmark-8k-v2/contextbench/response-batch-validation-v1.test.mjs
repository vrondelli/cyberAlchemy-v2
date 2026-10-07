import assert from "node:assert/strict";
import test from "node:test";
import {correctiveBatchMessage, validateCompleteResponseBatch} from "./response-batch-validation-v1.mjs";

const tools = {read_file: (args) => typeof args?.path === "string"};
const response = (count, mutate = (value) => value) => ({choices: [{finish_reason: "tool_calls", message: {role: "assistant", reasoning_content: "private reasoning must never enter diagnostics", tool_calls: Array.from({length: count}, (_, index) => mutate({id: `call-${index}`, type: "function", function: {name: "read_file", arguments: JSON.stringify({path: `secret-${index}.txt`})}}, index))}}]});

test("accepts complete batches of one and eight calls", () => {
  assert.equal(validateCompleteResponseBatch(response(1), {tools}).ok, true);
  assert.equal(validateCompleteResponseBatch(response(8), {tools}).ok, true);
});

test("a nine-call response is the only corrective eligibility class", () => {
  const result = validateCompleteResponseBatch(response(9), {tools});
  assert.equal(result.ok, false);
  assert.equal(result.correction_eligible, true);
  assert.equal(result.diagnostic.count, 9);
  assert.equal(JSON.stringify(result).includes("private reasoning"), false);
  assert.equal(JSON.stringify(result).includes("secret-0.txt"), false);
  assert.match(correctiveBatchMessage(), /discarded before any tool execution/);
});

test("malformed batches fail closed without correction", () => {
  const cases = [
    {choices: [{finish_reason: "tool_calls", message: {role: "assistant", tool_calls: []}}]},
    response(1, (call) => ({...call, id: ""})),
    response(2, (call) => ({...call, id: "same"})),
    response(1, (call) => ({...call, type: "other"})),
    response(1, (call) => ({...call, function: {...call.function, name: "unknown"}})),
    response(1, (call) => ({...call, function: {...call.function, arguments: "{"}})),
    response(1, (call) => ({...call, function: {...call.function, arguments: "{}"}})),
    {choices: [{finish_reason: "tool_calls", message: {role: "assistant", reasoning_content: 1, tool_calls: []}}]},
  ];
  for (const item of cases) {
    const result = validateCompleteResponseBatch(item, {tools});
    assert.equal(result.ok, false);
    assert.equal(result.correction_eligible, false);
  }
});
