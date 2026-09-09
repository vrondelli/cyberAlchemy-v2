#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { lstat, mkdir, readFile, readdir, readlink, rename, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_REL = "projects/domainspec-v2";
const OUTPUT_JSON = join(SCRIPT_DIR, "PROJECT-MAP.json");
const OUTPUT_MD = join(SCRIPT_DIR, "PROJECT-MAP.md");
const ASSESSMENTS_JSON = join(SCRIPT_DIR, "PROJECT-MAP-ASSESSMENTS.json");
const MAP_DIR = join(SCRIPT_DIR, "map");
const OUTPUT_MATRIX_JSON = join(MAP_DIR, "MIGRATION-MATRIX.json");
const OUTPUT_MATRIX_MD = join(MAP_DIR, "MIGRATION-MATRIX.md");
const OUTPUT_DIRECTORIES_MD = join(MAP_DIR, "DEVELOPMENT-DIRECTORIES.md");
const IGNORED_DIRECTORY_NAMES = new Set([".git", "node_modules"]);
const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".html",
  ".js",
  ".json",
  ".jsonl",
  ".lean",
  ".md",
  ".mjs",
  ".py",
  ".rs",
  ".sh",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);
const CODE_EXTENSIONS = new Set([".cjs", ".js", ".lean", ".mjs", ".py", ".rs", ".sh", ".ts", ".tsx"]);
const ANCHOR_NAMES = new Set([
  "ARCHITECTURE.md",
  "CRAFT.md",
  "DECISIONS.md",
  "DEFINE.md",
  "DESIGN.md",
  "FINDINGS.md",
  "IMPLEMENTATION-LAYERING.md",
  "IMPLEMENTATION-PLAN.md",
  "INVOKE-RESULT.md",
  "PLAN.md",
  "PRODUCT-THESIS.md",
  "README.md",
  "RESIDUE.md",
  "SPEC.md",
  "SYNTHESIS.md",
  "WORK-PACK.md",
  "findings.md",
  "research.md",
]);
const PRIMARY_ANCHOR_ORDER = [
  "README.md",
  "SPEC.md",
  "ARCHITECTURE.md",
  "WORK-PACK.md",
  "IMPLEMENTATION-PLAN.md",
  "PLAN.md",
  "DEFINE.md",
  "DESIGN.md",
  "findings.md",
  "FINDINGS.md",
  "SYNTHESIS.md",
];

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function toPosix(value) {
  return value.split(sep).join("/");
}

function locateRepositoryRoot(start) {
  let cursor = resolve(start);
  for (;;) {
    if (existsSync(join(cursor, ".git"))) return cursor;
    const parent = dirname(cursor);
    if (parent === cursor) throw new Error(`repository root not found from ${start}`);
    cursor = parent;
  }
}

function parseArguments(argv) {
  const mode = argv.includes("--write") ? "write" : argv.includes("--check") ? "check" : null;
  const capturedAtIndex = argv.indexOf("--captured-at");
  const capturedAt = capturedAtIndex >= 0 ? argv[capturedAtIndex + 1] : null;
  if (!mode || !capturedAt) {
    throw new Error("usage: build-project-map.mjs (--write|--check) --captured-at <ISO-8601 UTC timestamp>");
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(capturedAt)) {
    throw new Error(`captured_at must be an exact UTC second, received ${capturedAt}`);
  }
  return { capturedAt, mode };
}

async function walkFiles(root) {
  const files = [];

  async function walk(directory) {
    const children = await readdir(directory, { withFileTypes: true });
    children.sort((left, right) => left.name.localeCompare(right.name));
    for (const child of children) {
      if (child.isDirectory() && IGNORED_DIRECTORY_NAMES.has(child.name)) continue;
      const absolutePath = join(directory, child.name);
      if (child.isDirectory()) {
        await walk(absolutePath);
        continue;
      }
      const stat = await lstat(absolutePath);
      const projectPath = toPosix(relative(root, absolutePath));
      if (child.isSymbolicLink()) {
        const target = await readlink(absolutePath);
        files.push({ bytes: stat.size, kind: "symlink", path: projectPath, sha256: sha256(target) });
      } else if (child.isFile()) {
        const bytes = await readFile(absolutePath);
        files.push({ bytes: stat.size, kind: "file", path: projectPath, sha256: sha256(bytes) });
      }
    }
  }

  await walk(root);
  return files.sort((left, right) => left.path.localeCompare(right.path));
}

