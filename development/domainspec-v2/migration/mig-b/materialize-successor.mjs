#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const SOURCE_ROOT = "projects/domainspec-v2";
const INVENTORY_PATH = "cyberAlchemy-v2/inventory/domainspec-v2/source-manifest.json";
const SELECTION_PATH = "cyberAlchemy-v2/authority/decisions/domainspec-v2-migration/selection.json";
const RUNTIME_PATH = `${SOURCE_ROOT}/RUNTIME.json`;
const BASELINE_PATH = `${SOURCE_ROOT}/development/meta-type-instantiation-cli/CANONICAL-IMPLEMENTED-BASELINE.v10.json`;
const MIGRATION_ROOT = "cyberAlchemy-v2/development/domainspec-v2/migration/mig-b";
const MANIFEST_PATH = `${MIGRATION_ROOT}/MIGRATION-MANIFEST.json`;
const RECEIPT_PATH = `${MIGRATION_ROOT}/MATERIALIZATION-RECEIPT.json`;

const GROUPS = {
  implementation: {
    targetRoot: "cyberAlchemy-v2/implementation/domainspec-v2",
    role: "runtime-closure",
  },
  product: {
    targetRoot: "cyberAlchemy-v2/product/domainspec-v2/source-snapshot",
    role: "product-source-provenance",
  },
  architecture: {
    targetRoot: "cyberAlchemy-v2/architecture/domainspec-v2/source-snapshot",
    role: "architecture-source-provenance",
  },
  authority: {
    targetRoot: "cyberAlchemy-v2/authority/domainspec-v2/imported-source",
    role: "authority-import-candidate",
  },
  ontology: {
    targetRoot: "cyberAlchemy-v2/ontology/domainspec-v2/package",
    role: "ontology-successor-package",
  },
  research: {
    targetRoot: "cyberAlchemy-v2/research/domainspec-v2/imported-source",
    role: "research-source-provenance",
  },
};

const PRODUCT_ROOT_FILES = new Set([
  "COMPLETE-GUIDE.html",
  "COMPLETE-GUIDE.lanes.json",
  "COMPLETE-GUIDE.md",
  "COMPLETE-GUIDE.schema.json",
  "PRODUCT-THESIS.md",
  "README.md",
]);
const ARCHITECTURE_ROOT_FILES = new Set([
  "ARCHITECTURE.md",
  "RELATED-FRAMEWORK-CROSSWALK.md",
]);

function fail(message) {
  process.stderr.write(`mig-b-materialization: ${message}\n`);
  process.exit(1);
}

function parseArguments(argv) {
  const options = { materializedAt: null, mode: "check" };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--materialized-at") options.materializedAt = argv[++index];
    else if (value === "--write") options.mode = "write";
    else if (value === "--check") options.mode = "check";
    else fail(`unknown argument: ${value}`);
  }
  if (!options.materializedAt || Number.isNaN(Date.parse(options.materializedAt))) {
    fail("--materialized-at must be an explicit ISO-8601 timestamp");
  }
  return options;
}

function findRepositoryRoot(startPath) {
  let candidate = path.resolve(startPath);
  while (true) {
    if (existsSync(path.join(candidate, ".git"))) return candidate;
    const parent = path.dirname(candidate);
    if (parent === candidate) fail(`cannot locate repository root from ${startPath}`);
    candidate = parent;
  }
}

