import assert from "node:assert/strict";
import test from "node:test";

import {accountRoutingDigest, bindingPosture, planTarget, storedHistoryFrontier,
  readStoredHistoryCensus, compareStoredHistoryCensuses} from "../scripts/check-g1-target-binding.mjs";

const id = "01a0d8c7-9192-7d62-aafb-8eb07c1d558c";
const other = "01a072f5-d339-77e1-931a-5244b57f3982";

test("G1 requires one exact plan target matching the current task label", () => {
  assert.equal(planTarget(`Target conversation: \`${id}\`.\n`), id);
  assert.equal(planTarget(`Target conversation: \`${id}\`.\nTarget conversation: \`${other}\`.\n`), null);
  assert.equal(planTarget("Target conversation: unspecified.\n"), null);
  assert.equal(bindingPosture(id, id, id), null);
  assert.equal(bindingPosture(id, other, other), "g1.target-task-drift");
  assert.equal(bindingPosture(id, id, other), "g1.caller-task-label-mismatch");
  assert.equal(bindingPosture(id, undefined, id), "g1.session-task-id-unavailable");
  assert.equal(bindingPosture(id, id, undefined), "g1.session-label-unavailable");
  assert.equal(bindingPosture(null, id, id), "g1.plan-target-invalid");
});

test("G1 binds only a bounded, content-free separate-process account routing identity", () => {
  const account = {account: {type: "chatgpt", email: "private@example.com", planType: "pro"},
    requiresOpenaiAuth: true, workspaceRouting: {chatgptAccountId: "private-account-id", backendOrigin: "private-host"}};
  const digest = accountRoutingDigest(account);
  assert.match(digest, /^[a-f0-9]{64}$/u);
  assert.equal(accountRoutingDigest({...account, account: {...account.account, email: "other@example.com"}}), digest);
  assert.notEqual(accountRoutingDigest({...account, workspaceRouting: {...account.workspaceRouting,
    chatgptAccountId: "other-account-id"}}), digest);
  assert.doesNotMatch(digest, /private|example/u);
  for (const invalid of [null, {}, {...account, account: null}, {...account, requiresOpenaiAuth: false},
    {...account, workspaceRouting: null}, {...account, workspaceRouting: {chatgptAccountId: ""}},
    {...account, workspaceRouting: {chatgptAccountId: " padded "}},
    {...account, workspaceRouting: {chatgptAccountId: "x".repeat(257)}}]) {
    assert.throws(() => accountRoutingDigest(invalid), /g1.account-routing-unavailable/u);
  }
});

test("G1 history frontier remains content-free and never asserts quiescence", () => {
  const turn = {id: "private-turn-id", status: "completed", items: [{text: "PRIVATE_TRANSCRIPT"}]};
  const stable = storedHistoryFrontier({data: [turn], nextCursor: "older"},
    {data: [{...turn, items: [{text: "OTHER_PRIVATE_TRANSCRIPT"}]}], nextCursor: "older"});
  assert.equal(stable.status, "unchanged-between-reads");
  assert.equal(stable.latest_turn_status, "completed");
  assert.equal(stable.stored_latest_terminal, true);
  assert.equal(stable.quiescence_established, false);
  assert.equal(stable.writer_release_established, false);
  assert.match(stable.latest_turn_digest, /^[a-f0-9]{64}$/u);
  assert.doesNotMatch(JSON.stringify(stable), /private-turn-id|PRIVATE_TRANSCRIPT|OTHER_PRIVATE_TRANSCRIPT/u);

  const changed = storedHistoryFrontier({data: [turn]},
    {data: [{id: "new-turn", status: "inProgress"}]});
  assert.equal(changed.status, "changed-between-reads");
  assert.equal(changed.latest_turn_status, "inProgress");
  assert.equal(changed.stored_latest_terminal, false);
  assert.equal(changed.latest_turn_digest, null);
  const empty = storedHistoryFrontier({data: []}, {data: []});
  assert.equal(empty.status, "empty-between-reads");
  assert.equal(empty.stored_latest_terminal, false);
  assert.equal(empty.quiescence_established, false);
});

