import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildEnvelope, sha256Canonical, validateEnvelope } from "../contracts/canonical-json-v1.mjs";
import { createBoundedSearchReceipt } from "./bounded-search-receipt.mjs";
import {
  createCorpusFactReceiptV2,
  LITERAL_TOKEN_EXTRACTOR_DIGEST,
} from "./corpus-receipt-v2.mjs";
import { rawSha256 } from "./corpus-receipt.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repairRoot = resolve(here, "..");
const workspaceRoot = resolve(repairRoot, "../../../..");
const generation001Dir = join(here, "results/corpus/generation-001");
const predecessorPath = resolve(getArg("--predecessor") || join(generation001Dir, "receipts.json"));
const manifestPath = resolve(getArg("--manifest") || join(repairRoot, "fixtures/contracts/corpus-manifest.json"));
const boundedConfigPath = resolve(getArg("--bounded-config") || join(repairRoot, "fixtures/contracts/corpus-v2-bounded-searches.json"));
const outDir = resolve(getArg("--out-dir") || join(here, "results/corpus/generation-002"));

if (outDir === generation001Dir || basename(outDir) === "generation-001") {
  throw new Error("refusing to write corpus v2 output to generation-001");
}
if (!existsSync(predecessorPath)) throw new Error(`missing corpus generation 001 predecessor: ${predecessorPath}`);

const predecessor = JSON.parse(readFileSync(predecessorPath, "utf8"));
verifyPredecessor(predecessor);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const boundedConfig = JSON.parse(readFileSync(boundedConfigPath, "utf8"));
verifyManifestParity(predecessor, manifest);

const configByEntry = new Map();
for (const config of boundedConfig.entries ?? []) {
  if (configByEntry.has(config.entry_id)) throw new Error(`duplicate bounded-search config for ${config.entry_id}`);
  if (config.extractor_digest !== LITERAL_TOKEN_EXTRACTOR_DIGEST) throw new Error(`extractor digest drift for ${config.entry_id}`);
  configByEntry.set(config.entry_id, config);
}
for (const entryId of configByEntry.keys()) {
  if (!manifest.entries.some((entry) => entry.id === entryId)) throw new Error(`bounded-search config references unknown entry ${entryId}`);
}

const sourceState = new Map();
for (const entry of manifest.entries) {
  const repository = resolve(workspaceRoot, entry.source.repository);
  const sourcePath = resolve(repository, entry.source.path);
  sourceState.set(entry.id, {
    repository,
    sourcePath,
    sourceText: readFileSync(sourcePath, "utf8"),
    actualRevision: gitHead(repository),
  });
}

const boundedSearches = [];
const boundedByEntry = new Map();
for (const [entryId, config] of configByEntry) {
  const entry = manifest.entries.find((candidate) => candidate.id === entryId);
  const state = sourceState.get(entryId);
  const matchCount = countLiteral(state.sourceText, entry.selector.anchor);
  const receipt = createBoundedSearchReceipt({
    search_id: config.search_id,
    universe_complete: true,
    extractor: {
      id: "literal-token-extractor",
      version: "1.0.0",
      expected_digest: config.extractor_digest,
      observed_digest: LITERAL_TOKEN_EXTRACTOR_DIGEST,
    },
    sources: [{
      source_id: config.source_id,
      repository: entry.source.repository,
      path: entry.source.path,
      expected_revision: entry.source.revision,
      observed_revision: state.actualRevision,
      expected_file_digest: entry.source.file_digest,
      observed_file_digest: rawSha256(state.sourceText),
      visited: true,
      parse_status: "ok",
      extraction_status: "ok",
    }],
    selectors: [{ selector_id: config.selector_id, source_id: config.source_id, locator: `literal-token:${entry.selector.anchor}` }],
    outcomes: [{
      selector_id: config.selector_id,
      source_id: config.source_id,
      status: matchCount === 0 ? "no-match" : "match",
      match_count: matchCount,
    }],
    observed_at: "2026-07-12T00:00:00Z",
  });
  boundedByEntry.set(entryId, receipt);
  boundedSearches.push({ entry_id: entryId, receipt });
}

const facts = manifest.entries.map((entry) => {
  const state = sourceState.get(entry.id);
  return {
    entry_id: entry.id,
    receipt: createCorpusFactReceiptV2({ ...entry, observed_at: "2026-07-12T00:00:00Z" }, {
      sourceText: state.sourceText,
      actualRevision: state.actualRevision,
      boundedSearchReceipt: boundedByEntry.get(entry.id) ?? null,
    }),
  };
});
for (const fact of facts) {
  if (fact.receipt.semantic.observation_status === "observed-absent" && !fact.receipt.semantic.bounded_search_receipt_id) {
    throw new Error(`false absence without bounded-search handle for ${fact.entry_id}`);
  }
}

