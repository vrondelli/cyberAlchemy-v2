import assert from "node:assert/strict";
import {existsSync, readFileSync, readdirSync} from "node:fs";
import test from "node:test";
import {join, relative} from "node:path";
import {fileURLToPath} from "node:url";

const registry = JSON.parse(readFileSync(new URL("../src/integration-surface-v1.json", import.meta.url), "utf8"));
const product = JSON.parse(readFileSync(new URL("../product.json", import.meta.url), "utf8"));
const byId = new Map(registry.entrypoints.map((entry) => [entry.id, entry]));
const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const productRoot = fileURLToPath(new URL("../", import.meta.url));

test("integration map has unique, bounded, non-activating entrypoints", () => {
  assert.equal(registry.schema_version, "are.integration-surface-map/v1");
  assert.equal(registry.status, "candidate-observed-not-activated");
  assert.equal(registry.authority_effect, "none");
  assert.equal(byId.size, registry.entrypoints.length);
  assert.equal(registry.entrypoints.filter((entry) => entry.layer === "session-controller" && entry.disposition === "target-canonical").length, 1);
  for (const entry of registry.entrypoints) {
    assert.match(entry.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/u);
    assert.ok(registry.layers.includes(entry.layer), entry.id);
    assert.ok(registry.dispositions.includes(entry.disposition), entry.id);
    assert.equal(entry.activation_eligible_now, false, entry.id);
    assert.ok(typeof entry.claim_limit === "string" && entry.claim_limit.length > 12, entry.id);
    assert.ok(Array.isArray(entry.source_refs), entry.id);
    assert.ok(Array.isArray(entry.repository_source_refs ?? []), entry.id);
    assert.ok(entry.source_refs.length + (entry.repository_source_refs?.length ?? 0) > 0, entry.id);
    for (const ref of entry.source_refs) {
      assert.match(ref, /^(?:(?:bin|src|packages|apps)\/[a-zA-Z0-9._/-]+|product\.json)$/u, entry.id);
      assert.equal(ref.split("/").includes(".."), false, entry.id);
      assert.equal(existsSync(new URL(`../${ref}`, import.meta.url)), true, `${entry.id}:${ref}`);
    }
    for (const ref of entry.repository_source_refs ?? []) {
      assert.match(ref, /^(?:cyberalchemy-exchange|development|essays|implementation|keld-project|orchestrator|workspace)\/[a-zA-Z0-9._/-]+$/u, entry.id);
      assert.equal(ref.split("/").includes(".."), false, entry.id);
      assert.equal(existsSync(new URL(`../../../${ref}`, import.meta.url)), true, `${entry.id}:${ref}`);
    }
    if (["decision-interface", "context-injection", "transport-edge", "model-broker", "provider-egress", "model-transport", "context-source", "internal-capability", "observer", "evolution-handoff", "integration-evidence"].includes(entry.layer)) {
      assert.notEqual(entry.disposition, "target-canonical", entry.id);
    }
  }
  for (const group of registry.overlap_groups) {
    assert.ok(group.members.length > 1, group.id);
    assert.equal(new Set(group.members).size, group.members.length, group.id);
    for (const member of group.members) {
      assert.ok(byId.has(member), `${group.id}:${member}`);
      if (group.id !== "retired-client-provenance") assert.notEqual(byId.get(member).disposition, "retired-provenance", `${group.id}:${member}`);
    }
  }
  assert.deepEqual(registry.overlap_groups.find((group) => group.id === "retired-client-provenance")?.members,
    ["tui-conversation-client", "tui-coding-proposal-client"]);
  assert.equal(byId.get("legacy-codex-governance-proxy").disposition, "compatibility-only");
  assert.equal(byId.get("legacy-codex-desktop-bridge").disposition, "compatibility-only");
  assert.equal(byId.get("tui-conversation-client").disposition, "retired-provenance");
  assert.equal(byId.get("tui-coding-proposal-client").disposition, "retired-provenance");
  assert.equal(byId.get("desktop-companion").disposition, "separate-boundary");
  assert.equal(byId.get("host-hook-gateway-session-client").activation_eligible_now, false);
  assert.equal(byId.get("orchestrator-are-agent-executor").layer, "agent-executor");
  assert.ok(new Set(registry.overlap_groups.find((group) => group.id === "turn-ingress").members).has("legacy-codex-desktop-bridge"));
  const approval = registry.overlap_groups.find((group) => group.id === "effect-approval");
  assert.ok(approval.members.includes("legacy-codex-governance-proxy"));
  assert.ok(approval.members.includes("windows-browser-client"));
});

