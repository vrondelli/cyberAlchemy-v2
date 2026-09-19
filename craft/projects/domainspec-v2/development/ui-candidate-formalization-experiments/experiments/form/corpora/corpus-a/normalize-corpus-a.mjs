import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { buildEnvelope, canonicalize } from "../../../../../ui-meta-type-repair/contracts/canonical-json-v1.mjs";

const PROHIBITED = Object.freeze([
  "literal-facts-are-not-candidate-identity",
  "candidate-projection-is-not-a-source-fact",
  "one-corpus-is-not-portability-or-independent-replication",
  "reviewer-projection-cannot-be-copied-as-literal-fact",
  "action-correspondence-cannot-be-pooled-into-form",
  "corpus-attestation-does-not-mutate-DS-D1-or-DS-D8",
]);

const PROJECTION_MAP = Object.freeze({
  "form-element-token": { candidate_obligation: "aggregate-container-observation", correspondence: "partial" },
  "name-input-token": { candidate_obligation: "typed_fields", correspondence: "partial" },
  "required-token": { candidate_obligation: "validation_contract", correspondence: "partial" },
  "submit-handler-token": { candidate_obligation: "submission_action", correspondence: "partial" },
  "prevent-default-token": { candidate_obligation: "submission-control-observation", correspondence: "partial" },
  "post-call-token": { candidate_obligation: "target_interface", correspondence: "partial" },
});

export function normalizeCorpusA({ manifest, sourceGeneration, policyInput }) {
  assertObject(manifest, "manifest");
  assertObject(sourceGeneration, "sourceGeneration");
  assertObject(policyInput, "policyInput");
  if (manifest.schema_version !== "ucfe.form-corpus-a-manifest.v1") throw new TypeError("unsupported corpus A manifest");
  const selected = manifest.receipt_entries.map((expected) => {
    const entry = sourceGeneration.facts?.find((candidate) => candidate.entry_id === expected.entry_id);
    if (!entry || entry.receipt.record_id !== expected.record_id) throw new TypeError(`missing pinned corpus receipt: ${expected.entry_id}`);
    const semantic = entry.receipt.semantic;
    if (semantic.corpus_id !== manifest.corpus_id || semantic.implementation_style !== manifest.implementation_style) throw new TypeError("corpus identity or style drift");
    if (semantic.source.revision !== manifest.source_revision || semantic.observed_source.revision !== manifest.source_revision) throw new TypeError("source revision drift");
    if (semantic.source.path !== expected.path || semantic.source.file_digest !== expected.file_digest || semantic.observed_source.file_digest !== expected.file_digest) throw new TypeError("source path or digest drift");
    if (semantic.observation_status !== "observed" || semantic.omissions.length !== 0) throw new TypeError("corpus A receipt must be complete observed evidence");
    return entry;
  });

  const candidate = policyInput.candidates?.find((entry) => entry.candidate_id === manifest.candidate_id);
  if (!candidate || candidate.evidence.length !== 1) throw new TypeError("Form policy evidence row is missing or ambiguous");
  const attested = candidate.evidence[0];
  if (attested.corpus_id !== manifest.corpus_id || attested.author_id !== manifest.author_id || attested.implementation_style !== manifest.implementation_style) throw new TypeError("authorship or style attestation drift");
  if (canonicalize([...attested.receipt_handles].sort()) !== canonicalize(manifest.receipt_entries.map((entry) => entry.record_id).sort())) throw new TypeError("authorship attestation receipt set drift");

  const literal = {
    schema_version: "ucfe.form-corpus-a-literal.v1",
    candidate_id: manifest.candidate_id,
    corpus_id: manifest.corpus_id,
    sources: selected.map(({ entry_id, receipt }) => ({
      entry_id,
      record_id: receipt.record_id,
      content_digest: receipt.content_digest,
      generation_id: receipt.generation_id,
      source: receipt.semantic.source,
      observed_source: receipt.semantic.observed_source,
      selector: receipt.semantic.selector,
      observation_status: receipt.semantic.observation_status,
      literal_observations: receipt.semantic.literal_observations,
      omissions: receipt.semantic.omissions,
      extractor: receipt.semantic.extractor,
      prohibited_inferences: receipt.semantic.prohibited_inferences,
    })),
    reviewer_projection_handles: [],
    action_candidate_handles: [],
  };
  const authorship = {
    schema_version: "ucfe.form-corpus-a-authorship.v1",
    corpus_id: manifest.corpus_id,
    author_id: manifest.author_id,
    implementation_style: manifest.implementation_style,
    corpus_count: 1,
    independent_author_count: 1,
    implementation_style_count: 1,
    attestation_class: "accepted-policy-identity",
    independence_scope: "corpus-a-only",
    evidence_handles: [...attested.receipt_handles].sort(),
  };
  const mappings = literal.sources.flatMap((source) => source.literal_observations.map((fact) => ({
    source_record_id: source.record_id,
    fact_id: fact.fact_id,
    predicate: fact.predicate,
    literal_value: fact.value,
    ...PROJECTION_MAP[fact.fact_id],
    identity_witness: false,
  })));
  if (mappings.some((entry) => !entry.candidate_obligation)) throw new TypeError("unmapped literal fact");
  const projection = {
    schema_version: "ucfe.form-corpus-a-projection.v1",
    candidate_id: manifest.candidate_id,
    corpus_id: manifest.corpus_id,
    correspondence: "partial",
    mappings,
    missing_candidate_obligations: ["complete-typed-fields", "error_contract", "error_mapping", "semantic-target-interface"],
    evidence_role: "candidate-projection-not-literal-fact",
  };
  const semantic = {
    schema_version: "ucfe.form-corpus-a-attestation.v1",
    candidate_id: manifest.candidate_id,
    corpus_id: manifest.corpus_id,
    literal,
    authorship,
    projection,
    portability_state: "insufficient",
    required_counts: { real_corpora: 2, independent_authors: 2, implementation_styles: 2 },
    observed_counts: { real_corpora: 1, independent_authors: 1, implementation_styles: 1 },
    prohibited_inferences: [...PROHIBITED],
  };
  const envelope = buildEnvelope({
    contractId: "ucfe.form-corpus-attestation",
    contractVersion: "1.0.0",
    semanticFields: Object.keys(semantic),
    record: semantic,
    status: "defer",
    inputHandles: [...manifest.input_handles],
  });
  return { literal, authorship, projection, generation: { ...envelope, semantic } };
}

export function publishCorpusAGeneration(generation, outputPath) {
  assertObject(generation, "generation");
  if (typeof outputPath !== "string" || outputPath.length === 0) throw new TypeError("outputPath is required");
  if (existsSync(outputPath)) {
    const existing = JSON.parse(readFileSync(outputPath, "utf8"));
    if (existing.generation_id === generation.generation_id && canonicalize(existing.semantic) === canonicalize(generation.semantic)) return { status: "no-op", generation_id: generation.generation_id };
    throw new TypeError("refusing to overwrite non-identical corpus A generation");
  }
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(generation, null, 2)}\n`, "utf8");
  return { status: "published", generation_id: generation.generation_id };
}

function assertObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
}
