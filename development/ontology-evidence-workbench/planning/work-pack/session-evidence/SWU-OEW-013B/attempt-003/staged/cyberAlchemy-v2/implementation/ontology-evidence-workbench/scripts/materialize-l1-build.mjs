#!/usr/bin/env node
import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  access,
  chmod,
  copyFile,
  cp,
  lstat,
  mkdir,
  readFile,
  readdir,
  readlink,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import {tmpdir} from "node:os";
import {basename, dirname, isAbsolute, join, relative, resolve} from "node:path";
import {promisify} from "node:util";
import {fileURLToPath, pathToFileURL} from "node:url";

const execFile = promisify(execFileCallback);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_ROOT = dirname(SCRIPT_PATH);
const DEFAULT_IMPLEMENTATION_ROOT = resolve(SCRIPT_ROOT, "..");
const COMMIT = "2cda14e89535049e49120198886bc0b82e9e630f";
const DIGEST = /^[a-f0-9]{64}$/;
const BUILD_HANDLE = "oew-l1-build-handle/v1";
const VERIFY_HANDLE = "oew-l1-build-verification/v1";
const LOGICAL_SCRIPT = "scripts/materialize-l1-build.mjs";
const RETAINED_ROOT = "/home/vrondelli/.cache/oew-l1-builds";
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
const DASHBOARD_PACKAGE = "@understand-anything/dashboard";
const COMMAND_ORDER = [
  "install",
  "core-build",
  "dashboard-vitest",
  "dashboard-build",
];

export class L1BuildError extends Error {
  constructor(issue, detail = "", metadata = {}) {
    super(detail ? `${issue}: ${detail}` : issue);
    this.name = "L1BuildError";
    this.issue = issue;
    this.detail = detail;
    Object.assign(this, metadata);
  }
}

const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export const sha256 = (value) =>
  createHash("sha256").update(value).digest("hex");

export const canonicalJson = (value) => {
  const canonical = (item) => {
    if (
      item === null ||
      typeof item === "string" ||
      typeof item === "boolean" ||
      (typeof item === "number" && Number.isFinite(item))
    ) return item;
    if (Array.isArray(item)) return item.map(canonical);
    if (!isRecord(item)) throw new L1BuildError("CANONICAL_VALUE_INVALID");
    return Object.fromEntries(
      Object.keys(item).sort().map((key) => [key, canonical(item[key])]),
    );
  };
  return `${JSON.stringify(canonical(value), null, 2)}\n`;
};

async function sha256File(path) {
  return sha256(await readFile(path));
}

async function pathExists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function readJson(path, issue) {
  try {
    const value = JSON.parse(await readFile(path, "utf8"));
    if (!isRecord(value)) throw new Error("object required");
    return value;
  } catch (error) {
    throw new L1BuildError(issue, error.message);
  }
}

function requireEqual(actual, expected, issue) {
  if (actual !== expected) {
    throw new L1BuildError(
      issue,
      `${JSON.stringify(actual)} != ${JSON.stringify(expected)}`,
    );
  }
}

function requireDigest(value, issue) {
  if (!DIGEST.test(value ?? "")) throw new L1BuildError(issue);
}

