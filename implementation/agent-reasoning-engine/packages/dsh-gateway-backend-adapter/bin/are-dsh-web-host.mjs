#!/usr/bin/env node
import {createRequire} from "node:module";
import {randomUUID} from "node:crypto";
import {mkdtemp, rm, writeFile} from "node:fs/promises";
import {lstatSync, readFileSync, realpathSync, statSync} from "node:fs";
import {dirname, isAbsolute, join} from "node:path";
import {tmpdir} from "node:os";
import {fileURLToPath, pathToFileURL} from "node:url";

import {createDshGraphEpochController} from "../src/dsh-graph-epoch.mjs";
import {buildDshSourcePinIndex, canonicalJson, collectDshGraphSnapshot,
  compareDshHostQualification, loadDshGraphManifest,
  renderDshQualifiedWebOverlay, renderDshRestrictedProfileOverlay, sha256,
  verifyDshGraphManifest} from "../src/dsh-graph-manifest.mjs";
import {createDshWebHostOwner} from "../src/web-host-owner.mjs";
import {createDshWebGatewayJournalWorker} from "../src/web-gateway-journal-worker.mjs";
import {loadDshHostPlanSelection} from "../src/web-host-plan-selection.mjs";
import {createDshWebAdapterObservationServer, observedNativeTurnState, projectDshWebActivity,
  projectDshWebAdapterObservation}
  from "../src/web-adapter-observation.mjs";
import {readDshWebReleaseIndex, writeDshWebReleaseIndex} from "../src/web-release-index.mjs";

const require = createRequire(import.meta.url);
const adapterRoot = fileURLToPath(new URL("../", import.meta.url));
const dshPackage = require.resolve("@deepseek-ai/dsh/package.json");
const dshRoot = dirname(dshPackage);
const dshRequire = createRequire(dshPackage);
const defaultManifest = join(adapterRoot, "config/dsh-web-are-host-owned-graph-manifest.v1.json");
const [{runProfile}, {loadLayeredEnv}, {standingMountFor}] = await Promise.all([
  import(pathToFileURL(join(dshRoot, "lib/profile-boot-BP_C0vpU.js")).href),
  import(pathToFileURL(dshRequire.resolve("@deepseek-ai/dsh-app-boot")).href),
  import(pathToFileURL(dshRequire.resolve("@deepseek-ai/dsh-agent-presets")).href),
]);

export function parseDshWebHostArgs(argv) {
  const values = new Map();
  const resumeSessions = [];
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index];
    const value = argv[index + 1];
    if (!["--home", "--workspace", "--manifest", "--resume-session",
      "--observation-socket", "--development-observation-tcp-port", "--plan-selection"].includes(name)
      || !value || value.startsWith("--") || name !== "--resume-session" && values.has(name)) {
      throw new Error("dsh-web-host.arguments-invalid");
    }
    if (name === "--resume-session") resumeSessions.push(value);
    else values.set(name, value);
  }
  if (!values.has("--home") || !values.has("--workspace")) {
    throw new Error("dsh-web-host.required-argument-missing");
  }
  return {home: values.get("--home"), workspace: values.get("--workspace"),
    manifest: values.get("--manifest") ?? defaultManifest,
    plan_selection: values.get("--plan-selection") ?? null,
    observation_socket: values.get("--observation-socket") ?? null,
    development_observation_tcp_port: values.get("--development-observation-tcp-port") ?? null,
    resume_sessions: resumeSessions};
}

