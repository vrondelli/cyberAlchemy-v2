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
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const OLD_ROOT = "projects/domainspec-v2";
const MIGRATION_ROOT = "cyberAlchemy-v2/development/domainspec-v2/migration/mig-b";
const MATERIALIZATION_MANIFEST_PATH = `${MIGRATION_ROOT}/MIGRATION-MANIFEST.json`;
const MATERIALIZATION_RECEIPT_PATH = `${MIGRATION_ROOT}/MATERIALIZATION-RECEIPT.json`;
const MANIFEST_PATH = `${MIGRATION_ROOT}/REBIND-MANIFEST.json`;
const RECEIPT_PATH = `${MIGRATION_ROOT}/REBIND-RECEIPT.json`;

const CANDIDATE_GROUPS = {
  implementation: "cyberAlchemy-v2/implementation/domainspec-v2/rebound-candidate",
  product: "cyberAlchemy-v2/product/domainspec-v2/rebound-candidate",
  architecture: "cyberAlchemy-v2/architecture/domainspec-v2/rebound-candidate",
  authority: "cyberAlchemy-v2/authority/domainspec-v2/rebound-candidate",
  ontology: "cyberAlchemy-v2/ontology/domainspec-v2/rebound-candidate",
  research: "cyberAlchemy-v2/research/domainspec-v2/rebound-candidate",
};

const REPLACEMENTS = [
  [`${OLD_ROOT}/definitions`, `${CANDIDATE_GROUPS.authority}/definitions`],
  [`${OLD_ROOT}/authority`, `${CANDIDATE_GROUPS.authority}/authority`],
  [`${OLD_ROOT}/architecture`, `${CANDIDATE_GROUPS.architecture}/architecture`],
  [`${OLD_ROOT}/ontology`, CANDIDATE_GROUPS.ontology],
  [`${OLD_ROOT}/research`, `${CANDIDATE_GROUPS.research}/research`],
  [`${OLD_ROOT}/discovery`, `${CANDIDATE_GROUPS.research}/discovery`],
  [`${OLD_ROOT}/impl`, `${CANDIDATE_GROUPS.implementation}/impl`],
  [`${OLD_ROOT}/formalization`, `${CANDIDATE_GROUPS.implementation}/formalization`],
  [`${OLD_ROOT}/development`, `${CANDIDATE_GROUPS.implementation}/development`],
  [`${OLD_ROOT}/PRODUCT-THESIS.md`, `${CANDIDATE_GROUPS.product}/PRODUCT-THESIS.md`],
  [`${OLD_ROOT}/COMPLETE-GUIDE`, `${CANDIDATE_GROUPS.product}/COMPLETE-GUIDE`],
  [`${OLD_ROOT}/README.md`, `${CANDIDATE_GROUPS.product}/README.md`],
  [`${OLD_ROOT}/ARCHITECTURE.md`, `${CANDIDATE_GROUPS.architecture}/ARCHITECTURE.md`],
  [`${OLD_ROOT}/RELATED-FRAMEWORK-CROSSWALK.md`, `${CANDIDATE_GROUPS.architecture}/RELATED-FRAMEWORK-CROSSWALK.md`],
  [OLD_ROOT, CANDIDATE_GROUPS.implementation],
];

function fail(message) {
  process.stderr.write(`mig-b-rebind: ${message}\n`);
  process.exit(1);
}

