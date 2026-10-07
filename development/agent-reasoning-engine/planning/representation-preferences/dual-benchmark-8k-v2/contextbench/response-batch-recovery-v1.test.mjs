import assert from "node:assert/strict";
import test from "node:test";
import {runResponseBatchRecovery} from "./response-batch-recovery-v1.mjs";

const response = (count) => ({choices: [{finish_reason: "tool_calls", message: {role: "assistant", reasoning_content: "hidden", tool_calls: Array.from({length: count}, (_, index) => ({id: `call-${index}`, type: "function", function: {name: "read_file", arguments: JSON.stringify({path: `src/${index}.js`})}}))}}]});
const receipt = (tokens) => ({request_sha256: "a".repeat(64), usage: {total_tokens: tokens}});
const tools = {read_file: (args) => typeof args.path === "string"};

test("nine calls are fully discarded, accounted and corrected once before execution", async () => {
  const queue = [{response: response(9), receipt: receipt(100)}, {response: response(2), receipt: receipt(200)}];
  const executed = [], feedback = [], events = [];
  const result = await runResponseBatchRecovery({tools, dispatch: async (request) => { feedback.push(request.feedback); return queue.shift(); }, execute_tool: async (...args) => { executed.push(args); return {ok: true}; }, acknowledge_transport: async () => {}, acknowledge_recycler: async () => {}, persist: async (event) => events.push(event)});
  assert.equal(result.calls, 2);
  assert.equal(result.tokens, 300);
  assert.equal(result.corrections, 1);
  assert.equal(executed.length, 2);
  assert.equal(feedback[0], null);
  assert.match(feedback[1], /at most 8/);
  assert.equal(result.events[0].no_tool_executed, true);
  assert.ok(events.some((event) => event.kind === "response-recovery-pending"));
});

test("a second over-limit response fails without tools or a third dispatch", async () => {
  let dispatches = 0, executions = 0;
  await assert.rejects(runResponseBatchRecovery({tools, dispatch: async () => { dispatches += 1; return {response: response(9), receipt: receipt(10)}; }, execute_tool: async () => { executions += 1; }, acknowledge_transport: async () => {}, acknowledge_recycler: async () => {}, persist: async () => {}}), (error) => error.code === "response-recovery.response-invalid");
  assert.equal(dispatches, 2);
  assert.equal(executions, 0);
});

test("unknown usage and token overflow block before tool execution", async () => {
  for (const item of [{response: response(1), receipt: {}}, {response: response(1), receipt: receipt(101)}]) {
    let executions = 0;
    await assert.rejects(runResponseBatchRecovery({tools, limits: {maximum_calls: 2, maximum_tokens: 100, maximum_executable_tool_calls: 8}, dispatch: async () => item, execute_tool: async () => { executions += 1; }, acknowledge_transport: async () => {}, acknowledge_recycler: async () => {}, persist: async () => {}}));
    assert.equal(executions, 0);
  }
});

test("a crash at either acknowledgement boundary fails closed without redispatch", async () => {
  for (const failAt of ["transport", "recycler"]) {
    let dispatches = 0, executions = 0;
    await assert.rejects(runResponseBatchRecovery({tools, dispatch: async () => { dispatches += 1; return {response: response(9), receipt: receipt(10)}; }, execute_tool: async () => { executions += 1; }, acknowledge_transport: async () => { if (failAt === "transport") throw Error("crash"); }, acknowledge_recycler: async () => { if (failAt === "recycler") throw Error("crash"); }, persist: async () => {}}), (error) => error.code === "response-recovery-ack-uncertain" && error.no_blind_replay === true);
    assert.equal(dispatches, 1);
    assert.equal(executions, 0);
  }
});