function readJson(repoRoot, repoPath) {
  return JSON.parse(readFileSync(path.join(repoRoot, repoPath), "utf8"));
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function canonicalDigest(value) {
  return sha256(Buffer.from(JSON.stringify(stable(value)), "utf8"));
}

function writeAtomic(targetPath, bytes) {
  mkdirSync(path.dirname(targetPath), { recursive: true });
  const temporaryPath = `${targetPath}.tmp`;
  try {
    writeFileSync(temporaryPath, bytes);
    renameSync(temporaryPath, targetPath);
  } finally {
    if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
  }
}

function addRuntimeDependencies(selectedPaths, runtime, baseline) {
  for (const entry of baseline.inventory) selectedPaths.add(entry.path);
  selectedPaths.add(BASELINE_PATH);
  selectedPaths.add(baseline.owner_decision.path);
  selectedPaths.add(runtime.owner_decision.path);
  for (const repoPath of runtime.live_runtime_surfaces) selectedPaths.add(repoPath);
  selectedPaths.add(runtime.historical_runtime_policy.preserved_node_22_receipt);
  selectedPaths.add(runtime.historical_runtime_policy.preserved_node_24_decision);
  for (const repoPath of baseline.derived_current_views.excluded_from_inventory_to_prevent_digest_cycles) {
    selectedPaths.add(repoPath);
  }
}

function layerMapping(relativePath) {
  const topLevel = relativePath.split("/")[0];
  if (PRODUCT_ROOT_FILES.has(relativePath)) {
    return { group: "product", relativeTarget: relativePath };
  }
  if (ARCHITECTURE_ROOT_FILES.has(relativePath) || topLevel === "architecture") {
    return { group: "architecture", relativeTarget: relativePath };
  }
  if (topLevel === "authority" || topLevel === "definitions") {
    return { group: "authority", relativeTarget: relativePath };
  }
  if (topLevel === "ontology") {
    return { group: "ontology", relativeTarget: relativePath.slice("ontology/".length) };
  }
  if (topLevel === "research" || topLevel === "discovery") {
    return { group: "research", relativeTarget: relativePath };
  }
  return null;
}

function verifyFile(repoRoot, repoPath, expectedBytes, expectedDigest, label) {
  const absolutePath = path.join(repoRoot, repoPath);
  if (!existsSync(absolutePath)) fail(`${label} missing: ${repoPath}`);
  const stat = lstatSync(absolutePath);
  if (!stat.isFile()) fail(`${label} is not a regular file: ${repoPath}`);
  const bytes = readFileSync(absolutePath);
  if (bytes.length !== expectedBytes) fail(`${label} byte drift: ${repoPath}`);
  if (sha256(bytes) !== expectedDigest) fail(`${label} digest drift: ${repoPath}`);
}

function buildManifest(repoRoot, materializedAt) {
  const inventory = readJson(repoRoot, INVENTORY_PATH);
  const selection = readJson(repoRoot, SELECTION_PATH);
  const runtime = readJson(repoRoot, RUNTIME_PATH);
  const baseline = readJson(repoRoot, BASELINE_PATH);

  if (selection.selected_option_id !== "MIG-B-STAGED-SUCCESSOR") fail("MIG-B is not selected");
  if (selection.source_inventory_digest !== inventory.content_digest) fail("selection inventory digest drift");
  if (baseline.baseline_id !== runtime.canonical_meta_type_baseline.id) fail("runtime baseline identity drift");
  if (baseline.baseline_digest !== runtime.canonical_meta_type_baseline.digest) fail("runtime baseline digest drift");

  const byRepoPath = new Map(inventory.entries.map((entry) => [entry.repo_path, entry]));
  const selectedPaths = new Set(
    inventory.entries
      .filter((entry) => entry.source_area !== "development" && entry.source_area !== ".craft")
      .map((entry) => entry.repo_path),
  );
  addRuntimeDependencies(selectedPaths, runtime, baseline);

  const excludedMissingPaths = [];
  const sourceEntries = [];
  for (const repoPath of [...selectedPaths].sort()) {
    const entry = byRepoPath.get(repoPath);
    if (!entry) fail(`selected path absent from source inventory: ${repoPath}`);
    if (entry.kind === "missing") {
      excludedMissingPaths.push(repoPath);
      continue;
    }
    if (entry.kind !== "file") fail(`unsupported selected source kind ${entry.kind}: ${repoPath}`);
    verifyFile(repoRoot, repoPath, entry.bytes, entry.sha256, "source");
    sourceEntries.push({
      source_path: repoPath,
      relative_path: entry.path,
      bytes: entry.bytes,
      sha256: entry.sha256,
      captured_git_state: entry.git_state,
      selected_by: entry.source_area === "development" ? "baseline-runtime-closure" : "active-source-area",
    });
  }

  const copyEntries = [];
  for (const sourceEntry of sourceEntries) {
    const implementationTarget = path.posix.join(
      GROUPS.implementation.targetRoot,
      sourceEntry.relative_path,
    );
    copyEntries.push({
      group: "implementation",
      role: GROUPS.implementation.role,
      source_path: sourceEntry.source_path,
      target_path: implementationTarget,
      bytes: sourceEntry.bytes,
      sha256: sourceEntry.sha256,
    });
    const layer = layerMapping(sourceEntry.relative_path);
    if (layer) {
      copyEntries.push({
        group: layer.group,
        role: GROUPS[layer.group].role,
        source_path: sourceEntry.source_path,
        target_path: path.posix.join(GROUPS[layer.group].targetRoot, layer.relativeTarget),
        bytes: sourceEntry.bytes,
        sha256: sourceEntry.sha256,
      });
    }
  }
  copyEntries.sort((left, right) => left.target_path.localeCompare(right.target_path));
  if (new Set(copyEntries.map((entry) => entry.target_path)).size !== copyEntries.length) {
    fail("duplicate target path in migration manifest");
  }

  const body = {
    schema_version: "cav2.domainspec-v2.mig-b-manifest/v1",
    migration_id: "CAV2-DOMAINSPEC-V2-MIG-B-001",
    status: "materialization-candidate",
    authority_effect: "none",
    visibility: "private",
    materialized_at: materializedAt,
    selected_option_id: selection.selected_option_id,
    selection_ref: SELECTION_PATH,
    selection_sha256: sha256(readFileSync(path.join(repoRoot, SELECTION_PATH))),
    source_root: SOURCE_ROOT,
    source_inventory_ref: INVENTORY_PATH,
    source_inventory_digest: inventory.content_digest,
    baseline: {
      id: baseline.baseline_id,
      digest: baseline.baseline_digest,
      manifest_ref: BASELINE_PATH,
      manifest_sha256: sha256(readFileSync(path.join(repoRoot, BASELINE_PATH))),
      frozen_evidence_files: baseline.inventory.length,
    },
    policy: {
      current_source_mutation: "forbidden",
      historical_development_import: "only-exact-baseline-and-runtime-closure",
      target_collision: "absent-or-exact-identical",
      target_publication: "atomic-by-destination-group",
      old_source_deletion: "forbidden",
    },
    summary: {
      selected_source_entries: sourceEntries.length,
      excluded_missing_entries: excludedMissingPaths.length,
      copy_entries: copyEntries.length,
      selected_source_bytes: sourceEntries.reduce((total, entry) => total + entry.bytes, 0),
      copied_bytes: copyEntries.reduce((total, entry) => total + entry.bytes, 0),
    },
    excluded_missing_paths: excludedMissingPaths,
    groups: Object.fromEntries(
      Object.entries(GROUPS).map(([id, group]) => [
        id,
        {
          role: group.role,
          target_root: group.targetRoot,
          copy_entries: copyEntries.filter((entry) => entry.group === id).length,
        },
      ]),
    ),
    source_entries: sourceEntries,
    copy_entries: copyEntries,
    claim_ceiling: {
      exact_additive_copy: true,
      successor_runtime_rebound: false,
      successor_baseline_admitted: false,
      authority_switched: false,
      old_source_deleted: false,
      publication: false,
      release: false,
      deployment: false,
      production: false,
    },
  };
  return { ...body, manifest_digest: canonicalDigest(body) };
}

function targetState(repoRoot, manifest) {
  const states = {};
  for (const [groupId, group] of Object.entries(manifest.groups)) {
    const entries = manifest.copy_entries.filter((entry) => entry.group === groupId);
    const rootExists = existsSync(path.join(repoRoot, group.target_root));
    if (!rootExists) {
      states[groupId] = "absent";
      continue;
    }
    for (const entry of entries) {
      verifyFile(repoRoot, entry.target_path, entry.bytes, entry.sha256, "target collision");
    }
    states[groupId] = "exact-existing";
  }
  return states;
}

function stageAndPublish(repoRoot, manifest, states) {
  const stageRoot = path.join(repoRoot, MIGRATION_ROOT, `.stage-${process.pid}`);
  if (existsSync(stageRoot)) fail(`staging root already exists: ${stageRoot}`);
  mkdirSync(stageRoot, { recursive: true });
  try {
    for (const [groupId, group] of Object.entries(manifest.groups)) {
      if (states[groupId] === "exact-existing") continue;
      const stagedGroupRoot = path.join(stageRoot, groupId);
      const entries = manifest.copy_entries.filter((entry) => entry.group === groupId);
      for (const entry of entries) {
        const relativeTarget = path.posix.relative(group.target_root, entry.target_path);
        const stagedTarget = path.join(stagedGroupRoot, relativeTarget);
        mkdirSync(path.dirname(stagedTarget), { recursive: true });
        copyFileSync(path.join(repoRoot, entry.source_path), stagedTarget);
        const stagedBytes = readFileSync(stagedTarget);
        if (stagedBytes.length !== entry.bytes || sha256(stagedBytes) !== entry.sha256) {
          fail(`staged byte verification failed: ${entry.target_path}`);
        }
      }
    }

    for (const [groupId, group] of Object.entries(manifest.groups)) {
      if (states[groupId] === "exact-existing") continue;
      const targetRoot = path.join(repoRoot, group.target_root);
      if (existsSync(targetRoot)) fail(`target appeared during staging: ${group.target_root}`);
      mkdirSync(path.dirname(targetRoot), { recursive: true });
      renameSync(path.join(stageRoot, groupId), targetRoot);
      states[groupId] = "published";
    }
  } finally {
    if (existsSync(stageRoot)) rmSync(stageRoot, { recursive: true, force: false });
  }
}

function receiptFor(manifest, states) {
  return {
    schema_version: "cav2.domainspec-v2.mig-b-materialization-receipt/v1",
    migration_id: manifest.migration_id,
    status: "pass",
    authority_effect: "none",
    materialized_at: manifest.materialized_at,
    manifest_ref: MANIFEST_PATH,
    manifest_digest: manifest.manifest_digest,
    source_inventory_digest: manifest.source_inventory_digest,
    baseline_id: manifest.baseline.id,
    baseline_digest: manifest.baseline.digest,
    selected_source_entries: manifest.summary.selected_source_entries,
    copy_entries: manifest.summary.copy_entries,
    copied_bytes: manifest.summary.copied_bytes,
    group_results: Object.fromEntries(
      Object.entries(manifest.groups).map(([id, group]) => [
        id,
        {
          target_root: group.target_root,
          copy_entries: group.copy_entries,
          result: states[id] === "published" ? "published" : "exact-existing",
        },
      ]),
    ),
    source_mutated: false,
    target_exact: true,
    successor_runtime_rebound: false,
    successor_baseline_admitted: false,
    authority_switched: false,
    old_source_deleted: false,
    publication: false,
    release: false,
    deployment: false,
    production: false,
  };
}

const options = parseArguments(process.argv.slice(2));
const repoRoot = findRepositoryRoot(process.cwd());
const manifest = buildManifest(repoRoot, options.materializedAt);
const manifestBytes = json(manifest);
const states = targetState(repoRoot, manifest);

if (options.mode === "write") {
  const manifestAbsolute = path.join(repoRoot, MANIFEST_PATH);
  if (existsSync(manifestAbsolute) && readFileSync(manifestAbsolute, "utf8") !== manifestBytes) {
    fail("existing migration manifest drift");
  }
  writeAtomic(manifestAbsolute, manifestBytes);
  stageAndPublish(repoRoot, manifest, states);
  for (const entry of manifest.copy_entries) {
    verifyFile(repoRoot, entry.target_path, entry.bytes, entry.sha256, "published target");
  }
  const receipt = receiptFor(manifest, states);
  writeAtomic(path.join(repoRoot, RECEIPT_PATH), json(receipt));
} else {
  const manifestAbsolute = path.join(repoRoot, MANIFEST_PATH);
  const receiptAbsolute = path.join(repoRoot, RECEIPT_PATH);
  if (!existsSync(manifestAbsolute) || readFileSync(manifestAbsolute, "utf8") !== manifestBytes) {
    fail("migration manifest absent or drifted");
  }
  if (!existsSync(receiptAbsolute)) fail("materialization receipt absent");
  const receipt = readJson(repoRoot, RECEIPT_PATH);
  if (receipt.status !== "pass" || receipt.manifest_digest !== manifest.manifest_digest) {
    fail("materialization receipt binding drift");
  }
  for (const entry of manifest.copy_entries) {
    verifyFile(repoRoot, entry.target_path, entry.bytes, entry.sha256, "materialized target");
  }
}

process.stdout.write(
  `${options.mode}: ${manifest.summary.selected_source_entries} selected sources, ` +
    `${manifest.summary.copy_entries} exact copies, ${manifest.summary.copied_bytes} bytes, ` +
    `${manifest.manifest_digest}\n`,
);
