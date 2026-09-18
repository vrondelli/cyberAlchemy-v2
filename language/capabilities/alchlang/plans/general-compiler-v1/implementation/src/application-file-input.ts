import { closeSync, constants, fstatSync, lstatSync, openSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { TextDecoder } from "node:util";
import { CompilationRejected } from "./model.js";
import { digest } from "./domainspec-profile.js";
import { loadDomainSpecCompiler } from "./domainspec-cli.js";
import { prepareApplicationExecutable } from "./application-executable.js";
import { loadApplicationEvidenceFiles } from "./application-evidence-files.js";
import { validateExactFormalSourceRef, type ExactFormalSourceRef } from "./formal-claim-lowering.js";

const fail = (message: string): never => {
  throw new CompilationRejected([{ code: "APPLICATION_FILE_INPUT", path: "$application", message }]);
};
const MAX_FILE = 16 * 1024 * 1024, MAX_TOTAL = 64 * 1024 * 1024;
const utf8 = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
const required = ["schema_version", "source_sha256", "bindings", "interpretation", "execution", "evidence"];
const optional = ["persistence", "messaging", "external_api", "runtime_profile", "observation"];
const referenceKeys = ["bindings", "interpretation", "execution", "persistence", "messaging", "external_api", "observation"];

/** Bootstrap files have no containing reference yet; still read bounded regular bytes only. */
function readInput(root: string, relative: string): Buffer {
  validateExactFormalSourceRef({ path: relative, sha256: "0".repeat(64), size_bytes: 1, current: true }, "$application/path");
  let target = root;
  for (const part of relative.split("/")) {
    target = path.join(target, part);
    if (lstatSync(target).isSymbolicLink()) fail("symlink input path");
  }
  if (realpathSync(target) !== target) fail("input path changed");
  const fd = openSync(target, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const before = fstatSync(fd);
    if (!before.isFile() || before.size > MAX_FILE) fail("input must be a bounded regular file");
    const bytes = readFileSync(fd), after = fstatSync(fd), current = lstatSync(target);
    if (bytes.length !== before.size || before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs
      || current.isSymbolicLink() || current.ino !== after.ino || current.dev !== after.dev || realpathSync(target) !== target) fail("input changed while reading");
    return bytes;
  } finally { closeSync(fd); }
}
function decode(bytes: Buffer, role: string): unknown {
  try { return JSON.parse(utf8.decode(bytes)); } catch { return fail(`invalid UTF-8 JSON for ${role}`); }
}
function freezeJson<T>(value: T): T {
  if (value && typeof value === "object") { Object.values(value).forEach(freezeJson); Object.freeze(value); }
  return value;
}
type Snapshot = { root: string; source: string; companion: string; sourceHash: string; companionHash: string; refs: ExactFormalSourceRef[] };
const snapshots = new WeakMap<object, Snapshot>();
function current(snapshot: Snapshot): void {
  if (realpathSync(snapshot.root) !== snapshot.root || !lstatSync(snapshot.root).isDirectory()) fail("application root changed");
  if (digest(readInput(snapshot.root, snapshot.source)) !== snapshot.sourceHash
    || digest(readInput(snapshot.root, snapshot.companion)) !== snapshot.companionHash) fail("source or companion changed");
  loadApplicationEvidenceFiles(snapshot.root, snapshot.refs);
}

export interface ApplicationFileOptions {
  /** Relative to the selected .alch source directory; defaults to <source>.application.json. */
  companion?: string;
  packageRoot?: string;
}

/** File transport only. Meaning, interpretation, profile choices and acceptance remain explicit. */
export async function loadApplicationFile(sourcePath: string, options: ApplicationFileOptions = {}) {
  const absolute = path.resolve(sourcePath), root = path.dirname(absolute), sourceName = path.basename(absolute);
  if (path.extname(absolute) !== ".alch" || realpathSync(root) !== root) fail("a real application directory and .alch source are required");
  const companion = options.companion ?? `${sourceName}.application.json`;
  const sourceBytes = readInput(root, sourceName), companionBytes = readInput(root, companion);
  let source: string;
  try { source = utf8.decode(sourceBytes); } catch { return fail("source must be valid UTF-8"); }
  const parsed = decode(companionBytes, "companion");
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return fail("companion must be an object");
  const manifest = parsed as Record<string, unknown>;
  if (required.some(k => !Object.hasOwn(manifest, k)) || Object.keys(manifest).some(k => ![...required, ...optional].includes(k))
    || manifest.schema_version !== "alchlang.application-file/v1-candidate") return fail("closed application companion required");
  if (manifest.source_sha256 !== digest(sourceBytes)) fail("companion source digest differs");
  if (!Array.isArray(manifest.evidence) || manifest.evidence.length > 256) return fail("bounded explicit evidence references required");
  if (Object.hasOwn(manifest, "runtime_profile") && (typeof manifest.runtime_profile !== "string" || !manifest.runtime_profile.trim())) fail("explicit runtime profile name required");
  const roles = new Map<string, ExactFormalSourceRef>();
  for (const role of referenceKeys) if (Object.hasOwn(manifest, role)) roles.set(role, validateExactFormalSourceRef(manifest[role], `$application/${role}`));
  const evidence = manifest.evidence.map((ref, i) => validateExactFormalSourceRef(ref, `$application/evidence/${i}`));
  const refs = [...roles.values(), ...evidence];
  if (refs.some(ref => ref.size_bytes > MAX_FILE) || refs.reduce((total, ref) => total + ref.size_bytes, sourceBytes.length + companionBytes.length) > MAX_TOTAL) fail("selected input byte limit exceeded");
  if (refs.some(ref => ref.path === sourceName || ref.path === companion)) fail("source and companion cannot be selected as payload references");
  const files = loadApplicationEvidenceFiles(root, refs);
  const value = (role: string) => decode(files.get(roles.get(role)!.path)!, role);
  const sources = new Map(evidence.map(ref => [ref.path, files.get(ref.path)!]));
  const compiler = await loadDomainSpecCompiler(options.packageRoot);
  const candidate = prepareApplicationExecutable(source, value("bindings"), sources, value("interpretation"), value("execution"), compiler,
    roles.has("persistence") ? { binding: value("persistence"), compiler } : undefined,
    roles.has("messaging") ? { binding: value("messaging"), compiler } : undefined,
    roles.has("external_api") ? { binding: value("external_api"), compiler } : undefined,
    typeof manifest.runtime_profile === "string" ? { profile: manifest.runtime_profile, compiler } : undefined);
  const snapshot: Snapshot = { root, source: sourceName, companion, sourceHash: digest(sourceBytes), companionHash: digest(companionBytes), refs };
  current(snapshot);
  const inputs = Object.freeze(Object.fromEntries([[sourceName, snapshot.sourceHash], [companion, snapshot.companionHash], ...refs.map(ref => [ref.path, ref.sha256])]));
  const result = Object.freeze({ candidate, compiler, ...(roles.has("observation") ? { observation: freezeJson(value("observation")) } : {}),
    inputs, source_path: absolute, authority_effect: "none" as const });
  snapshots.set(result, snapshot);
  return result;
}

/** Re-read exact selected inputs before a caller publishes generated output. */
export function assertApplicationFileCurrent(loaded: Awaited<ReturnType<typeof loadApplicationFile>>): void {
  const snapshot = snapshots.get(loaded);
  if (!snapshot) return fail("use the current file-loaded application");
  current(snapshot);
}
