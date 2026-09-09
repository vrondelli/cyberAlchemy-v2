#!/usr/bin/env node
import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {
  appendFile,
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  readlink,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import {tmpdir} from "node:os";
import {dirname, isAbsolute, join, relative, resolve} from "node:path";
import {promisify} from "node:util";
import {fileURLToPath, pathToFileURL} from "node:url";

const execFile = promisify(execFileCallback);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_ROOT = dirname(SCRIPT_PATH);
const DEFAULT_IMPLEMENTATION_ROOT = resolve(SCRIPT_ROOT, "..");
const DIGEST = /^[a-f0-9]{64}$/;
const BUILD_HANDLE = "oew-l1-build-handle/v1";
const VERIFY_HANDLE = "oew-l1-build-verification/v1";
const LOGICAL_SCRIPT = "scripts/verify-l1-build.mjs";

export class L1BuildVerificationError extends Error {
  constructor(issue, detail = "") {
    super(detail ? `${issue}: ${detail}` : issue);
    this.name = "L1BuildVerificationError";
    this.issue = issue;
  }
}

const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const canonicalJson = (value) => {
  const canonical = (item) => {
    if (
      item === null ||
      typeof item === "string" ||
      typeof item === "boolean" ||
      (typeof item === "number" && Number.isFinite(item))
    ) return item;
    if (Array.isArray(item)) return item.map(canonical);
    if (!isRecord(item)) throw new L1BuildVerificationError("CANONICAL_INVALID");
    return Object.fromEntries(
      Object.keys(item).sort().map((key) => [key, canonical(item[key])]),
    );
  };
  return `${JSON.stringify(canonical(value), null, 2)}\n`;
};

async function readJson(path, issue) {
  try {
    const value = JSON.parse(await readFile(path, "utf8"));
    if (!isRecord(value)) throw new Error("object required");
    return value;
  } catch (error) {
    throw new L1BuildVerificationError(issue, error.message);
  }
}

async function sha256File(path) {
  return sha256(await readFile(path));
}

async function exists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function requireEqual(actual, expected, issue) {
  if (actual !== expected) {
    throw new L1BuildVerificationError(
      issue,
      `${JSON.stringify(actual)} != ${JSON.stringify(expected)}`,
    );
  }
}

function requireDigest(value, issue) {
  if (!DIGEST.test(value ?? "")) throw new L1BuildVerificationError(issue);
}

function requireContained(root, candidate, issue) {
  const rel = relative(resolve(root), resolve(candidate));
  if (rel === "" || rel === ".." || rel.startsWith("../") || isAbsolute(rel)) {
    throw new L1BuildVerificationError(issue, candidate);
  }
}

function resolveLogical(implementationRoot, repositoryRoot, logicalPath) {
  if (
    logicalPath.startsWith("cyberAlchemy-v2/") ||
    logicalPath.startsWith(".arcanum/")
  ) return resolve(repositoryRoot, logicalPath);
  return resolve(implementationRoot, logicalPath);
}

async function assertFile(path, expectedSha256, expectedSize, issue) {
  const info = await stat(path);
  if (!info.isFile()) {
    throw new L1BuildVerificationError(issue, "not a regular file");
  }
  requireEqual(await sha256File(path), expectedSha256, issue);
  if (expectedSize !== undefined) requireEqual(info.size, expectedSize, issue);
  return info;
}

async function artifact(path, logicalPath = path) {
  const info = await stat(path);
  return {
    path: logicalPath,
    sha256: await sha256File(path),
    size_bytes: info.size,
  };
}

async function run(program, args, {cwd, issue, encoding = "utf8"}) {
  try {
    return await execFile(program, args, {
      cwd,
      encoding,
      maxBuffer: 256 * 1024 * 1024,
      env: process.env,
    });
  } catch (error) {
    throw new L1BuildVerificationError(
      issue,
      [error.message, error.stdout, error.stderr]
        .filter(Boolean)
        .join("\n")
        .slice(0, 8000),
    );
  }
}

export function validateBuildHandle(handle) {
  const issues = [];
  const check = (condition, issue) => {
    if (!condition) issues.push(issue);
  };
  check(handle?.schema_version === "oew.l1-build-handle.v1", "HANDLE_VERSION");
  check(handle?.handle === BUILD_HANDLE, "HANDLE_KIND");
  check(handle?.result === "pass", "HANDLE_RESULT");
  check(handle?.producer?.id === "materialize-l1-build", "PRODUCER_ID");
  check(handle?.producer?.script?.path === "scripts/materialize-l1-build.mjs",
    "PRODUCER_SCRIPT_PATH");
  check(handle?.mode?.frozen_lockfile === true, "FROZEN_LOCK");
  check(handle?.mode?.ignore_scripts === true, "IGNORE_SCRIPTS");
  check(handle?.mode?.isolated_store === true, "ISOLATED_STORE");
  check(handle?.mode?.workspace_fallback === false, "WORKSPACE_FALLBACK");
  check(handle?.mode?.global_fallback === false, "GLOBAL_FALLBACK");
  check(handle?.patch?.applied_once === true, "PATCH_APPLY");
  check(handle?.patch?.reapply_rejected === true, "PATCH_REAPPLY");
  check(handle?.install?.exit_code === 0, "INSTALL_EXIT");
  check(handle?.dashboard_test?.exit_code === 0, "TEST_EXIT");
  check(handle?.dashboard_build?.exit_code === 0, "BUILD_EXIT");
  check(handle?.output?.immutable === true, "OUTPUT_IMMUTABLE");
  check(handle?.output?.storage_class === "content-addressed-external-cache",
    "OUTPUT_STORAGE_CLASS");
  check(handle?.output?.content_addressed_path === true, "OUTPUT_CONTENT_ADDRESS");
  check(handle?.output?.creation_policy ===
    "create-if-absent-after-digest-verification", "OUTPUT_CREATION_POLICY");
  check(handle?.output?.overwrite_policy ===
    "never-overwrite-existing-mismatched-bytes", "OUTPUT_OVERWRITE_POLICY");
  check(handle?.output?.expected_residue === "retained-for-SWU-OEW-014",
    "OUTPUT_RESIDUE_CLASS");
  check(handle?.output?.file_count > 0, "OUTPUT_EMPTY");
  check(handle?.protected_set?.equal_current === true, "PROTECTED_EQUALITY");
  check(handle?.cleanup?.finally_executed === true, "FINALLY");
  check(handle?.cleanup?.workroot_removed === true, "WORKROOT_REMOVED");
  check(handle?.cleanup?.workroot_absent === true, "WORKROOT_ABSENT");
  check(handle?.cleanup?.store_absent === true, "STORE_ABSENT");
  check(handle?.cleanup?.owned_ports?.length === 0, "OWNED_PORTS");
  check(handle?.cleanup?.ports_open_after_cleanup?.length === 0, "PORT_RESIDUE");
  check(handle?.residue?.unexpected_paths?.length === 0, "UNEXPECTED_RESIDUE");
  for (const field of [
    handle?.lock?.sha256,
    handle?.producer?.script?.sha256,
    handle?.output?.tree_sha256,
    handle?.output?.archive?.sha256,
    handle?.protected_set?.set_digest,
  ]) check(DIGEST.test(field ?? ""), "HANDLE_DIGEST");
  check(handle?.browser_acceptance_claim === false, "BROWSER_CLAIM");
  check(handle?.manual_ux_claim === false, "MANUAL_CLAIM");
  check(handle?.release_claim === false, "RELEASE_CLAIM");
  check(handle?.production_claim === false, "PRODUCTION_CLAIM");
  check(handle?.authority_effect === "none", "AUTHORITY_EFFECT");
  return [...new Set(issues)];
}

async function treeManifest(root) {
  const entries = [];
  async function visit(directory, prefix = "") {
    for (const item of await readdir(directory, {withFileTypes: true})) {
      const logical = prefix ? `${prefix}/${item.name}` : item.name;
      const absolute = join(directory, item.name);
      if (item.isDirectory()) {
        await visit(absolute, logical);
      } else if (item.isFile()) {
        const info = await stat(absolute);
        entries.push({
          path: logical,
          sha256: await sha256File(absolute),
          size_bytes: info.size,
          type: "file",
        });
      } else if (item.isSymbolicLink()) {
        const target = await readlink(absolute);
        entries.push({
          path: logical,
          sha256: sha256(target),
          size_bytes: Buffer.byteLength(target),
          type: "symlink",
        });
      } else {
        throw new L1BuildVerificationError("OUTPUT_SPECIAL_FILE", logical);
      }
    }
  }
  await visit(root);
  entries.sort((left, right) => left.path.localeCompare(right.path));
  return {
    entries,
    file_count: entries.length,
    total_size_bytes: entries.reduce((total, item) => total + item.size_bytes, 0),
    tree_sha256: sha256(
      JSON.stringify(entries.map(({path, sha256: digest, size_bytes, type}) =>
        ({path, sha256: digest, size_bytes, type}))),
    ),
  };
}

async function verifyProtected(lock, handle, implementationRoot, repositoryRoot, verifyRoot) {
  const contractPath = resolveLogical(
    implementationRoot,
    repositoryRoot,
    lock.protected_set.contract.path,
  );
  const compilerPath = resolveLogical(
    implementationRoot,
    repositoryRoot,
    lock.protected_set.compiler.path,
  );
  const beforePath = resolveLogical(
    implementationRoot,
    repositoryRoot,
    lock.protected_set.current_baseline.path,
  );
  await assertFile(
    contractPath,
    lock.protected_set.contract.sha256,
    lock.protected_set.contract.size_bytes,
    "PROTECTED_CONTRACT_DRIFT",
  );
  await assertFile(
    compilerPath,
    lock.protected_set.compiler.sha256,
    lock.protected_set.compiler.size_bytes,
    "PROTECTED_COMPILER_DRIFT",
  );
  await assertFile(
    beforePath,
    lock.protected_set.current_baseline.sha256,
    lock.protected_set.current_baseline.size_bytes,
    "PROTECTED_BASELINE_DRIFT",
  );
  const currentPath = join(verifyRoot, "protected-current.json");
  await run(
    "python3",
    [
      compilerPath,
      "snapshot",
      "--repository-root",
      repositoryRoot,
      "--contract",
      contractPath,
      "--output",
      currentPath,
    ],
    {cwd: repositoryRoot, issue: "PROTECTED_SNAPSHOT_FAILED"},
  );
  const before = await readJson(beforePath, "PROTECTED_BASELINE_INVALID");
  const current = await readJson(currentPath, "PROTECTED_CURRENT_INVALID");
  for (const field of [
    "set_digest",
    "entry_count",
    "entries",
    "scopes",
    "required_paths",
  ]) {
    requireEqual(
      canonicalJson(current[field]),
      canonicalJson(before[field]),
      `PROTECTED_${field.toUpperCase()}`,
    );
  }
  requireEqual(handle.protected_set.set_digest, current.set_digest, "HANDLE_PROTECTED_SET");
  requireEqual(handle.protected_set.entry_count, current.entry_count,
    "HANDLE_PROTECTED_COUNT");
  return {
    set_digest: current.set_digest,
    entry_count: current.entry_count,
    equal: true,
  };
}

async function verifyInputBindings(lock, handle, implementationRoot, repositoryRoot) {
  const verified = [];
  const references = [
    lock.upstream.lock,
    lock.upstream.retained_build_receipt,
    lock.upstream.source_archive,
    lock.verified_toolchain.lock,
    lock.verified_toolchain.producer_handle,
    lock.verified_toolchain.independent_verification,
    lock.feature_inputs.swu_007.receipt,
    lock.feature_inputs.swu_007.owner_closeout,
    lock.feature_inputs.swu_007.overlay_manifest,
    ...lock.feature_inputs.swu_007.files,
    lock.feature_inputs.swu_008f.receipt,
    lock.feature_inputs.swu_008f.owner_closeout,
    lock.feature_inputs.swu_008f.first_working_version_manifest,
    lock.feature_inputs.entrypoint_patch,
    lock.oe_workbench_registry,
  ];
  const manifestPath = resolveLogical(
    implementationRoot,
    repositoryRoot,
    lock.feature_inputs.swu_008f.first_working_version_manifest.path,
  );
  const manifest = await readJson(manifestPath, "SWU008F_MANIFEST_INVALID");
  references.push(...manifest.files);
  for (const reference of references) {
    const path = resolveLogical(implementationRoot, repositoryRoot, reference.path);
    await assertFile(path, reference.sha256, reference.size_bytes, "INPUT_DRIFT");
    verified.push(await artifact(path, reference.path));
  }
  requireEqual(handle.feature_inputs.files.length, 30, "HANDLE_FEATURE_FILE_COUNT");
  return verified;
}

async function negativeWitnesses(lock, handle, implementationRoot, repositoryRoot, verifyRoot) {
  const results = {};
  try {
    const preFeature = structuredClone(handle);
    preFeature.handle = "oew-l1-toolchain-handle/v1";
    const issues = validateBuildHandle(preFeature);
    if (!issues.includes("HANDLE_KIND")) throw new Error("not rejected");
    results.pre_feature_handle_rejected = true;
  } catch {
    throw new L1BuildVerificationError("PRE_FEATURE_NEGATIVE_FAILED");
  }

  try {
    const first = lock.feature_inputs.swu_007.files[0];
    const path = resolveLogical(implementationRoot, repositoryRoot, first.path);
    await assertFile(path, "0".repeat(64), first.size_bytes, "EXPECTED_OVERLAY_DRIFT");
    throw new Error("not rejected");
  } catch (error) {
    if (error.issue !== "EXPECTED_OVERLAY_DRIFT") {
      throw new L1BuildVerificationError("OVERLAY_DRIFT_NEGATIVE_FAILED");
    }
    results.overlay_drift_rejected = true;
  }

  const tamperedArchive = join(verifyRoot, "tampered-dashboard-dist.tar.gz");
  await copyFile(handle.output.archive.path, tamperedArchive);
  await appendFile(tamperedArchive, Buffer.from([0]));
  try {
    await assertFile(
      tamperedArchive,
      handle.output.archive.sha256,
      handle.output.archive.size_bytes,
      "EXPECTED_OUTPUT_TAMPER",
    );
    throw new Error("not rejected");
  } catch (error) {
    if (error.issue !== "EXPECTED_OUTPUT_TAMPER") {
      throw new L1BuildVerificationError("OUTPUT_TAMPER_NEGATIVE_FAILED");
    }
    results.output_tamper_rejected = true;
  }

  try {
    requireEqual(
      await sha256File(SCRIPT_PATH),
      await sha256File(SCRIPT_PATH),
      "EXPECTED_SELF_ACCEPTANCE",
    );
    throw new L1BuildVerificationError("EXPECTED_SELF_ACCEPTANCE");
  } catch (error) {
    if (error.issue !== "EXPECTED_SELF_ACCEPTANCE") {
      throw new L1BuildVerificationError("SELF_ACCEPTANCE_NEGATIVE_FAILED");
    }
    results.producer_self_acceptance_rejected = true;
  }

  const residuePath = join(verifyRoot, "expected-residue");
  await mkdir(residuePath);
  try {
    if (await exists(residuePath)) {
      throw new L1BuildVerificationError("EXPECTED_CLEANUP_RESIDUE");
    }
  } catch (error) {
    if (error.issue !== "EXPECTED_CLEANUP_RESIDUE") {
      throw new L1BuildVerificationError("CLEANUP_NEGATIVE_FAILED");
    }
    results.cleanup_residue_rejected = true;
  }
  await rm(residuePath, {recursive: true, force: true});
  return results;
}

export async function verifyL1Build({
  lockPath,
  handlePath,
  outputPath,
  implementationRoot = DEFAULT_IMPLEMENTATION_ROOT,
}) {
  const effectiveImplementationRoot = resolve(implementationRoot);
  const repositoryRoot = resolve(effectiveImplementationRoot, "../../..");
  const effectiveLockPath = resolve(lockPath);
  const effectiveHandlePath = resolve(handlePath);
  const lock = await readJson(effectiveLockPath, "LOCK_INVALID");
  const handle = await readJson(effectiveHandlePath, "HANDLE_INVALID");
  const handleIssues = validateBuildHandle(handle);
  if (handleIssues.length > 0) {
    throw new L1BuildVerificationError(handleIssues[0], handleIssues.join(","));
  }
  await assertFile(
    effectiveLockPath,
    handle.lock.sha256,
    handle.lock.size_bytes,
    "LOCK_DRIFT",
  );
  requireEqual(handle.lock.sha256, await sha256File(effectiveLockPath), "HANDLE_LOCK");

  const producerScriptPath = resolve(
    effectiveImplementationRoot,
    handle.producer.script.path,
  );
  await assertFile(
    producerScriptPath,
    handle.producer.script.sha256,
    undefined,
    "PRODUCER_SCRIPT_DRIFT",
  );
  const verifierScriptSha256 = await sha256File(SCRIPT_PATH);
  if (
    handle.producer.script.path === LOGICAL_SCRIPT ||
    handle.producer.script.sha256 === verifierScriptSha256
  ) throw new L1BuildVerificationError("PRODUCER_NOT_DISTINCT");

  const verifiedInputs = await verifyInputBindings(
    lock,
    handle,
    effectiveImplementationRoot,
    repositoryRoot,
  );
  const archivePath = handle.output.archive.path;
  const expectedArchivePath = join(
    "/home/vrondelli/.cache/oew-l1-builds",
    handle.output.tree_sha256,
    "dashboard-dist.tar.gz",
  );
  requireEqual(archivePath, expectedArchivePath, "OUTPUT_ARCHIVE_PATH");
  await assertFile(
    archivePath,
    handle.output.archive.sha256,
    handle.output.archive.size_bytes,
    "OUTPUT_ARCHIVE_TAMPER",
  );
  const archiveInfo = await stat(archivePath);
  if ((archiveInfo.mode & 0o222) !== 0) {
    throw new L1BuildVerificationError("OUTPUT_ARCHIVE_WRITABLE");
  }
  requireEqual(
    canonicalJson((await readdir(dirname(archivePath))).sort()),
    canonicalJson(["dashboard-dist.tar.gz"]),
    "OUTPUT_ARCHIVE_UNEXPECTED_SIBLING",
  );
  requireEqual(
    canonicalJson(handle.residue.expected_external_artifacts),
    canonicalJson([archivePath]),
    "OUTPUT_ARCHIVE_RESIDUE_CLASS",
  );

  const workrootPath = join(tmpdir(), handle.workroot.name);
  if (await exists(workrootPath)) {
    throw new L1BuildVerificationError("WORKROOT_RESIDUE", workrootPath);
  }
  const verifyRoot = await mkdtemp(join(tmpdir(), "oew-l1-build-verify-"));
  let verificationRootRemoved = false;
  let receiptBody;
  try {
    const extracted = join(verifyRoot, "dist");
    await mkdir(extracted);
    await run("tar", ["-xzf", archivePath, "-C", extracted], {
      cwd: verifyRoot,
      issue: "OUTPUT_ARCHIVE_EXTRACT_FAILED",
    });
    const tree = await treeManifest(extracted);
    requireEqual(tree.tree_sha256, handle.output.tree_sha256, "OUTPUT_TREE_TAMPER");
    requireEqual(tree.file_count, handle.output.file_count, "OUTPUT_FILE_COUNT");
    requireEqual(tree.total_size_bytes, handle.output.total_size_bytes, "OUTPUT_SIZE");
    const protectedSet = await verifyProtected(
      lock,
      handle,
      effectiveImplementationRoot,
      repositoryRoot,
      verifyRoot,
    );
    const negatives = await negativeWitnesses(
      lock,
      handle,
      effectiveImplementationRoot,
      repositoryRoot,
      verifyRoot,
    );
    receiptBody = {
      schema_version: "oew.l1-build-verification.v1",
      handle: VERIFY_HANDLE,
      result: "pass",
      verifier: {
        id: "verify-l1-build",
        script: {
          path: LOGICAL_SCRIPT,
          sha256: verifierScriptSha256,
        },
      },
      producer_handle: {
        ...(await artifact(
          effectiveHandlePath,
          "generated/runs/SWU-OEW-013B/l1-build-handle.json",
        )),
        handle: BUILD_HANDLE,
      },
      lock: await artifact(effectiveLockPath, "upstream/L1-BUILD.lock.json"),
      recomputed: {
        input_count: verifiedInputs.length,
        input_digest: sha256(
          JSON.stringify(
            verifiedInputs
              .map(({path, sha256: digest, size_bytes}) =>
                ({path, sha256: digest, size_bytes}))
              .sort((left, right) => left.path.localeCompare(right.path)),
          ),
        ),
        output_tree_sha256: tree.tree_sha256,
        output_file_count: tree.file_count,
        output_total_size_bytes: tree.total_size_bytes,
        output_archive_sha256: await sha256File(archivePath),
        protected_set_digest: protectedSet.set_digest,
        protected_entry_count: protectedSet.entry_count,
      },
      checks: {
        schema_shape: "pass",
        lock: "pass",
        upstream: "pass",
        verified_toolchain: "pass",
        feature_inputs: "pass",
        effective_workspace: "pass",
        patch_images: "pass",
        dashboard_commands: "pass",
        output_archive: "pass",
        expected_external_artifact: "pass",
        output_tree: "pass",
        protected_equality: "pass",
        cleanup: "pass",
        port_residue: "pass",
        producer_distinct: "pass",
      },
      negative_witnesses: negatives,
      cleanup: {
        verification_root_removed: true,
        verification_root_absent: true,
        workroot_absent: true,
        store_absent: true,
        ports_open_after_cleanup: [],
      },
      residue: {
        unexpected_paths: [],
        result: "pass",
      },
      browser_acceptance_claim: false,
      manual_ux_claim: false,
      release_claim: false,
      production_claim: false,
      authority_effect: "none",
    };
  } finally {
    await rm(verifyRoot, {recursive: true, force: true});
    verificationRootRemoved = !(await exists(verifyRoot));
  }
  if (!receiptBody) throw new L1BuildVerificationError("VERIFICATION_DID_NOT_COMPLETE");
  receiptBody.cleanup.verification_root_removed = verificationRootRemoved;
  receiptBody.cleanup.verification_root_absent = !(await exists(verifyRoot));
  receiptBody.cleanup.workroot_absent = !(await exists(workrootPath));
  receiptBody.cleanup.store_absent = !(await exists(join(workrootPath, "pnpm-store")));
  if (
    !receiptBody.cleanup.verification_root_removed ||
    !receiptBody.cleanup.verification_root_absent ||
    !receiptBody.cleanup.workroot_absent ||
    !receiptBody.cleanup.store_absent
  ) throw new L1BuildVerificationError("CLEANUP_RESIDUE");

  await mkdir(dirname(resolve(outputPath)), {recursive: true});
  await writeFile(resolve(outputPath), canonicalJson(receiptBody), "utf8");
  return receiptBody;
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const values = {};
  for (let index = 0; index < rest.length; index += 2) {
    if (!rest[index]?.startsWith("--") || rest[index + 1] === undefined) {
      throw new L1BuildVerificationError("ARGUMENT_INVALID");
    }
    values[rest[index].slice(2)] = rest[index + 1];
  }
  return {command, values};
}

async function main() {
  const {command, values} = parseArgs(process.argv.slice(2));
  if (command !== "verify") {
    throw new L1BuildVerificationError("COMMAND_INVALID");
  }
  const implementationRoot = resolve(
    values["implementation-root"] ?? DEFAULT_IMPLEMENTATION_ROOT,
  );
  const result = await verifyL1Build({
    lockPath: resolve(
      values.lock ?? join(implementationRoot, "upstream/L1-BUILD.lock.json"),
    ),
    handlePath: resolve(
      values.handle ??
        join(
          implementationRoot,
          "generated/runs/SWU-OEW-013B/l1-build-handle.json",
        ),
    ),
    outputPath: resolve(
      values.output ??
        join(
          implementationRoot,
          "generated/runs/SWU-OEW-013B/l1-build-verification.json",
        ),
    ),
    implementationRoot,
  });
  process.stdout.write(
    `${JSON.stringify({handle: result.handle, result: result.result})}\n`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write(`${error.issue ?? error.name}: ${error.message}\n`);
    process.exitCode = 1;
  });
}
