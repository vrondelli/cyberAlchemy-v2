#!/usr/bin/env node
import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import {
  access,
  lstat,
  mkdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

const execFile = promisify(execFileCallback);
const SCRIPT_ROOT = dirname(fileURLToPath(import.meta.url));
const DEFAULT_IMPLEMENTATION_ROOT = resolve(SCRIPT_ROOT, "..");
const DIGEST = /^[a-f0-9]{64}$/;
const COMMIT = "2cda14e89535049e49120198886bc0b82e9e630f";

export class L1ToolchainError extends Error {
  constructor(issue, detail = "") {
    super(detail ? `${issue}: ${detail}` : issue);
    this.name = "L1ToolchainError";
    this.issue = issue;
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
      typeof item === "boolean"
    ) return item;
    if (typeof item === "number" && Number.isFinite(item)) return item;
    if (Array.isArray(item)) return item.map(canonical);
    if (!isRecord(item)) throw new L1ToolchainError("CANONICAL_VALUE_INVALID");
    return Object.fromEntries(
      Object.keys(item).sort().map((key) => [key, canonical(item[key])]),
    );
  };
  return `${JSON.stringify(canonical(value), null, 2)}\n`;
};

async function sha256File(path) {
  return sha256(await readFile(path));
}

async function artifact(path, logicalPath) {
  const info = await stat(path);
  if (!info.isFile()) throw new L1ToolchainError("ARTIFACT_NOT_FILE", logicalPath);
  return {
    path: logicalPath,
    sha256: await sha256File(path),
    size_bytes: info.size,
  };
}

function requireDigest(value, issue) {
  if (!DIGEST.test(value ?? "")) throw new L1ToolchainError(issue);
}

function requireExact(actual, expected, issue) {
  if (actual !== expected) {
    throw new L1ToolchainError(issue, `expected ${expected}, received ${actual}`);
  }
}

function requireKeys(value, keys, issue) {
  if (!isRecord(value)) throw new L1ToolchainError(issue);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new L1ToolchainError(issue, `keys ${actual.join(",")}`);
  }
}