test("declared backend and interface layers do not inherit universal chat capabilities", () => {
  const components = new Map(product.components.map((item) => [item.component_id, item]));
  assert.equal(components.get("codex-app-server-wrapper").layer, "core");
  for (const id of ["dsh-gateway-backend-adapter", "are-mcp-server", "coding-agent-runtime"]) {
    assert.equal(components.get(id).default_enabled, false, id);
  }
  assert.equal(components.get("conversation-runtime").required, true);
  assert.equal(byId.get("dsh-headless-backend").capabilities.steering, "unsupported");
  assert.equal(byId.get("dsh-headless-backend").capabilities.effect_requests, "none-advertised");
  assert.equal(byId.get("dsh-headless-backend").capabilities.history_resume, "durable-opt-in-ephemeral-default");
  assert.equal(byId.get("generic-jsonl-process-backend").capabilities.steering, "unverified");
  assert.equal(byId.get("transparent-gateway-stdio-client").disposition, "compatibility-only");
  assert.equal(byId.get("conversation-runtime-facade").layer, "conversation-facade");
  assert.equal(byId.get("desktop-companion").layer, "observer");
  const integrations = new Set(product.integrations.map((item) => item.integration_id));
  assert.deepEqual(integrations, new Set(["codex-desktop-bridge", "are-product-package"]));
  assert.equal(byId.get("codex-desktop-bridge-declaration").layer, "integration-evidence");
  assert.equal(byId.get("are-product-package-declaration").layer, "integration-evidence");
  assert.equal(byId.get("module-port-adapters").layer, "internal-capability");
  assert.equal(byId.get("kite-retrieval-adapter").layer, "context-source");
  assert.equal(byId.get("checkpointed-compaction-context-hook").layer, "context-injection");
  assert.equal(byId.get("checkpointed-compaction-context-hook").activation_eligible_now, false);
});

test("known runnable cross-project ARE paths have distinct bounded owners", () => {
  const expected = new Map([
    ["legacy-codex-governance-proxy", "development/agent-reasoning-engine/codex-integration/runtime/proxy.mjs"],
    ["legacy-codex-desktop-bridge", "development/agent-reasoning-engine/codex-integration/client/desktop-bridge.mjs"],
    ["orchestrator-are-agent-executor", "orchestrator/capabilities/orchestration/src/are_adapter.rs"],
  ]);
  for (const [id, path] of expected) {
    const entry = byId.get(id);
    assert.ok(entry, id);
    assert.ok(entry.repository_source_refs.includes(path), `${id}:${path}`);
    assert.equal(entry.activation_eligible_now, false, id);
  }
  assert.ok(byId.get("legacy-codex-desktop-bridge").repository_source_refs.includes("essays/development/agent-runtime/implementation/desktop/src-tauri/src/main.rs"));
  assert.ok(byId.get("legacy-codex-desktop-bridge").repository_source_refs.includes("workspace/runtime/IMPLEMENTATION-MANIFEST.candidate.json"));
  assert.ok(byId.get("host-hook-gateway-session-client").source_refs.includes("src/gateway-session-client.mjs"));
  assert.ok(byId.get("persistent-gateway-acknowledged").source_refs.includes("packages/codex-app-server-wrapper/bin/are-codex-gateway.mjs"));
  assert.equal(byId.get("coding-agent-live-demo").layer, "interaction-client");
  assert.equal(byId.get("coding-agent-live-demo").disposition, "experimental");
  assert.equal(byId.get("coding-agent-live-demo").activation_eligible_now, false);
  assert.ok(byId.get("coding-agent-live-demo").source_refs.includes("packages/coding-agent-runtime/bin/live-demo.mjs"));
  assert.notEqual(byId.get("legacy-codex-governance-proxy").layer, byId.get("orchestrator-are-agent-executor").layer);
});

