import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";

import {digestValue} from "../src/canonical.mjs";
import {GATEWAY_CONNECTED_SCHEMA} from "../src/gateway.mjs";
import {createWindowsClientRecoveryState, MAX_ACCEPTED_TURN_RECEIPTS,
  WINDOWS_CLIENT_RECOVERY_SCHEMA} from "../src/windows-client-recovery-state.mjs";

const recoveryTest = process.platform === "win32" ? test.skip : test;
const nativeWindowsTest = process.platform === "win32" ? test : test.skip;

function fixture(context) {
  const directory = mkdtempSync(join(tmpdir(), "are-hosted-recovery-"));
  context.after(() => rmSync(directory, {recursive: true, force: true, maxRetries: 8, retryDelay: 250}));
  const path = join(directory, "client-state.json");
  const receipt = (token, resumed) => ({schema_version: GATEWAY_CONNECTED_SCHEMA, ok: true,
    consumer_id: "codex:human-chat", resumed, continuity: {resume_token: token, resume_token_digest: digestValue(token)}});
  return {path, receipt};
}

recoveryTest("bound pending turn settles only with an exact gateway recovery receipt and survives restart", (context) => {
  const {path, receipt} = fixture(context);
  const first = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  first.bind_gateway(receipt("gateway-secret-recovered", false));
  first.record_thread("thread-a");
  const intent = {schema_version: "are.codex-client-pending-turn/v2", thread_id: "thread-a",
    request_key: "turn:stable", text_digest: "a".repeat(64), request_binding_digest: "b".repeat(64),
    created_at: "2026-09-27T00:00:00.000Z"};
  first.record_turn_intent(intent);
  const material = {schema_version: "are.gateway-turn-recovery/v1", authority_effect: "none",
    request_key: intent.request_key, request_digest: intent.request_binding_digest,
    thread_id: intent.thread_id, turn_id: "turn-a", turn_status: "completed",
    host_observation_digest: "c".repeat(64), semantic_receipt_digest: "d".repeat(64)};
  const gatewayRecovery = {...material, receipt_digest: digestValue(material)};
  assert.throws(() => first.settle_recovered_turn_intent(intent,
    {...gatewayRecovery, request_digest: "e".repeat(64)}), /receipt-mismatch/);
  assert.deepEqual(first.pending_turn_intent(), intent);
  const recovered = first.settle_recovered_turn_intent(intent, gatewayRecovery);
  assert.equal(recovered.schema_version, "are.codex-client-recovered-turn/v1");
  assert.equal(first.pending_turn_intent(), null);
  assert.equal(readFileSync(path, "utf8").includes("private message"), false);
  first.close();
  const second = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  second.bind_gateway(receipt("gateway-secret-recovered", true));
  assert.deepEqual(second.last_turn_result(), recovered);
  second.close();
});

