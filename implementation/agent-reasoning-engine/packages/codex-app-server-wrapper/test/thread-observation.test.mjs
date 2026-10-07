import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {randomUUID} from "node:crypto";
import {once} from "node:events";
import {mkdtempSync, rmSync} from "node:fs";
import {createServer} from "node:net";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {promisify} from "node:util";

import {projectGatewayThreadObservation, projectWrapperReasoningThreads, validLearningFeedbackObservation} from "../src/thread-observation.mjs";
import {digestValue} from "../src/canonical.mjs";
import {materializeReasoningPlanContext} from "../../reasoning-state-runtime/index.mjs";
import {readGatewayThreadObservation} from "../src/thread-observation-client.mjs";
import {THREAD_OBSERVATION_RESPONSE_SCHEMA} from "../src/gateway.mjs";

const digest = (letter) => letter.repeat(64);
const execFileAsync = promisify(execFile);

function feedbackSummary(fields = {}) {
  const value = {schema_version: 'are.learning-feedback-observation/v1', source: 'learning-owner',
    binding_ref: digest('a'), status: 'observed', mode: 'apply-scoped', durability: 'append-only-file-fsync',
    state_digest: digest('b'), checkpoint_digest: digest('c'), pending_feedback_count: 2,
    retained_lesson_count: 1, disabled_lesson_count: 0, dispatched_application_count: 3,
    evaluated_application_count: 1, authority_effect: 'none', ...fields};
  return {...value, observation_digest: digestValue(value)};
}

test('learning feedback projection verifies closed digest-bound counters and keeps exact private thread association', () => {
  const valid = feedbackSummary(); assert.equal(validLearningFeedbackObservation(valid), true);
  assert.equal(validLearningFeedbackObservation(null), true);
  for (const invalid of [feedbackSummary({prompt: 'private'}), {...valid, pending_feedback_count: 3},
    feedbackSummary({disabled_lesson_count: 2}), feedbackSummary({evaluated_application_count: 4}),
    feedbackSummary({status: 'disabled'}), feedbackSummary({status: 'no-records'}),
    feedbackSummary({pending_feedback_count: -1}), feedbackSummary({durability: 'unknown'})]) {
    assert.equal(validLearningFeedbackObservation(invalid), false);
  }
  const privateIds = [];
  const rows = projectWrapperReasoningThreads({active: ['private:a', 'private:b'].map(thread_id => ({thread_id,
    reasoning_epoch_digest: digest('d'), reasoning_checkpoint_digest: digest('e')})),
    learning_observer: thread => {privateIds.push(thread); return feedbackSummary({binding_ref: digestValue(thread),
      pending_feedback_count: thread === 'private:a' ? 1 : 2});}});
  assert.deepEqual(privateIds.sort(), ['private:a', 'private:b']);
  const publicRows = projectGatewayThreadObservation({runtime_epoch_id: 'epoch:feedback', observed_at_unix_ms: Date.now(),
    sessions: [{consumer_id: 'private:consumer', threads: rows}]}).threads;
  assert.equal(publicRows.find(row => row.thread_ref === `backend-thread:${digestValue('private:a')}`).learning_feedback.pending_feedback_count, 1);
  assert.doesNotMatch(JSON.stringify(publicRows), /private:|prompt|instruction/);
  assert.throws(() => projectWrapperReasoningThreads({active: [{thread_id: 'private:a', reasoning_epoch_digest: digest('d'),
    reasoning_checkpoint_digest: digest('e')}], learning_observer: () => ({...valid, pending_feedback_count: 3})}), /feedback-observation-invalid/);
});

