import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {once} from "node:events";
import {mkdir, mkdtemp, readFile, rm, symlink, writeFile} from "node:fs/promises";
import {createRequire} from "node:module";
import {tmpdir} from "node:os";
import {dirname, join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  DSH_GRAPH_MANIFEST_SCHEMA,
  DSH_RESTRICTED_PROFILE_OVERLAY_SHA256,
  DSH_RESTRICTED_PROFILE_OVERLAY_TEMPLATE,
  MAX_HASH_CHUNK_BYTES,
  MAX_MANIFEST_BYTES,
  compareDshGraphObservation,
  hashInstalledPackageInventory,
  inventoryInstalledPackageSet,
  loadDshGraphManifest,
  materialDigest,
  parseDshGraphManifest,
  renderDshRestrictedProfileOverlay,
  verifyDshGraphManifest,
  verifyInstalledPackageSet,
  verifySourcePins,
} from "../src/dsh-graph-manifest.mjs";

const SCHEMA = "are.dsh-source-pinned-graph-witness/v1";
const adapterRoot = fileURLToPath(new URL("../", import.meta.url));
const manifestPath = join(adapterRoot, "config", "dsh-web-are-read-only-graph-manifest.v1.json");
const witnessPath = fileURLToPath(new URL("./fixtures/web-source-pinned-graph-witness.mjs", import.meta.url));
const require = createRequire(import.meta.url);
const roots = {
  adapter_root: adapterRoot,
  dsh_package_json: require.resolve("@deepseek-ai/dsh/package.json"),
  node_modules_root: join(adapterRoot, "node_modules"),
};

function clone(value) {
  return structuredClone(value);
}

function rematerialize(value) {
  const copy = clone(value);
  delete copy.material_digest;
  return {...copy, material_digest: materialDigest(copy)};
}

function expectCode(action, code) {
  assert.throws(action, (error) => error?.code === code,
    `expected ${code}`);
}

function redacted(value) {
  return value.replaceAll(/token=[^\s]+/gu, "token=[redacted]").slice(-1600);
}

async function startWitness(prefix) {
  const home = await mkdtemp(join(tmpdir(), prefix));
  const child = spawn(process.execPath, [witnessPath], {
    stdio: ["ignore", "pipe", "pipe", "ipc"],
    detached: process.platform !== "win32",
    env: {...process.env, DSH_HOME: home, DSH_TELEMETRY_DISABLED: "1", NO_COLOR: "1"},
  });
  let stdout = "";
  let stderr = "";
  let ready = false;
  let fatal;
  let counter = 0;
  const pending = new Map();
  child.stdout.on("data", (chunk) => { stdout = (stdout + chunk.toString("utf8")).slice(-8192); });
  child.stderr.on("data", (chunk) => { stderr = (stderr + chunk.toString("utf8")).slice(-8192); });
  child.on("message", (message) => {
    if (!message || message.schema_version !== SCHEMA) return;
    if (message.kind === "ready") ready = true;
    if (message.kind === "fatal") fatal = message.reason_code;
    if (message.kind !== "response") return;
    const waiter = pending.get(message.request_key);
    if (waiter === undefined) return;
    pending.delete(message.request_key);
    clearTimeout(waiter.timer);
    waiter.resolve(message.result);
  });

  const signal = (name) => {
    try {
      if (process.platform !== "win32" && Number.isSafeInteger(child.pid)) process.kill(-child.pid, name);
      else child.kill(name);
    } catch (error) {
      if (error?.code !== "ESRCH") throw error;
    }
  };
  const request = (command, timeout = 15_000) => new Promise((resolve, reject) => {
    if (child.exitCode !== null || !child.connected) {
      reject(new Error(`DSH witness unavailable for ${command}`));
      return;
    }
    const requestKey = `d0b4b-${process.pid}-${++counter}`;
    const timer = setTimeout(() => {
      pending.delete(requestKey);
      reject(new Error(`DSH witness timed out during ${command}`));
    }, timeout);
    pending.set(requestKey, {resolve, reject, timer});
    child.send({schema_version: SCHEMA, request_key: requestKey, command}, (error) => {
      if (error === null) return;
      clearTimeout(timer);
      pending.delete(requestKey);
      reject(error);
    });
  });
  const stop = async () => {
    if (child.exitCode === null && child.connected) await request("dispose", 5_000).catch(() => {});
    if (child.exitCode === null) {
      signal("SIGTERM");
      await Promise.race([once(child, "exit"), new Promise((done) => setTimeout(done, 2_000))]);
      if (child.exitCode === null) signal("SIGKILL");
    }
    await rm(home, {recursive: true, force: true});
  };

  try {
    const deadline = Date.now() + 45_000;
    let launched;
    while (Date.now() < deadline && child.exitCode === null && fatal === undefined) {
      launched = stdout.match(/dsh web: (http:\/\/[^\s]+)/u)?.[1];
      if (launched && ready) break;
      await new Promise((done) => setTimeout(done, 50));
    }
    assert.equal(fatal, undefined, `witness failed to boot: ${fatal ?? "unknown"}`);
    assert.ok(launched && ready,
      `DSH witness did not become ready (exit=${child.exitCode}; stderr=${redacted(stderr)})`);
    const url = new URL(launched);
    assert.equal(url.hostname, "127.0.0.1");
    const login = await fetch(url, {redirect: "manual"});
    const cookie = login.headers.get("set-cookie")?.split(";", 1)[0];
    assert.ok(cookie, `DSH Web token exchange failed with status ${login.status}`);
    return {url, cookie, request, stop};
  } catch (error) {
    await stop();
    throw error;
  }
}

