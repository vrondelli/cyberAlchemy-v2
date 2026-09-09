#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import {
  access,
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

const execFile = promisify(execFileCallback);
const DIGEST = /^[a-f0-9]{64}$/;
const COMMIT = "2cda14e89535049e49120198886bc0b82e9e630f";
const REPOSITORY = "https://github.com/Egonex-AI/Understand-Anything";
const LICENSE_SHA256 =
  "24c4b35344840f1abaf3a3a4a44f5e29ee0e73b6bf25e42ef108e0afebd402bc";
const VIEWER_ROOT = "understand-anything-plugin/packages/viewer";
const SOURCE_PREFIX = `Understand-Anything-${COMMIT}/`;
const VIEWER_PREFIX = "understand-anything-viewer/";
const OUTPUT_FILES = Object.freeze([
  "build-receipt.json",
  "source.tar.gz",
  "viewer-dist.tar.gz",
]);
const EXPECTED_INSPECTED_FILES = Object.freeze([
  [
    "README.md",
    "b5f411781b131fd16cc712100dd5ffc3f97bb3e22a5aba5e2b14a549d42fc86a",
  ],
  [
    "LICENSE",
    "24c4b35344840f1abaf3a3a4a44f5e29ee0e73b6bf25e42ef108e0afebd402bc",
  ],
  [
    "understand-anything-plugin/packages/core/src/types.ts",
    "34ed1953e3fb688301457b2f240cddd7572e4e822c67230517e8d6c2b7290733",
  ],
  [
    "understand-anything-plugin/packages/core/src/schema.ts",
    "e043d70c2d4485fe717ccee9eb54ad4e36256fdafc0713999e7b9b345bbc7c97",
  ],
  [
    "understand-anything-plugin/packages/dashboard/package.json",
    "e0d64356b36013371d98f97d8b9ad389405c6995ce0a814b17cb51f1e5299bf6",
  ],
  [
    "understand-anything-plugin/packages/dashboard/src/App.tsx",
    "91db4c86cc6ad515c5244cd34a4e0a3066d8709fbfa868f0629698160e9dc681",
  ],
  [
    "understand-anything-plugin/packages/dashboard/vite.config.ts",
    "308cdd59979d43b3480169708c128534c87185d0861c1ac96b534b252e182919",
  ],
  [
    "understand-anything-plugin/packages/viewer/README.md",
    "8c80d59d9f1a3a1936bc09ae971ff6d6f51d2535ca05e9d576702b1c84450db8",
  ],
]);

const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const uniqueSorted = (values) => [...new Set(values)].sort();

export class UpstreamBuildError extends Error {
  constructor(issue, detail = "") {
    super(detail ? `${issue}: ${detail}` : issue);
    this.name = "UpstreamBuildError";
    this.issue = issue;
  }
}

async function sha256File(path) {
  return sha256(await readFile(path));
}

function normalizeRepository(value) {
  return String(value ?? "")
    .replace(/^git\+/, "")
    .replace(/\.git$/, "")
    .replace(/\/$/, "");
}

function canonicalJson(value) {
  const canonical = (item) => {
    if (item === null || typeof item === "string" || typeof item === "boolean") return item;
    if (typeof item === "number" && Number.isFinite(item)) return Object.is(item, -0) ? 0 : item;
    if (Array.isArray(item)) return item.map(canonical);
    if (!isRecord(item)) throw new UpstreamBuildError("CANONICAL_VALUE_INVALID");
    return Object.fromEntries(
      Object.keys(item).sort().map((key) => [key, canonical(item[key])]),
    );
  };
  return `${JSON.stringify(canonical(value), null, 2)}\n`;
}