test("website, customer, pilot and exchange paths are classified without promoting them to the persistent gateway", () => {
  const expected = new Map([
    ["customer-direct-wrapper", ["session-controller", "keld-project/scripts/customer-app-server.mjs"]],
    ["public-website-chat", ["session-controller", "keld-project/are-documentation/server/chat.mjs"]],
    ["public-website-edge", ["transport-edge", "keld-project/are-documentation/server/edge-server.mjs"]],
    ["public-website-inference-broker", ["model-broker", "keld-project/are-documentation/server/broker-server.mjs"]],
    ["public-website-provider-gateway", ["provider-egress", "keld-project/are-documentation/server/provider-gateway-server.mjs"]],
    ["define-cli-interaction-client", ["interaction-client", "implementation/define-cli/src/app-server-agent.mjs"]],
    ["luna-pilot-gateway-host", ["integration-evidence", "workspace/plans/luna-vps/runtime/pilot-host.mjs"]],
    ["exchange-scripted-artifact-adapter", ["agent-executor", "cyberalchemy-exchange/knowledge-exchange-protocol/capabilities/alchlang-agent-exchange/v1/are-host.ts"]],
  ]);
  for (const [id, [layer, path]] of expected) {
    const entry = byId.get(id);
    assert.equal(entry?.layer, layer, id);
    assert.ok(entry.repository_source_refs.includes(path), `${id}:${path}`);
    assert.equal(entry.activation_eligible_now, false, id);
  }
  assert.equal(byId.get("persistent-gateway-acknowledged").disposition, "target-canonical");
  assert.equal(byId.get("public-website-chat").disposition, "experimental");
  assert.ok(registry.overlap_groups.find((group) => group.id === "website-provider-chain")?.members.includes("public-website-provider-gateway"));
  assert.ok(registry.overlap_groups.find((group) => group.id === "turn-ingress")?.members.includes("define-cli-interaction-client"));
  assert.ok(registry.overlap_groups.find((group) => group.id === "turn-ingress")?.members.includes("coding-agent-live-demo"));
  assert.equal(registry.overlap_groups.find((group) => group.id === "turn-ingress")?.members.includes("tui-coding-proposal-client"), false);
});

test("discontinued TUI modes remain provenance only, outside active controller groups", () => {
  for (const [id, source] of [
    ["tui-conversation-client", "implementation/cyberalchemy-tui/src/conversation-client.mjs"],
    ["tui-coding-proposal-client", "implementation/cyberalchemy-tui/src/codex-coding-agent.mjs"],
  ]) {
    const entry = byId.get(id);
    assert.equal(entry?.layer, "interaction-client", id);
    assert.equal(entry?.disposition, "retired-provenance", id);
    assert.equal(entry?.activation_eligible_now, false, id);
    assert.ok(entry.repository_source_refs.includes(source), id);
    assert.deepEqual(registry.overlap_groups.filter((group) => group.members.includes(id)).map((group) => group.id),
      ["retired-client-provenance"], id);
  }
});

test("Windows guarded text-only candidate stays separate from activation and retired TUI", () => {
  for (const id of ["managed-session-launcher", "windows-browser-client"]) {
    const entry = byId.get(id);
    assert.equal(entry.activation_eligible_now, false, id);
    assert.match(entry.claim_limit, /Normal Windows turn ingress remains paused/u, id);
    assert.match(entry.claim_limit, /guarded text-only/u, id);
    assert.match(entry.claim_limit, /handover/u, id);
  }
  assert.equal(byId.get("tui-conversation-client").disposition, "retired-provenance");
  assert.equal(byId.get("tui-coding-proposal-client").disposition, "retired-provenance");
});

