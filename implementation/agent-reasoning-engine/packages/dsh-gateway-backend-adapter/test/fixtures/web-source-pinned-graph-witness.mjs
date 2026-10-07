import {createRequire} from "node:module";
import {chmod, readFile, stat, writeFile} from "node:fs/promises";
import {dirname, join} from "node:path";
import {pathToFileURL, fileURLToPath} from "node:url";

import {collectDshGraphSnapshot, dshGraphCreationDelta,
  renderDshRestrictedProfileOverlay, sha256}
  from "../../src/dsh-graph-manifest.mjs";

const SCHEMA = "are.dsh-source-pinned-graph-witness/v1";
const require = createRequire(import.meta.url);
const adapterRoot = fileURLToPath(new URL("../../", import.meta.url));
const dshPackage = require.resolve("@deepseek-ai/dsh/package.json");
const dshRoot = dirname(dshPackage);
const dshRequire = createRequire(dshPackage);
const profileBootUrl = pathToFileURL(join(dshRoot, "lib/profile-boot-BP_C0vpU.js"));
const appBootUrl = pathToFileURL(dshRequire.resolve("@deepseek-ai/dsh-app-boot"));
const presetsUrl = pathToFileURL(dshRequire.resolve("@deepseek-ai/dsh-agent-presets"));
const [{runProfile}, {loadLayeredEnv}, {standingMountFor}] = await Promise.all([
  import(profileBootUrl.href),
  import(appBootUrl.href),
  import(presetsUrl.href),
]);

if (typeof process.send !== "function") throw new Error("dsh-graph-witness.ipc-required");
if (typeof process.env.DSH_HOME !== "string" || process.env.DSH_HOME.length === 0) {
  throw new Error("dsh-graph-witness.home-required");
}

const presetRoot = join(adapterRoot, "config", "presets");
const presetRootSelector = "config/presets";
const compositionSelector = "config/presets/are-read-only/agent.cordis.yml";
const compositionPath = join(adapterRoot, compositionSelector);
const readOnlyPatch = join(adapterRoot, "config", "read-only.patch.yml");
const presetPatch = join(process.env.DSH_HOME, "d0b4b-preset.patch.yml");
const homeStat = await stat(process.env.DSH_HOME);
if (!homeStat.isDirectory()) throw new Error("dsh-graph-witness.home-invalid");
await chmod(process.env.DSH_HOME, 0o700);
await writeFile(presetPatch, renderDshRestrictedProfileOverlay(presetRoot), {mode: 0o600});
const compositionSha256 = sha256(await readFile(compositionPath));

process.argv[1] = join(dshRoot, "lib", "bin.js");

let host;
let stopAgentListener;
let unexpectedFiber;
let createdAgent;
let agentCount = 0;
let beforeSnapshot;
let disposed = false;
let phase = "booting";
const requestKeys = new Set();

function send(message) {
  if (typeof process.send === "function" && process.connected) {
    process.send({schema_version: SCHEMA, ...message});
  }
}

function snapshot(agent) {
  return collectDshGraphSnapshot({
    ctx: host.ctx,
    agent,
    standing_mount_for: standingMountFor,
    preset_root_path: presetRoot,
    preset_root_selector: presetRootSelector,
    composition_selector: compositionSelector,
    composition_sha256: compositionSha256,
  });
}

async function disposeHost() {
  if (disposed) return;
  disposed = true;
  phase = "disposing";
  try {
    await unexpectedFiber?.dispose();
  } finally {
    stopAgentListener?.();
    await host?.shutdown.shutdown(0);
    phase = "disposed";
  }
}

async function handle(message) {
  if (!message || message.schema_version !== SCHEMA
    || typeof message.request_key !== "string" || message.request_key.length === 0
    || typeof message.command !== "string") {
    throw new Error("dsh-graph-witness.request-invalid");
  }
  if (requestKeys.has(message.request_key)) throw new Error("dsh-graph-witness.request-replayed");
  requestKeys.add(message.request_key);

  if (message.command === "snapshot-before") {
    if (phase !== "ready" || agentCount !== 0 || unexpectedFiber !== undefined) {
      throw new Error("dsh-graph-witness.before-phase-invalid");
    }
    beforeSnapshot = snapshot(undefined);
    phase = "observed-before";
    return beforeSnapshot.value;
  }
  if (message.command === "snapshot-after") {
    if (phase !== "observed-before" || agentCount !== 1 || createdAgent === undefined) {
      throw new Error("dsh-graph-witness.after-phase-invalid");
    }
    const after = snapshot(createdAgent);
    phase = "observed-after";
    return {after: after.value, creation_delta: dshGraphCreationDelta(beforeSnapshot, after)};
  }
  if (message.command === "inject-unknown") {
    if (phase !== "observed-before" || agentCount !== 0 || unexpectedFiber !== undefined) {
      throw new Error("dsh-graph-witness.inject-phase-invalid");
    }
    function areUnexpectedDirectRegistration() {}
    unexpectedFiber = host.ctx.root.plugin(areUnexpectedDirectRegistration);
    await unexpectedFiber;
    const after = snapshot(undefined);
    phase = "observed-unknown";
    return {after: after.value, creation_delta: dshGraphCreationDelta(beforeSnapshot, after)};
  }
  if (message.command === "dispose") {
    await disposeHost();
    return {ok: true, reason_codes: []};
  }
  throw new Error("dsh-graph-witness.command-unknown");
}

let commandChain = Promise.resolve();
function onMessage(message) {
  commandChain = commandChain.then(async () => {
    try {
      const result = await handle(message);
      send({kind: "response", request_key: message?.request_key ?? null, result});
      if (message.command === "dispose") {
        process.off("message", onMessage);
        process.disconnect();
      }
    } catch (error) {
      send({kind: "response", request_key: message?.request_key ?? null,
        result: {ok: false, reason_codes: [error instanceof Error
          ? error.message : "dsh-graph-witness.failed"]}});
    }
  });
}

try {
  host = await runProfile({
    environment: loadLayeredEnv("dsh"),
    profile: "web",
    patchFiles: [presetPatch, readOnlyPatch],
    args: ["--no-open", "--port", "0"],
  });
  stopAgentListener = host.ctx.on("agent/created", ({agent}) => {
    agentCount += 1;
    if (createdAgent === undefined) createdAgent = agent;
    else if (createdAgent !== agent) phase = "agent-ambiguous";
  });
  phase = "ready";
  process.on("message", onMessage);
  send({kind: "ready"});
} catch (error) {
  send({kind: "fatal", reason_code: error instanceof Error
    ? error.message : "dsh-graph-witness.boot-failed"});
  await disposeHost().catch(() => {});
  process.exitCode = 1;
}