export function validateUpstreamLock(lock) {
  const issues = [];
  if (!isRecord(lock)) return ["LOCK_INVALID"];
  if (lock.schema_version !== "oew.upstream-lock.v1") {
    issues.push("LOCK_VERSION_UNSUPPORTED");
  }
  if (lock.repository !== REPOSITORY) issues.push("REPOSITORY_PIN_INVALID");
  if (lock.commit !== COMMIT || !/^[a-f0-9]{40}$/.test(lock.commit ?? "")) {
    issues.push("COMMIT_PIN_INVALID");
  }
  for (const floatingField of ["branch", "tag", "ref", "latest"]) {
    if (Object.hasOwn(lock, floatingField)) {
      issues.push(`FLOATING_PIN_FORBIDDEN:${floatingField}`);
    }
  }
  if (
    !isRecord(lock.license) ||
    lock.license.id !== "MIT" ||
    lock.license.path !== "LICENSE" ||
    lock.license.sha256 !== LICENSE_SHA256
  ) {
    issues.push("LICENSE_PIN_INVALID");
  }
  const inspected = Array.isArray(lock.inspected_files)
    ? lock.inspected_files.map((entry) => [entry?.path, entry?.sha256])
    : [];
  if (JSON.stringify(inspected) !== JSON.stringify(EXPECTED_INSPECTED_FILES)) {
    issues.push("INSPECTED_FILE_PINS_INVALID");
  }
  if (
    !isRecord(lock.package_manager) ||
    lock.package_manager.name !== "pnpm" ||
    lock.package_manager.version !== "10.6.2" ||
    lock.package_manager.lockfile !== "pnpm-lock.yaml"
  ) {
    issues.push("PACKAGE_MANAGER_PIN_INVALID");
  }
  if (
    !isRecord(lock.viewer) ||
    lock.viewer.package !== "understand-anything-viewer" ||
    lock.viewer.version !== "2.9.4" ||
    lock.viewer.build_command !== "pnpm --filter understand-anything-viewer build" ||
    JSON.stringify(lock.viewer.included_paths) !==
      JSON.stringify(["package.json", "README.md", "bin", "dist"])
  ) {
    issues.push("VIEWER_BUILD_PIN_INVALID");
  }
  if (
    !isRecord(lock.artifacts) ||
    lock.artifacts.source !== "source.tar.gz" ||
    lock.artifacts.viewer !== "viewer-dist.tar.gz" ||
    lock.artifacts.receipt !== "build-receipt.json"
  ) {
    issues.push("ARTIFACT_CONTRACT_INVALID");
  }
  if (lock.authority_effect !== "none") issues.push("AUTHORITY_EFFECT_FORBIDDEN");
  return uniqueSorted(issues);
}

async function run(program, args, { cwd, issue }) {
  try {
    const result = await execFile(program, args, {
      cwd,
      encoding: "utf8",
      maxBuffer: 128 * 1024 * 1024,
      env: {
        ...process.env,
        CI: "1",
        COREPACK_ENABLE_DOWNLOAD_PROMPT: "0",
      },
    });
    return {
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim(),
    };
  } catch (error) {
    const detail = [
      error?.message,
      error?.stdout,
      error?.stderr,
    ].filter(Boolean).join("\n").slice(0, 4000);
    throw new UpstreamBuildError(issue, detail);
  }
}

async function fileInventory(root) {
  const rows = [];
  async function visit(current, relativePath = "") {
    for (const name of (await readdir(current)).sort()) {
      const absolute = join(current, name);
      const child = relativePath ? `${relativePath}/${name}` : name;
      const info = await lstat(absolute);
      if (info.isSymbolicLink()) {
        throw new UpstreamBuildError("VIEWER_SYMLINK_FORBIDDEN", child);
      }
      if (info.isDirectory()) {
        await visit(absolute, child);
      } else if (info.isFile()) {
        rows.push({
          path: child,
          sha256: await sha256File(absolute),
          size_bytes: info.size,
        });
      } else {
        throw new UpstreamBuildError("VIEWER_FILE_TYPE_FORBIDDEN", child);
      }
    }
  }
  await visit(root);
  return rows;
}

