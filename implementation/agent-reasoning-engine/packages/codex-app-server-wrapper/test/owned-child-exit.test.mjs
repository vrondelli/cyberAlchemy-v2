import assert from "node:assert/strict";
import {EventEmitter} from "node:events";
import {test} from "node:test";
import {waitForOwnedChildExit} from "../src/owned-child-exit.mjs";

test("supervisor observes a managed child that exited before monitoring", async () => {
  const child = new EventEmitter();
  child.exitCode = 1;
  child.signalCode = null;
  assert.equal(await waitForOwnedChildExit(child, "managed-exited"), "managed-exited");
  assert.equal(child.listenerCount("exit"), 0);
});

test("supervisor observes a managed child that exits after monitoring", async () => {
  const child = new EventEmitter();
  child.exitCode = null;
  child.signalCode = null;
  const observed = waitForOwnedChildExit(child, "managed-exited");
  child.exitCode = 1;
  child.emit("exit", 1, null);
  assert.equal(await observed, "managed-exited");
  assert.equal(child.listenerCount("exit"), 0);
  assert.equal(child.listenerCount("error"), 0);
});