function parseArguments(argv) {
  const options = { reboundAt: null, mode: "check" };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--rebound-at") options.reboundAt = argv[++index];
    else if (value === "--write") options.mode = "write";
    else if (value === "--check") options.mode = "check";
    else fail(`unknown argument: ${value}`);
  }
  if (!options.reboundAt || Number.isNaN(Date.parse(options.reboundAt))) {
    fail("--rebound-at must be an explicit ISO-8601 timestamp");
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

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
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

function verifyFile(repoRoot, repoPath, expectedBytes, expectedDigest, label) {
  const absolutePath = path.join(repoRoot, repoPath);
  if (!existsSync(absolutePath)) fail(`${label} missing: ${repoPath}`);
  if (!lstatSync(absolutePath).isFile()) fail(`${label} is not a regular file: ${repoPath}`);
  const bytes = readFileSync(absolutePath);
  if (bytes.length !== expectedBytes) fail(`${label} byte drift: ${repoPath}`);
  if (sha256(bytes) !== expectedDigest) fail(`${label} digest drift: ${repoPath}`);
  return bytes;
}

function rebindBytes(bytes) {
  const text = bytes.toString("utf8");
  if (!Buffer.from(text, "utf8").equals(bytes) || !text.includes(OLD_ROOT)) {
    return { bytes, occurrences: 0, replacement_counts: {} };
  }
  let result = text;
  const replacementCounts = {};
  let occurrences = 0;
  for (const [from, to] of REPLACEMENTS) {
    const count = result.split(from).length - 1;
    if (count === 0) continue;
    result = result.split(from).join(to);
    replacementCounts[from] = count;
    occurrences += count;
  }
  return { bytes: Buffer.from(result, "utf8"), occurrences, replacement_counts: replacementCounts };
}

function buildManifest(repoRoot, reboundAt) {
  const materialization = readJson(repoRoot, MATERIALIZATION_MANIFEST_PATH);
  const materializationReceipt = readJson(repoRoot, MATERIALIZATION_RECEIPT_PATH);
  if (materializationReceipt.status !== "pass") fail("materialization receipt is not PASS");
  if (materializationReceipt.manifest_digest !== materialization.manifest_digest) {
    fail("materialization receipt/manifest binding drift");
  }

  const entries = [];
  for (const preimage of materialization.copy_entries) {
    const sourceGroup = materialization.groups[preimage.group];
    const candidateRoot = CANDIDATE_GROUPS[preimage.group];
    if (!sourceGroup || !candidateRoot) fail(`unknown materialization group: ${preimage.group}`);
    const relativeTarget = path.posix.relative(sourceGroup.target_root, preimage.target_path);
    const preimageBytes = verifyFile(
      repoRoot,
      preimage.target_path,
      preimage.bytes,
      preimage.sha256,
      "materialization preimage",
    );
    const rebound = rebindBytes(preimageBytes);
    entries.push({
      group: preimage.group,
      role: preimage.role,
      preimage_path: preimage.target_path,
      target_path: path.posix.join(candidateRoot, relativeTarget),
      preimage_bytes: preimage.bytes,
      preimage_sha256: preimage.sha256,
      target_bytes: rebound.bytes.length,
      target_sha256: sha256(rebound.bytes),
      old_root_occurrences_rebound: rebound.occurrences,
      replacement_counts: rebound.replacement_counts,
    });
  }
  entries.sort((left, right) => left.target_path.localeCompare(right.target_path));
  if (new Set(entries.map((entry) => entry.target_path)).size !== entries.length) {
    fail("duplicate rebound target path");
  }

  const body = {
    schema_version: "cav2.domainspec-v2.mig-b-rebind-manifest/v1",
    migration_id: materialization.migration_id,
    stage_id: "CAV2-DOMAINSPEC-V2-MIG-B-REBIND-001",
    status: "rebound-candidate",
    authority_effect: "none",
    visibility: "private",
    rebound_at: reboundAt,
    materialization_manifest_ref: MATERIALIZATION_MANIFEST_PATH,
    materialization_manifest_digest: materialization.manifest_digest,
    old_root: OLD_ROOT,
    replacements: Object.fromEntries(REPLACEMENTS),
    summary: {
      copy_entries: entries.length,
      preimage_bytes: entries.reduce((total, entry) => total + entry.preimage_bytes, 0),
      target_bytes: entries.reduce((total, entry) => total + entry.target_bytes, 0),
      files_rebound: entries.filter((entry) => entry.old_root_occurrences_rebound > 0).length,
      old_root_occurrences_rebound: entries.reduce(
        (total, entry) => total + entry.old_root_occurrences_rebound,
        0,
      ),
    },
    groups: Object.fromEntries(
      Object.entries(CANDIDATE_GROUPS).map(([id, targetRoot]) => [
        id,
        {
          target_root: targetRoot,
          entries: entries.filter((entry) => entry.group === id).length,
        },
      ]),
    ),
    entries,
    claim_ceiling: {
      every_materialized_preimage_verified: true,
      every_literal_old_root_reference_removed: true,
      baseline_v10_identity_valid_for_rebound_candidate: false,
      successor_baseline_required: true,
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
    const targetRoot = path.join(repoRoot, group.target_root);
    if (!existsSync(targetRoot)) {
      states[groupId] = "absent";
      continue;
    }
    for (const entry of manifest.entries.filter((value) => value.group === groupId)) {
      verifyFile(repoRoot, entry.target_path, entry.target_bytes, entry.target_sha256, "rebound target collision");
    }
    states[groupId] = "exact-existing";
  }
  return states;
}

function stageAndPublish(repoRoot, manifest, states) {
  const stageRoot = path.join(repoRoot, MIGRATION_ROOT, `.rebind-stage-${process.pid}`);
  if (existsSync(stageRoot)) fail(`staging root already exists: ${stageRoot}`);
  mkdirSync(stageRoot, { recursive: true });
  try {
    for (const [groupId] of Object.entries(manifest.groups)) {
      if (states[groupId] === "exact-existing") continue;
      const stagedGroupRoot = path.join(stageRoot, groupId);
      for (const entry of manifest.entries.filter((value) => value.group === groupId)) {
        const relativeTarget = path.posix.relative(CANDIDATE_GROUPS[groupId], entry.target_path);
        const stagedTarget = path.join(stagedGroupRoot, relativeTarget);
        mkdirSync(path.dirname(stagedTarget), { recursive: true });
        const preimageBytes = readFileSync(path.join(repoRoot, entry.preimage_path));
        const rebound = rebindBytes(preimageBytes);
        writeFileSync(stagedTarget, rebound.bytes);
        verifyFile(stageRoot, path.posix.join(groupId, relativeTarget), entry.target_bytes, entry.target_sha256, "staged rebound");
      }
    }
    for (const [groupId, group] of Object.entries(manifest.groups)) {
      if (states[groupId] === "exact-existing") continue;
      const targetRoot = path.join(repoRoot, group.target_root);
      if (existsSync(targetRoot)) fail(`rebound target appeared during staging: ${group.target_root}`);
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
    schema_version: "cav2.domainspec-v2.mig-b-rebind-receipt/v1",
    migration_id: manifest.migration_id,
    stage_id: manifest.stage_id,
    status: "pass",
    authority_effect: "none",
    rebound_at: manifest.rebound_at,
    manifest_ref: MANIFEST_PATH,
    manifest_digest: manifest.manifest_digest,
    materialization_manifest_digest: manifest.materialization_manifest_digest,
    copy_entries: manifest.summary.copy_entries,
    files_rebound: manifest.summary.files_rebound,
    old_root_occurrences_rebound: manifest.summary.old_root_occurrences_rebound,
    group_results: Object.fromEntries(
      Object.entries(manifest.groups).map(([id, group]) => [
        id,
        {
          target_root: group.target_root,
          entries: group.entries,
          result: states[id] === "published" ? "published" : "exact-existing",
        },
      ]),
    ),
    exact_materialization_preserved: true,
    every_literal_old_root_reference_removed: true,
    baseline_v10_identity_valid_for_rebound_candidate: false,
    successor_baseline_required: true,
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
const manifest = buildManifest(repoRoot, options.reboundAt);
const manifestBytes = json(manifest);
const states = targetState(repoRoot, manifest);

if (options.mode === "write") {
  const manifestAbsolute = path.join(repoRoot, MANIFEST_PATH);
  if (existsSync(manifestAbsolute) && readFileSync(manifestAbsolute, "utf8") !== manifestBytes) {
    fail("existing rebind manifest drift");
  }
  writeAtomic(manifestAbsolute, manifestBytes);
  stageAndPublish(repoRoot, manifest, states);
  for (const entry of manifest.entries) {
    const bytes = verifyFile(repoRoot, entry.target_path, entry.target_bytes, entry.target_sha256, "published rebound");
    if (bytes.includes(Buffer.from(OLD_ROOT, "utf8"))) fail(`old root remains in rebound target: ${entry.target_path}`);
  }
  writeAtomic(path.join(repoRoot, RECEIPT_PATH), json(receiptFor(manifest, states)));
} else {
  const manifestAbsolute = path.join(repoRoot, MANIFEST_PATH);
  const receiptAbsolute = path.join(repoRoot, RECEIPT_PATH);
  if (!existsSync(manifestAbsolute) || readFileSync(manifestAbsolute, "utf8") !== manifestBytes) {
    fail("rebind manifest absent or drifted");
  }
  if (!existsSync(receiptAbsolute)) fail("rebind receipt absent");
  const receipt = readJson(repoRoot, RECEIPT_PATH);
  if (receipt.status !== "pass" || receipt.manifest_digest !== manifest.manifest_digest) {
    fail("rebind receipt binding drift");
  }
  for (const entry of manifest.entries) {
    const bytes = verifyFile(repoRoot, entry.target_path, entry.target_bytes, entry.target_sha256, "rebound target");
    if (bytes.includes(Buffer.from(OLD_ROOT, "utf8"))) fail(`old root remains in rebound target: ${entry.target_path}`);
  }
}

process.stdout.write(
  `${options.mode}: ${manifest.summary.copy_entries} files, ${manifest.summary.files_rebound} rebound, ` +
    `${manifest.summary.old_root_occurrences_rebound} occurrences, ${manifest.manifest_digest}\n`,
);