test("active executable ARE client modes cannot be omitted from the topology registry", () => {
  // Product/client source scopes only. Tests, canaries, generated output, fixtures,
  // benchmarks and customer diagnostic scripts are not runtime entrypoints.
  const scopes = [
    "implementation/define-cli/src",
    "keld-project/scripts",
    "keld-project/are-documentation/server",
    "workspace/plans/luna-vps/runtime",
    "development/agent-reasoning-engine/codex-integration/client",
    "development/agent-reasoning-engine/codex-integration/runtime",
    "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/bin",
    "implementation/agent-reasoning-engine/packages/coding-agent-runtime/bin",
  ];
  // A client may inject a session API as a callable dependency rather than
  // invoking the imported name directly at the source site.
  const apiCall = /\b(?:connectGatewayRpcTransport|spawnAppServerRpcTransport|createPersistentGateway|runStdioProxy|createConversationRuntime)\s*(?:\(|;)/u;
  const declared = new Set(registry.entrypoints.flatMap((entry) => [
    ...(entry.repository_source_refs ?? []),
    ...entry.source_refs.map((source) => `implementation/agent-reasoning-engine/${source}`),
  ]));
  const discovered = [];
  function scan(directory) {
    for (const item of readdirSync(join(repositoryRoot, directory), {withFileTypes: true})) {
      const source = `${directory}/${item.name}`;
      if (item.isDirectory()) {
        if (!["test", "tests", "fixtures", "generated", "benchmarks", "research"].includes(item.name)) scan(source);
      } else if (item.isFile() && item.name.endsWith(".mjs") && !item.name.endsWith(".test.mjs")
        && !item.name.includes("canary") && !(directory === "keld-project/scripts" && item.name.startsWith("check-"))
        && apiCall.test(readFileSync(join(repositoryRoot, source), "utf8"))) {
        discovered.push(relative(repositoryRoot, join(repositoryRoot, source)).replaceAll("\\", "/"));
      }
    }
  }
  for (const scope of scopes) scan(scope);
  assert.ok(discovered.includes("implementation/define-cli/src/app-server-agent.mjs"));
  assert.ok(discovered.includes(["implementation", "agent-reasoning-engine", "packages", "codex-app-server-wrapper", "bin", "are-codex-gateway.mjs"].join("/")));
  assert.ok(discovered.includes(["implementation", "agent-reasoning-engine", "packages", "coding-agent-runtime", "bin", "live-demo.mjs"].join("/")));
  assert.deepEqual(discovered.filter((source) => !declared.has(source)).sort(), [],
    "An executable ARE client source uses a session API but has no topology entry.");
});

test("selected active package bins each have one explicit topology owner", () => {
  const owners = new Map([
    ["packages/codex-app-server-wrapper/bin/are-codex-app-server.mjs", "direct-codex-stdio-wrapper"],
    ["packages/codex-app-server-wrapper/bin/are-codex-client-proxy.mjs", "transparent-gateway-stdio-client"],
    ["packages/codex-app-server-wrapper/bin/are-codex-desktop-gateway-client.mjs", "desktop-gateway-jsonl-client"],
    ["packages/codex-app-server-wrapper/bin/are-codex-desktop-shim.mjs", "desktop-cli-launch-shim"],
    ["packages/codex-app-server-wrapper/bin/are-codex-gateway.mjs", "persistent-gateway-acknowledged"],
    ["packages/codex-app-server-wrapper/bin/are-codex-windows-client.mjs", "windows-browser-client"],
    ["packages/codex-app-server-wrapper/bin/are-cross-os-wsl-supervisor.mjs", "managed-session-launcher"],
    ["packages/codex-app-server-wrapper/bin/are-interaction.mjs", "local-interaction-review-cli"],
    ["packages/codex-app-server-wrapper/bin/are-managed-session.mjs", "managed-session-launcher"],
    ["packages/coding-agent-runtime/bin/demo.mjs", "scripted-coding-agent-demo"],
    ["packages/coding-agent-runtime/bin/live-demo.mjs", "coding-agent-live-demo"],
    ["packages/coding-agent-runtime/bin/run.mjs", "configured-coding-agent-cli"],
  ]);
  const discovered = [...new Set([...owners.keys()].map((path) => path.slice(0, path.lastIndexOf("/"))))]
    .flatMap((directory) => readdirSync(join(productRoot, directory), {withFileTypes: true})
      .filter((item) => item.isFile() && item.name.endsWith(".mjs"))
      .map((item) => `${directory}/${item.name}`));
  assert.deepEqual(discovered.sort(), [...owners.keys()].sort(), "An executable bin was added without a topology owner.");
  for (const [path, id] of owners) {
    assert.ok(byId.get(id)?.source_refs.includes(path), `${id}:${path}`);
    assert.equal(byId.get(id).activation_eligible_now, false, id);
    assert.notEqual(byId.get(id).disposition, "retired-provenance", id);
  }
});