const factHandles = facts.map((entry) => entry.receipt.record_id).sort();
const projectionHandles = predecessor.semantic.reviewer_projection_handles;
const boundedSearchHandles = boundedSearches.map((entry) => entry.receipt.record_id).sort();
const semantic = {
  predecessor_record_id: predecessor.record_id,
  predecessor_content_digest: predecessor.content_digest,
  fact_handles: factHandles,
  reviewer_projection_handles: projectionHandles,
  bounded_search_handles: boundedSearchHandles,
  corpus_ids: [...new Set(manifest.entries.map((entry) => entry.corpus_id))].sort(),
  implementation_styles: [...new Set(manifest.entries.map((entry) => entry.implementation_style))].sort(),
};
const envelope = buildEnvelope({
  contractId: "ui-repair.corpus-generation",
  contractVersion: "2.0.0",
  semanticFields: Object.keys(semantic),
  record: semantic,
  status: facts.some((entry) => entry.receipt.semantic.observation_status === "not-observed") ? "defer" : "complete",
  predecessorGenerationId: predecessor.generation_id,
  inputHandles: [
    predecessor.record_id,
    `manifest:${sha256Canonical(manifest)}`,
    ...factHandles,
    ...projectionHandles,
    ...boundedSearchHandles,
  ].sort(),
  createdAt: "2026-07-12T00:00:00Z",
});
const result = {
  ...envelope,
  schema_version: "ui-repair.corpus-generation.v2",
  summary: {
    fact_count: facts.length,
    observed: facts.filter((entry) => entry.receipt.semantic.observation_status === "observed").length,
    observed_absent: facts.filter((entry) => entry.receipt.semantic.observation_status === "observed-absent").length,
    not_observed: facts.filter((entry) => entry.receipt.semantic.observation_status === "not-observed").length,
    bounded_search_receipt_count: boundedSearches.length,
    reviewer_projection_count: predecessor.reviewer_projections.length,
    corpus_count: semantic.corpus_ids.length,
    implementation_style_count: semantic.implementation_styles.length,
  },
  facts,
  bounded_search_receipts: boundedSearches,
  reviewer_projections: predecessor.reviewer_projections,
};

publish(result);

function verifyPredecessor(record) {
  if (record.schema_version !== "ui-repair.corpus-generation.v1") throw new TypeError("invalid corpus generation 001 schema");
  if (record.contract_id !== "ui-repair.corpus-generation" || record.contract_version !== "1.0.0") throw new TypeError("invalid corpus generation 001 contract");
  validateEnvelope({ ...record, schema_version: "ui-repair.record-envelope.v1" }, Object.keys(record.semantic ?? {}));
  for (const entry of record.facts ?? []) validateEnvelope(entry.receipt, Object.keys(entry.receipt.semantic ?? {}));
  for (const entry of record.reviewer_projections ?? []) validateEnvelope(entry, Object.keys(entry.semantic ?? {}));
  const factHandles = record.facts.map((entry) => entry.receipt.record_id).sort();
  const projectionHandles = record.reviewer_projections.map((entry) => entry.record_id).sort();
  if (JSON.stringify(factHandles) !== JSON.stringify(record.semantic.fact_handles)) throw new TypeError("predecessor fact handles do not match embedded facts");
  if (JSON.stringify(projectionHandles) !== JSON.stringify(record.semantic.reviewer_projection_handles)) throw new TypeError("predecessor projection handles do not match embedded projections");
}

function verifyManifestParity(predecessorRecord, sourceManifest) {
  if (sourceManifest.schema_version !== "ui-repair.corpus-manifest.v1" || !Array.isArray(sourceManifest.entries)) throw new TypeError("invalid corpus manifest");
  const predecessorIds = predecessorRecord.facts.map((entry) => entry.entry_id).sort();
  const manifestIds = sourceManifest.entries.map((entry) => entry.id).sort();
  if (new Set(manifestIds).size !== manifestIds.length || JSON.stringify(predecessorIds) !== JSON.stringify(manifestIds)) {
    throw new TypeError("partial or divergent corpus manifest does not match generation 001");
  }
}

function gitHead(repository) {
  const result = spawnSync("git", ["-C", repository, "rev-parse", "HEAD"], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`cannot resolve revision for ${repository}: ${result.stderr}`);
  return result.stdout.trim();
}

function countLiteral(sourceText, token) {
  if (token.length === 0) throw new TypeError("literal token must be non-empty");
  let count = 0;
  let offset = 0;
  while ((offset = sourceText.indexOf(token, offset)) !== -1) {
    count += 1;
    offset += token.length;
  }
  return count;
}

function publish(record) {
  const target = join(outDir, "receipts.json");
  if (existsSync(target)) {
    const existing = JSON.parse(readFileSync(target, "utf8"));
    if (existing.content_digest === record.content_digest && existing.generation_id === record.generation_id) {
      console.log(`NO-OP: immutable corpus generation 002 already exists at ${relativeToRepair(target)}`);
      return;
    }
    throw new Error(`refusing to overwrite non-identical corpus generation at ${relativeToRepair(target)}`);
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(target, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  console.log(`PASS: published corpus generation 002 with ${record.summary.fact_count} facts, ${record.summary.observed_absent} bounded absence, and ${record.summary.not_observed} not-observed at ${relativeToRepair(target)}`);
}

function relativeToRepair(path) {
  return path.replace(`${repairRoot}/`, "");
}

function getArg(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}
