import assert from "node:assert/strict";
import test from "node:test";
import {compileToolValidators, createGlmClient, hash} from "./transport-bounded-g02-v1.mjs";
import {createGlmClient as createPredecessor} from "../full-cycle-80/snapshot/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/packet-diversity-v1/transport-bounded-v3.mjs";

const tool = (name = "read_file", parameters = {type: "object", properties: {path: {type: "string"}}, required: ["path"], additionalProperties: false}) => ({type: "function", function: {name, description: "test", parameters}});

test("compiles exact own-name validators bound to request and schemas", () => {
  const tools = [tool()], request = hash({messages: [{role: "user", content: "x"}], tools});
  const binding = compileToolValidators(tools, request);
  assert.equal(binding.request_sha256, request); assert.equal(binding.validators.read_file({path: "x"}), true); assert.equal(binding.validators.read_file({path: 1}), false);
  assert.equal(Object.getPrototypeOf(binding.validators), null); assert.match(binding.binding_sha256, /^[a-f0-9]{64}$/);
});

test("rejects duplicate names, invalid schemas and malformed tool declarations", () => {
  const request = "a".repeat(64);
  assert.throws(() => compileToolValidators([tool(), tool()], request), /tool-schema-name-duplicate/);
  assert.throws(() => compileToolValidators([tool("bad", {type: "not-a-json-schema-type"})], request), /tool-schema-compile-failed/);
  assert.throws(() => compileToolValidators([{type: "function", function: {name: "x"}}], request), /tool-schema-input-invalid/);
  assert.throws(() => compileToolValidators([tool()], "not-a-hash"), /tool-schema-input-invalid/);
});

test("G02 identity cannot reopen a predecessor response-policy ledger", () => {
  const options = {chat_endpoint: "http://127.0.0.1/chat/completions", tokenizer_endpoint: "http://127.0.0.1/tokenizer", persistence: {atomicJson() {}}, before_dispatch() {}};
  const current = createGlmClient(options), predecessor = createPredecessor(options);
  assert.notEqual(current.identity, predecessor.identity);
});
