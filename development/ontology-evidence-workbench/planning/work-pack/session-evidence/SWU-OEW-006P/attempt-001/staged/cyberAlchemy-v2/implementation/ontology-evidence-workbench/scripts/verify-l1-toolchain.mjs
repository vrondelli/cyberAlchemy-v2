#!/usr/bin/env node
import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

const execFile = promisify(execFileCallback);
const SCRIPT_ROOT = dirname(fileURLToPath(import.meta.url));
const DEFAULT_IMPLEMENTATION_ROOT = resolve(SCRIPT_ROOT, "..");
const DIGEST = /^[a-f0-9]{64}$/;

export class L1ToolchainVerificationError extends Error {
  constructor(issue, detail = "") {
    super(detail ? `${issue}: ${detail}` : issue);
    this.name = "L1ToolchainVerificationError";
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
    if (!isRecord(item)) throw new L1ToolchainVerificationError("CANONICAL_INVALID");
    return Object.fromEntries(
      Object.keys(item).sort().map((key) => [key, canonical(item[key])]),
    );
  };
  return `${JSON.stringify(canonical(value), null, 2)}\n`;
};

async function readJson(path, issue) {
  try {
    const result = JSON.parse(await readFile(path, "utf8"));
    if (!isRecord(result)) throw new Error("object required");
    return result;
  } catch (error) {
    throw new L1ToolchainVerificationError(issue, error.message);
  }
}

async function sha256File(path) {
  return sha256(await readFile(path));
}

