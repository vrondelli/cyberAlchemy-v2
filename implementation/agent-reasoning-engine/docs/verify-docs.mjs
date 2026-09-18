#!/usr/bin/env node
import {existsSync, readFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {generateApiReference} from "./generate-api-reference.mjs";
import {generateCandidateHistory} from "./generate-candidate-history.mjs";

const docsRoot = dirname(fileURLToPath(import.meta.url));
const productRoot = resolve(docsRoot, "..");
const manifest = JSON.parse(readFileSync(resolve(docsRoot, "manifest.json"), "utf8"));
const product = JSON.parse(readFileSync(resolve(productRoot, "product.json"), "utf8"));
const candidateNumber = manifest.candidate_id?.match(/(\d+)$/u)?.[1];
const candidate = JSON.parse(readFileSync(resolve(productRoot, `evidence/product-candidate.${candidateNumber}.json`), "utf8"));
const reasons = [];

if (manifest.schema_version !== "are.documentation-manifest/v1") reasons.push("manifest.schema-version-invalid");
if (manifest.authority_effect !== "none") reasons.push("manifest.authority-effect-invalid");
if (manifest.product_version !== product.version) reasons.push("manifest.product-version-drift");
if (manifest.candidate_id !== candidate.candidate_id) reasons.push("manifest.candidate-id-drift");
if (!manifest.documents.includes(manifest.entrypoint)) reasons.push("manifest.entrypoint-unlisted");

const readiness = manifest.release_readiness_documents;
if (!readiness || typeof readiness !== "object" || Array.isArray(readiness)) {
  reasons.push("manifest.release-readiness-documents-invalid");
}

const markdownLink = /\[[^\]]*\]\(([^)]+)\)/gu;
const index = existsSync(resolve(docsRoot, manifest.entrypoint))
  ? readFileSync(resolve(docsRoot, manifest.entrypoint), "utf8")
  : "";

for (const document of manifest.documents) {
  const path = resolve(docsRoot, document);
  if (!existsSync(path)) {
    reasons.push(`document.missing:${document}`);
    continue;
  }
  const source = readFileSync(path, "utf8");
  if (!source.startsWith("# ")) reasons.push(`document.title-missing:${document}`);
  for (const section of manifest.required_sections) {
    if (!source.includes(`## ${section}`)) reasons.push(`document.required-section-missing:${document}:${section}`);
  }
  if (document !== manifest.entrypoint && !index.includes(`(${document})`)) reasons.push(`document.unlinked-from-index:${document}`);
  for (const match of source.matchAll(markdownLink)) {
    const target = match[1].trim();
    if (!target || target.startsWith("#") || /^(?:https?:|mailto:)/u.test(target)) continue;
    const file = decodeURIComponent(target.split("#", 1)[0].split("?", 1)[0]);
    if (!file || !existsSync(resolve(dirname(path), file))) reasons.push(`link.missing:${document}:${target}`);
  }
}

for (const [document, expectedStatus] of Object.entries(readiness ?? {})) {
  if (!manifest.documents.includes(document)) reasons.push(`release-readiness.unlisted:${document}`);
  const path = resolve(docsRoot, document);
  if (!existsSync(path)) continue;
  const source = readFileSync(path, "utf8");
  const expectedFields = [
    `**Lifecycle status:** ${expectedStatus}`,
    "**Audience:**",
    "**Owner:**",
    "**Last reviewed:**",
    "**Applies to:**",
    "**Claim ceiling:**",
  ];
  for (const field of expectedFields) {
    if (!source.includes(field)) reasons.push(`release-readiness.metadata-missing:${document}:${field}`);
  }
}

try {
  const generated = await generateApiReference();
  const generatedPath = resolve(docsRoot, "reference/API-FIELDS.md");
  if (!existsSync(generatedPath) || readFileSync(generatedPath, "utf8") !== generated) {
    reasons.push("generated.api-reference-drift");
  }
} catch (error) {
  reasons.push(`generated.api-reference-error:${error.message}`);
}

try {
  const generated = generateCandidateHistory();
  const generatedPath = resolve(docsRoot, "releases/candidate-history.json");
  if (!existsSync(generatedPath) || readFileSync(generatedPath, "utf8") !== generated) {
    reasons.push("generated.candidate-history-drift");
  }
} catch (error) {
  reasons.push(`generated.candidate-history-error:${error.message}`);
}

try {
  const preflight = JSON.parse(readFileSync(resolve(docsRoot, "releases/candidate-013-artifact-preflight.json"), "utf8"));
  const historicalCandidate = JSON.parse(readFileSync(resolve(productRoot, "evidence/product-candidate.013.json"), "utf8"));
  const classified = Object.values(preflight.classifications ?? {}).reduce((sum, count) => sum + count, 0);
  const unresolvedScopes = Object.values(preflight.unresolved?.by_scope ?? {}).reduce((sum, count) => sum + count, 0);
  if (preflight.schema_version !== "are.documentation-artifact-preflight/v1"
    || preflight.candidate_id !== historicalCandidate.candidate_id
    || preflight.candidate_digest !== historicalCandidate.candidate_digest
    || preflight.source_closure_digest !== historicalCandidate.source_closure.closure_digest
    || preflight.total_files !== historicalCandidate.source_closure.files.length
    || classified !== preflight.total_files
    || unresolvedScopes !== preflight.classifications.unresolved
    || preflight.closure_composition?.domainspec_compiler_dist_files !== 1436
    || preflight.closure_composition?.domainspec_compiler_source_files !== 0
    || preflight.authority_effect !== "none") {
    reasons.push("historical.artifact-preflight-record-invalid");
  }
} catch (error) {
  reasons.push(`historical.artifact-preflight-record-error:${error.message}`);
}

const result = {
  schema_version: "are.documentation-verification/v1",
  status: reasons.length === 0 ? "PASS" : "FAIL",
  product_version: manifest.product_version,
  candidate_id: manifest.candidate_id,
  document_count: manifest.documents.length,
  reason_codes: [...new Set(reasons)].sort(),
  authority_effect: "none",
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (result.status !== "PASS") process.exitCode = 1;
