import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {classifyDesktopCliInvocation, validateDesktopShimEnvironment} from "../src/desktop-cli-shim.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const shim = resolve(packageRoot, "bin/are-codex-desktop-shim.mjs");
const appServerArgs = ["-c", "features.code_mode_host=true", "app-server", "--analytics-default-enabled"];

test("desktop CLI shim admits the observed version and App Server forms only", () => {
  assert.equal(classifyDesktopCliInvocation(["--version"]).kind, "version");
  assert.deepEqual(classifyDesktopCliInvocation(appServerArgs), {ok: true, kind: "app-server", backend_args: appServerArgs,
    host_profile: "desktop-wsl-base/v1"});
  const withAppTools = [...appServerArgs, "-c", "plugins.codex-app-tools@openai-bundled.mcp_servers.codex_app.enabled=true"];
  assert.deepEqual(classifyDesktopCliInvocation(withAppTools), {ok: true, kind: "app-server", backend_args: withAppTools,
    host_profile: "desktop-wsl-app-tools/v1"});
  for (const bad of [["exec", "echo", "x"], ["app-server"], [...appServerArgs, "-c", "foo=true"],
    [...appServerArgs, "--listen", "0.0.0.0"], ["--version", "app-server"], ["--version\n"]]) {
    assert.equal(classifyDesktopCliInvocation(bad).ok, false);
  }
});

test("desktop CLI shim requires an absolute pinned backend and profile", () => {
  const valid = {ARE_DESKTOP_SHIM_CODEX_COMMAND: "/bin/codex",
    ARE_DESKTOP_SHIM_CODEX_SHA256: "a".repeat(64),
    ARE_DESKTOP_SHIM_CONFIG: "/work/profile.json", ARE_DESKTOP_SHIM_REPOSITORY_ROOT: "/work",
    ARE_DESKTOP_SHIM_MODE: "direct-candidate"};
  assert.equal(validateDesktopShimEnvironment(valid).ok, true);
  assert.equal(validateDesktopShimEnvironment({...valid, ARE_DESKTOP_SHIM_MODE: undefined}).reason, "desktop-shim.mode-required");
  assert.equal(validateDesktopShimEnvironment({...valid, ARE_DESKTOP_SHIM_MODE: "managed-gateway"}).reason,
    "desktop-shim.gateway-path-required");
  const managed = {...valid, ARE_DESKTOP_SHIM_MODE: "managed-gateway",
    ARE_DESKTOP_GATEWAY_SOCKET: "/private/gateway.sock", ARE_DESKTOP_GATEWAY_STATE_DIR: "/private/state",
    ARE_DESKTOP_GATEWAY_CONNECTION_TOKEN: "x".repeat(40)};
  assert.equal(validateDesktopShimEnvironment(managed).mode, "managed-gateway");
  assert.equal(validateDesktopShimEnvironment({...managed, ARE_DESKTOP_GATEWAY_CONNECTION_TOKEN: "short"}).reason,
    "desktop-shim.gateway-token-required");
  assert.equal(validateDesktopShimEnvironment({...valid, ARE_DESKTOP_SHIM_MODE: undefined}, {kind: "version"}).ok, true);
  assert.equal(validateDesktopShimEnvironment({...valid, ARE_DESKTOP_SHIM_CODEX_COMMAND: "codex"}).ok, false);
  assert.equal(validateDesktopShimEnvironment({...valid, ARE_DESKTOP_SHIM_CODEX_SHA256: "abc"}).ok, false);
});

test("desktop CLI shim rejects unsupported invocation before reading backend settings", () => {
  const result = spawnSync(process.execPath, [shim, "exec", "echo", "x"], {encoding: "utf8", env: {PATH: process.env.PATH}});
  assert.equal(result.status, 2);
  assert.match(result.stderr, /desktop-shim.unsupported-invocation/);
});

test("desktop CLI shim rejects backend digest drift before executing even --version", () => {
  const result = spawnSync(process.execPath, [shim, "--version"], {encoding: "utf8", env: {
    PATH: process.env.PATH,
    ARE_DESKTOP_SHIM_CODEX_COMMAND: process.execPath,
    ARE_DESKTOP_SHIM_CODEX_SHA256: "0".repeat(64),
    ARE_DESKTOP_SHIM_CONFIG: "/work/profile.json",
    ARE_DESKTOP_SHIM_REPOSITORY_ROOT: "/work",
  }});
  assert.equal(result.status, 2);
  assert.match(result.stderr, /desktop-shim.backend-digest-drift/);
  assert.equal(result.stdout, "");
});

test("desktop CLI shim preserves a pinned version probe without selecting a session mode", async () => {
  const digest = createHash("sha256").update(await readFile(process.execPath)).digest("hex");
  const result = spawnSync(process.execPath, [shim, "--version"], {encoding: "utf8", env: {
    PATH: process.env.PATH,
    ARE_DESKTOP_SHIM_CODEX_COMMAND: process.execPath,
    ARE_DESKTOP_SHIM_CODEX_SHA256: digest,
    ARE_DESKTOP_SHIM_CONFIG: "/unused/profile.json",
    ARE_DESKTOP_SHIM_REPOSITORY_ROOT: "/unused",
  }});
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), process.version);
  assert.equal(result.stderr, "");
});

