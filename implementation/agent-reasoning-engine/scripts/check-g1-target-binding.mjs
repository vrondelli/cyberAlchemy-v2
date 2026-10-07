#!/usr/bin/env node
// Read-only G1 identity preflight. No thread resume, turn, or approval RPC.
import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {readFileSync, readlinkSync, statSync} from "node:fs";
import {fileURLToPath} from "node:url";

import {createAppServerRpcClient, spawnAppServerRpcTransport} from "../packages/codex-app-server-wrapper/src/rpc-client.mjs";

const planPath = fileURLToPath(new URL("../../../development/agent-reasoning-engine/planning/automatic-thread-integration-v1/PLAN.md", import.meta.url));
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/u;

export function planTarget(markdown) {
  const matches = [...markdown.matchAll(/^Target conversation: `([^`]+)`\.$/gmu)];
  return matches.length === 1 && uuid.test(matches[0][1]) ? matches[0][1] : null;
}

export function bindingPosture(planId, threadId, sessionId) {
  if (!planId || !uuid.test(planId)) return "g1.plan-target-invalid";
  if (!threadId || !uuid.test(threadId)) return "g1.session-task-id-unavailable";
  if (!sessionId || !uuid.test(sessionId)) return "g1.session-label-unavailable";
  if (threadId !== sessionId) return "g1.caller-task-label-mismatch";
  return planId === threadId ? null : "g1.target-task-drift";
}

export function accountRoutingDigest(response) {
  const accountId = response?.workspaceRouting?.chatgptAccountId;
  if (response?.account?.type !== "chatgpt" || response.requiresOpenaiAuth !== true
    || typeof accountId !== "string" || !accountId || accountId !== accountId.trim()
    || Buffer.byteLength(accountId, "utf8") > 256) {
    throw new Error("g1.account-routing-unavailable");
  }
  return createHash("sha256").update(`are.g1-account-routing/v1\0${accountId}`).digest("hex");
}

const knownTurnStatuses = new Set(["completed", "failed", "interrupted", "inProgress"]);
const terminalTurnStatuses = new Set(["completed", "failed", "interrupted"]);
const historyPageLimit = 50;
const historyMaxPages = 32;
const historyMaxTurns = 1024;

function latestStoredTurn(page) {
  if (!page || !Array.isArray(page.data) || page.data.length > 1
    || (page.nextCursor !== undefined && page.nextCursor !== null
      && (typeof page.nextCursor !== "string" || page.nextCursor.length > 4096))) {
    throw new Error("g1.history-frontier-invalid");
  }
  if (page.data.length === 0) return null;
  const turn = page.data[0];
  if (!turn || typeof turn.id !== "string" || turn.id.length === 0 || turn.id.length > 256
    || !knownTurnStatuses.has(turn.status)) throw new Error("g1.history-frontier-invalid");
  return {digest: createHash("sha256").update(turn.id).digest("hex"), status: turn.status};
}

export function storedHistoryFrontier(firstPage, secondPage) {
  const first = latestStoredTurn(firstPage);
  const second = latestStoredTurn(secondPage);
  const unchanged = first?.digest === second?.digest && first?.status === second?.status;
  return {
    source: "thread/turns/list; itemsView:notLoaded; latest stored turn only",
    status: unchanged ? first ? "unchanged-between-reads" : "empty-between-reads" : "changed-between-reads",
    latest_turn_digest: unchanged ? first?.digest ?? null : null,
    latest_turn_status: second?.status ?? null,
    stored_latest_terminal: Boolean(unchanged && second && terminalTurnStatuses.has(second.status)),
    quiescence_established: false,
    writer_release_established: false,
  };
}

export async function readStoredHistoryCensus(client, threadId) {
  if (!uuid.test(threadId ?? "")) throw new Error("g1.history-thread-id-invalid");
  const rows = [];
  const seenTurnIds = new Set();
  const seenCursors = new Set();
  let cursor = null;
  let firstPage = null;
  for (let pageNumber = 0; pageNumber < historyMaxPages; pageNumber += 1) {
    const page = await client.request("thread/turns/list", {threadId, limit: historyPageLimit,
      itemsView: "notLoaded", sortDirection: "desc", ...(cursor ? {cursor} : {})});
    if (!page || !Array.isArray(page.data) || page.data.length > historyPageLimit
      || (page.nextCursor !== undefined && page.nextCursor !== null
        && (typeof page.nextCursor !== "string" || !page.nextCursor || page.nextCursor.length > 4096))) {
      throw new Error("g1.history-census-page-invalid");
    }
    if (!firstPage) firstPage = {data: page.data.slice(0, 1).map(turn => ({id: turn?.id, status: turn?.status}))};
    if (page.data.length === 0 && page.nextCursor) throw new Error("g1.history-census-page-invalid");
    for (const turn of page.data) {
      if (!turn || typeof turn.id !== "string" || !turn.id || turn.id.length > 256
        || !knownTurnStatuses.has(turn.status) || seenTurnIds.has(turn.id)) {
        throw new Error("g1.history-census-turn-invalid");
      }
      seenTurnIds.add(turn.id);
      rows.push([turn.id, turn.status]);
      if (rows.length > historyMaxTurns) throw new Error("g1.history-census-budget-exceeded");
    }
    if (page.nextCursor == null) {
      const counts = Object.fromEntries([...knownTurnStatuses].map(status => [status, 0]));
      for (const [, status] of rows) counts[status] += 1;
      const digest = createHash("sha256").update(`are.g1-stored-history-census/v1\0${JSON.stringify(rows)}`).digest("hex");
      return {firstPage, digest, turn_count: rows.length, status_counts: counts};
    }
    if (pageNumber === historyMaxPages - 1) throw new Error("g1.history-census-budget-exceeded");
    if (seenCursors.has(page.nextCursor)) throw new Error("g1.history-census-cursor-loop");
    seenCursors.add(page.nextCursor);
    cursor = page.nextCursor;
  }
  throw new Error("g1.history-census-budget-exceeded");
}

export function compareStoredHistoryCensuses(first, second) {
  if (!first || !second || !/^[0-9a-f]{64}$/u.test(first.digest ?? "")
    || !/^[0-9a-f]{64}$/u.test(second.digest ?? "")
    || !Number.isSafeInteger(first.turn_count) || !Number.isSafeInteger(second.turn_count)) {
    throw new Error("g1.history-census-invalid");
  }
  const unchanged = first.digest === second.digest && first.turn_count === second.turn_count;
  return {source: "thread/turns/list; itemsView:notLoaded; bounded full stored history",
    status: unchanged ? "unchanged-between-passes" : "changed-between-passes",
    ordered_turn_digest: unchanged ? first.digest : null,
    turn_count: unchanged ? first.turn_count : null,
    status_counts: unchanged ? first.status_counts : null,
    quiescence_established: false, writer_release_established: false};
}

async function main() {
  const report = {schema_version: "are.g1-target-binding-read/v1", status: "BLOCK",
    authority_effect: "none", active_task_mutated: false, transcript_retained: false,
    activation_established: false};
  let client;
  try {
    const hostPid = process.argv[2];
    if (process.argv.length !== 3 || !/^[1-9][0-9]*$/u.test(hostPid ?? "")) {
      throw new Error("usage: node check-g1-target-binding.mjs <active-app-server-pid>");
    }
    const selectedId = process.env.CODEX_THREAD_ID;
    const hostSessionLabel = process.env.CODEX_SESSION_ID;
    const declaredId = planTarget(readFileSync(planPath, "utf8"));
    report.session_task_id = selectedId ?? null;
    report.plan_task_id = declaredId;
    const posture = bindingPosture(declaredId, selectedId, hostSessionLabel);
    if (posture) throw new Error(posture);
    report.caller_session_label_matches_task = true;
    const commandLine = readFileSync(`/proc/${hostPid}/cmdline`, "utf8").split("\0");
    if (!commandLine.includes("app-server")) throw new Error("g1.selected-process-not-app-server");
    const binary = readlinkSync(`/proc/${hostPid}/exe`);
    const activeBinary = statSync(`/proc/${hostPid}/exe`);
    const pathBinary = statSync(binary);
    if (activeBinary.dev !== pathBinary.dev || activeBinary.ino !== pathBinary.ino) {
      throw new Error("g1.host-binary-changed");
    }
    const version = spawnSync(binary, ["--version"], {encoding: "utf8", timeout: 5000});
    if (version.status !== 0) throw new Error("g1.host-version-unavailable");
    const expectedVersion = process.env.ARE_G1_EXPECTED_HOST_VERSION;
    if (!expectedVersion || version.stdout.trim() !== expectedVersion) throw new Error("g1.host-version-mismatch");
    report.host = {pid: Number(hostPid), version: version.stdout.trim(),
      sha256: createHash("sha256").update(readFileSync(`/proc/${hostPid}/exe`)).digest("hex")};
    client = createAppServerRpcClient({transport: spawnAppServerRpcTransport({command: binary,
      args: ["app-server", "--listen", "stdio://"]}), request_timeout_ms: 10000});
    await client.initialize({clientInfo: {name: "are_g1_target_binding_read", version: "1"},
      capabilities: {experimentalApi: true}});
    await client.notify("initialized");
    const firstAccountDigest = accountRoutingDigest(await client.request("account/read", {refreshToken: false}));
    const thread = (await client.request("thread/read", {threadId: selectedId, includeTurns: false}))?.thread;
    if (thread?.id !== selectedId || thread?.sessionId !== selectedId) throw new Error("g1.host-thread-identity-mismatch");
    const goal = (await client.request("thread/goal/get", {threadId: selectedId}))?.goal;
    if (goal?.status !== "active" || typeof goal.objective !== "string") throw new Error("g1.host-goal-not-active");
    report.read = {thread_id_matched: true, session_id_matched: true, goal_status: "active",
      goal_digest: createHash("sha256").update(goal.objective).digest("hex"),
      separate_process_thread_status: thread.status?.type ?? null};
    const firstHistory = await readStoredHistoryCensus(client, selectedId);
    const secondHistory = await readStoredHistoryCensus(client, selectedId);
    report.read.stored_history_frontier = storedHistoryFrontier(
      {data: firstHistory.firstPage.data.slice(0, 1)}, {data: secondHistory.firstPage.data.slice(0, 1)});
    report.read.stored_history_census = compareStoredHistoryCensuses(firstHistory, secondHistory);
    const secondAccountDigest = accountRoutingDigest(await client.request("account/read", {refreshToken: false}));
    if (firstAccountDigest !== secondAccountDigest) throw new Error("g1.account-routing-changed");
    report.read.account_routing = {source: "separate-process account/read; refreshToken:false",
      workspace_account_digest: firstAccountDigest, stable_between_reads: true,
      desktop_account_bound: false};
    report.claim_ceiling = "Read-only caller-labeled identity, separate-process account routing and bounded two-pass stored-history digest; no desktop account match, frozen history, live quiescence, desktop writer release, or ingress handover proof.";
    report.status = "PASS_READ_ONLY";
  } catch (error) {
    report.reason_code = error.message;
    process.exitCode = 2;
  } finally {
    await client?.close().catch(() => {});
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  }
}

if (import.meta.main) await main();
