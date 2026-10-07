import assert from "node:assert/strict";
import {mkdtempSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";

import {parseCodexScopeConfig, runCodexAppServerProposal} from "../src/codex-coding-agent.mjs";

test("Codex scope configuration carries no model credential and rejects unknown fields", () => {
  const parsed = parseCodexScopeConfig({
    schema_version: "are.codex-coding-agent-scope/v1",
    observation_allowlist: ["package.json", "src/a.mjs"],
    mutation_allowlist: ["src/a.mjs"],
    verification_command: [process.execPath, "--test"],
  });
  assert.deepEqual(parsed.mutation_allowlist, ["src/a.mjs"]);
  assert.equal(parsed.maximum_steps, 8);
  assert.deepEqual(parsed.tool_policy.allow, ["list-files", "read-file", "search-text", "repository-map"]);
  assert.equal(parsed.repository_map.maximum_files, 256);
  assert.deepEqual(parseCodexScopeConfig(parsed), parsed);
  assert.equal(Object.hasOwn(parsed, "credential"), false);
  assert.throws(() => parseCodexScopeConfig({...parsed, credential: "forbidden"}), /invalid/u);
});

test("TUI coding proposal defaults to its own pinned gateway consumer, without spawning a direct wrapper", async () => {
  const root = mkdtempSync(join(tmpdir(), "are-tui-gateway-test-"));
  try {
    writeFileSync(join(root, "package.json"), "{\"type\":\"module\"}\n");
    const profilePath = join(root, "profile.json");
    writeFileSync(profilePath, JSON.stringify({protocol_binding: {observed_codex_version: "codex-cli test"}}));
    const connections = [];
    let spawned = false;
    let resumeToken = null;
    const options = {
      config: {schema_version: "are.codex-coding-agent-scope/v1", observation_allowlist: ["package.json"], mutation_allowlist: ["package.json"], verification_command: [process.execPath, "--test"]},
      repositoryRoot: root, authorityRepositoryRoot: root, codexProfile: profilePath,
      gatewaySocket: join(root, "gateway.sock"), runId: "test-run", request: "propose a patch",
      onGatewayContinuity(token) { resumeToken = token; },
    };
    const dependencies = {
      connectGateway(input) { connections.push(input); return {kind: "fake-gateway", inspect: () => ({resume_token: "private-resume-token"})}; },
      spawnTransport() { spawned = true; throw new Error("direct wrapper must not start"); },
      createClient(transport) { assert.equal(transport.kind, "fake-gateway"); return {kind: "fake-client"}; },
      async runSession(input) { assert.equal(input.client.kind, "fake-client");
        assert.equal(input.durable_thread, connections.length === 3);
        return {status: "BLOCK", reason_codes: ["fixture-stop"]}; },
    };
    const result = await runCodexAppServerProposal(options, dependencies);
    assert.equal(result.status, "BLOCK");
    assert.equal(result.codex_binding.source, "gateway-handshake");
    assert.equal(JSON.stringify(result).includes("private-resume-token"), false);
    assert.equal(resumeToken, "private-resume-token");
    assert.equal(spawned, false);
    assert.deepEqual(connections.map(({socket_path, consumer_id, lane, expected_backend_adapter_id}) => ({socket_path, consumer_id, lane, expected_backend_adapter_id})), [{
      socket_path: join(root, "gateway.sock"), consumer_id: "codex:coding-proposal", lane: "interaction-bound", expected_backend_adapter_id: "codex-app-server/v1",
    }]);
    await runCodexAppServerProposal({...options, runId: "test-run-2", gatewayResumeToken: resumeToken}, dependencies);
    assert.equal(connections[1].resume_token, "private-resume-token");
    await runCodexAppServerProposal({...options, runId: "test-run-3", durableProposalThread: true}, dependencies);
  } finally { rmSync(root, {recursive: true, force: true}); }
});