export function validateToolchainLock(lock) {
  const issues = [];
  try {
    requireKeys(
      lock,
      [
        "schema_version",
        "upstream",
        "effective_workspace",
        "toolchain",
        "mode",
        "fixture_overlay",
        "protected_set",
        "output",
        "final_feature_build_claim",
        "authority_effect",
      ],
      "LOCK_ROOT_INVALID",
    );
    requireExact(lock.schema_version, "oew.l1-toolchain-lock.v1", "LOCK_VERSION");
    requireExact(lock.upstream?.commit, COMMIT, "UPSTREAM_COMMIT");
    requireDigest(lock.upstream?.lock_sha256, "UPSTREAM_LOCK_DIGEST");
    requireDigest(lock.upstream?.receipt_sha256, "UPSTREAM_RECEIPT_DIGEST");
    requireDigest(lock.upstream?.source_archive_sha256, "SOURCE_ARCHIVE_DIGEST");
    requireExact(
      lock.upstream?.content_root,
      `Understand-Anything-${COMMIT}`,
      "SOURCE_CONTENT_ROOT",
    );
    for (const field of ["package_sha256", "lock_sha256", "workspace_sha256"]) {
      requireDigest(lock.effective_workspace?.[field], `EFFECTIVE_${field}`);
    }
    requireExact(lock.toolchain?.node?.version, "v22.12.0", "NODE_VERSION");
    requireDigest(lock.toolchain?.node?.sha256, "NODE_DIGEST");
    requireExact(lock.toolchain?.pnpm?.version, "10.6.2", "PNPM_VERSION");
    requireDigest(lock.toolchain?.pnpm?.bin_sha256, "PNPM_BIN_DIGEST");
    requireDigest(lock.toolchain?.pnpm?.package_sha256, "PNPM_PACKAGE_DIGEST");
    requireDigest(
      lock.toolchain?.pnpm?.dist_entrypoint_sha256,
      "PNPM_DIST_DIGEST",
    );
    if (!isAbsolute(lock.toolchain?.node?.path ?? "")) {
      throw new L1ToolchainError("NODE_PATH_NOT_ABSOLUTE");
    }
    for (const field of ["bin_path", "package_path", "dist_entrypoint_path"]) {
      if (!isAbsolute(lock.toolchain?.pnpm?.[field] ?? "")) {
        throw new L1ToolchainError(`PNPM_${field.toUpperCase()}_NOT_ABSOLUTE`);
      }
    }
    requireExact(lock.mode?.kind, "online", "MODE_NOT_ADMITTED");
    for (const field of ["frozen_lockfile", "ignore_scripts", "isolated_store"]) {
      requireExact(lock.mode?.[field], true, `MODE_${field.toUpperCase()}`);
    }
    for (const field of ["workspace_fallback", "global_fallback"]) {
      requireExact(lock.mode?.[field], false, `MODE_${field.toUpperCase()}`);
    }
    requireDigest(lock.fixture_overlay?.manifest_sha256, "OVERLAY_DIGEST");
    requireDigest(lock.protected_set?.contract_sha256, "PROTECTED_CONTRACT_DIGEST");
    requireDigest(lock.protected_set?.compiler_sha256, "PROTECTED_COMPILER_DIGEST");
    requireDigest(lock.protected_set?.before_sha256, "PROTECTED_BEFORE_DIGEST");
    requireDigest(lock.protected_set?.set_digest, "PROTECTED_SET_DIGEST");
    requireExact(lock.output?.handle, "oew-l1-toolchain-handle/v1", "HANDLE_KIND");
    requireExact(
      lock.output?.verification,
      "oew-l1-toolchain-verification/v1",
      "VERIFICATION_KIND",
    );
    requireExact(lock.final_feature_build_claim, false, "FEATURE_BUILD_CLAIM");
    requireExact(lock.authority_effect, "none", "AUTHORITY_EFFECT");
  } catch (error) {
    issues.push(error.issue ?? "LOCK_INVALID");
  }
  return [...new Set(issues)].sort();
}

export function validateOverlayManifest(manifest) {
  const issues = [];
  if (
    !isRecord(manifest) ||
    manifest.schema_version !== "oew.l1-bootstrap-overlay.v1" ||
    manifest.overlay_id !== "oew-l1-bootstrap-probe" ||
    manifest.retained_in_feature_overlay !== false ||
    manifest.authority_effect !== "none" ||
    !Array.isArray(manifest.patches) ||
    manifest.patches.length !== 1
  ) {
    return ["OVERLAY_MANIFEST_INVALID"];
  }
  const patch = manifest.patches[0];
  for (const field of ["sha256", "preimage_sha256", "postimage_sha256"]) {
    if (!DIGEST.test(patch?.[field] ?? "")) issues.push(`OVERLAY_${field}`);
  }
  if (
    patch?.path !== "fixtures/l1-bootstrap-overlay/0000-bootstrap-probe.patch" ||
    patch?.target !== "README.md" ||
    typeof patch?.oracle?.contains_exactly_once !== "string"
  ) {
    issues.push("OVERLAY_PATCH_CONTRACT_INVALID");
  }
  return [...new Set(issues)].sort();
}

export function workrootName(lock) {
  return `oew-l1-toolchain-${sha256(canonicalJson(lock)).slice(0, 16)}`;
}

async function readJson(path, issue) {
  try {
    const value = JSON.parse(await readFile(path, "utf8"));
    if (!isRecord(value)) throw new Error("object required");
    return value;
  } catch (error) {
    throw new L1ToolchainError(issue, error.message);
  }
}