async function createRestrictedSession(witness) {
  const response = await fetch(new URL("/api/session/create", witness.url), {
    method: "POST",
    headers: {"content-type": "application/json", cookie: witness.cookie,
      origin: witness.url.origin},
    body: JSON.stringify({
      type: "client-request",
      rpcId: "are-d0b4b-create",
      method: "session/create",
      payload: {args: {request: {}}},
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.type, "server-response");
  assert.equal(body.result?.ok, true);
}

async function writePackage(root, locator, name, version, files = {}) {
  const target = join(root, "node_modules", locator);
  await mkdir(target, {recursive: true});
  await writeFile(join(target, "package.json"), JSON.stringify({name, version}));
  for (const [path, bytes] of Object.entries(files)) {
    const destination = join(target, path);
    await mkdir(dirname(destination), {recursive: true});
    await writeFile(destination, bytes);
  }
  return target;
}

test("D0b.4b binds the pinned installed DSH graph and rejects drift",
  {timeout: 900_000}, async (t) => {
    const manifest = await loadDshGraphManifest(manifestPath);

    await t.test("uses a closed canonical manifest and a symbolic restricted overlay", () => {
      assert.equal(manifest.schema_version, DSH_GRAPH_MANIFEST_SCHEMA);
      assert.equal(manifest.installed_package_set.package_instances, 523);
      assert.equal(manifest.installed_package_set.file_count, 25_509);
      assert.equal(manifest.installed_package_set.byte_count, 224_470_546);
      assert.equal(manifest.installed_package_set.native_file_count, 14);
      assert.equal(manifest.installed_package_set.max_file_bytes, 18_621_496);
      assert.equal(manifest.installed_package_set.package_set_sha256,
        "28426ac106f26334cf54ced76b053ec0a915ffee7fa06589b3ee30a7ef655ff3");
      assert.equal(manifest.source_pins.length, 340);
      assert.ok(manifest.source_pins.some(pin => pin.selector ===
        "are:packages/codex-app-server-wrapper/test/plan-requirement-migration.test.mjs"));
      assert.ok(manifest.source_pins.some(pin => pin.selector ===
        "are:packages/codex-app-server-wrapper/test/plan-requirement-migration-lifecycle.test.mjs"));
      for (const selector of ["are:src/decision-cli.mjs",
        "are:packages/codex-app-server-wrapper/src/preflight.mjs",
        "are:packages/codex-app-server-wrapper/src/objective-session-lifecycle.mjs",
        "are:packages/codex-app-server-wrapper/src/dsh-objective-checkpoint-observation.mjs",
        "adapter:src/web-owned-preparation.mjs", "adapter:src/web-objective-binding.mjs",
        "adapter:src/web-host-plan-selection.mjs", "adapter:test/web-host-plan-selection.test.mjs",
        "adapter:src/web-model-context-batch.mjs",
        "adapter:test/fixtures/host-plan-selection.mjs", "adapter:test/web-host-cli.test.mjs",
        "adapter:test/fixtures/owned-model-context.mjs",
        "adapter:test/web-host-owned-cancel.test.mjs",
        "adapter:test/web-host-owned-queue-steer.test.mjs",
        "adapter:test/web-host-owned-preparation-race.test.mjs",
        "adapter:test/web-host-owned-settings-race.test.mjs",
        "adapter:test/web-host-owned-clean-handover.test.mjs"]) {
        assert.ok(manifest.source_pins.some(pin => pin.selector === selector), selector);
      }
      assert.equal(manifest.host_loader_rows.length, 156);
      assert.deepEqual(manifest.host_loader_rows.find((row) => row.id === "include:goal-round-driver"), {
        id: "include:goal-round-driver", module_specifier: "@deepseek-ai/dsh-goal-round-driver",
        group: false, disabled: true, fiber_phase: null,
      });
      for (const id of ["include:cordis-host-runner", "include:subagent",
        "include:subagent-spawn-in-process", "include:subagent-fork-in-process"]) {
        assert.equal(manifest.host_loader_rows.find((row) => row.id === id)?.disabled, true, id);
      }
      assert.deepEqual(manifest.model_tool_names, []);
      assert.equal(materialDigest(manifest), manifest.material_digest);
      assert.equal(materialDigest({profile_id: "a", manifest_id: "b"}),
        materialDigest({manifest_id: "b", profile_id: "a"}));
      assert.equal(materialDigest({overlay: DSH_RESTRICTED_PROFILE_OVERLAY_TEMPLATE}),
        materialDigest({overlay: renderDshRestrictedProfileOverlay()}));
      assert.equal(manifest.profile_layers[2].sha256, DSH_RESTRICTED_PROFILE_OVERLAY_SHA256);
      assert.match(renderDshRestrictedProfileOverlay("/disposable/root"),
        /path: "\/disposable\/root"/u);

      expectCode(() => parseDshGraphManifest(Buffer.alloc(MAX_MANIFEST_BYTES + 1, 0x7b)),
        "manifest.too-large");
      const unknown = clone(manifest);
      unknown.unreviewed = true;
      expectCode(() => parseDshGraphManifest(JSON.stringify(unknown)),
        "manifest.schema-unknown-field");
      const staleDigest = clone(manifest);
      staleDigest.profile_id = "changed";
      expectCode(() => parseDshGraphManifest(JSON.stringify(staleDigest)),
        "manifest.material-digest-mismatch");
      const layerDrift = clone(manifest);
      layerDrift.profile_layers[2].sha256 = "0".repeat(64);
      expectCode(() => parseDshGraphManifest(JSON.stringify(rematerialize(layerDrift))),
        "manifest.profile-layer-mismatch");
      const packageDrift = clone(manifest);
      packageDrift.packages[0].version = "0.0.0";
      expectCode(() => parseDshGraphManifest(JSON.stringify(rematerialize(packageDrift))),
        "manifest.package-version-mismatch");
      const traversal = clone(manifest);
      traversal.installed_package_set.packages[0].locator = "../escape";
      expectCode(() => parseDshGraphManifest(JSON.stringify(traversal)),
        "manifest.path-invalid");
    });

    await t.test("verifies runtime, every source pin, and the complete installed package tree",
      {timeout: 600_000}, async () => {
        const verified = await verifyDshGraphManifest(manifest, {roots});
        assert.equal(verified.ok, true, JSON.stringify(verified));
        assert.equal(verified.package_instances, 523);
        assert.equal(verified.source_pin_count, 340);

        const wrongRuntime = await verifyDshGraphManifest(manifest, {
          roots, runtime_tuple: {...manifest.runtime, node_module_abi: "0"},
        });
        assert.deepEqual(wrongRuntime.reason_codes, ["source.runtime-mismatch"]);

        for (const mutation of [
          (pin) => { pin.package_version = "0.0.0"; },
          (pin) => { pin.sha256 = "0".repeat(64); },
          (pin) => { pin.relative_path = "package.json"; },
        ]) {
          const pins = clone(manifest.source_pins);
          mutation(pins[0]);
          assert.deepEqual((await verifySourcePins(pins, roots)).reason_codes,
            ["source.pin-mismatch"]);
        }

        for (const selector of ["are:src/decision-cli.mjs",
          "are:packages/codex-app-server-wrapper/src/preflight.mjs",
          "are:packages/codex-app-server-wrapper/src/objective-session-lifecycle.mjs",
          "adapter:src/web-owned-preparation.mjs"]) {
          const changed = clone(manifest.source_pins.find(pin => pin.selector === selector));
          changed.sha256 = "0".repeat(64);
          assert.deepEqual((await verifySourcePins([changed], roots)).reason_codes,
            ["source.pin-mismatch"], selector);
        }

        let hashReads = 0;
        const countDrift = clone(manifest.installed_package_set);
        countDrift.package_instances += 1;
        const countResult = await verifyInstalledPackageSet(countDrift, roots.node_modules_root, {
          hash_file_impl: async () => { hashReads += 1; return "0".repeat(64); },
        });
        assert.deepEqual(countResult.reason_codes, ["source.package-count-mismatch"]);
        assert.equal(hashReads, 0, "inventory mismatch must stop before content hashing");

        const locatorDrift = clone(manifest.installed_package_set);
        locatorDrift.packages[0].locator += "-changed";
        assert.deepEqual((await verifyInstalledPackageSet(locatorDrift, roots.node_modules_root))
          .reason_codes, ["source.package-inventory-mismatch"]);
        const versionDrift = clone(manifest.installed_package_set);
        versionDrift.packages[0].version = "0.0.0";
        assert.deepEqual((await verifyInstalledPackageSet(versionDrift, roots.node_modules_root))
          .reason_codes, ["source.package-inventory-mismatch"]);

        const prePatchDigest = clone(manifest.installed_package_set);
        prePatchDigest.package_set_sha256 =
          "16392d0d956dc3e375536e78fd5a48a9f7003d7f679b6b26ab6aab344d6b826d";
        assert.deepEqual((await verifyInstalledPackageSet(prePatchDigest, roots.node_modules_root))
          .reason_codes, ["source.package-set-digest-mismatch"]);
      });

    await t.test("enforces filesystem and hashing bounds on synthetic package trees", async () => {
      const base = await mkdtemp(join(tmpdir(), "are-dsh-graph-synthetic-"));
      try {
        const outer = await writePackage(base, "outer", "outer", "1.0.0", {"outer.txt": "outer"});
        await writePackage(outer, "inner", "inner", "1.0.0", {"inner.txt": "inner"});
        const inventory = await inventoryInstalledPackageSet(join(base, "node_modules"));
        assert.equal(inventory.package_instances, 2);
        assert.equal(inventory.rows.find((row) => row.locator === "outer").file_count, 2,
          "outer package must not double-count nested node_modules files");
        assert.equal(inventory.rows.find((row) => row.locator === "outer/node_modules/inner").file_count, 2);

        let largestBuffer = 0;
        const hashed = await hashInstalledPackageInventory(inventory, {
          read_chunk_bytes: MAX_HASH_CHUNK_BYTES,
          hash_file_impl: async (_path, _entry, buffer) => {
            largestBuffer = Math.max(largestBuffer, buffer.byteLength);
            return "0".repeat(64);
          },
        });
        assert.equal(hashed.package_instances, 2);
        assert.ok(largestBuffer <= MAX_HASH_CHUNK_BYTES);
        const expected = {
          root_selector: "adapter:node_modules",
          package_instances: hashed.package_instances,
          file_count: hashed.file_count,
          byte_count: hashed.byte_count,
          native_file_count: hashed.native_file_count,
          max_file_bytes: hashed.max_file_bytes,
          package_row_json_bytes: hashed.package_row_json_bytes,
          package_set_sha256: hashed.package_set_sha256,
          packages: hashed.rows,
        };
        const treeDrift = clone(expected);
        treeDrift.packages[0].tree_sha256 = "f".repeat(64);
        assert.deepEqual((await verifyInstalledPackageSet(treeDrift, join(base, "node_modules"), {
          read_chunk_bytes: MAX_HASH_CHUNK_BYTES,
          hash_file_impl: async () => "0".repeat(64),
        })).reason_codes, ["source.package-tree-mismatch"]);
        await assert.rejects(() => hashInstalledPackageInventory(inventory, {
          read_chunk_bytes: MAX_HASH_CHUNK_BYTES + 1,
        }), (error) => error?.code === "source.hash-chunk-invalid");

        await symlink("outer.txt", join(outer, "linked.txt"));
        await assert.rejects(() => inventoryInstalledPackageSet(join(base, "node_modules")),
          (error) => error?.code === "source.symlink-rejected");
        await rm(join(outer, "linked.txt"));

        const fifo = join(outer, "special.fifo");
        const madeFifo = spawnSync("mkfifo", [fifo], {stdio: "ignore"});
        assert.equal(madeFifo.status, 0, "Linux witness requires mkfifo for the special-file control");
        await assert.rejects(() => inventoryInstalledPackageSet(join(base, "node_modules")),
          (error) => error?.code === "source.special-file-rejected");
      } finally {
        await rm(base, {recursive: true, force: true});
      }
    });

    let positiveObservation;
    await t.test("matches the restricted disposable Host before and after one empty session", async () => {
      const witness = await startWitness("are-dsh-graph-positive-");
      try {
        const before = await witness.request("snapshot-before");
        await createRestrictedSession(witness);
        const after = await witness.request("snapshot-after");
        positiveObservation = {before, ...after};
        const result = compareDshGraphObservation(manifest, positiveObservation);
        assert.equal(result.ok, true, JSON.stringify(result));
        assert.equal(result.active_fiber_count, 169);
        assert.equal(result.callback_origin, "unproved");
        assert.equal(result.serving_graph_lock, "not-established");
      } finally {
        await witness.stop();
      }
    });

    await t.test("rejects row, preset, composition, tool, and callback-origin drift", () => {
      const controls = [
        ["missing row", (value) => { value.after.host_loader_rows.pop(); },
          "graph.host-loader-rows-mismatch"],
        ["failed row", (value) => { value.after.host_loader_rows[0].fiber_phase = "failed"; },
          "graph.host-loader-rows-mismatch"],
        ["root", (value) => { value.after.preset.roots[0].selector = "unrecognized-root"; },
          "graph.preset-roots-mismatch"],
        ["default", (value) => { value.after.preset.default_id = "standard"; },
          "graph.preset-default-mismatch"],
        ["preset", (value) => { value.after.preset.selected_id = "standard"; },
          "graph.preset-selected-mismatch"],
        ["composition", (value) => { value.after.preset.composition_sha256 = "0".repeat(64); },
          "graph.preset-composition-mismatch"],
        ["tool", (value) => { value.after.model_tool_names = ["unexpected"]; },
          "graph.model-tools-mismatch"],
        ["callback", (value) => { value.after.callback_origin = "proved"; },
          "graph.callback-origin-proved-forbidden"],
      ];
      for (const [label, mutate, reason] of controls) {
        const value = clone(positiveObservation);
        mutate(value);
        assert.ok(compareDshGraphObservation(manifest, value).reason_codes.includes(reason), label);
      }
    });

    await t.test("rejects a direct no-Entry registration on a separate fresh Host", async () => {
      const witness = await startWitness("are-dsh-graph-negative-");
      try {
        const before = await witness.request("snapshot-before");
        assert.equal(before.structure.active_fiber_count, 164);
        const injected = await witness.request("inject-unknown");
        const result = compareDshGraphObservation(manifest, {before, ...injected});
        assert.deepEqual(result.reason_codes, ["graph.unknown-no-entry-registration"]);
        assert.equal(result.callback_origin, "unproved");
        assert.equal(result.serving_graph_lock, "not-established");
      } finally {
        await witness.stop();
      }
    });
  });