async function makeSourceArchive(source, destination, workRoot, label) {
  const tarPath = join(workRoot, `${label}.tar`);
  await run(
    "git",
    [
      "archive",
      "--format=tar",
      `--prefix=${SOURCE_PREFIX}`,
      `--output=${tarPath}`,
      COMMIT,
    ],
    { cwd: source, issue: "SOURCE_ARCHIVE_FAILED" },
  );
  await run("gzip", ["-n", "-9", "--force", tarPath], {
    cwd: source,
    issue: "SOURCE_GZIP_FAILED",
  });
  await rename(`${tarPath}.gz`, destination);
}

async function makeViewerArchive(viewerRoot, destination, workRoot, label) {
  const tarPath = join(workRoot, `${label}.tar`);
  await run(
    "tar",
    [
      "--sort=name",
      "--mtime=@0",
      "--owner=0",
      "--group=0",
      "--numeric-owner",
      "--format=posix",
      "--pax-option=delete=atime,delete=ctime",
      `--transform=s,^,${VIEWER_PREFIX},`,
      "-cf",
      tarPath,
      "package.json",
      "README.md",
      "bin",
      "dist",
    ],
    { cwd: viewerRoot, issue: "VIEWER_ARCHIVE_FAILED" },
  );
  await run("gzip", ["-n", "-9", "--force", tarPath], {
    cwd: viewerRoot,
    issue: "VIEWER_GZIP_FAILED",
  });
  await rename(`${tarPath}.gz`, destination);
}

async function loadLock(lockPath) {
  let lock;
  try {
    lock = JSON.parse(await readFile(lockPath, "utf8"));
  } catch {
    throw new UpstreamBuildError("LOCK_UNREADABLE");
  }
  const issues = validateUpstreamLock(lock);
  if (issues.length > 0) throw new UpstreamBuildError(issues[0], issues.join(","));
  return lock;
}

function ensureContained(root, candidate) {
  const path = relative(root, candidate);
  if (
    path === "" ||
    path === ".." ||
    path.startsWith(`..${sep}`) ||
    isAbsolute(path)
  ) {
    throw new UpstreamBuildError("PATH_OUTSIDE_ROOT", candidate);
  }
}

async function requireEmptyOutput(outputDirectory) {
  await mkdir(outputDirectory, { recursive: true });
  const entries = await readdir(outputDirectory);
  if (entries.length > 0) {
    throw new UpstreamBuildError("OUTPUT_ALREADY_EXISTS", outputDirectory);
  }
}