function aggregateDigest(files) {
  return sha256(files.map((file) => `${file.path}\0${file.kind}\0${file.bytes}\0${file.sha256}\n`).join(""));
}

function parseGitStatus(repositoryRoot) {
  let raw;
  try {
    raw = execFileSync(
      "git",
      ["status", "--porcelain=v1", "-z", "--untracked-files=all", "--", PROJECT_REL],
      { cwd: repositoryRoot, encoding: "utf8" },
    );
  } catch (error) {
    if (error?.code === "ENOENT") {
      return { availability: "unavailable-git-not-installed-in-runtime", records: [] };
    }
    throw error;
  }
  const chunks = raw.split("\0").filter(Boolean);
  const records = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const status = chunk.slice(0, 2);
    const repositoryPath = toPosix(chunk.slice(3));
    records.push({ path: repositoryPath.replace(`${PROJECT_REL}/`, ""), status });
    if ((status.includes("R") || status.includes("C")) && chunks[index + 1]) index += 1;
  }
  return { availability: "available", records };
}

function emptyDirtyState(availability) {
  if (availability !== "available") return { availability, total: null };
  return { availability, added: 0, deleted: 0, modified: 0, renamed_or_copied: 0, untracked: 0, other: 0, total: 0 };
}

function summarizeDirty(records, prefix, availability) {
  const result = emptyDirtyState(availability);
  if (availability !== "available") return result;
  for (const record of records) {
    if (prefix && record.path !== prefix && !record.path.startsWith(`${prefix}/`)) continue;
    result.total += 1;
    if (record.status === "??") result.untracked += 1;
    else if (record.status.includes("D")) result.deleted += 1;
    else if (record.status.includes("R") || record.status.includes("C")) result.renamed_or_copied += 1;
    else if (record.status.includes("A")) result.added += 1;
    else if (record.status.includes("M")) result.modified += 1;
    else result.other += 1;
  }
  return result;
}

function directChildren(files, prefix) {
  const names = new Set();
  for (const file of files) {
    const remainder = prefix ? file.path.slice(prefix.length + 1) : file.path;
    const separatorIndex = remainder.indexOf("/");
    if (separatorIndex >= 0) names.add(remainder.slice(0, separatorIndex));
  }
  return [...names].sort();
}

function signalSet(files) {
  const paths = files.map((file) => file.path);
  const basenames = paths.map((path) => path.slice(path.lastIndexOf("/") + 1));
  const containsCode = paths.some((path) => CODE_EXTENSIONS.has(extname(path).toLowerCase()));
  return {
    code: containsCode,
    decisions: paths.some((path) => /(^|\/)decisions?(\/|$)/i.test(path) || /DECISION/i.test(path.slice(path.lastIndexOf("/") + 1))),
    implementation_plan: basenames.includes("IMPLEMENTATION-PLAN.md"),
    receipts: paths.some((path) => /(^|\/)(receipts?|validation-receipts)(\/|$)/i.test(path) || /RECEIPT/i.test(path.slice(path.lastIndexOf("/") + 1))),
    refreshes: paths.some((path) => /(^|\/)refresh(es)?(\/|$)/i.test(path)),
    research: paths.some((path) => /(^|\/)research(\/|$)/i.test(path) || basenames.includes("research.md")),
    results: paths.some((path) => /(^|\/)(results?|runs?)(\/|$)/i.test(path) || /(RESULT|CLOSEOUT|VALIDATION)/i.test(path.slice(path.lastIndexOf("/") + 1))),
    tests: paths.some((path) => /(^|\/)(tests?|__tests__)(\/|$)/i.test(path) || /\.(test|spec)\.[^.]+$/i.test(path)),
    work_pack: basenames.includes("WORK-PACK.md"),
  };
}