test("desktop CLI shim rejects a missing profile before App Server startup", async () => {
  const directory = await mkdtemp(join(tmpdir(), "are-desktop-shim-preflight-"));
  try {
    const digest = createHash("sha256").update(await readFile(process.execPath)).digest("hex");
    const result = spawnSync(process.execPath, [shim, ...appServerArgs], {encoding: "utf8", env: {
      PATH: process.env.PATH,
      ARE_DESKTOP_SHIM_CODEX_COMMAND: process.execPath,
      ARE_DESKTOP_SHIM_CODEX_SHA256: digest,
      ARE_DESKTOP_SHIM_CONFIG: join(directory, "missing-profile.json"),
      ARE_DESKTOP_SHIM_REPOSITORY_ROOT: directory,
      ARE_DESKTOP_SHIM_MODE: "direct-candidate",
    }});
    assert.equal(result.status, 2);
    assert.match(result.stderr, /desktop-shim.config-unreadable/);
    assert.equal(result.stdout, "");
    const config = join(directory, "profile.json");
    await writeFile(config, "{}\n");
    const missingRoot = spawnSync(process.execPath, [shim, ...appServerArgs], {encoding: "utf8", env: {
      PATH: process.env.PATH,
      ARE_DESKTOP_SHIM_CODEX_COMMAND: process.execPath,
      ARE_DESKTOP_SHIM_CODEX_SHA256: digest,
      ARE_DESKTOP_SHIM_CONFIG: config,
      ARE_DESKTOP_SHIM_REPOSITORY_ROOT: join(directory, "missing-root"),
      ARE_DESKTOP_SHIM_MODE: "direct-candidate",
    }});
    assert.equal(missingRoot.status, 2);
    assert.match(missingRoot.stderr, /desktop-shim.repository-root-unreadable/);
    assert.equal(missingRoot.stdout, "");
  } finally { await rm(directory, {recursive: true, force: true}); }
});

test("managed desktop mode never falls back to the direct wrapper", async () => {
  const directory = await mkdtemp(join(tmpdir(), "are-desktop-shim-mode-"));
  try {
    const config = join(directory, "profile.json");
    await writeFile(config, "{}\n");
    const digest = createHash("sha256").update(await readFile(process.execPath)).digest("hex");
    const result = spawnSync(process.execPath, [shim, ...appServerArgs], {encoding: "utf8", env: {
      PATH: process.env.PATH,
      ARE_DESKTOP_SHIM_CODEX_COMMAND: process.execPath,
      ARE_DESKTOP_SHIM_CODEX_SHA256: digest,
      ARE_DESKTOP_SHIM_CONFIG: config,
      ARE_DESKTOP_SHIM_REPOSITORY_ROOT: directory,
      ARE_DESKTOP_SHIM_MODE: "managed-gateway",
      ARE_DESKTOP_GATEWAY_SOCKET: join(directory, "missing-gateway.sock"),
      ARE_DESKTOP_GATEWAY_STATE_DIR: directory,
      ARE_DESKTOP_GATEWAY_CONNECTION_TOKEN: "x".repeat(40),
    }});
    assert.equal(result.status, 4);
    assert.match(result.stderr, /gateway.connection-failed/);
    assert.doesNotMatch(result.stderr, /config.source-unreadable/);
    assert.equal(result.stdout, "");
  } finally { await rm(directory, {recursive: true, force: true}); }
});

test("desktop CLI shim writes only a content-free opt-in invocation trace", async (context) => {
  if (process.platform === "win32") return context.skip("The desktop shim executes in WSL/Linux.");
  const directory = await mkdtemp(join(tmpdir(), "are-desktop-shim-test-"));
  try {
    const trace = join(directory, "trace.jsonl");
    await writeFile(trace, "", {mode: 0o600});
    const result = spawnSync(process.execPath, [shim, "exec", "secret-example"], {encoding: "utf8", env: {
      PATH: process.env.PATH, ARE_DESKTOP_SHIM_TRACE_PATH: trace,
    }});
    assert.equal(result.status, 2);
    const records = (await readFile(trace, "utf8")).trim().split("\n").map((line) => JSON.parse(line));
    assert.equal(records.length, 1);
    assert.equal(records[0].stage, "received");
    assert.equal(records[0].kind, "rejected");
    assert.equal(records[0].parent_pid, process.pid);
    assert.equal("child_pid" in records[0], false);
    assert.equal(JSON.stringify(records).includes("secret-example"), false);
  } finally { await rm(directory, {recursive: true, force: true}); }
});

test("desktop CLI shim traces its actual backend child without command or prompt content", async (context) => {
  if (process.platform === "win32") return context.skip("The desktop shim executes in WSL/Linux.");
  const directory = await mkdtemp(join(tmpdir(), "are-desktop-shim-child-trace-"));
  try {
    const trace = join(directory, "trace.jsonl");
    await writeFile(trace, "", {mode: 0o600});
    const digest = createHash("sha256").update(await readFile(process.execPath)).digest("hex");
    const result = spawnSync(process.execPath, [shim, "--version"], {encoding: "utf8", env: {
      PATH: process.env.PATH,
      ARE_DESKTOP_SHIM_TRACE_PATH: trace,
      ARE_DESKTOP_SHIM_CODEX_COMMAND: process.execPath,
      ARE_DESKTOP_SHIM_CODEX_SHA256: digest,
      ARE_DESKTOP_SHIM_CONFIG: "/unused/profile.json",
      ARE_DESKTOP_SHIM_REPOSITORY_ROOT: "/unused",
    }});
    assert.equal(result.status, 0);
    const records = (await readFile(trace, "utf8")).trim().split("\n").map((line) => JSON.parse(line));
    assert.deepEqual(records.map((record) => record.stage), ["received", "spawned"]);
    assert.equal(records[0].pid, records[1].pid);
    assert.equal(records[0].parent_pid, process.pid);
    assert.equal(records[1].parent_pid, process.pid);
    assert.ok(Number.isSafeInteger(records[1].child_pid) && records[1].child_pid > 0);
    assert.equal("child_pid" in records[0], false);
    assert.equal(JSON.stringify(records).includes(process.execPath), false);
  } finally { await rm(directory, {recursive: true, force: true}); }
});
