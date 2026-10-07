import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {closeSync, constants, fstatSync, lstatSync, openSync, readFileSync} from "node:fs";
import {resolve, sep} from "node:path";

const ROOT = resolve(import.meta.dirname, "../../../..");
const MANIFEST_PATH = "implementation/agent-reasoning-engine/packages/module-port-governance-binding-rust/artifacts/linux-x64-v2-candidate/manifest.json";
const BINARY_PATH = "implementation/agent-reasoning-engine/packages/module-port-governance-binding-rust/artifacts/linux-x64-v2-candidate/are-module-port-v2-candidate";
const MANIFEST_SHA256 = "4a4158d13155eb8f8844ab92a19d0bb62cdf5ad646f22549c36d2ef8036824d6";
const BINARY_SHA256 = "a8b528a7ca8234d1644ed39b50e1243a13637c320913f94e37fdc38c733a06f6";
const ARTIFACT_ID = "ARE-MODULE-PORT-PACKAGED-VERIFIER-LINUX-X64-002-CANDIDATE";
const BINDING_ID = "ARE-MODULE-PORT-RUST-BINDING-002-CANDIDATE";
const CONFIGURATION_ID = "are-production-semantic-core-v2-candidate";
const CONFIGURATION_SHA256 = "71673fd5302bc521513d530eccfc36c2c81b01d967916ee013edf203a2e910c8";
const MODULE_SET_DIGEST = "f87d8f92824c2b1fab2635742f71d630ce3121c155b509fa13ce4fe0c6e1a926";
const COMPOSITION_BINDINGS = Object.freeze([
  ["implementation/agent-reasoning-engine/packages/module-port-governance-cutover-v2-candidate/index.mjs", "d946b84c43636b45be9441552dbcce666c78c6768ae9b2f59fa07fc515e80418"],
  ["implementation/agent-reasoning-engine/packages/module-port/index.mjs", "fcd2d4c6e5c4e674c1ca18a4b58ffb14ac10c9f2383f85dd7f628842c5d19ac3"],
  ["implementation/agent-reasoning-engine/packages/module-port/semantic-text.mjs", "4cba4df75800312b4bf6f42b16f19fe467b17db16c4d75c0764b1ea37b10c6fa"],
  ["implementation/agent-reasoning-engine/packages/module-port/static-composition.mjs", "3cae170156020f897324e9faaeb4e63d203cef362c9bfc99d727617217c47406"],
]);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function blocked(reason) {
  return Object.freeze({schema_version: "are.module-port-packaged-preview/v2-candidate",
    ok: false, disposition: "blocked", reason_codes: [reason], configuration_id: CONFIGURATION_ID,
    verifier_delivery: null, verifier_artifact_id: null, runtime_admitted: false,
    activation_selected: false, cutover_completed: false, enforcement_active: false,
    effect_authorized: false, authority_effect: "none", port: null});
}

function readExact(root, path, expectedDigest) {
  let current = resolve(root);
  if (lstatSync(current).isSymbolicLink()) throw new Error("packaged.repository-root-symlink");
  for (const part of path.split("/")) {
    if (!part || part === "." || part === ".." || part.includes(sep)) throw new Error("packaged.path-invalid");
    current = resolve(current, part);
    if (lstatSync(current).isSymbolicLink()) throw new Error(`packaged.symlink-forbidden:${path}`);
  }
  const metadata = lstatSync(current);
  if (!metadata.isFile()) throw new Error(`packaged.not-regular:${path}`);
  const bytes = readFileSync(current);
  if (sha256(bytes) !== expectedDigest) throw new Error(`packaged.digest-mismatch:${path}`);
  return {path: current, bytes, metadata};
}

/** Artifact inspection is separate from launch so drift and substitution can be tested. */
export function inspectPackagedCandidateFiles(root) {
  try {
    const manifestFile = readExact(root, MANIFEST_PATH, MANIFEST_SHA256);
    const binaryFile = readExact(root, BINARY_PATH, BINARY_SHA256);
    let manifest;
    try { manifest = JSON.parse(manifestFile.bytes); }
    catch { return {ok: false, reason: "packaged.manifest-json-invalid"}; }
    if (manifest.schema_version !== "are.module-port-packaged-verifier-artifact/v2-candidate"
      || manifest.artifact_id !== ARTIFACT_ID || manifest.binding_id !== BINDING_ID
      || manifest.platform !== "linux" || manifest.architecture !== "x64"
      || manifest.target_triple !== "x86_64-unknown-linux-gnu" || manifest.binary_format !== "elf"
      || manifest.build_profile !== "release" || manifest.binary_path !== BINARY_PATH
      || manifest.binary_sha256 !== BINARY_SHA256 || manifest.binary_size !== binaryFile.bytes.length
      || manifest.runtime_compiler_required !== false || manifest.runtime_package_manager_required !== false
      || manifest.fallback_allowed !== false || manifest.runtime_admitted !== false
      || manifest.binding_admitted !== false || manifest.activation_selected !== false
      || manifest.cutover_completed !== false || manifest.enforcement_active !== false
      || manifest.effect_authorized !== false || manifest.authority_effect !== "none") {
      return {ok: false, reason: "packaged.manifest-claims-invalid"};
    }
    if (process.platform !== manifest.platform || process.arch !== manifest.architecture) {
      return {ok: false, reason: "packaged.platform-mismatch"};
    }
    if ((binaryFile.metadata.mode & 0o111) === 0
      || binaryFile.bytes.length < 20
      || !binaryFile.bytes.subarray(0, 4).equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46]))
      || binaryFile.bytes[4] !== 2 || binaryFile.bytes[5] !== 1
      || binaryFile.bytes.readUInt16LE(18) !== 0x3e) {
      return {ok: false, reason: "packaged.binary-not-executable"};
    }
    if (!Array.isArray(manifest.source_files) || manifest.source_files.length !== 7
      || new Set(manifest.source_files.map((row) => row.path)).size !== 7) {
      return {ok: false, reason: "packaged.source-denominator-invalid"};
    }
    for (const row of manifest.source_files) readExact(root, row.path, row.sha256);
    return {ok: true, manifest, binaryPath: binaryFile.path};
  } catch (error) {
    return {ok: false, reason: error?.message ?? "packaged.file-unavailable"};
  }
}