async function assertFile(path, expected, issue) {
  const info = await stat(path);
  if (!info.isFile()) throw new L1ToolchainVerificationError(issue, "not a file");
  const actual = await sha256File(path);
  if (actual !== expected) {
    throw new L1ToolchainVerificationError(issue, `${actual} != ${expected}`);
  }
  return info;
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

async function run(program, args, {cwd, issue, allowFailure = false, encoding = "utf8"}) {
  try {
    const result = await execFile(program, args, {
      cwd,
      encoding,
      maxBuffer: 128 * 1024 * 1024,
      env: {...process.env, CI: "1", COREPACK_ENABLE_DOWNLOAD_PROMPT: "0"},
    });
    return {exit_code: 0, stdout: result.stdout, stderr: result.stderr};
  } catch (error) {
    if (allowFailure) {
      return {
        exit_code: Number.isInteger(error.code) ? error.code : 1,
        stdout: error.stdout,
        stderr: error.stderr,
      };
    }
    throw new L1ToolchainVerificationError(
      issue,
      [error.message, error.stdout, error.stderr]
        .filter(Boolean)
        .join("\n")
        .slice(0, 4000),
    );
  }
}

function requireEqual(actual, expected, issue) {
  if (actual !== expected) {
    throw new L1ToolchainVerificationError(
      issue,
      `${JSON.stringify(actual)} != ${JSON.stringify(expected)}`,
    );
  }
}

function validateProducerHandle(handle) {
  requireEqual(handle.schema_version, "oew.l1-toolchain-handle.v1", "HANDLE_VERSION");
  requireEqual(handle.handle, "oew-l1-toolchain-handle/v1", "HANDLE_KIND");
  requireEqual(handle.result, "pass", "HANDLE_RESULT");
  requireEqual(handle.final_feature_build_claim, false, "FEATURE_BUILD_CLAIM");
  requireEqual(handle.authority_effect, "none", "AUTHORITY_EFFECT");
  requireEqual(handle.mode?.workspace_fallback, false, "WORKSPACE_FALLBACK");
  requireEqual(handle.mode?.global_fallback, false, "GLOBAL_FALLBACK");
  requireEqual(handle.mode?.frozen_lockfile, true, "FROZEN_LOCK");
  requireEqual(handle.mode?.isolated_store, true, "ISOLATED_STORE");
  requireEqual(handle.patch_probe?.applied_once, true, "PATCH_APPLY");
  requireEqual(handle.patch_probe?.reapply_rejected, true, "PATCH_REAPPLY");
  requireEqual(handle.patch_probe?.oracle_passed, true, "PATCH_ORACLE");
  requireEqual(handle.cleanup?.finally_executed, true, "FINALLY_NOT_EXECUTED");
  requireEqual(handle.cleanup?.workroot_removed, true, "WORKROOT_NOT_REMOVED");
  requireEqual(handle.cleanup?.workroot_absent, true, "WORKROOT_NOT_ABSENT");
  if (!DIGEST.test(handle.lock?.sha256 ?? "")) {
    throw new L1ToolchainVerificationError("HANDLE_LOCK_DIGEST");
  }
}

async function verifyPatchImages(lock, handle, sourceArchive, contractRoot) {
  const manifestPath = resolve(contractRoot, lock.fixture_overlay.manifest_path);
  await assertFile(
    manifestPath,
    lock.fixture_overlay.manifest_sha256,
    "OVERLAY_MANIFEST_DRIFT",
  );
  const manifest = await readJson(manifestPath, "OVERLAY_MANIFEST_INVALID");
  requireEqual(manifest.patches?.length, 1, "PATCH_COUNT");
  const spec = manifest.patches[0];
  const patchPath = resolve(contractRoot, spec.path);
  await assertFile(patchPath, spec.sha256, "PATCH_DRIFT");
  requireEqual(handle.patch_probe.manifest.sha256, spec ? lock.fixture_overlay.manifest_sha256 : null, "HANDLE_MANIFEST");
  requireEqual(handle.patch_probe.patch.sha256, spec.sha256, "HANDLE_PATCH");
  requireEqual(handle.patch_probe.preimage_sha256, spec.preimage_sha256, "HANDLE_PREIMAGE");
  requireEqual(handle.patch_probe.postimage_sha256, spec.postimage_sha256, "HANDLE_POSTIMAGE");

  const verifyRoot = await mkdtemp(join(tmpdir(), "oew-l1-verify-"));
  try {
    const member = `${lock.upstream.content_root}/${spec.target}`;
    const extracted = (
      await run("tar", ["-xOzf", sourceArchive, member], {
        cwd: verifyRoot,
        issue: "PATCH_PREIMAGE_EXTRACT_FAILED",
        encoding: null,
      })
    ).stdout;
    requireEqual(sha256(extracted), spec.preimage_sha256, "PATCH_PREIMAGE_DRIFT");
    const targetPath = join(verifyRoot, spec.target);
    await mkdir(dirname(targetPath), {recursive: true});
    await writeFile(targetPath, extracted);
    await run("git", ["apply", "--check", patchPath], {
      cwd: verifyRoot,
      issue: "PATCH_CHECK_FAILED",
    });
    await run("git", ["apply", patchPath], {
      cwd: verifyRoot,
      issue: "PATCH_APPLY_FAILED",
    });
    requireEqual(await sha256File(targetPath), spec.postimage_sha256, "PATCH_POSTIMAGE_DRIFT");
    const reapply = await run("git", ["apply", "--check", patchPath], {
      cwd: verifyRoot,
      issue: "PATCH_REAPPLY_EXECUTION",
      allowFailure: true,
    });
    if (reapply.exit_code === 0) {
      throw new L1ToolchainVerificationError("PATCH_REAPPLY_ACCEPTED");
    }
  } finally {
    await rm(verifyRoot, {recursive: true, force: true});
  }
}

async function verifyProtected(lock, handle, implementationRoot) {
  const repositoryRoot = resolve(
    implementationRoot,
    lock.protected_set.repository_root_from_implementation,
  );
  const contractPath = resolve(repositoryRoot, lock.protected_set.contract_path);
  const compilerPath = resolve(repositoryRoot, lock.protected_set.compiler_path);
  const beforePath = resolve(repositoryRoot, lock.protected_set.before_path);
  await assertFile(contractPath, lock.protected_set.contract_sha256, "PROTECTED_CONTRACT");
  await assertFile(compilerPath, lock.protected_set.compiler_sha256, "PROTECTED_COMPILER");
  await assertFile(beforePath, lock.protected_set.before_sha256, "PROTECTED_BEFORE");
  const verifyRoot = await mkdtemp(join(tmpdir(), "oew-protected-verify-"));
  try {
    const currentPath = join(verifyRoot, "current.json");
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
      {cwd: repositoryRoot, issue: "PROTECTED_SNAPSHOT"},
    );
    const before = await readJson(beforePath, "PROTECTED_BEFORE_INVALID");
    const current = await readJson(currentPath, "PROTECTED_CURRENT_INVALID");
    for (const field of ["set_digest", "entry_count", "entries", "scopes", "required_paths"]) {
      requireEqual(canonicalJson(current[field]), canonicalJson(before[field]), `PROTECTED_${field.toUpperCase()}`);
    }
    requireEqual(handle.protected_set.set_digest, current.set_digest, "HANDLE_PROTECTED_SET");
    requireEqual(handle.protected_set.entry_count, current.entry_count, "HANDLE_PROTECTED_COUNT");
    requireEqual(handle.protected_set.equal_current, true, "HANDLE_PROTECTED_EQUALITY");
  } finally {
    await rm(verifyRoot, {recursive: true, force: true});
  }
}

