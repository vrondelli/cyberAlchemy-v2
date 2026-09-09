#!/usr/bin/env node
import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import {
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
const scriptRoot = dirname(fileURLToPath(import.meta.url));
const defaultImplementationRoot = resolve(scriptRoot, "..");
const digestPattern = /^[a-f0-9]{64}$/;
const legacyExpectedTypedFiles = [
  "src/oew/EvidenceInspector.test.tsx",
  "src/oew/PokerTour.test.tsx",
  "src/oew/TrustRail.test.tsx",
  "src/oew/navigation.test.tsx",
  "src/oew/responsive.test.tsx",
  "src/oew/viewParity.test.ts",
];
const semanticRelationTest = "src/oew/relationPresentation.test.ts";
const semanticExpectedTypedFiles = [
  ...legacyExpectedTypedFiles,
  semanticRelationTest,
];
const originalTypedDigests = {
  "types.ts": "f1f0168c7816f552e2cc538ad3cbb4f92a65f71f897cf98b3a330213b5e18c02",
  "loadOewBundle.ts":
    "8f7a0cd16db296a980508e99183cf4f07ed4a44a8410818ec11286249eb35ef7",
  "store.ts": "bcd0bcb33a284f59f1b8b0b83b627b46f7f4efb5a14dfce4f976d2b5e11e50d6",
};

export class ThinBuildError extends Error {
  constructor(issue, detail = "") {
    super(detail ? `${issue}: ${detail}` : issue);
    this.name = "ThinBuildError";
    this.issue = issue;
  }
}

export const sha256 = (content) =>
  createHash("sha256").update(content).digest("hex");

export const canonicalJson = (value) => {
  const canonical = (item) => {
    if (
      item === null ||
      typeof item === "string" ||
      typeof item === "boolean"
    ) return item;
    if (typeof item === "number" && Number.isFinite(item)) return item;
    if (Array.isArray(item)) return item.map(canonical);
    if (!item || typeof item !== "object") {
      throw new ThinBuildError("CANONICAL_VALUE_INVALID");
    }
    return Object.fromEntries(
      Object.keys(item).sort().map((key) => [key, canonical(item[key])]),
    );
  };
  return `${JSON.stringify(canonical(value), null, 2)}\n`;
};

export function parseBuildArgs(argv) {
  const mode = argv[0];
  if (!['build', 'build-semantic-navigation'].includes(mode)) {
    throw new ThinBuildError("COMMAND_INVALID");
  }
  const semantic = mode === "build-semantic-navigation";
  if (argv.length !== (semantic ? 7 : 5)) {
    throw new ThinBuildError("ARGUMENT_COUNT_INVALID");
  }
  const values = {};
  for (let index = 1; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    const allowed = semantic
      ? ["--typed-receipt", "--semantic-binding", "--output"]
      : ["--typed-receipt", "--output"];
    if (!allowed.includes(flag) || !value) {
      throw new ThinBuildError("ARGUMENT_INVALID", flag ?? "<missing>");
    }
    if (values[flag]) throw new ThinBuildError("ARGUMENT_DUPLICATE", flag);
    values[flag] = value;
  }
  if (
    !values["--typed-receipt"] ||
    !values["--output"] ||
    (semantic && !values["--semantic-binding"])
  ) {
    throw new ThinBuildError("ARGUMENT_REQUIRED");
  }
  return {
    mode,
    typedReceipt: values["--typed-receipt"],
    semanticBinding: values["--semantic-binding"] ?? null,
    output: values["--output"],
  };
}

export function normalizedRelativePath(rawPath) {
  if (
    typeof rawPath !== "string" ||
    !rawPath ||
    isAbsolute(rawPath) ||
    rawPath.includes("\\") ||
    rawPath.split("/").includes("..") ||
    rawPath.split("/").includes(".")
  ) {
    throw new ThinBuildError("PATH_INVALID", String(rawPath));
  }
  return rawPath;
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

async function assertContained(root, candidate, issue) {
  const rel = relative(resolve(root), resolve(candidate));
  if (!rel || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new ThinBuildError(issue, candidate);
  }
  let cursor = resolve(root);
  for (const part of rel.split(sep).slice(0, -1)) {
    cursor = join(cursor, part);
    if ((await exists(cursor)) && (await lstat(cursor)).isSymbolicLink()) {
      throw new ThinBuildError("SYMLINK_ANCESTOR", candidate);
    }
  }
}

async function artifact(path, logicalPath) {
  const info = await stat(path);
  if (!info.isFile()) throw new ThinBuildError("ARTIFACT_NOT_FILE", logicalPath);
  const content = await readFile(path);
  return {
    path: logicalPath,
    sha256: sha256(content),
    size_bytes: info.size,
  };
}

async function readJson(path, issue) {
  try {
    const value = JSON.parse(await readFile(path, "utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("object required");
    }
    return value;
  } catch (error) {
    throw new ThinBuildError(issue, error.message);
  }
}

function requireExact(actual, expected, issue) {
  if (actual !== expected) {
    throw new ThinBuildError(issue, `${actual} != ${expected}`);
  }
}

function requireDigest(value, issue) {
  if (!digestPattern.test(value ?? "")) throw new ThinBuildError(issue);
}

export function validateTypedReceipt(receipt) {
  if (
    receipt?.schema_version !== "oewtp.task-session-receipt.v1" ||
    receipt?.swu_id !== "SWU-OEWTP-001" ||
    receipt?.result !== "pass" ||
    receipt?.files_touched?.length !== 5 ||
    receipt?.validation?.strict_typescript?.after_diagnostics !== 0 ||
    receipt?.validation?.typed_oew_tests?.failed !== 0 ||
    receipt?.validation?.package_manifest_inventory?.result !== "pass"
  ) {
    throw new ThinBuildError("TYPED_RECEIPT_INVALID");
  }
  return true;
}

export function validateOutputLogicalPath(logicalPath) {
  const normalized = normalizedRelativePath(logicalPath);
  const parts = normalized.split("/");
  if (
    parts.length !== 5 ||
    parts[0] !== "generated" ||
    parts[1] !== "runs" ||
    parts[2] !== "SWU-OEWTP-002" ||
    !/^[0-9]{8}T[0-9]{6}Z$/.test(parts[3]) ||
    parts[4] !== "thin-prototype-build-handle.json"
  ) {
    throw new ThinBuildError("OUTPUT_PATH_INVALID", logicalPath);
  }
  return { normalized, attemptId: parts[3] };
}

export function validateSemanticOutputLogicalPath(logicalPath) {
  const normalized = normalizedRelativePath(logicalPath);
  const parts = normalized.split("/");
  if (
    parts.length !== 5 ||
    parts[0] !== "generated" ||
    parts[1] !== "runs" ||
    parts[2] !== "SWU-OEWSN-004" ||
    !/^[0-9]{8}T[0-9]{6}Z$/.test(parts[3]) ||
    parts[4] !== "semantic-navigation-build-handle.json"
  ) {
    throw new ThinBuildError("SEMANTIC_OUTPUT_PATH_INVALID", logicalPath);
  }
  return {normalized, attemptId: parts[3]};
}

function validateBoundArtifact(spec, expectedPath, issue) {
  if (
    !spec ||
    typeof spec !== "object" ||
    Array.isArray(spec) ||
    normalizedRelativePath(spec.path) !== expectedPath ||
    !digestPattern.test(spec.sha256 ?? "") ||
    !Number.isInteger(spec.size_bytes)
  ) {
    throw new ThinBuildError(issue, expectedPath);
  }
  return spec;
}

export function validateSemanticBinding(binding) {
  if (
    !binding ||
    typeof binding !== "object" ||
    Array.isArray(binding) ||
    binding.schema_version !== "oew.semantic-navigation-build-binding.v1" ||
    binding.binding_id !== "oewsn-build/SWU-OEWSN-004" ||
    binding.owner_swu !== "SWU-OEWSN-004" ||
    binding.authority_effect !== "none" ||
    binding.builder?.mode !== "build-semantic-navigation" ||
    binding.additive_overlay?.apply_order !==
      "after-historical-overlay-before-historical-patches" ||
    binding.additive_overlay?.collision_policy !== "reject"
  ) {
    throw new ThinBuildError("SEMANTIC_BINDING_INVALID");
  }
  validateBoundArtifact(
    binding.historical_base?.l1_build_lock,
    "upstream/L1-BUILD.lock.json",
    "SEMANTIC_L1_BINDING_INVALID",
  );
  validateBoundArtifact(
    binding.historical_base?.overlay_manifest,
    "upstream/overlay/overlay-manifest.json",
    "SEMANTIC_OVERLAY_BINDING_INVALID",
  );
  validateBoundArtifact(
    binding.historical_base?.first_working_manifest,
    "upstream/overlay/first-working-version-manifest.json",
    "SEMANTIC_FIRST_WORKING_BINDING_INVALID",
  );
  validateBoundArtifact(
    binding.builder?.source,
    "scripts/build-thin-prototype.mjs",
    "SEMANTIC_BUILDER_BINDING_INVALID",
  );
  validateBoundArtifact(
    binding.builder?.test,
    "test/thin-prototype-build.test.mjs",
    "SEMANTIC_BUILDER_TEST_BINDING_INVALID",
  );
  const patches = binding.historical_base?.patches;
  if (
    !Array.isArray(patches) ||
    patches.length !== 2 ||
    patches[0]?.path !== "upstream/patches/0001-oew-entrypoint.patch" ||
    patches[1]?.path !== "upstream/patches/0002-knowledge-focus-scene.patch"
  ) {
    throw new ThinBuildError("SEMANTIC_PATCH_BINDINGS_INVALID");
  }
  for (const patch of patches) {
    validateBoundArtifact(patch, patch.path, "SEMANTIC_PATCH_BINDING_INVALID");
  }
  const files = binding.additive_overlay?.files;
  if (
    !Array.isArray(files) ||
    files.length !== 2 ||
    files.map((row) => row.path).join("|") !==
      [
        "upstream/overlay/packages/dashboard/src/oew/relationPresentation.ts",
        "upstream/overlay/packages/dashboard/src/oew/relationPresentation.test.ts",
      ].join("|") ||
    new Set(files.map((row) => row.destination)).size !== files.length
  ) {
    throw new ThinBuildError("SEMANTIC_ADDITIVE_FILES_INVALID");
  }
  for (const row of files) {
    validateBoundArtifact(row, row.path, "SEMANTIC_ADDITIVE_BINDING_INVALID");
    const destination = normalizedRelativePath(row.destination);
    if (!destination.startsWith("understand-anything-plugin/packages/dashboard/src/oew/")) {
      throw new ThinBuildError("SEMANTIC_ADDITIVE_DESTINATION_INVALID");
    }
  }
  if (
    binding.typed_test_contract?.expected_file_count !== 7 ||
    binding.typed_test_contract?.expected_test_count !== 7 ||
    !Array.isArray(binding.typed_test_contract?.files) ||
    binding.typed_test_contract.files.join("|") !==
      semanticExpectedTypedFiles.join("|")
  ) {
    throw new ThinBuildError("SEMANTIC_TYPED_CONTRACT_INVALID");
  }
  if (
    !Number.isInteger(binding.package_manifest_inventory?.count) ||
    !digestPattern.test(
      binding.package_manifest_inventory?.path_inventory_sha256 ?? "",
    ) ||
    !digestPattern.test(
      binding.package_manifest_inventory?.byte_inventory_sha256 ?? "",
    )
  ) {
    throw new ThinBuildError("SEMANTIC_PACKAGE_INVENTORY_INVALID");
  }
  return binding;
}

export function validatePatchSpecs(patches) {
  if (!Array.isArray(patches) || patches.length === 0) {
    throw new ThinBuildError("PATCH_BINDINGS_MISSING");
  }
  const seenPaths = new Set();
  return patches.map((patch, index) => {
    if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
      throw new ThinBuildError("PATCH_BINDING_INVALID", String(index));
    }
    const path = normalizedRelativePath(patch.path);
    const target = normalizedRelativePath(patch.target);
    if (
      !path.startsWith("upstream/patches/") ||
      !digestPattern.test(patch.sha256 ?? "") ||
      !digestPattern.test(patch.preimage_sha256 ?? "") ||
      !digestPattern.test(patch.postimage_sha256 ?? "") ||
      patch.apply_exactly_once !== true ||
      seenPaths.has(path)
    ) {
      throw new ThinBuildError("PATCH_BINDING_INVALID", path);
    }
    seenPaths.add(path);
    return {...patch, path, target};
  });
}

export function expectedTypedSourceDigest(path, typedDigest, buildLock) {
  const rebindings = [
    [
      "/upstream/overlay/overlay-manifest.json",
      buildLock?.feature_inputs?.swu_007?.overlay_manifest?.sha256,
    ],
    [
      "/upstream/overlay/first-working-version-manifest.json",
      buildLock?.feature_inputs?.swu_008f?.first_working_version_manifest?.sha256,
    ],
  ];
  const rebound = rebindings.find(([suffix]) => path.endsWith(suffix));
  if (!rebound) return typedDigest;
  if (!digestPattern.test(rebound[1] ?? "")) {
    throw new ThinBuildError("BUILD_LOCK_REBINDING_MISSING", path);
  }
  return rebound[1];
}

async function command(program, args, cwd, id, env = {}) {
  const started = process.hrtime.bigint();
  let exitCode = 0;
  let stdout = "";
  let stderr = "";
  try {
    const result = await execFile(program, args, {
      cwd,
      encoding: "utf8",
      maxBuffer: 128 * 1024 * 1024,
      env: {
        ...process.env,
        CI: "1",
        COREPACK_ENABLE_DOWNLOAD_PROMPT: "0",
        ...env,
      },
    });
    stdout = result.stdout;
    stderr = result.stderr;
  } catch (error) {
    exitCode = Number.isInteger(error.code) ? error.code : 1;
    stdout = String(error.stdout ?? "");
    stderr = String(error.stderr ?? error.message);
  }
  return {
    id,
    program,
    args,
    cwd,
    exit_code: exitCode,
    stdout_sha256: sha256(stdout),
    stderr_sha256: sha256(stderr),
    duration_ms: Number((process.hrtime.bigint() - started) / 1000000n),
    stdout,
    stderr,
  };
}

function commandReceipt(result) {
  const { stdout, stderr, ...receipt } = result;
  return receipt;
}

async function packageInventory(repositoryRoot) {
  const discovered = await command(
    "rg",
    ["--files", "-g", "package.json", "-g", "!**/node_modules/**"],
    repositoryRoot,
    "package-inventory",
  );
  if (discovered.exit_code !== 0) {
    throw new ThinBuildError("PACKAGE_INVENTORY_FAILED");
  }
  const paths = discovered.stdout.split("\n").filter(Boolean).sort();
  const rows = [];
  for (const path of paths) {
    rows.push(`${sha256(await readFile(join(repositoryRoot, path)))}  ${path}`);
  }
  return {
    count: paths.length,
    path_inventory_sha256: sha256(`${paths.join("\n")}\n`),
    byte_inventory_sha256: sha256(`${rows.join("\n")}\n`),
  };
}

export async function treeIdentity(root) {
  const rows = [];
  let byteSize = 0;
  async function visit(directory, prefix = "") {
    for (const entry of (await readdir(directory, { withFileTypes: true }))
      .sort((left, right) => left.name.localeCompare(right.name))) {
      const absolute = join(directory, entry.name);
      const logical = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) {
        throw new ThinBuildError("TREE_SYMLINK", logical);
      }
      if (entry.isDirectory()) {
        await visit(absolute, logical);
      } else if (entry.isFile()) {
        const content = await readFile(absolute);
        byteSize += content.length;
        rows.push({
          path: logical,
          sha256: sha256(content),
          size_bytes: content.length,
        });
      } else {
        throw new ThinBuildError("TREE_ENTRY_INVALID", logical);
      }
    }
  }
  await visit(root);
  if (rows.length === 0) throw new ThinBuildError("TREE_EMPTY");
  return {
    tree_sha256: sha256(
      `${rows
        .map((row) => `${row.sha256} ${row.size_bytes} ${row.path}`)
        .join("\n")}\n`,
    ),
    file_count: rows.length,
    byte_size: byteSize,
    files: rows,
  };
}

export function exactTypedDiscovery(stdout, expectedFiles = legacyExpectedTypedFiles) {
  const discovered = expectedFiles.filter((path) =>
    stdout.includes(path),
  );
  const expectedCount = expectedFiles.length;
  if (
    discovered.length !== expectedCount ||
    !stdout.includes(`Test Files  ${expectedCount} passed (${expectedCount})`) ||
    !stdout.includes(`Tests  ${expectedCount} passed (${expectedCount})`)
  ) {
    throw new ThinBuildError("TYPED_TEST_DISCOVERY_INVALID");
  }
  return {
    files: discovered,
    file_count: expectedCount,
    test_count: expectedCount,
    passed: expectedCount,
    failed: 0,
  };
}

async function verifyTool(path, expectedDigest, expectedVersion, versionArgs) {
  const bound = await artifact(path, path);
  requireExact(bound.sha256, expectedDigest, "TOOL_DIGEST_DRIFT");
  const probe = await command(path, versionArgs, dirname(path), "tool-version");
  if (probe.exit_code !== 0 || !probe.stdout.includes(expectedVersion)) {
    throw new ThinBuildError("TOOL_VERSION_DRIFT", path);
  }
  return { ...bound, version: expectedVersion };
}

async function verifyOverlay(implementationRoot, overlay, firstWorking) {
  const overlayRoot = join(implementationRoot, "upstream/overlay");
  const boundByPath = new Map(firstWorking.files.map((row) => [row.path, row]));
  const artifacts = [];
  for (const row of overlay.files) {
    const logicalPath = `upstream/overlay/${row.path}`;
    const bound = row.sha256
      ? row
      : boundByPath.get(logicalPath);
    if (!bound || !digestPattern.test(bound.sha256) || !Number.isInteger(bound.size_bytes)) {
      throw new ThinBuildError("OVERLAY_BINDING_MISSING", row.path);
    }
    const current = await artifact(join(overlayRoot, row.path), logicalPath);
    requireExact(current.sha256, bound.sha256, "OVERLAY_DIGEST_DRIFT");
    requireExact(current.size_bytes, bound.size_bytes, "OVERLAY_SIZE_DRIFT");
    artifacts.push({
      ...current,
      destination: `understand-anything-plugin/${row.path}`,
    });
  }
  requireExact(artifacts.length, overlay.files.length, "OVERLAY_COUNT_DRIFT");
  return artifacts;
}

async function safeArchiveMembers(tarPath, archivePath, expectedRoot) {
  const listing = await command(
    tarPath,
    ["-tzf", archivePath],
    dirname(archivePath),
    "archive-list",
  );
  if (listing.exit_code !== 0) throw new ThinBuildError("ARCHIVE_LIST_FAILED");
  const members = listing.stdout.split("\n").filter(Boolean);
  if (members.length === 0) throw new ThinBuildError("ARCHIVE_EMPTY");
  for (const member of members) {
    if (
      member.startsWith("/") ||
      member.includes("\\") ||
      member.split("/").includes("..") ||
      (member !== expectedRoot && !member.startsWith(`${expectedRoot}/`))
    ) {
      throw new ThinBuildError("ARCHIVE_MEMBER_UNSAFE", member);
    }
  }
  return members.length;
}

export async function buildThinPrototype({
  typedReceiptPath,
  outputPath,
  semanticBindingPath = null,
  implementationRoot = defaultImplementationRoot,
}) {
  const effectiveImplementationRoot = resolve(implementationRoot);
  const repositoryRoot = resolve(effectiveImplementationRoot, "../../..");
  const semanticMode = semanticBindingPath !== null;
  const typedLogical = normalizedRelativePath(typedReceiptPath);
  const typedAbsolute = resolve(repositoryRoot, typedLogical);
  await assertContained(repositoryRoot, typedAbsolute, "TYPED_RECEIPT_ESCAPE");
  const outputLogical = normalizedRelativePath(outputPath);
  const outputIdentity = semanticMode
    ? validateSemanticOutputLogicalPath(outputLogical)
    : validateOutputLogicalPath(outputLogical);
  const outputAbsolute = resolve(effectiveImplementationRoot, outputLogical);
  await assertContained(
    effectiveImplementationRoot,
    outputAbsolute,
    "OUTPUT_ESCAPE",
  );
  const outputRoot = dirname(outputAbsolute);
  const retainedDist = join(outputRoot, "dashboard-dist");
  if (await exists(outputAbsolute)) throw new ThinBuildError("OUTPUT_COLLISION");
  if (await exists(retainedDist)) throw new ThinBuildError("DIST_COLLISION");
  await assertContained(effectiveImplementationRoot, retainedDist, "DIST_ESCAPE");

  let semanticBinding = null;
  let semanticBindingArtifact = null;
  if (semanticMode) {
    const bindingLogical = normalizedRelativePath(semanticBindingPath);
    const bindingAbsolute = resolve(effectiveImplementationRoot, bindingLogical);
    await assertContained(
      effectiveImplementationRoot,
      bindingAbsolute,
      "SEMANTIC_BINDING_ESCAPE",
    );
    semanticBinding = validateSemanticBinding(
      await readJson(bindingAbsolute, "SEMANTIC_BINDING_UNREADABLE"),
    );
    semanticBindingArtifact = await artifact(bindingAbsolute, bindingLogical);
  }

  const typedReceipt = await readJson(typedAbsolute, "TYPED_RECEIPT_UNREADABLE");
  validateTypedReceipt(typedReceipt);
  const typedReceiptArtifact = await artifact(typedAbsolute, typedLogical);
  const closeoutPath = join(dirname(typedAbsolute), "closeout-refresh/refresh-receipt.json");
  const closeout = await readJson(closeoutPath, "TYPED_CLOSEOUT_UNREADABLE");
  if (closeout.result !== "pass" || closeout.mutationReady !== true) {
    throw new ThinBuildError("TYPED_CLOSEOUT_INVALID");
  }
  const closeoutArtifact = await artifact(
    closeoutPath,
    relative(repositoryRoot, closeoutPath),
  );
  const typedHandleRef = typedReceipt.generated_outputs?.[0];
  if (!typedHandleRef) throw new ThinBuildError("TYPED_HANDLE_REF_MISSING");
  const typedHandlePath = resolve(repositoryRoot, typedHandleRef.path);
  const typedHandleArtifact = await artifact(typedHandlePath, typedHandleRef.path);
  requireExact(
    typedHandleArtifact.sha256,
    typedHandleRef.sha256,
    "TYPED_HANDLE_DIGEST_DRIFT",
  );
  const typedHandle = await readJson(typedHandlePath, "TYPED_HANDLE_INVALID");
  if (typedHandle.result !== "pass" || typedHandle.source_changes?.length !== 5) {
    throw new ThinBuildError("TYPED_HANDLE_NOT_PASS");
  }
  const buildLockPath = join(
    effectiveImplementationRoot,
    "upstream/L1-BUILD.lock.json",
  );
  const buildLock = await readJson(buildLockPath, "BUILD_LOCK_INVALID");
  if (
    buildLock.schema_version !== "oew.l1-build-lock.v1" ||
    buildLock.binding_owner_swu !== "SWU-OEW-FOCUS-002" ||
    buildLock.feature_inputs?.focus_scene?.swu_id !== "SWU-OEW-FOCUS-002"
  ) {
    throw new ThinBuildError("BUILD_LOCK_NOT_FOCUS_PREVIEW");
  }
  const buildLockArtifact = await artifact(
    buildLockPath,
    "upstream/L1-BUILD.lock.json",
  );
  for (const change of typedHandle.source_changes) {
    const current = await artifact(
      resolve(repositoryRoot, change.path),
      change.path,
    );
    requireExact(
      current.sha256,
      expectedTypedSourceDigest(change.path, change.after_sha256, buildLock),
      "TYPED_SOURCE_DRIFT",
    );
    if (
      Object.entries(originalTypedDigests).some(
        ([name, digest]) => change.path.endsWith(`/${name}`) && digest === current.sha256,
      )
    ) {
      throw new ThinBuildError("TYPED_SOURCE_NOT_REPAIRED", change.path);
    }
  }

  const lockPath = join(
    effectiveImplementationRoot,
    "upstream/L1-TOOLCHAIN.lock.json",
  );
  const lock = await readJson(lockPath, "TOOLCHAIN_LOCK_INVALID");
  const archivePath = join(
    effectiveImplementationRoot,
    lock.upstream.source_archive_path,
  );
  const archive = await artifact(archivePath, lock.upstream.source_archive_path);
  requireExact(
    archive.sha256,
    lock.upstream.source_archive_sha256,
    "ARCHIVE_DIGEST_DRIFT",
  );
  requireExact(
    archive.size_bytes,
    lock.upstream.source_archive_size_bytes,
    "ARCHIVE_SIZE_DRIFT",
  );
  const node = await verifyTool(
    lock.toolchain.node.path,
    lock.toolchain.node.sha256,
    lock.toolchain.node.version,
    ["--version"],
  );
  const pnpmBin = lock.toolchain.pnpm.bin_path;
  const pnpmArtifact = await artifact(pnpmBin, pnpmBin);
  requireExact(
    pnpmArtifact.sha256,
    lock.toolchain.pnpm.bin_sha256,
    "PNPM_DIGEST_DRIFT",
  );
  const pnpmVersionProbe = await command(
    node.path,
    [pnpmBin, "--version"],
    effectiveImplementationRoot,
    "pnpm-version",
  );
  if (
    pnpmVersionProbe.exit_code !== 0 ||
    pnpmVersionProbe.stdout.trim() !== lock.toolchain.pnpm.version
  ) {
    throw new ThinBuildError("PNPM_VERSION_DRIFT");
  }

  const overlayManifestPath = join(
    effectiveImplementationRoot,
    "upstream/overlay/overlay-manifest.json",
  );
  const firstWorkingPath = join(
    effectiveImplementationRoot,
    "upstream/overlay/first-working-version-manifest.json",
  );
  const overlay = await readJson(overlayManifestPath, "OVERLAY_MANIFEST_INVALID");
  const firstWorking = await readJson(firstWorkingPath, "FIRST_WORKING_INVALID");
  const overlayArtifact = await artifact(
    overlayManifestPath,
    "upstream/overlay/overlay-manifest.json",
  );
  const firstWorkingArtifact = await artifact(
    firstWorkingPath,
    "upstream/overlay/first-working-version-manifest.json",
  );
  requireExact(
    overlayArtifact.sha256,
    buildLock.feature_inputs.swu_007.overlay_manifest.sha256,
    "BUILD_LOCK_OVERLAY_DRIFT",
  );
  requireExact(
    overlayArtifact.size_bytes,
    buildLock.feature_inputs.swu_007.overlay_manifest.size_bytes,
    "BUILD_LOCK_OVERLAY_SIZE_DRIFT",
  );
  requireExact(
    firstWorkingArtifact.sha256,
    buildLock.feature_inputs.swu_008f.first_working_version_manifest.sha256,
    "BUILD_LOCK_FIRST_WORKING_DRIFT",
  );
  requireExact(
    firstWorkingArtifact.size_bytes,
    buildLock.feature_inputs.swu_008f.first_working_version_manifest.size_bytes,
    "BUILD_LOCK_FIRST_WORKING_SIZE_DRIFT",
  );
  requireExact(
    firstWorking.overlay_manifest?.sha256,
    overlayArtifact.sha256,
    "FIRST_WORKING_OVERLAY_DRIFT",
  );
  requireExact(
    firstWorking.overlay_manifest?.size_bytes,
    overlayArtifact.size_bytes,
    "FIRST_WORKING_OVERLAY_SIZE_DRIFT",
  );
  const overlayArtifacts = await verifyOverlay(
    effectiveImplementationRoot,
    overlay,
    firstWorking,
  );
  const additiveArtifacts = [];
  if (semanticMode) {
    const historical = semanticBinding.historical_base;
    for (const [current, expected, issue] of [
      [buildLockArtifact, historical.l1_build_lock, "SEMANTIC_L1_DRIFT"],
      [overlayArtifact, historical.overlay_manifest, "SEMANTIC_OVERLAY_DRIFT"],
      [firstWorkingArtifact, historical.first_working_manifest, "SEMANTIC_FIRST_WORKING_DRIFT"],
    ]) {
      requireExact(current.sha256, expected.sha256, issue);
      requireExact(current.size_bytes, expected.size_bytes, `${issue}_SIZE`);
    }
    for (const spec of [
      semanticBinding.builder.source,
      semanticBinding.builder.test,
    ]) {
      const current = await artifact(
        join(effectiveImplementationRoot, spec.path),
        spec.path,
      );
      requireExact(current.sha256, spec.sha256, "SEMANTIC_BUILDER_DRIFT");
      requireExact(current.size_bytes, spec.size_bytes, "SEMANTIC_BUILDER_SIZE_DRIFT");
    }
    for (const spec of semanticBinding.additive_overlay.files) {
      if (overlayArtifacts.some((row) => row.destination === spec.destination)) {
        throw new ThinBuildError("SEMANTIC_ADDITIVE_COLLISION", spec.destination);
      }
      const current = await artifact(
        join(effectiveImplementationRoot, spec.path),
        spec.path,
      );
      requireExact(current.sha256, spec.sha256, "SEMANTIC_ADDITIVE_DRIFT");
      requireExact(current.size_bytes, spec.size_bytes, "SEMANTIC_ADDITIVE_SIZE_DRIFT");
      additiveArtifacts.push({...current, destination: spec.destination});
    }
  }
  const patchBindings = [];
  for (const spec of validatePatchSpecs(overlay.patches)) {
    const path = join(effectiveImplementationRoot, spec.path);
    const bound = await artifact(path, spec.path);
    requireExact(bound.sha256, spec.sha256, "PATCH_DIGEST_DRIFT");
    if (Number.isInteger(spec.size_bytes)) {
      requireExact(bound.size_bytes, spec.size_bytes, "PATCH_SIZE_DRIFT");
    }
    patchBindings.push({spec, path, artifact: bound});
  }
  if (semanticMode) {
    for (const [index, binding] of patchBindings.entries()) {
      const expected = semanticBinding.historical_base.patches[index];
      requireExact(binding.artifact.path, expected.path, "SEMANTIC_PATCH_PATH_DRIFT");
      requireExact(binding.artifact.sha256, expected.sha256, "SEMANTIC_PATCH_DRIFT");
      requireExact(binding.artifact.size_bytes, expected.size_bytes, "SEMANTIC_PATCH_SIZE_DRIFT");
    }
    for (const row of additiveArtifacts) {
      if (patchBindings.some((binding) => binding.spec.target === row.destination)) {
        throw new ThinBuildError("SEMANTIC_ADDITIVE_PATCH_COLLISION", row.destination);
      }
    }
  }
  for (const binding of buildLock.feature_inputs.focus_scene.files) {
    const current = await artifact(
      join(effectiveImplementationRoot, binding.path),
      binding.path,
    );
    requireExact(current.sha256, binding.sha256, "FOCUS_BINDING_DRIFT");
    requireExact(current.size_bytes, binding.size_bytes, "FOCUS_BINDING_SIZE_DRIFT");
  }
  const lockedFocusPatch = buildLock.feature_inputs.focus_scene.patch;
  const currentFocusPatch = patchBindings.find(
    ({artifact: current}) => current.path === lockedFocusPatch.path,
  )?.artifact;
  requireExact(
    currentFocusPatch?.sha256,
    lockedFocusPatch.sha256,
    "FOCUS_PATCH_BINDING_DRIFT",
  );
  requireExact(
    currentFocusPatch?.size_bytes,
    lockedFocusPatch.size_bytes,
    "FOCUS_PATCH_BINDING_SIZE_DRIFT",
  );
  const packageArtifact = await artifact(
    join(effectiveImplementationRoot, "package.json"),
    "package.json",
  );
  requireExact(
    packageArtifact.sha256,
    firstWorking.package_registry?.sha256,
    "PACKAGE_REGISTRY_DRIFT",
  );
  const packageBefore = await packageInventory(repositoryRoot);
  const expectedPackageInventory = semanticMode
    ? semanticBinding.package_manifest_inventory
    : typedReceipt.validation.package_manifest_inventory;
  requireExact(
    packageBefore.count,
    expectedPackageInventory.count,
    "PACKAGE_INVENTORY_COUNT_DRIFT",
  );
  requireExact(
    packageBefore.path_inventory_sha256,
    expectedPackageInventory.path_inventory_sha256,
    "PACKAGE_PATH_INVENTORY_DRIFT",
  );
  requireExact(
    packageBefore.byte_inventory_sha256,
    expectedPackageInventory.byte_inventory_sha256,
    "PACKAGE_INVENTORY_DRIFT",
  );

  const inputDigest = sha256(
    canonicalJson({
      typedReceipt: typedReceiptArtifact.sha256,
      closeout: closeoutArtifact.sha256,
      archive: archive.sha256,
      buildLock: buildLockArtifact.sha256,
      overlay: overlayArtifact.sha256,
      patches: patchBindings.map((binding) => binding.artifact.sha256),
      semanticBinding: semanticBindingArtifact?.sha256 ?? null,
      additiveOverlay: additiveArtifacts.map((row) => row.sha256),
      output: outputLogical,
    }),
  );
  const workroot = await mkdtemp(
    join(
      tmpdir(),
      `${semanticMode ? "oewsn-build" : "oewtp-build"}-${inputDigest.slice(0, 16)}-`,
    ),
  );
  const sourceRoot = join(workroot, lock.upstream.content_root);
  const storePath = join(workroot, "pnpm-store");
  const commands = [];
  let handleBody;
  let cleanupError = null;
  try {
    const memberCount = await safeArchiveMembers(
      "tar",
      archivePath,
      lock.upstream.content_root,
    );
    const extract = await command(
      "tar",
      ["-xzf", archivePath, "-C", workroot],
      effectiveImplementationRoot,
      "extract",
    );
    commands.push(commandReceipt(extract));
    if (extract.exit_code !== 0 || !(await exists(sourceRoot))) {
      throw new ThinBuildError("ARCHIVE_EXTRACT_FAILED");
    }
    for (const source of overlayArtifacts) {
      const destination = join(sourceRoot, source.destination);
      await assertContained(sourceRoot, destination, "OVERLAY_DESTINATION_ESCAPE");
      await mkdir(dirname(destination), { recursive: true });
      await cp(
        join(effectiveImplementationRoot, source.path),
        destination,
        { force: false, errorOnExist: true },
      );
      const copied = await artifact(destination, source.destination);
      requireExact(copied.sha256, source.sha256, "OVERLAY_COPY_MISMATCH");
    }
    for (const source of additiveArtifacts) {
      const destination = join(sourceRoot, source.destination);
      await assertContained(
        sourceRoot,
        destination,
        "SEMANTIC_ADDITIVE_DESTINATION_ESCAPE",
      );
      if (await exists(destination)) {
        throw new ThinBuildError("SEMANTIC_ADDITIVE_COLLISION", source.destination);
      }
      await mkdir(dirname(destination), {recursive: true});
      await cp(join(effectiveImplementationRoot, source.path), destination, {
        force: false,
        errorOnExist: true,
      });
      const copied = await artifact(destination, source.destination);
      requireExact(
        copied.sha256,
        source.sha256,
        "SEMANTIC_ADDITIVE_COPY_MISMATCH",
      );
    }
    for (const [index, binding] of patchBindings.entries()) {
      const patchTarget = join(sourceRoot, binding.spec.target);
      await assertContained(sourceRoot, patchTarget, "PATCH_TARGET_ESCAPE");
      const preimage = await artifact(patchTarget, binding.spec.target);
      requireExact(
        preimage.sha256,
        binding.spec.preimage_sha256,
        "PATCH_PREIMAGE_DRIFT",
      );
      const patch = await command(
        "patch",
        ["-p1", "-i", binding.path],
        sourceRoot,
        `overlay-patch-${index + 1}`,
      );
      commands.push(commandReceipt(patch));
      if (patch.exit_code !== 0) throw new ThinBuildError("PATCH_FAILED");
      requireExact(
        (await artifact(patchTarget, binding.spec.target)).sha256,
        binding.spec.postimage_sha256,
        "PATCH_POSTIMAGE_DRIFT",
      );
      const reapply = await command(
        "patch",
        ["-p1", "--dry-run", "-i", binding.path],
        sourceRoot,
        `overlay-patch-${index + 1}-reapply`,
      );
      commands.push(commandReceipt(reapply));
      if (reapply.exit_code === 0) {
        throw new ThinBuildError("PATCH_REAPPLY_ACCEPTED");
      }
    }

    const install = await command(
      node.path,
      [
        pnpmBin,
        "install",
        "--frozen-lockfile",
        "--ignore-scripts",
        "--store-dir",
        storePath,
      ],
      sourceRoot,
      "install",
    );
    commands.push(commandReceipt(install));
    if (install.exit_code !== 0) throw new ThinBuildError("INSTALL_FAILED");
    const coreBuild = await command(
      node.path,
      [pnpmBin, "--filter", "@understand-anything/core", "build"],
      sourceRoot,
      "core-build",
    );
    commands.push(commandReceipt(coreBuild));
    if (coreBuild.exit_code !== 0) throw new ThinBuildError("CORE_BUILD_FAILED");
    const coreIdentity = await treeIdentity(
      join(sourceRoot, "understand-anything-plugin/packages/core/dist"),
    );

    const dashboardRoot = join(
      sourceRoot,
      "understand-anything-plugin/packages/dashboard",
    );
    const expectedTypedFiles = semanticMode
      ? semanticExpectedTypedFiles
      : legacyExpectedTypedFiles;
    await writeFile(
      join(dashboardRoot, "vitest.oew.config.mjs"),
      `import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environment: "node",
    css: true,
    include: ${JSON.stringify(expectedTypedFiles)}
  }
});
`,
    );
    const typedTests = await command(
      node.path,
      [
        pnpmBin,
        "--filter",
        "@understand-anything/dashboard",
        "exec",
        "vitest",
        "run",
        "--config",
        "vitest.oew.config.mjs",
        ...expectedTypedFiles,
      ],
      sourceRoot,
      "typed-tests",
    );
    commands.push(commandReceipt(typedTests));
    if (typedTests.exit_code !== 0) throw new ThinBuildError("TYPED_TESTS_FAILED");
    const typedDiscovery = exactTypedDiscovery(
      typedTests.stdout,
      expectedTypedFiles,
    );
    await rm(join(dashboardRoot, "vitest.oew.config.mjs"));

    const dashboardBuild = await command(
      node.path,
      [pnpmBin, "--filter", "@understand-anything/dashboard", "build"],
      sourceRoot,
      "dashboard-build",
    );
    commands.push(commandReceipt(dashboardBuild));
    if (dashboardBuild.exit_code !== 0) {
      throw new ThinBuildError("DASHBOARD_BUILD_FAILED", dashboardBuild.stderr);
    }
    const sourceDist = join(dashboardRoot, "dist");
    const sourceDistIdentity = await treeIdentity(sourceDist);
    if (!(await exists(join(sourceDist, "index.html")))) {
      throw new ThinBuildError("DIST_ENTRYPOINT_MISSING");
    }
    await mkdir(outputRoot, { recursive: true });
    await cp(sourceDist, retainedDist, {
      recursive: true,
      force: false,
      errorOnExist: true,
    });
    const retainedIdentity = await treeIdentity(retainedDist);
    requireExact(
      retainedIdentity.tree_sha256,
      sourceDistIdentity.tree_sha256,
      "RETAINED_DIST_MISMATCH",
    );
    requireExact(
      retainedIdentity.file_count,
      sourceDistIdentity.file_count,
      "RETAINED_DIST_COUNT_MISMATCH",
    );
    requireExact(
      retainedIdentity.byte_size,
      sourceDistIdentity.byte_size,
      "RETAINED_DIST_SIZE_MISMATCH",
    );
    const packageAfter = await packageInventory(repositoryRoot);
    requireExact(
      canonicalJson(packageAfter),
      canonicalJson(packageBefore),
      "PACKAGE_MANIFEST_MUTATED",
    );
    handleBody = {
      schema_version: semanticMode
        ? "oew.semantic-navigation-build-handle.v1"
        : "oewtp.thin-prototype-build-handle.v1",
      handle: semanticMode
        ? `oew-semantic-navigation-build/${outputIdentity.attemptId}`
        : `oewtp-thin-prototype-build/${outputIdentity.attemptId}`,
      work_pack_id: semanticMode ? "WP-OEWSN-001" : "WP-OEWTP-001",
      swu_id: semanticMode ? "SWU-OEWSN-004" : "SWU-OEWTP-002",
      attempt_id: outputIdentity.attemptId,
      result: "pass",
      predecessor: {
        typed_receipt: typedReceiptArtifact,
        closeout_receipt: closeoutArtifact,
        typed_handle: typedHandleArtifact,
      },
      inputs: {
        toolchain_lock: await artifact(
          lockPath,
          "upstream/L1-TOOLCHAIN.lock.json",
        ),
        build_lock: buildLockArtifact,
        source_archive: archive,
        overlay_manifest: overlayArtifact,
        first_working_manifest: firstWorkingArtifact,
        entry_patch: patchBindings[0].artifact,
        patches: patchBindings.map((binding) => binding.artifact),
        package_registry: packageArtifact,
        overlay_files: overlayArtifacts,
        ...(semanticMode
          ? {
              semantic_navigation_binding: semanticBindingArtifact,
              additive_overlay_files: additiveArtifacts,
            }
          : {}),
      },
      toolchain: {
        node,
        pnpm: {
          ...pnpmArtifact,
          version: lock.toolchain.pnpm.version,
        },
      },
      workroot: {
        name: workroot.split(sep).at(-1),
        input_digest: inputDigest,
        digest_named: true,
        outside_repository: true,
        fresh: true,
        archive_member_count: memberCount,
        isolated_store: true,
      },
      commands,
      typed_test_discovery: typedDiscovery,
      ...(semanticMode
        ? {
            semantic_navigation: {
              binding_id: semanticBinding.binding_id,
              owner_swu: semanticBinding.owner_swu,
              apply_order: semanticBinding.additive_overlay.apply_order,
              collision_policy: semanticBinding.additive_overlay.collision_policy,
              relation_record_schema: "relation-presentation-record.v1",
              authority_effect: "none",
            },
          }
        : {}),
      core_dist: {
        tree_sha256: coreIdentity.tree_sha256,
        file_count: coreIdentity.file_count,
        byte_size: coreIdentity.byte_size,
      },
      dashboard_dist: {
        path: `${relative(effectiveImplementationRoot, retainedDist).split(sep).join("/")}/`,
        tree_sha256: retainedIdentity.tree_sha256,
        file_count: retainedIdentity.file_count,
        byte_size: retainedIdentity.byte_size,
        entrypoint: "index.html",
        immutable: true,
        copy_verified: true,
      },
      package_manifests: {
        before: packageBefore,
        after: packageAfter,
        unchanged: true,
      },
      cleanup: {
        finally_executed: false,
        workroot_removed: false,
        isolated_store_removed: false,
        retained_dist_preserved: true,
      },
      claim_ceiling:
        semanticMode
          ? "Candidate-local pure relation presentation seam and immutable dashboard dist produced; no visible UI acceptance, ontology authority, promotion, deployment, production, or human-outcome claim."
          : "Immutable local dashboard dist produced; no gateway, browser acceptance, deployment, or production readiness.",
      authority_effect: "none",
    };
  } finally {
    try {
      await rm(workroot, { recursive: true, force: false });
    } catch (error) {
      cleanupError = error;
    }
  }
  if (!handleBody) throw new ThinBuildError("BUILD_DID_NOT_COMPLETE");
  handleBody.cleanup = {
    finally_executed: true,
    workroot_removed: !(await exists(workroot)),
    isolated_store_removed: !(await exists(storePath)),
    retained_dist_preserved: await exists(retainedDist),
  };
  if (
    cleanupError ||
    !handleBody.cleanup.workroot_removed ||
    !handleBody.cleanup.isolated_store_removed ||
    !handleBody.cleanup.retained_dist_preserved
  ) {
    throw new ThinBuildError(
      "CLEANUP_FAILED",
      cleanupError?.message ?? "cleanup invariant",
    );
  }
  await writeFile(outputAbsolute, canonicalJson(handleBody), {
    encoding: "utf8",
    flag: "wx",
  });
  return handleBody;
}

async function main() {
  const parsed = parseBuildArgs(process.argv.slice(2));
  const result = await buildThinPrototype({
    typedReceiptPath: parsed.typedReceipt,
    outputPath: parsed.output,
    semanticBindingPath: parsed.semanticBinding,
  });
  process.stdout.write(
    `${JSON.stringify({
      result: result.result,
      handle: result.handle,
      dist: result.dashboard_dist.path,
    })}\n`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main().catch((error) => {
    process.stderr.write(`${error.issue ?? error.name}: ${error.message}\n`);
    process.exitCode = 1;
  });
}
