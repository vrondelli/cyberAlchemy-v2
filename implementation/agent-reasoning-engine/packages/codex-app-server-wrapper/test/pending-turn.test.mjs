import assert from "node:assert/strict";
import test from "node:test";

import {adoptPendingTurn, clearPendingTurn, migratePendingTurnStorage, PENDING_TURN_STORAGE_KEY,
  preparePendingTurn, readPendingTurn, reconcileTurnReceipt} from "../client/pending-turn.js";

function storage() {
  const values = new Map();
  return {getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key), values};
}

test("pending turn persists only identity and digest and reuses the exact gateway key", async () => {
  const browser = storage();
  const first = await preparePendingTurn(browser, "owned-thread", "A private user message");
  assert.equal(first.recovered, false);
  assert.equal(browser.getItem(PENDING_TURN_STORAGE_KEY).includes("A private user message"), false);
  const recovered = await preparePendingTurn(browser, "owned-thread", "A private user message");
  assert.equal(recovered.recovered, true);
  assert.equal(recovered.entry.request_key, first.entry.request_key);
  assert.equal(readPendingTurn(browser).thread_id, "owned-thread");
  clearPendingTurn(browser, recovered.entry);
  assert.equal(readPendingTurn(browser), null);
});

test("pending turn blocks changed text, changed thread, and tampered storage", async () => {
  const browser = storage();
  const first = await preparePendingTurn(browser, "owned-thread", "original");
  await assert.rejects(preparePendingTurn(browser, "owned-thread", "different"), /exact previous message/);
  await assert.rejects(preparePendingTurn(browser, "another-thread", "original"), /another thread/);
  assert.throws(() => clearPendingTurn(browser, {...first.entry, request_key: "turn:00000000-0000-0000-0000-000000000000"}), /changed/);
  browser.setItem(PENDING_TURN_STORAGE_KEY, "{bad-json");
  assert.throws(() => readPendingTurn(browser), /unreadable/);
  await assert.rejects(preparePendingTurn(browser, "owned-thread", "new"), /unreadable/);
});

test("pending turn refuses dispatch when storage cannot checkpoint", async () => {
  const browser = {getItem: () => null, setItem: () => { throw new Error("storage denied"); }};
  await assert.rejects(preparePendingTurn(browser, "owned-thread", "message"), /storage denied/);
});

test("legacy shared pending marker moves to one tab without silently losing conflicts", async () => {
  const shared = storage();
  const tab = storage();
  const prior = (await preparePendingTurn(shared, "owned-thread", "private message")).entry;
  assert.equal(migratePendingTurnStorage(shared, tab).request_key, prior.request_key);
  assert.equal(readPendingTurn(shared), null);
  assert.equal(readPendingTurn(tab).request_key, prior.request_key);
  const otherTab = storage();
  const own = (await preparePendingTurn(otherTab, "owned-thread", "different private message")).entry;
  shared.setItem(PENDING_TURN_STORAGE_KEY, JSON.stringify(prior));
  assert.throws(() => migratePendingTurnStorage(shared, otherTab), /conflict/);
  assert.equal(readPendingTurn(shared).request_key, prior.request_key);
  assert.equal(readPendingTurn(otherTab).request_key, own.request_key);
});

test("a new origin adopts only the host's content-free pending intent", async () => {
  const firstOrigin = storage();
  const first = (await preparePendingTurn(firstOrigin, "owned-thread", "private message")).entry;
  const newOrigin = storage();
  const adopted = adoptPendingTurn(newOrigin, {...first, created_at: "2026-09-26T00:00:00.000Z"});
  assert.equal(adopted.request_key, first.request_key);
  assert.equal(newOrigin.getItem(PENDING_TURN_STORAGE_KEY).includes("private message"), false);
  assert.equal((await preparePendingTurn(newOrigin, "owned-thread", "private message")).recovered, true);
  await assert.rejects(preparePendingTurn(newOrigin, "owned-thread", "changed"), /exact previous message/);
  assert.throws(() => adoptPendingTurn(newOrigin, {...first, request_key: "turn:00000000-0000-0000-0000-000000000000"}), /conflict/);
});

