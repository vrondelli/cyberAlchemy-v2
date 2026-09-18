#!/usr/bin/env node

import {createHash} from "node:crypto";
import {existsSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const docsRoot = dirname(fileURLToPath(import.meta.url));
const productRoot = resolve(docsRoot, "..");
const repositoryRoot = resolve(productRoot, "../..");
const matrixPath = resolve(docsRoot, "compatibility-matrix.json");
const receiptPath = resolve(docsRoot, "compatibility-matrix-receipt.json");
const candidatePath = resolve(productRoot, "evidence/product-candidate.018.json");
const requiredCategories = ["artifact", "configuration", "credential", "journal", "protocol", "schema", "state"];
const sha256 = value => createHash("sha256").update(value).digest("hex");

function need(condition, code) {
  if (!condition) throw new Error(code);
}

export function validateCompatibilityMatrix(matrix, options = {}) {
  const candidate = options.candidate ?? JSON.parse(readFileSync(candidatePath, "utf8"));
  const pathExists = options.pathExists ?? (ref => {
    const path = resolve(repositoryRoot, ref);
    return path.startsWith(`${repositoryRoot}/`) && existsSync(path);
  });
  need(matrix?.schema_version === "are.compatibility-matrix/v1", "compatibility.schema-version-invalid");
  need(matrix.lifecycle_status === "candidate-internal", "compatibility.lifecycle-invalid");
  need(matrix.authority_effect === "none", "compatibility.authority-effect-invalid");
  need(matrix.applies_to?.candidate_id === candidate.candidate_id, "compatibility.candidate-id-drift");
  need(matrix.applies_to?.candidate_digest === candidate.candidate_digest, "compatibility.candidate-digest-drift");
  need(matrix.applies_to?.product_version === candidate.product.version, "compatibility.product-version-drift");
  need(matrix.applies_to?.source_closure_digest === candidate.source_closure.closure_digest, "compatibility.closure-digest-drift");
  need(JSON.stringify([...matrix.required_categories].sort()) === JSON.stringify(requiredCategories), "compatibility.required-categories-drift");
  need(Array.isArray(matrix.boundaries) && matrix.boundaries.length > 0, "compatibility.boundaries-empty");
  need(new Set(matrix.boundaries.map(item => item.boundary_id)).size === matrix.boundaries.length, "compatibility.boundary-duplicate");
  const covered = [...new Set(matrix.boundaries.map(item => item.category))].sort();
  need(JSON.stringify(covered) === JSON.stringify(requiredCategories), "compatibility.category-coverage-mismatch");
  for (const boundary of matrix.boundaries) {
    for (const field of ["boundary_id", "category", "persistence", "compatibility_rule", "current_read_support", "migration_support"]) {
      need(typeof boundary[field] === "string" && boundary[field].length > 0, `compatibility.field-missing:${boundary.boundary_id ?? "unknown"}:${field}`);
    }
    need(requiredCategories.includes(boundary.category), `compatibility.category-invalid:${boundary.boundary_id}`);
    need(Array.isArray(boundary.current_identities) && boundary.current_identities.length > 0, `compatibility.identities-empty:${boundary.boundary_id}`);
    need(Array.isArray(boundary.writer_refs) && boundary.writer_refs.length > 0, `compatibility.writers-empty:${boundary.boundary_id}`);
    need(Array.isArray(boundary.reader_refs) && boundary.reader_refs.length > 0, `compatibility.readers-empty:${boundary.boundary_id}`);
    for (const ref of [...boundary.writer_refs, ...boundary.reader_refs]) need(pathExists(ref), `compatibility.source-missing:${boundary.boundary_id}:${ref}`);
  }
  need(Array.isArray(matrix.predecessor_successor_pairs), "compatibility.version-pairs-invalid");
  if (matrix.upgrade_posture === "NO_SUPPORTED_PATH") need(matrix.predecessor_successor_pairs.length === 0, "compatibility.unsupported-path-has-pair");
  else need(matrix.predecessor_successor_pairs.length > 0, "compatibility.supported-path-missing-pair");
  need(typeof matrix.next_gate === "string" && matrix.next_gate.length > 0, "compatibility.next-gate-missing");
  need(typeof matrix.claim_limit === "string" && matrix.claim_limit.length > 0, "compatibility.claim-limit-missing");
  return Object.freeze({boundary_count: matrix.boundaries.length, categories: covered, upgrade_posture: matrix.upgrade_posture});
}

function receipt(matrixBytes, validation) {
  return {
    schema_version: "are.compatibility-matrix-receipt/v1",
    matrix_id: "ARE-COMPATIBILITY-CANDIDATE-018",
    status: "PASS",
    matrix_sha256: sha256(matrixBytes),
    candidate_id: "ARE-PRODUCT-CANDIDATE-018",
    boundary_count: validation.boundary_count,
    categories: validation.categories,
    upgrade_posture: validation.upgrade_posture,
    claim_limit: "PASS proves current compatibility-boundary inventory and source presence. It does not prove a predecessor/successor migration path.",
    authority_effect: "none",
  };
}

function main() {
  const [mode = "--check"] = process.argv.slice(2);
  need(["--check", "--write"].includes(mode), "usage:verify-compatibility-matrix [--check|--write]");
  const matrixBytes = readFileSync(matrixPath);
  const validation = validateCompatibilityMatrix(JSON.parse(matrixBytes));
  const value = receipt(matrixBytes, validation);
  const bytes = `${JSON.stringify(value, null, 2)}\n`;
  if (mode === "--write") writeFileSync(receiptPath, bytes);
  else {
    need(existsSync(receiptPath), "compatibility.receipt-missing");
    need(readFileSync(receiptPath, "utf8") === bytes, "compatibility.receipt-drift");
  }
  process.stdout.write(`${JSON.stringify({...value, mode}, null, 2)}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { main(); }
  catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