test("thread projection exposes explicit epoch and completion frontier without raw identity or content", () => {
  const threadId = "private-backend-thread-42";
  const frontier = {
    frontier: {frontier_digest: digest("a"), state: {schema_version: "are.codex-completion-frontier-state/v1", thread_id: threadId, completion: {status: "completed"}, private_text: "never project"}},
    event: {sequence: 7},
    epoch: {epoch_digest: digest("b")},
    checkpoint: {checkpoint_digest: digest("c")},
  };
  const completed = projectWrapperReasoningThreads({frontiers: [frontier]});
  assert.equal(completed.length, 1);
  assert.equal(completed[0].phase, "turn-completed");
  assert.equal(completed[0].latest_frontier_digest, digest("a"));
  assert.doesNotMatch(JSON.stringify(completed), /private-backend-thread|never project/);

  const active = projectWrapperReasoningThreads({frontiers: [frontier], active: [{thread_id: threadId, reasoning_epoch_digest: digest("d"), reasoning_checkpoint_digest: digest("e")}]});
  assert.equal(active[0].phase, "turn-active");
  assert.equal(active[0].reasoning_epoch_digest, digest("d"));
  assert.equal(active[0].latest_frontier_digest, digest("a"));
  const recovered = projectWrapperReasoningThreads({frontiers: [frontier], active: [{thread_id: threadId,
    turn_id: "private-recovered-turn", reasoning_epoch_digest: digest("d"),
    reasoning_checkpoint_digest: digest("e"), recovery_unverified: true}]});
  assert.equal(recovered[0].phase, "recovery-unverified");
  assert.equal(recovered[0].recovery_turn_ref, digestValue("private-recovered-turn"));
  assert.equal(recovered[0].latest_frontier_digest, digest("a"), "The earlier verified frontier remains historical evidence.");
});

test("gateway thread projection is bounded and distinct from host activation", () => {
  const threads = Array.from({length: 40}, (_, index) => ({thread_ref: `backend-thread:${index.toString(16).padStart(64, "0")}`, phase: "turn-active", reasoning_epoch_digest: digest("a"), checkpoint_digest: digest("b"), latest_frontier_digest: null, latest_frontier_event_sequence: null, last_completion_status: null}));
  const observation = projectGatewayThreadObservation({runtime_epoch_id: "epoch:test", observed_at_unix_ms: Date.now(), sessions: [{consumer_id: "private-consumer", threads}]});
  assert.equal(observation.scope, "gateway-backend-threads-not-host-activation");
  assert.equal(observation.thread_count, 40);
  assert.equal(observation.ongoing_thread_count, 40);
  assert.equal(observation.omitted_ongoing_thread_count, 8);
  assert.equal(observation.degraded_steer_thread_count, null, "Legacy wrappers do not imply zero degraded threads.");
  assert.equal(observation.unknown_dispatch_count, null, "Missing durable-store facts do not imply zero unknown outcomes.");
  assert.equal(observation.unknown_hosted_effect_dispatch_count, null,
    "Older gateways do not imply zero unresolved hosted effects.");
  assert.equal(observation.unknown_thread_creation_count, null, "Older gateways do not imply zero unknown thread creations.");
  assert.equal(observation.accepted_unresolved_turn_count, null, "Missing host-acceptance facts do not imply zero accepted turns.");
  assert.equal(observation.threads.length, 32);
  assert.equal(observation.truncated, true);
  assert.equal(observation.page_offset, 0);
  assert.equal(observation.next_offset, 32);
  assert.match(observation.snapshot_digest, /^[0-9a-f]{64}$/);
  const second = projectGatewayThreadObservation({runtime_epoch_id: "epoch:test", observed_at_unix_ms: Date.now(),
    sessions: [{consumer_id: "private-consumer", threads}], page_offset: 32,
    expected_snapshot_digest: observation.snapshot_digest});
  assert.equal(second.page_offset, 32);
  assert.equal(second.next_offset, null);
  assert.equal(second.threads.length, 8);
  assert.equal(second.omitted_ongoing_thread_count, 32);
  assert.equal(second.snapshot_digest, observation.snapshot_digest);
  assert.throws(() => projectGatewayThreadObservation({runtime_epoch_id: "epoch:test", observed_at_unix_ms: Date.now(),
    sessions: [{consumer_id: "private-consumer", threads: threads.slice(1)}], page_offset: 32,
    expected_snapshot_digest: observation.snapshot_digest}), /source-changed/);
  assert.throws(() => projectGatewayThreadObservation({runtime_epoch_id: "epoch:test", observed_at_unix_ms: Date.now(),
    sessions: [{consumer_id: "private-consumer", threads}], page_offset: 64}), /invalid-page/);
  assert.doesNotMatch(JSON.stringify(observation), /private-consumer/);
});

