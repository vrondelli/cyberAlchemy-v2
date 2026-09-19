import { createHash } from "node:crypto";

import { buildEnvelope } from "../contracts/canonical-json-v1.mjs";

const PROHIBITED = [
  "not-observed-does-not-mean-absent",
  "literal-source-fact-is-not-candidate-identity",
  "corpus-receipt-is-not-independent-replication",
];
const FORBIDDEN_FACT_KEYS = ["candidate", "candidate_id", "domain_spec_type", "reviewer_projection"];

export function rawSha256(value) {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

export function createCorpusFactReceipt(spec, { sourceText, actualRevision }) {
  requireFactSpec(spec);
  for (const key of FORBIDDEN_FACT_KEYS) {
    if (Object.hasOwn(spec, key)) throw new TypeError(`${key} is prohibited in a literal corpus fact`);
  }
  if (typeof sourceText !== "string") throw new TypeError("sourceText is required");
  requireString(actualRevision, "actualRevision");

  const actualFileDigest = rawSha256(sourceText);
  const omissions = [];
  let excerpt = null;
  if (actualRevision !== spec.source.revision) {
    omissions.push({ code: "revision-mismatch", detail: `expected ${spec.source.revision}; observed ${actualRevision}` });
  }
  if (actualFileDigest !== spec.source.file_digest) {
    omissions.push({ code: "source-digest-mismatch", detail: `expected ${spec.source.file_digest}; observed ${actualFileDigest}` });
  }
  if (omissions.length === 0) {
    excerpt = extractLineRange(sourceText, spec.selector.start_line, spec.selector.end_line);
    if (!excerpt.includes(spec.selector.anchor)) {
      const movedLine = findAnchorLine(sourceText, spec.selector.anchor);
      omissions.push(movedLine === null
        ? { code: "excerpt-missing", detail: "selector anchor was not observed in the pinned source" }
        : { code: "selector-moved", detail: `selector anchor observed at line ${movedLine}, outside the pinned range` });
    } else if (rawSha256(excerpt) !== spec.selector.excerpt_digest) {
      omissions.push({ code: "excerpt-digest-mismatch", detail: `expected ${spec.selector.excerpt_digest}; observed ${rawSha256(excerpt)}` });
    }
  }

  const observed = omissions.length === 0;
  const semantic = {
    schema_version: "ui-repair.corpus-receipt.v1",
    corpus_id: spec.corpus_id,
    implementation_style: spec.implementation_style,
    source: spec.source,
    observed_source: { revision: actualRevision, file_digest: actualFileDigest },
    selector: spec.selector,
    observation_status: observed ? "observed" : "not-observed",
    literal_observations: observed
      ? spec.literal_facts.map((fact) => ({ fact_id: fact.fact_id, predicate: "token-present", token: fact.token, value: excerpt.includes(fact.token) }))
      : [],
    omissions,
    extractor: { id: "line-range-token-extractor", version: "1.0.0" },
    prohibited_inferences: PROHIBITED,
  };
  const envelope = buildEnvelope({
    contractId: "ui-repair.corpus-receipt",
    contractVersion: "1.0.0",
    semanticFields: Object.keys(semantic),
    record: semantic,
    status: observed ? "complete" : "defer",
    inputHandles: [`source:${actualFileDigest}`, `revision:${actualRevision}`].sort(),
    createdAt: spec.observed_at,
  });
  return { ...envelope, semantic };
}

export function createReviewerProjection(input) {
  requireString(input.corpus_receipt_id, "corpus_receipt_id");
  requireString(input.reviewer, "reviewer");
  requireString(input.candidate_ref, "candidate_ref");
  requireString(input.statement, "statement");
  if (!["proposed", "disputed", "not-applicable"].includes(input.projection_status)) {
    throw new TypeError("projection_status is invalid");
  }
  const semantic = {
    schema_version: "ui-repair.reviewer-projection.v1",
    corpus_receipt_id: input.corpus_receipt_id,
    reviewer: input.reviewer,
    candidate_ref: input.candidate_ref,
    projection_status: input.projection_status,
    statement: input.statement,
    prohibited_inference: "reviewer-projection-is-not-source-fact-or-type-identity",
  };
  const envelope = buildEnvelope({
    contractId: "ui-repair.reviewer-projection",
    contractVersion: "1.0.0",
    semanticFields: Object.keys(semantic),
    record: semantic,
    status: "defer",
    inputHandles: [input.corpus_receipt_id],
    createdAt: input.observed_at,
  });
  return { ...envelope, semantic };
}

function extractLineRange(sourceText, startLine, endLine) {
  const lines = sourceText.split("\n");
  const excerpt = lines.slice(startLine - 1, endLine).join("\n");
  return endLine < lines.length ? `${excerpt}\n` : excerpt;
}

function findAnchorLine(sourceText, anchor) {
  const index = sourceText.split("\n").findIndex((line) => line.includes(anchor));
  return index < 0 ? null : index + 1;
}

function requireFactSpec(spec) {
  if (!spec || typeof spec !== "object" || Array.isArray(spec)) throw new TypeError("fact spec is required");
  requireString(spec.corpus_id, "corpus_id");
  requireString(spec.implementation_style, "implementation_style");
  for (const field of ["repository", "revision", "path", "file_digest"]) requireString(spec.source?.[field], `source.${field}`);
  if (spec.selector?.kind !== "line-range") throw new TypeError("selector.kind must be line-range");
  if (!Number.isSafeInteger(spec.selector.start_line) || !Number.isSafeInteger(spec.selector.end_line) || spec.selector.start_line < 1 || spec.selector.end_line < spec.selector.start_line) {
    throw new TypeError("selector line range is invalid");
  }
  requireString(spec.selector.anchor, "selector.anchor");
  requireString(spec.selector.excerpt_digest, "selector.excerpt_digest");
  if (!Array.isArray(spec.literal_facts)) throw new TypeError("literal_facts must be an array");
  for (const fact of spec.literal_facts) {
    requireString(fact.fact_id, "literal_facts.fact_id");
    requireString(fact.token, "literal_facts.token");
  }
}

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} is required`);
}
