#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const SCHEMA_VERSION = "domainspec-v2.source-inventory/v1";
const INDEX_SCHEMA_VERSION = "inventory.index.v0.1";
const CONSUMER_SCHEMA_VERSION = "domainspec-v2.path-consumers/v1";

function fail(message) {
  process.stderr.write(`inventory: ${message}\n`);
  process.exit(1);
}

function parseArguments(argv) {
  const result = {
    capturedAt: null,
    gitInputRoot: "cyberAlchemy-v2/inventory/domainspec-v2/snapshot-inputs",
    mode: "check",
    outputRoot: "cyberAlchemy-v2/inventory/domainspec-v2",
    sourceRoot: "projects/domainspec-v2",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--write") {
      result.mode = "write";
    } else if (value === "--check") {
      result.mode = "check";
    } else if (value === "--captured-at") {
      result.capturedAt = argv[++index];
    } else if (value === "--source-root") {
      result.sourceRoot = argv[++index];
    } else if (value === "--output-root") {
      result.outputRoot = argv[++index];
    } else if (value === "--git-input-root") {
      result.gitInputRoot = argv[++index];
    } else {
      fail(`unknown argument: ${value}`);
    }
  }

  if (!result.capturedAt || Number.isNaN(Date.parse(result.capturedAt))) {
    fail("--captured-at must be an explicit ISO-8601 timestamp");
  }
  return result;
}