/** Every executable transitive JS import is checked before index.mjs is loaded. */
export function inspectCompositionClosure(root) {
  try {
    for (const [path, expected] of COMPOSITION_BINDINGS) readExact(root, path, expected);
    return {ok: true};
  } catch (error) {
    return {ok: false, reason: error?.message ?? "packaged.composition-source-unavailable"};
  }
}

function receiptValid(receipt) {
  return receipt?.schema_version === "are.module-port-rust-binding-receipt/v2-candidate"
    && receipt.binding_id === BINDING_ID && receipt.disposition === "PASS"
    && receipt.subject_configuration_id === CONFIGURATION_ID
    && receipt.subject_configuration_sha256 === CONFIGURATION_SHA256
    && receipt.module_set_digest === MODULE_SET_DIGEST
    && Array.isArray(receipt.checks) && receipt.checks.length === 17
    && receipt.checks.every((row) => row.outcome === "PASS")
    && Array.isArray(receipt.reason_codes) && receipt.reason_codes.length === 0
    && receipt.runtime_admission_verified === false && receipt.binding_admitted === false
    && receipt.enforcement_active === false && receipt.effect_authorized === false
    && receipt.authority_effect === "none";
}

/** Direct packaged execution; there is no caller-supplied receipt or Cargo fallback. */
export function runPackagedCandidateVerifier(root) {
  const inspected = inspectPackagedCandidateFiles(root);
  if (!inspected.ok) return {ok: false, reason: inspected.reason};
  let execution;
  let binaryFd;
  try {
    // Execute the same verified inode, even if its pathname is replaced after opening.
    binaryFd = openSync(inspected.binaryPath, constants.O_RDONLY | constants.O_NOFOLLOW);
    const metadata = fstatSync(binaryFd);
    const bytes = readFileSync(binaryFd);
    if (!metadata.isFile() || (metadata.mode & 0o111) === 0 || sha256(bytes) !== BINARY_SHA256) {
      return {ok: false, reason: "packaged.binary-changed-before-launch"};
    }
    execution = spawnSync("/proc/self/fd/3", ["--repository-root", resolve(root)],
      {stdio: ["ignore", "pipe", "pipe", binaryFd], encoding: "utf8", timeout: 60_000, maxBuffer: 1024 * 1024});
  } catch {
    return {ok: false, reason: "packaged.verifier-unavailable"};
  } finally {
    if (binaryFd !== undefined) closeSync(binaryFd);
  }
  if (execution.error || execution.status !== 0 || execution.signal) {
    return {ok: false, reason: "packaged.verifier-blocked"};
  }
  let receipt;
  try { receipt = JSON.parse(execution.stdout); }
  catch { return {ok: false, reason: "packaged.receipt-json-invalid"}; }
  if (!receiptValid(receipt)) return {ok: false, reason: "packaged.receipt-claims-invalid"};
  return {ok: true, receipt, artifactId: inspected.manifest.artifact_id};
}

/** The production-facing preview is anchored to this module's own checkout. */
export async function previewPackagedCandidateModulePort() {
  const verified = runPackagedCandidateVerifier(ROOT);
  if (!verified.ok) return blocked(verified.reason);
  const closure = inspectCompositionClosure(ROOT);
  if (!closure.ok) return blocked(closure.reason);
  let previewCandidateModulePort;
  try { ({previewCandidateModulePort} = await import("./index.mjs")); }
  catch { return blocked("packaged.composition-import-failed"); }
  const preview = await previewCandidateModulePort({repository_root: ROOT, verifier_receipt: verified.receipt});
  if (!preview.ok) return blocked(preview.reason_codes[0] ?? "packaged.composition-blocked");
  return Object.freeze({...preview, schema_version: "are.module-port-packaged-preview/v2-candidate",
    verifier_delivery: "packaged-artifact", verifier_artifact_id: verified.artifactId,
    verifier_artifact_sha256: BINARY_SHA256});
}
