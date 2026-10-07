import assert from "node:assert/strict";
import test from "node:test";
import {clearPendingThread, PENDING_THREAD_STORAGE_KEY, preparePendingThread, readPendingThread} from "../client/pending-thread.js";

function storage() {
  const values = new Map();
  return {getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)};
}

test("thread creation checkpoints only workspace digest and reuses its key after an uncertain response", async () => {
  const browser = storage();
  const cwd = "/private/workspace";
  const first = await preparePendingThread(browser, cwd);
  assert.equal(first.recovered, false);
  assert.equal(browser.getItem(PENDING_THREAD_STORAGE_KEY).includes(cwd), false);
  const retry = await preparePendingThread(browser, cwd);
  assert.equal(retry.recovered, true);
  assert.equal(retry.entry.request_key, first.entry.request_key);
  await assert.rejects(preparePendingThread(browser, "/another/workspace"), /exact prior workspace/);
  clearPendingThread(browser, retry.entry);
  assert.equal(readPendingThread(browser), null);
});

test("thread creation blocks tampered or uncheckpointed browser state before dispatch", async () => {
  const browser = storage();
  await preparePendingThread(browser, "/private/workspace");
  browser.setItem(PENDING_THREAD_STORAGE_KEY, "{bad-json");
  assert.throws(() => readPendingThread(browser), /unreadable/);
  const unwritable = {getItem: () => null, setItem: () => {throw Error("storage denied");}};
  await assert.rejects(preparePendingThread(unwritable, "/private/workspace"), /storage denied/);
});
