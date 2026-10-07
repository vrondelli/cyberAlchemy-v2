import {createRequire} from "node:module";
import {chmod, readFile, stat, writeFile} from "node:fs/promises";
import {readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

import {createDshGraphEpochController} from "../../src/dsh-graph-epoch.mjs";
import {buildDshSourcePinIndex, collectDshGraphSnapshot,
  compareDshHostQualification, loadDshGraphManifest,
  renderDshRestrictedProfileOverlay, sha256, verifyDshGraphManifest}
  from "../../src/dsh-graph-manifest.mjs";

const SCHEMA = "are.dsh-early-provenance-revocation-fixture/v1";
const require = createRequire(import.meta.url);
const adapterRoot = fileURLToPath(new URL("../../", import.meta.url));
const dshPackage = require.resolve("@deepseek-ai/dsh/package.json");
const dshRoot = dirname(dshPackage);
const dshRequire = createRequire(dshPackage);
const profileBootUrl = pathToFileURL(join(dshRoot, "lib/profile-boot-BP_C0vpU.js"));
const appBootUrl = pathToFileURL(dshRequire.resolve("@deepseek-ai/dsh-app-boot"));
const [{runProfile}, {loadLayeredEnv}] = await Promise.all([
  import(profileBootUrl.href),
  import(appBootUrl.href),
]);

if (typeof process.send !== "function") throw new Error("dsh-graph-epoch.ipc-required");
if (typeof process.env.DSH_HOME !== "string" || process.env.DSH_HOME.length === 0) {
  throw new Error("dsh-graph-epoch.home-required");
}

const manifestPath = join(adapterRoot, "config", "dsh-web-are-read-only-graph-manifest.v1.json");
const presetRoot = join(adapterRoot, "config", "presets");
const presetRootSelector = "config/presets";
const compositionSelector = "config/presets/are-read-only/agent.cordis.yml";
const compositionPath = join(adapterRoot, compositionSelector);
const readOnlyPatch = join(adapterRoot, "config", "read-only.patch.yml");
const presetPatch = join(process.env.DSH_HOME, "d0b4c-preset.patch.yml");
const roots = {
  adapter_root: adapterRoot,
  dsh_package_json: dshPackage,
  node_modules_root: join(adapterRoot, "node_modules"),
};

const homeStat = await stat(process.env.DSH_HOME);
if (!homeStat.isDirectory()) throw new Error("dsh-graph-epoch.home-invalid");
await chmod(process.env.DSH_HOME, 0o700);
await writeFile(presetPatch, renderDshRestrictedProfileOverlay(presetRoot), {mode: 0o600});

let host;
let activeCtx;
let disposed = false;
let hostPrepareCalled = false;
const requestKeys = new Set();

function send(message) {
  if (typeof process.send === "function" && process.connected) {
    process.send({schema_version: SCHEMA, ...message});
  }
}

async function disposeHost() {
  if (disposed) return;
  disposed = true;
  await host?.shutdown.shutdown(0);
}

try {
  const manifest = await loadDshGraphManifest(manifestPath);
  const verified = await verifyDshGraphManifest(manifest, {roots});
  if (!verified.ok) throw new Error(`dsh-graph-epoch.manifest-${verified.reason_codes.join("+")}`);
  const sourcePinIndex = await buildDshSourcePinIndex(manifest, roots);
  const expectedFingerprints = {
    manifest_id: manifest.manifest_id,
    material_digest: manifest.material_digest,
    package_set_sha256: manifest.installed_package_set.package_set_sha256,
    roots: manifest.preset.roots,
    default_id: manifest.preset.default_id,
    composition_selector: compositionSelector,
    composition_sha256: manifest.preset.composition_sha256,
  };
  const controller = createDshGraphEpochController({
    source_pin_index: sourcePinIndex,
    manifest_id: manifest.manifest_id,
    material_digest: manifest.material_digest,
    package_set_sha256: manifest.installed_package_set.package_set_sha256,
    source_pin_count: manifest.source_pins.length,
    expected_fingerprints: expectedFingerprints,
    fingerprint_provider: () => ({
      manifest_id: manifest.manifest_id,
      material_digest: manifest.material_digest,
      package_set_sha256: manifest.installed_package_set.package_set_sha256,
      roots: activeCtx.agentPresets.roots.map((root) => ({
        selector: root.path === presetRoot ? presetRootSelector : "unrecognized-root",
        trust: root.trust,
      })),
      default_id: activeCtx.agentPresets.defaultId,
      composition_selector: compositionSelector,
      composition_sha256: sha256(readFileSync(compositionPath)),
    }),
    qualification_observer: async (ctx) => {
      activeCtx = ctx;
      const snapshot = collectDshGraphSnapshot({
        ctx,
        agent: undefined,
        standing_mount_for: () => undefined,
        preset_root_path: presetRoot,
        preset_root_selector: presetRootSelector,
        composition_selector: compositionSelector,
        composition_sha256: sha256(await readFile(compositionPath)),
      });
      return compareDshHostQualification(manifest, snapshot.value);
    },
  });

  process.argv[1] = join(dshRoot, "lib", "bin.js");
  host = await runProfile({
    environment: loadLayeredEnv("dsh"),
    profile: "web",
    patchFiles: [presetPatch, readOnlyPatch],
    args: ["--no-open", "--port", "0"],
    graphControl: controller,
    hostPrepare: (ctx) => {
      if (hostPrepareCalled || ctx.get("loader") === undefined
        || ctx.get("agentPresets") !== undefined) {
        throw new Error("dsh-graph-epoch.host-prepare-order-invalid");
      }
      hostPrepareCalled = true;
    },
  });
  if (!hostPrepareCalled) throw new Error("dsh-graph-epoch.host-prepare-missing");
  const receipt = controller.qualificationReceipt();
  if (receipt?.state !== "qualified") throw new Error("dsh-graph-epoch.not-qualified");

  process.on("message", (message) => {
    Promise.resolve().then(async () => {
      if (!message || message.schema_version !== SCHEMA
        || typeof message.request_key !== "string" || requestKeys.has(message.request_key)) {
        throw new Error("dsh-graph-epoch.request-invalid");
      }
      requestKeys.add(message.request_key);
      if (message.command === "snapshot") return controller.snapshot();
      if (message.command === "inject-unknown-root") {
        function areUnexpectedDirectRegistration() {}
        try {
          host.ctx.root.plugin(areUnexpectedDirectRegistration);
          return {accepted: true, snapshot: controller.snapshot()};
        } catch (error) {
          return {accepted: false, reason_code: error?.code ?? error?.message,
            snapshot: controller.snapshot()};
        }
      }
      if (message.command === "dispose") {
        await disposeHost();
        return controller.snapshot();
      }
      throw new Error("dsh-graph-epoch.command-unknown");
    }).then((result) => {
      send({kind: "response", request_key: message?.request_key ?? null, result});
      if (message?.command === "dispose") process.disconnect();
    }, (error) => send({kind: "response", request_key: message?.request_key ?? null,
      result: {ok: false, reason_codes: [error?.code ?? error?.message ?? "fixture.failed"]}}));
  });
  send({kind: "ready", receipt});
} catch (error) {
  send({kind: "fatal", reason_code: error?.code ?? error?.message ?? "dsh-graph-epoch.boot-failed"});
  await disposeHost().catch(() => {});
  process.exitCode = 1;
}