test("a host accepted-turn receipt clears only the matching browser marker", async () => {
  const browser = storage();
  const pending = (await preparePendingTurn(browser, "owned-thread", "private message")).entry;
  const accepted = {schema_version: "are.codex-client-accepted-turn/v1", thread_id: pending.thread_id,
    request_key: pending.request_key, text_digest: pending.text_digest,
    turn_id: "turn-accepted", accepted_at: "2026-09-26T00:00:00.000Z"};
  assert.throws(() => reconcileTurnReceipt(browser, pending, accepted), /conflicts/);
  assert.equal(readPendingTurn(browser).request_key, pending.request_key);
  assert.throws(() => reconcileTurnReceipt(browser, null, {...accepted, text_digest: "b".repeat(64)}), /conflicts/);
  const result = reconcileTurnReceipt(browser, null, accepted);
  assert.equal(result.acknowledged, true);
  assert.equal(result.pending, null);
  assert.equal(result.accepted.turn_id, "turn-accepted");
  assert.equal(readPendingTurn(browser), null);
  assert.equal(JSON.stringify(result).includes("private message"), false);
});

test("browser adopts the host binding and clears a verified recovered turn without message text", async () => {
  const browser = storage();
  const local = (await preparePendingTurn(browser, "owned-thread", "private message")).entry;
  const bound = {...local, schema_version: "are.codex-client-pending-turn/v2",
    request_binding_digest: "b".repeat(64)};
  assert.deepEqual(adoptPendingTurn(browser, bound), bound);
  const recovered = {schema_version: "are.codex-client-recovered-turn/v1", thread_id: local.thread_id,
    request_key: local.request_key, text_digest: local.text_digest, turn_id: "turn-recovered",
    accepted_at: "2026-09-27T00:00:00.000Z", gateway_recovery: {
      schema_version: "are.gateway-turn-recovery/v1", request_key: local.request_key,
      thread_id: local.thread_id, turn_id: "turn-recovered", receipt_digest: "c".repeat(64)}};
  const result = reconcileTurnReceipt(browser, null, recovered);
  assert.equal(result.acknowledged, true);
  assert.equal(readPendingTurn(browser), null);
  assert.equal(JSON.stringify(result).includes("private message"), false);
});

test("an unrelated last receipt preserves a new browser intent", async () => {
  const browser = storage();
  const pending = (await preparePendingTurn(browser, "owned-thread", "a new message")).entry;
  const accepted = {schema_version: "are.codex-client-accepted-turn/v1", thread_id: "owned-thread",
    request_key: "turn:older", text_digest: "a".repeat(64), turn_id: "turn-older", accepted_at: "2026-09-26T00:00:00.000Z"};
  const result = reconcileTurnReceipt(browser, null, accepted);
  assert.equal(result.acknowledged, false);
  assert.equal(result.pending.request_key, pending.request_key);
  assert.equal(readPendingTurn(browser).request_key, pending.request_key);
});

test("an older matching receipt clears its browser marker after a newer acceptance", async () => {
  const browser = storage();
  const pending = (await preparePendingTurn(browser, "owned-thread", "older private message")).entry;
  const earlier = {schema_version: "are.codex-client-accepted-turn/v1", thread_id: pending.thread_id,
    request_key: pending.request_key, text_digest: pending.text_digest,
    turn_id: "turn-earlier", accepted_at: "2026-09-28T00:00:00.000Z"};
  const later = {...earlier, request_key: "turn:later", turn_id: "turn-later", text_digest: "b".repeat(64)};
  const result = reconcileTurnReceipt(browser, null, [earlier, later]);
  assert.equal(result.acknowledged, true);
  assert.equal(result.accepted.turn_id, "turn-later");
  assert.equal(readPendingTurn(browser), null);
  browser.setItem(PENDING_TURN_STORAGE_KEY, JSON.stringify(pending));
  const otherPending = {...pending, request_key: "turn:00000000-0000-0000-0000-000000000000",
    text_digest: "d".repeat(64)};
  const joined = reconcileTurnReceipt(browser, otherPending, [earlier, later]);
  assert.equal(joined.acknowledged, true);
  assert.equal(joined.pending.request_key, otherPending.request_key);
  assert.equal(readPendingTurn(browser).request_key, otherPending.request_key);
  browser.setItem(PENDING_TURN_STORAGE_KEY, JSON.stringify(pending));
  assert.throws(() => reconcileTurnReceipt(browser, null, [earlier, earlier]), /invalid/);
  assert.equal(readPendingTurn(browser).request_key, pending.request_key);
  assert.throws(() => reconcileTurnReceipt(browser, null, [{...earlier, text_digest: "c".repeat(64)}, later]), /conflicts/);
  assert.equal(readPendingTurn(browser).request_key, pending.request_key);
});