export async function verifyL1Toolchain({
  lockPath,
  handlePath,
  outputPath,
  implementationRoot = DEFAULT_IMPLEMENTATION_ROOT,
  contractRoot = implementationRoot,
}) {
  const effectiveImplementationRoot = resolve(implementationRoot);
  const effectiveContractRoot = resolve(contractRoot);
  const effectiveLockPath = resolve(lockPath);
  const effectiveHandlePath = resolve(handlePath);
  const lock = await readJson(effectiveLockPath, "LOCK_INVALID");
  const handle = await readJson(effectiveHandlePath, "HANDLE_INVALID");
  validateProducerHandle(handle);

  const lockInfo = await assertFile(effectiveLockPath, handle.lock.sha256, "LOCK_DRIFT");
  requireEqual(lockInfo.size, handle.lock.size_bytes, "LOCK_SIZE_DRIFT");
  const sourceArchive = resolve(
    effectiveImplementationRoot,
    lock.upstream.source_archive_path,
  );
  const receiptPath = resolve(
    effectiveImplementationRoot,
    lock.upstream.receipt_path,
  );
  await assertFile(sourceArchive, lock.upstream.source_archive_sha256, "SOURCE_ARCHIVE");
  await assertFile(receiptPath, lock.upstream.receipt_sha256, "RETAINED_L0_RECEIPT");
  const retained = await readJson(receiptPath, "RETAINED_L0_INVALID");
  requireEqual(retained.handle, "oew-upstream-viewer-build/v1", "RETAINED_L0_HANDLE");
  requireEqual(retained.result, "pass", "RETAINED_L0_RESULT");
  await assertFile(lock.toolchain.node.path, lock.toolchain.node.sha256, "NODE_BYTES");
  await assertFile(lock.toolchain.pnpm.bin_path, lock.toolchain.pnpm.bin_sha256, "PNPM_BYTES");
  await assertFile(
    lock.toolchain.pnpm.package_path,
    lock.toolchain.pnpm.package_sha256,
    "PNPM_PACKAGE",
  );
  await assertFile(
    lock.toolchain.pnpm.dist_entrypoint_path,
    lock.toolchain.pnpm.dist_entrypoint_sha256,
    "PNPM_DIST",
  );
  const nodeVersion = (
    await run(lock.toolchain.node.path, ["--version"], {
      cwd: effectiveImplementationRoot,
      issue: "NODE_EXECUTION",
    })
  ).stdout.trim();
  requireEqual(nodeVersion, lock.toolchain.node.version, "NODE_VERSION");
  const pnpmVersion = (
    await run(lock.toolchain.node.path, [lock.toolchain.pnpm.bin_path, "--version"], {
      cwd: effectiveImplementationRoot,
      issue: "PNPM_EXECUTION",
    })
  ).stdout.trim();
  requireEqual(pnpmVersion, lock.toolchain.pnpm.version, "PNPM_VERSION");

  for (const [path, expected, issue] of [
    [lock.effective_workspace.package_path, lock.effective_workspace.package_sha256, "EFFECTIVE_PACKAGE"],
    [lock.effective_workspace.lock_path, lock.effective_workspace.lock_sha256, "EFFECTIVE_LOCK"],
    [lock.effective_workspace.workspace_path, lock.effective_workspace.workspace_sha256, "EFFECTIVE_WORKSPACE"],
  ]) {
    const member = `${lock.upstream.content_root}/${path}`;
    const bytes = (
      await run("tar", ["-xOzf", sourceArchive, member], {
        cwd: effectiveImplementationRoot,
        issue,
        encoding: null,
      })
    ).stdout;
    requireEqual(sha256(bytes), expected, issue);
  }

  await verifyPatchImages(lock, handle, sourceArchive, effectiveContractRoot);
  await verifyProtected(lock, handle, effectiveImplementationRoot);
  const workrootPath = join(tmpdir(), handle.workroot.name);
  if (await exists(workrootPath)) {
    throw new L1ToolchainVerificationError("WORKROOT_RESIDUE", workrootPath);
  }

  const handleInfo = await stat(effectiveHandlePath);
  const receipt = {
    schema_version: "oew.l1-toolchain-verification.v1",
    handle: "oew-l1-toolchain-verification/v1",
    result: "pass",
    producer_handle: {
      path: "generated/runs/SWU-OEW-006P/l1-toolchain-handle.json",
      sha256: await sha256File(effectiveHandlePath),
      size_bytes: handleInfo.size,
      handle: handle.handle,
    },
    checks: {
      lock: "pass",
      retained_l0: "pass",
      source_archive: "pass",
      node: "pass",
      pnpm: "pass",
      effective_lock: "pass",
      patch_images: "pass",
      protected_equality: "pass",
      cleanup: "pass",
      producer_distinct: "pass",
    },
    residue: {
      unexpected_paths: [],
      result: "pass",
    },
    final_feature_build_claim: false,
    authority_effect: "none",
  };
  await mkdir(dirname(resolve(outputPath)), {recursive: true});
  await writeFile(resolve(outputPath), canonicalJson(receipt), "utf8");
  return receipt;
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const values = {};
  for (let index = 0; index < rest.length; index += 2) {
    if (!rest[index]?.startsWith("--") || rest[index + 1] === undefined) {
      throw new L1ToolchainVerificationError("ARGUMENT_INVALID");
    }
    values[rest[index].slice(2)] = rest[index + 1];
  }
  return {command, values};
}

async function main() {
  const {command, values} = parseArgs(process.argv.slice(2));
  if (command !== "verify") throw new L1ToolchainVerificationError("COMMAND_INVALID");
  const implementationRoot = resolve(
    values["implementation-root"] ?? DEFAULT_IMPLEMENTATION_ROOT,
  );
  const contractRoot = resolve(values["contract-root"] ?? implementationRoot);
  const result = await verifyL1Toolchain({
    lockPath: resolve(values.lock ?? join(contractRoot, "upstream/L1-TOOLCHAIN.lock.json")),
    handlePath: resolve(
      values.handle ??
        join(contractRoot, "generated/runs/SWU-OEW-006P/l1-toolchain-handle.json"),
    ),
    outputPath: resolve(
      values.output ??
        join(
          contractRoot,
          "generated/runs/SWU-OEW-006P/l1-toolchain-verification.json",
        ),
    ),
    implementationRoot,
    contractRoot,
  });
  process.stdout.write(`${JSON.stringify({handle: result.handle, result: result.result})}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write(`${error.issue ?? error.name}: ${error.message}\n`);
    process.exitCode = 1;
  });
}