export function preflightDshWebHost(input) {
  for (const name of ["home", "workspace", "manifest"]) {
    if (typeof input?.[name] !== "string" || !isAbsolute(input[name])) {
      throw new Error(`dsh-web-host.${name}-absolute-required`);
    }
  }
  if (lstatSync(input.home).isSymbolicLink()) throw new Error("dsh-web-host.home-symlink-rejected");
  const home = realpathSync(input.home);
  const workspace = realpathSync(input.workspace);
  const manifest = realpathSync(input.manifest);
  if (!statSync(home).isDirectory() || !statSync(workspace).isDirectory()
    || !statSync(manifest).isFile()) throw new Error("dsh-web-host.input-type-invalid");
  if (process.platform !== "win32" && ((statSync(home).mode & 0o077) !== 0
    || typeof process.getuid === "function" && statSync(home).uid !== process.getuid())) {
    throw new Error("dsh-web-host.home-not-private");
  }
  const resumeSessions = input.resume_sessions ?? [];
  const observationSocket = input.observation_socket ?? null;
  const tcpPortRaw = input.development_observation_tcp_port ?? null;
  if (observationSocket !== null && (typeof observationSocket !== "string"
    || !isAbsolute(observationSocket) || dirname(observationSocket) !== home)) {
    throw new Error("dsh-web-host.observation-socket-invalid");
  }
  if (tcpPortRaw !== null && (typeof tcpPortRaw !== "string"
    || !/^(?:0|[1-9][0-9]{0,4})$/u.test(tcpPortRaw)
    || Number(tcpPortRaw) > 65535 || observationSocket !== null)) {
    throw new Error("dsh-web-host.observation-tcp-port-invalid");
  }
  if ((observationSocket !== null || tcpPortRaw !== null)
    && (typeof process.env.ARE_ADAPTER_OBSERVATION_TOKEN !== "string"
      || Buffer.byteLength(process.env.ARE_ADAPTER_OBSERVATION_TOKEN) < 32)) {
    throw new Error("dsh-web-host.observation-token-invalid");
  }
  if (!Array.isArray(resumeSessions) || resumeSessions.length > 16
    || new Set(resumeSessions).size !== resumeSessions.length
    || resumeSessions.some(id => typeof id !== "string"
      || !/^session-[0-9a-f-]{36}$/u.test(id))) {
    throw new Error("dsh-web-host.resume-session-invalid");
  }
  const planSelection = input.plan_selection === undefined || input.plan_selection === null
    ? null : loadDshHostPlanSelection({workspace, selection_path: input.plan_selection}).descriptor;
  return {home, workspace, manifest, resumeSessions, observationSocket, planSelection,
    observationTcpPort: tcpPortRaw === null ? null : Number(tcpPortRaw)};
}