function requireContained(root, candidate, issue) {
  const rel = relative(resolve(root), resolve(candidate));
  if (rel === "" || rel === ".." || rel.startsWith("../") || isAbsolute(rel)) {
    throw new L1BuildError(issue, candidate);
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
  if (!info.isFile()) throw new L1BuildError(issue, "not a regular file");
  requireEqual(await sha256File(path), expectedSha256, issue);
  if (expectedSize !== undefined) requireEqual(info.size, expectedSize, issue);
  return info;
}

async function artifact(path, logicalPath = path) {
  const info = await stat(path);
  if (!info.isFile()) throw new L1BuildError("ARTIFACT_NOT_FILE", logicalPath);
  return {
    path: logicalPath,
    sha256: await sha256File(path),
    size_bytes: info.size,
  };
}

function commandText(program, args) {
  return [program, ...args].join(" ");
}

async function run(program, args, {cwd, issue, allowFailure = false, env}) {
  try {
    const result = await execFile(program, args, {
      cwd,
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
      env: env ?? process.env,
    });
    return {
      command: commandText(program, args),
      exit_code: 0,
      stdout_sha256: sha256(result.stdout),
      stderr_sha256: sha256(result.stderr),
      result: "pass",
    };
  } catch (error) {
    if (allowFailure) {
      return {
        command: commandText(program, args),
        exit_code: Number.isInteger(error.code) ? error.code : 1,
        stdout_sha256: sha256(String(error.stdout ?? "")),
        stderr_sha256: sha256(String(error.stderr ?? "")),
        result: "expected-failure",
      };
    }
    throw new L1BuildError(
      issue,
      [error.message, error.stdout, error.stderr]
        .filter(Boolean)
        .join("\n")
        .slice(0, 8000),
      {
        exit_code: Number.isInteger(error.code) ? error.code : 1,
        stdout_sha256: sha256(String(error.stdout ?? "")),
        stderr_sha256: sha256(String(error.stderr ?? "")),
      },
    );
  }
}

export function validateBuildLock(lock) {
  const issues = [];
  const check = (condition, issue) => {
    if (!condition) issues.push(issue);
  };
  check(lock?.schema_version === "oew.l1-build-lock.v1", "LOCK_VERSION");
  check(lock?.owner_swu === "SWU-OEW-013B", "LOCK_OWNER");
  check(lock?.upstream?.commit === COMMIT, "UPSTREAM_COMMIT");
  check(lock?.verified_toolchain?.producer_handle?.handle ===
    "oew-l1-toolchain-handle/v1", "TOOLCHAIN_HANDLE");
  check(lock?.verified_toolchain?.producer_handle?.result === "pass", "TOOLCHAIN_RESULT");
  check(lock?.verified_toolchain?.independent_verification?.handle ===
    "oew-l1-toolchain-verification/v1", "TOOLCHAIN_VERIFICATION_HANDLE");
  check(lock?.verified_toolchain?.independent_verification?.result === "pass",
    "TOOLCHAIN_VERIFICATION_RESULT");
  check(lock?.feature_inputs?.swu_007?.receipt?.result === "pass", "SWU007_RESULT");
  check(lock?.feature_inputs?.swu_008f?.receipt?.result === "pass", "SWU008F_RESULT");
  check(lock?.feature_inputs?.swu_007?.files?.length === 3, "SWU007_FILE_COUNT");
  check(lock?.feature_inputs?.swu_008f?.first_working_version_manifest?.target_count === 28,
    "SWU008F_TARGET_COUNT");
  check(lock?.feature_inputs?.swu_008f?.first_working_version_manifest?.bound_file_count === 27,
    "SWU008F_FILE_COUNT");
  const effective = lock?.upstream?.effective_workspace;
  check(effective?.package?.name === "understand-anything", "ROOT_PACKAGE_NAME");
  check(effective?.package?.prepare_script ===
    "pnpm --filter @understand-anything/core build", "ROOT_PREPARE_SCRIPT");
  check(effective?.core_package?.name === CORE_PACKAGE, "CORE_PACKAGE_NAME");
  check(effective?.core_package?.build_script === "tsc", "CORE_BUILD_SCRIPT");
  check(effective?.core_package?.output_contract?.directory ===
    "understand-anything-plugin/packages/core/dist", "CORE_OUTPUT_DIRECTORY");
  check(effective?.dashboard_package?.name === DASHBOARD_PACKAGE,
    "DASHBOARD_PACKAGE_NAME");
  const commands = lock?.execution_contract?.commands ?? [];
  check(
    canonicalJson(commands.map((command) => command.id)) ===
      canonicalJson(COMMAND_ORDER),
    "COMMAND_ORDER",
  );
  const coreCommand = commands.find((command) => command.id === "core-build");
  check(coreCommand?.command === "pnpm --filter @understand-anything/core build",
    "CORE_COMMAND");
  check(coreCommand?.expanded_script === "tsc", "CORE_EXPANDED_SCRIPT");
  check(coreCommand?.after === "install", "CORE_AFTER_INSTALL");
  check(coreCommand?.before === "dashboard-vitest", "CORE_BEFORE_VITEST");
  check(coreCommand?.expected_exit_code === 0, "CORE_EXPECTED_EXIT");
  check(coreCommand?.producer_evidence?.record_command === true,
    "CORE_RECORD_COMMAND");
  check(coreCommand?.producer_evidence?.record_exit_code === true,
    "CORE_RECORD_EXIT");
  check(coreCommand?.producer_evidence?.record_output_tree_digest === true,
    "CORE_RECORD_TREE");
  check(coreCommand?.producer_evidence?.required_output_paths?.length === 12,
    "CORE_REQUIRED_OUTPUT_COUNT");
  for (const field of ["frozen_lockfile", "ignore_scripts", "isolated_store"]) {
    check(lock?.execution_contract?.mode?.[field] === true, `MODE_${field.toUpperCase()}`);
  }
  for (const field of ["workspace_fallback", "global_fallback"]) {
    check(lock?.execution_contract?.mode?.[field] === false, `MODE_${field.toUpperCase()}`);
  }
  check(lock?.execution_contract?.mode?.kind === "online", "MODE_KIND");
  check(lock?.execution_contract?.workroot?.fresh === true, "WORKROOT_FRESH");
  check(lock?.execution_contract?.workroot?.digest_named === true, "WORKROOT_DIGEST");
  check(lock?.execution_contract?.workroot?.outside_repository === true, "WORKROOT_OUTSIDE");
  check(lock?.execution_contract?.workroot?.cleanup_in_finally === true, "CLEANUP_FINALLY");
  check(lock?.execution_contract?.output?.producer_handle?.handle === BUILD_HANDLE,
    "OUTPUT_HANDLE");
  check(lock?.execution_contract?.output?.independent_verification?.handle === VERIFY_HANDLE,
    "OUTPUT_VERIFICATION");
  check(lock?.execution_contract?.output?.independent_verification?.producer_distinct === true,
    "PRODUCER_DISTINCT");
  check(lock?.oe_workbench_registry?.mutation_forbidden === true, "PACKAGE_MUTATION");
  check(lock?.claims?.final_feature_build_claim === false, "UNEXECUTED_CLAIM");
  check(lock?.claims?.browser_acceptance_claim === false, "BROWSER_CLAIM");
  check(lock?.claims?.manual_ux_claim === false, "MANUAL_CLAIM");
  check(lock?.claims?.release_claim === false, "RELEASE_CLAIM");
  check(lock?.claims?.production_claim === false, "PRODUCTION_CLAIM");
  check(lock?.authority_effect === "none", "AUTHORITY_EFFECT");
  for (const value of [
    lock?.upstream?.lock?.sha256,
    lock?.upstream?.retained_build_receipt?.sha256,
    lock?.upstream?.source_archive?.sha256,
    lock?.upstream?.effective_workspace?.package?.sha256,
    lock?.upstream?.effective_workspace?.core_package?.sha256,
    lock?.upstream?.effective_workspace?.dashboard_package?.sha256,
    lock?.verified_toolchain?.lock?.sha256,
    lock?.verified_toolchain?.producer_handle?.sha256,
    lock?.verified_toolchain?.independent_verification?.sha256,
    lock?.feature_inputs?.swu_007?.receipt?.sha256,
    lock?.feature_inputs?.swu_008f?.receipt?.sha256,
    lock?.feature_inputs?.entrypoint_patch?.sha256,
    lock?.protected_set?.contract?.sha256,
    lock?.protected_set?.compiler?.sha256,
    lock?.protected_set?.current_baseline?.sha256,
  ]) check(DIGEST.test(value ?? ""), "LOCK_DIGEST_INVALID");
  return [...new Set(issues)].sort();
}

export function workrootName(lock) {
  return `oew-l1-build-${sha256(canonicalJson(lock)).slice(0, 16)}`;
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
        throw new L1BuildError("OUTPUT_SPECIAL_FILE", logical);
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

function stableCommandEvidence(result, command, expandedScript) {
  return {
    command,
    exit_code: result.exit_code,
    ...(expandedScript ? {expanded_script: expandedScript} : {}),
    result: result.result,
  };
}

function commandById(lock, id) {
  const command = lock.execution_contract.commands.find((item) => item.id === id);
  if (!command) throw new L1BuildError("COMMAND_MISSING", id);
  return command;
}

async function requiredCoreOutputs(lock, sourceRoot, coreTree) {
  const coreDirectory = lock.upstream.effective_workspace.core_package
    .output_contract.directory;
  const required = commandById(lock, "core-build")
    .producer_evidence.required_output_paths;
  const artifacts = [];
  for (const logicalPath of required) {
    if (!logicalPath.startsWith(`${coreDirectory}/`)) {
      throw new L1BuildError("CORE_REQUIRED_OUTPUT_ESCAPE", logicalPath);
    }
    const absolute = resolve(sourceRoot, logicalPath);
    requireContained(sourceRoot, absolute, "CORE_REQUIRED_OUTPUT_ESCAPE");
    const item = await artifact(absolute, logicalPath);
    const treePath = logicalPath.slice(coreDirectory.length + 1);
    const treeItem = coreTree.entries.find((entry) => entry.path === treePath);
    if (
      !treeItem ||
      treeItem.sha256 !== item.sha256 ||
      treeItem.size_bytes !== item.size_bytes
    ) throw new L1BuildError("CORE_REQUIRED_OUTPUT_TREE_MISMATCH", logicalPath);
    artifacts.push(item);
  }
  return artifacts;
}

async function verifyAllLockBindings(
  lockPath,
  implementationRoot,
  repositoryRoot,
  workroot,
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
  const receiptPath = join(workroot, "lock-validation.json");
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
    {
      cwd: repositoryRoot,
      issue: "LOCK_70_VALIDATION_FAILED",
    },
  );
  const receipt = await readJson(receiptPath, "LOCK_70_RECEIPT_INVALID");
  requireEqual(receipt.result, "pass", "LOCK_70_RESULT");
  requireEqual(receipt.failures.length, 0, "LOCK_70_FAILURES");
  requireEqual(receipt.checks.length, 70, "LOCK_70_CHECK_COUNT");
  requireEqual(receipt.lock_sha256, await sha256File(lockPath), "LOCK_70_IDENTITY");
  return {
    validator: await artifact(validatorPath, LOCK_VALIDATOR_LOGICAL),
    manifest: await artifact(manifestPath, MANIFEST_LOGICAL),
    receipt_sha256: await sha256File(receiptPath),
    check_count: receipt.checks.length,
    check_ids: receipt.checks.map((check) => check.check_id),
    result: "pass",
  };
}

async function verifyProtected(lock, implementationRoot, repositoryRoot, workroot) {
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
  const currentPath = join(workroot, "protected-current.json");
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
      `PROTECTED_${field.toUpperCase()}_DRIFT`,
    );
  }
  return {
    before: await artifact(beforePath, lock.protected_set.current_baseline.path),
    contract_sha256: lock.protected_set.contract.sha256,
    compiler_sha256: lock.protected_set.compiler.sha256,
    set_digest: current.set_digest,
    entry_count: current.entry_count,
    equal_current: true,
  };
}

