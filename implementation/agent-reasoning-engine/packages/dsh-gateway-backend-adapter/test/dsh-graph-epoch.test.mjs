import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {once} from "node:events";
import {mkdtemp, readFile, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {DshGraphEpochError, createDshGraphEpochController}
  from "../src/dsh-graph-epoch.mjs";

const FIXTURE_SCHEMA = "are.dsh-early-provenance-revocation-fixture/v1";
const fixturePath = fileURLToPath(new URL("./fixtures/web-early-provenance-revocation.mjs", import.meta.url));
const generatedRoot = fileURLToPath(new URL(
  "../node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/", import.meta.url));

function sourcePin(selector = "module:test") {
  return {selector, package_name: "test", package_version: "1.0.0",
    relative_path: "index.js", byte_count: 1, sha256: "1".repeat(64)};
}

function harness(options = {}) {
  const active = [];
  const registry = {size: 0, values: () => [{fibers: active}]};
  const root = {fiber: {uid: 0}, registry};
  root.root = root;
  const fingerprints = {manifest: "m", roots: ["r"], default_id: "are-read-only",
    composition_sha256: "2".repeat(64)};
  let actual = structuredClone(fingerprints);
  const constructionAuthority = {};
  const controller = createDshGraphEpochController({
    source_pin_index: {
      lookup: (url) => url === "file:///pinned.js" ? sourcePin() : undefined,
      builtin: (specifier) => specifier === "cordis:include" || specifier === "cordis:group"
        ? sourcePin("module:app-boot") : undefined,
    },
    manifest_id: "manifest-test",
    material_digest: "a".repeat(64),
    package_set_sha256: "b".repeat(64),
    source_pin_count: 2,
    expected_fingerprints: fingerprints,
    fingerprint_provider: () => actual,
    qualification_observer: async () => ({ok: true, host_graph_digest: "c".repeat(64)}),
    agent_construction_authority: constructionAuthority,
    boot_nonce: "d".repeat(32),
    ...options,
  });
  return {controller, root, active, constructionAuthority,
    drift: () => { actual = {...actual, default_id: "changed"}; }};
}

function commit(controller, active, ctx, callback, uid, runtimeName) {
  const token = controller.beforeRegistration({ctx, callback, runtime_name: runtimeName});
  const fiber = {uid, parent: {fiber: ctx.fiber}};
  controller.commitRegistration(fiber, token);
  active.push(fiber);
  return fiber;
}

async function qualifiedHarness(options = {}) {
  const value = harness(options);
  const {controller, root, active} = value;
  controller.install(root);
  function Loader() {}
  function isolate() {}
  controller.authorizeBootstrap("loader", Loader);
  controller.authorizeBootstrap("isolate", isolate);
  const loader = commit(controller, active, root, Loader, 1, "loader");
  const loaderCtx = {fiber: loader};
  commit(controller, active, loaderCtx, isolate, 2, "isolate");
  function imported() {}
  controller.bindImportedCallback(imported, {entry_id: "host:test", parent_entry_ids: ["include"],
    specifier: "test", base_class: "host-installed", resolved_url: "file:///pinned.js",
    builtin: false});
  const primary = commit(controller, active, root, imported, 3, "test");
  function nested() {}
  commit(controller, active, {fiber: primary}, nested, 4, "nested");
  const receipt = await controller.qualifyProfile(root);
  return {...value, receipt, callbacks: {Loader, isolate, imported}};
}

function expectCode(action, code) {
  assert.throws(action, (error) => error instanceof DshGraphEpochError && error.code === code);
}

test("the graph controller binds exact boot/import ancestry and emits a bounded qualification receipt",
  async () => {
    const {controller, receipt, root, active, callbacks} = await qualifiedHarness();
    assert.equal(controller.state, "qualified");
    assert.equal(controller.epoch, 1);
    assert.equal(receipt.claim_posture, "trusted-import-ancestry");
    assert.equal(receipt.session_admission, "not-established");
    assert.equal(receipt.authority_effect, "none");
    assert.equal(receipt.source_pin_count, 2);
    assert.match(receipt.provenance_graph_digest, /^[0-9a-f]{64}$/u);
    expectCode(() => controller.install(root), "epoch.install-duplicate");
    expectCode(() => controller.authorizeBootstrap("loader", callbacks.Loader),
      "epoch.bootstrap-state-invalid");
    expectCode(() => commit(controller, active, root, function unknown() {}, 5, "unknown"),
      "epoch.registration-not-serving");
    assert.equal(controller.snapshot().first_revocation.reason_code, "mutation.registry-plugin");
    assert.equal(controller.state, "revoked");
  });

test("invalid owner, bootstrap, source, direct-root, and callback rebound paths fail closed", () => {
  const late = harness();
  late.root.registry.size = 1;
  expectCode(() => late.controller.install(late.root), "epoch.install-late");

  const value = harness();
  value.controller.install(value.root);
  function Loader() {}
  value.controller.authorizeBootstrap("loader", Loader);
  expectCode(() => value.controller.authorizeBootstrap("loader", function duplicate() {}),
    "epoch.bootstrap-duplicate");
  expectCode(() => value.controller.authorizeBootstrap("isolate", Loader),
    "epoch.bootstrap-callback-reused");
  expectCode(() => value.controller.bindImportedCallback(function unknown() {}, {
    entry_id: "x", parent_entry_ids: [], specifier: "x", base_class: "host-installed",
    resolved_url: "file:///unknown.js", builtin: false,
  }), "epoch.import-source-unpinned");
  expectCode(() => value.controller.bindImportedCallback(function wrongBase() {}, {
    entry_id: "x", parent_entry_ids: [], specifier: "x", base_class: "caller-supplied",
    resolved_url: "file:///pinned.js", builtin: false,
  }), "epoch.import-base-invalid");
  function rebound() {}
  value.controller.bindImportedCallback(rebound, {entry_id: "a", parent_entry_ids: [],
    specifier: "x", base_class: "host-installed", resolved_url: "file:///pinned.js", builtin: false});
  expectCode(() => value.controller.bindImportedCallback(rebound, {entry_id: "b", parent_entry_ids: [],
    specifier: "x", base_class: "host-installed", resolved_url: "file:///pinned.js", builtin: false}),
  "epoch.import-callback-conflict");
  expectCode(() => value.controller.beforeRegistration({ctx: value.root,
    callback: function direct() {}, runtime_name: "direct"}), "epoch.registration-unknown-root");
  expectCode(() => value.controller.beforeRegistration({ctx: {fiber: {uid: 99}},
    callback: function nested() {}, runtime_name: "nested"}),
  "epoch.registration-parent-unbound");

  const occupied = harness();
  Object.defineProperty(occupied.root, Symbol.for("are.dsh-graph-control/v1"), {
    value: {}, configurable: false,
  });
  expectCode(() => occupied.controller.install(occupied.root), "epoch.install-owner-present");
});

const MUTATION_FAMILIES = [
  "registry.delete", "fiber.update", "fiber.restart", "fiber.dispose",
  "loader.group-create", "loader.group-remove", "loader.group-update", "loader.group-stop",
  "loader.tree-create", "loader.tree-remove", "loader.tree-update", "loader.random-id",
  "loader.entry-refresh", "loader.entry-dispose", "loader.entry-update", "loader.entry-init",
  "loader.entry-internal-init", "loader.entry-start", "agent-presets.copy",
  "agent-presets.remoteExportCopy", "agent-presets.remove", "agent-presets.remoteExportDelete",
  "agent-presets.mount", "agent-presets.recompose", "agent-presets.select", "agent-presets.swap",
  "agent-presets.standingKeyFor", "agent-presets.ensureStanding",
];

test("every supported mutation family synchronously leaves serving state and keeps the first fact", async () => {
  for (const kind of MUTATION_FAMILIES) {
    const {controller} = await qualifiedHarness();
    const result = controller.beforeMutation(kind, "fixture-subject");
    assert.equal(result.allowed, false, kind);
    assert.equal(controller.state, "revoked", kind);
    const first = controller.snapshot().first_revocation;
    controller.beforeMutation("later", "later");
    assert.deepEqual(controller.snapshot().first_revocation, first, kind);
    assert.equal(controller.snapshot().later_revocation_count, 0,
      "duplicate hooks after the latch do not rewrite or inflate the first fact");
  }
});

function ordered(source, first, second, label) {
  const firstIndex = source.indexOf(first);
  const secondIndex = source.indexOf(second, firstIndex + first.length);
  assert.notEqual(firstIndex, -1, `${label}: missing first-boundary hook`);
  assert.notEqual(secondIndex, -1, `${label}: missing first mutation`);
  assert.ok(firstIndex < secondIndex, `${label}: mutation precedes hook`);
}

test("generated hooks precede the first visible mutation for every supported package family",
  async () => {
    const cordis = await readFile(join(generatedRoot, "cordis/lib/index.js"), "utf8");
    ordered(cordis,
      'beforeMutation("fiber.dispose", String(this.uid))', "this.uid = null", "fiber.dispose");
    ordered(cordis,
      'beforeMutation("fiber.restart", String(this.uid))', "this._setEpoch(INACTIVE)", "fiber.restart");
    ordered(cordis,
      'beforeMutation("fiber.update", String(this.uid))', "this._config = config", "fiber.update");
    ordered(cordis,
      'beforeMutation("registry.delete", "plugin")', "this._internal.delete(key)", "registry.delete");
    ordered(cordis,
      "areControl?.beforeRegistration", "this._internal.set(callback, runtime)", "registry.plugin");
    ordered(cordis,
      "areControl.commitRegistration(fiber, areToken)", "const wrapped = Object.create(fiber)",
      "registry.commit");

    const loader = await readFile(join(generatedRoot, "cordis-plugin-loader/lib/index.js"),
      "utf8");
    ordered(loader, "beforeMutation(kind, this.id ?? name)", "return original.apply(this, args)",
      "loader wrappers");
    for (const kind of MUTATION_FAMILIES.filter((value) => value.startsWith("loader.")
      && value !== "loader.random-id")) {
      assert.ok(loader.includes(`"${kind}"`), `${kind}: missing generated wrapper registration`);
    }
    ordered(loader, 'beforeMutation("loader.random-id", "entry")',
      "return areEnsureIdV1.call(this, options)", "loader.random-id");

    const presets = await readFile(join(generatedRoot, "dsh-agent-presets/lib/index.js"),
      "utf8");
    ordered(presets, "beforeMutation(`agent-presets.${name}`",
      "return original.apply(this, args)", "agent-presets wrappers");
    for (const name of MUTATION_FAMILIES.filter((value) => value.startsWith("agent-presets."))
      .map((value) => value.slice("agent-presets.".length))) {
      assert.ok(presets.includes(`"${name}"`),
        `agent-presets.${name}: missing generated wrapper registration`);
    }
  });

test("fingerprint drift revokes and a revoked controller cannot requalify", async () => {
  const value = await qualifiedHarness();
  value.drift();
  expectCode(() => value.controller.assertCurrent(), "epoch.fingerprint-drift");
  assert.equal(value.controller.state, "revoked");
  await assert.rejects(() => value.controller.qualifyProfile(value.root),
    (error) => error?.code === "epoch.qualification-state-invalid");
});

test("one serialized construction window invalidates the old epoch and closes only on exact delta",
  async () => {
    const expected = {active_fiber_count: 2, counts: {"preset-primary": 2}};
    const value = await qualifiedHarness();
    const token = value.controller.beginAgentConstruction(expected, value.constructionAuthority);
    assert.equal(value.controller.state, "checking-agent");
    assert.equal(value.controller.snapshot().serving, false);
    expectCode(() => value.controller.beginAgentConstruction(expected, value.constructionAuthority),
      "epoch.agent-window-unavailable");
    assert.equal(value.controller.state, "revoked");

    const success = await qualifiedHarness();
    const successToken = success.controller.beginAgentConstruction(expected,
      success.constructionAuthority);
    success.controller.beforeMutation("agent-presets.mount", "are-read-only");
    success.controller.commitAgentConstruction(successToken, structuredClone(expected));
    assert.equal(success.controller.state, "qualified");
    assert.equal(success.controller.epoch, 2);

    const mismatch = await qualifiedHarness();
    const mismatchToken = mismatch.controller.beginAgentConstruction(expected,
      mismatch.constructionAuthority);
    expectCode(() => mismatch.controller.commitAgentConstruction(mismatchToken,
      {active_fiber_count: 1, counts: {"preset-primary": 1}}), "epoch.agent-delta-mismatch");
    assert.equal(mismatch.controller.state, "revoked");

    const thrown = await qualifiedHarness();
    const thrownToken = thrown.controller.beginAgentConstruction(expected,
      thrown.constructionAuthority);
    thrown.controller.abortAgentConstruction(thrownToken, "agent.fixture-threw");
    assert.equal(thrown.controller.state, "revoked");
    assert.equal(thrown.controller.snapshot().first_revocation.reason_code, "agent.fixture-threw");
  });

test("qualified and revoked controllers enter terminal teardown without treating disposal as serving mutation",
  async () => {
    for (const revokeFirst of [false, true]) {
      const {controller} = await qualifiedHarness();
      if (revokeFirst) controller.beforeMutation("fiber.update", "x");
      controller.beginStop();
      assert.equal(controller.beforeMutation("fiber.dispose", "x").allowed, true);
      controller.finishStop();
      assert.equal(controller.state, "stopped");
      assert.equal(controller.snapshot().serving, false);
    }
  });

async function startFixture() {
  const home = await mkdtemp(join(tmpdir(), "are-dsh-d0b4c-"));
  const child = spawn(process.execPath, [fixturePath], {
    stdio: ["ignore", "pipe", "pipe", "ipc"],
    detached: process.platform !== "win32",
    env: {...process.env, DSH_HOME: home, DSH_TELEMETRY_DISABLED: "1", NO_COLOR: "1"},
  });
  let stdout = "";
  let stderr = "";
  let ready;
  let fatal;
  let counter = 0;
  const pending = new Map();
  child.stdout.on("data", (chunk) => { stdout = (stdout + chunk).slice(-4096); });
  child.stderr.on("data", (chunk) => { stderr = (stderr + chunk).slice(-8192); });
  child.on("message", (message) => {
    if (message?.schema_version !== FIXTURE_SCHEMA) return;
    if (message.kind === "ready") ready = message.receipt;
    if (message.kind === "fatal") fatal = message.reason_code;
    if (message.kind === "response") {
      const waiter = pending.get(message.request_key);
      if (!waiter) return;
      pending.delete(message.request_key);
      clearTimeout(waiter.timer);
      waiter.resolve(message.result);
    }
  });
  const request = (command) => new Promise((resolve, reject) => {
    const requestKey = `d0b4c-${process.pid}-${++counter}`;
    const timer = setTimeout(() => reject(new Error(`fixture timeout: ${command}`)), 10_000);
    pending.set(requestKey, {resolve, timer});
    child.send({schema_version: FIXTURE_SCHEMA, request_key: requestKey, command}, (error) => {
      if (error) { clearTimeout(timer); pending.delete(requestKey); reject(error); }
    });
  });
  const stop = async () => {
    if (child.exitCode === null && child.connected) await request("dispose").catch(() => {});
    if (child.exitCode === null) child.kill("SIGTERM");
    await Promise.race([once(child, "exit"), new Promise((resolve) => setTimeout(resolve, 2000))]);
    if (child.exitCode === null) child.kill("SIGKILL");
    await rm(home, {recursive: true, force: true});
  };
  const deadline = Date.now() + 600_000;
  while (!ready && !fatal && child.exitCode === null && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  if (!ready) {
    await stop();
    throw new Error(`fixture did not qualify: ${fatal ?? child.exitCode}; ${stderr}; ${stdout}`);
  }
  return {ready, request, stop};
}

test("the disposable restricted Host qualifies before IPC readiness and rejects a late direct root plugin",
  {timeout: 630_000}, async () => {
    const fixture = await startFixture();
    try {
      assert.equal(fixture.ready.state, "qualified");
      assert.equal(fixture.ready.epoch, 1);
      assert.equal(fixture.ready.session_admission, "not-established");
      assert.equal(fixture.ready.claim_posture, "trusted-import-ancestry");
      assert.doesNotMatch(JSON.stringify(fixture.ready), /token|cookie|DSH_HOME|\/tmp\//u);
      const rejected = await fixture.request("inject-unknown-root");
      assert.equal(rejected.accepted, false);
      assert.equal(rejected.reason_code, "epoch.registration-not-serving");
      assert.equal(rejected.snapshot.state, "revoked");
      assert.equal(rejected.snapshot.first_revocation.reason_code, "mutation.registry-plugin");
    } finally {
      await fixture.stop();
    }
  });