function observedRole(name, signals) {
  if (name === "research") return "program-research-and-provenance";
  if (name === "reviews") return "cross-package-review-evidence";
  if (name === "decisions") return "cross-package-decision-evidence";
  if (name === "refinement-runs") return "refinement-run-evidence";
  if (signals.code && signals.tests) return "executable-development-and-validation";
  if (signals.code) return "executable-development-or-tooling";
  if (signals.work_pack || signals.implementation_plan) return "governed-planning-and-evidence";
  if (signals.research) return "research-and-evidence";
  return "development-evidence";
}

function disposition(runtimeSurface, externalReferences, signals) {
  if (runtimeSurface) return "active-runtime-dependency-closure-review";
  if (externalReferences > 0 && signals.code) return "referenced-executable-dependency-review";
  if (signals.code) return "implementation-and-evidence-classification-required";
  if (externalReferences > 0) return "referenced-provenance-classification-required";
  return "provenance-classification-required";
}

function referenceArea(reference) {
  const projectPrefix = `${PROJECT_REL}/`;
  const relativePath = reference.startsWith(projectPrefix) ? reference.slice(projectPrefix.length) : reference;
  return relativePath.includes("/") ? relativePath.split("/")[0] : "(root)";
}

function summarizeReferences(references) {
  const byArea = {};
  for (const reference of references) {
    const area = referenceArea(reference);
    byArea[area] ??= [];
    byArea[area].push(reference);
  }
  return Object.fromEntries(
    Object.entries(byArea)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([area, values]) => [area, { count: values.length, samples: values.slice(0, 8) }]),
  );
}

function validateAssessments(assessments, developmentNames, repositoryRoot) {
  if (assessments.schema_version !== "cav2.domainspec-v2-project-map-assessments/v1") {
    throw new Error(`unsupported assessment schema: ${assessments.schema_version}`);
  }
  const entries = assessments.directories ?? [];
  const names = entries.map((entry) => entry.name);
  if (new Set(names).size !== names.length) throw new Error("duplicate development-directory assessment");
  const expected = [...developmentNames].sort();
  const observed = [...names].sort();
  if (JSON.stringify(expected) !== JSON.stringify(observed)) {
    throw new Error(`assessment directory set differs from live development directories`);
  }
  const allowedStatuses = new Set(["completed", "active", "blocked", "superseded", "historical"]);
  for (const entry of entries) {
    if (!allowedStatuses.has(entry.lifecycle_status)) throw new Error(`invalid lifecycle status for ${entry.name}`);
    if (!entry.bounded_outcome || !entry.residue || !entry.migration_disposition) {
      throw new Error(`incomplete assessment for ${entry.name}`);
    }
    for (const reference of entry.evidence_refs ?? []) {
      if (!reference.startsWith(`${PROJECT_REL}/`)) throw new Error(`out-of-project evidence reference for ${entry.name}: ${reference}`);
      if (!existsSync(join(repositoryRoot, reference))) throw new Error(`missing evidence reference for ${entry.name}: ${reference}`);
    }
    if (!entry.evidence_refs?.length) throw new Error(`assessment lacks evidence for ${entry.name}`);
  }
  return new Map(entries.map((entry) => [entry.name, entry]));
}

