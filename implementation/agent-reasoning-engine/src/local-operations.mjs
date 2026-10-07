import {createHash, randomUUID} from "node:crypto";
import {chmodSync, copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, statSync, writeFileSync} from "node:fs";
import {basename, dirname, isAbsolute, relative, resolve} from "node:path";

const DIGEST = /^[a-f0-9]{64}$/u;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const confined = (path, root) => {
  const candidate = resolve(path); const fromRoot = relative(resolve(root), candidate);
  return fromRoot !== ".." && !fromRoot.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) && !isAbsolute(fromRoot);
};

export function parseLocalRuntimeConfig(input = {}) {
  const reasons = [];
  if (input.schema_version !== "are.local-runtime-config/v1") reasons.push("runtime.config-version-unsupported");
  if (!isAbsolute(input.state_root ?? "")) reasons.push("runtime.state-root-must-be-absolute");
  const secretReferences = input.secret_references ?? {};
  for (const [name, reference] of Object.entries(secretReferences)) {
    if (!/^[A-Z][A-Z0-9_]*$/u.test(name) || typeof reference !== "string" || !/^env:[A-Z][A-Z0-9_]*$/u.test(reference)) reasons.push(`runtime.secret-reference-invalid:${name}`);
  }
  const childEnvironmentAllowlist = input.child_environment_allowlist ?? [];
  if (!Array.isArray(childEnvironmentAllowlist) || childEnvironmentAllowlist.some((name) => !/^[A-Za-z_][A-Za-z0-9_]*$/u.test(name))) reasons.push("runtime.environment-allowlist-invalid");
  const quotas = input.quotas ?? {};
  for (const name of ["maximum_state_bytes", "maximum_replay_events", "maximum_queue_depth", "maximum_child_processes"]) {
    if (!Number.isSafeInteger(quotas[name]) || quotas[name] < 1) reasons.push(`runtime.quota-invalid:${name}`);
  }
  if (reasons.length) return Object.freeze({ok: false, reason_codes: [...new Set(reasons)].sort(), authority_effect: "none"});
  return Object.freeze({ok: true, value: Object.freeze({schema_version: input.schema_version, state_root: resolve(input.state_root), secret_references: Object.freeze({...secretReferences}), child_environment_allowlist: Object.freeze([...new Set(childEnvironmentAllowlist)].sort()), quotas: Object.freeze({...quotas}), migration_enabled: input.migration_enabled === true, expiry_enabled: input.expiry_enabled === true, authority_effect: "none"}), authority_effect: "none"});
}

export function projectChildEnvironment(config, environment = process.env) {
  const parsed = parseLocalRuntimeConfig(config);
  if (!parsed.ok) return parsed;
  const value = Object.fromEntries(parsed.value.child_environment_allowlist.filter((name) => typeof environment[name] === "string").map((name) => [name, environment[name]]));
  return Object.freeze({ok: true, value: Object.freeze(value), projected_names: Object.keys(value).sort(), secret_values_emitted: false, authority_effect: "none"});
}

export function inspectLocalRuntime({config, stores = []} = {}) {
  const parsed = parseLocalRuntimeConfig(config);
  if (!parsed.ok) return parsed;
  const rootReasons = [];
  try {
    const metadata = lstatSync(parsed.value.state_root);
    if (!metadata.isDirectory() || metadata.isSymbolicLink()) rootReasons.push("runtime.state-root-not-private-directory");
    if ((metadata.mode & 0o077) !== 0) rootReasons.push("runtime.state-root-mode-too-open");
    if (typeof process.getuid === "function" && metadata.uid !== process.getuid()) rootReasons.push("runtime.state-root-owner-mismatch");
  } catch (error) {
    rootReasons.push(`runtime.state-root-unavailable:${error.code ?? error.name}`);
  }
  const observations = stores.map((store) => {
    try {
      const inspected = store.inspect();
      return {store_id: inspected.store_id ?? inspected.ledger_id ?? "unknown", ready: true, durability: inspected.durability ?? "unknown", record_count: inspected.event_count ?? inspected.record_count ?? null, reason_codes: []};
    } catch (error) {
      return {store_id: "unknown", ready: false, durability: "unknown", record_count: null, reason_codes: [`runtime.store-inspection-failed:${error.code ?? error.name}`]};
    }
  });
  const readinessReasons = [...rootReasons, ...observations.flatMap((item) => item.reason_codes)];
  return Object.freeze({schema_version: "are.local-runtime-diagnostic/v1", liveness: "configuration-loaded", readiness: readinessReasons.length ? "not-ready" : "ready", state_root: parsed.value.state_root,
    storage: observations, quotas: parsed.value.quotas, migration_enabled: parsed.value.migration_enabled, expiry_enabled: parsed.value.expiry_enabled,
    secret_reference_names: Object.keys(parsed.value.secret_references).sort(), secret_values_emitted: false, reason_codes: readinessReasons, authority_effect: "none"});
}

