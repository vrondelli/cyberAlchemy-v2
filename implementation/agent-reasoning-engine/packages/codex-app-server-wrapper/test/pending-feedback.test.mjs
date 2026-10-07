import assert from "node:assert/strict";
import test from "node:test";
import {adoptPendingFeedbackReview, clearPendingFeedback, markFeedbackPendingReview, PENDING_FEEDBACK_STORAGE_KEY, preparePendingFeedback, readPendingFeedback} from "../client/pending-feedback.js";

function storage() {
  const values = new Map();
  return {getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)};
}

test("pending feedback keeps only a digest and reuses its id after an uncertain response", async () => {
  const browser = storage();
  const text = "Your last answer was too technical. From now on, use plain language.";
  const first = await preparePendingFeedback(browser, "thread:a", text);
  assert.equal(first.recovered, false);
  assert.equal(browser.getItem(PENDING_FEEDBACK_STORAGE_KEY).includes(text), false);
  const retry = await preparePendingFeedback(browser, "thread:a", text);
  assert.equal(retry.recovered, true);
  assert.equal(retry.entry.request_key, first.entry.request_key);
  await assert.rejects(preparePendingFeedback(browser, "thread:b", text), /another thread/);
  await assert.rejects(preparePendingFeedback(browser, "thread:a", "Changed"), /exact prior feedback/);
  clearPendingFeedback(browser, retry.entry);
  assert.equal(readPendingFeedback(browser), null);
});

test("pending feedback rejects tampered or uncheckpointed browser state", async () => {
  const browser = storage();
  await preparePendingFeedback(browser, "thread:a", "Private feedback");
  browser.setItem(PENDING_FEEDBACK_STORAGE_KEY, "{bad-json");
  assert.throws(() => readPendingFeedback(browser), /unreadable/);
  const unwritable = {getItem: () => null, setItem: () => {throw Error("storage denied");}};
  await assert.rejects(preparePendingFeedback(unwritable, "thread:a", "Private feedback"), /storage denied/);
});

test("acknowledged pending review retains only identity and digest across reload", async () => {
  const browser = storage();
  const text = "A task-specific correction";
  const first = await preparePendingFeedback(browser, "thread:a", text);
  const review = markFeedbackPendingReview(browser, first.entry);
  assert.equal(review.schema_version, "are.codex-client-pending-feedback-review/v1");
  assert.equal(browser.getItem(PENDING_FEEDBACK_STORAGE_KEY).includes(text), false);
  assert.deepEqual(readPendingFeedback(browser), review);
  assert.equal(markFeedbackPendingReview(browser, first.entry).request_key, review.request_key);
  assert.equal((await preparePendingFeedback(browser, "thread:a", text)).entry.request_key, review.request_key);
  await assert.rejects(preparePendingFeedback(browser, "thread:a", "Changed"), /exact prior feedback/);
  clearPendingFeedback(browser, review);
  assert.equal(readPendingFeedback(browser), null);
});

test("content-free pending review can be explicitly recovered without replacing an existing checkpoint", async () => {
  const browser = storage();
  const text = "Private feedback";
  const digest = (await preparePendingFeedback(storage(), "thread:a", text)).entry.text_digest;
  const item = {feedback_id: "feedback:11111111-1111-4111-8111-111111111111", text_digest: digest};
  const adopted = adoptPendingFeedbackReview(browser, "thread:a", item);
  assert.equal(adopted.request_key, item.feedback_id);
  assert.equal(browser.getItem(PENDING_FEEDBACK_STORAGE_KEY).includes(text), false);
  assert.equal((await preparePendingFeedback(browser, "thread:a", text)).entry.request_key, item.feedback_id);
  assert.throws(() => adoptPendingFeedbackReview(browser, "thread:a", item), /existing feedback checkpoint/);
  clearPendingFeedback(browser, adopted);
  assert.throws(() => adoptPendingFeedbackReview(browser, "thread:a", {...item, feedback_id: "bad"}), /identity is invalid/);
});
