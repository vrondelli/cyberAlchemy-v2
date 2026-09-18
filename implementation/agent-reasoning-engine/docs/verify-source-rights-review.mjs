#!/usr/bin/env node
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const docsRoot = dirname(fileURLToPath(import.meta.url));
const productRoot = resolve(docsRoot, "..");
const review = JSON.parse(readFileSync(resolve(docsRoot, "source-rights-review.json"), "utf8"));
const inventoryBytes = readFileSync(resolve(docsRoot, "source-rights-inventory.json"));
const inventory = JSON.parse(inventoryBytes);
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const reasons = [];

if (review.schema_version !== "are.source-rights-review/v1") reasons.push("review.schema-version-invalid");
if (review.status !== "ENGINEERING_REVIEW_COMPLETE_QUALIFIED_CLEARANCE_PENDING") reasons.push("review.status-invalid");
if (review.authority_effect !== "none") reasons.push("review.authority-effect-invalid");
if (review.inventory_binding?.inventory_id !== inventory.inventory_id) reasons.push("review.inventory-id-drift");
if (review.inventory_binding?.inventory_sha256 !== sha256(inventoryBytes)) reasons.push("review.inventory-digest-drift");
if (review.inventory_binding?.source_closure_digest !== inventory.applies_to?.source_closure_digest) reasons.push("review.closure-digest-drift");
if (review.review_scope?.source_families !== inventory.summary?.source_family_count) reasons.push("review.family-count-drift");
if (review.review_scope?.files !== inventory.summary?.file_count) reasons.push("review.file-count-drift");
if (review.review_scope?.owner_assertion_files !== inventory.summary?.owner_assertion_file_count) reasons.push("review.owner-assertion-count-drift");
if (review.review_scope?.notice_candidates !== inventory.notice_candidates?.length) reasons.push("review.notice-count-drift");
if (review.family_disposition?.clearance_disposition !== "QUALIFIED_PROVENANCE_AND_LICENSE_REVIEW_REQUIRED") reasons.push("review.qualified-gate-missing");
if (!Array.isArray(review.open_questions) || review.open_questions.length === 0) reasons.push("review.open-questions-missing");

const inventoryNotices = new Map((inventory.notice_candidates ?? []).map(item => [item.path, item]));
for (const disposition of review.notice_candidate_dispositions ?? []) {
  const candidate = inventoryNotices.get(disposition.path);
  if (!candidate) reasons.push(`review.notice-unknown:${disposition.path}`);
  else if (!candidate.license_text_signals?.includes(disposition.signal)) reasons.push(`review.notice-signal-drift:${disposition.path}`);
  const sourcePath = resolve(productRoot, "../../..", disposition.path);
  const line = readFileSync(sourcePath, "utf8").split(/\r?\n/u)[disposition.line - 1] ?? "";
  if (!line.toLowerCase().includes(disposition.signal)) reasons.push(`review.notice-line-drift:${disposition.path}`);
}
if ((review.notice_candidate_dispositions ?? []).length !== inventory.notice_candidates?.length) reasons.push("review.notice-coverage-drift");

const result = {
  schema_version: "are.source-rights-review-verification/v1",
  status: reasons.length === 0 ? "PASS" : "FAIL",
  review_id: review.review_id,
  source_family_count: inventory.summary?.source_family_count ?? 0,
  notice_disposition_count: review.notice_candidate_dispositions?.length ?? 0,
  reason_codes: [...new Set(reasons)].sort(),
  authority_effect: "none"
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (result.status !== "PASS") process.exitCode = 1;
