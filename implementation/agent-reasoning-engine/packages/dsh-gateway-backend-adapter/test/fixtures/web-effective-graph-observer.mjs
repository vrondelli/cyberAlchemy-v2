import {createRequire} from "node:module";
import {dirname, join} from "node:path";
import {pathToFileURL} from "node:url";

const SCHEMA = "are.dsh-effective-graph-observer/v1";
const require = createRequire(import.meta.url);
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

if (typeof process.send !== "function") {
  throw new Error("dsh-effective-graph-observer.ipc-required");
}

process.argv[1] = join(dshRoot, "lib/bin.js");

let host;
let stopAgentListener;
let unexpectedFiber;
let createdAgent;
let agentCount = 0;
let baselineFibers;
let disposed = false;
let phase = "booting";
const requestKeys = new Set();

function send(message) {
  if (typeof process.send === "function" && process.connected) {
    process.send({schema_version: SCHEMA, ...message});
  }
}

function runtimeRows(ctx) {
  const rows = [];
  for (const runtime of ctx.registry.values()) {
    for (const fiber of runtime.fibers) {
      if (fiber.uid !== null && fiber.state === 2) rows.push({fiber, runtime});
    }
  }
  return rows;
}

function entryRows(tree, label) {
  const rows = [...tree.entries()];
  const ids = new Set();
  for (const entry of rows) {
    if (ids.has(entry.id)) throw new Error(`dsh-effective-graph-observer.duplicate-${label}-entry`);
    ids.add(entry.id);
  }
  return rows;
}

function primaryFiber(entry, active) {
  if (entry.fiber === undefined) return undefined;
  const unwrapped = Object.getPrototypeOf(entry.fiber);
  if (unwrapped !== null && typeof unwrapped === "object" && active.has(unwrapped)) return unwrapped;
  if (active.has(entry.fiber)) return undefined;
  throw new Error("dsh-effective-graph-observer.entry-fiber-identity-invalid");
}

function loaderServiceFiber(ctx) {
  const implementations = [];
  for (const key of Object.getOwnPropertySymbols(ctx.reflect.store)) {
    const implementation = ctx.reflect.store[key];
    if (implementation?.name === "loader") implementations.push(implementation);
  }
  if (implementations.length !== 1 || !implementations[0].fiber) {
    throw new Error("dsh-effective-graph-observer.loader-service-owner-ambiguous");
  }
  return implementations[0].fiber;
}