async function verifyBoundArtifact(reference, implementationRoot, repositoryRoot, issue) {
  const path = resolveLogical(implementationRoot, repositoryRoot, reference.path);
  await assertFile(path, reference.sha256, reference.size_bytes, issue);
  return path;
}

function isolatedEnvironment(lock, workroot) {
  const nodeDirectory = dirname(lock.verified_toolchain.node.path);
  const env = {
    CI: "1",
    COREPACK_ENABLE_DOWNLOAD_PROMPT: "0",
    LANG: "C.UTF-8",
    PATH: `${nodeDirectory}:/usr/bin:/bin`,
    PNPM_HOME: join(workroot, "pnpm-home"),
    npm_config_cache: join(workroot, "npm-cache"),
    XDG_CACHE_HOME: join(workroot, "xdg-cache"),
    XDG_CONFIG_HOME: join(workroot, "xdg-config"),
    XDG_DATA_HOME: join(workroot, "xdg-data"),
    TMPDIR: join(workroot, "tmp"),
  };
  for (const key of ["HTTPS_PROXY", "HTTP_PROXY", "NO_PROXY", "SSL_CERT_FILE"]) {
    if (process.env[key]) env[key] = process.env[key];
  }
  return env;
}

async function assertDependencyLinksContained(sourceRoot, workroot) {
  const modulesRoot = join(sourceRoot, "node_modules");
  if (!(await pathExists(modulesRoot))) {
    throw new L1BuildError("NODE_MODULES_MISSING");
  }
  const stack = [modulesRoot];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const item of await readdir(current, {withFileTypes: true})) {
      const absolute = join(current, item.name);
      if (item.isDirectory()) stack.push(absolute);
      if (item.isSymbolicLink()) {
        const target = resolve(dirname(absolute), await readlink(absolute));
        requireContained(workroot, target, "DEPENDENCY_LINK_OUTSIDE_WORKROOT");
      }
    }
  }
}

