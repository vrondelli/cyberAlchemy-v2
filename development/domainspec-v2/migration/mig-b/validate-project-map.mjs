#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIR, "../../../../../");
const PROJECT_ROOT = join(REPOSITORY_ROOT, "projects/domainspec-v2");
const MAP_PATH = join(SCRIPT_DIR, "PROJECT-MAP.json");
const ASSESSMENTS_PATH = join(SCRIPT_DIR, "PROJECT-MAP-ASSESSMENTS.json");
const MATRIX_PATH = join(SCRIPT_DIR, "map/MIGRATION-MATRIX.json");
const CONCEPTS_PATH = join(SCRIPT_DIR, "map/CONCEPTS.json");
const RELATIONSHIPS_PATH = join(SCRIPT_DIR, "map/RELATIONSHIPS.json");
const RECEIPT_PATH = join(SCRIPT_DIR, "map/MAP-VALIDATION-RECEIPT.M00.json");
const REQUIRED_MARKDOWN = [
  "PROJECT-MAP.md",
  "map/README.md",
  "map/ARCHITECTURE.md",
  "map/ARCHITECTURE-PATTERN-LIBRARY.md",
  "map/DEVELOPMENT-DIRECTORIES.md",
  "map/MIGRATION-MATRIX.md",
  "map/pattern-library/ARCHITECTURE-FOUNDATIONS.md",
  "map/pattern-library/DEPENDENCY-RULES.md",
  "map/pattern-library/TESTING-ALIGNMENT.md",
  "map/pattern-library/OBSERVABILITY-ALIGNMENT.md",
];