function classify(ctx, agent) {
  const activeRows = runtimeRows(ctx);
  const active = new Set(activeRows.map(({fiber}) => fiber));
  const hostEntries = entryRows(ctx.loader, "host");
  const hostEntrySet = new Set(hostEntries);
  const hostPrimary = new Map();
  for (const entry of hostEntries) {
    const fiber = primaryFiber(entry, active);
    if (fiber === undefined) continue;
    if (hostPrimary.has(fiber)) throw new Error("dsh-effective-graph-observer.host-primary-duplicate");
    hostPrimary.set(fiber, entry);
  }

  const mount = agent === undefined ? undefined : standingMountFor(agent.ctx);
  const presetEntries = mount === undefined ? [] : entryRows(mount.tree, "preset");
  const presetEntrySet = new Set(presetEntries);
  const presetPrimary = new Map();
  for (const entry of presetEntries) {
    const fiber = primaryFiber(entry, active);
    if (fiber === undefined) continue;
    if (presetPrimary.has(fiber)) throw new Error("dsh-effective-graph-observer.preset-primary-duplicate");
    presetPrimary.set(fiber, entry);
  }

  const loaderFiber = loaderServiceFiber(ctx);
  if (!active.has(loaderFiber) || loaderFiber.entry !== undefined) {
    throw new Error("dsh-effective-graph-observer.loader-bootstrap-invalid");
  }
  const isolateRows = activeRows.filter(({fiber, runtime}) =>
    fiber !== loaderFiber
    && fiber.entry === undefined
    && fiber.parent?.fiber === loaderFiber
    && runtime.name === "isolate");
  if (isolateRows.length !== 1) {
    throw new Error("dsh-effective-graph-observer.isolate-bootstrap-ambiguous");
  }
  const isolateFiber = isolateRows[0].fiber;

  const counts = {
    "host-primary": 0,
    "host-nested": 0,
    "preset-primary": 0,
    "preset-group-primary": 0,
    "preset-nested": 0,
    "bootstrap-loader": 0,
    "bootstrap-isolate": 0,
    unknown: 0,
  };
  const categoryByFiber = new Map();
  const unknown = [];
  for (const {fiber, runtime} of activeRows) {
    let category;
    if (fiber === loaderFiber) category = "bootstrap-loader";
    else if (fiber === isolateFiber) category = "bootstrap-isolate";
    else if (hostPrimary.has(fiber)) category = "host-primary";
    else if (presetPrimary.has(fiber)) {
      category = presetPrimary.get(fiber).options.group
        ? "preset-group-primary"
        : "preset-primary";
    } else if (fiber.entry !== undefined && hostEntrySet.has(fiber.entry)) {
      category = "host-nested";
    } else if (fiber.entry !== undefined && presetEntrySet.has(fiber.entry)) {
      category = "preset-nested";
    } else {
      category = "unknown";
      unknown.push({
        runtime_name: typeof runtime.name === "string" && runtime.name.length > 0
          ? runtime.name
          : "<unnamed>",
        has_entry: fiber.entry !== undefined,
      });
    }
    counts[category] += 1;
    categoryByFiber.set(fiber, category);
  }

  const newCounts = Object.fromEntries(Object.keys(counts).map((key) => [key, 0]));
  if (baselineFibers !== undefined) {
    for (const fiber of active) {
      if (!baselineFibers.has(fiber)) newCounts[categoryByFiber.get(fiber)] += 1;
    }
  }

  const reasonCodes = [];
  if (unknown.some((row) => !row.has_entry)) {
    reasonCodes.push("unknown-no-entry-registration");
  }
  if (unknown.some((row) => row.has_entry)) {
    reasonCodes.push("unknown-entry-registration");
  }

  return {
    ok: unknown.length === 0,
    reason_codes: reasonCodes,
    active_fiber_count: active.size,
    counts,
    new_fiber_count: baselineFibers === undefined
      ? null
      : [...active].filter((fiber) => !baselineFibers.has(fiber)).length,
    new_counts: baselineFibers === undefined ? null : newCounts,
    unknown,
    agent: mount === undefined ? null : {
      count: agentCount,
      preset_id: mount.presetId,
      mounted_entry_count: presetEntries.length,
      non_group_count: presetEntries.filter((entry) => !entry.options.group).length,
      group_count: presetEntries.filter((entry) => entry.options.group).length,
    },
    active,
  };
}

function publicObservation(observation) {
  const {active, ...value} = observation;
  void active;
  return value;
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
    throw new Error("dsh-effective-graph-observer.request-invalid");
  }
  if (requestKeys.has(message.request_key)) {
    throw new Error("dsh-effective-graph-observer.request-replayed");
  }
  requestKeys.add(message.request_key);

  if (message.command === "snapshot-before") {
    if (phase !== "ready" || agentCount !== 0 || unexpectedFiber !== undefined) {
      throw new Error("dsh-effective-graph-observer.before-phase-invalid");
    }
    const observation = classify(host.ctx, undefined);
    baselineFibers = new Set(observation.active);
    phase = "observed-before";
    return publicObservation(observation);
  }
  if (message.command === "snapshot-after") {
    if (phase !== "observed-before" || agentCount !== 1 || createdAgent === undefined) {
      throw new Error("dsh-effective-graph-observer.after-phase-invalid");
    }
    const observation = classify(host.ctx, createdAgent);
    phase = "observed-after";
    return publicObservation(observation);
  }
  if (message.command === "inject-unknown") {
    if (phase !== "observed-before" || agentCount !== 0 || unexpectedFiber !== undefined) {
      throw new Error("dsh-effective-graph-observer.inject-phase-invalid");
    }
    function areUnexpectedDirectRegistration() {}
    unexpectedFiber = host.ctx.root.plugin(areUnexpectedDirectRegistration);
    await unexpectedFiber;
    const observation = classify(host.ctx, undefined);
    phase = "observed-unknown";
    return publicObservation(observation);
  }
  if (message.command === "dispose") {
    await disposeHost();
    return {ok: true, reason_codes: []};
  }
  throw new Error("dsh-effective-graph-observer.command-unknown");
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
      send({
        kind: "response",
        request_key: message?.request_key ?? null,
        result: {
          ok: false,
          reason_codes: [error instanceof Error ? error.message : "dsh-effective-graph-observer.failed"],
        },
      });
    }
  });
}

try {
  host = await runProfile({
    environment: loadLayeredEnv("dsh"),
    profile: "web",
    patchFiles: [],
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
  send({
    kind: "fatal",
    reason_code: error instanceof Error ? error.message : "dsh-effective-graph-observer.boot-failed",
  });
  await disposeHost().catch(() => {});
  process.exitCode = 1;
}
