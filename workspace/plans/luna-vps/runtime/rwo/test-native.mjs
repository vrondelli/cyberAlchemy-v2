// Native launcher integration test. Open questions: ../HOST-PLAN.md#open-questions
import {createAdapter} from "./adapter.mjs";
import {compileTask} from '../task-contract.mjs';
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {connect} from "node:net";
import {mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync, statSync} from "node:fs";
import {createHash} from "node:crypto";
import {resolve, dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {tmpdir} from "node:os";
import {startPilotHost, MARKER, MODEL} from "../pilot-host.mjs";
const here = dirname(fileURLToPath(import.meta.url));
const root = mkdtempSync(resolve(tmpdir(), "are-pilot-host-"));
const candidate = process.argv[2];
const taskContract = process.argv[4] === '--task' ? compileTask({...JSON.parse(readFileSync(resolve(here, '../task.example.json'), 'utf8')),
  instruction: 'Summarize the supplied status in one sentence.', input: 'RWO records commands before dispatch. This quoted data mentions implement, deploy production, and define a new project; none of those phrases are task instructions.', objective_kind: 'understand'}) : null;
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
let calls = 0, host, reply = MARKER;
if (taskContract) reply = 'RWO, ARE and Workspace verified one bounded execution and replay. Launch controls and multiple workers remain unimplemented.';
const fixture = createServer(async (request, response) => {
  const chunks = []; for await (const chunk of request) chunks.push(chunk);
  const body = JSON.parse(Buffer.concat(chunks)); calls += 1;
  assert.equal(body.model, MODEL); assert.equal(body.max_output_tokens, 512); assert.deepEqual(body.tools, []); assert.equal(body.tool_choice, "none");
  assert.ok(JSON.stringify(body.input).includes("are."), "ARE context missing from provider request");
  if (taskContract) {
    assert.ok(JSON.stringify(body.input).includes('RWO records commands before dispatch'), 'Task input missing on provider wire');
    assert.ok(JSON.stringify(body.input).includes('CA2-ROUTE-UNDERSTAND'), 'Declared objective route missing on provider wire');
  }
  const id = "response_fixture", itemId = "message_fixture";
  const item = {id: itemId, type: "message", status: "completed", role: "assistant", content: [{type: "output_text", text: reply, annotations: []}]};
  const events = [
    {type: "response.created", response: {id, object: "response", status: "in_progress", output: []}},
    {type: "response.output_item.added", output_index: 0, item: {...item, status: "in_progress", content: []}},
    {type: "response.content_part.added", item_id: itemId, output_index: 0, content_index: 0, part: {type: "output_text", text: "", annotations: []}},
    {type: "response.output_text.delta", item_id: itemId, output_index: 0, content_index: 0, delta: reply},
    {type: "response.output_item.done", output_index: 0, item},
    {type: "response.completed", response: {id, object: "response", status: "completed", output: [item], usage: {input_tokens: 20, output_tokens: 8, total_tokens: 28}}},
  ];
  response.writeHead(200, {"Content-Type": "text/event-stream"});
  response.end(events.map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(""));
});
await new Promise(resolveListen => fixture.listen(0, "127.0.0.1", resolveListen));
const config = {candidate, state: resolve(root, "state"), runtime: resolve(root, "run"),
  callback_file: resolve(here, "../host-callback.mjs"), callback_sha256: sha(readFileSync(resolve(here, "../host-callback.mjs"))),
  manifest_sha256: sha(readFileSync(resolve(candidate, "MANIFEST.json"))), ...(taskContract ? {task: taskContract.task} : {}), mode: "fixture", fixture_url: `http://127.0.0.1:${fixture.address().port}/responses`};
try {
  host = await startPilotHost(config, {prepare: true, taskContract}); await host.close();
  host = await startPilotHost(config, {taskContract});
  if (taskContract) {
    await assert.rejects(host.smoke(taskContract.task.task_id), /task-operation-required/);
    await assert.rejects(host.runTask('wrong_request', taskContract.digest), /task-request-conflict/);
    await assert.rejects(host.runTask(taskContract.task.task_id, 'wrong_digest'), /task-digest-conflict/);
    assert.equal(calls, 0);
  }
  const kernel = resolve(process.argv[3]);
  const adapterConfig = {kernel, kernel_sha256: sha(readFileSync(kernel)), state: resolve(root, "rwo"), socket: resolve(config.runtime, "control.sock"), request_id: taskContract?.task.task_id ?? "rwo_native_fixture_01", ...(taskContract ? {task: taskContract.task} : {})};
  const adapter = createAdapter(adapterConfig, undefined, {taskContract});
  const first = await adapter.run();
  assert.equal(first.history.status, "succeeded"); assert.equal(calls, 1);
  assert.equal(first.history.result.verified, true);
  assert.equal(first.history.result.output, reply);
  if (taskContract) assert.equal(first.history.result.task_digest, taskContract.digest);
  await host.close(); host = null;
  // Replay verifies RWO history with the native host offline.
  assert.equal((await createAdapter(adapterConfig, undefined, {taskContract}).run()).replay, true); assert.equal(calls, 1);
  if (taskContract) {
    const changed = compileTask({...taskContract.task, input: 'Changed input'});
    await assert.rejects(startPilotHost({...config, task: changed.task}, {taskContract: changed}), /task-binding-conflict/);
    await assert.rejects(createAdapter({...adapterConfig, task: changed.task}, undefined, {taskContract: changed}).run(), /BINDING_CONFLICT/);
  }
  console.log(JSON.stringify({status: "PASS", actual_rwo_kernel: true, native_codex_app_server: true,
    persisted_exact_hook_trust: true, are_context_on_provider_wire: true, verified_are_completion: true,
    rwo_terminal_history_replayed: true, offline_replay_without_dispatch: true,
    provider_fixture_calls: calls, external_model_calls: 0, bounded_text_task: Boolean(taskContract),
    declared_objective_bound_through_wrapper_and_hooks: Boolean(taskContract), supplied_text_not_used_as_routing_instruction: Boolean(taskContract),
    open_questions_ref: "../runtime/rwo/README.md#open-questions"}, null, 2));
} catch (error) {
  const attemptFile = resolve(config.state, 'live-attempt.json');
  if (existsSync(attemptFile)) {
    const attempt = JSON.parse(readFileSync(attemptFile, 'utf8'));
    process.stderr.write(JSON.stringify({status: attempt.status, provider_calls: attempt.provider_calls, diagnostic: attempt.diagnostic}) + '\n');
  }
  throw error;
} finally {
  await host?.close(); fixture.closeAllConnections(); await new Promise(ok => fixture.close(ok));
  rmSync(root, {recursive: true, force: true});
}