function extractDeclaredStatus(text) {
  const frontmatter = text.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---/);
  if (frontmatter) {
    const status = frontmatter[1].match(/^status:\s*["']?([^\r\n"']+)/im);
    if (status) return status[1].trim();
  }
  const prose = text.match(/^Status:\s*\*{0,2}([^\r\n*]+)\*{0,2}/im);
  return prose ? prose[1].trim() : null;
}

function extractHeading(text) {
  const match = text.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

async function anchorSummary(projectRoot, areaPrefix, files) {
  const relativeFiles = files
    .map((file) => file.path.slice(areaPrefix.length + 1))
    .filter((path) => !path.includes("/") && ANCHOR_NAMES.has(path));
  const anchorRefs = relativeFiles.map((path) => `${PROJECT_REL}/${areaPrefix}/${path}`).sort();
  let selectedName = PRIMARY_ANCHOR_ORDER.find((name) => relativeFiles.includes(name));
  if (!selectedName) selectedName = relativeFiles.sort()[0];
  if (!selectedName) {
    return { anchor_refs: [], declared_status: null, primary_anchor: null, title: null };
  }
  const text = await readFile(join(projectRoot, areaPrefix, selectedName), "utf8");
  return {
    anchor_refs: anchorRefs,
    declared_status: extractDeclaredStatus(text),
    primary_anchor: `${PROJECT_REL}/${areaPrefix}/${selectedName}`,
    title: extractHeading(text),
  };
}

async function buildReferenceIndex(projectRoot, files, developmentNames) {
  const nameSet = new Set(developmentNames);
  const references = Object.fromEntries(developmentNames.map((name) => [name, new Set()]));
  for (const file of files) {
    if (file.kind !== "file" || file.bytes > 2_000_000 || !TEXT_EXTENSIONS.has(extname(file.path).toLowerCase())) continue;
    let text;
    try {
      text = await readFile(join(projectRoot, file.path), "utf8");
    } catch {
      continue;
    }
    const matches = text.matchAll(/development\/([A-Za-z0-9._-]+)/g);
    for (const match of matches) {
      const name = match[1];
      if (!nameSet.has(name) || file.path.startsWith(`development/${name}/`)) continue;
      references[name].add(`${PROJECT_REL}/${file.path}`);
    }
  }
  return Object.fromEntries(
    Object.entries(references).map(([name, values]) => [name, [...values].sort()]),
  );
}

function rootAreaRole(name) {
  const roles = {
    "(root)": "product-navigation-runtime-and-teaching-views",
    ".craft": "development-ledger-and-non-authority-state",
    architecture: "system-and-pattern-architecture",
    authority: "owner-decisions-and-axioms",
    definitions: "canonical-vocabulary-and-language-definitions",
    development: "development-history-evidence-and-active-work",
    discovery: "project-discovery-evidence",
    formalization: "formalization-method-contracts-and-profiles",
    impl: "active-private-runtime-and-cli",
    ontology: "canonical-product-and-system-ontology",
    research: "research-towers-and-source-evidence",
  };
  return roles[name] ?? "project-area";
}

function compactSignals(signals) {
  return Object.entries(signals)
    .filter(([, value]) => value)
    .map(([name]) => name.replaceAll("_", "-"));
}

function markdownEscape(value) {
  return String(value ?? "—").replaceAll("|", "\\|").replaceAll("\n", " ");
}

function repositoryLink(repositoryPath) {
  return `../../../../../../${repositoryPath}`;
}

function renderMigrationMatrixJson(map) {
  const semanticBody = {
    schema_version: "cav2.domainspec-v2-migration-matrix/v1",
    matrix_id: "CAV2-DOMAINSPEC-V2-MIG-B-MATRIX-001",
    status: "pre-materialization-map",
    authority_effect: "none",
    source_map_id: map.map_id,
    source_map_semantic_digest: map.semantic_digest,
    route: map.migration_route,
    rows: map.development_areas.map((area) => ({
      directory: area.name,
      lifecycle_status: area.lifecycle.status,
      confidence: area.lifecycle.confidence,
      bounded_outcome: area.lifecycle.bounded_outcome,
      residue: area.lifecycle.residue,
      evidence_refs: area.lifecycle.evidence_refs,
      migration_disposition: area.migration.disposition,
      canonical_consumer_reference_count: area.canonical_consumer_reference_count,
      canonical_consumer_reference_samples: area.canonical_consumer_reference_samples,
      runtime_surface_refs: area.runtime_surface_refs,
    })),
    materialization_rule: "copy-only-after-active-dependency-closure-is-exact-and-validated",
    excluded_effects: [
      "source deletion",
      "successor baseline admission",
      "authority switch",
      "publication",
      "release",
      "deployment"
    ],
  };
  return { ...semanticBody, semantic_digest: sha256(`${JSON.stringify(semanticBody)}\n`) };
}

function renderMigrationMatrixMarkdown(matrix, jsonSha256) {
  const rows = matrix.rows.map((row) =>
    `| \`${markdownEscape(row.directory)}\` | ${markdownEscape(row.lifecycle_status)} | ${markdownEscape(row.migration_disposition)} | ${row.canonical_consumer_reference_count} | ${markdownEscape(row.residue)} |`,
  ).join("\n");
  return `# DomainSpec v2 MIG-B Migration Matrix

Status: **pre-materialization map**
Authority effect: **none**
Machine view: [MIGRATION-MATRIX.json](MIGRATION-MATRIX.json)
Machine-view SHA-256: \`${jsonSha256}\`
Source map: [PROJECT-MAP.json](../PROJECT-MAP.json) at semantic digest \`${matrix.source_map_semantic_digest}\`

## Reading the matrix

The disposition says what must happen to the directory during successor preparation; it does not
authorize copying, deleting, admission, or switching authority. A completed development directory is
preserved as evidence unless a separately proven current consumer makes it an active dependency.

| Development directory | Lifecycle | Disposition | Canonical refs | Blocking residue or retained limit |
| --- | --- | --- | ---: | --- |
${rows}

## Materialization boundary

Before copying source bytes, close the exact dependency set for every
\`carry-forward-active-dependency\` row and validate that no canonical consumer points at an excluded
transient. Blocked and active continuation packages move as non-canonical development state. Completed,
superseded, and historical packages preserve evidence but do not become live runtime surfaces merely by
being migrated.
`;
}

function renderDevelopmentDirectories(map) {
  const sections = map.development_areas.map((area) => {
    const evidence = area.lifecycle.evidence_refs
      .map((reference) => `- [\`${reference}\`](${repositoryLink(reference)})`)
      .join("\n");
    const canonicalConsumers = area.canonical_consumer_reference_samples.length
      ? area.canonical_consumer_reference_samples.map((reference) => `- [\`${reference}\`](${repositoryLink(reference)})`).join("\n")
      : "- None observed outside `development/` and `.craft/`.";
    return `## \`${area.name}\`

- Lifecycle: **${area.lifecycle.status}** (${area.lifecycle.confidence} confidence)
- Observed role: ${area.observed_role}
- Bounded outcome: ${area.lifecycle.bounded_outcome}
- Residue: ${area.lifecycle.residue}
- Migration disposition: \`${area.migration.disposition}\`
- Files: ${area.file_count}; bytes: ${area.bytes}; aggregate SHA-256: \`${area.aggregate_sha256}\`
- Canonical consumer references: ${area.canonical_consumer_reference_count}; all external references: ${area.external_reference_count}

Evidence anchors:

${evidence}

Canonical consumer samples:

${canonicalConsumers}`;
  }).join("\n\n");

  return `# DomainSpec v2 Development Directory Evidence Index

Status: **evidence-assessed live inventory at ${map.captured_at}**
Source map: [PROJECT-MAP.json](../PROJECT-MAP.json)
Migration matrix: [MIGRATION-MATRIX.md](MIGRATION-MATRIX.md)

This index provides the directory-by-directory explanation behind the compact project map. Evidence
links point to the current source project; they do not promote development artifacts into canonical
authority. Canonical consumer samples exclude references originating under \`development/\` and
\`.craft/\`, which avoids treating staged historical copies as live product dependencies.

${sections}
`;
}

function renderMarkdown(map, jsonSha256) {
  const rootRows = map.root_areas
    .map((area) => `| \`${markdownEscape(area.name)}\` | ${markdownEscape(area.observed_role)} | ${area.file_count} | ${area.bytes} | ${area.dirty.total ?? "unavailable"} |`)
    .join("\n");
  const developmentRows = map.development_areas
    .map((area) => {
      const label = area.title ?? area.name;
      return `| \`${markdownEscape(area.name)}\` | ${markdownEscape(label)} | **${markdownEscape(area.lifecycle.status)}** | ${markdownEscape(area.lifecycle.bounded_outcome)} | ${area.file_count} | ${area.canonical_consumer_reference_count} | ${area.external_reference_count} | ${markdownEscape(area.migration.disposition)} |`;
    })
    .join("\n");
  const lifecycleCounts = Object.entries(map.summary.lifecycle_counts)
    .map(([status, count]) => `\`${status}\`: ${count}`)
    .join(" · ");
  const dispositionCounts = Object.entries(map.summary.migration_disposition_counts)
    .map(([status, count]) => `\`${status}\`: ${count}`)
    .join(" · ");

  return `# DomainSpec v2 Source Project Map

Status: **evidence-assessed live inventory at ${map.captured_at}**
Authority effect: **none**
Source: \`${map.source_root}\`
Machine view: [PROJECT-MAP.json](PROJECT-MAP.json)
Machine-view SHA-256: \`${jsonSha256}\`

## Purpose

This map is the first MIG-B migration artifact. It inventories the working DomainSpec v2 project by
project area and by each immediate directory under \`development/\`. It does not rebuild DomainSpec,
create a new product version, admit a successor baseline, switch authority, or delete the source.

Directory names, plans, and local status labels are evidence inputs, not completion proof. Each
development directory is classified from terminal evidence at its bounded claim ceiling. In particular,
\`completed\` never means live-product implementation unless the live dependency evidence separately says so.

## Coverage

- ${map.summary.file_count} files and symlinks, ${map.summary.bytes} bytes.
- ${map.root_areas.length} root areas, including root-level files.
- ${map.development_areas.length} immediate \`development/\` directories; every live directory is represented once.
- Lifecycle distribution: ${lifecycleCounts}.
- Migration distribution: ${dispositionCounts}.
- Source aggregate SHA-256: \`${map.summary.source_aggregate_sha256}\`.
- Git dirty-state availability: \`${map.summary.dirty.availability}\`; source bytes were not changed.
- Excluded only: ${map.exclusions.map((item) => `\`${item}\``).join(", ")}.

## Project areas

| Area | Observed responsibility | Files | Bytes | Dirty paths |
| --- | --- | ---: | ---: | ---: |
${rootRows}

## Development directory map

| Directory | Primary evidence title | Lifecycle | Bounded outcome | Files | Canonical refs | All external refs | Migration disposition |
| --- | --- | --- | --- | ---: | ---: | ---: | --- |
${developmentRows}

## Lifecycle interpretation

- **Completed:** the directory reached its stated development outcome; consult \`lifecycle.residue\` before using it.
- **Active:** a current continuation exists.
- **Blocked:** evidence exists, but an explicit gate prevents the continuation.
- **Superseded:** newer operative state replaced it; preserve only as superseded provenance.
- **Historical:** research, review, or workflow evidence with no current continuation.

The machine view carries each row's confidence, exact evidence refs, residue, external-reference areas,
canonical-consumer samples, and migration disposition.

## What must still be determined before materialization

1. Resolve every active runtime and canonical consumer reference into an exact dependency closure.
2. Separate canonical product assets from implementation, development provenance, research, and
   transient or staged duplicates.
3. Copy the admitted working bytes into CyberAlchemy's layers and validate them in place. Do not
   regenerate the product merely to produce another candidate number.

## Current hard boundary

The selected MIG-B route permits additive successor materialization and preparation. It does not
permit source deletion, baseline admission, authority switching, publication, release, deployment,
or copying private DomainSpec content into public Arcanum.
`;
}