test("gateway thread projection carries only dated, bounded relay catalog facts", () => {
  const now = Date.now();
  const threadRef = `backend-thread:${digest("a")}`;
  const thread = {thread_ref: threadRef, phase: "turn-active", reasoning_epoch_digest: digest("b"),
    checkpoint_digest: digest("c"), latest_frontier_digest: null, last_completion_status: null};
  const input = {runtime_epoch_id: "epoch:relay", observed_at_unix_ms: now,
    sessions: [{consumer_id: "private-consumer", threads: [thread],
      mcp_hook_relay_checks: [{thread_ref: threadRef, status: "listed", checked_at_unix_ms: now - 500}]}]};
  const observed = projectGatewayThreadObservation(input);
  assert.deepEqual(observed.threads[0].mcp_hook_relay_check,
    {status: "listed", checked_at_unix_ms: now - 500});
  assert.doesNotMatch(JSON.stringify(observed), /private-consumer/);
  assert.throws(() => projectGatewayThreadObservation({...input, sessions: [{...input.sessions[0],
    mcp_hook_relay_checks: [{thread_ref: threadRef, status: "connected", checked_at_unix_ms: now}]}]}),
  /invalid MCP relay/);
});

test("thread observation client reads a second page and rejects changed source facts", async () => {
  const directory = process.platform === "win32" ? null : mkdtempSync(join(tmpdir(), "are-thread-pages-"));
  const path = directory ? join(directory, "observation.sock") : `\\\\.\\pipe\\are-thread-pages-${process.pid}-${randomUUID()}`;
  const token = "test-only-thread-observation-token-32-bytes";
  const threads = Array.from({length: 40}, (_, index) => ({thread_ref: `backend-thread:${index.toString(16).padStart(64, "0")}`,
    phase: "turn-active", reasoning_epoch_digest: digest("a"), checkpoint_digest: digest("b"),
    latest_frontier_digest: null, latest_frontier_event_sequence: null, last_completion_status: null,
    plan_context_digest: digest("c"), plan_context_event_sequence: 3, plan_obligation_count: 7,
    plan_completed_count: 2, plan_open_decision_count: 1,
    plan_active_slice_ordinal: 3, plan_active_slice_status: "active",
    learning_feedback: feedbackSummary({binding_ref: digestValue(index)})}));
  let changed = false;
  let tampered = false;
  const server = createServer((socket) => {
    let input = "";
    socket.on("data", (chunk) => {
      input += chunk.toString("utf8");
      if (!input.includes("\n")) return;
      const request = JSON.parse(input.slice(0, input.indexOf("\n")));
      const response = {schema_version: THREAD_OBSERVATION_RESPONSE_SCHEMA, nonce: request.nonce, authority_effect: "none"};
      try {
        response.observation = projectGatewayThreadObservation({runtime_epoch_id: "epoch:client-pages",
          observed_at_unix_ms: Date.now(), unknown_dispatch_count: 2,
          unknown_hosted_effect_dispatch_count: 1,
          sessions: [{consumer_id: "private-consumer", threads: changed ? threads.slice(1) : threads}],
          page_offset: request.page_offset, expected_snapshot_digest: request.expected_snapshot_digest ?? undefined});
      } catch (error) { response.error = error.message; }
      if (tampered && response.observation?.threads[0]) {
        response.observation = JSON.parse(JSON.stringify(response.observation));
        response.observation.threads[0] = {
        ...response.observation.threads[0], learning_feedback: {...response.observation.threads[0].learning_feedback,
          pending_feedback_count: 3}};
      }
      socket.end(`${JSON.stringify(response)}\n`);
    });
  });
  try {
    server.listen(path);
    await once(server, "listening");
    const first = await readGatewayThreadObservation({socket_path: path, token});
    assert.ok(Buffer.byteLength(JSON.stringify({schema_version: THREAD_OBSERVATION_RESPONSE_SCHEMA,
      nonce: "x".repeat(32), authority_effect: "none", observation: first})) > 32 * 1024);
    assert.equal(first.threads[0].plan_active_slice_ordinal, 3);
    assert.equal(first.threads[0].learning_feedback.pending_feedback_count, 2);
    assert.ok(Buffer.byteLength(JSON.stringify(first)) < 64 * 1024, 'A full feedback-bearing page must retain the existing byte bound.');
    assert.equal(first.unknown_hosted_effect_dispatch_count, 1);
    const second = await readGatewayThreadObservation({socket_path: path, token, page_offset: 32,
      expected_snapshot_digest: first.snapshot_digest});
    assert.equal(second.threads.length, 8);
    assert.equal(second.page_offset, 32);
    const cli = await execFileAsync(process.execPath, [fileURLToPath(new URL("../../../bin/are.mjs", import.meta.url)),
      "thread-status", "--json", "--socket", path, "--offset", "32", "--snapshot-digest", first.snapshot_digest],
    {encoding: "utf8", env: {...process.env, ARE_ADAPTER_OBSERVATION_TOKEN: token}});
    assert.equal(JSON.parse(cli.stdout).page_offset, 32);
    assert.equal(JSON.parse(cli.stdout).unknown_hosted_effect_dispatch_count, 1);
    tampered = true;
    await assert.rejects(readGatewayThreadObservation({socket_path: path, token}), /thread\.observation-incompatible/);
    tampered = false;
    changed = true;
    await assert.rejects(readGatewayThreadObservation({socket_path: path, token, page_offset: 32,
      expected_snapshot_digest: first.snapshot_digest}), /thread\.observation-source-changed/);
  } finally {
    server.close();
    if (directory) rmSync(directory, {recursive: true, force: true});
  }
});

