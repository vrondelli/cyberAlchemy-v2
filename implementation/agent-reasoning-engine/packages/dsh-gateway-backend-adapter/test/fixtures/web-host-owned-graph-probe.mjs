import {createRequire} from "node:module";
import {appendFile, chmod, cp, readFile, stat, writeFile} from "node:fs/promises";
import {readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

import {createFileGatewaySessionStore}
  from "../../../codex-app-server-wrapper/src/gateway-session-store.mjs";
import {digestValue} from "../../../codex-app-server-wrapper/src/canonical.mjs";
import {verifyReasoningStateLog} from "../../../reasoning-state-runtime/index.mjs";
import {createDshGraphEpochController} from "../../src/dsh-graph-epoch.mjs";
import {buildDshSourcePinIndex, canonicalJson, collectDshGraphSnapshot,
  compareDshHostQualification, loadDshGraphManifest,
  renderDshQualifiedWebOverlay, renderDshRestrictedProfileOverlay, sha256,
  verifyDshGraphManifest} from "../../src/dsh-graph-manifest.mjs";
import {createDshWebHostOwner} from "../../src/web-host-owner.mjs";
import {createDshWebGatewayJournalWorker}
  from "../../src/web-gateway-journal-worker.mjs";
import {validModelContextSizeDiagnostic} from "../../src/web-model-context-batch.mjs";
import {createDshWebAdapterObservationServer, observedNativeTurnState,
  projectDshWebActivity, projectDshWebAdapterObservation}
  from "../../src/web-adapter-observation.mjs";
import {createDshWebPreparationWorker, prepareAreRepositoryWebPrompt}
  from "../../src/web-prompt-permit.mjs";

const SCHEMA = "are.dsh-host-owned-graph-probe/v1";
const require = createRequire(import.meta.url);
const adapterRoot = fileURLToPath(new URL("../../", import.meta.url));
const dshPackage = require.resolve("@deepseek-ai/dsh/package.json");
const dshRoot = dirname(dshPackage);
const dshRequire = createRequire(dshPackage);
const [{runProfile}, {loadLayeredEnv}, {standingMountFor}, {createUserMessage}, {Session}] = await Promise.all([
  import(pathToFileURL(join(dshRoot, "lib/profile-boot-BP_C0vpU.js")).href),
  import(pathToFileURL(dshRequire.resolve("@deepseek-ai/dsh-app-boot")).href),
  import(pathToFileURL(dshRequire.resolve("@deepseek-ai/dsh-agent-presets")).href),
  import(pathToFileURL(dshRequire.resolve("@deepseek-ai/dsh-llm")).href),
  import(pathToFileURL(dshRequire.resolve("@deepseek-ai/dsh-session")).href),
]);

if (typeof process.send !== "function" || !process.env.DSH_HOME) {
  throw new Error("dsh-web-host-probe.ipc-and-home-required");
}
const home = process.env.DSH_HOME;
if (!(await stat(home)).isDirectory()) throw new Error("dsh-web-host-probe.home-invalid");
await chmod(home, 0o700);
const manifestPath = process.env.ARE_DSH_HOST_MANIFEST
  ?? join(adapterRoot, "config/dsh-web-are-read-only-graph-manifest.v1.json");
const discovery = process.env.ARE_DSH_HOST_DISCOVERY === "1";
const manifest = await loadDshGraphManifest(manifestPath);
const roots = {adapter_root: adapterRoot, dsh_package_json: dshPackage,
  node_modules_root: join(adapterRoot, "node_modules")};
const verified = await verifyDshGraphManifest(manifest, {roots});
if (!verified.ok) throw new Error(`dsh-web-host-probe.manifest:${verified.reason_codes.join("+")}`);
const sourcePinIndex = await buildDshSourcePinIndex(manifest, roots);
const sourcePresetRoot = join(adapterRoot, "config/presets");
const mutablePreset = process.env.ARE_DSH_MUTABLE_PRESET === "1";
const presetRoot = mutablePreset ? join(home, "disposable-presets") : sourcePresetRoot;
const compositionSelector = "config/presets/are-read-only/agent.cordis.yml";
const compositionPath = join(presetRoot, "are-read-only/agent.cordis.yml");
if (mutablePreset) {
  await cp(sourcePresetRoot, presetRoot, {recursive: true});
  if (sha256(await readFile(compositionPath)) !== manifest.preset.composition_sha256) {
    throw new Error("dsh-web-host-probe.disposable-preset-source-mismatch");
  }
}
const presetPatch = join(home, "host-preset.patch.yml");
const controllerPatch = join(home, "host-controller.patch.yml");
const unknownHostPatch = join(home, "unknown-host.patch.yml");
const controllerPath = join(adapterRoot, "src/qualified-web-controller.mjs");
const canaryPatch = join(adapterRoot, "test/canary-provider.patch.yml");
const effectivePresetRoot = process.env.ARE_DSH_WRONG_ROOT === "1"
  ? join(home, "wrong-presets") : presetRoot;
await writeFile(presetPatch, renderDshRestrictedProfileOverlay(effectivePresetRoot), {mode: 0o600});
const workspaceControllerPath = join(adapterRoot, "src/qualified-web-workspace-controller.mjs");
await writeFile(controllerPatch,
  renderDshQualifiedWebOverlay(controllerPath, workspaceControllerPath,
    join(adapterRoot, "web-outcomes-plugin/lib/index.mjs"),
    join(adapterRoot, "web-client-bridges/session-controller/index.mjs"),
    join(adapterRoot, "web-client-bridges/workspace-controller/index.mjs")), {mode: 0o600});
if (process.env.ARE_DSH_UNKNOWN_HOST === "1") {
  await writeFile(unknownHostPatch,
    "- insert:\n    - id: are-unreviewed-host\n      name: '@deepseek-ai/dsh-tool-ask-user'\n", {mode: 0o600});
}
const store = process.env.ARE_DSH_USE_JOURNAL_WORKER === "1"
  ? await createDshWebGatewayJournalWorker({path: join(home, "gateway.jsonl"),
    store_id: "are-gateway-sessions:file",
    plan_selection: JSON.parse(process.env.ARE_DSH_TEST_PLAN_SELECTION ?? "null")})
  : createFileGatewaySessionStore({path: join(home, "gateway.jsonl")});
const agentAuthority = {};
let host;
let activeCtx;
let hostSnapshot;
let disposed = false;
let observationServer;
let releasePreparation;
const disposedSessions = new Map();
const disposedAgents = new Map();
const expectedFingerprints = {
  manifest_id: manifest.manifest_id,
  material_digest: manifest.material_digest,
  package_set_sha256: manifest.installed_package_set.package_set_sha256,
  roots: manifest.preset.roots,
  default_id: manifest.preset.default_id,
  composition_selector: compositionSelector,
  composition_sha256: manifest.preset.composition_sha256,
};

function snapshot({agent, other_agents = []}) {
  return collectDshGraphSnapshot({ctx: activeCtx, agent, other_agents,
    standing_mount_for: standingMountFor,
    preset_root_path: presetRoot, preset_root_selector: "config/presets",
    composition_selector: compositionSelector,
    composition_sha256: sha256(readFileSync(compositionPath))});
}

const graph = createDshGraphEpochController({
  source_pin_index: sourcePinIndex,
  manifest_id: manifest.manifest_id,
  material_digest: manifest.material_digest,
  package_set_sha256: manifest.installed_package_set.package_set_sha256,
  source_pin_count: manifest.source_pins.length,
  expected_fingerprints: expectedFingerprints,
  agent_construction_authority: agentAuthority,
  fingerprint_provider: () => ({
    ...expectedFingerprints,
    roots: activeCtx.agentPresets.roots.map((root) => ({
      selector: root.path === presetRoot ? "config/presets" : "unrecognized-root",
      trust: root.trust,
    })),
    default_id: activeCtx.agentPresets.defaultId,
    composition_sha256: sha256(readFileSync(compositionPath)),
  }),
  qualification_observer: async (ctx) => {
    activeCtx = ctx;
    hostSnapshot = snapshot({agent: undefined});
    return discovery
      ? {ok: true, host_graph_digest: sha256(canonicalJson(hostSnapshot.value))}
      : compareDshHostQualification(manifest, hostSnapshot.value);
  },
});
const preparationWorker = process.env.ARE_DSH_USE_PREPARATION_WORKER === "1"
  ? await createDshWebPreparationWorker() : null;
const owner = createDshWebHostOwner({graph, session_store: store,
  consumer_id: "dsh:web-host-probe", workspace_path: home,
  standing_mount_for: standingMountFor, observe_graph: snapshot,
  manifest, agent_construction_authority: agentAuthority,
  ...(process.env.ARE_DSH_DROP_PROMPT_ACK === "1" ? {after_native_prompt: (accepted) => {
    if (accepted?.accepted === true) throw new Error("dsh-web.fixture-ack-lost");
  }} : {}),
  ...(process.env.ARE_DSH_DROP_CANCEL_ACK === "1" ? {after_native_cancel: (accepted) => {
    if (accepted?.accepted === true) throw new Error("dsh-web.fixture-cancel-ack-lost");
  }} : {}),
  ...(process.env.ARE_DSH_FAIL_PREPARATION === "1" ? {prepare_web_prompt: async () => {
    throw new Error("dsh-web.fixture-preparation-outage");
  }} : process.env.ARE_DSH_HOLD_PREPARATION === "1" ? {prepare_web_prompt: async (input) => {
    await new Promise((resolve) => {
      releasePreparation = resolve;
      send({kind: "preparation-paused", request_id: input.request_id});
    });
    return process.env.ARE_DSH_USE_JOURNAL_WORKER === "1"
      ? store.prepare(input) : prepareAreRepositoryWebPrompt(input);
  }} : process.env.ARE_DSH_USE_JOURNAL_WORKER === "1"
    ? {prepare_web_prompt: async (input) => {
      try { return await store.prepare(input); }
      catch (error) {
        // Test-only numeric diagnostics: never serialize prompt/source content.
        if (validModelContextSizeDiagnostic(error?.size_diagnostic)) {
          process.stderr.write(`${JSON.stringify(error.size_diagnostic)}\n`);
        }
        throw error;
      }
    }}
    : preparationWorker ? {prepare_web_prompt: (input) => preparationWorker.prepare(input)} : {})});

function send(message) {
  if (process.connected) process.send({schema_version: SCHEMA, ...message});
}

async function dispose() {
  if (disposed) return;
  disposed = true;
  try { await host?.shutdown.shutdown(0); }
  finally {
    try { await observationServer?.close(); await preparationWorker?.close(); }
    finally { await store.close(); }
  }
}

try {
  process.argv[1] = join(dshRoot, "lib/bin.js");
  host = await runProfile({environment: loadLayeredEnv("dsh"), profile: "web",
    patchFiles: [presetPatch, controllerPatch,
      ...(process.env.ARE_DSH_UNKNOWN_HOST === "1" ? [unknownHostPatch] : []),
      ...(manifest.profile_id === "dsh-web-are-host-owned-canary" ? [canaryPatch] : []),
      join(adapterRoot, "config/read-only.patch.yml")],
    args: ["--no-open", "--port", "0"], graphControl: graph,
    hostPrepare: (ctx) => owner.hostPrepare(ctx)});
  const {workspaceId} = await owner.ensureWorkspace();
  if (process.env.ARE_DSH_TEST_OBSERVATION === "1") {
    observationServer = await createDshWebAdapterObservationServer({
      ...(process.env.ARE_TEST_WINDOWS_DSH_PREPARED_UI_EXE
        ? {tcp_port: 0} : {path: join(home, "native-turn-observer.sock"), recover_stale: true}),
      token: process.env.ARE_ADAPTER_OBSERVATION_TOKEN,
      observe: () => {
        store.inspect();
        return projectDshWebAdapterObservation({
          runtime_epoch_id: `dsh-native-turn-fixture:${process.pid}`,
          gateway_healthy: true, host_running: !disposed,
          faulted: store.hasFaultedSession(),
          quarantined: store.hasIncompleteHistoryAudit(),
          dsh_web_activity: projectDshWebActivity({
            agent_records: owner.liveAgentsSnapshot().map(agent => ({agent, ...owner.inspect(agent)}))
              .sort((left, right) => left.thread_ref.localeCompare(right.thread_ref))
              .map((record, index) => ({...record,
              ...(index < 16 ? {are_plan_head: owner.planHeadForObservation(record.agent)} : {}),
              native_turn_state: observedNativeTurnState(record.agent.session.snapshotEvents()),
            })),
            host_observations: store.getSession("dsh:web-host-probe")?.host_observations ?? [],
          }),
        });
      },
    });
  }
  send({kind: "ready", discovery, workspace_id: workspaceId,
    receipt: graph.qualificationReceipt(),
    ...(observationServer ? {observation_endpoint: observationServer.endpoint} : {}),
    host_observation: hostSnapshot.value});
  process.on("message", (message) => {
    Promise.resolve().then(async () => {
      if (message?.schema_version !== SCHEMA || !message.request_key) {
        throw new Error("dsh-web-host-probe.request-invalid");
      }
      if (message.command === "create") {
        const controller = host.ctx.get("sessionController");
        if (!controller) throw new Error("dsh-web-host-probe.controller-missing");
        const created = await controller.create(message.request ?? {});
        const agent = host.ctx.agents.get(created.sessionId);
        return {created, binding: owner.inspect(agent), graph: graph.snapshot(),
          observation: snapshot({agent, other_agents: []}).value};
      }
      if (message.command === "session-state") {
        const agent = host.ctx.agents.get(message.session_id);
        const session = agent?.session ?? disposedSessions.get(message.session_id);
        if (!session) throw new Error("dsh-web-host-probe.session-missing");
        const events = session.snapshotEvents();
        if (events.some((event) => event.type === "turn/end")) {
          await owner.waitTerminalObservations();
        }
        const gateway = store.getSession("dsh:web-host-probe");
        const objectiveLog = process.env.ARE_DSH_USE_JOURNAL_WORKER === "1"
          ? verifyReasoningStateLog(join(home, "gateway.jsonl.objectives.jsonl")) : null;
        if (objectiveLog && !objectiveLog.ok) throw new Error("dsh-web-host-probe.objective-log-invalid");
        return {event_count: events.length, native_turn_state: observedNativeTurnState(events),
          ...(objectiveLog ? {objective_interpretation_count: objectiveLog.value.records.filter(record =>
            record.record_kind === "reasoning-state-event" && record.value.event_kind === "objective-transition-resolved").length,
          objective_preflight_count: objectiveLog.value.records.filter(record =>
            record.record_kind === "reasoning-state-event" && record.value.event_kind === "dsh-owned-preflight-prepared").length} : {}),
          pending_queue_item_ids: agent?.inbox.nextTurn.map((item) => item.id) ?? [],
          pending_next_step_item_ids: agent?.inbox.nextStep.map((item) => item.id) ?? [],
          user_message_count: events.filter((event) => event.type === "user/message").length,
          model_request_count: events.filter((event) => event.type === "model/request").length,
          turn_end_count: events.filter((event) => event.type === "turn/end").length,
          model_tool_names: agent?.ctx.tools.schemas(agent).map((tool) => tool.name).sort() ?? [],
          binding: agent ? owner.inspect(agent) : null, graph: graph.snapshot(),
          prompt_requests: gateway.requests.filter((request) => request.method === "dsh/web-prompt"),
          cancel_requests: gateway.requests.filter((request) => request.method === "dsh/web-cancel"),
          queue_remove_requests: gateway.requests.filter((request) =>
            request.method === "dsh/web-queue-remove"),
          queue_edit_requests: gateway.requests.filter((request) =>
            request.method === "dsh/web-queue-edit"),
          queue_steer_requests: gateway.requests.filter((request) =>
            request.method === "dsh/web-queue-steer"),
          queue_remove_observations: gateway.host_observations.filter((observation) =>
            observation.kind === "dsh-queue-remove-observed"),
          queue_edit_observations: gateway.host_observations.filter((observation) =>
            observation.kind === "dsh-queue-edit-observed"),
          queue_steer_observations: gateway.host_observations.filter((observation) =>
            observation.kind === "dsh-queue-steer-observed"),
          model_entry_observations: gateway.host_observations.filter((observation) =>
            observation.kind === "dsh-model-entry-intent"),
          preparation_observations: gateway.host_observations.filter((observation) =>
            observation.kind === "dsh-are-preparation-observed"),
          interpretation_observations: gateway.host_observations.filter((observation) =>
            observation.kind === "dsh-objective-interpretation-observed"),
          terminal_observations: gateway.host_observations
            .filter((observation) => observation.kind === "dsh-turn-terminal-observed")};
      }
      if (message.command === "alternate-writer-services") {
        return {subagents: host.ctx.get("subagents") !== undefined,
          dynamic_cordis_runner: host.ctx.get("dynamicCordisRunner") !== undefined,
          graph: graph.snapshot()};
      }
      if (message.command === "follow-snapshot") {
        const controller = host.ctx.get("sessionController");
        const abort = new AbortController();
        const stream = controller.follow({address: {kind: "session",
          sessionId: message.session_id}, maxMessages: 50, assistantStream: true}, abort.signal);
        const iterator = stream[Symbol.asyncIterator]();
        try {
          const first = await iterator.next();
          if (first.done) throw new Error("dsh-web-host-probe.follow-empty");
          return first.value;
        } finally {
          abort.abort();
          await iterator.return?.();
        }
      }
      if (message.command === "workspace-baseline") {
        const controller = host.ctx.get("workspaceController");
        if (!controller) throw new Error("dsh-web-host-probe.workspace-controller-missing");
        const abort = new AbortController();
        const iterator = controller.follow(abort.signal)[Symbol.asyncIterator]();
        try {
          const first = await iterator.next();
          if (first.done) throw new Error("dsh-web-host-probe.workspace-follow-empty");
          return first.value;
        } finally {
          abort.abort();
          await iterator.return?.();
        }
      }
      if (message.command === "control-baseline") {
        const controller = host.ctx.get("sessionController");
        const abort = new AbortController();
        const iterator = controller.control(abort.signal)[Symbol.asyncIterator]();
        try {
          const first = await iterator.next();
          if (first.done) throw new Error("dsh-web-host-probe.control-empty");
          return first.value;
        } finally {
          abort.abort();
          await iterator.return?.();
        }
      }
      if (message.command === "follow-visible-reply") {
        const controller = host.ctx.get("sessionController");
        const abort = new AbortController();
        const frames = [];
        const stream = controller.follow({address: {kind: "session",
          sessionId: message.session_id}, maxMessages: 50, assistantStream: true}, abort.signal);
        try {
          for await (const frame of stream) {
            frames.push(frame);
            const records = frame.type === "snapshot" ? frame.records
              : frame.type === "event" ? [frame] : [];
            if (records.some((record) => record.event?.type === "assistant/message")) break;
            if (frames.length > 512) throw new Error("dsh-web-host-probe.follow-overflow");
          }
          return {frames};
        } finally { abort.abort(); }
      }
      if (message.command === "attempt-alternate-inbox") {
        const agent = host.ctx.agents.get(message.session_id);
        if (!agent) throw new Error("dsh-web-host-probe.agent-missing");
        const before = agent.session.snapshotEvents().length;
        const attempts = {};
        for (const [name, attempt] of [
          ["followup", (input) => agent.followup(input)],
          ["steer", (input) => agent.steer(input)],
          ["splice", (input) => agent.inbox.splice("next-turn", Infinity, 0, [input])],
          ["session-append", (input) => agent.session.append("agent/inbox/spliced", {
            target: "next-turn", start: agent.inbox.nextTurn.length, inserted: [input],
          })],
          ["remove", () => agent.session.append("agent/inbox/spliced", {
            target: "next-turn", start: 0, removedCount: 1, inserted: [],
          })],
        ]) {
          const synthetic = createUserMessage({
            content: [{type: "text", text: `unadmitted ${name} must not dispatch`}],
            source: {kind: "plugin", plugin: "are-alternate-inbox-probe"},
          });
          try { attempt(synthetic); attempts[name] = {rejected: false}; }
          catch (error) { attempts[name] = {rejected: true,
            reason_code: error?.code ?? error?.message}; }
        }
        return {attempts, event_count_before: before,
          event_count_after: agent.session.snapshotEvents().length,
          inbox_count: agent.inbox.nextTurn.length + agent.inbox.nextStep.length,
          graph: graph.snapshot()};
      }
      if (message.command === "dispose-agent") {
        const agent = host.ctx.agents.get(message.session_id);
        if (!agent) throw new Error("dsh-web-host-probe.agent-missing");
        disposedSessions.set(agent.id, agent.session);
        const result = await owner.disposeNativeAgent(agent);
        disposedAgents.set(agent.id, agent);
        return {...result, graph: graph.snapshot()};
      }
      if (message.command === "release-agent") {
        const agent = disposedAgents.get(message.session_id);
        if (!agent) throw new Error("dsh-web-host-probe.disposed-agent-missing");
        return {...await owner.releaseDrainedAgent(agent), graph: graph.snapshot()};
      }
      if (message.command === "resume-agent") {
        const resumed = await owner.resumeReleasedSession(message.session_id);
        return {resumed, binding: owner.inspect(host.ctx.agents.get(message.session_id)),
          graph: graph.snapshot()};
      }
      if (message.command === "append-unowned-marker") {
        const persistence = host.ctx.get("sessionPersistence");
        const handle = await persistence.open(message.session_id, "write");
        try {
          const {events, eventState} = await handle.read(0);
          const restored = Session.fromRestore(message.session_id, events,
            structuredClone(handle.header), handle.inheritedEventCount, eventState);
          const suffix = restored.snapshotEvents(events.length);
          if (suffix.length !== 1 || suffix[0].type !== "session/end-seed") {
            throw new Error("dsh-web-host-probe.marker-not-created");
          }
          await handle.append(suffix);
          return {appended: true, event_count: events.length + suffix.length};
        } finally { await handle.close(); }
      }
      if (message.command === "binding-summary") {
        const session = store.getSession("dsh:web-host-probe");
        return {binding_event_kinds: session?.conversation_binding_events.map((event) => event.kind),
          agent_live: !!host.ctx.agents.get(message.session_id), graph: graph.snapshot()};
      }
      if (message.command === "compact-gateway") {
        return store.compact();
      }
      if (message.command === "inspect-release-cursor") {
        const session = store.getSession("dsh:web-host-probe");
        const observation = session?.host_observations.findLast((item) =>
          item.kind === "dsh-session-release-observed"
          && item.native_session_id_digest === digestValue(message.session_id));
        if (!observation) throw new Error("dsh-web-host-probe.release-cursor-missing");
        const persistence = host.ctx.get("sessionPersistence");
        const handle = await persistence.open(message.session_id, "read");
        try {
          const {events} = await handle.read(0);
          const checks = {count: observation.native_event_count === events.length,
            history: observation.native_history_digest === digestValue(events),
            tail: observation.native_tail_digest === digestValue(events.at(-1) ?? null),
            header: observation.native_header_digest === digestValue(handle.header)};
          const memoryHeader = disposedSessions.get(message.session_id)?.header;
          const headerKeys = [...new Set([...Object.keys(memoryHeader ?? {}),
            ...Object.keys(handle.header ?? {})])].sort();
          return {matched: Object.values(checks).every(Boolean), checks,
            native_event_count: events.length,
            recorded_event_count: observation.native_event_count,
            header_keys: headerKeys,
            header_different_keys: headerKeys.filter((key) =>
              digestValue(memoryHeader?.[key] ?? null) !== digestValue(handle.header?.[key] ?? null)),
            release_observation_digest: observation.observation_digest,
            graph: graph.snapshot()};
        } finally { await handle.close(); }
      }
      if (message.command === "inject-direct-plugin") {
        try { host.ctx.plugin(function areUnexpectedDirectPlugin() {}); }
        catch (error) { return {rejected: true, reason_code: error?.code ?? error?.message,
          graph: graph.snapshot()}; }
        return {rejected: false, graph: graph.snapshot()};
      }
      if (message.command === "change-default") {
        await host.ctx.settings.mutate("agent-presets",
          [{op: "set", path: ["default"], value: "not-the-qualified-preset"}]);
        return {default_id: host.ctx.agentPresets.defaultId, graph: graph.snapshot()};
      }
      if (message.command === "release-preparation") {
        if (!releasePreparation) throw new Error("dsh-web-host-probe.preparation-not-paused");
        const release = releasePreparation;
        releasePreparation = undefined;
        release();
        return {released: true, graph: graph.snapshot()};
      }
      if (message.command === "inject-extra-tool") {
        const agent = host.ctx.agents.get(message.session_id);
        if (!agent) throw new Error("dsh-web-host-probe.agent-missing");
        host.ctx.tools.register({name: "are_fixture_extra", description: "Disposable graph test tool",
          parameters: {type: "object", properties: {}},
          output: {schema: {type: "object", properties: {}}, render: () => "fixture"},
          execute: async () => ({})});
        return {model_tool_names: agent.ctx.tools.schemas(agent).map((tool) => tool.name).sort(),
          graph: graph.snapshot()};
      }
      if (message.command === "edit-preset") {
        if (!mutablePreset) throw new Error("dsh-web-host-probe.mutable-preset-not-enabled");
        await appendFile(compositionPath, "\n# disposable conformance edit\n");
        return {composition_changed: sha256(await readFile(compositionPath))
          !== manifest.preset.composition_sha256, graph: graph.snapshot()};
      }
      if (message.command === "reload-controller") {
        const entry = [...host.ctx.loader.entries()]
          .find((item) => item.id === "include:are-qualified-web-controller");
        if (!entry) throw new Error("dsh-web-host-probe.controller-entry-missing");
        try { await host.ctx.loader.update(entry.id, {}); }
        catch (error) { return {attempt_error: error?.code ?? error?.message,
          graph: graph.snapshot()}; }
        return {graph: graph.snapshot()};
      }
      if (message.command === "remount-preset") {
        const agent = host.ctx.agents.get(message.session_id);
        if (!agent) throw new Error("dsh-web-host-probe.agent-missing");
        try { await host.ctx.agentPresets.recompose(agent.ctx, "are-read-only"); }
        catch (error) { return {attempt_error: error?.code ?? error?.message,
          graph: graph.snapshot()}; }
        return {graph: graph.snapshot()};
      }
      if (message.command === "dispose") {
        await dispose();
        return {disposed: true};
      }
      throw new Error("dsh-web-host-probe.command-unknown");
    }).then((result) => {
      send({kind: "response", request_key: message.request_key, result});
      if (message.command === "dispose") process.disconnect();
    }, (error) => send({kind: "response", request_key: message?.request_key,
      result: {ok: false, reason_code: error?.code ?? error?.message ?? "unknown"}}));
  });
} catch (error) {
  send({kind: "fatal", reason_code: error?.code ?? error?.message ?? "boot-failed"});
  await dispose().catch(() => {});
  process.exitCode = 1;
}
