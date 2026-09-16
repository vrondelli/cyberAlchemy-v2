import assert from "node:assert/strict";
import {EventEmitter} from "node:events";
import {PassThrough} from "node:stream";
import test from "node:test";

import {
  createCodexGatewayBackendAdapter,
  createJsonLineProcessBackendAdapter,
  spawnGatewayBackend,
  validateGatewayBackendAdapter,
} from "../index.mjs";

function fakeChild() {
  const child = new EventEmitter();
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.kill = () => {};
  return child;
}

test("Codex is the backward-compatible default implementation of the gateway backend contract", () => {
  const adapter = createCodexGatewayBackendAdapter();
  assert.equal(validateGatewayBackendAdapter(adapter).ok, true);
  let invocation = null;
  const child = spawnGatewayBackend(adapter, {mode: "direct-stdio"}, {
    spawn_impl: (command, args, options) => {
      invocation = {command, args, options};
      return fakeChild();
    },
  });
  assert.equal(child.stdin.writable, true);
  assert.deepEqual(invocation, {command: "codex", args: ["app-server", "--listen", "stdio://"], options: {stdio: ["pipe", "pipe", "pipe"]}});
});

test("a model-neutral JSON-lines process can satisfy the same gateway backend contract", () => {
  let invocation = null;
  const adapter = createJsonLineProcessBackendAdapter({adapter_id: "fixture-agent/v1", command: "fixture-agent", args: ["serve", "--jsonl"]});
  const child = spawnGatewayBackend(adapter, {}, {
    spawn_impl: (command, args, options) => {
      invocation = {command, args, options};
      return fakeChild();
    },
  });
  assert.equal(child.stdout.readable, true);
  assert.deepEqual(invocation, {command: "fixture-agent", args: ["serve", "--jsonl"], options: {stdio: ["pipe", "pipe", "pipe"]}});
});

test("backend adapters fail closed before a session accepts an invalid transport", () => {
  assert.equal(validateGatewayBackendAdapter({}).ok, false);
  assert.throws(() => spawnGatewayBackend({schema_version: "are.gateway-backend-adapter/v1", adapter_id: "broken/v1", spawn: () => ({})}), /invalid process transport/i);
});