function validateStateFiles(stateRoot, files) {
  if (!Array.isArray(files) || files.length === 0) throw new TypeError("At least one state file is required.");
  return [...new Set(files)].sort().map((path) => {
    const absolute = resolve(path);
    if (!confined(absolute, stateRoot) || !existsSync(absolute) || !lstatSync(absolute).isFile()) throw new Error(`runtime.state-file-invalid:${path}`);
    return {absolute, relative: relative(stateRoot, absolute).replaceAll("\\", "/")};
  });
}

export function createLocalStateBackup({state_root, files, destination}) {
  const root = realpathSync(state_root);
  if (!isAbsolute(destination) || existsSync(destination)) throw new Error("runtime.backup-destination-must-be-absent");
  const selected = validateStateFiles(root, files);
  const temporary = `${destination}.${process.pid}.${randomUUID()}.tmp`;
  mkdirSync(temporary, {recursive: false, mode: 0o700});
  const entries = [];
  for (const item of selected) {
    const target = resolve(temporary, "state", item.relative);
    mkdirSync(dirname(target), {recursive: true, mode: 0o700});
    copyFileSync(item.absolute, target);
    chmodSync(target, 0o600);
    const bytes = readFileSync(target);
    entries.push({path: item.relative, bytes: bytes.length, sha256: sha256(bytes)});
  }
  const material = {schema_version: "are.local-state-backup/v1", entries, authority_effect: "none", claim_limit: "Logical local backup only; no physical-erasure or off-host durability claim."};
  const manifest = {...material, manifest_digest: sha256(JSON.stringify(material))};
  writeFileSync(resolve(temporary, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, {mode: 0o600});
  renameSync(temporary, destination);
  return Object.freeze({ok: true, destination, manifest, authority_effect: "none"});
}

export function restoreLocalStateBackup({backup, destination}) {
  if (!isAbsolute(destination)) throw new Error("runtime.restore-destination-must-be-absolute");
  if (existsSync(destination) && readdirSync(destination).length > 0) throw new Error("runtime.restore-destination-not-empty");
  const manifest = JSON.parse(readFileSync(resolve(backup, "manifest.json"), "utf8"));
  const material = {...manifest}; delete material.manifest_digest;
  if (manifest.schema_version !== "are.local-state-backup/v1" || !DIGEST.test(manifest.manifest_digest ?? "") || sha256(JSON.stringify(material)) !== manifest.manifest_digest) throw new Error("runtime.backup-manifest-invalid");
  mkdirSync(destination, {recursive: true, mode: 0o700});
  for (const entry of manifest.entries) {
    const source = resolve(backup, "state", entry.path); const target = resolve(destination, entry.path);
    if (!confined(source, resolve(backup, "state")) || !confined(target, destination)) throw new Error("runtime.backup-path-escape");
    const bytes = readFileSync(source);
    if (bytes.length !== entry.bytes || sha256(bytes) !== entry.sha256) throw new Error(`runtime.backup-entry-drift:${entry.path}`);
    mkdirSync(dirname(target), {recursive: true, mode: 0o700});
    writeFileSync(target, bytes, {mode: 0o600, flag: "wx"});
  }
  return Object.freeze({ok: true, disposition: "restored-to-empty-root", destination, entry_count: manifest.entries.length, manifest_digest: manifest.manifest_digest, authority_effect: "none"});
}