nativeWindowsTest("native Windows recovery seals the token and restores an owned accepted turn", (context) => {
  const {path, receipt} = fixture(context);
  const first = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  context.after(() => first.close());
  first.bind_gateway(receipt("gateway-secret-one", false));
  const binding = {schema_version: "are.codex-hosted-effect-thread-binding/v1",
    thread_id: "thread-a", cwd: join(tmpdir(), "selected-hosted-root"),
    host_user_agent: "native-windows-test-host", request_binding_digest: "a".repeat(64),
    root_digest: "b".repeat(64), tool_digest: "c".repeat(64)};
  first.record_thread("thread-a", binding);
  const intent = {schema_version: "are.codex-client-pending-turn/v1", thread_id: "thread-a", request_key: "turn:stable",
    text_digest: "a".repeat(64), created_at: "2026-09-27T00:00:00.000Z"};
  first.record_turn_intent(intent);
  first.settle_turn_intent(intent, "turn-a");
  const disk = readFileSync(path, "utf8");
  assert.equal(JSON.parse(disk).schema_version, "are.codex-windows-client-recovery-sealed/v1");
  assert.equal(disk.includes("gateway-secret-one"), false);
  assert.equal(disk.includes("thread-a"), false);
  assert.equal(disk.includes("native-windows-test-host"), false);
  assert.throws(() => createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"}), /recovery-lock-held/);
  first.close();
  const second = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  assert.equal(second.resume_token(), "gateway-secret-one");
  assert.deepEqual(second.thread_ids(), ["thread-a"]);
  second.bind_gateway(receipt("gateway-secret-one", true));
  assert.deepEqual(second.thread_binding("thread-a"), binding);
  assert.equal(second.last_turn_result().turn_id, "turn-a");
  second.close();
});

nativeWindowsTest("native Windows recovery preserves an uncertain pending turn without plaintext", (context) => {
  const {path, receipt} = fixture(context);
  const first = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  first.bind_gateway(receipt("gateway-secret-pending", false));
  first.record_thread("thread-pending");
  const intent = {schema_version: "are.codex-client-pending-turn/v1", thread_id: "thread-pending",
    request_key: "turn:pending", text_digest: "b".repeat(64), created_at: "2026-09-27T00:00:00.000Z"};
  first.record_turn_intent(intent);
  const disk = readFileSync(path, "utf8");
  assert.equal(JSON.parse(disk).schema_version, "are.codex-windows-client-recovery-sealed/v1");
  for (const privateValue of ["gateway-secret-pending", "thread-pending", "turn:pending", intent.text_digest]) {
    assert.equal(disk.includes(privateValue), false);
  }
  first.close();

  const second = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  second.bind_gateway(receipt("gateway-secret-pending", true));
  assert.deepEqual(second.thread_ids(), ["thread-pending"]);
  assert.deepEqual(second.pending_turn_intent(), intent);
  assert.equal(second.last_turn_result(), null);
  assert.throws(() => second.record_turn_intent({...intent, request_key: "turn:another"}), /turn-intent-conflict/);
  second.close();
});

nativeWindowsTest("native Windows recovery seals and restores an uncertain steer key", context => {
  const {path, receipt} = fixture(context);
  const first = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  first.bind_gateway(receipt("gateway-secret-steer", false));
  first.record_thread("thread-steer");
  const turn = {schema_version: "are.codex-client-pending-turn/v1", thread_id: "thread-steer",
    request_key: "turn:steer", text_digest: "a".repeat(64), created_at: "2026-10-01T00:00:00.000Z"};
  first.record_turn_intent(turn);
  first.settle_turn_intent(turn, "turn-steer");
  const steer = {schema_version: "are.codex-client-pending-steer/v1", thread_id: "thread-steer",
    turn_id: "turn-steer", request_key: "steer:00000000-0000-4000-8000-000000000001",
    text_digest: "b".repeat(64), created_at: "2026-10-01T00:00:00.000Z"};
  first.record_steer_intent(steer);
  const disk = readFileSync(path, "utf8");
  assert.equal(JSON.parse(disk).schema_version, "are.codex-windows-client-recovery-sealed/v1");
  for (const privateValue of [steer.thread_id, steer.turn_id, steer.request_key, steer.text_digest]) {
    assert.equal(disk.includes(privateValue), false);
  }
  first.close();
  const second = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  second.bind_gateway(receipt("gateway-secret-steer", true));
  assert.deepEqual(second.pending_steer_intent(), steer);
  assert.throws(() => second.clear_steer_intent({...steer, turn_id: "other-turn"}), /steer-intent-mismatch/);
  second.clear_steer_intent(steer);
  assert.equal(second.pending_steer_intent(), null);
  second.close();
});

nativeWindowsTest("native Windows recovery rejects plaintext, tampering, and an unscoped parent", (context) => {
  const {path, receipt} = fixture(context);
  const first = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  first.bind_gateway(receipt("gateway-secret-one", false));
  first.close();
  const envelope = JSON.parse(readFileSync(path, "utf8"));
  envelope.protected_base64 = `${envelope.protected_base64[0] === "A" ? "B" : "A"}${envelope.protected_base64.slice(1)}`;
  writeFileSync(path, `${JSON.stringify(envelope)}\n`);
  assert.throws(() => createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"}), /recovery-protection-failed/);
  writeFileSync(path, `${JSON.stringify({schema_version: WINDOWS_CLIENT_RECOVERY_SCHEMA, resume_token: "plain-secret"})}\n`);
  assert.throws(() => createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"}), /recovery-state-unsafe/);
  assert.throws(() => createWindowsClientRecoveryState({path: join(process.env.LOCALAPPDATA, "client-state.json"), consumer_id: "codex:human-chat"}), /recovery-parent-unsafe/);
});

nativeWindowsTest("native Windows recovery reclaims only a validated dead writer lock", (context) => {
  const {path} = fixture(context);
  const moduleUrl = new URL("../src/windows-client-recovery-state.mjs", import.meta.url).href;
  const child = spawnSync(process.execPath, ["--input-type=module", "-e",
    `const {createWindowsClientRecoveryState} = await import(${JSON.stringify(moduleUrl)}); createWindowsClientRecoveryState({path: ${JSON.stringify(path)}, consumer_id: "codex:human-chat"});`],
  {cwd: tmpdir(), encoding: "utf8", timeout: 10_000});
  assert.equal(child.status, 0, child.stderr);
  const recovered = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  assert.equal(recovered.resume_token(), null);
  recovered.close();
});

recoveryTest("private recovery record rebinds only the same gateway session and client-created threads", (context) => {
  const {path, receipt} = fixture(context);
  const first = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  context.after(() => first.close());
  assert.equal(first.resume_token(), null);
  assert.throws(() => first.record_thread("thread-a"), /gateway-unbound/);
  first.bind_gateway(receipt("gateway-secret-one", false));
  first.record_thread("thread-a");
  first.record_thread("thread-a");
  assert.deepEqual(first.thread_ids(), ["thread-a"]);
  assert.equal(statSync(path).mode & 0o077, 0);
  assert.equal(readFileSync(path, "utf8").includes("gateway-secret-one"), true);
  assert.throws(() => createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"}), /recovery-lock-held/);
  first.close();

  const second = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  assert.equal(second.resume_token(), "gateway-secret-one");
  assert.deepEqual(second.thread_ids(), ["thread-a"]);
  assert.throws(() => second.bind_gateway(receipt("gateway-secret-two", true)), /recovery-gateway-mismatch/);
  assert.throws(() => second.bind_gateway(receipt("gateway-secret-one", false)), /recovery-gateway-mismatch/);
  second.bind_gateway(receipt("gateway-secret-one", true));
  second.record_thread("thread-b");
  assert.deepEqual(second.thread_ids(), ["thread-a", "thread-b"]);
  second.close();
});

recoveryTest("hosted effect thread binding is atomic, exact, and survives restart", (context) => {
  const {path, receipt} = fixture(context);
  const binding = {schema_version: "are.codex-hosted-effect-thread-binding/v1",
    thread_id: "thread-bound", cwd: tmpdir(), host_user_agent: "codex-fixture/v1",
    request_binding_digest: "a".repeat(64), root_digest: "b".repeat(64),
    tool_digest: "c".repeat(64)};
  const first = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  first.bind_gateway(receipt("gateway-secret-bound", false));
  first.record_thread("thread-bound", binding);
  assert.deepEqual(first.thread_binding("thread-bound"), binding);
  assert.throws(() => first.record_thread("thread-bound", {...binding, tool_digest: "d".repeat(64)}),
    /thread-binding-conflict/);
  first.close();
  const second = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  second.bind_gateway(receipt("gateway-secret-bound", true));
  assert.deepEqual(second.thread_binding("thread-bound"), binding);
  second.close();
});

recoveryTest("v4 recovery migrates without inventing hosted thread bindings", (context) => {
  const {path, receipt} = fixture(context);
  const material = {schema_version: "are.codex-windows-client-recovery/v4",
    consumer_id: "codex:human-chat", resume_token: "gateway-secret-v4",
    resume_token_digest: digestValue("gateway-secret-v4"), thread_ids: ["thread-old"],
    pending_turn: null, last_turn_result: null, accepted_turns: []};
  writeFileSync(path, `${JSON.stringify({...material, record_digest: digestValue(material)})}\n`, {mode: 0o600});
  const state = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  assert.equal(state.thread_binding("thread-old"), null);
  state.bind_gateway(receipt("gateway-secret-v4", true));
  assert.equal(state.thread_binding("thread-old"), null);
  const migrated = JSON.parse(readFileSync(path, "utf8"));
  assert.equal(migrated.schema_version, WINDOWS_CLIENT_RECOVERY_SCHEMA);
  assert.deepEqual(migrated.thread_bindings, []);
  state.close();
});

recoveryTest("v5 recovery preserves hosted bindings and adds an empty steer checkpoint", (context) => {
  const {path, receipt} = fixture(context);
  const binding = {schema_version: "are.codex-hosted-effect-thread-binding/v1",
    thread_id: "thread-a", cwd: tmpdir(), host_user_agent: "fixture/v1",
    request_binding_digest: "a".repeat(64), root_digest: "b".repeat(64), tool_digest: "c".repeat(64)};
  const material = {schema_version: "are.codex-windows-client-recovery/v5", consumer_id: "codex:human-chat",
    resume_token: "gateway-secret-v5", resume_token_digest: digestValue("gateway-secret-v5"),
    thread_ids: ["thread-a"], pending_turn: null, last_turn_result: null, accepted_turns: [],
    thread_bindings: [binding]};
  writeFileSync(path, `${JSON.stringify({...material, record_digest: digestValue(material)})}\n`, {mode: 0o600});
  const state = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  state.bind_gateway(receipt("gateway-secret-v5", true));
  assert.deepEqual(state.thread_binding("thread-a"), binding);
  assert.equal(state.pending_steer_intent(), null);
  const migrated = JSON.parse(readFileSync(path, "utf8"));
  assert.equal(migrated.schema_version, WINDOWS_CLIENT_RECOVERY_SCHEMA);
  assert.deepEqual(migrated.thread_bindings, [binding]);
  state.close();
});

recoveryTest("pending steer key survives restart and clears only by exact identity", (context) => {
  const {path, receipt} = fixture(context);
  const first = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  first.bind_gateway(receipt("gateway-secret-steer", false));
  first.record_thread("thread-a");
  const turn = {schema_version: "are.codex-client-pending-turn/v1", thread_id: "thread-a",
    request_key: "turn:one", text_digest: "a".repeat(64), created_at: "2026-10-01T00:00:00.000Z"};
  first.record_turn_intent(turn);
  first.settle_turn_intent(turn, "turn-a");
  const steer = {schema_version: "are.codex-client-pending-steer/v1", thread_id: "thread-a",
    turn_id: "turn-a", request_key: "steer:00000000-0000-4000-8000-000000000001",
    text_digest: "b".repeat(64), created_at: "2026-10-01T00:00:00.000Z"};
  assert.throws(() => first.record_steer_intent({...steer, turn_id: "other-turn"}), /Invalid pending steer/);
  first.record_steer_intent(steer);
  assert.throws(() => first.record_steer_intent({...steer, request_key: "steer:00000000-0000-4000-8000-000000000002"}),
    /steer-intent-conflict/);
  assert.equal(readFileSync(path, "utf8").includes("Private steering guidance"), false);
  first.close();
  const second = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  second.bind_gateway(receipt("gateway-secret-steer", true));
  assert.deepEqual(second.pending_steer_intent(), steer);
  assert.throws(() => second.clear_steer_intent({...steer, text_digest: "c".repeat(64)}), /steer-intent-mismatch/);
  second.clear_steer_intent(steer);
  assert.equal(second.pending_steer_intent(), null);
  second.close();
});

recoveryTest("a content-free turn intent survives restart and is bound to an owned thread", (context) => {
  const {path, receipt} = fixture(context);
  const first = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  first.bind_gateway(receipt("gateway-secret-one", false));
  first.record_thread("thread-a");
  const intent = {schema_version: "are.codex-client-pending-turn/v1", thread_id: "thread-a", request_key: "turn:stable",
    text_digest: "a".repeat(64), created_at: "2026-09-26T00:00:00.000Z"};
  assert.throws(() => first.record_turn_intent({...intent, thread_id: "desktop-task-id"}), /Invalid pending turn intent/);
  first.record_turn_intent(intent);
  assert.deepEqual(first.pending_turn_intent(), intent);
  assert.throws(() => first.reject_turn_intent({...intent, request_key: "turn:other"}, "reasoning.prior-turn-unsettled"),
    /turn-rejection-unbound/);
  assert.throws(() => first.reject_turn_intent(intent, "rpc.request-timeout"), /turn-rejection-unbound/);
  assert.equal(readFileSync(path, "utf8").includes("private message"), false);
  first.close();
  const second = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  second.bind_gateway(receipt("gateway-secret-one", true));
  assert.deepEqual(second.pending_turn_intent(), intent);
  assert.throws(() => second.record_turn_intent({...intent, request_key: "turn:changed"}), /turn-intent-conflict/);
  assert.throws(() => second.settle_turn_intent({...intent, request_key: "turn:changed"}, "turn-a"), /turn-intent-mismatch/);
  assert.throws(() => second.settle_turn_intent(intent, ""), /Invalid accepted turn ID/);
  const accepted = second.settle_turn_intent(intent, "turn-a");
  assert.equal(second.pending_turn_intent(), null);
  assert.equal(second.last_turn_result().turn_id, "turn-a");
  assert.equal(second.last_turn_result().request_key, intent.request_key);
  assert.equal(JSON.stringify(accepted).includes("private message"), false);
  assert.throws(() => second.record_turn_intent(intent), /accepted-key-reused/);
  second.close();
  const third = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  third.bind_gateway(receipt("gateway-secret-one", true));
  assert.equal(third.pending_turn_intent(), null);
  assert.equal(third.last_turn_result().turn_id, "turn-a");
  third.close();
});

recoveryTest("accepted receipts retain older keys across restart and reject conflicting reuse", (context) => {
  const {path, receipt} = fixture(context);
  const first = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  first.bind_gateway(receipt("gateway-secret-one", false));
  first.record_thread("thread-a");
  const entry = (key, digest) => ({schema_version: "are.codex-client-pending-turn/v1", thread_id: "thread-a",
    request_key: key, text_digest: digest.repeat(64), created_at: "2026-09-28T00:00:00.000Z"});
  const earlier = entry("turn:earlier", "a");
  first.record_turn_intent(earlier);
  first.settle_turn_intent(earlier, "turn-earlier");
  const later = entry("turn:later", "b");
  first.record_turn_intent(later);
  first.settle_turn_intent(later, "turn-later");
  assert.deepEqual(first.accepted_turn_results().map((item) => item.request_key), ["turn:earlier", "turn:later"]);
  first.close();
  const second = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  second.bind_gateway(receipt("gateway-secret-one", true));
  assert.deepEqual(second.accepted_turn_results().map((item) => item.turn_id), ["turn-earlier", "turn-later"]);
  assert.equal(second.last_turn_result().turn_id, "turn-later");
  assert.throws(() => second.record_turn_intent(earlier), /accepted-key-reused/);
  second.close();
});

recoveryTest("v3 single receipt migrates only after gateway rebind and receipt cap fails closed", (context) => {
  const {path, receipt} = fixture(context);
  const accepted = {schema_version: "are.codex-client-accepted-turn/v1", thread_id: "thread-a",
    request_key: "turn:old", text_digest: "a".repeat(64), turn_id: "turn-old",
    accepted_at: "2026-09-28T00:00:00.000Z"};
  const material = {schema_version: "are.codex-windows-client-recovery/v3", consumer_id: "codex:human-chat",
    resume_token: "gateway-secret-one", resume_token_digest: digestValue("gateway-secret-one"),
    thread_ids: ["thread-a"], pending_turn: null, last_turn_result: accepted};
  writeFileSync(path, `${JSON.stringify({...material, record_digest: digestValue(material)})}\n`, {mode: 0o600});
  const state = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  assert.equal(JSON.parse(readFileSync(path, "utf8")).schema_version, material.schema_version);
  state.bind_gateway(receipt("gateway-secret-one", true));
  assert.deepEqual(state.accepted_turn_results(), [accepted]);
  state.close();

  const receipts = Array.from({length: MAX_ACCEPTED_TURN_RECEIPTS}, (_, index) => ({...accepted,
    request_key: `turn:${index}`, turn_id: `turn-${index}`}));
  const full = {...material, schema_version: WINDOWS_CLIENT_RECOVERY_SCHEMA,
    last_turn_result: receipts.at(-1), accepted_turns: receipts, thread_bindings: [], pending_steer: null};
  writeFileSync(path, `${JSON.stringify({...full, record_digest: digestValue(full)})}\n`, {mode: 0o600});
  const capped = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  capped.bind_gateway(receipt("gateway-secret-one", true));
  const next = {schema_version: "are.codex-client-pending-turn/v1", thread_id: "thread-a",
    request_key: "turn:new", text_digest: "b".repeat(64), created_at: "2026-09-28T00:00:00.000Z"};
  assert.throws(() => capped.record_turn_intent(next), /accepted-receipt-limit/);
  assert.equal(capped.pending_turn_intent(), null);
  capped.close();
});

recoveryTest("a definite local rejection clears the matching pending intent durably", (context) => {
  const {path, receipt} = fixture(context);
  const first = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  first.bind_gateway(receipt("gateway-secret-one", false));
  first.record_thread("thread-a");
  const intent = {schema_version: "are.codex-client-pending-turn/v1", thread_id: "thread-a",
    request_key: "turn:rejected", text_digest: "a".repeat(64), created_at: "2026-09-27T00:00:00.000Z"};
  first.record_turn_intent(intent);
  first.reject_turn_intent(intent, "reasoning.prior-turn-unsettled");
  assert.equal(first.pending_turn_intent(), null);
  first.close();
  const second = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  second.bind_gateway(receipt("gateway-secret-one", true));
  assert.equal(second.pending_turn_intent(), null);
  assert.equal(second.last_turn_result(), null);
  second.close();
});

recoveryTest("a definite preflight rejection releases only its matching pending intent", context => {
  const {path, receipt} = fixture(context);
  const first = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  first.bind_gateway(receipt("gateway-secret-preflight", false));
  first.record_thread("thread-a");
  const intent = {schema_version: "are.codex-client-pending-turn/v2", thread_id: "thread-a",
    request_key: "turn:preflight", text_digest: "a".repeat(64),
    request_binding_digest: "b".repeat(64), created_at: "2026-09-29T00:00:00.000Z"};
  first.record_turn_intent(intent);
  assert.throws(() => first.reject_turn_intent({...intent, request_key: "turn:other"},
    "reasoning.preflight-failed"), /turn-rejection-unbound/);
  first.reject_turn_intent(intent, "reasoning.preflight-failed");
  first.close();
  const second = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  second.bind_gateway(receipt("gateway-secret-preflight", true));
  assert.equal(second.pending_turn_intent(), null);
  second.close();
});

recoveryTest("a gateway host-config drift rejection clears the exact pending intent durably", context => {
  const {path, receipt} = fixture(context);
  const first = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  first.bind_gateway(receipt("gateway-secret-one", false));
  first.record_thread("thread-a");
  const intent = {schema_version: "are.codex-client-pending-turn/v1", thread_id: "thread-a",
    request_key: "turn:config-drift", text_digest: "a".repeat(64),
    created_at: "2026-09-29T00:00:00.000Z"};
  first.record_turn_intent(intent);
  assert.throws(() => first.reject_turn_intent({...intent, request_key: "turn:other"},
    "gateway.restricted-host-config-drift"), /turn-rejection-unbound/);
  first.reject_turn_intent(intent, "gateway.restricted-host-config-drift");
  first.close();
  const second = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  second.bind_gateway(receipt("gateway-secret-one", true));
  assert.equal(second.pending_turn_intent(), null);
  assert.equal(second.last_turn_result(), null);
  second.close();
});

recoveryTest("a validated v1 record migrates only after the same gateway rebinds", (context) => {
  const {path, receipt} = fixture(context);
  const material = {schema_version: "are.codex-windows-client-recovery/v1", consumer_id: "codex:human-chat",
    resume_token: "gateway-secret-one", resume_token_digest: digestValue("gateway-secret-one"), thread_ids: ["thread-a"]};
  writeFileSync(path, `${JSON.stringify({...material, record_digest: digestValue(material)})}\n`, {mode: 0o600});
  const state = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  assert.equal(JSON.parse(readFileSync(path, "utf8")).schema_version, material.schema_version);
  assert.throws(() => state.bind_gateway(receipt("gateway-secret-two", true)), /recovery-gateway-mismatch/);
  state.bind_gateway(receipt("gateway-secret-one", true));
  assert.equal(state.pending_turn_intent(), null);
  assert.equal(state.last_turn_result(), null);
  const migrated = JSON.parse(readFileSync(path, "utf8"));
  assert.equal(migrated.schema_version, WINDOWS_CLIENT_RECOVERY_SCHEMA);
  assert.equal(migrated.pending_turn, null);
  assert.equal(migrated.last_turn_result, null);
  state.close();
});

recoveryTest("a validated v2 pending intent migrates without discarding its recovery key", (context) => {
  const {path, receipt} = fixture(context);
  const pending = {schema_version: "are.codex-client-pending-turn/v1", thread_id: "thread-a", request_key: "turn:stable",
    text_digest: "a".repeat(64), created_at: "2026-09-26T00:00:00.000Z"};
  const material = {schema_version: "are.codex-windows-client-recovery/v2", consumer_id: "codex:human-chat",
    resume_token: "gateway-secret-one", resume_token_digest: digestValue("gateway-secret-one"), thread_ids: ["thread-a"], pending_turn: pending};
  writeFileSync(path, `${JSON.stringify({...material, record_digest: digestValue(material)})}\n`, {mode: 0o600});
  const state = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  state.bind_gateway(receipt("gateway-secret-one", true));
  assert.deepEqual(state.pending_turn_intent(), pending);
  assert.equal(state.last_turn_result(), null);
  assert.equal(JSON.parse(readFileSync(path, "utf8")).schema_version, WINDOWS_CLIENT_RECOVERY_SCHEMA);
  state.close();
});

recoveryTest("recovery refuses altered records and a different gateway consumer", (context) => {
  const {path, receipt} = fixture(context);
  const first = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  first.bind_gateway(receipt("gateway-secret-one", false));
  first.record_thread("thread-a");
  first.close();
  assert.throws(() => createWindowsClientRecoveryState({path, consumer_id: "other-consumer"}), /recovery-consumer-mismatch/);
  const record = JSON.parse(readFileSync(path, "utf8"));
  record.thread_ids.push("desktop-task-id");
  writeFileSync(path, `${JSON.stringify(record)}\n`, {mode: 0o600});
  assert.throws(() => createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"}), /recovery-state-digest-invalid/);
});

recoveryTest("recovery rejects loose file mode and reclaims only a validated dead writer", (context) => {
  const {path, receipt} = fixture(context);
  const first = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  first.bind_gateway(receipt("gateway-secret-one", false));
  const lockPath = `${path}.writer.lock`;
  const oldLock = JSON.parse(readFileSync(lockPath, "utf8"));
  first.close();
  chmodSync(path, 0o644);
  assert.throws(() => createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"}), /recovery-state-unsafe/);
  assert.equal(existsSync(lockPath), false);
  chmodSync(path, 0o600);
  oldLock.process_id = 2147483647;
  const {lock_digest, ...material} = oldLock;
  oldLock.lock_digest = digestValue(material);
  writeFileSync(lockPath, `${JSON.stringify(oldLock)}\n`, {mode: 0o600});
  const recovered = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  assert.equal(recovered.resume_token(), "gateway-secret-one");
  recovered.close();
});

recoveryTest("an altered but internally valid record cannot overwrite the active writer's expected state", (context) => {
  const {path, receipt} = fixture(context);
  const state = createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"});
  state.bind_gateway(receipt("gateway-secret-one", false));
  const original = JSON.parse(readFileSync(path, "utf8"));
  original.thread_ids = ["manually-inserted"];
  const {record_digest, ...material} = original;
  original.record_digest = digestValue(material);
  writeFileSync(path, `${JSON.stringify(original)}\n`, {mode: 0o600});
  assert.throws(() => state.record_thread("thread-a"), /recovery-state-drift/);
  state.close();
});

recoveryTest("recovery requires a private parent directory for its gateway secret", (context) => {
  const {path} = fixture(context);
  chmodSync(join(path, ".."), 0o755);
  assert.throws(() => createWindowsClientRecoveryState({path, consumer_id: "codex:human-chat"}), /recovery-parent-unsafe/);
});
