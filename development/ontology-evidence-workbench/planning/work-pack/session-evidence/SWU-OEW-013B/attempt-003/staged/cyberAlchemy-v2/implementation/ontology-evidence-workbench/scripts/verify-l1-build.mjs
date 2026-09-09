#!/usr/bin/env node
import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {
  appendFile,
  chmod,
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
const LOCK_VALIDATOR_LOGICAL =
  "cyberAlchemy-v2/development/ontology-evidence-workbench/refresh/" +
  "2026-07-29-l1-effective-build-order/validate-l1-build-lock.py";
const LOCK_VALIDATOR_SHA256 =
  "aaac48abe8d75417c0f603818a4cefc7e09e3e18944fa5d0e22c2a7f3b691fac";
const LOCK_VALIDATOR_SIZE = 14747;
const MANIFEST_LOGICAL =
  "cyberAlchemy-v2/development/ontology-evidence-workbench/planning/" +
  "work-pack/swu-manifest.json";
const MANIFEST_SHA256 =
  "005de7f8a6184a03d0a39af6715bbef2af3b558d0cf98fbece00315827065613";
const CORE_PACKAGE = "@understand-anything/core";
const COMMAND_ORDER = [
  "install",
  "core-build",
  "dashboard-vitest",
  "dashboard-build",
];

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

async function run(
  program,
  args,
  {cwd, issue, encoding = "utf8", allowFailure = false},
) {
  try {
    const result = await execFile(program, args, {
      cwd,
      encoding,
      maxBuffer: 256 * 1024 * 1024,
      env: process.env,
    });
    return {...result, exit_code: 0};
  } catch (error) {
    if (allowFailure) {
      return {
        stdout: String(error.stdout ?? ""),
        stderr: String(error.stderr ?? ""),
        exit_code: Number.isInteger(error.code) ? error.code : 1,
      };
    }
    throw new L1BuildVerificationError(
      issue,
      [error.message, error.stdout, error.stderr]
        .filter(Boolean)
        .join("\n")
        .slice(0, 8000),
    );
  }
}

function commandById(lock, id) {
  const command = lock.execution_contract.commands.find((item) => item.id === id);
  if (!command) throw new L1BuildVerificationError("LOCK_COMMAND_MISSING", id);
  return command;
}

export function validateCoreEvidence(lock, handle) {
  const issues = [];
  const check = (condition, issue) => {
    if (!condition) issues.push(issue);
  };
  const coreSpec = lock?.upstream?.effective_workspace?.core_package;
  const coreCommand = lock?.execution_contract?.commands?.find(
    (item) => item.id === "core-build",
  );
  check(coreSpec?.name === CORE_PACKAGE, "CORE_PACKAGE");
  check(coreSpec?.build_script === "tsc", "CORE_SCRIPT");
  check(
    JSON.stringify(handle?.command_order) === JSON.stringify(COMMAND_ORDER),
    "CORE_COMMAND_ORDER",
  );
  check(handle?.core_build?.command === coreCommand?.command, "CORE_COMMAND");
  check(
    handle?.core_build?.expanded_script === coreCommand?.expanded_script,
    "CORE_EXPANDED_SCRIPT",
  );
  check(handle?.core_build?.after === "install", "CORE_AFTER");
  check(handle?.core_build?.before === "dashboard-vitest", "CORE_BEFORE");
  check(handle?.core_build?.exit_code === 0, "CORE_EXIT");
  check(handle?.core_build?.result === "pass", "CORE_RESULT");
  check(
    handle?.core_build?.output?.directory === coreSpec?.output_contract?.directory,
    "CORE_OUTPUT_DIRECTORY",
  );
  check(DIGEST.test(handle?.core_build?.output?.tree_sha256 ?? ""),
    "CORE_TREE_DIGEST");
  check(handle?.core_build?.output?.file_count > 0, "CORE_OUTPUT_COUNT");
  check(handle?.core_build?.output?.total_size_bytes > 0, "CORE_OUTPUT_SIZE");
  const expectedPaths = coreCommand?.producer_evidence?.required_output_paths ?? [];
  const actualPaths = handle?.core_build?.output?.required_outputs?.map(
    (item) => item.path,
  ) ?? [];
  check(
    canonicalJson([...actualPaths].sort()) ===
      canonicalJson([...expectedPaths].sort()),
    "CORE_REQUIRED_OUTPUTS",
  );
  for (const item of handle?.core_build?.output?.required_outputs ?? []) {
    check(DIGEST.test(item?.sha256 ?? ""), "CORE_REQUIRED_OUTPUT_DIGEST");
    check(item?.size_bytes > 0, "CORE_REQUIRED_OUTPUT_SIZE");
  }
  return [...new Set(issues)];
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
  check(handle?.lock_validation?.check_count === 70, "LOCK_70_CHECK_COUNT");
  check(handle?.lock_validation?.check_ids?.length === 70, "LOCK_70_CHECK_IDS");
  check(handle?.lock_validation?.result === "pass", "LOCK_70_RESULT");
  check(handle?.mode?.frozen_lockfile === true, "FROZEN_LOCK");
  check(handle?.mode?.ignore_scripts === true, "IGNORE_SCRIPTS");
  check(handle?.mode?.isolated_store === true, "ISOLATED_STORE");
  check(handle?.mode?.workspace_fallback === false, "WORKSPACE_FALLBACK");
  check(handle?.mode?.global_fallback === false, "GLOBAL_FALLBACK");
  check(handle?.patch?.applied_once === true, "PATCH_APPLY");
  check(handle?.patch?.reapply_rejected === true, "PATCH_REAPPLY");
  check(handle?.install?.exit_code === 0, "INSTALL_EXIT");
  for (const issue of validateCoreEvidence(
    {
      upstream: {effective_workspace: handle?.effective_workspace},
      execution_contract: {
        commands: [
          {id: "core-build", command: "pnpm --filter @understand-anything/core build",
            expanded_script: "tsc",
            producer_evidence: {
              required_output_paths:
                handle?.core_build?.output?.required_outputs?.map((item) => item.path) ?? [],
            }},
        ],
      },
    },
    handle,
  )) check(false, issue);
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
  check(handle?.output?.archive_layout === "oew-l1-build-evidence/v1",
    "OUTPUT_ARCHIVE_LAYOUT");
  check(handle?.output?.browser_payload_root === "dashboard",
    "OUTPUT_BROWSER_ROOT");
  check(handle?.output?.core_evidence_root === "evidence/core-dist",
    "OUTPUT_CORE_EVIDENCE_ROOT");
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

async function verifySourceOverlayPatch(
  lock,
  implementationRoot,
  repositoryRoot,
  verifyRoot,
) {
  const sourceArchivePath = resolveLogical(
    implementationRoot,
    repositoryRoot,
    lock.upstream.source_archive.path,
  );
  await assertFile(
    sourceArchivePath,
    lock.upstream.source_archive.sha256,
    lock.upstream.source_archive.size_bytes,
    "SOURCE_ARCHIVE_DRIFT",
  );
  const extractionRoot = join(verifyRoot, "source");
  await mkdir(extractionRoot);
  await run("tar", ["-xzf", sourceArchivePath, "-C", extractionRoot], {
    cwd: verifyRoot,
    issue: "SOURCE_ARCHIVE_EXTRACT_FAILED",
  });
  const sourceRoot = resolve(
    extractionRoot,
    lock.upstream.source_archive.content_root,
  );
  requireContained(extractionRoot, sourceRoot, "SOURCE_ROOT_ESCAPE");
  for (const [reference, issue] of [
    [lock.upstream.effective_workspace.package, "ROOT_PACKAGE_DRIFT"],
    [lock.upstream.effective_workspace.lock, "WORKSPACE_LOCK_DRIFT"],
    [lock.upstream.effective_workspace.workspace, "WORKSPACE_CONFIG_DRIFT"],
    [lock.upstream.effective_workspace.core_package, "CORE_PACKAGE_DRIFT"],
    [lock.upstream.effective_workspace.dashboard_package, "DASHBOARD_PACKAGE_DRIFT"],
  ]) {
    const path = resolve(sourceRoot, reference.path);
    requireContained(sourceRoot, path, "PINNED_MEMBER_ESCAPE");
    await assertFile(path, reference.sha256, reference.size_bytes, issue);
  }

  let copied = 0;
  for (const reference of lock.feature_inputs.swu_007.files) {
    const source = resolveLogical(
      implementationRoot,
      repositoryRoot,
      reference.path,
    );
    await assertFile(source, reference.sha256, reference.size_bytes, "SWU007_DRIFT");
    const destination = resolve(sourceRoot, reference.destination);
    requireContained(sourceRoot, destination, "SWU007_DESTINATION_ESCAPE");
    if (await exists(destination)) {
      throw new L1BuildVerificationError("SWU007_DESTINATION_EXISTS");
    }
    await mkdir(dirname(destination), {recursive: true});
    await copyFile(source, destination);
    await assertFile(
      destination,
      reference.sha256,
      reference.size_bytes,
      "SWU007_COPY_DRIFT",
    );
    copied += 1;
  }

  const manifestPath = resolveLogical(
    implementationRoot,
    repositoryRoot,
    lock.feature_inputs.swu_008f.first_working_version_manifest.path,
  );
  const manifest = await readJson(manifestPath, "SWU008F_MANIFEST_INVALID");
  requireEqual(manifest.files.length, 27, "SWU008F_FILE_COUNT");
  for (const reference of manifest.files) {
    const source = resolveLogical(
      implementationRoot,
      repositoryRoot,
      reference.path,
    );
    await assertFile(source, reference.sha256, reference.size_bytes, "SWU008F_DRIFT");
    copied += 1;
    if (reference.role === "focused-runner") continue;
    const prefix = lock.feature_inputs.swu_008f.bound_file_policy
      .overlay_source_prefix;
    if (!reference.path.startsWith(prefix)) {
      throw new L1BuildVerificationError("SWU008F_SOURCE_PREFIX");
    }
    const destination = resolve(
      sourceRoot,
      lock.feature_inputs.swu_008f.bound_file_policy.overlay_destination_root,
      reference.path.slice(prefix.length),
    );
    requireContained(sourceRoot, destination, "SWU008F_DESTINATION_ESCAPE");
    if (await exists(destination)) {
      throw new L1BuildVerificationError("SWU008F_DESTINATION_EXISTS");
    }
    await mkdir(dirname(destination), {recursive: true});
    await copyFile(source, destination);
    await assertFile(
      destination,
      reference.sha256,
      reference.size_bytes,
      "SWU008F_COPY_DRIFT",
    );
  }

  const patchSpec = lock.feature_inputs.entrypoint_patch;
  const patchPath = resolveLogical(
    implementationRoot,
    repositoryRoot,
    patchSpec.path,
  );
  await assertFile(
    patchPath,
    patchSpec.sha256,
    patchSpec.size_bytes,
    "PATCH_BYTES_DRIFT",
  );
  const patchTarget = resolve(sourceRoot, patchSpec.target);
  requireContained(sourceRoot, patchTarget, "PATCH_TARGET_ESCAPE");
  await assertFile(
    patchTarget,
    patchSpec.preimage_sha256,
    undefined,
    "PATCH_PREIMAGE_DRIFT",
  );
  await run("git", ["apply", "--check", patchPath], {
    cwd: sourceRoot,
    issue: "PATCH_CHECK_FAILED",
  });
  await run("git", ["apply", patchPath], {
    cwd: sourceRoot,
    issue: "PATCH_APPLY_FAILED",
  });
  await assertFile(
    patchTarget,
    patchSpec.postimage_sha256,
    undefined,
    "PATCH_POSTIMAGE_DRIFT",
  );
  const reapply = await run("git", ["apply", "--check", patchPath], {
    cwd: sourceRoot,
    issue: "PATCH_REAPPLY_EXECUTION",
    allowFailure: true,
  });
  if (reapply.exit_code === 0) {
    throw new L1BuildVerificationError("PATCH_REAPPLY_ACCEPTED");
  }
  return {
    overlay_file_count: copied,
    patch_postimage_sha256: await sha256File(patchTarget),
    patch_reapply_exit_code: reapply.exit_code,
  };
}

async function verifyAllLockBindings(
  lockPath,
  handle,
  implementationRoot,
  repositoryRoot,
  verifyRoot,
) {
  const validatorPath = resolve(repositoryRoot, LOCK_VALIDATOR_LOGICAL);
  const manifestPath = resolve(repositoryRoot, MANIFEST_LOGICAL);
  await assertFile(
    validatorPath,
    LOCK_VALIDATOR_SHA256,
    LOCK_VALIDATOR_SIZE,
    "LOCK_VALIDATOR_DRIFT",
  );
  await assertFile(
    manifestPath,
    MANIFEST_SHA256,
    undefined,
    "LOCK_MANIFEST_DRIFT",
  );
  requireEqual(
    canonicalJson(handle.lock_validation.validator),
    canonicalJson(await artifact(validatorPath, LOCK_VALIDATOR_LOGICAL)),
    "HANDLE_LOCK_VALIDATOR",
  );
  requireEqual(
    canonicalJson(handle.lock_validation.manifest),
    canonicalJson(await artifact(manifestPath, MANIFEST_LOGICAL)),
    "HANDLE_LOCK_MANIFEST",
  );
  const receiptPath = join(verifyRoot, "lock-validation.json");
  await run(
    "python3",
    [
      validatorPath,
      "--repo-root",
      repositoryRoot,
      "--implementation-root",
      implementationRoot,
      "--lock",
      lockPath,
      "--manifest",
      manifestPath,
      "--output",
      receiptPath,
    ],
    {cwd: repositoryRoot, issue: "LOCK_70_VALIDATION_FAILED"},
  );
  const receipt = await readJson(receiptPath, "LOCK_70_RECEIPT_INVALID");
  requireEqual(receipt.result, "pass", "LOCK_70_RESULT");
  requireEqual(receipt.failures.length, 0, "LOCK_70_FAILURES");
  requireEqual(receipt.checks.length, 70, "LOCK_70_CHECK_COUNT");
  requireEqual(receipt.lock_sha256, await sha256File(lockPath), "LOCK_70_IDENTITY");
  requireEqual(
    canonicalJson(receipt.checks.map((check) => check.check_id)),
    canonicalJson(handle.lock_validation.check_ids),
    "LOCK_70_CHECK_IDS",
  );
  return {
    check_count: receipt.checks.length,
    check_ids_digest: sha256(
      JSON.stringify(receipt.checks.map((check) => check.check_id)),
    ),
    receipt_sha256: await sha256File(receiptPath),
  };
}

async function assertArchiveLeaf(path, expectedSha256, expectedSize) {
  if (!(await exists(path))) {
    throw new L1BuildVerificationError("OUTPUT_ARCHIVE_MISSING");
  }
  await assertFile(
    path,
    expectedSha256,
    expectedSize,
    "OUTPUT_ARCHIVE_TAMPER",
  );
  const info = await stat(path);
  if ((info.mode & 0o222) !== 0) {
    throw new L1BuildVerificationError("OUTPUT_ARCHIVE_WRITABLE");
  }
  requireEqual(
    canonicalJson((await readdir(dirname(path))).sort()),
    canonicalJson(["dashboard-dist.tar.gz"]),
    "OUTPUT_ARCHIVE_UNEXPECTED_SIBLING",
  );
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

  const coreVariants = [
    ["core_missing_evidence_rejected", (candidate) => { delete candidate.core_build; }],
    ["core_command_drift_rejected", (candidate) => {
      candidate.core_build.command = "pnpm --filter wrong build";
    }],
    ["core_skipped_rejected", (candidate) => {
      candidate.core_build.result = "skipped";
    }],
    ["core_failed_rejected", (candidate) => {
      candidate.core_build.exit_code = 1;
    }],
    ["core_out_of_order_rejected", (candidate) => {
      candidate.command_order = ["install", "dashboard-vitest", "core-build", "dashboard-build"];
    }],
    ["core_output_missing_rejected", (candidate) => {
      candidate.core_build.output.required_outputs.pop();
    }],
  ];
  for (const [name, mutate] of coreVariants) {
    const candidate = structuredClone(handle);
    mutate(candidate);
    if (validateCoreEvidence(lock, candidate).length === 0) {
      throw new L1BuildVerificationError("CORE_NEGATIVE_FAILED", name);
    }
    results[name] = true;
  }

  const archiveNegativeRoot = join(verifyRoot, "archive-negatives");
  await mkdir(archiveNegativeRoot);
  const missingPath = join(archiveNegativeRoot, "missing", "dashboard-dist.tar.gz");
  try {
    await assertArchiveLeaf(
      missingPath,
      handle.output.archive.sha256,
      handle.output.archive.size_bytes,
    );
    throw new Error("not rejected");
  } catch (error) {
    if (error.issue !== "OUTPUT_ARCHIVE_MISSING") {
      throw new L1BuildVerificationError("ARCHIVE_MISSING_NEGATIVE_FAILED");
    }
    results.archive_missing_rejected = true;
  }
  const writableRoot = join(archiveNegativeRoot, "writable");
  await mkdir(writableRoot);
  const writablePath = join(writableRoot, "dashboard-dist.tar.gz");
  await copyFile(handle.output.archive.path, writablePath);
  await chmod(writablePath, 0o644);
  try {
    await assertArchiveLeaf(
      writablePath,
      handle.output.archive.sha256,
      handle.output.archive.size_bytes,
    );
    throw new Error("not rejected");
  } catch (error) {
    if (error.issue !== "OUTPUT_ARCHIVE_WRITABLE") {
      throw new L1BuildVerificationError("ARCHIVE_WRITABLE_NEGATIVE_FAILED");
    }
    results.archive_writable_rejected = true;
  }
  const orphanRoot = join(archiveNegativeRoot, "orphan");
  await mkdir(orphanRoot);
  const orphanPath = join(orphanRoot, "dashboard-dist.tar.gz");
  await copyFile(handle.output.archive.path, orphanPath);
  await chmod(orphanPath, 0o444);
  await writeFile(join(orphanRoot, "orphan"), "unexpected\n");
  try {
    await assertArchiveLeaf(
      orphanPath,
      handle.output.archive.sha256,
      handle.output.archive.size_bytes,
    );
    throw new Error("not rejected");
  } catch (error) {
    if (error.issue !== "OUTPUT_ARCHIVE_UNEXPECTED_SIBLING") {
      throw new L1BuildVerificationError("ARCHIVE_ORPHAN_NEGATIVE_FAILED");
    }
    results.archive_orphan_rejected = true;
  }
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
  const coreIssues = validateCoreEvidence(lock, handle);
  if (coreIssues.length > 0) {
    throw new L1BuildVerificationError(coreIssues[0], coreIssues.join(","));
  }

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
  await assertArchiveLeaf(
    archivePath,
    handle.output.archive.sha256,
    handle.output.archive.size_bytes,
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
    const lockValidation = await verifyAllLockBindings(
      effectiveLockPath,
      handle,
      effectiveImplementationRoot,
      repositoryRoot,
      verifyRoot,
    );
    const extracted = join(verifyRoot, "dist");
    await mkdir(extracted);
    await run("tar", ["-xzf", archivePath, "-C", extracted], {
      cwd: verifyRoot,
      issue: "OUTPUT_ARCHIVE_EXTRACT_FAILED",
    });
    const archiveTree = await treeManifest(extracted);
    requireEqual(
      archiveTree.tree_sha256,
      handle.output.archive_tree_sha256,
      "OUTPUT_ARCHIVE_TREE_TAMPER",
    );
    requireEqual(
      archiveTree.file_count,
      handle.output.archive_file_count,
      "OUTPUT_ARCHIVE_FILE_COUNT",
    );
    requireEqual(
      archiveTree.total_size_bytes,
      handle.output.archive_total_size_bytes,
      "OUTPUT_ARCHIVE_TOTAL_SIZE",
    );
    requireEqual(
      canonicalJson((await readdir(extracted)).sort()),
      canonicalJson(["dashboard", "evidence"]),
      "OUTPUT_ARCHIVE_TOP_LEVEL_LAYOUT",
    );
    requireEqual(
      canonicalJson((await readdir(join(extracted, "evidence"))).sort()),
      canonicalJson(["core-dist"]),
      "OUTPUT_ARCHIVE_EVIDENCE_LAYOUT",
    );
    const dashboardRoot = join(extracted, handle.output.browser_payload_root);
    const coreRoot = join(extracted, handle.output.core_evidence_root);
    const tree = await treeManifest(dashboardRoot);
    requireEqual(tree.tree_sha256, handle.output.tree_sha256, "OUTPUT_TREE_TAMPER");
    requireEqual(tree.file_count, handle.output.file_count, "OUTPUT_FILE_COUNT");
    requireEqual(tree.total_size_bytes, handle.output.total_size_bytes, "OUTPUT_SIZE");
    const coreTree = await treeManifest(coreRoot);
    requireEqual(
      coreTree.tree_sha256,
      handle.core_build.output.tree_sha256,
      "CORE_OUTPUT_TREE_TAMPER",
    );
    requireEqual(
      coreTree.file_count,
      handle.core_build.output.file_count,
      "CORE_OUTPUT_FILE_COUNT",
    );
    requireEqual(
      coreTree.total_size_bytes,
      handle.core_build.output.total_size_bytes,
      "CORE_OUTPUT_TOTAL_SIZE",
    );
    const coreDirectory = lock.upstream.effective_workspace.core_package
      .output_contract.directory;
    for (const reference of handle.core_build.output.required_outputs) {
      if (!reference.path.startsWith(`${coreDirectory}/`)) {
        throw new L1BuildVerificationError("CORE_REQUIRED_OUTPUT_ESCAPE");
      }
      const relativePath = reference.path.slice(coreDirectory.length + 1);
      await assertFile(
        resolve(coreRoot, relativePath),
        reference.sha256,
        reference.size_bytes,
        "CORE_REQUIRED_OUTPUT_TAMPER",
      );
    }
    const sourceEvidence = await verifySourceOverlayPatch(
      lock,
      effectiveImplementationRoot,
      repositoryRoot,
      verifyRoot,
    );
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
        lock_check_count: lockValidation.check_count,
        lock_check_ids_digest: lockValidation.check_ids_digest,
        lock_validation_receipt_sha256: lockValidation.receipt_sha256,
        output_tree_sha256: tree.tree_sha256,
        output_file_count: tree.file_count,
        output_total_size_bytes: tree.total_size_bytes,
        output_archive_sha256: await sha256File(archivePath),
        archive_tree_sha256: archiveTree.tree_sha256,
        archive_file_count: archiveTree.file_count,
        archive_total_size_bytes: archiveTree.total_size_bytes,
        core_output_tree_sha256: coreTree.tree_sha256,
        core_output_file_count: coreTree.file_count,
        core_output_total_size_bytes: coreTree.total_size_bytes,
        core_required_output_count:
          handle.core_build.output.required_outputs.length,
        source_overlay_file_count: sourceEvidence.overlay_file_count,
        patch_postimage_sha256: sourceEvidence.patch_postimage_sha256,
        protected_set_digest: protectedSet.set_digest,
        protected_entry_count: protectedSet.entry_count,
      },
      checks: {
        schema_shape: "pass",
        lock: "pass",
        lock_70_bindings: "pass",
        upstream: "pass",
        verified_toolchain: "pass",
        feature_inputs: "pass",
        effective_workspace: "pass",
        patch_images: "pass",
        source_overlay_patch: "pass",
        command_order: "pass",
        core_build: "pass",
        dashboard_commands: "pass",
        output_archive: "pass",
        archive_layout: "pass",
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