test("gateway prioritizes ongoing Reasoning State over completed history within the observation bound", () => {
  const thread = (index, phase) => ({thread_ref: `backend-thread:${index.toString(16).padStart(64, "0")}`,
    phase, reasoning_epoch_digest: digest("a"), checkpoint_digest: digest("b"),
    latest_frontier_digest: null, latest_frontier_event_sequence: null, last_completion_status: null});
  const threads = [...Array.from({length: 35}, (_, index) => thread(index, "turn-completed")),
    thread(35, "turn-active"), thread(36, "dispatch-pending"), thread(37, "recovery-unverified")];
  const observation = projectGatewayThreadObservation({runtime_epoch_id: "epoch:priority",
    observed_at_unix_ms: Date.now(), sessions: [{consumer_id: "private-consumer", threads}]});
  assert.equal(observation.thread_count, 38);
  assert.equal(observation.ongoing_thread_count, 3);
  assert.equal(observation.omitted_ongoing_thread_count, 0);
  assert.deepEqual(observation.threads.slice(0, 3).map((item) => item.phase),
    ["recovery-unverified", "turn-active", "dispatch-pending"]);
  assert.equal(observation.threads.length, 32);
});

test("gateway preserves the recovered-unverified phase without presenting an active turn", () => {
  const threadRef = `backend-thread:${digest("a")}`;
  const turnRef = digestValue("private-recovered-turn");
  const observed = projectGatewayThreadObservation({runtime_epoch_id: "epoch:recovered", observed_at_unix_ms: Date.now(),
    sessions: [{consumer_id: "private-consumer", threads: [{thread_ref: threadRef,
      phase: "recovery-unverified", reasoning_epoch_digest: digest("b"), checkpoint_digest: digest("c"),
      latest_frontier_digest: null, latest_frontier_event_sequence: null, last_completion_status: null,
      recovery_turn_ref: turnRef}], host_observations: [
        {kind: "turn-history-verified", thread_ref: threadRef, turn_ref: digestValue("different-turn"),
          turn_status: "completed", observation_digest: digest("d")},
        {kind: "turn-history-verified", thread_ref: threadRef, turn_ref: turnRef,
          turn_status: "interrupted", observation_digest: digest("e")},
      ]}]});
  assert.equal(observed.threads[0].phase, "recovery-unverified");
  assert.equal(observed.threads[0].recovery_host_status, "interrupted");
  assert.equal(observed.threads[0].recovery_host_observation_digest, digest("e"));
  assert.doesNotMatch(JSON.stringify(observed), /private-consumer/);
  assert.doesNotMatch(JSON.stringify(observed), /private-recovered-turn|different-turn/);
});

