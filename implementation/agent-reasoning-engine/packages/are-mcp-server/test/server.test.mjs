import assert from "node:assert/strict";
import {mkdtempSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import test from "node:test";

import {createAreMcpServer} from "../index.mjs";
import {runCli} from "../src/server.mjs";
import {decide} from "../../../src/decision-cli.mjs";

const repositoryRoot = resolve(import.meta.dirname, "../../../../..");
const serverExecutable = resolve(import.meta.dirname, "../bin/are-mcp-server.mjs");

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "are-mcp-"));
  const server = createAreMcpServer({evolutionRoot: root, repositoryRoot});
  return {root, server};
}

test("MCP initializes and exposes the four bounded ARE tools", async (context) => {
  const {root, server} = fixture();
  context.after(() => rmSync(root, {recursive: true, force: true}));
  const initialized = await server.handle({jsonrpc: "2.0", id: 1, method: "initialize", params: {protocolVersion: "2025-06-18"}});
  assert.equal(initialized.result.serverInfo.name, "are");
  assert.match(initialized.result.instructions, /receipts grant no approval/);
  const listed = await server.handle({jsonrpc: "2.0", id: 2, method: "tools/list", params: {}});
  assert.deepEqual(listed.result.tools.map(({name}) => name), ["are_decide", "evolution_status", "evolution_command", "evidence_get"]);
});

test("ARE decisions return a real route receipt", async (context) => {
  const {root, server} = fixture();
  context.after(() => rmSync(root, {recursive: true, force: true}));
  const result = await server.callTool("are_decide", {
    operation: "route",
    request: {
      schema_version: "are.cli-request/v1",
      session_id: "mcp-test-session",
      request_id: "mcp-test-request",
      request: {
        raw_request: "Explain the repository architecture",
        objective_kind: "understand",
        field_postures: {request_id: "inferred", raw_request: "explicit", objective_kind: "inferred", requested_effects: "absent", target_refs: "absent", constraints: "absent", evidence_refs: "absent"},
      },
    },
  });
  assert.equal(result.isError, false);
  assert.equal(result.structuredContent.ok, true);
  assert.equal(result.structuredContent.result.selected.route_id, "CA2-ROUTE-UNDERSTAND");
  assert.match(result.structuredContent.receipt.receipt_digest, /^[a-f0-9]{64}$/);
  assert.deepEqual(result.structuredContent, decide("route", {
    schema_version: "are.cli-request/v1",
    session_id: "mcp-test-session",
    request_id: "mcp-test-request",
    request: {
      raw_request: "Explain the repository architecture",
      objective_kind: "understand",
      field_postures: {request_id: "inferred", raw_request: "explicit", objective_kind: "inferred", requested_effects: "absent", target_refs: "absent", constraints: "absent", evidence_refs: "absent"},
    },
  }));
  assert.equal(result.structuredContent.policy_source.mode, "compiled-bundle");
});

test("development-live policy requires an explicit server option", async (context) => {
  const root = mkdtempSync(join(tmpdir(), "are-mcp-live-"));
  context.after(() => rmSync(root, {recursive: true, force: true}));
  const server = createAreMcpServer({evolutionRoot: root, repositoryRoot, developmentLive: true});
  const result = await server.callTool("are_decide", {
    operation: "route",
    request: {
      schema_version: "are.cli-request/v1", session_id: "mcp-live-session", request_id: "mcp-live-request",
      request: {raw_request: "Explain the repository architecture", objective_kind: "understand",
        field_postures: {request_id: "inferred", raw_request: "explicit", objective_kind: "inferred", requested_effects: "absent", target_refs: "absent", constraints: "absent", evidence_refs: "absent"}},
    },
  });
  assert.equal(result.structuredContent.ok, true);
  assert.equal(result.structuredContent.policy_source.mode, "development-live");
});

