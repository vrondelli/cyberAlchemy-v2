// Native launcher integration test. Open questions: ../HOST-PLAN.md#open-questions
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {connect} from "node:net";
import {mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync, statSync} from "node:fs";
import {createHash} from "node:crypto";
import {resolve, dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {tmpdir} from "node:os";
import {startPilotHost, MARKER, MODEL} from "./pilot-host.mjs";
const here = dirname(fileURLToPath(import.meta.url));
const root = mkdtempSync(resolve(tmpdir(), "are-pilot-host-"));
const candidate = process.argv[2];
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
let calls = 0, host, reply = MARKER;
const fixture = createServer(async (request, response) => {
  const chunks = []; for await (const chunk of request) chunks.push(chunk);
  const body = JSON.parse(Buffer.concat(chunks)); calls += 1;
  assert.equal(body.model, MODEL); assert.equal(body.max_output_tokens, 512); assert.deepEqual(body.tools, []); assert.equal(body.tool_choice, "none");
  assert.ok(JSON.stringify(body.input).includes("are."), "ARE context missing from provider request");
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
  callback_file: resolve(here, "host-callback.mjs"), callback_sha256: sha(readFileSync(resolve(here, "host-callback.mjs"))),
  manifest_sha256: sha(readFileSync(resolve(candidate, "MANIFEST.json"))), mode: "fixture", fixture_url: `http://127.0.0.1:${fixture.address().port}/responses`};
const request = input => new Promise((resolveResponse, reject) => {
  const socket = connect(resolve(config.runtime, "control.sock")); let output = "";
  socket.on("connect", () => socket.write(JSON.stringify(input) + "\n"));
  socket.on("data", chunk => output += chunk); socket.on("error", reject); socket.on("end", () => resolveResponse(JSON.parse(output)));
});
try {
  await assert.rejects(startPilotHost(config), /hook-approval-required/);
  host = await startPilotHost(config, {prepare: true}); await host.close();
  assert.ok(!existsSync(resolve(config.state, "host.lock")));
  host = await startPilotHost(config);
  assert.equal(host.status().ready, true);
  assert.equal(statSync(resolve(config.runtime, "control.sock")).mode & 0o777, 0o600);
  assert.equal((await request({op: "status"})).result.hook_trust, "verified-persisted-exact-hashes");
  assert.equal((await request({op: "shell", command: "true"})).ok, false);
  const result = await request({op: "smoke", request_id: "fixture_one"});
  assert.equal(result.ok, true, JSON.stringify(result)); assert.equal(result.result.output, MARKER);
  assert.equal((await request({op: "smoke", request_id: "fixture_one"})).result.status, "passed");
  assert.equal((await request({op: "smoke", request_id: "fixture_two"})).ok, false); assert.equal(calls, 1);
  await host.close(); host = null;
  host = await startPilotHost(config);
  assert.equal((await request({op: "smoke", request_id: "fixture_one"})).result.status, "passed"); assert.equal(calls, 1);
  await host.close(); host = null;
  writeFileSync(resolve(config.state, "host.lock"), "interrupted");
  await assert.rejects(startPilotHost(config), /EEXIST/);
  const failedConfig = {...config, state: resolve(root, "failed-state"), runtime: resolve(root, "failed-run")};
  host = await startPilotHost(failedConfig, {prepare: true}); await host.close();
  host = await startPilotHost(failedConfig); reply = "WRONG_REPLY";
  await assert.rejects(host.smoke("failure_one"), /output-mismatch/);
  await assert.rejects(host.smoke("failure_two"), /already-recorded/);
  await host.close(); host = null;
  assert.ok(existsSync(resolve(failedConfig.state, "host.lock")));
  assert.equal(JSON.parse(readFileSync(resolve(failedConfig.state, "live-attempt.json"))).status, "uncertain");
  await assert.rejects(startPilotHost(failedConfig), /EEXIST/);
  console.log(JSON.stringify({status: "PASS", persisted_trust_without_bypass: true, callback_context_verified: true,
    single_call_limit: true, exact_reply_verified: true, stable_replay_across_clean_restart: true,
    stale_lock_blocks_start: true, private_control_socket: true, external_model_calls: 0,
    failed_outcome_blocks_replay_and_restart: true, provider_calls: calls, open_questions_ref: "../HOST-PLAN.md#open-questions"}, null, 2));
} finally {
  await host?.close(); fixture.closeAllConnections(); await new Promise(resolveClose => fixture.close(resolveClose));
  rmSync(root, {recursive: true, force: true});
}
