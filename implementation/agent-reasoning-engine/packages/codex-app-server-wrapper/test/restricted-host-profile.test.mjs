import assert from "node:assert/strict";
import {chmodSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";

import {preflightRestrictedHostHome, restrictedHostConfigDigest, restrictedHostConfigMatches,
  validateRestrictedHostConfig, validateWindowsSandboxMode} from "../src/restricted-host-profile.mjs";

const disabled = {shell_tool: false, unified_exec: false, apps: false, multi_agent: false,
  goals: false, plugins: false, remote_plugin: false};

test("restricted host config accepts only explicit effective disabled values", () => {
  const config = {config: {features: disabled, webSearch: "disabled", mcpServers: {}}};
  assert.equal(validateRestrictedHostConfig(config).web_search, "disabled");
  assert.equal(validateRestrictedHostConfig({config: {features: disabled,
    web_search: "disabled", mcp_servers: {}}}).web_search, "disabled");
  for (const key of Object.keys(disabled)) {
    for (const value of [true, null, undefined]) {
      assert.throws(() => validateRestrictedHostConfig({config: {features: {...disabled, [key]: value},
        webSearch: "disabled", mcpServers: {}}}), /managed-session.restricted-host-features-not-disabled/);
    }
  }
  assert.throws(() => validateRestrictedHostConfig({config: {features: disabled, webSearch: "cached", mcpServers: {}}}),
    /managed-session.restricted-host-web-search-not-disabled/);
  assert.throws(() => validateRestrictedHostConfig({config: {features: disabled, webSearch: "disabled"}}),
    /managed-session.restricted-mcp-policy-invalid/);
  assert.throws(() => validateRestrictedHostConfig({}), /managed-session.restricted-host-features-not-disabled/);
});

test("restricted host profile binds the effective Windows sandbox mode exactly", () => {
  const config = {config: {features: disabled, webSearch: "disabled", mcpServers: {},
    windows: {sandbox: "unelevated"}}};
  assert.equal(validateRestrictedHostConfig(config, {expectedWindowsSandbox: "unelevated"})
    .windows_sandbox_mode, "unelevated");
  assert.equal(validateRestrictedHostConfig({...config, config: {...config.config,
    windows: undefined, windowsSandbox: {sandbox: "elevated"}}},
  {expectedWindowsSandbox: "elevated"}).windows_sandbox_mode, "elevated");
  assert.throws(() => validateRestrictedHostConfig(config, {expectedWindowsSandbox: "default"}),
    /managed-session.windows-sandbox-policy-invalid/);
  for (const windows of [undefined, {}, {sandbox: "elevated"}, {sandbox: "unknown"}]) {
    assert.throws(() => validateRestrictedHostConfig({...config, config: {...config.config, windows}},
      {expectedWindowsSandbox: "unelevated"}), /managed-session.windows-sandbox-mode-mismatch/);
  }
  assert.throws(() => validateRestrictedHostConfig({...config, config: {...config.config,
    windowsSandbox: {sandbox: "elevated"}}}, {expectedWindowsSandbox: "unelevated"}),
  /managed-session.windows-sandbox-mode-mismatch/);
});

test("same-backend sandbox attestation rejects absent or conflicting effective modes", () => {
  assert.equal(validateWindowsSandboxMode({config: {windows: {sandbox: "unelevated"}}},
    "unelevated"), "unelevated");
  for (const value of [{}, {config: {}}, {config: {windows: {sandbox: "elevated"}}},
    {config: {windows: {sandbox: "unelevated"}, windowsSandbox: {sandbox: "elevated"}}}]) {
    assert.throws(() => validateWindowsSandboxMode(value, "unelevated"),
      /managed-session.windows-sandbox-mode-mismatch/);
  }
});

test("restricted profile rejects unapproved MCP servers and exact identity drift", () => {
  const expected = {name: "are_hosted_hook_relay", command: "/node",
    args: ["/are-hook-mcp-server.mjs", "--connection-file", "/private/hook-connection.json"],
    tools: ["are_hook_observe"]};
  const relay = {command: expected.command, args: expected.args, enabled: true,
    required: true, enabled_tools: expected.tools, environment_id: "local"};
  const result = servers => ({config: {features: disabled, web_search: "disabled", mcp_servers: servers}});
  assert.deepEqual(validateRestrictedHostConfig(result({})).mcp_server_names, []);
  assert.throws(() => validateRestrictedHostConfig(result({are_hosted_hook_relay: relay})),
    /managed-session.restricted-mcp-server-set-mismatch/);
  assert.deepEqual(validateRestrictedHostConfig(result({are_hosted_hook_relay: relay}),
    {expectedMcpServers: [expected]}).mcp_server_names, [expected.name]);
  assert.throws(() => validateRestrictedHostConfig(result({are_hosted_hook_relay: relay,
    unapproved: {enabled: true}}), {expectedMcpServers: [expected]}),
  /managed-session.restricted-mcp-server-set-mismatch/);
  for (const drift of [{command: "/other"}, {args: ["/other"]}, {required: false},
    {enabled: false}, {enabled_tools: ["are_hook_observe", "write_anything"]},
    {environment_id: "remote"}, {env: {EXTRA: "1"}}]) {
    assert.throws(() => validateRestrictedHostConfig(result({are_hosted_hook_relay: {...relay, ...drift}}),
      {expectedMcpServers: [expected]}), /managed-session.restricted-mcp-server-identity-mismatch/);
  }
  assert.throws(() => validateRestrictedHostConfig(result({are_hosted_hook_relay: relay}),
    {expectedMcpServers: [expected, expected]}), /managed-session.restricted-mcp-policy-invalid/);
});

test("restricted profile binds the selected effective model provider to the guard URL", () => {
  const result = {config: {features: disabled, web_search: "disabled", mcp_servers: {},
    modelProvider: "are_fixture", modelProviders: {are_fixture: {baseUrl: "http://127.0.0.1:5555/v1",
      envHttpHeaders: {"X-ARE-Guard-Token": "ARE_MODEL_WIRE_CLIENT_TOKEN"}}}}};
  const expectedModelWire = {provider_id: "are_fixture", base_url: "http://127.0.0.1:5555/v1",
    env_header_var: "ARE_MODEL_WIRE_CLIENT_TOKEN"};
  assert.equal(validateRestrictedHostConfig(result, {expectedModelWire}).model_wire_provider_id,
    "are_fixture");
  assert.throws(() => validateRestrictedHostConfig(result, {expectedModelWire: {...expectedModelWire,
    base_url: "http://127.0.0.1:9999/v1"}}), /managed-session.model-wire-provider-binding-mismatch/);
  assert.throws(() => validateRestrictedHostConfig({...result, config: {...result.config,
    modelProvider: "other"}}, {expectedModelWire}), /managed-session.model-wire-provider-binding-mismatch/);
  assert.throws(() => validateRestrictedHostConfig({...result, config: {...result.config,
    modelProviders: {are_fixture: {baseUrl: "https://api.example.invalid/v1"}}}},
  {expectedModelWire}), /managed-session.model-wire-provider-binding-mismatch/);
  assert.throws(() => validateRestrictedHostConfig({...result, config: {...result.config,
    modelProviders: {are_fixture: {baseUrl: expectedModelWire.base_url,
      envHttpHeaders: {"X-ARE-Guard-Token": "WRONG_VAR"}}}}},
  {expectedModelWire}), /managed-session.model-wire-provider-binding-mismatch/);
});

test("restricted host home is a dedicated private state child with a regular private config", context => {
  const root = mkdtempSync(join(tmpdir(), "are-restricted-home-"));
  context.after(() => rmSync(root, {recursive: true, force: true}));
  const state = join(root, "state");
  const home = join(state, "codex-home");
  mkdirSync(home, {recursive: true, mode: 0o700});
  chmodSync(state, 0o700);
  chmodSync(home, 0o700);
  const config = join(home, "config.toml");
  writeFileSync(config, "web_search = \"disabled\"\n", {mode: 0o600});
  assert.equal(preflightRestrictedHostHome(state, home), home);
  assert.throws(() => preflightRestrictedHostHome(state, root),
    /managed-session.codex-home-must-be-dedicated-state-child/);
  if (process.platform !== "win32") {
    chmodSync(config, 0o644);
    assert.throws(() => preflightRestrictedHostHome(state, home), /managed-session.codex-home-not-private/);
    chmodSync(config, 0o600);
  }
  const alias = join(root, "alias");
  symlinkSync(home, alias, process.platform === "win32" ? "junction" : "dir");
  assert.throws(() => preflightRestrictedHostHome(state, alias),
    /managed-session.codex-home-must-be-dedicated-state-child/);
});

test("restricted host config digest fails closed on byte drift and unsafe file replacement", context => {
  const root = mkdtempSync(join(tmpdir(), "are-restricted-digest-"));
  context.after(() => rmSync(root, {recursive: true, force: true}));
  const home = join(root, "codex-home");
  mkdirSync(home, {mode: 0o700});
  const config = join(home, "config.toml");
  writeFileSync(config, "web_search = \"disabled\"\n", {mode: 0o600});
  const binding = {codex_home: home, sha256: restrictedHostConfigDigest(home)};
  assert.equal(restrictedHostConfigMatches(binding), true);
  writeFileSync(config, "web_search = \"cached\"\n", {mode: 0o600});
  assert.equal(restrictedHostConfigMatches(binding), false);
  assert.equal(restrictedHostConfigMatches({...binding, sha256: "invalid"}), false);
  const replacement = join(root, "replacement.toml");
  writeFileSync(replacement, "web_search = \"disabled\"\n", {mode: 0o600});
  rmSync(config);
  symlinkSync(replacement, config, process.platform === "win32" ? "file" : undefined);
  assert.equal(restrictedHostConfigMatches(binding), false);
});

test("restricted host digest binds hook source presence and bytes across model entry", context => {
  const root = mkdtempSync(join(tmpdir(), "are-restricted-hooks-digest-"));
  context.after(() => rmSync(root, {recursive: true, force: true}));
  const home = join(root, "codex-home");
  mkdirSync(home, {mode: 0o700});
  writeFileSync(join(home, "config.toml"), "web_search = \"disabled\"\n", {mode: 0o600});
  const hookPath = join(home, "hooks.json");
  const withoutHooks = {codex_home: home, sha256: restrictedHostConfigDigest(home)};
  writeFileSync(hookPath, "{\"hooks\":{}}\n", {mode: 0o600});
  assert.equal(restrictedHostConfigMatches(withoutHooks), false);
  const withHooks = {codex_home: home, sha256: restrictedHostConfigDigest(home)};
  assert.equal(restrictedHostConfigMatches(withHooks), true);
  writeFileSync(hookPath, "{\"hooks\":{\"PreToolUse\":[]}}\n", {mode: 0o600});
  assert.equal(restrictedHostConfigMatches(withHooks), false);
  rmSync(hookPath);
  assert.equal(restrictedHostConfigMatches(withHooks), false);
});
