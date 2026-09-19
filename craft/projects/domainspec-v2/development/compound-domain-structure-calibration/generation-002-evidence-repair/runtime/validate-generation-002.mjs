import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { sha256Canonical, validateEnvelope } from "../../evaluation/canonical-json.mjs";
import { REQUIRED_PROHIBITIONS, validateEvidenceReceipt } from "../../evaluation/validate-input.mjs";

const OBSERVATION_STATES = new Set(["supported", "refuted", "indeterminate"]);
const COMPARISON_STATES = new Set(["match", "different", "indeterminate"]);

export function readReceiptVocabulary(schema) {
  const kinds = schema?.$defs?.explanation?.properties?.kind?.enum;
  const classes = schema?.$defs?.observable?.properties?.class?.enum;
  if (!Array.isArray(kinds) || kinds.length === 0) throw new TypeError("receipt schema missing explanation kind enum");
  if (!Array.isArray(classes) || classes.length === 0) throw new TypeError("receipt schema missing observable class enum");
  return {
    explanationKinds: new Set(kinds),
    observableClasses: new Set(classes),
  };
}

export function validateEvidenceReceiptV2(receipt, receiptSchema) {
  validateEvidenceReceipt(receipt);
  const vocabulary = readReceiptVocabulary(receiptSchema);
  for (const explanation of receipt.semantic.A) {
    if (!vocabulary.explanationKinds.has(explanation.kind)) throw new TypeError(`unknown explanation kind: ${explanation.kind}`);
  }
  for (const observable of receipt.semantic.Q) {
    if (!vocabulary.observableClasses.has(observable.class)) throw new TypeError(`unknown observable class: ${observable.class}`);
  }
  return true;
}

export function validateHarnessManifest(manifest) {
  validateEnvelope(manifest, { schemaVersion: "cdsc.harness-manifest.v1", contractId: "cdsc.harness-manifest" });
  if (manifest.status !== "frozen") throw new TypeError("harness manifest must be frozen");
  assertRequiredProhibitions(manifest.prohibited_inferences);
  const semantic = requireObject(manifest.semantic, "harness semantic");
  requireDigest(semantic.parent_generation_id, "parent generation", "generation:sha256");
  requireDigest(semantic.harness_digest, "harness digest", "sha256");
  const sources = requireNonemptyArray(semantic.source_selectors, "source selectors");
  for (const source of sources) {
    requireString(source.path, "source path");
    if (!source.path.startsWith("projects/")) throw new TypeError("source path must be repository-relative");
    requireDigest(source.digest, "source digest", "sha256");
    for (const range of requireNonemptyArray(source.ranges, "source ranges")) {
      if (!Array.isArray(range) || range.length !== 2 || range.some((value) => !Number.isSafeInteger(value) || value < 1)) {
        throw new TypeError("invalid source range");
      }
    }
  }
  uniqueIds(requireNonemptyArray(semantic.baseline_vectors, "baseline vectors"), "vector_id", "baseline vector");
  assertUniqueStrings(semantic.observable_fields, "observable fields");
  const mutations = requireNonemptyArray(semantic.mutations, "mutations");
  const mutationIds = uniqueIds(mutations, "mutation_id", "mutation");
  if (mutations.length !== 2 || !mutationIds.has("M1") || !mutationIds.has("M2")) throw new TypeError("manifest requires M1 and M2");
  for (const mutation of mutations) {
    if (!new Set(["permitted", "breaking"]).has(mutation.kind)) throw new TypeError("unknown mutation kind");
    requireString(mutation.target, "mutation target");
    requireString(mutation.prediction, "mutation prediction");
    assertUniqueStrings(mutation.allowed_edit_surface, "allowed edit surface");
    assertUniqueStrings(mutation.vector_ids, "mutation vector ids");
    assertUniqueStrings(mutation.observables, "mutation observables");
    for (const condition of requireNonemptyArray(mutation.stop_conditions, "stop conditions")) requireString(condition, "stop condition");
  }
  return true;
}