test("gateway distinguishes checkpointed host-terminal recovery from an ARE completion frontier", () => {
  const threadId = "private-terminal-thread", turnId = "private-terminal-turn";
  const threadRef = `backend-thread:${digestValue(threadId)}`;
  const projected = projectWrapperReasoningThreads({recovered_terminal: [{thread_id: threadId,
    turn_id: turnId, reasoning_epoch_digest: digest("a"), reasoning_checkpoint_digest: digest("b"),
    recovery_terminal_status: "interrupted"}]});
  assert.equal(projected[0].phase, "recovery-terminal");
  assert.equal(projected[0].latest_frontier_digest, null);
  const observed = projectGatewayThreadObservation({runtime_epoch_id: "epoch:terminal", observed_at_unix_ms: Date.now(),
    sessions: [{consumer_id: "private-consumer", threads: projected, host_observations: [
      {kind: "turn-history-verified", thread_ref: threadRef, turn_ref: digestValue(turnId),
        turn_status: "interrupted", observation_digest: digest("c")},
    ]}]});
  assert.equal(observed.threads[0].phase, "recovery-terminal");
  assert.equal(observed.threads[0].recovery_host_status, "interrupted");
  assert.equal(observed.threads[0].latest_frontier_digest, null);
  assert.doesNotMatch(JSON.stringify(observed), /private-terminal-/);
  const completedHost = projectWrapperReasoningThreads({recovered_terminal: [{thread_id: threadId,
    turn_id: turnId, reasoning_epoch_digest: digest("a"), reasoning_checkpoint_digest: digest("b"),
    recovery_terminal_status: "completed"}]});
  assert.equal(completedHost[0].phase, "recovery-terminal");
  assert.equal(completedHost[0].latest_frontier_digest, null);
  const laterFrontier = {frontier: {frontier_digest: digest("d"),
    state: {schema_version: "are.codex-completion-frontier-state/v1", thread_id: threadId,
      completion: {status: "completed"}}}, event: {sequence: 12}, epoch: {epoch_digest: digest("e")},
    checkpoint: {checkpoint_digest: digest("f")}};
  const afterNextTurn = projectWrapperReasoningThreads({frontiers: [laterFrontier], recovered_terminal: [{thread_id: threadId,
    turn_id: turnId, reasoning_epoch_digest: digest("a"), reasoning_checkpoint_digest: digest("b"),
    recovery_terminal_status: "interrupted", recovery_terminal_event_sequence: 11}]});
  assert.equal(afterNextTurn[0].phase, "turn-completed");
});

test("gateway projects marked host recovery separately from accepted-response history", () => {
  const threadId = "private-marked-terminal-thread", turnId = "private-marked-terminal-turn";
  const threadRef = `backend-thread:${digestValue(threadId)}`;
  const projected = projectWrapperReasoningThreads({recovered_terminal: [{thread_id: threadId,
    turn_id: turnId, reasoning_epoch_digest: digest("a"), reasoning_checkpoint_digest: digest("b"),
    recovery_terminal_status: "completed"}]});
  const observed = projectGatewayThreadObservation({runtime_epoch_id: "epoch:marked-terminal",
    observed_at_unix_ms: Date.now(), sessions: [{consumer_id: "private-consumer", threads: projected,
      host_observations: [{kind: "turn-marker-observed", thread_ref: threadRef,
        turn_ref: digestValue(turnId), turn_status: "completed", observation_digest: digest("c")}] }]});
  assert.equal(observed.threads[0].phase, "recovery-terminal");
  assert.equal(observed.threads[0].marked_host_turn_count, 1);
  assert.equal(observed.threads[0].verified_host_turn_count, 0);
  assert.equal(observed.threads[0].recovery_host_status, "completed");
  assert.equal(observed.threads[0].recovery_host_observation_digest, digest("c"));
  assert.doesNotMatch(JSON.stringify(observed), /private-marked-terminal-/);
});