async function assertFile(path, expectedHash, expectedSize, issue) {
  const info = await stat(path);
  if (!info.isFile()) throw new L1ToolchainError(issue, "not a file");
  requireExact(await sha256File(path), expectedHash, issue);
  if (expectedSize !== undefined) requireExact(info.size, expectedSize, issue);
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

async function run(program, args, { cwd, issue, allowFailure = false, env = {} }) {
  try {
    const result = await execFile(program, args, {
      cwd,
      encoding: "utf8",
      maxBuffer: 128 * 1024 * 1024,
      env: {...process.env, CI: "1", COREPACK_ENABLE_DOWNLOAD_PROMPT: "0", ...env},
    });
    return {exit_code: 0, stdout: result.stdout.trim(), stderr: result.stderr.trim()};
  } catch (error) {
    if (allowFailure) {
      return {
        exit_code: Number.isInteger(error.code) ? error.code : 1,
        stdout: String(error.stdout ?? "").trim(),
        stderr: String(error.stderr ?? "").trim(),
      };
    }
    throw new L1ToolchainError(
      issue,
      [error.message, error.stdout, error.stderr].filter(Boolean).join("\n").slice(0, 4000),
    );
  }
}

function contained(root, candidate, issue) {
  const rel = relative(root, candidate);
  if (rel === "" || rel === ".." || rel.startsWith("../") || isAbsolute(rel)) {
    throw new L1ToolchainError(issue, candidate);
  }
}

async function verifyProtectedSet(lock, implementationRoot, workroot) {
  const repositoryRoot = resolve(
    implementationRoot,
    lock.protected_set.repository_root_from_implementation,
  );
  const contractPath = resolve(repositoryRoot, lock.protected_set.contract_path);
  const compilerPath = resolve(repositoryRoot, lock.protected_set.compiler_path);
  const beforePath = resolve(repositoryRoot, lock.protected_set.before_path);
  await assertFile(
    contractPath,
    lock.protected_set.contract_sha256,
    undefined,
    "PROTECTED_CONTRACT_DRIFT",
  );
  await assertFile(
    compilerPath,
    lock.protected_set.compiler_sha256,
    undefined,
    "PROTECTED_COMPILER_DRIFT",
  );
  await assertFile(
    beforePath,
    lock.protected_set.before_sha256,
    undefined,
    "PROTECTED_BEFORE_DRIFT",
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
  const before = await readJson(beforePath, "PROTECTED_BEFORE_INVALID");
  const current = await readJson(currentPath, "PROTECTED_CURRENT_INVALID");
  requireExact(current.set_digest, before.set_digest, "PROTECTED_SET_DRIFT");
  requireExact(current.entry_count, before.entry_count, "PROTECTED_COUNT_DRIFT");
  requireExact(
    canonicalJson(current.entries),
    canonicalJson(before.entries),
    "PROTECTED_ENTRY_DRIFT",
  );
  requireExact(
    canonicalJson(current.scopes),
    canonicalJson(before.scopes),
    "PROTECTED_SCOPE_DRIFT",
  );
  requireExact(
    canonicalJson(current.required_paths),
    canonicalJson(before.required_paths),
    "PROTECTED_REQUIRED_PATH_DRIFT",
  );
  return {
    before: await artifact(beforePath, lock.protected_set.before_path),
    contract_sha256: lock.protected_set.contract_sha256,
    compiler_sha256: lock.protected_set.compiler_sha256,
    set_digest: current.set_digest,
    entry_count: current.entry_count,
    equal_current: true,
  };
}

export async function materializeL1Toolchain({
  lockPath,
  outputPath,
  implementationRoot = DEFAULT_IMPLEMENTATION_ROOT,
  contractRoot = implementationRoot,
}) {
  const effectiveImplementationRoot = resolve(implementationRoot);
  const effectiveContractRoot = resolve(contractRoot);
  const effectiveLockPath = resolve(lockPath);
  const lock = await readJson(effectiveLockPath, "LOCK_UNREADABLE");
  const lockIssues = validateToolchainLock(lock);
  if (lockIssues.length > 0) {
    throw new L1ToolchainError(lockIssues[0], lockIssues.join(","));
  }

  const upstreamLockPath = resolve(effectiveImplementationRoot, lock.upstream.lock_path);
  const upstreamReceiptPath = resolve(
    effectiveImplementationRoot,
    lock.upstream.receipt_path,
  );
  const sourceArchivePath = resolve(
    effectiveImplementationRoot,
    lock.upstream.source_archive_path,
  );
  const overlayPath = resolve(
    effectiveContractRoot,
    lock.fixture_overlay.manifest_path,
  );
  await assertFile(
    upstreamLockPath,
    lock.upstream.lock_sha256,
    undefined,
    "UPSTREAM_LOCK_DRIFT",
  );
  await assertFile(
    upstreamReceiptPath,
    lock.upstream.receipt_sha256,
    undefined,
    "UPSTREAM_RECEIPT_DRIFT",
  );
  const retainedReceipt = await readJson(upstreamReceiptPath, "UPSTREAM_RECEIPT_INVALID");
  requireExact(retainedReceipt.handle, "oew-upstream-viewer-build/v1", "UPSTREAM_HANDLE");
  requireExact(retainedReceipt.result, "pass", "UPSTREAM_RESULT");
  requireExact(retainedReceipt.upstream?.commit, COMMIT, "UPSTREAM_RECEIPT_COMMIT");
  await assertFile(
    sourceArchivePath,
    lock.upstream.source_archive_sha256,
    lock.upstream.source_archive_size_bytes,
    "SOURCE_ARCHIVE_DRIFT",
  );
  await assertFile(
    lock.toolchain.node.path,
    lock.toolchain.node.sha256,
    lock.toolchain.node.size_bytes,
    "NODE_BYTES_DRIFT",
  );
  await assertFile(
    lock.toolchain.pnpm.bin_path,
    lock.toolchain.pnpm.bin_sha256,
    undefined,
    "PNPM_BIN_DRIFT",
  );
  await assertFile(
    lock.toolchain.pnpm.package_path,
    lock.toolchain.pnpm.package_sha256,
    undefined,
    "PNPM_PACKAGE_DRIFT",
  );
  await assertFile(
    lock.toolchain.pnpm.dist_entrypoint_path,
    lock.toolchain.pnpm.dist_entrypoint_sha256,
    undefined,
    "PNPM_DIST_DRIFT",
  );
  const nodeVersion = (
    await run(lock.toolchain.node.path, ["--version"], {
      cwd: effectiveImplementationRoot,
      issue: "NODE_EXECUTION_FAILED",
    })
  ).stdout;
  requireExact(nodeVersion, lock.toolchain.node.version, "NODE_VERSION_DRIFT");
  const pnpmVersion = (
    await run(lock.toolchain.node.path, [lock.toolchain.pnpm.bin_path, "--version"], {
      cwd: effectiveImplementationRoot,
      issue: "PNPM_EXECUTION_FAILED",
    })
  ).stdout;
  requireExact(pnpmVersion, lock.toolchain.pnpm.version, "PNPM_VERSION_DRIFT");

  await assertFile(
    overlayPath,
    lock.fixture_overlay.manifest_sha256,
    undefined,
    "OVERLAY_MANIFEST_DRIFT",
  );
  const overlay = await readJson(overlayPath, "OVERLAY_MANIFEST_UNREADABLE");
  const overlayIssues = validateOverlayManifest(overlay);
  if (overlayIssues.length > 0) {
    throw new L1ToolchainError(overlayIssues[0], overlayIssues.join(","));
  }
  const patchSpec = overlay.patches[0];
  const patchPath = resolve(effectiveContractRoot, patchSpec.path);
  await assertFile(patchPath, patchSpec.sha256, undefined, "PATCH_BYTES_DRIFT");

  const name = workrootName(lock);
  const workroot = join(tmpdir(), name);
  if (await pathExists(workroot)) {
    throw new L1ToolchainError("WORKROOT_NOT_FRESH", workroot);
  }
  await mkdir(workroot, {recursive: false});
  let body;
  let finallyExecuted = false;
  let workrootRemoved = false;
  try {
    await run("tar", ["-xzf", sourceArchivePath, "-C", workroot], {
      cwd: workroot,
      issue: "SOURCE_EXTRACT_FAILED",
    });
    const sourceRoot = resolve(workroot, lock.upstream.content_root);
    contained(workroot, sourceRoot, "SOURCE_ROOT_OUTSIDE_WORKROOT");
    await access(sourceRoot);
    const packagePath = resolve(sourceRoot, lock.effective_workspace.package_path);
    const effectiveLockfilePath = resolve(
      sourceRoot,
      lock.effective_workspace.lock_path,
    );
    const workspacePath = resolve(sourceRoot, lock.effective_workspace.workspace_path);
    await assertFile(
      packagePath,
      lock.effective_workspace.package_sha256,
      undefined,
      "EFFECTIVE_PACKAGE_DRIFT",
    );
    await assertFile(
      effectiveLockfilePath,
      lock.effective_workspace.lock_sha256,
      undefined,
      "EFFECTIVE_LOCK_DRIFT",
    );
    await assertFile(
      workspacePath,
      lock.effective_workspace.workspace_sha256,
      undefined,
      "EFFECTIVE_WORKSPACE_DRIFT",
    );

    const storePath = join(workroot, "pnpm-store");
    const pnpmHome = join(workroot, "pnpm-home");
    const installArgs = [
      lock.toolchain.pnpm.bin_path,
      "install",
      "--frozen-lockfile",
      "--ignore-scripts",
      "--store-dir",
      storePath,
    ];
    const install = await run(lock.toolchain.node.path, installArgs, {
      cwd: sourceRoot,
      issue: "PNPM_INSTALL_FAILED",
      env: {
        PNPM_HOME: pnpmHome,
        npm_config_cache: join(workroot, "npm-cache"),
        XDG_CACHE_HOME: join(workroot, "xdg-cache"),
        XDG_CONFIG_HOME: join(workroot, "xdg-config"),
        XDG_DATA_HOME: join(workroot, "xdg-data"),
      },
    });

    const targetPath = resolve(sourceRoot, patchSpec.target);
    contained(sourceRoot, targetPath, "PATCH_TARGET_OUTSIDE_SOURCE");
    requireExact(await sha256File(targetPath), patchSpec.preimage_sha256, "PATCH_PREIMAGE");
    await run("git", ["apply", "--check", patchPath], {
      cwd: sourceRoot,
      issue: "PATCH_CHECK_FAILED",
    });
    await run("git", ["apply", patchPath], {
      cwd: sourceRoot,
      issue: "PATCH_APPLY_FAILED",
    });
    requireExact(await sha256File(targetPath), patchSpec.postimage_sha256, "PATCH_POSTIMAGE");
    const reapply = await run("git", ["apply", "--check", patchPath], {
      cwd: sourceRoot,
      issue: "PATCH_REAPPLY_UNEXPECTED",
      allowFailure: true,
    });
    if (reapply.exit_code === 0) throw new L1ToolchainError("PATCH_REAPPLY_ACCEPTED");
    const targetText = await readFile(targetPath, "utf8");
    const marker = patchSpec.oracle.contains_exactly_once;
    requireExact(targetText.split(marker).length - 1, 1, "PATCH_ORACLE_FAILED");
    const protectedSet = await verifyProtectedSet(
      lock,
      effectiveImplementationRoot,
      workroot,
    );

    body = {
      schema_version: "oew.l1-toolchain-handle.v1",
      handle: lock.output.handle,
      result: "pass",
      lock: await artifact(effectiveLockPath, "upstream/L1-TOOLCHAIN.lock.json"),
      upstream: {
        commit: lock.upstream.commit,
        source_archive: await artifact(
          sourceArchivePath,
          lock.upstream.source_archive_path,
        ),
        retained_l0_receipt: await artifact(
          upstreamReceiptPath,
          lock.upstream.receipt_path,
        ),
      },
      effective_workspace: {
        package: {
          path: lock.effective_workspace.package_path,
          sha256: lock.effective_workspace.package_sha256,
        },
        lockfile: {
          path: lock.effective_workspace.lock_path,
          sha256: lock.effective_workspace.lock_sha256,
        },
        workspace: {
          path: lock.effective_workspace.workspace_path,
          sha256: lock.effective_workspace.workspace_sha256,
        },
      },
      toolchain: {
        node: {
          version: nodeVersion,
          path: lock.toolchain.node.path,
          sha256: lock.toolchain.node.sha256,
        },
        pnpm: {
          version: pnpmVersion,
          path: lock.toolchain.pnpm.bin_path,
          sha256: lock.toolchain.pnpm.bin_sha256,
        },
      },
      mode: {...lock.mode},
      workroot: {
        name,
        digest_named: true,
        outside_repository: true,
        fresh: true,
      },
      install: {
        command:
          "pnpm install --frozen-lockfile --ignore-scripts --store-dir <workroot>/pnpm-store",
        exit_code: install.exit_code,
        result: "pass",
      },
      patch_probe: {
        manifest: await artifact(overlayPath, lock.fixture_overlay.manifest_path),
        patch: await artifact(patchPath, patchSpec.path),
        target: patchSpec.target,
        preimage_sha256: patchSpec.preimage_sha256,
        postimage_sha256: patchSpec.postimage_sha256,
        applied_once: true,
        reapply_rejected: true,
        oracle_passed: true,
      },
      protected_set: protectedSet,
      residue: {
        temporary_removed: [
          name,
          `${name}/pnpm-store`,
          `${name}/${lock.upstream.content_root}`,
        ],
        retained: [
          lock.upstream.source_archive_path,
          lock.upstream.receipt_path,
          "generated/runs/SWU-OEW-006P/l1-toolchain-handle.json",
        ],
      },
      final_feature_build_claim: false,
      authority_effect: "none",
    };
  } finally {
    finallyExecuted = true;
    await rm(workroot, {recursive: true, force: false});
    workrootRemoved = !(await pathExists(workroot));
  }
  if (!body) throw new L1ToolchainError("MATERIALIZATION_DID_NOT_COMPLETE");
  body.cleanup = {
    finally_executed: finallyExecuted,
    workroot_removed: workrootRemoved,
    workroot_absent: !(await pathExists(workroot)),
  };
  if (!body.cleanup.workroot_absent) {
    throw new L1ToolchainError("WORKROOT_RESIDUE_RETAINED");
  }
  await mkdir(dirname(resolve(outputPath)), {recursive: true});
  await writeFile(resolve(outputPath), canonicalJson(body), "utf8");
  return body;
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const values = {};
  for (let index = 0; index < rest.length; index += 2) {
    const flag = rest[index];
    const value = rest[index + 1];
    if (!flag?.startsWith("--") || value === undefined) {
      throw new L1ToolchainError("ARGUMENT_INVALID", flag ?? "<missing>");
    }
    values[flag.slice(2)] = value;
  }
  return {command, values};
}

async function main() {
  const {command, values} = parseArgs(process.argv.slice(2));
  if (command !== "materialize") throw new L1ToolchainError("COMMAND_INVALID");
  const implementationRoot = resolve(
    values["implementation-root"] ?? DEFAULT_IMPLEMENTATION_ROOT,
  );
  const contractRoot = resolve(values["contract-root"] ?? implementationRoot);
  const lockPath = resolve(
    values.lock ?? join(contractRoot, "upstream/L1-TOOLCHAIN.lock.json"),
  );
  const outputPath = resolve(
    values.output ??
      join(
        contractRoot,
        "generated/runs/SWU-OEW-006P/l1-toolchain-handle.json",
      ),
  );
  const result = await materializeL1Toolchain({
    lockPath,
    outputPath,
    implementationRoot,
    contractRoot,
  });
  process.stdout.write(
    `${JSON.stringify({handle: result.handle, result: result.result, output: basename(outputPath)})}\n`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write(`${error.issue ?? error.name}: ${error.message}\n`);
    process.exitCode = 1;
  });
}