async function buildMap(repositoryRoot, capturedAt) {
  const projectRoot = join(repositoryRoot, PROJECT_REL);
  const files = await walkFiles(projectRoot);
  const gitStatus = parseGitStatus(repositoryRoot);
  const runtime = JSON.parse(await readFile(join(projectRoot, "RUNTIME.json"), "utf8"));
  const runtimeSurfaces = runtime.live_runtime_surfaces ?? [];

  const developmentNames = directChildren(files.filter((file) => file.path.startsWith("development/")), "development");
  const assessments = JSON.parse(await readFile(ASSESSMENTS_JSON, "utf8"));
  const assessmentByName = validateAssessments(assessments, developmentNames, repositoryRoot);
  const referenceIndex = await buildReferenceIndex(projectRoot, files, developmentNames);
  const developmentAreas = [];

  for (const name of developmentNames) {
    const prefix = `development/${name}`;
    const areaFiles = files.filter((file) => file.path.startsWith(`${prefix}/`));
    const anchors = await anchorSummary(projectRoot, prefix, areaFiles);
    const signals = signalSet(areaFiles);
    const externalRefs = referenceIndex[name];
    const externalReferencesByArea = summarizeReferences(externalRefs);
    const canonicalConsumerRefs = externalRefs.filter((reference) => {
      const area = referenceArea(reference);
      return area !== "development" && area !== ".craft";
    });
    const runtimeSurfaceRefs = runtimeSurfaces.filter((path) => path.startsWith(`${PROJECT_REL}/${prefix}/`)).sort();
    const assessment = assessmentByName.get(name);
    developmentAreas.push({
      name,
      path: `${PROJECT_REL}/${prefix}`,
      title: anchors.title,
      primary_anchor: anchors.primary_anchor,
      anchor_refs: anchors.anchor_refs,
      declared_status: anchors.declared_status,
      observed_role: observedRole(name, signals),
      lifecycle: {
        status: assessment.lifecycle_status,
        confidence: assessment.confidence,
        bounded_outcome: assessment.bounded_outcome,
        evidence_refs: assessment.evidence_refs,
        residue: assessment.residue,
      },
      migration: {
        disposition: assessment.migration_disposition,
        structural_hint: disposition(runtimeSurfaceRefs.length > 0, externalRefs.length, signals),
      },
      file_count: areaFiles.length,
      bytes: areaFiles.reduce((total, file) => total + file.bytes, 0),
      aggregate_sha256: aggregateDigest(areaFiles),
      direct_children: directChildren(areaFiles, prefix),
      signals: compactSignals(signals),
      runtime_surface_refs: runtimeSurfaceRefs,
      canonical_consumer_reference_count: canonicalConsumerRefs.length,
      canonical_consumer_reference_samples: canonicalConsumerRefs.slice(0, 12),
      external_reference_count: externalRefs.length,
      external_reference_samples: externalRefs.slice(0, 12),
      external_references_by_area: externalReferencesByArea,
      dirty: summarizeDirty(gitStatus.records, prefix, gitStatus.availability),
    });
  }

  const rootNames = [
    "(root)",
    ...new Set(files.filter((file) => file.path.includes("/")).map((file) => file.path.split("/")[0])),
  ].sort((left, right) => (left === "(root)" ? -1 : right === "(root)" ? 1 : left.localeCompare(right)));
  const rootAreas = rootNames.map((name) => {
    const areaFiles = name === "(root)" ? files.filter((file) => !file.path.includes("/")) : files.filter((file) => file.path.startsWith(`${name}/`));
    return {
      name,
      path: name === "(root)" ? PROJECT_REL : `${PROJECT_REL}/${name}`,
      observed_role: rootAreaRole(name),
      file_count: areaFiles.length,
      bytes: areaFiles.reduce((total, file) => total + file.bytes, 0),
      aggregate_sha256: aggregateDigest(areaFiles),
      direct_children: name === "(root)" ? [] : directChildren(areaFiles, name),
      dirty: summarizeDirty(gitStatus.records, name === "(root)" ? "" : name, gitStatus.availability),
    };
  });

  const semanticBody = {
    schema_version: "cav2.domainspec-v2-project-map/v1",
    map_id: "CAV2-DOMAINSPEC-V2-MIG-B-PROJECT-MAP-001",
    status: "evidence-assessed-live-inventory",
    authority_effect: "none",
    visibility: "private",
    captured_at: capturedAt,
    source_root: PROJECT_REL,
    migration_route: "MIG-B-STAGED-SUCCESSOR",
    completion_claim: "bounded-directory-lifecycle-assessment-only",
    exclusions: [".git directory metadata", "node_modules dependency directories"],
    summary: {
      file_count: files.length,
      bytes: files.reduce((total, file) => total + file.bytes, 0),
      source_aggregate_sha256: aggregateDigest(files),
      root_area_count: rootAreas.length,
      development_directory_count: developmentAreas.length,
      lifecycle_counts: Object.fromEntries(
        ["completed", "active", "blocked", "superseded", "historical"].map((status) => [
          status,
          developmentAreas.filter((area) => area.lifecycle.status === status).length,
        ]),
      ),
      migration_disposition_counts: Object.fromEntries(
        [...new Set(developmentAreas.map((area) => area.migration.disposition))]
          .sort()
          .map((status) => [status, developmentAreas.filter((area) => area.migration.disposition === status).length]),
      ),
      dirty: summarizeDirty(gitStatus.records, "", gitStatus.availability),
    },
    root_areas: rootAreas,
    development_areas: developmentAreas,
    assessment_contract: {
      path: toPosix(relative(repositoryRoot, ASSESSMENTS_JSON)),
      schema_version: assessments.schema_version,
      assessment_id: assessments.assessment_id,
      classification_precedence: assessments.classification_precedence,
    },
    next_pass: {
      objective: "derive-exact-migration-closure-and-selective-architecture-package",
      rule: "preserve-bounded-claim-ceilings-and-do-not-treat-development-completion-as-live-product-implementation",
    },
    claim_ceiling: {
      source_mutation: false,
      successor_baseline_admission: false,
      authority_switch: false,
      publication: false,
      release: false,
      deployment: false,
    },
  };
  return { ...semanticBody, semantic_digest: sha256(`${JSON.stringify(semanticBody)}\n`) };
}