export async function runDshWebHost(input, output = process.stdout) {
  const selected = preflightDshWebHost(input);
  if (process.platform !== "linux") throw new Error("dsh-web-host.platform-not-qualified");
  if (selected.manifest !== realpathSync(defaultManifest)) {
    throw new Error("dsh-web-host.manifest-not-qualified");
  }
  const manifest = await loadDshGraphManifest(selected.manifest);
  if (manifest.profile_id !== "dsh-web-are-host-owned") {
    throw new Error("dsh-web-host.profile-not-qualified");
  }
  const roots = {adapter_root: adapterRoot, dsh_package_json: dshPackage,
    node_modules_root: join(adapterRoot, "node_modules")};
  process.stderr.write(`${JSON.stringify({schema_version: "are.dsh-web-host-startup/v1",
    phase: "verifying-pinned-graph", authority_effect: "none"})}\n`);
  const verified = await verifyDshGraphManifest(manifest, {roots});
  if (!verified.ok) throw new Error(`dsh-web-host.manifest:${verified.reason_codes.join("+")}`);
  const sourcePinIndex = await buildDshSourcePinIndex(manifest, roots);
  process.stderr.write(`${JSON.stringify({schema_version: "are.dsh-web-host-startup/v1",
    phase: "pinned-graph-verified", authority_effect: "none"})}\n`);
  const presetRoot = join(adapterRoot, "config/presets");
  const compositionPath = join(presetRoot, "are-read-only/agent.cordis.yml");
  const compositionSelector = "config/presets/are-read-only/agent.cordis.yml";
  let patchDir;
  let store;
  let host;
  let owner;
  let observationServer;
  const observationEpoch = randomUUID();
  let stopped = false;
  let serving = false;
  async function stop() {
    if (stopped) return;
    stopped = true;
    let releaseError;
    const releasedSessionIds = [];
    try {
      if (serving && host && owner) {
        let admissionTimer;
        try {
          await Promise.race([owner.beginShutdown(), new Promise((_, reject) => {
            admissionTimer = setTimeout(() => reject(new Error("dsh-web-host.admission-drain-timeout")), 30_000);
          })]);
        } finally { clearTimeout(admissionTimer); }
        for (const agent of owner.liveAgentsSnapshot()) {
          if (host.ctx.agents.get(agent.id) !== agent
            || owner.inspect(agent)?.status !== "active") {
            throw new Error("dsh-web-host.session-owner-changed-at-stop");
          }
          await owner.disposeNativeAgent(agent);
          const released = await owner.releaseDrainedAgent(agent);
          if (released.binding_status !== "released") {
            throw new Error("dsh-web-host.session-release-unconfirmed");
          }
          releasedSessionIds.push(agent.id);
        }
        if (owner.liveAgentsSnapshot().length !== 0) {
          throw new Error("dsh-web-host.sessions-remain-at-stop");
        }
        writeDshWebReleaseIndex({home: selected.home, workspace: selected.workspace,
          manifest_id: manifest.manifest_id,
          gateway_head_digest: store.inspect().head_event_digest,
          session_ids: releasedSessionIds});
      }
    } catch (error) { releaseError = error; }
    try { await observationServer?.close(); }
    catch (error) { if (!releaseError) releaseError = error; }
    try { await host?.shutdown.shutdown(0); }
    finally {
      try { await store?.close(); }
      finally { if (patchDir) await rm(patchDir, {recursive: true, force: true}); }
    }
    if (serving) output.write(`${JSON.stringify({schema_version: "are.dsh-web-host-stopped/v1",
      ok: !releaseError, released_session_ids: releasedSessionIds,
      release_index_checkpointed: !releaseError,
      ...(releaseError ? {reason: releaseError.message} : {}), authority_effect: "none"})}\n`);
    if (releaseError) throw releaseError;
  }
  try {
  patchDir = await mkdtemp(join(tmpdir(), "are-dsh-web-host-"));
  const presetPatch = join(patchDir, "restricted-preset.patch.yml");
  const controllerPatch = join(patchDir, "qualified-controller.patch.yml");
  store = await createDshWebGatewayJournalWorker({
    path: join(selected.home, "are-web-gateway.jsonl"),
    store_id: "are-gateway-sessions:file",
    plan_selection: selected.planSelection,
    on_fatal: () => { if (serving) process.kill(process.pid, "SIGTERM"); },
  });
  const releaseIndex = selected.resumeSessions.length === 0
    ? readDshWebReleaseIndex({home: selected.home, workspace: selected.workspace,
      manifest_id: manifest.manifest_id,
      gateway_head_digest: store.inspect().head_event_digest}) : null;
  const resumeSessionIds = selected.resumeSessions.length > 0
    ? selected.resumeSessions : releaseIndex?.session_ids ?? [];
  let activeCtx;
  let hostSnapshot;
  const agentAuthority = {};
  const expectedFingerprints = {
    manifest_id: manifest.manifest_id,
    material_digest: manifest.material_digest,
    package_set_sha256: manifest.installed_package_set.package_set_sha256,
    roots: manifest.preset.roots,
    default_id: manifest.preset.default_id,
    composition_selector: compositionSelector,
    composition_sha256: manifest.preset.composition_sha256,
  };
  const snapshot = ({agent, other_agents = []}) => collectDshGraphSnapshot({ctx: activeCtx,
    agent, other_agents, standing_mount_for: standingMountFor,
    preset_root_path: presetRoot, preset_root_selector: "config/presets",
    composition_selector: compositionSelector,
    composition_sha256: sha256(readFileSync(compositionPath))});
  const graph = createDshGraphEpochController({source_pin_index: sourcePinIndex,
    manifest_id: manifest.manifest_id, material_digest: manifest.material_digest,
    package_set_sha256: manifest.installed_package_set.package_set_sha256,
    source_pin_count: manifest.source_pins.length, expected_fingerprints: expectedFingerprints,
    agent_construction_authority: agentAuthority,
    fingerprint_provider: () => ({...expectedFingerprints,
      roots: activeCtx.agentPresets.roots.map((root) => ({
        selector: root.path === presetRoot ? "config/presets" : "unrecognized-root", trust: root.trust})),
      default_id: activeCtx.agentPresets.defaultId,
      composition_sha256: sha256(readFileSync(compositionPath))}),
    qualification_observer: async (ctx) => {
      activeCtx = ctx;
      hostSnapshot = snapshot({agent: undefined});
      return compareDshHostQualification(manifest, hostSnapshot.value);
    }});
  owner = createDshWebHostOwner({graph, session_store: store,
    consumer_id: "dsh:web-host", workspace_path: selected.workspace,
    standing_mount_for: standingMountFor, observe_graph: snapshot,
    manifest, agent_construction_authority: agentAuthority,
    prepare_web_prompt: (request) => store.prepare(request)});
    await writeFile(presetPatch, renderDshRestrictedProfileOverlay(presetRoot), {mode: 0o600});
    await writeFile(controllerPatch, renderDshQualifiedWebOverlay(
      join(adapterRoot, "src/qualified-web-controller.mjs"),
      join(adapterRoot, "src/qualified-web-workspace-controller.mjs"),
      join(adapterRoot, "web-outcomes-plugin/lib/index.mjs"),
      join(adapterRoot, "web-client-bridges/session-controller/index.mjs"),
      join(adapterRoot, "web-client-bridges/workspace-controller/index.mjs")), {mode: 0o600});
    process.env.DSH_HOME = selected.home;
    process.env.DSH_TELEMETRY_DISABLED = "1";
    process.argv[1] = join(dshRoot, "lib/bin.js");
    process.stderr.write(`${JSON.stringify({schema_version: "are.dsh-web-host-startup/v1",
      phase: "starting-restricted-host", authority_effect: "none"})}\n`);
    const nativeSignalListenersBefore = new Map(["SIGINT", "SIGTERM"].map(signal =>
      [signal, new Set(process.listeners(signal))]));
    host = await runProfile({environment: loadLayeredEnv("dsh"), profile: "web",
      patchFiles: [presetPatch, controllerPatch, join(adapterRoot, "config/read-only.patch.yml")],
      args: ["--no-open", "--port", "0"], graphControl: graph,
      hostPrepare: (ctx) => owner.hostPrepare(ctx)});
    // The pinned runProfile installs a force-exit signal controller. This
    // standalone owner must finish its gateway release before invoking that
    // controller's disposer, so take over only the exact newly added handlers.
    const nativeSignalListeners = new Map(["SIGINT", "SIGTERM"].map(signal =>
      [signal, process.listeners(signal).filter(listener =>
        !nativeSignalListenersBefore.get(signal).has(listener))]));
    if ([...nativeSignalListeners.values()].some(listeners => listeners.length !== 1)) {
      throw new Error("dsh-web-host.native-signal-ownership-unverified");
    }
    for (const [signal, listeners] of nativeSignalListeners) {
      process.removeListener(signal, listeners[0]);
    }
    if (selected.observationSocket !== null || selected.observationTcpPort !== null) {
      observationServer = await createDshWebAdapterObservationServer({
        path: selected.observationSocket,
        tcp_port: selected.observationTcpPort,
        token: process.env.ARE_ADAPTER_OBSERVATION_TOKEN,
        recover_stale: selected.observationSocket !== null,
        observe: () => {
          store.inspect();
          const session = store.getSession("dsh:web-host");
          const observations = session?.host_observations ?? [];
          return projectDshWebAdapterObservation({runtime_epoch_id: observationEpoch,
            gateway_healthy: true, host_running: serving
              && graph.qualificationReceipt()?.state === "qualified",
            faulted: store.hasFaultedSession(),
            quarantined: store.hasIncompleteHistoryAudit(),
            dsh_web_activity: projectDshWebActivity({agent_records: owner.liveAgentsSnapshot()
              .map(agent => ({agent, ...owner.inspect(agent)}))
              .sort((left, right) => left.thread_ref.localeCompare(right.thread_ref))
              .map((record, index) => ({...record,
                ...(index < 16 ? {are_plan_head: owner.planHeadForObservation(record.agent)} : {}),
                native_turn_state: observedNativeTurnState(record.agent.session?.snapshotEvents?.())})),
            host_observations: observations})});
        },
      });
    }
    const {workspaceId} = await owner.ensureWorkspace();
    const resumedSessionIds = [];
    for (const sessionId of resumeSessionIds) {
      const resumed = await owner.resumeReleasedSession(sessionId);
      if (resumed.sessionId !== sessionId) throw new Error("dsh-web-host.resume-session-mismatch");
      resumedSessionIds.push(sessionId);
    }
    output.write(`${JSON.stringify({schema_version: "are.dsh-web-host-ready/v1", ok: true,
      profile: "restricted-host-owned", graph_state: graph.qualificationReceipt().state,
      workspace: selected.workspace, workspace_id: workspaceId,
      resumed_session_ids: resumedSessionIds,
      resume_source: selected.resumeSessions.length > 0 ? "explicit"
        : releaseIndex ? "release-index" : "none",
      current_desktop_task_control: false,
      adapter_observation: selected.observationTcpPort !== null
        ? "loopback-tcp-development" : observationServer ? "private-local-socket" : "disabled",
      observation_endpoint: observationServer?.endpoint ?? null,
      authority_effect: "none"})}\n`);
    serving = true;
    await new Promise(resolveSignal => {
      process.once("SIGINT", resolveSignal);
      process.once("SIGTERM", resolveSignal);
    });
    return 0;
  } finally { await stop(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.exitCode = await runDshWebHost(parseDshWebHostArgs(process.argv.slice(2))); }
  catch (error) {
    process.stderr.write(`${JSON.stringify({schema_version: "are.dsh-web-host-start-failure/v1",
      ok: false, reason: error?.message ?? "dsh-web-host.failed", authority_effect: "none"})}\n`);
    process.exitCode = 1;
  }
}
