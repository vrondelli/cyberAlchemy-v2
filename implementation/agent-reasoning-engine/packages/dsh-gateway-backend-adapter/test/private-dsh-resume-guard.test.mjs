import assert from "node:assert/strict";
import {createRequire} from "node:module";
import test from "node:test";
import {pathToFileURL} from "node:url";

const require = createRequire(import.meta.url);
const dshRequire = createRequire(require.resolve("@deepseek-ai/dsh/package.json"));
const {AgentLoop} = await import(pathToFileURL(dshRequire.resolve("@deepseek-ai/dsh-agent-loop")).href);
const ownerSymbol = Symbol.for("are.dsh-web-host-owner/v1");

test("native resume checks ARE ownership before opening a persisted Session for write", () => {
  let opened = false;
  const ownerCtx = {root: {[ownerSymbol]: {
    assertNativeResumeOpen(id) {
      assert.equal(id, "owned-session");
      throw new Error("fixture.resume-denied");
    },
  }}};
  const persistence = {open() { opened = true; throw new Error("fixture.opened"); }};
  assert.throws(() => AgentLoop.prototype.resumeWith.call({}, ownerCtx, persistence,
    {resumeSessionId: "owned-session"}), /fixture.resume-denied/u);
  assert.equal(opened, false);
});

test("native resume validates loaded history before appending interrupted-turn closers", async () => {
  let appended = false;
  let closed = false;
  const ownerCtx = {root: {[ownerSymbol]: {
    assertNativeResumeOpen(id) { assert.equal(id, "owned-session"); },
    assertNativeResumeLoaded(value) {
      assert.equal(value.sessionId, "owned-session");
      assert.deepEqual(value.events, []);
      throw new Error("fixture.loaded-history-denied");
    },
  }}, effect: () => async () => {}};
  const persistence = {async open(id, mode) {
    assert.equal(id, "owned-session");
    assert.equal(mode, "write");
    return {header: {id}, inheritedEventCount: 0,
      async read() { return {events: [], eventState: {}}; },
      async append() { appended = true; },
      async close() { closed = true; }};
  }};
  const loop = {ownership: {signal: new AbortController().signal,
    trackWrapper() {}}};
  await assert.rejects(AgentLoop.prototype.resumeWith.call(loop, ownerCtx, persistence,
    {resumeSessionId: "owned-session"}), /fixture.loaded-history-denied/u);
  assert.equal(appended, false);
  assert.equal(closed, true);
});