export async function buildPinnedUpstream({
  lockPath,
  outputDirectory,
  onPhase = async () => {},
}) {
  const lock = await loadLock(resolve(lockPath));
  const output = resolve(outputDirectory);
  await requireEmptyOutput(output);
  const workRoot = await mkdtemp(join(tmpdir(), "oew-upstream-build-"));
  const source = join(workRoot, "source");
  const sourceFirst = join(workRoot, "source-first.tar.gz");
  const sourceSecond = join(workRoot, "source-second.tar.gz");
  const viewerFirst = join(workRoot, "viewer-first.tar.gz");
  const viewerSecond = join(workRoot, "viewer-second.tar.gz");
  const sourceOutput = join(output, lock.artifacts.source);
  const viewerOutput = join(output, lock.artifacts.viewer);
  const receiptOutput = join(output, lock.artifacts.receipt);

  try {
    await onPhase({ phase: "output-created" });
    await run("git", ["clone", "--no-checkout", lock.repository, source], {
      cwd: workRoot,
      issue: "UPSTREAM_CLONE_FAILED",
    });
    await run("git", ["checkout", "--detach", lock.commit], {
      cwd: source,
      issue: "UPSTREAM_CHECKOUT_FAILED",
    });
    const head = (await run("git", ["rev-parse", "HEAD"], {
      cwd: source,
      issue: "UPSTREAM_HEAD_FAILED",
    })).stdout;
    const remote = (await run("git", ["remote", "get-url", "origin"], {
      cwd: source,
      issue: "UPSTREAM_REMOTE_FAILED",
    })).stdout;
    if (head !== lock.commit) throw new UpstreamBuildError("UPSTREAM_HEAD_MISMATCH");
    if (normalizeRepository(remote) !== lock.repository) {
      throw new UpstreamBuildError("UPSTREAM_REMOTE_MISMATCH");
    }

    const fileVerifications = [];
    for (const entry of lock.inspected_files) {
      const path = resolve(source, entry.path);
      ensureContained(source, path);
      const actual = await sha256File(path);
      if (actual !== entry.sha256) {
        throw new UpstreamBuildError("UPSTREAM_FILE_DIGEST_MISMATCH", entry.path);
      }
      fileVerifications.push({
        path: entry.path,
        sha256: actual,
        result: "pass",
      });
    }
    await onPhase({ phase: "pin-verified" });

    await makeSourceArchive(source, sourceFirst, workRoot, "source-a");
    await makeSourceArchive(source, sourceSecond, workRoot, "source-b");
    const sourceFirstSha = await sha256File(sourceFirst);
    if (sourceFirstSha !== await sha256File(sourceSecond)) {
      throw new UpstreamBuildError("SOURCE_ARCHIVE_NONDETERMINISTIC");
    }
    await copyFile(sourceFirst, sourceOutput);
    await onPhase({ phase: "source-archive-written" });

    const nodeVersion = process.version;
    const gitVersion = (await run("git", ["--version"], {
      cwd: source,
      issue: "GIT_VERSION_FAILED",
    })).stdout;
    const pnpmVersion = (await run("corepack", ["pnpm", "--version"], {
      cwd: source,
      issue: "PNPM_VERSION_FAILED",
    })).stdout;
    if (pnpmVersion !== lock.package_manager.version) {
      throw new UpstreamBuildError("PNPM_VERSION_MISMATCH", pnpmVersion);
    }

    const commands = [
      {
        id: "install",
        display: "pnpm install --frozen-lockfile",
        args: ["pnpm", "install", "--frozen-lockfile"],
      },
      {
        id: "core-tests",
        display: "pnpm --filter @understand-anything/core test",
        args: ["pnpm", "--filter", "@understand-anything/core", "test"],
      },
      {
        id: "dashboard-tests",
        display: "pnpm --filter @understand-anything/dashboard test",
        args: ["pnpm", "--filter", "@understand-anything/dashboard", "test"],
      },
      {
        id: "viewer-build",
        display: lock.viewer.build_command,
        args: ["pnpm", "--filter", "understand-anything-viewer", "build"],
      },
    ];
    const commandReceipts = [];
    for (const command of commands) {
      await run("corepack", command.args, {
        cwd: source,
        issue: `UPSTREAM_${command.id.toUpperCase().replaceAll("-", "_")}_FAILED`,
      });
      commandReceipts.push({
        id: command.id,
        command: command.display,
        exit_code: 0,
        result: "pass",
      });
    }

    const trackedChanges = (await run(
      "git",
      ["status", "--porcelain", "--untracked-files=no"],
      { cwd: source, issue: "UPSTREAM_STATUS_FAILED" },
    )).stdout.split("\n").filter(Boolean);
    if (trackedChanges.length > 0) {
      throw new UpstreamBuildError("UPSTREAM_TRACKED_SOURCE_MODIFIED");
    }

    const viewerRoot = join(source, VIEWER_ROOT);
    const viewerPackage = JSON.parse(
      await readFile(join(viewerRoot, "package.json"), "utf8"),
    );
    if (
      viewerPackage.name !== lock.viewer.package ||
      viewerPackage.version !== lock.viewer.version
    ) {
      throw new UpstreamBuildError("VIEWER_PACKAGE_MISMATCH");
    }
    for (const path of [
      "bin/viewer.mjs",
      "bin/dist/staleness.js",
      "dist/index.html",
    ]) {
      await access(join(viewerRoot, path));
    }
    const selectedRoot = join(workRoot, "viewer-selected");
    await mkdir(selectedRoot);
    for (const path of lock.viewer.included_paths) {
      const sourcePath = join(viewerRoot, path);
      const destinationPath = join(selectedRoot, path);
      const sourceStat = await stat(sourcePath);
      if (sourceStat.isDirectory()) {
        await run("cp", ["-a", sourcePath, destinationPath], {
          cwd: viewerRoot,
          issue: "VIEWER_STAGE_FAILED",
        });
      } else {
        await copyFile(sourcePath, destinationPath);
      }
    }
    const viewerFiles = await fileInventory(selectedRoot);
    await makeViewerArchive(selectedRoot, viewerFirst, workRoot, "viewer-a");
    await makeViewerArchive(selectedRoot, viewerSecond, workRoot, "viewer-b");
    const viewerFirstSha = await sha256File(viewerFirst);
    if (viewerFirstSha !== await sha256File(viewerSecond)) {
      throw new UpstreamBuildError("VIEWER_ARCHIVE_NONDETERMINISTIC");
    }
    await copyFile(viewerFirst, viewerOutput);
    await onPhase({ phase: "viewer-archive-written" });

    const sourceInfo = await stat(sourceOutput);
    const viewerInfo = await stat(viewerOutput);
    const receipt = {
      schema_version: "oew.upstream-build-receipt.v1",
      state: "receipt-complete",
      result: "pass",
      handle: "oew-upstream-viewer-build/v1",
      upstream: {
        repository: lock.repository,
        observed_remote: normalizeRepository(remote),
        commit: head,
        license: {
          id: lock.license.id,
          sha256: lock.license.sha256,
        },
        inspected_files: fileVerifications,
        tracked_changes_after_build: trackedChanges,
      },
      toolchain: {
        node: nodeVersion,
        pnpm: pnpmVersion,
        git: gitVersion,
        lockfile: lock.package_manager.lockfile,
      },
      commands: commandReceipts,
      artifacts: [
        {
          path: lock.artifacts.source,
          sha256: sourceFirstSha,
          size_bytes: sourceInfo.size,
          content_root: SOURCE_PREFIX,
        },
        {
          path: lock.artifacts.viewer,
          sha256: viewerFirstSha,
          size_bytes: viewerInfo.size,
          content_root: VIEWER_PREFIX,
          entrypoint: `${VIEWER_PREFIX}bin/viewer.mjs`,
        },
      ],
      viewer_artifact: {
        package: viewerPackage.name,
        version: viewerPackage.version,
        files: viewerFiles,
      },
      determinism: {
        source_archive_constructions: 2,
        source_archives_byte_identical: true,
        viewer_archive_constructions: 2,
        viewer_archives_byte_identical: true,
        archive_mtime_epoch_seconds: 0,
        gzip_original_name_and_time: false,
      },
      write_order: [
        lock.artifacts.source,
        lock.artifacts.viewer,
        lock.artifacts.receipt,
      ],
      residue_policy: {
        retained: OUTPUT_FILES,
        temporary_clone_install_build_removed: true,
      },
      authority_effect: "none",
    };
    await onPhase({ phase: "receipt-ready" });
    await writeFile(receiptOutput, canonicalJson(receipt), { flag: "wx" });
    await onPhase({ phase: "receipt-written" });
    return {
      receipt,
      receiptPath: receiptOutput,
      sourcePath: sourceOutput,
      viewerPath: viewerOutput,
    };
  } catch (error) {
    await rm(output, { recursive: true, force: true });
    throw error;
  } finally {
    await rm(workRoot, { recursive: true, force: true });
  }
}

