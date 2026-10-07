#!/usr/bin/env node
import {createHash} from "node:crypto";
import {existsSync, readFileSync, writeFileSync} from "node:fs";
import {basename, dirname, extname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const docsRoot = dirname(fileURLToPath(import.meta.url));
const productRoot = resolve(docsRoot, "..");
const repositoryRoot = resolve(productRoot, "../..");
const candidatePath = resolve(productRoot, "evidence/product-candidate.018.json");
const ownerDecisionsPath = resolve(docsRoot, "release-owner-decisions.json");
const outputPath = resolve(docsRoot, "source-rights-inventory.json");
const receiptPath = resolve(docsRoot, "source-rights-inventory-receipt.json");
const sha256 = value => createHash("sha256").update(value).digest("hex");
const stableJson = value => `${JSON.stringify(value, null, 2)}\n`;

function need(condition, code) { if (!condition) throw new Error(code); }
function repositoryPath(path) { return resolve(repositoryRoot, path.replace(/^cyberAlchemy-v2\//u, "")); }

function sourceFamily(path) {
  const parts = path.split("/");
  const packageAt = parts.indexOf("packages");
  if (packageAt >= 0 && parts[packageAt + 1]) return `package:${parts[packageAt + 1]}`;
  const root = parts[1];
  if (root === "implementation" && parts[3]) return `implementation:${parts[3]}`;
  if (root === "development" && parts[3]) return `development:${parts.slice(3, 5).join("/")}`;
  if (root === "agent-reasoning-engine") return `product-model:${parts.slice(2, 4).join("/") || "root"}`;
  return `other:${parts.slice(1, 4).join("/")}`;
}

function sourceRole(path) {
  const lower = path.toLowerCase();
  if (lower.includes("/generated/") || /(?:receipt|evidence)\.(?:json|jsonl)$/u.test(lower)) return "generated-or-derived-evidence";
  if (lower.includes("/test/") || lower.includes("/tests/") || lower.includes("/fixtures/") || /\.test\.mjs$/u.test(lower)) return "test-or-fixture";
  if (lower.endsWith(".md")) return "documentation";
  if (/\.(?:mjs|js|cjs|rs|ts|tsx|jsx)$/u.test(lower)) return "implementation-source";
  return "configuration-or-data";
}

function scanText(bytes) {
  if (bytes.includes(0)) return {is_text: false, spdx_identifiers: [], copyright_markers: [], license_text_signals: []};
  const text = bytes.toString("utf8");
  if (Buffer.from(text, "utf8").compare(bytes) !== 0) return {is_text: false, spdx_identifiers: [], copyright_markers: [], license_text_signals: []};
  const spdx = [...text.matchAll(/SPDX-License-Identifier:\s*([^\s*]+)/giu)].map(match => match[1]).filter((value, index, all) => all.indexOf(value) === index).sort();
  const copyrights = [...text.matchAll(/copyright\s*(?:\(c\)|©|:)?\s*(\d{4}(?:-\d{4})?[^\r\n]{0,100})/giu)]
    .map(match => match[1].trim()).filter((value, index, all) => all.indexOf(value) === index).sort();
  const signals = [
    ["apache-license", /apache license/iu],
    ["gnu-general-public-license", /gnu general public license/iu],
    ["licensed-under", /licensed under/iu],
    ["mit-license", /mit license/iu],
    ["mozilla-public-license", /mozilla public license/iu],
    ["permission-is-hereby-granted", /permission is hereby granted/iu],
    ["third-party", /third[- ]party/iu]
  ].filter(([, pattern]) => pattern.test(text)).map(([id]) => id);
  return {is_text: true, spdx_identifiers: spdx, copyright_markers: copyrights, license_text_signals: signals};
}

export function buildSourceRightsInventory(candidate, ownerDecisions, options = {}) {
  const readFile = options.readFile ?? (path => readFileSync(repositoryPath(path)));
  const inventoryId = options.inventoryId ?? "ARE-SOURCE-RIGHTS-INVENTORY-001";
  const sourceLabel = options.sourceLabel ?? "exact Candidate 018 source closure";
  const nextGate = options.nextGate ?? "Vladimir Rondelli or a qualified reviewer must verify provenance for every source family and disposition every notice candidate before final license clearance.";
  const files = candidate.source_closure.files.map(bound => {
    const bytes = readFile(bound.path);
    need(bytes.length === bound.bytes, `source-rights.byte-drift:${bound.path}`);
    need(sha256(bytes) === bound.sha256, `source-rights.digest-drift:${bound.path}`);
    const markers = scanText(bytes);
    const markerCount = markers.spdx_identifiers.length + markers.copyright_markers.length + markers.license_text_signals.length;
    return {
      path: bound.path,
      sha256: bound.sha256,
      bytes: bound.bytes,
      mode: bound.mode,
      source_family: sourceFamily(bound.path),
      source_role: sourceRole(bound.path),
      ...markers,
      marker_disposition: markerCount > 0 ? "REQUIRES_QUALIFIED_NOTICE_REVIEW" : "NO_EMBEDDED_RIGHTS_MARKER_DETECTED",
      asserted_copyright_owner: ownerDecisions.commercial_identity.copyright_owner,
      ownership_disposition: "OWNER_ASSERTED_PROVENANCE_UNVERIFIED"
    };
  });
  const byFamily = Object.entries(files.reduce((result, file) => {
    const row = result[file.source_family] ??= {file_count: 0, total_bytes: 0, marker_file_count: 0};
    row.file_count += 1; row.total_bytes += file.bytes;
    if (file.marker_disposition === "REQUIRES_QUALIFIED_NOTICE_REVIEW") row.marker_file_count += 1;
    return result;
  }, {})).sort(([a], [b]) => a.localeCompare(b)).map(([source_family, counts]) => ({source_family, ...counts, asserted_copyright_owner: ownerDecisions.commercial_identity.copyright_owner, ownership_disposition: "OWNER_ASSERTED_PROVENANCE_UNVERIFIED"}));
  const markerFiles = files.filter(file => file.marker_disposition === "REQUIRES_QUALIFIED_NOTICE_REVIEW");
  return {
    schema_version: "are.source-rights-inventory/v1",
    inventory_id: inventoryId,
    status: "TECHNICAL_INVENTORY_COMPLETE_RIGHTS_REVIEW_PENDING",
    applies_to: {
      candidate_id: candidate.candidate_id,
      candidate_digest: candidate.candidate_digest,
      source_closure_digest: candidate.source_closure.closure_digest,
      source_file_count: files.length
    },
    owner_assertion: {
      decision_id: ownerDecisions.decision_id,
      decision_sha256: sha256(stableJson(ownerDecisions)),
      copyright_owner: ownerDecisions.commercial_identity.copyright_owner,
      posture: "PRODUCT_OWNER_ASSERTION_PENDING_PROVENANCE_AND_QUALIFIED_REVIEW"
    },
    method: {
      source: sourceLabel,
      checks: ["bound path exists", "byte count matches", "SHA-256 matches", "UTF-8 text detection", "SPDX identifier scan", "copyright marker scan", "license-text signal scan", "deterministic source-family classification"],
      non_inference: "The absence of an embedded marker does not establish ownership, originality, public-domain status, or permission to distribute."
    },
    summary: {
      file_count: files.length,
      total_bytes: files.reduce((sum, file) => sum + file.bytes, 0),
      source_family_count: byFamily.length,
      text_file_count: files.filter(file => file.is_text).length,
      binary_file_count: files.filter(file => !file.is_text).length,
      spdx_marker_file_count: files.filter(file => file.spdx_identifiers.length > 0).length,
      copyright_marker_file_count: files.filter(file => file.copyright_markers.length > 0).length,
      license_signal_file_count: files.filter(file => file.license_text_signals.length > 0).length,
      notice_candidate_file_count: markerFiles.length,
      owner_assertion_file_count: files.length,
      provenance_review_required_file_count: files.length
    },
    source_families: byFamily,
    notice_candidates: markerFiles.map(file => ({path: file.path, spdx_identifiers: file.spdx_identifiers, copyright_markers: file.copyright_markers, license_text_signals: file.license_text_signals})),
    files,
    next_gate: nextGate,
    claim_limit: "This is a deterministic technical marker and closure inventory. It is not ownership certification, originality analysis, legal clearance, a complete third-party-code detector, or permission to distribute.",
    authority_effect: "none"
  };
}

export function buildSourceRightsReceipt(bytes, inventory) {
  return {
    schema_version: "are.source-rights-inventory-receipt/v1",
    inventory_id: inventory.inventory_id,
    status: "PASS",
    inventory_sha256: sha256(bytes),
    candidate_id: inventory.applies_to.candidate_id,
    source_closure_digest: inventory.applies_to.source_closure_digest,
    ...inventory.summary,
    rights_clearance_status: "PENDING_OWNER_AND_QUALIFIED_REVIEW",
    claim_limit: "PASS verifies exact closure coverage and deterministic marker classification only; it grants no rights clearance or distribution permission.",
    authority_effect: "none"
  };
}

export function validateFrozenInventory(inventory, candidate, receipt, inventoryBytes) {
  need(inventory?.schema_version === "are.source-rights-inventory/v1", "source-rights.schema-version-invalid");
  need(inventory.applies_to?.candidate_id === candidate.candidate_id, "source-rights.candidate-id-drift");
  need(inventory.applies_to?.candidate_digest === candidate.candidate_digest, "source-rights.candidate-digest-drift");
  need(inventory.applies_to?.source_closure_digest === candidate.source_closure.closure_digest, "source-rights.closure-digest-drift");
  need(inventory.applies_to?.source_file_count === candidate.source_closure.files.length, "source-rights.file-count-drift");
  const expected = new Map(candidate.source_closure.files.map(file => [file.path, file]));
  need(inventory.files?.length === expected.size, "source-rights.inventory-coverage-drift");
  for (const file of inventory.files ?? []) {
    const bound = expected.get(file.path);
    need(bound, `source-rights.file-extra:${file.path}`);
    need(file.bytes === bound.bytes, `source-rights.bound-byte-drift:${file.path}`);
    need(file.sha256 === bound.sha256, `source-rights.bound-digest-drift:${file.path}`);
    need(file.mode === bound.mode, `source-rights.bound-mode-drift:${file.path}`);
  }
  const expectedReceipt = buildSourceRightsReceipt(inventoryBytes, inventory);
  need(stableJson(receipt) === stableJson(expectedReceipt), "source-rights.receipt-drift");
  return expectedReceipt;
}

function main() {
  const [mode = "--check"] = process.argv.slice(2);
  need(["--check", "--write"].includes(mode), "usage:generate-source-rights-inventory [--check|--write]");
  const candidate = JSON.parse(readFileSync(candidatePath, "utf8"));
  const ownerDecisions = JSON.parse(readFileSync(ownerDecisionsPath, "utf8"));
  if (mode === "--write") {
    const inventoryBytes = stableJson(buildSourceRightsInventory(candidate, ownerDecisions));
    const inventory = JSON.parse(inventoryBytes);
    const receiptBytes = stableJson(buildSourceRightsReceipt(inventoryBytes, inventory));
    writeFileSync(outputPath, inventoryBytes);
    writeFileSync(receiptPath, receiptBytes);
    process.stdout.write(stableJson({...buildSourceRightsReceipt(inventoryBytes, inventory), mode}));
  } else {
    need(existsSync(outputPath), "source-rights.inventory-missing");
    need(existsSync(receiptPath), "source-rights.receipt-missing");
    const inventoryBytes = readFileSync(outputPath, "utf8");
    const inventory = JSON.parse(inventoryBytes);
    const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
    const validated = validateFrozenInventory(inventory, candidate, receipt, inventoryBytes);
    process.stdout.write(stableJson({...validated, mode}));
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