test("gateway thread projection exposes bounded content-free dispatch recovery", () => {
  const observation = projectGatewayThreadObservation({runtime_epoch_id: "epoch:dispatch", observed_at_unix_ms: Date.now(),
    unknown_dispatch_count: 2, unknown_hosted_effect_dispatch_count: 1,
    unknown_thread_creation_count: 1,
    accepted_unresolved_turn_count: 1, recovered_dispatch_count: 1, sessions: []});
  assert.equal(observation.thread_count, 0);
  assert.equal(observation.unknown_dispatch_count, 2);
  assert.equal(observation.unknown_hosted_effect_dispatch_count, 1);
  assert.notEqual(projectGatewayThreadObservation({runtime_epoch_id: "epoch:dispatch",
    observed_at_unix_ms: Date.now(), unknown_dispatch_count: 2,
    unknown_hosted_effect_dispatch_count: 0, unknown_thread_creation_count: 1,
    accepted_unresolved_turn_count: 1, recovered_dispatch_count: 1, sessions: []}).snapshot_digest,
  observation.snapshot_digest, "An effect uncertainty change must invalidate a paged snapshot.");
  assert.equal(observation.unknown_thread_creation_count, 1);
  assert.equal(observation.accepted_unresolved_turn_count, 1);
  assert.equal(observation.recovered_dispatch_count, 1);
  assert.throws(() => projectGatewayThreadObservation({runtime_epoch_id: "epoch:dispatch", observed_at_unix_ms: Date.now(),
    unknown_dispatch_count: -1, sessions: []}), /invalid dispatch recovery facts/);
  assert.throws(() => projectGatewayThreadObservation({runtime_epoch_id: "epoch:dispatch", observed_at_unix_ms: Date.now(),
    unknown_dispatch_count: 1, unknown_thread_creation_count: 2, sessions: []}), /invalid dispatch recovery facts/);
  assert.throws(() => projectGatewayThreadObservation({runtime_epoch_id: "epoch:dispatch", observed_at_unix_ms: Date.now(),
    unknown_dispatch_count: 1, unknown_hosted_effect_dispatch_count: 2, sessions: []}),
  /invalid dispatch recovery facts/);
  assert.throws(() => projectGatewayThreadObservation({runtime_epoch_id: "epoch:dispatch", observed_at_unix_ms: Date.now(),
    unknown_hosted_effect_dispatch_count: 1, sessions: []}), /invalid dispatch recovery facts/);
  assert.throws(() => projectGatewayThreadObservation({runtime_epoch_id: "epoch:dispatch", observed_at_unix_ms: Date.now(),
    recovered_dispatch_count: -1, sessions: []}), /invalid dispatch recovery facts/);
  assert.throws(() => projectGatewayThreadObservation({runtime_epoch_id: "epoch:dispatch", observed_at_unix_ms: Date.now(),
    accepted_unresolved_turn_count: 1, sessions: []}), /invalid dispatch recovery facts/);
  assert.throws(() => projectGatewayThreadObservation({runtime_epoch_id: "epoch:dispatch", observed_at_unix_ms: Date.now(),
    unknown_dispatch_count: 0, accepted_unresolved_turn_count: 1, sessions: []}), /invalid dispatch recovery facts/);
  const threadRef = `backend-thread:${digest("a")}`;
  const perThread = projectGatewayThreadObservation({runtime_epoch_id: "epoch:dispatch", observed_at_unix_ms: Date.now(),
    unknown_dispatch_count: 0, recovered_dispatch_count: 1, sessions: [{consumer_id: "private-consumer",
      threads: [{thread_ref: threadRef, phase: "turn-completed", reasoning_epoch_digest: digest("b"),
        checkpoint_digest: digest("c"), latest_frontier_digest: digest("d"),
        latest_frontier_event_sequence: 1, last_completion_status: "completed",
        recovered_dispatch_count: 1}]}]});
  assert.equal(perThread.threads[0].recovered_dispatch_count, 1);
  assert.doesNotMatch(JSON.stringify(perThread), /private-consumer/);
  assert.throws(() => projectGatewayThreadObservation({runtime_epoch_id: "epoch:dispatch", observed_at_unix_ms: Date.now(),
    recovered_dispatch_count: 0, sessions: [{consumer_id: "private-consumer", threads: [{...perThread.threads[0],
      recovered_dispatch_count: 1}]}]}), /inconsistent dispatch recovery facts/);
});

test("hosted-effect uncertainty joins only matching bounded backend-thread rows", () => {
  const thread = (letter) => ({thread_ref: `backend-thread:${digest(letter)}`,
    phase: "turn-active", reasoning_epoch_digest: digest("c"), checkpoint_digest: digest("d"),
    latest_frontier_digest: null, last_completion_status: null,
    unknown_hosted_effect_dispatch_count: 1});
  const input = {runtime_epoch_id: "epoch:effect-thread", observed_at_unix_ms: Date.now(),
    unknown_dispatch_count: 1, unknown_hosted_effect_dispatch_count: 1,
    sessions: [{consumer_id: "private-consumer", threads: [thread("a")]}]};
  const observation = projectGatewayThreadObservation(input);
  assert.equal(observation.threads[0].unknown_hosted_effect_dispatch_count, 1);
  assert.doesNotMatch(JSON.stringify(observation), /private-consumer/);
  assert.throws(() => projectGatewayThreadObservation({...input,
    sessions: [{consumer_id: "private-consumer", threads: [thread("a"), thread("b")]}]}),
  /inconsistent hosted-effect dispatch facts/);
  assert.throws(() => projectGatewayThreadObservation({...input,
    unknown_hosted_effect_dispatch_count: null}), /inconsistent hosted-effect dispatch facts/);
});