async function copyFeatureInputs(lock, implementationRoot, repositoryRoot, sourceRoot) {
  const copied = [];
  const swu007 = lock.feature_inputs.swu_007;
  const manifest007Path = await verifyBoundArtifact(
    swu007.overlay_manifest,
    implementationRoot,
    repositoryRoot,
    "SWU007_MANIFEST_DRIFT",
  );
  const manifest007 = await readJson(manifest007Path, "SWU007_MANIFEST_INVALID");
  requireEqual(manifest007.schema_version, "oew.l1-feature-overlay.v1", "SWU007_MANIFEST_VERSION");
  for (const reference of swu007.files) {
    const source = await verifyBoundArtifact(
      reference,
      implementationRoot,
      repositoryRoot,
      "SWU007_FILE_DRIFT",
    );
    const destination = resolve(sourceRoot, reference.destination);
    requireContained(sourceRoot, destination, "SWU007_DESTINATION_ESCAPE");
    if (await pathExists(destination)) throw new L1BuildError("SWU007_DESTINATION_EXISTS");
    await mkdir(dirname(destination), {recursive: true});
    await copyFile(source, destination);
    await assertFile(
      destination,
      reference.sha256,
      reference.size_bytes,
      "SWU007_COPY_DRIFT",
    );
    copied.push(await artifact(source, reference.path));
  }

  const swu008f = lock.feature_inputs.swu_008f;
  const manifest008Path = await verifyBoundArtifact(
    swu008f.first_working_version_manifest,
    implementationRoot,
    repositoryRoot,
    "SWU008F_MANIFEST_DRIFT",
  );
  const manifest008 = await readJson(manifest008Path, "SWU008F_MANIFEST_INVALID");
  requireEqual(manifest008.handle, "oew-first-working-version-source/v1", "SWU008F_HANDLE");
  requireEqual(manifest008.target_count, 28, "SWU008F_TARGET_COUNT");
  requireEqual(manifest008.bound_file_count, 27, "SWU008F_FILE_COUNT");
  requireEqual(manifest008.files.length, 27, "SWU008F_FILES_LENGTH");
  const seen = new Set();
  for (const reference of manifest008.files) {
    if (seen.has(reference.path)) throw new L1BuildError("SWU008F_DUPLICATE_FILE");
    seen.add(reference.path);
    const source = await verifyBoundArtifact(
      reference,
      implementationRoot,
      repositoryRoot,
      "SWU008F_FILE_DRIFT",
    );
    copied.push(await artifact(source, reference.path));
    if (reference.role === "focused-runner") continue;
    const prefix = swu008f.bound_file_policy.overlay_source_prefix;
    if (!reference.path.startsWith(prefix)) {
      throw new L1BuildError("SWU008F_SOURCE_PREFIX", reference.path);
    }
    const relativeSource = reference.path.slice(prefix.length);
    const destination = resolve(
      sourceRoot,
      swu008f.bound_file_policy.overlay_destination_root,
      relativeSource,
    );
    requireContained(sourceRoot, destination, "SWU008F_DESTINATION_ESCAPE");
    if (await pathExists(destination)) throw new L1BuildError("SWU008F_DESTINATION_EXISTS");
    await mkdir(dirname(destination), {recursive: true});
    await copyFile(source, destination);
    await assertFile(
      destination,
      reference.sha256,
      reference.size_bytes,
      "SWU008F_COPY_DRIFT",
    );
  }
  return {
    swu_007_manifest: await artifact(manifest007Path, swu007.overlay_manifest.path),
    swu_008f_manifest: await artifact(
      manifest008Path,
      swu008f.first_working_version_manifest.path,
    ),
    files: copied,
  };
}