async function writeAtomic(path, content) {
  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, content, "utf8");
  await rename(temporaryPath, path);
}

async function main() {
  const { capturedAt, mode } = parseArguments(process.argv.slice(2));
  const repositoryRoot = locateRepositoryRoot(SCRIPT_DIR);
  const map = await buildMap(repositoryRoot, capturedAt);
  const json = `${JSON.stringify(map, null, 2)}\n`;
  const markdown = renderMarkdown(map, sha256(json));
  const matrix = renderMigrationMatrixJson(map);
  const matrixJson = `${JSON.stringify(matrix, null, 2)}\n`;
  const matrixMarkdown = renderMigrationMatrixMarkdown(matrix, sha256(matrixJson));
  const directoriesMarkdown = renderDevelopmentDirectories(map);

  if (mode === "write") {
    await mkdir(MAP_DIR, { recursive: true });
    await writeAtomic(OUTPUT_JSON, json);
    await writeAtomic(OUTPUT_MD, markdown);
    await writeAtomic(OUTPUT_MATRIX_JSON, matrixJson);
    await writeAtomic(OUTPUT_MATRIX_MD, matrixMarkdown);
    await writeAtomic(OUTPUT_DIRECTORIES_MD, directoriesMarkdown);
    console.log(`wrote ${map.summary.file_count} files, ${map.development_areas.length} development directories, ${map.semantic_digest}`);
    return;
  }

  const observedJson = await readFile(OUTPUT_JSON, "utf8");
  const observedMarkdown = await readFile(OUTPUT_MD, "utf8");
  const observedMatrixJson = await readFile(OUTPUT_MATRIX_JSON, "utf8");
  const observedMatrixMarkdown = await readFile(OUTPUT_MATRIX_MD, "utf8");
  const observedDirectoriesMarkdown = await readFile(OUTPUT_DIRECTORIES_MD, "utf8");
  if (observedJson !== json) throw new Error("PROJECT-MAP.json drifted from the live source project");
  if (observedMarkdown !== markdown) throw new Error("PROJECT-MAP.md drifted from PROJECT-MAP.json or the live source project");
  if (observedMatrixJson !== matrixJson) throw new Error("MIGRATION-MATRIX.json drifted from PROJECT-MAP.json");
  if (observedMatrixMarkdown !== matrixMarkdown) throw new Error("MIGRATION-MATRIX.md drifted from its machine view");
  if (observedDirectoriesMarkdown !== directoriesMarkdown) throw new Error("DEVELOPMENT-DIRECTORIES.md drifted from PROJECT-MAP.json");
  console.log(`pass ${map.summary.file_count} files, ${map.development_areas.length} development directories, ${map.semantic_digest}`);
}

await main();
