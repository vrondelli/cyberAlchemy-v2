import assert from "node:assert/strict";
import {EventEmitter} from "node:events";
import {PassThrough} from "node:stream";
import {dirname, resolve} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {createCodexAppServerWrapper, loadRepositoryProfile, runStdioProxy} from "../index.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const loaded = loadRepositoryProfile(resolve(packageRoot, "profiles/repository-v1.json"), repositoryRoot);
assert.equal(loaded.ok, true);

function wrapper() {
  return createCodexAppServerWrapper({loaded_profile: loaded.value, decision_profile: loaded.decision_profile, definition_catalog: loaded.definition_catalog, ontology_snapshot: loaded.ontology_snapshot, source_snapshot: loaded.source_snapshot, context_source_provider: loaded.context_source_provider});
}

function fakeChild() {
  const child = new EventEmitter();
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  return child;
}

function nextLine(stream) {
  return new Promise((resolveLine, reject) => {
    let buffer = "";
    const timer = setTimeout(() => reject(new Error("timed out waiting for JSON line")), 1000);
    stream.on("data", function onData(chunk) {
      buffer += chunk.toString("utf8");
      const index = buffer.indexOf("\n");
      if (index >= 0) {
        clearTimeout(timer);
        stream.off("data", onData);
        resolveLine(JSON.parse(buffer.slice(0, index)));
      }
    });
  });
}

test("stdio proxy forwards ordinary JSON-RPC bidirectionally", async () => {
  const child = fakeChild();
  const clientInput = new PassThrough();
  const clientOutput = new PassThrough();
  const clientError = new PassThrough();
  runStdioProxy({wrapper: wrapper(), spawn_impl: () => child, client_input: clientInput, client_output: clientOutput, client_error: clientError});

  const serverRequestPromise = nextLine(child.stdin);
  clientInput.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "initialize", params: {clientInfo: {name: "test", version: "1"}}})}\n`);
  const serverRequest = await serverRequestPromise;
  assert.equal(serverRequest.method, "initialize");

  const clientResponsePromise = nextLine(clientOutput);
  child.stdout.write(`${JSON.stringify({id: 1, result: {userAgent: "codex-test"}})}\n`);
  const clientResponse = await clientResponsePromise;
  assert.equal(clientResponse.result.userAgent, "codex-test");

  clientInput.end();
  child.stdout.end();
  child.stderr.end();
  child.emit("exit", 0, null);
});

test("stdio proxy turns malformed client JSON into a local parse error", async () => {
  const child = fakeChild();
  const clientInput = new PassThrough();
  const clientOutput = new PassThrough();
  runStdioProxy({wrapper: wrapper(), spawn_impl: () => child, client_input: clientInput, client_output: clientOutput, client_error: new PassThrough()});
  const errorPromise = nextLine(clientOutput);
  clientInput.write("{not-json}\n");
  const error = await errorPromise;
  assert.equal(error.error.code, -32700);
  clientInput.end();
  child.stdout.end();
  child.stderr.end();
  child.emit("exit", 0, null);
});

test("stdio proxy drains a pending response before closing child stdin", async () => {
  const child = fakeChild();
  const clientInput = new PassThrough();
  const clientOutput = new PassThrough();
  runStdioProxy({wrapper: wrapper(), spawn_impl: () => child, client_input: clientInput, client_output: clientOutput, client_error: new PassThrough()});
  let childEnded = false;
  child.stdin.on("end", () => { childEnded = true; });
  const serverRequestPromise = nextLine(child.stdin);
  clientInput.end(`${JSON.stringify({jsonrpc: "2.0", id: 7, method: "initialize", params: {clientInfo: {name: "test", version: "1"}}})}\n`);
  await serverRequestPromise;
  assert.equal(childEnded, false);
  const clientResponsePromise = nextLine(clientOutput);
  child.stdout.write(`${JSON.stringify({id: 7, result: {ready: true}})}\n`);
  assert.equal((await clientResponsePromise).result.ready, true);
  await new Promise((resolveEnd) => child.stdin.once("end", resolveEnd));
  assert.equal(childEnded, true);
  child.stdout.end();
  child.stderr.end();
  child.emit("exit", 0, null);
});