function fail(message) {
  throw new Error(message);
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function unique(values, label) {
  if (new Set(values).size !== values.length) fail(`${label} contains duplicates`);
}

function equalSets(left, right, label) {
  const normalizedLeft = [...left].sort();
  const normalizedRight = [...right].sort();
  if (JSON.stringify(normalizedLeft) !== JSON.stringify(normalizedRight)) {
    fail(`${label} differs: expected ${normalizedLeft.length}, observed ${normalizedRight.length}`);
  }
}

function requireRepositoryPath(reference, label) {
  if (!reference.startsWith("projects/domainspec-v2/")) fail(`${label} escapes DomainSpec v2: ${reference}`);
  if (!existsSync(join(REPOSITORY_ROOT, reference))) fail(`${label} does not exist: ${reference}`);
}

async function validateMarkdownLinks(relativePath) {
  const absolutePath = join(SCRIPT_DIR, relativePath);
  const content = await readFile(absolutePath, "utf8");
  const links = [...content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1]);
  for (const rawLink of links) {
    if (/^(https?:|mailto:|#)/.test(rawLink)) continue;
    const link = rawLink.replace(/^<|>$/g, "").split("#", 1)[0];
    if (!link) continue;
    const resolved = resolve(dirname(absolutePath), decodeURIComponent(link));
    if (!existsSync(resolved)) fail(`broken Markdown link in ${relativePath}: ${rawLink}`);
  }
  return links.length;
}

async function main() {
  const [map, assessments, matrix, concepts, relationships, receipt] = await Promise.all([
    readJson(MAP_PATH),
    readJson(ASSESSMENTS_PATH),
    readJson(MATRIX_PATH),
    readJson(CONCEPTS_PATH),
    readJson(RELATIONSHIPS_PATH),
    readJson(RECEIPT_PATH),
  ]);

  if (map.status !== "evidence-assessed-live-inventory") fail(`map status is not evidence-assessed: ${map.status}`);
  if (map.summary.development_directory_count !== 53) fail(`expected 53 development directories`);
  if (map.development_areas.length !== 53 || assessments.directories.length !== 53 || matrix.rows.length !== 53) {
    fail(`map, assessment, and matrix row counts must all equal 53`);
  }

  const liveNames = (await readdir(join(PROJECT_ROOT, "development"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const mapNames = map.development_areas.map((area) => area.name);
  const assessmentNames = assessments.directories.map((area) => area.name);
  const matrixNames = matrix.rows.map((row) => row.directory);
  unique(mapNames, "project map names");
  unique(assessmentNames, "assessment names");
  unique(matrixNames, "migration matrix names");
  equalSets(liveNames, mapNames, "live development directory set and project map");
  equalSets(mapNames, assessmentNames, "project map and assessments");
  equalSets(mapNames, matrixNames, "project map and migration matrix");

  const assessmentByName = new Map(assessments.directories.map((entry) => [entry.name, entry]));
  const matrixByName = new Map(matrix.rows.map((entry) => [entry.directory, entry]));
  const lifecycleCounts = { completed: 0, active: 0, blocked: 0, superseded: 0, historical: 0 };
  for (const area of map.development_areas) {
    const assessment = assessmentByName.get(area.name);
    const matrixRow = matrixByName.get(area.name);
    if (JSON.stringify(area.lifecycle) !== JSON.stringify({
      status: assessment.lifecycle_status,
      confidence: assessment.confidence,
      bounded_outcome: assessment.bounded_outcome,
      evidence_refs: assessment.evidence_refs,
      residue: assessment.residue,
    })) fail(`map lifecycle differs from assessment: ${area.name}`);
    if (area.migration.disposition !== assessment.migration_disposition) fail(`map disposition differs: ${area.name}`);
    if (matrixRow.lifecycle_status !== area.lifecycle.status || matrixRow.migration_disposition !== area.migration.disposition) {
      fail(`matrix differs from project map: ${area.name}`);
    }
    lifecycleCounts[area.lifecycle.status] += 1;
    for (const reference of area.lifecycle.evidence_refs) requireRepositoryPath(reference, `${area.name} evidence`);
    for (const reference of area.canonical_consumer_reference_samples) requireRepositoryPath(reference, `${area.name} canonical consumer`);
    for (const reference of area.runtime_surface_refs) requireRepositoryPath(reference, `${area.name} runtime surface`);

    const status = area.lifecycle.status;
    const disposition = area.migration.disposition;
    if (status === "completed" && disposition !== "preserve-completed-provenance") fail(`completed disposition mismatch: ${area.name}`);
    if (status === "superseded" && disposition !== "archive-superseded-provenance") fail(`superseded disposition mismatch: ${area.name}`);
    if (status === "historical" && disposition !== "archive-historical-provenance") fail(`historical disposition mismatch: ${area.name}`);
    if (["active", "blocked"].includes(status) && !["carry-forward-active-dependency", "carry-forward-continuation"].includes(disposition)) {
      fail(`open lifecycle disposition mismatch: ${area.name}`);
    }
    if (area.runtime_surface_refs.length && disposition !== "carry-forward-active-dependency") {
      fail(`runtime surface is not an active dependency: ${area.name}`);
    }
  }
  if (JSON.stringify(lifecycleCounts) !== JSON.stringify(map.summary.lifecycle_counts)) fail(`lifecycle totals drifted`);
  if (matrix.source_map_semantic_digest !== map.semantic_digest) fail(`matrix source digest differs from project map`);

  const conceptIds = concepts.concepts.map((concept) => concept.id);
  unique(conceptIds, "concept IDs");
  const conceptIdSet = new Set(conceptIds);
  const relationshipIds = relationships.relationships.map((relationship) => relationship.id);
  unique(relationshipIds, "relationship IDs");
  for (const relationship of relationships.relationships) {
    if (!conceptIdSet.has(relationship.source)) fail(`unknown relationship source: ${relationship.id}`);
    if (!conceptIdSet.has(relationship.target)) fail(`unknown relationship target: ${relationship.id}`);
  }

  const patternLibrary = await readFile(join(SCRIPT_DIR, "map/ARCHITECTURE-PATTERN-LIBRARY.md"), "utf8");
  const patternIds = [...patternLibrary.matchAll(/^## (DSP-P\d{2}) — /gm)].map((match) => match[1]);
  unique(patternIds, "architecture pattern IDs");
  equalSets(Array.from({ length: 10 }, (_, index) => `DSP-P${String(index + 1).padStart(2, "0")}`), patternIds, "required pattern cards");

  let markdownLinkCount = 0;
  for (const relativePath of REQUIRED_MARKDOWN) {
    if (!existsSync(join(SCRIPT_DIR, relativePath))) fail(`missing required map document: ${relativePath}`);
    markdownLinkCount += await validateMarkdownLinks(relativePath);
  }

  const forbidden = JSON.stringify(map).match(/unassessed-terminal-evidence-required/g) ?? [];
  if (forbidden.length) fail(`map still contains unassessed lifecycle placeholders`);

  if (receipt.status !== "pass" || receipt.claim_ceiling.complete_pre_materialization_project_map !== true) {
    fail(`validation receipt does not claim a passing pre-materialization map`);
  }
  if (receipt.results.map_contract_validation.markdown_link_count !== markdownLinkCount) {
    fail(`validation receipt Markdown-link count drifted`);
  }
  if (JSON.stringify(receipt.results.map_contract_validation.lifecycle_counts) !== JSON.stringify(lifecycleCounts)) {
    fail(`validation receipt lifecycle counts drifted`);
  }
  for (const [relativePath, expectedHash] of Object.entries(receipt.artifact_hashes)) {
    const absolutePath = join(SCRIPT_DIR, relativePath);
    if (!existsSync(absolutePath)) fail(`validation receipt artifact missing: ${relativePath}`);
    const observedHash = sha256(await readFile(absolutePath));
    if (observedHash !== expectedHash) fail(`validation receipt artifact hash drifted: ${relativePath}`);
  }

  console.log(JSON.stringify({
    status: "pass",
    source_file_count: map.summary.file_count,
    development_directory_count: map.development_areas.length,
    lifecycle_counts: lifecycleCounts,
    migration_disposition_counts: map.summary.migration_disposition_counts,
    concept_count: concepts.concepts.length,
    relationship_count: relationships.relationships.length,
    pattern_count: patternIds.length,
    markdown_document_count: REQUIRED_MARKDOWN.length,
    markdown_link_count: markdownLinkCount,
    validation_receipt_status: receipt.status,
    source_map_semantic_digest: map.semantic_digest,
    matrix_semantic_digest: matrix.semantic_digest,
  }, null, 2));
}

await main();