async function archiveListing(path) {
  const result = await run("tar", ["-tzf", path], {
    cwd: dirname(path),
    issue: "ARCHIVE_LIST_FAILED",
  });
  return result.stdout.split("\n").filter(Boolean);
}

function archiveNamesAreSafe(names, prefix) {
  return names.length > 0 && names.every((name) => {
    if (!name.startsWith(prefix) || name.startsWith("/") || name.includes("\0")) {
      return false;
    }
    const rest = name.slice(prefix.length);
    return rest !== ".." &&
      !rest.startsWith("../") &&
      !rest.includes("/../");
  });
}

async function extractedArchiveFileSha(archive, member) {
  const result = await execFile("tar", ["-xOzf", archive, member], {
    encoding: null,
    maxBuffer: 128 * 1024 * 1024,
  });
  return sha256(result.stdout);
}

function validateReceiptShape(receipt, lock, issues) {
  if (!isRecord(receipt)) {
    issues.push("RECEIPT_INVALID");
    return;
  }
  if (receipt.schema_version !== "oew.upstream-build-receipt.v1") {
    issues.push("RECEIPT_VERSION_UNSUPPORTED");
  }
  if (receipt.state !== "receipt-complete") issues.push("RECEIPT_STATE_INCOMPLETE");
  if (receipt.result !== "pass") issues.push("RECEIPT_RESULT_NOT_PASS");
  if (receipt.handle !== "oew-upstream-viewer-build/v1") issues.push("HANDLE_INVALID");
  if (receipt.authority_effect !== "none") issues.push("AUTHORITY_EFFECT_FORBIDDEN:receipt");
  if (
    receipt.upstream?.repository !== lock.repository ||
    receipt.upstream?.observed_remote !== lock.repository ||
    receipt.upstream?.commit !== lock.commit ||
    receipt.upstream?.license?.sha256 !== lock.license.sha256 ||
    JSON.stringify(receipt.upstream?.tracked_changes_after_build) !== "[]"
  ) {
    issues.push("RECEIPT_UPSTREAM_BINDING_INVALID");
  }
  const fileRows = receipt.upstream?.inspected_files?.map(
    (entry) => [entry.path, entry.sha256],
  );
  if (
    JSON.stringify(fileRows) !== JSON.stringify(EXPECTED_INSPECTED_FILES) ||
    receipt.upstream?.inspected_files?.some((entry) => entry.result !== "pass")
  ) {
    issues.push("RECEIPT_FILE_BINDINGS_INVALID");
  }
  if (
    receipt.toolchain?.pnpm !== lock.package_manager.version ||
    receipt.toolchain?.lockfile !== lock.package_manager.lockfile ||
    typeof receipt.toolchain?.node !== "string" ||
    typeof receipt.toolchain?.git !== "string"
  ) {
    issues.push("RECEIPT_TOOLCHAIN_INVALID");
  }
  const expectedCommands = [
    "pnpm install --frozen-lockfile",
    "pnpm --filter @understand-anything/core test",
    "pnpm --filter @understand-anything/dashboard test",
    lock.viewer.build_command,
  ];
  if (
    JSON.stringify(receipt.commands?.map(({ command }) => command)) !==
      JSON.stringify(expectedCommands) ||
    receipt.commands?.some(
      (command) => command.result !== "pass" || command.exit_code !== 0,
    )
  ) {
    issues.push("RECEIPT_COMMANDS_INVALID");
  }
  if (
    receipt.determinism?.source_archive_constructions !== 2 ||
    receipt.determinism?.source_archives_byte_identical !== true ||
    receipt.determinism?.viewer_archive_constructions !== 2 ||
    receipt.determinism?.viewer_archives_byte_identical !== true ||
    receipt.determinism?.archive_mtime_epoch_seconds !== 0 ||
    receipt.determinism?.gzip_original_name_and_time !== false
  ) {
    issues.push("RECEIPT_DETERMINISM_INVALID");
  }
  if (
    JSON.stringify(receipt.write_order) !== JSON.stringify([
      lock.artifacts.source,
      lock.artifacts.viewer,
      lock.artifacts.receipt,
    ])
  ) {
    issues.push("RECEIPT_WRITE_ORDER_INVALID");
  }
  if (
    receipt.residue_policy?.temporary_clone_install_build_removed !== true ||
    JSON.stringify(receipt.residue_policy?.retained) !==
      JSON.stringify(OUTPUT_FILES)
  ) {
    issues.push("RECEIPT_RESIDUE_POLICY_INVALID");
  }
}

