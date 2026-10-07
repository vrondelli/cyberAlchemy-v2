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
import {backendEnvironment, GATEWAY_PRIVATE_ENV_KEYS} from "../src/backend-environment.mjs";

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
  assert.equal(invocation.command, "codex");
  assert.deepEqual(invocation.args, ["app-server", "--listen", "stdio://"]);
  assert.deepEqual(invocation.options.stdio, ["pipe", "pipe", "pipe"]);
  for (const key of GATEWAY_PRIVATE_ENV_KEYS) assert.equal(Object.hasOwn(invocation.options.env, key), false);
});

test("Codex backend environment excludes gateway credentials without dropping ordinary runtime variables", () => {
  const source = {PATH: "/fixture/bin", HOME: "/fixture/home",
    ARE_GATEWAY_CONNECTION_TOKEN: "gateway-secret",
    ARE_ADAPTER_OBSERVATION_TOKEN: "observation-secret",
    ARE_HOSTED_INPUT_ATTESTATION_KEY: "attestation-secret"};
  assert.deepEqual(backendEnvironment(source), {PATH: "/fixture/bin", HOME: "/fixture/home"});
  assert.equal(source.ARE_GATEWAY_CONNECTION_TOKEN, "gateway-secret");
});

test("Codex spawn receives no gateway credentials even when the gateway process has them", () => {
  const previous = new Map(GATEWAY_PRIVATE_ENV_KEYS.map((key) => [key, process.env[key]]));
  let childEnvironment;
  try {
    for (const key of GATEWAY_PRIVATE_ENV_KEYS) process.env[key] = `fixture-${key}`;
    spawnGatewayBackend(createCodexGatewayBackendAdapter(), {mode: "direct-stdio"}, {
      spawn_impl: (_command, _args, options) => {
        childEnvironment = options.env;
        return fakeChild();
      },
    });
    for (const key of GATEWAY_PRIVATE_ENV_KEYS) assert.equal(Object.hasOwn(childEnvironment, key), false);
    const pathKey = Object.keys(childEnvironment).find((key) => key.toLowerCase() === "path");
    assert.ok(pathKey, "backend process must retain the platform PATH");
    assert.equal(childEnvironment[pathKey], process.env[pathKey]);
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
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