test("G1 history frontier rejects malformed or unbounded host pages", () => {
  for (const page of [{}, {data: [{id: "one", status: "completed"}, {id: "two", status: "completed"}]},
    {data: [{id: "one", status: "future-status"}]}, {data: [{id: "", status: "completed"}]},
    {data: [{id: "one", status: "completed"}], nextCursor: 1}]) {
    assert.throws(() => storedHistoryFrontier(page, {data: []}), /g1.history-frontier-invalid/u);
  }
});

test("G1 two-pass census binds the entire ordered stored history without transcript content", async () => {
  const requests = [];
  const pages = [
    {data: [{id: "turn-3", status: "completed", items: [{text: "PRIVATE_THIRD"}]},
      {id: "turn-2", status: "interrupted"}], nextCursor: "older"},
    {data: [{id: "turn-1", status: "failed", items: [{text: "PRIVATE_FIRST"}]}], nextCursor: null},
  ];
  const client = {request: async (method, params) => {
    requests.push([method, params]);
    return pages[requests.length - 1];
  }};
  const first = await readStoredHistoryCensus(client, id);
  assert.deepEqual(requests.map(([, params]) => params.cursor ?? null), [null, "older"]);
  assert.equal(requests.every(([method, params]) => method === "thread/turns/list"
    && params.itemsView === "notLoaded" && params.sortDirection === "desc" && params.limit === 50), true);
  assert.equal(first.turn_count, 3);
  assert.deepEqual(first.status_counts, {completed: 1, failed: 1, interrupted: 1, inProgress: 0});
  assert.equal(JSON.stringify(first).includes("PRIVATE"), false);
  const second = {digest: first.digest, turn_count: first.turn_count, status_counts: first.status_counts};
  const comparison = compareStoredHistoryCensuses(first, second);
  assert.equal(comparison.status, "unchanged-between-passes");
  assert.equal(comparison.ordered_turn_digest, first.digest);
  assert.equal(comparison.quiescence_established, false);
  assert.equal(comparison.writer_release_established, false);
  assert.doesNotMatch(JSON.stringify(comparison), /turn-[123]|PRIVATE/u);
  const reordered = await readStoredHistoryCensus({request: async () => ({data: [
    {id: "turn-2", status: "interrupted"}, {id: "turn-3", status: "completed"},
    {id: "turn-1", status: "failed"}], nextCursor: null})}, id);
  assert.equal(compareStoredHistoryCensuses(first, reordered).status, "changed-between-passes");
  assert.equal(compareStoredHistoryCensuses(first, reordered).ordered_turn_digest, null);
});

test("G1 census rejects duplicate turns, loops, malformed pages and an invalid task ID", async () => {
  const client = pages => {let index = 0; return {request: async () => pages[index++]};};
  await assert.rejects(readStoredHistoryCensus(client([]), "not-a-task"), /g1.history-thread-id-invalid/u);
  await assert.rejects(readStoredHistoryCensus(client([{data: [{id: "same", status: "completed"}], nextCursor: "next"},
    {data: [{id: "same", status: "failed"}], nextCursor: null}]), id), /g1.history-census-turn-invalid/u);
  await assert.rejects(readStoredHistoryCensus(client([{data: [{id: "one", status: "completed"}], nextCursor: "next"},
    {data: [{id: "two", status: "completed"}], nextCursor: "next"}]), id), /g1.history-census-cursor-loop/u);
  for (const page of [{data: [] , nextCursor: "more"}, {data: [{id: "one", status: "future"}]},
    {data: Array.from({length: 51}, (_, index) => ({id: `turn-${index}`, status: "completed"}))}]) {
    await assert.rejects(readStoredHistoryCensus(client([page]), id), /g1.history-census-/u);
  }
});

test("G1 census fails closed at turn and page budgets", async () => {
  let index = 0;
  const manyTurns = {request: async () => {
    const page = index++;
    return {data: Array.from({length: 50}, (_, offset) => ({id: `turn-${page * 50 + offset}`, status: "completed"})),
      nextCursor: `page-${page + 1}`};
  }};
  await assert.rejects(readStoredHistoryCensus(manyTurns, id), /g1.history-census-budget-exceeded/u);
  index = 0;
  const manyPages = {request: async () => {
    const page = index++;
    return {data: [{id: `turn-${page}`, status: "completed"}], nextCursor: `page-${page + 1}`};
  }};
  await assert.rejects(readStoredHistoryCensus(manyPages, id), /g1.history-census-budget-exceeded/u);
  assert.equal(index, 32);
});