export async function verifyPinnedUpstream({
  lockPath,
  outputDirectory,
  implementationRoot = dirname(dirname(resolve(lockPath))),
}) {
  const issues = [];
  let lock;
  try {
    lock = await loadLock(resolve(lockPath));
  } catch (error) {
    return {
      verified: false,
      issues: [error.issue ?? "LOCK_UNREADABLE"],
      authority_effect: "none",
    };
  }
  const output = resolve(outputDirectory);
  let outputReal;
  try {
    outputReal = await realpath(output);
  } catch {
    return {
      verified: false,
      issues: ["OUTPUT_MISSING"],
      authority_effect: "none",
    };
  }
  if (basename(outputReal) !== lock.commit) issues.push("OUTPUT_COMMIT_PATH_INVALID");
  const inventory = (await readdir(outputReal)).sort();
  if (JSON.stringify(inventory) !== JSON.stringify(OUTPUT_FILES)) {
    issues.push("OUTPUT_INVENTORY_INVALID");
  }

  let receipt = null;
  try {
    receipt = JSON.parse(
      await readFile(join(outputReal, lock.artifacts.receipt), "utf8"),
    );
  } catch {
    issues.push("RECEIPT_UNREADABLE");
  }
  validateReceiptShape(receipt, lock, issues);

  const localLicense = resolve(implementationRoot, "upstream/LICENSE");
  try {
    if (await sha256File(localLicense) !== lock.license.sha256) {
      issues.push("LOCAL_LICENSE_DIGEST_MISMATCH");
    }
  } catch {
    issues.push("LOCAL_LICENSE_MISSING");
  }

  for (const artifact of receipt?.artifacts ?? []) {
    if (
      !isRecord(artifact) ||
      ![lock.artifacts.source, lock.artifacts.viewer].includes(artifact.path) ||
      !DIGEST.test(artifact.sha256 ?? "") ||
      !Number.isInteger(artifact.size_bytes) ||
      artifact.size_bytes < 1
    ) {
      issues.push(`ARTIFACT_RECEIPT_INVALID:${artifact?.path ?? "<missing>"}`);
      continue;
    }
    const path = join(outputReal, artifact.path);
    try {
      const info = await stat(path);
      if (info.size !== artifact.size_bytes) {
        issues.push(`ARTIFACT_SIZE_MISMATCH:${artifact.path}`);
      }
      if (await sha256File(path) !== artifact.sha256) {
        issues.push(`ARTIFACT_DIGEST_MISMATCH:${artifact.path}`);
      }
    } catch {
      issues.push(`ARTIFACT_MISSING:${artifact.path}`);
    }
  }
  if (receipt?.artifacts?.length !== 2) issues.push("ARTIFACT_RECEIPTS_INVALID");

  const sourceArchive = join(outputReal, lock.artifacts.source);
  try {
    const names = await archiveListing(sourceArchive);
    if (!archiveNamesAreSafe(names, SOURCE_PREFIX)) {
      issues.push("SOURCE_ARCHIVE_PATH_INVALID");
    }
    const required = [
      lock.package_manager.lockfile,
      "package.json",
      ...lock.inspected_files.map(({ path }) => path),
    ];
    for (const path of required) {
      const member = `${SOURCE_PREFIX}${path}`;
      if (!names.includes(member)) {
        issues.push(`SOURCE_ARCHIVE_FILE_MISSING:${path}`);
      }
    }
    for (const entry of lock.inspected_files) {
      const member = `${SOURCE_PREFIX}${entry.path}`;
      if (names.includes(member)) {
        const actual = await extractedArchiveFileSha(sourceArchive, member);
        if (actual !== entry.sha256) {
          issues.push(`SOURCE_ARCHIVE_DIGEST_MISMATCH:${entry.path}`);
        }
      }
    }
  } catch (error) {
    issues.push(error.issue ?? "SOURCE_ARCHIVE_INVALID");
  }

  const viewerArchive = join(outputReal, lock.artifacts.viewer);
  const extractRoot = await mkdtemp(join(tmpdir(), "oew-upstream-verify-"));
  try {
    const names = await archiveListing(viewerArchive);
    if (!archiveNamesAreSafe(names, VIEWER_PREFIX)) {
      issues.push("VIEWER_ARCHIVE_PATH_INVALID");
    }
    const required = [
      `${VIEWER_PREFIX}package.json`,
      `${VIEWER_PREFIX}README.md`,
      `${VIEWER_PREFIX}bin/viewer.mjs`,
      `${VIEWER_PREFIX}bin/dist/staleness.js`,
      `${VIEWER_PREFIX}dist/index.html`,
    ];
    for (const path of required) {
      if (!names.includes(path)) issues.push(`VIEWER_ARCHIVE_FILE_MISSING:${path}`);
    }
    if (!names.some((path) => path.startsWith(`${VIEWER_PREFIX}dist/assets/`))) {
      issues.push("VIEWER_ARCHIVE_ASSETS_MISSING");
    }
    if (archiveNamesAreSafe(names, VIEWER_PREFIX)) {
      await run("tar", ["-xzf", viewerArchive, "-C", extractRoot], {
        cwd: extractRoot,
        issue: "VIEWER_ARCHIVE_EXTRACT_FAILED",
      });
      const extractedRoot = join(extractRoot, VIEWER_PREFIX);
      const inventoryRows = await fileInventory(extractedRoot);
      if (
        JSON.stringify(inventoryRows) !==
        JSON.stringify(receipt?.viewer_artifact?.files)
      ) {
        issues.push("VIEWER_ARCHIVE_INVENTORY_MISMATCH");
      }
      const packageJson = JSON.parse(
        await readFile(join(extractedRoot, "package.json"), "utf8"),
      );
      if (
        packageJson.name !== lock.viewer.package ||
        packageJson.version !== lock.viewer.version ||
        packageJson.bin?.["understand-anything-viewer"] !== "bin/viewer.mjs"
      ) {
        issues.push("VIEWER_ARCHIVE_PACKAGE_INVALID");
      }
    }
  } catch (error) {
    issues.push(error.issue ?? "VIEWER_ARCHIVE_INVALID");
  } finally {
    await rm(extractRoot, { recursive: true, force: true });
  }

  return {
    verified: issues.length === 0,
    issues: uniqueSorted(issues),
    handle: receipt?.handle ?? null,
    upstream: receipt?.upstream ?? null,
    artifacts: receipt?.artifacts ?? [],
    authority_effect: "none",
  };
}

