// Launch contract for the development-only, observation-only Windows Companion.
import {existsSync, realpathSync, statSync} from "node:fs";
import {basename, dirname, join} from "node:path";

const readOnlyFields = Object.freeze({
  model_entry_boundary: "not-verified",
  hosted_effects_status: "disabled",
  model_wire_guard_status: "disabled",
  guarded_user_input_status: "disabled",
  managed_gateway_turn_ingress_blocked_reason: null,
});

export function assertReadOnlyWslReady(record, endpoint) {
  if (record?.ok !== true || record.observation_endpoint !== endpoint
    || record.current_desktop_task_control !== false
    || typeof record.backend_adapter_id !== "string" || record.backend_adapter_id.length === 0
    || Object.entries(readOnlyFields).some(([key, value]) => record[key] !== value)) {
    throw new Error("cross-os-windows.wsl-binding-mismatch");
  }
}

export function assertReadOnlyObserverReady(record, backendAdapterId) {
  if (record?.schema_version !== "are.adapter-observation/v1"
    || record.source !== "gateway-in-process" || record.authority_effect !== "none"
    || typeof record.runtime_epoch_id !== "string" || !record.runtime_epoch_id
    || record.selected_backend_adapter_id !== backendAdapterId
    || record.gateway?.status !== "running"
    || record.selected_path?.status !== "ready"
    || record.host_task_control?.status !== "unverified") {
    throw new Error("cross-os-windows.observer-binding-mismatch");
  }
}

export function wslEvolutionRootToWindowsUnc(distro, root) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(distro)
    || typeof root !== "string" || !root.startsWith("/") || root === "/"
    || root.split("/").slice(1).some(segment => !segment || segment === "." || segment === ".."
      || /[\\\0:*?"<>|]/.test(segment))) {
    throw new Error("cross-os-windows.evolution-root-invalid");
  }
  return `\\\\wsl.localhost\\${distro}${root.replaceAll("/", "\\")}`;
}

export function assertReadOnlyEvolutionReady(record) {
  if (record?.schema_version !== "are.evolution-observation/v1"
    || record.source !== "durable-ledger-and-candidate-registry"
    || record.root_status !== "present" || record.evidence_status !== "verified"
    || record.authority_effect !== "none"
    || !Number.isSafeInteger(record.cycle_count) || record.cycle_count < 0
    || !Number.isSafeInteger(record.commit_count) || record.commit_count < 0
    || !/^[a-f0-9]{64}$/.test(record.projection_digest ?? "")
    || !Number.isSafeInteger(record.observed_at_unix_ms)
    || Math.abs(Date.now() - record.observed_at_unix_ms) > 15_000) {
    throw new Error("cross-os-windows.evolution-binding-mismatch");
  }
}

export function readOnlyCompanionEnvironment(base, {node, entry, endpoint, token, evolutionRoot = null}) {
  const env = {...base};
  const managedKeys = new Set(["ARE_COMPANION_NODE", "ARE_COMPANION_ENTRY", "ARE_COMPANION_OBSERVATION_SOCKET",
    "ARE_ADAPTER_OBSERVATION_TOKEN", "ARE_COMPANION_HOSTED_REJOIN_URL",
    "ARE_HOSTED_REJOIN_OBSERVATION_TOKEN", "ARE_COMPANION_GUARDED_PLAN_INPUT",
    "ARE_MANAGED_MODEL_ENTRY_BOUNDARY", "ARE_MANAGED_CLIENT_TURN_INGRESS",
    "ARE_COMPANION_EVOLUTION_ROOT", "ARE_COMPANION_EVOLUTION_SIGNAL_LOG"]);
  // Windows environment names are case-insensitive, even when the copied JS object is not.
  for (const key of Object.keys(env)) if (managedKeys.has(key.toUpperCase())) delete env[key];
  Object.assign(env, {ARE_COMPANION_NODE: node, ARE_COMPANION_ENTRY: entry,
    ARE_COMPANION_OBSERVATION_SOCKET: endpoint, ARE_ADAPTER_OBSERVATION_TOKEN: token});
  if (evolutionRoot !== null) {
    const match = typeof evolutionRoot === "string"
      ? /^\\\\wsl\.localhost\\([A-Za-z0-9][A-Za-z0-9._-]{0,63})(\\.+)$/.exec(evolutionRoot) : null;
    if (!match || wslEvolutionRootToWindowsUnc(match[1], match[2].replaceAll("\\", "/")) !== evolutionRoot) {
      throw new Error("cross-os-windows.evolution-root-invalid");
    }
    env.ARE_COMPANION_EVOLUTION_ROOT = evolutionRoot;
  }
  return env;
}

export function selectCompanionLaunch(companionExe) {
  const direct = {command: companionExe, args: [], mode: "direct"};
  if (basename(companionExe).toLowerCase() !== "are-companion.exe") return direct;
  const orb = join(dirname(companionExe), "native-orb", "are-native-orb.exe");
  if (!existsSync(orb)) return direct;
  if (!statSync(orb).isFile()) throw new Error("cross-os-windows.native-orb-invalid");
  return {command: realpathSync(orb), args: ["--dashboard", companionExe], mode: "native-orb"};
}

export function waitForOwnedChildExit(child, reason) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve(reason);
  return new Promise(resolveExit => {
    const finished = () => {
      child.off("exit", finished);
      child.off("error", finished);
      resolveExit(reason);
    };
    child.once("exit", finished);
    child.once("error", finished);
  });
}