async function retainOutput(distPath, dashboardTree, coreDistPath, coreTree, workroot) {
  const archiveRoot = join(workroot, "retained-archive-root");
  await mkdir(archiveRoot);
  await cp(distPath, join(archiveRoot, "dashboard"), {
    recursive: true,
    dereference: false,
    preserveTimestamps: false,
  });
  await mkdir(join(archiveRoot, "evidence"));
  await cp(coreDistPath, join(archiveRoot, "evidence/core-dist"), {
    recursive: true,
    dereference: false,
    preserveTimestamps: false,
  });
  const archiveTree = await treeManifest(archiveRoot);
  const temporaryArchive = join(workroot, "dashboard-dist.tar.gz");
  await run(
    "tar",
    [
      "--sort=name",
      "--mtime=@0",
      "--owner=0",
      "--group=0",
      "--numeric-owner",
      "-czf",
      temporaryArchive,
      "-C",
      archiveRoot,
      ".",
    ],
    {cwd: workroot, issue: "OUTPUT_ARCHIVE_FAILED"},
  );
  const archiveDigest = await sha256File(temporaryArchive);
  const artifactDirectory = join(RETAINED_ROOT, dashboardTree.tree_sha256);
  const retainedArchive = join(artifactDirectory, "dashboard-dist.tar.gz");
  await mkdir(artifactDirectory, {recursive: true});
  const beforeEntries = (await readdir(artifactDirectory)).sort();
  if (
    beforeEntries.length > 1 ||
    (beforeEntries.length === 1 && beforeEntries[0] !== "dashboard-dist.tar.gz")
  ) throw new L1BuildError("RETAINED_ARCHIVE_UNEXPECTED_SIBLING");
  const preexisting = await pathExists(retainedArchive);
  if (preexisting) {
    requireEqual(
      await sha256File(retainedArchive),
      archiveDigest,
      "RETAINED_ARCHIVE_COLLISION",
    );
  } else {
    await copyFile(temporaryArchive, retainedArchive, fsConstants.COPYFILE_EXCL);
    await chmod(retainedArchive, 0o444);
  }
  const info = await stat(retainedArchive);
  if ((info.mode & 0o222) !== 0) throw new L1BuildError("RETAINED_ARCHIVE_WRITABLE");
  requireEqual(
    canonicalJson((await readdir(artifactDirectory)).sort()),
    canonicalJson(["dashboard-dist.tar.gz"]),
    "RETAINED_ARCHIVE_UNEXPECTED_SIBLING",
  );
  return {
    artifact: await artifact(retainedArchive, retainedArchive),
    archive_tree_sha256: archiveTree.tree_sha256,
    archive_file_count: archiveTree.file_count,
    archive_total_size_bytes: archiveTree.total_size_bytes,
    dashboard_tree_sha256: dashboardTree.tree_sha256,
    core_tree_sha256: coreTree.tree_sha256,
    disposition: preexisting ? "preexisting-identical" : "created",
  };
}