function run(command, args, options = {}) {
  try {
    return execFileSync(command, args, {
      cwd: options.cwd,
      encoding: options.encoding ?? "utf8",
      maxBuffer: 128 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    if (options.allowNoMatches && error.status === 1) {
      return options.encoding === "buffer" ? Buffer.alloc(0) : "";
    }
    const detail = error.stderr?.toString().trim();
    fail(`${command} failed${detail ? `: ${detail}` : ""}`);
  }
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function canonicalDigest(value) {
  return sha256(Buffer.from(json(value), "utf8"));
}

function splitNul(value) {
  return value.split("\0").filter(Boolean);
}

function findRepositoryRoot(startPath) {
  let candidate = path.resolve(startPath);
  while (true) {
    if (existsSync(path.join(candidate, ".git"))) return candidate;
    const parent = path.dirname(candidate);
    if (parent === candidate) {
      fail(`cannot locate repository root from ${startPath}`);
    }
    candidate = parent;
  }
}

function parseStatus(raw) {
  const records = splitNul(raw);
  const statuses = new Map();

  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    const code = record.slice(0, 2);
    const repoPath = record.slice(3).replaceAll("\\", "/");
    statuses.set(repoPath, code);
    if (code.includes("R") || code.includes("C")) {
      index += 1;
    }
  }
  return statuses;
}

function gitState(code, exists) {
  if (!exists) return "deleted";
  if (!code) return "clean";
  if (code === "??") return "untracked";
  if (code.includes("D")) return "deleted";
  if (code.includes("R")) return "renamed";
  if (code.includes("C")) return "copied";
  if (code.includes("A")) return "added";
  if (code.includes("M")) return "modified";
  if (code.includes("U")) return "unmerged";
  return "changed";
}

function classify(relativePath) {
  const segments = relativePath.split("/");
  const topLevel = segments.length === 1 ? "(root)" : segments[0];
  const filename = segments.at(-1);

  if (topLevel === "architecture") {
    return {
      source_area: topLevel,
      target_layer: "architecture/domainspec-v2",
      migration_policy: "layered-successor-candidate",
    };
  }
  if (topLevel === "ontology") {
    return {
      source_area: topLevel,
      target_layer: "ontology/domainspec-v2",
      migration_policy: "layered-successor-candidate",
    };
  }
  if (topLevel === "impl" || topLevel === "formalization") {
    return {
      source_area: topLevel,
      target_layer: "implementation/domainspec-v2",
      migration_policy: "layered-successor-candidate",
    };
  }
  if (topLevel === "research" || topLevel === "discovery") {
    return {
      source_area: topLevel,
      target_layer: "research/domainspec-v2",
      migration_policy: "layered-successor-candidate",
    };
  }
  if (topLevel === "authority" || topLevel === "definitions") {
    return {
      source_area: topLevel,
      target_layer: "authority/domainspec-v2",
      migration_policy: "owner-gated-import",
    };
  }
  if (topLevel === "development" || topLevel === ".craft") {
    return {
      source_area: topLevel,
      target_layer: "development/domainspec-v2",
      migration_policy: "retain-in-place-until-rebaselined",
    };
  }

  if (filename === "PRODUCT-THESIS.md") {
    return {
      source_area: topLevel,
      target_layer: "product/domainspec-v2",
      migration_policy: "layered-successor-candidate",
    };
  }
  if (filename === "ARCHITECTURE.md" || filename === "RELATED-FRAMEWORK-CROSSWALK.md") {
    return {
      source_area: topLevel,
      target_layer: "architecture/domainspec-v2",
      migration_policy: "layered-successor-candidate",
    };
  }
  if (filename === "RUNTIME.json" || filename === "validate-runtime.mjs") {
    return {
      source_area: topLevel,
      target_layer: "implementation/domainspec-v2",
      migration_policy: "layered-successor-candidate",
    };
  }
  if (filename.startsWith("COMPLETE-GUIDE") || filename === "README.md") {
    return {
      source_area: topLevel,
      target_layer: "product/domainspec-v2",
      migration_policy: "layered-successor-candidate",
    };
  }
  return {
    source_area: topLevel,
    target_layer: "development/domainspec-v2",
    migration_policy: "review-required",
  };
}

function fileEntry(repoRoot, sourceRoot, repoPath, statusCode) {
  const absolutePath = path.join(repoRoot, repoPath);
  const relativePath = path.posix.relative(sourceRoot, repoPath);
  const present = existsSync(absolutePath);
  const classification = classify(relativePath);

  if (!present) {
    return {
      path: relativePath,
      repo_path: repoPath,
      kind: "missing",
      bytes: null,
      sha256: null,
      git_state: gitState(statusCode, false),
      git_code: statusCode ?? null,
      ...classification,
    };
  }

  const stat = lstatSync(absolutePath);
  let kind = "other";
  let bytes = null;
  let digest = null;
  if (stat.isSymbolicLink()) {
    const linkTarget = Buffer.from(readlinkSync(absolutePath), "utf8");
    kind = "symlink";
    bytes = linkTarget.byteLength;
    digest = sha256(linkTarget);
  } else if (stat.isFile()) {
    const fileBytes = readFileSync(absolutePath);
    kind = "file";
    bytes = fileBytes.byteLength;
    digest = sha256(fileBytes);
  }

  return {
    path: relativePath,
    repo_path: repoPath,
    kind,
    bytes,
    sha256: digest,
    git_state: gitState(statusCode, true),
    git_code: statusCode ?? null,
    ...classification,
  };
}

function addCount(record, key) {
  record[key] = (record[key] ?? 0) + 1;
}

function summarize(entries) {
  const bySourceArea = {};
  const byTargetLayer = {};
  const byGitState = {};
  const byKind = {};
  let presentBytes = 0;
  for (const entry of entries) {
    addCount(bySourceArea, entry.source_area);
    addCount(byTargetLayer, entry.target_layer);
    addCount(byGitState, entry.git_state);
    addCount(byKind, entry.kind);
    presentBytes += entry.bytes ?? 0;
  }
  return {
    entry_count: entries.length,
    present_bytes: presentBytes,
    by_source_area: Object.fromEntries(Object.entries(bySourceArea).sort()),
    by_target_layer: Object.fromEntries(Object.entries(byTargetLayer).sort()),
    by_git_state: Object.fromEntries(Object.entries(byGitState).sort()),
    by_kind: Object.fromEntries(Object.entries(byKind).sort()),
  };
}

function readPathConsumers(repoRoot, sourceRoot, outputRoot) {
  const matches = run(
    "rg",
    [
      "-l",
      "-0",
      "--hidden",
      "--fixed-strings",
      "--glob",
      `!${sourceRoot}/**`,
      "--glob",
      `!${outputRoot}/**`,
      "--glob",
      "!cyberAlchemy-v2/development/domainspec-v2/migration/mig-b/**",
      "--glob",
      "!cyberAlchemy-v2/product/domainspec-v2/**",
      "--glob",
      "!cyberAlchemy-v2/architecture/domainspec-v2/**",
      "--glob",
      "!cyberAlchemy-v2/ontology/domainspec-v2/**",
      "--glob",
      "!cyberAlchemy-v2/authority/decisions/domainspec-v2-migration/**",
      sourceRoot,
      ".",
    ],
    { cwd: repoRoot, allowNoMatches: true },
  );
  const paths = splitNul(matches)
    .map((value) => value.replace(/^\.\//, "").replaceAll("\\", "/"))
    .sort();
  return paths.map((repoPath) => {
    const text = readFileSync(path.join(repoRoot, repoPath), "utf8");
    const occurrenceCount = text.split(sourceRoot).length - 1;
    return {
      repo_path: repoPath,
      occurrence_count: occurrenceCount,
      consumer_scope: repoPath.startsWith("cyberAlchemy-v2/")
        ? "cyberAlchemy-v2"
        : repoPath.split("/")[0] || "(root)",
      migration_risk: "literal-source-path-binding",
    };
  });
}

function buildIndex(capturedAt, sourceManifest, pathConsumers) {
  const cyberAlchemyConsumers = pathConsumers.entries.filter(
    (entry) => entry.consumer_scope === "cyberAlchemy-v2",
  ).length;
  return {
    schema_version: INDEX_SCHEMA_VERSION,
    inventory_id: "domainspec-v2-project-inventory@1",
    title: "DomainSpec v2 Project Inventory",
    status: "current",
    authority_effect: "none",
    visibility: "private",
    captured_at: capturedAt,
    source_root: sourceManifest.source_root,
    source_manifest_ref: "source-manifest.json",
    source_manifest_digest: sourceManifest.content_digest,
    path_consumers_ref: "path-consumers.json",
    totals: {
      source_entries: sourceManifest.summary.entry_count,
      present_bytes: sourceManifest.summary.present_bytes,
      dirty_entries:
        sourceManifest.summary.entry_count -
        (sourceManifest.summary.by_git_state.clean ?? 0),
      external_path_consumers: pathConsumers.summary.consumer_file_count,
      cyberalchemy_path_consumers: cyberAlchemyConsumers,
    },
    entries: [
      {
        id: "domainspec-v2-project-surface",
        title: "Project surface",
        artifact_kind: "inventory-entry",
        status: "current",
        confidence: "high",
        authority_effect: "none",
        tags: ["domainspec-v2", "project-surface", "exact-bytes"],
        source_refs: ["source-manifest.json", "entries/PROJECT-SURFACE.md"],
      },
      {
        id: "domainspec-v2-layer-map",
        title: "CyberAlchemy layer map",
        artifact_kind: "migration-map",
        status: "candidate",
        confidence: "high",
        authority_effect: "none",
        tags: ["domainspec-v2", "cyberalchemy-v2", "layer-map"],
        source_refs: ["entries/LAYER-MAP.md"],
      },
      {
        id: "domainspec-v2-path-risk",
        title: "Path and frozen-evidence risk",
        artifact_kind: "risk-entry",
        status: "current",
        confidence: "high",
        authority_effect: "none",
        tags: ["domainspec-v2", "path-binding", "frozen-evidence"],
        source_refs: ["path-consumers.json", "entries/PATH-AND-EVIDENCE-RISK.md"],
      },
      {
        id: "domainspec-v2-gaps",
        title: "Gaps and contradictions",
        artifact_kind: "gap-register",
        status: "open",
        confidence: "high",
        authority_effect: "none",
        tags: ["domainspec-v2", "drift", "migration-gate"],
        source_refs: ["entries/GAPS-AND-CONTRADICTIONS.md"],
      },
      {
        id: "domainspec-v2-migration-readiness",
        title: "Migration readiness",
        artifact_kind: "readiness-entry",
        status: "blocked-on-decision",
        confidence: "high",
        authority_effect: "none",
        tags: ["domainspec-v2", "migration", "decision-gate"],
        source_refs: ["entries/MIGRATION-READINESS.md"],
      },
    ],
  };
}

function markdownTable(object) {
  return Object.entries(object)
    .map(([key, value]) => `| \`${key}\` | ${value} |`)
    .join("\n");
}

function buildIndexMarkdown(index, sourceManifest) {
  return `---
document_id: domainspec-v2-project-inventory-index/v1
status: current
authority_effect: none
visibility: private
captured_at: ${index.captured_at}
---

# DomainSpec v2 Project Inventory

This is the human projection of \`${index.inventory_id}\`. The machine source is
[\`index.json\`](index.json); the exact file ledger is [\`source-manifest.json\`](source-manifest.json).
Inventory records source state and migration risk. It does not promote, relocate, accept, publish, or
delete anything.

## Snapshot

| Measure | Value |
| --- | ---: |
| Source entries | ${index.totals.source_entries} |
| Present bytes inventoried | ${index.totals.present_bytes} |
| Dirty or missing entries | ${index.totals.dirty_entries} |
| External files containing the literal source path | ${index.totals.external_path_consumers} |
| Those consumers inside CyberAlchemy v2 | ${index.totals.cyberalchemy_path_consumers} |
| Source manifest digest | \`${index.source_manifest_digest}\` |

Ignored and ephemeral files are intentionally outside the exact-byte ledger. Tracked files that are
currently missing remain represented as \`kind: missing\` and \`git_state: deleted\`.

## Source areas

| Source area | Entries |
| --- | ---: |
${markdownTable(sourceManifest.summary.by_source_area)}

## Proposed CyberAlchemy layers

| Target layer | Entries |
| --- | ---: |
${markdownTable(sourceManifest.summary.by_target_layer)}

## Git state

| State | Entries |
| --- | ---: |
${markdownTable(sourceManifest.summary.by_git_state)}

## Inventory entries

| ID | Status | Record |
| --- | --- | --- |
| \`domainspec-v2-project-surface\` | current | [Project surface](entries/PROJECT-SURFACE.md) |
| \`domainspec-v2-layer-map\` | candidate | [Layer map](entries/LAYER-MAP.md) |
| \`domainspec-v2-path-risk\` | current | [Path and evidence risk](entries/PATH-AND-EVIDENCE-RISK.md) |
| \`domainspec-v2-gaps\` | open | [Gaps and contradictions](entries/GAPS-AND-CONTRADICTIONS.md) |
| \`domainspec-v2-migration-readiness\` | blocked-on-decision | [Migration readiness](entries/MIGRATION-READINESS.md) |

## Open Questions

The migration-mode decision remains open. See [Migration readiness](entries/MIGRATION-READINESS.md)
and the separately owned Decision Gate record before any source relocation or canonical promotion.
`;
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

function verifySorted(entries, key) {
  const values = entries.map((entry) => entry[key]);
  const sorted = [...values].sort();
  if (JSON.stringify(values) !== JSON.stringify(sorted)) {
    fail(`${key} entries are not sorted`);
  }
}

const options = parseArguments(process.argv.slice(2));
const repoRoot = findRepositoryRoot(process.cwd());

const sourceRoot = options.sourceRoot.replace(/\/$/, "");
const outputRoot = options.outputRoot.replace(/\/$/, "");
const gitInputRoot = options.gitInputRoot.replace(/\/$/, "");
if (!existsSync(path.join(repoRoot, sourceRoot))) {
  fail(`source root does not exist: ${sourceRoot}`);
}

const gitFilesPath = path.join(repoRoot, gitInputRoot, "git-files.nul");
const gitStatusPath = path.join(repoRoot, gitInputRoot, "git-status.nul");
const gitMetadataPath = path.join(repoRoot, gitInputRoot, "metadata.json");
for (const requiredPath of [gitFilesPath, gitStatusPath, gitMetadataPath]) {
  if (!existsSync(requiredPath)) {
    fail(`missing Git snapshot input: ${path.posix.relative(repoRoot, requiredPath)}`);
  }
}
const gitFilesBytes = readFileSync(gitFilesPath);
const gitStatusBytes = readFileSync(gitStatusPath);
const gitMetadata = JSON.parse(readFileSync(gitMetadataPath, "utf8"));
if (gitMetadata.captured_at !== options.capturedAt) {
  fail("Git snapshot captured_at does not match --captured-at");
}
if (gitMetadata.source_root !== sourceRoot) {
  fail("Git snapshot source_root does not match --source-root");
}
if (gitMetadata.git_files_sha256 !== sha256(gitFilesBytes)) {
  fail("git-files.nul digest mismatch");
}
if (gitMetadata.git_status_sha256 !== sha256(gitStatusBytes)) {
  fail("git-status.nul digest mismatch");
}

const statuses = parseStatus(gitStatusBytes.toString("utf8"));
const listedPaths = splitNul(gitFilesBytes.toString("utf8"))
  .map((repoPath) => repoPath.replaceAll("\\", "/"))
  .filter((repoPath) => repoPath === sourceRoot || repoPath.startsWith(`${sourceRoot}/`));

const uniquePaths = [...new Set(listedPaths)].sort();
const entries = uniquePaths.map((repoPath) =>
  fileEntry(repoRoot, sourceRoot, repoPath, statuses.get(repoPath)),
);
verifySorted(entries, "path");

const sourceContent = { entries };
const sourceManifest = {
  schema_version: SCHEMA_VERSION,
  inventory_id: "domainspec-v2-source-snapshot@1",
  status: "current",
  authority_effect: "none",
  visibility: "private",
  captured_at: options.capturedAt,
  source_root: sourceRoot,
  git_snapshot: {
    metadata_ref: path.posix.join(gitInputRoot, "metadata.json"),
    git_files_sha256: gitMetadata.git_files_sha256,
    git_status_sha256: gitMetadata.git_status_sha256,
  },
  inclusion_rule: "git tracked plus non-ignored untracked paths",
  exclusion_rule: "ignored and ephemeral paths",
  content_digest: canonicalDigest(sourceContent),
  summary: summarize(entries),
  entries,
};

const consumerEntries = readPathConsumers(repoRoot, sourceRoot, outputRoot);
verifySorted(consumerEntries, "repo_path");
const pathConsumers = {
  schema_version: CONSUMER_SCHEMA_VERSION,
  inventory_id: "domainspec-v2-path-consumers@1",
  status: "current",
  authority_effect: "none",
  visibility: "private",
  captured_at: options.capturedAt,
  literal: sourceRoot,
  excluded_preparation_roots: [
    outputRoot,
    "cyberAlchemy-v2/development/domainspec-v2/migration/mig-b",
    "cyberAlchemy-v2/product/domainspec-v2",
    "cyberAlchemy-v2/architecture/domainspec-v2",
    "cyberAlchemy-v2/ontology/domainspec-v2",
    "cyberAlchemy-v2/authority/decisions/domainspec-v2-migration",
  ],
  summary: {
    consumer_file_count: consumerEntries.length,
    occurrence_count: consumerEntries.reduce(
      (total, entry) => total + entry.occurrence_count,
      0,
    ),
  },
  entries: consumerEntries,
};

const index = buildIndex(options.capturedAt, sourceManifest, pathConsumers);
const outputs = new Map([
  ["source-manifest.json", json(sourceManifest)],
  ["path-consumers.json", json(pathConsumers)],
  ["index.json", json(index)],
  ["index.md", buildIndexMarkdown(index, sourceManifest)],
]);

for (const [relativePath, bytes] of outputs) {
  const targetPath = path.join(repoRoot, outputRoot, relativePath);
  if (options.mode === "write") {
    writeAtomic(targetPath, bytes);
  } else if (!existsSync(targetPath)) {
    fail(`missing generated file: ${path.posix.join(outputRoot, relativePath)}`);
  } else if (readFileSync(targetPath, "utf8") !== bytes) {
    fail(`generated file drift: ${path.posix.join(outputRoot, relativePath)}`);
  }
}

process.stdout.write(
  `${options.mode}: ${entries.length} entries, ${sourceManifest.summary.present_bytes} bytes, ` +
    `${pathConsumers.summary.consumer_file_count} external path consumers, ` +
    `${sourceManifest.content_digest}\n`,
);