export function validateObservationReceipt(receipt) {
  validateEnvelope(receipt, { schemaVersion: "cdsc.observation-receipt.v1", contractId: "cdsc.observation-receipt" });
  if (receipt.status !== "frozen") throw new TypeError("observation receipt must be frozen");
  assertRequiredProhibitions(receipt.prohibited_inferences);
  const semantic = requireObject(receipt.semantic, "observation semantic");
  if (!new Set(["M1", "M2"]).has(semantic.mutation_id)) throw new TypeError("unknown mutation id");
  requireDigest(semantic.manifest_handle, "manifest handle", "record:sha256");
  requireDigest(semantic.harness_handle, "harness handle", "sha256");
  requireDigest(semantic.baseline_witness_handle, "baseline witness handle", "record:sha256");
  uniqueIds(requireNonemptyArray(semantic.vector_results, "vector results"), "vector_id", "vector result");
  for (const result of semantic.vector_results) {
    requireObject(result.baseline, "baseline result");
    requireObject(result.mutant, "mutant result");
    if (!COMPARISON_STATES.has(result.comparison)) throw new TypeError("unknown comparison state");
  }
  if (!OBSERVATION_STATES.has(semantic.observation_state)) throw new TypeError("unknown observation state");
  requireString(semantic.predicted_consequence, "predicted consequence");
  requireString(semantic.observed_consequence, "observed consequence");
  for (const uncertainty of requireArray(semantic.uncertainty, "uncertainty")) requireString(uncertainty, "uncertainty");
  return true;
}

export function verifyProtectedGeneration(parentRoot, manifest) {
  requireString(parentRoot, "parent root");
  if (manifest?.schema_version !== "cdsc.protected-generation.v1") throw new TypeError("unsupported protected-generation manifest");
  requireDigest(manifest.generation_id, "protected generation id", "generation:sha256");
  for (const file of requireNonemptyArray(manifest.files, "protected files")) {
    requireString(file.path, "protected path");
    requireDigest(file.digest, "protected digest", "sha256");
    const bytes = readFileSync(new URL(file.path, directoryUrl(parentRoot)));
    const actual = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
    if (actual !== file.digest) throw new TypeError(`protected file drift: ${file.path}`);
  }
  for (const projection of requireNonemptyArray(manifest.projections, "protected projections")) {
    requireString(projection.path, "projection path");
    if (projection.selector !== "entries[0]") throw new TypeError("unsupported protected projection selector");
    requireDigest(projection.digest, "projection digest", "sha256");
    const document = JSON.parse(readFileSync(new URL(projection.path, directoryUrl(parentRoot)), "utf8"));
    if (!Array.isArray(document.entries) || document.entries.length === 0) throw new TypeError("missing protected index entry");
    const actual = sha256Canonical(document.entries[0]);
    if (actual !== projection.digest) throw new TypeError(`protected projection drift: ${projection.path}#${projection.selector}`);
  }
  return true;
}

function directoryUrl(path) {
  return new URL(`file://${path.endsWith("/") ? path : `${path}/`}`);
}

function assertRequiredProhibitions(values) {
  const set = new Set(requireNonemptyArray(values, "prohibited inferences"));
  for (const required of REQUIRED_PROHIBITIONS) if (!set.has(required)) throw new TypeError(`missing prohibited inference: ${required}`);
}

function uniqueIds(values, field, label) {
  const ids = new Set();
  for (const value of values) {
    requireObject(value, label);
    requireString(value[field], `${label} id`);
    if (ids.has(value[field])) throw new TypeError(`duplicate ${label} id`);
    ids.add(value[field]);
  }
  return ids;
}

function assertUniqueStrings(values, label) {
  for (const value of requireNonemptyArray(values, label)) requireString(value, label);
  if (new Set(values).size !== values.length) throw new TypeError(`${label} must be unique`);
}

function requireArray(value, label) {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  return value;
}

function requireNonemptyArray(value, label) {
  if (!Array.isArray(value) || value.length === 0) throw new TypeError(`${label} must be a non-empty array`);
  return value;
}

function requireObject(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value;
}

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} must be a non-empty string`);
}

function requireDigest(value, label, prefix) {
  requireString(value, label);
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!new RegExp(`^${escaped}:[a-f0-9]{64}$`).test(value)) throw new TypeError(`${label} has invalid format`);
}