test("gateway thread projection counts only reported degraded steer continuity", () => {
  const observation = projectGatewayThreadObservation({runtime_epoch_id: "epoch:continuity", observed_at_unix_ms: Date.now(),
    sessions: [{consumer_id: "one", threads: [], degraded_steer_thread_count: 1},
      {consumer_id: "two", threads: [], degraded_steer_thread_count: 2}]});
  assert.equal(observation.degraded_steer_thread_count, 3);
  assert.equal(observation.thread_count, 0);
  assert.throws(() => projectGatewayThreadObservation({runtime_epoch_id: "epoch:continuity", observed_at_unix_ms: Date.now(),
    sessions: [{consumer_id: "one", threads: [], degraded_steer_thread_count: -1}]}), /invalid continuity facts/);
});

test("gateway projection joins only bounded host receipts to the matching reasoning thread", () => {
  const firstRef = `backend-thread:${digest("a")}`;
  const secondRef = `backend-thread:${digest("b")}`;
  const thread = (thread_ref) => ({thread_ref, phase: "turn-active", reasoning_epoch_digest: digest("c"), checkpoint_digest: digest("d"), latest_frontier_digest: null, latest_frontier_event_sequence: null, last_completion_status: null, raw_private_text: "do not project"});
  const observation = projectGatewayThreadObservation({
    runtime_epoch_id: "epoch:host-facts", observed_at_unix_ms: Date.now(),
    sessions: [{consumer_id: "private-consumer", threads: [thread(firstRef), thread(secondRef)], host_observations: [
      {kind: "turn-start-accepted", thread_ref: firstRef, observation_digest: digest("0"), private_payload: "do not project"},
      {kind: "turn-history-verified", thread_ref: firstRef, observation_digest: digest("2"), private_payload: "do not project"},
      {kind: "turn-completion-observed", thread_ref: firstRef, observation_digest: digest("3"), private_payload: "do not project"},
      {kind: "steer-accepted", thread_ref: firstRef, observation_digest: digest("e"), private_payload: "do not project"},
      {kind: "compaction-turn-accepted", thread_ref: firstRef, observation_digest: digest("9")},
      {kind: "compaction-item-completed", thread_ref: firstRef, observation_digest: digest("f")},
      {kind: "steer-accepted", thread_ref: secondRef, observation_digest: digest("1")},
    ]}],
  });
  const first = observation.threads.find((entry) => entry.thread_ref === firstRef);
  const second = observation.threads.find((entry) => entry.thread_ref === secondRef);
  assert.equal(first.accepted_turn_start_count, 1);
  assert.equal(first.verified_host_turn_count, 1);
  assert.equal(first.accepted_steer_count, 1);
  assert.equal(first.accepted_compaction_turn_count, 1);
  assert.equal(first.completed_compaction_item_count, 1);
  assert.equal(first.latest_host_observation_digest, digest("f"));
  assert.equal(second.accepted_steer_count, 1);
  assert.equal(second.accepted_turn_start_count, 0);
  assert.equal(second.accepted_compaction_turn_count, 0);
  assert.equal(second.completed_compaction_item_count, 0);
  assert.doesNotMatch(JSON.stringify(observation), /private-consumer|do not project|private_payload|raw_private_text/);
  assert.throws(() => projectGatewayThreadObservation({runtime_epoch_id: "epoch:host-facts", observed_at_unix_ms: Date.now(), sessions: [{consumer_id: "consumer", threads: [thread(firstRef)], host_observations: [{kind: "unknown", thread_ref: firstRef, observation_digest: digest("e")}]}]}), /invalid host facts/);
});