test("STDIO executable carries CLI-identical receipts through every decision boundary", async (context) => {
  const root = mkdtempSync(join(tmpdir(), "are-mcp-stdio-"));
  context.after(() => rmSync(root, {recursive: true, force: true}));
  const args = ["--evolution-root", root, "--repository-root", repositoryRoot];
  const base = {
    schema_version: "are.cli-request/v1", session_id: "mcp-stdio-session", request_id: "mcp-stdio-request",
    request: {raw_request: "Explain the repository architecture", objective_kind: "understand",
      field_postures: {request_id: "inferred", raw_request: "explicit", objective_kind: "inferred", requested_effects: "absent", target_refs: "absent", constraints: "absent", evidence_refs: "absent"}},
  };
  const invoke = async (operation, request, flags = []) => {
    const message = {jsonrpc: "2.0", id: 1, method: "tools/call", params: {name: "are_decide", arguments: {operation, request}}};
    const response = await runCli(serverExecutable, [...args, ...flags], message);
    assert.equal(response.ok, true);
    assert.equal(response.code, 0);
    assert.equal(response.value.id, 1);
    return response.value.result.structuredContent;
  };
  const route = await invoke("route", base);
  assert.deepEqual(route, decide("route", base));
  assert.equal(route.policy_source.mode, "compiled-bundle");
  const bound = {...base, previous_receipt: route.receipt};
  const requests = [
    ["context", bound],
    ["effect", {...bound, effect: {method: "item/commandExecution/requestApproval", item_id: "mcp-stdio-effect",
      proposal: {command: "example only; never executed"}}}],
    ["continue", {...bound, continuation: {completion: {completion_id: "mcp-stdio-complete", status: "completed",
      continuation_required: false, evidence_refs: []}, options: []}}],
  ];
  for (const [operation, request] of requests) assert.deepEqual(await invoke(operation, request), decide(operation, request), operation);
  const live = await invoke("route", base, ["--development-live"]);
  assert.equal(live.policy_source.mode, "development-live");
  assert.equal(live.route_contract.route_id, route.route_contract.route_id);
});

test("evolution status and content-addressed evidence round trip", async (context) => {
  const {root, server} = fixture();
  context.after(() => rmSync(root, {recursive: true, force: true}));
  const status = await server.callTool("evolution_status", {view: "inspect"});
  assert.equal(status.isError, false);
  assert.equal(status.structuredContent.ok, true);
  assert.deepEqual(status.structuredContent.value.phases, []);
  const stored = await server.callTool("evolution_command", {
    surface: "kernel",
    request: {schema_version: "are.evolution-kernel-request/v1", operation: "put-artifact", artifact: {bytes_utf8: "bounded evidence", media_type: "text/plain", semantic_binding: {cycle_ref: "cycle:mcp-test", cycle_definition_digest: "0".repeat(64), role: "evidence", provenance_refs: ["source:mcp-test"], claim_ceiling: "local transport test only"}}},
  });
  assert.equal(stored.isError, false);
  const identity = stored.structuredContent.value;
  const loaded = await server.callTool("evidence_get", {sha256: identity.sha256, byte_length: identity.byte_length});
  assert.equal(loaded.isError, false);
  assert.equal(loaded.structuredContent.content, "bounded evidence");
});

test("MCP rejects arbitrary evidence paths and malformed commands", async (context) => {
  const {root, server} = fixture();
  context.after(() => rmSync(root, {recursive: true, force: true}));
  const pathRead = await server.callTool("evidence_get", {path: "/etc/passwd"});
  assert.equal(pathRead.isError, true);
  assert.deepEqual(pathRead.structuredContent.reason_codes, ["mcp.evidence-request-invalid"]);
  const malformed = await server.callTool("evolution_command", {surface: "kernel", request: {operation: "inspect"}});
  assert.equal(malformed.isError, true);
  assert.equal(malformed.structuredContent.ok, false);
});

test("MCP bounds child execution and never reflects raw stderr", async (context) => {
  const root = mkdtempSync(join(tmpdir(), "are-mcp-child-"));
  context.after(() => rmSync(root, {recursive: true, force: true}));
  const slow = join(root, "slow.mjs");
  const invalidOutput = join(root, "invalid-output.mjs");
  writeFileSync(slow, "process.stdin.resume(); setTimeout(() => {}, 10000);\n");
  writeFileSync(invalidOutput, "process.stdin.resume(); process.stderr.write('sensitive diagnostic'); process.stdout.write('not-json');\n");
  const timedOut = await runCli(slow, [], {}, {timeout_ms: 20});
  assert.deepEqual(timedOut, {ok: false, reason: "mcp.child-timeout"});
  const invalid = await runCli(invalidOutput, [], {});
  assert.equal(invalid.ok, false);
  assert.equal(invalid.reason, "mcp.child-invalid-json");
  assert.equal(invalid.stderr_bytes > 0, true);
  assert.equal(Object.hasOwn(invalid, "stderr"), false);
});