export async function materializeL1Build({
  lockPath,
  outputPath,
  evidencePath,
  implementationRoot = DEFAULT_IMPLEMENTATION_ROOT,
}) {
  const effectiveImplementationRoot = resolve(implementationRoot);
  const repositoryRoot = resolve(effectiveImplementationRoot, "../../..");
  const effectiveLockPath = resolve(lockPath);
  const lock = await readJson(effectiveLockPath, "LOCK_UNREADABLE");
  const issues = validateBuildLock(lock);
  if (issues.length > 0) throw new L1BuildError(issues[0], issues.join(","));

  const lockInfo = await stat(effectiveLockPath);
  const upstreamLockPath = await verifyBoundArtifact(
    lock.upstream.lock,
    effectiveImplementationRoot,
    repositoryRoot,
    "UPSTREAM_LOCK_DRIFT",
  );
  const retainedReceiptPath = await verifyBoundArtifact(
    lock.upstream.retained_build_receipt,
    effectiveImplementationRoot,
    repositoryRoot,
    "UPSTREAM_RECEIPT_DRIFT",
  );
  const sourceArchivePath = await verifyBoundArtifact(
    lock.upstream.source_archive,
    effectiveImplementationRoot,
    repositoryRoot,
    "SOURCE_ARCHIVE_DRIFT",
  );
  const retainedReceipt = await readJson(retainedReceiptPath, "UPSTREAM_RECEIPT_INVALID");
  requireEqual(retainedReceipt.handle, "oew-upstream-viewer-build/v1", "UPSTREAM_HANDLE");
  requireEqual(retainedReceipt.result, "pass", "UPSTREAM_RESULT");
  requireEqual(retainedReceipt.upstream?.commit, COMMIT, "UPSTREAM_RECEIPT_COMMIT");

  await verifyBoundArtifact(
    lock.verified_toolchain.lock,
    effectiveImplementationRoot,
    repositoryRoot,
    "TOOLCHAIN_LOCK_DRIFT",
  );
  const toolchainHandlePath = await verifyBoundArtifact(
    lock.verified_toolchain.producer_handle,
    effectiveImplementationRoot,
    repositoryRoot,
    "TOOLCHAIN_HANDLE_DRIFT",
  );
  const toolchainVerificationPath = await verifyBoundArtifact(
    lock.verified_toolchain.independent_verification,
    effectiveImplementationRoot,
    repositoryRoot,
    "TOOLCHAIN_VERIFICATION_DRIFT",
  );
  const toolchainHandle = await readJson(toolchainHandlePath, "TOOLCHAIN_HANDLE_INVALID");
  const toolchainVerification = await readJson(
    toolchainVerificationPath,
    "TOOLCHAIN_VERIFICATION_INVALID",
  );
  requireEqual(toolchainHandle.handle, "oew-l1-toolchain-handle/v1", "TOOLCHAIN_HANDLE_KIND");
  requireEqual(toolchainHandle.result, "pass", "TOOLCHAIN_HANDLE_RESULT");
  requireEqual(toolchainVerification.handle, "oew-l1-toolchain-verification/v1",
    "TOOLCHAIN_VERIFICATION_KIND");
  requireEqual(toolchainVerification.result, "pass", "TOOLCHAIN_VERIFICATION_RESULT");

  for (const [path, digest, size, issue] of [
    [
      lock.verified_toolchain.node.path,
      lock.verified_toolchain.node.sha256,
      undefined,
      "NODE_BYTES_DRIFT",
    ],
    [
      lock.verified_toolchain.pnpm.path,
      lock.verified_toolchain.pnpm.sha256,
      undefined,
      "PNPM_BYTES_DRIFT",
    ],
  ]) await assertFile(path, digest, size, issue);
  const nodeVersion = (
    await execFile(lock.verified_toolchain.node.path, ["--version"], {
      encoding: "utf8",
    })
  ).stdout.trim();
  requireEqual(nodeVersion, lock.verified_toolchain.node.version, "NODE_VERSION_DRIFT");
  const pnpmVersion = (
    await execFile(
      lock.verified_toolchain.node.path,
      [lock.verified_toolchain.pnpm.path, "--version"],
      {encoding: "utf8"},
    )
  ).stdout.trim();
  requireEqual(pnpmVersion, lock.verified_toolchain.pnpm.version, "PNPM_VERSION_DRIFT");

  for (const reference of [
    lock.feature_inputs.swu_007.receipt,
    lock.feature_inputs.swu_007.owner_closeout,
    lock.feature_inputs.swu_008f.receipt,
    lock.feature_inputs.swu_008f.owner_closeout,
  ]) {
    const path = await verifyBoundArtifact(
      reference,
      effectiveImplementationRoot,
      repositoryRoot,
      "PREDECESSOR_RECEIPT_DRIFT",
    );
    requireEqual((await readJson(path, "PREDECESSOR_RECEIPT_INVALID")).result, "pass",
      "PREDECESSOR_RESULT");
  }
  const packageRegistryPath = await verifyBoundArtifact(
    lock.oe_workbench_registry,
    effectiveImplementationRoot,
    repositoryRoot,
    "PACKAGE_REGISTRY_DRIFT",
  );
  const scriptSha256 = await sha256File(SCRIPT_PATH);
  const name = workrootName(lock);
  const workroot = join(tmpdir(), name);
  if (await pathExists(workroot)) throw new L1BuildError("WORKROOT_NOT_FRESH", workroot);
  await mkdir(workroot, {recursive: false});

  let body;
  let workrootRemoved = false;
  let terminalError;
  const diagnostic = {
    schema_version: "oew.l1-build-attempt.v1",
    swu_id: "SWU-OEW-013B",
    attempt: 3,
    lock_sha256: await sha256File(effectiveLockPath),
    workroot: {
      name,
      path: workroot,
      fresh: true,
      digest_named: true,
      outside_repository: true,
    },
    required_command_order: [...COMMAND_ORDER],
    gates: {},
    external_archive: {
      root: RETAINED_ROOT,
      created: false,
    },
    authority_effect: "none",
  };
  try {
    await mkdir(join(workroot, "tmp"), {recursive: true});
    const lockValidation = await verifyAllLockBindings(
      effectiveLockPath,
      effectiveImplementationRoot,
      repositoryRoot,
      workroot,
    );
    diagnostic.gates.lock_validation = {
      result: "pass",
      check_count: lockValidation.check_count,
      receipt_sha256: lockValidation.receipt_sha256,
    };
    await run("tar", ["-xzf", sourceArchivePath, "-C", workroot], {
      cwd: workroot,
      issue: "SOURCE_EXTRACT_FAILED",
    });
    const sourceRoot = resolve(workroot, lock.upstream.source_archive.content_root);
    requireContained(workroot, sourceRoot, "SOURCE_ROOT_ESCAPE");
    await access(sourceRoot);
    for (const [reference, issue] of [
      [lock.upstream.effective_workspace.package, "EFFECTIVE_PACKAGE_DRIFT"],
      [lock.upstream.effective_workspace.lock, "EFFECTIVE_LOCK_DRIFT"],
      [lock.upstream.effective_workspace.workspace, "EFFECTIVE_WORKSPACE_DRIFT"],
      [lock.upstream.effective_workspace.core_package, "CORE_PACKAGE_DRIFT"],
      [lock.upstream.effective_workspace.dashboard_package, "DASHBOARD_PACKAGE_DRIFT"],
    ]) {
      const path = resolve(sourceRoot, reference.path);
      requireContained(sourceRoot, path, "EFFECTIVE_PATH_ESCAPE");
      await assertFile(path, reference.sha256, reference.size_bytes, issue);
    }

    const environment = isolatedEnvironment(lock, workroot);
    const storePath = join(workroot, "pnpm-store");
    const installArgs = [
      lock.verified_toolchain.pnpm.path,
      "install",
      "--frozen-lockfile",
      "--ignore-scripts",
      "--store-dir",
      storePath,
    ];
    const install = await run(lock.verified_toolchain.node.path, installArgs, {
      cwd: sourceRoot,
      issue: "PNPM_INSTALL_FAILED",
      env: environment,
    });
    diagnostic.gates.install = stableCommandEvidence(
      install,
      commandById(lock, "install").command,
    );
    await assertDependencyLinksContained(sourceRoot, workroot);

    const featureInputs = await copyFeatureInputs(
      lock,
      effectiveImplementationRoot,
      repositoryRoot,
      sourceRoot,
    );
    const patchSpec = lock.feature_inputs.entrypoint_patch;
    const patchPath = await verifyBoundArtifact(
      patchSpec,
      effectiveImplementationRoot,
      repositoryRoot,
      "ENTRYPOINT_PATCH_DRIFT",
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
    if (reapply.exit_code === 0) throw new L1BuildError("PATCH_REAPPLY_ACCEPTED");

    const coreSpec = lock.upstream.effective_workspace.core_package;
    const coreCommand = commandById(lock, "core-build");
    const coreRun = await run(
      lock.verified_toolchain.node.path,
      [
        lock.verified_toolchain.pnpm.path,
        "--filter",
        coreSpec.name,
        "build",
      ],
      {cwd: sourceRoot, issue: "CORE_BUILD_FAILED", env: environment},
    );
    const coreDistPath = resolve(sourceRoot, coreSpec.output_contract.directory);
    requireContained(sourceRoot, coreDistPath, "CORE_OUTPUT_DIRECTORY_ESCAPE");
    const coreTree = await treeManifest(coreDistPath);
    if (coreTree.file_count === 0) throw new L1BuildError("CORE_OUTPUT_EMPTY");
    const coreOutputs = await requiredCoreOutputs(lock, sourceRoot, coreTree);
    diagnostic.gates.core_build = {
      ...stableCommandEvidence(
        coreRun,
        coreCommand.command,
        coreCommand.expanded_script,
      ),
      after: coreCommand.after,
      before: coreCommand.before,
      output_tree_sha256: coreTree.tree_sha256,
      output_file_count: coreTree.file_count,
      output_total_size_bytes: coreTree.total_size_bytes,
      required_output_count: coreOutputs.length,
      required_outputs: coreOutputs,
    };

    const testRun = await run(
      lock.verified_toolchain.node.path,
      [
        lock.verified_toolchain.pnpm.path,
        "--filter",
        lock.upstream.effective_workspace.dashboard_package.name,
        "test",
      ],
      {cwd: sourceRoot, issue: "DASHBOARD_VITEST_FAILED", env: environment},
    );
    diagnostic.gates.dashboard_vitest = stableCommandEvidence(
      testRun,
      commandById(lock, "dashboard-vitest").command,
    );
    const buildRun = await run(
      lock.verified_toolchain.node.path,
      [
        lock.verified_toolchain.pnpm.path,
        "--filter",
        lock.upstream.effective_workspace.dashboard_package.name,
        "build",
      ],
      {cwd: sourceRoot, issue: "DASHBOARD_BUILD_FAILED", env: environment},
    );
    const distPath = resolve(
      sourceRoot,
      lock.execution_contract.output.directory,
    );
    requireContained(sourceRoot, distPath, "OUTPUT_DIRECTORY_ESCAPE");
    const tree = await treeManifest(distPath);
    if (tree.file_count === 0) throw new L1BuildError("OUTPUT_EMPTY");
    const protectedSet = await verifyProtected(
      lock,
      effectiveImplementationRoot,
      repositoryRoot,
      workroot,
    );
    const retainedArchive = await retainOutput(
      distPath,
      tree,
      coreDistPath,
      coreTree,
      workroot,
    );
    diagnostic.external_archive = {
      root: RETAINED_ROOT,
      path: retainedArchive.artifact.path,
      sha256: retainedArchive.artifact.sha256,
      size_bytes: retainedArchive.artifact.size_bytes,
      created: retainedArchive.disposition === "created",
      disposition: retainedArchive.disposition,
      result: "pass",
    };

    body = {
      schema_version: "oew.l1-build-handle.v1",
      handle: BUILD_HANDLE,
      result: "pass",
      lock: {
        path: "upstream/L1-BUILD.lock.json",
        sha256: await sha256File(effectiveLockPath),
        size_bytes: lockInfo.size,
      },
      lock_validation: lockValidation,
      producer: {
        id: "materialize-l1-build",
        script: {
          path: LOGICAL_SCRIPT,
          sha256: scriptSha256,
        },
      },
      upstream: {
        commit: COMMIT,
        lock: await artifact(upstreamLockPath, lock.upstream.lock.path),
        source_archive: await artifact(
          sourceArchivePath,
          lock.upstream.source_archive.path,
        ),
        retained_l0_receipt: await artifact(
          retainedReceiptPath,
          lock.upstream.retained_build_receipt.path,
        ),
      },
      verified_toolchain: {
        producer_handle: await artifact(
          toolchainHandlePath,
          lock.verified_toolchain.producer_handle.path,
        ),
        independent_verification: await artifact(
          toolchainVerificationPath,
          lock.verified_toolchain.independent_verification.path,
        ),
        node: {
          version: nodeVersion,
          path: lock.verified_toolchain.node.path,
          sha256: lock.verified_toolchain.node.sha256,
        },
        pnpm: {
          version: pnpmVersion,
          path: lock.verified_toolchain.pnpm.path,
          sha256: lock.verified_toolchain.pnpm.sha256,
        },
      },
      feature_inputs: {
        swu_007_receipt: await artifact(
          resolveLogical(
            effectiveImplementationRoot,
            repositoryRoot,
            lock.feature_inputs.swu_007.receipt.path,
          ),
          lock.feature_inputs.swu_007.receipt.path,
        ),
        swu_008f_receipt: await artifact(
          resolveLogical(
            effectiveImplementationRoot,
            repositoryRoot,
            lock.feature_inputs.swu_008f.receipt.path,
          ),
          lock.feature_inputs.swu_008f.receipt.path,
        ),
        ...featureInputs,
        entrypoint_patch: await artifact(patchPath, patchSpec.path),
      },
      effective_workspace: {
        package: {...lock.upstream.effective_workspace.package},
        lock: {...lock.upstream.effective_workspace.lock},
        workspace: {...lock.upstream.effective_workspace.workspace},
        core_package: {...lock.upstream.effective_workspace.core_package},
        dashboard_package: {...lock.upstream.effective_workspace.dashboard_package},
      },
      mode: {...lock.execution_contract.mode},
      workroot: {
        name,
        digest_named: true,
        outside_repository: true,
        fresh: true,
      },
      install: {
        ...stableCommandEvidence(
          install,
          commandById(lock, "install").command,
        ),
      },
      core_build: {
        ...stableCommandEvidence(
          coreRun,
          coreCommand.command,
          coreCommand.expanded_script,
        ),
        after: coreCommand.after,
        before: coreCommand.before,
        output: {
          directory: coreSpec.output_contract.directory,
          tree_sha256: coreTree.tree_sha256,
          file_count: coreTree.file_count,
          total_size_bytes: coreTree.total_size_bytes,
          required_outputs: coreOutputs,
        },
      },
      command_order: [...COMMAND_ORDER],
      patch: {
        target: patchSpec.target,
        preimage_sha256: patchSpec.preimage_sha256,
        postimage_sha256: patchSpec.postimage_sha256,
        applied_once: true,
        reapply_rejected: true,
        reapply_exit_code: reapply.exit_code,
      },
      dashboard_test: {
        ...stableCommandEvidence(
          testRun,
          commandById(lock, "dashboard-vitest").command,
        ),
      },
      dashboard_build: {
        ...stableCommandEvidence(
          buildRun,
          commandById(lock, "dashboard-build").command,
          commandById(lock, "dashboard-build").expanded_script,
        ),
      },
      output: {
        directory: lock.execution_contract.output.directory,
        tree_sha256: tree.tree_sha256,
        file_count: tree.file_count,
        total_size_bytes: tree.total_size_bytes,
        archive: retainedArchive.artifact,
        archive_layout: "oew-l1-build-evidence/v1",
        browser_payload_root: "dashboard",
        core_evidence_root: "evidence/core-dist",
        archive_tree_sha256: retainedArchive.archive_tree_sha256,
        archive_file_count: retainedArchive.archive_file_count,
        archive_total_size_bytes: retainedArchive.archive_total_size_bytes,
        immutable: true,
        storage_class: "content-addressed-external-cache",
        content_addressed_path: true,
        creation_policy: "create-if-absent-after-digest-verification",
        overwrite_policy: "never-overwrite-existing-mismatched-bytes",
        expected_residue: "retained-for-SWU-OEW-014",
      },
      protected_set: protectedSet,
      cleanup: {
        finally_executed: true,
        workroot_removed: true,
        workroot_absent: true,
        store_absent: true,
        owned_ports: [],
        ports_open_after_cleanup: [],
      },
      residue: {
        unexpected_paths: [],
        expected_external_artifacts: [retainedArchive.artifact.path],
        retained: [
          retainedArchive.artifact.path,
          "generated/runs/SWU-OEW-013B/l1-build-handle.json",
        ],
        result: "pass",
      },
      package_registry: await artifact(packageRegistryPath, "package.json"),
      browser_acceptance_claim: false,
      manual_ux_claim: false,
      release_claim: false,
      production_claim: false,
      authority_effect: "none",
    };
    diagnostic.gates.dashboard_build = stableCommandEvidence(
      buildRun,
      commandById(lock, "dashboard-build").command,
      commandById(lock, "dashboard-build").expanded_script,
    );
    diagnostic.result = "pass";
  } catch (error) {
    terminalError = error;
    diagnostic.result = "block";
    diagnostic.failed_gate = error.issue ?? error.name;
    diagnostic.failure = {
      issue: error.issue ?? error.name,
      exit_code: error.exit_code ?? 1,
      stdout_sha256: error.stdout_sha256 ?? null,
      stderr_sha256: error.stderr_sha256 ?? null,
      detail: String(error.detail ?? error.message).slice(0, 8000),
    };
  } finally {
    await rm(workroot, {recursive: true, force: true});
    workrootRemoved = !(await pathExists(workroot));
    diagnostic.cleanup = {
      finally_executed: true,
      workroot_removed: workrootRemoved,
      workroot_absent: !(await pathExists(workroot)),
      store_absent: !(await pathExists(join(workroot, "pnpm-store"))),
      result: workrootRemoved ? "pass" : "block",
    };
    if (evidencePath) {
      await mkdir(dirname(resolve(evidencePath)), {recursive: true});
      await writeFile(resolve(evidencePath), canonicalJson(diagnostic), "utf8");
    }
  }
  if (terminalError) throw terminalError;
  if (!body) throw new L1BuildError("BUILD_DID_NOT_COMPLETE");
  body.cleanup.workroot_removed = workrootRemoved;
  body.cleanup.workroot_absent = !(await pathExists(workroot));
  body.cleanup.store_absent = !(await pathExists(join(workroot, "pnpm-store")));
  if (
    !body.cleanup.workroot_removed ||
    !body.cleanup.workroot_absent ||
    !body.cleanup.store_absent
  ) throw new L1BuildError("WORKROOT_RESIDUE");

  await mkdir(dirname(resolve(outputPath)), {recursive: true});
  await writeFile(resolve(outputPath), canonicalJson(body), "utf8");
  return body;
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const values = {};
  for (let index = 0; index < rest.length; index += 2) {
    if (!rest[index]?.startsWith("--") || rest[index + 1] === undefined) {
      throw new L1BuildError("ARGUMENT_INVALID");
    }
    values[rest[index].slice(2)] = rest[index + 1];
  }
  return {command, values};
}

async function main() {
  const {command, values} = parseArgs(process.argv.slice(2));
  if (command !== "build") throw new L1BuildError("COMMAND_INVALID");
  const implementationRoot = resolve(
    values["implementation-root"] ?? DEFAULT_IMPLEMENTATION_ROOT,
  );
  const lockPath = resolve(
    values.lock ?? join(implementationRoot, "upstream/L1-BUILD.lock.json"),
  );
  const outputPath = resolve(
    values.output ??
      join(
        implementationRoot,
        "generated/runs/SWU-OEW-013B/l1-build-handle.json",
      ),
  );
  const result = await materializeL1Build({
    lockPath,
    outputPath,
    evidencePath: values["evidence-output"]
      ? resolve(values["evidence-output"])
      : undefined,
    implementationRoot,
  });
  process.stdout.write(
    `${JSON.stringify({
      handle: result.handle,
      result: result.result,
      output: basename(outputPath),
      tree_sha256: result.output.tree_sha256,
    })}\n`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write(`${error.issue ?? error.name}: ${error.message}\n`);
    process.exitCode = 1;
  });
}