test("DSH Web observations cannot masquerade as Codex reasoning receipts", () => {
  const threadRef = `backend-thread:${digest("a")}`;
  const kinds = ["dsh-turn-terminal-observed", "dsh-queue-edit-observed",
    "dsh-queue-remove-observed", "dsh-queue-steer-observed", "dsh-session-release-observed"];
  const view = projectGatewayThreadObservation({runtime_epoch_id: "epoch:dsh-cross-adapter",
    observed_at_unix_ms: Date.now(), sessions: [{consumer_id: "private-consumer",
      threads: [{thread_ref: threadRef, phase: "turn-active",
        reasoning_epoch_digest: digest("b"), checkpoint_digest: digest("c"),
        latest_frontier_digest: null, last_completion_status: null}],
      host_observations: kinds.map((kind, index) => ({kind, thread_ref: threadRef,
        observation_digest: String(index).repeat(64)}))}]});
  assert.equal(view.threads[0].accepted_turn_start_count, 0);
  assert.equal(view.threads[0].verified_host_turn_count, 0);
  assert.equal(view.threads[0].latest_host_observation_digest, null);
  assert.equal(view.threads[0].phase, "turn-active");
});

test("thread observation exposes only verified bounded plan progress", () => {
  const threadId = "private-backend-thread-plan";
  const planInput = {
    thread_ref: threadId,
    parent_plan_ref: "private-plan-path",
    parent_plan_digest: digest("a"),
    previous_plan_context_digest: null,
    feature_obligations: [
      {obligation_id: "private-done", summary: "secret completed work", status: "completed"},
      {obligation_id: "private-current", summary: "secret current work", status: "active"},
    ],
    active_slice_id: "private-current",
    unresolved_decisions: [{decision_id: "private-choice", question: "secret decision"}],
    source_refs: [{source_ref: "private-plan-path", source_digest: digest("a")}],
  };
  const plan = materializeReasoningPlanContext(planInput, {expected_thread_ref: threadId, source_digests: {"private-plan-path": digest("a")}});
  assert.equal(plan.ok, true);
  const active = [{thread_id: threadId, reasoning_epoch_digest: digest("b"), reasoning_checkpoint_digest: digest("c")}];
  const projected = projectWrapperReasoningThreads({active, plan_contexts: [{event_kind: "plan-context-recorded", sequence: 3, content: plan.value}]});
  assert.equal(projected[0].plan_context_digest, plan.digest);
  assert.equal(projected[0].plan_obligation_count, 2);
  assert.equal(projected[0].plan_completed_count, 1);
  assert.equal(projected[0].plan_open_decision_count, 1);
  assert.equal(projected[0].plan_active_slice_ordinal, 2);
  assert.equal(projected[0].plan_active_slice_status, "active");
  assert.doesNotMatch(JSON.stringify(projected), /private-|secret/);
  const observed = projectGatewayThreadObservation({runtime_epoch_id: "epoch:plan", observed_at_unix_ms: Date.now(), sessions: [{consumer_id: "private-consumer", threads: projected}]});
  assert.equal(observed.threads[0].plan_context_digest, plan.digest);
  assert.equal(observed.threads[0].plan_completed_count, 1);
  assert.equal(observed.threads[0].plan_active_slice_ordinal, 2);
  assert.equal(observed.threads[0].plan_active_slice_status, "active");
  const forged = projectWrapperReasoningThreads({active, plan_contexts: [{event_kind: "plan-context-recorded", sequence: 3, content: {...plan.value, plan_context_digest: digest("f")}}]});
  assert.equal(forged[0].plan_context_digest, null);
  assert.throws(() => projectGatewayThreadObservation({runtime_epoch_id: "epoch:plan", observed_at_unix_ms: Date.now(), sessions: [{consumer_id: "private-consumer", threads: [{...projected[0], plan_completed_count: 3}]}]}), /invalid reasoning facts/);
  assert.throws(() => projectGatewayThreadObservation({runtime_epoch_id: "epoch:plan", observed_at_unix_ms: Date.now(), sessions: [{consumer_id: "private-consumer", threads: [{...projected[0], plan_active_slice_ordinal: 3}]}]}), /invalid reasoning facts/);
  assert.throws(() => projectGatewayThreadObservation({runtime_epoch_id: "epoch:plan", observed_at_unix_ms: Date.now(), sessions: [{consumer_id: "private-consumer", threads: [{...projected[0], plan_active_slice_status: "completed"}]}]}), /invalid reasoning facts/);
});