function parseArguments(argv) {
  const [mode, ...rest] = argv;
  const values = {};
  for (let index = 0; index < rest.length; index += 2) {
    const flag = rest[index];
    const value = rest[index + 1];
    if (!flag?.startsWith("--") || value === undefined) {
      throw new UpstreamBuildError("ARGUMENT_INVALID");
    }
    values[flag.slice(2)] = value;
  }
  if (!["build", "verify"].includes(mode) || !values.lock || !values.output) {
    throw new UpstreamBuildError("USAGE_INVALID");
  }
  return {
    mode,
    lockPath: resolve(values.lock),
    outputDirectory: resolve(values.output),
  };
}

async function main() {
  const arguments_ = parseArguments(process.argv.slice(2));
  if (arguments_.mode === "build") {
    const result = await buildPinnedUpstream(arguments_);
    process.stdout.write(`${JSON.stringify({
      result: "pass",
      handle: result.receipt.handle,
      output: relative(process.cwd(), arguments_.outputDirectory),
      artifacts: result.receipt.artifacts,
      authority_effect: "none",
    })}\n`);
    return;
  }
  const result = await verifyPinnedUpstream(arguments_);
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (!result.verified) process.exitCode = 1;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    process.stderr.write(`${error.issue ?? "UPSTREAM_COMMAND_FAILED"}: ${error.message}\n`);
    process.exitCode = 1;
  });
}
