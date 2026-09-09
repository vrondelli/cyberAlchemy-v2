#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const SEMANTIC_FIELDS = [
  "source",
  "purpose",
  "scope",
  "constraints",
  "target_pressure",
  "current_output_hypothesis",
  "revision_route"
];
const POSTURES = new Set(["declared", "inferred", "unresolved"]);
const ASSIGNMENTS = new Set(["population", "holdout"]);
const STRATA = new Set(["dispatch", "craft", "invoke-work-pack"]);
const OBSERVATION_KINDS = new Set([
  "field_ambiguity",
  "field_overlap",
  "replacement_risk",
  "source_granularity",
  "envelope_redundancy",
  "missing_semantics",
  "other"
]);
const SEVERITIES = new Set(["info", "flag", "block"]);
const ACTIONS = new Set(["retain", "revise", "split", "reject", "unresolved"]);
const ROW_KEYS = [
  "run_id",
  "sample_id",
  "assignment",
  "stratum",
  "source_lock",
  "intent_record",
  "observations",
  "candidate_field_actions",
  "validator_status"
];

function usage() {
  process.stderr.write("usage: node validate-run.mjs --schema <run-row-schema> [--manifest <manifest.json>] [--repo-root <path>] <records.jsonl>\n");
}

function parseArgs(argv) {
  const result = { schema: null, manifest: null, repoRoot: process.cwd(), rows: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--schema") result.schema = argv[++i];
    else if (arg === "--manifest") result.manifest = argv[++i];
    else if (arg === "--repo-root") result.repoRoot = argv[++i];
    else if (!arg.startsWith("-") && result.rows === null) result.rows = arg;
    else throw new Error(`unknown or duplicate argument: ${arg}`);
  }
  if (!result.schema || !result.rows) throw new Error("--schema and one JSONL path are required");
  return result;
}

function sha256(input) {
  return createHash("sha256").update(input).digest("hex");
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function exactKeys(value, required) {
  if (!isObject(value)) return { missing: required, extra: [] };
  const keys = Object.keys(value);
  return {
    missing: required.filter((key) => !keys.includes(key)),
    extra: keys.filter((key) => !required.includes(key))
  };
}

function uniqueStrings(value, { min = 0 } = {}) {
  return Array.isArray(value) && value.length >= min && value.every(nonEmptyString) && new Set(value).size === value.length;
}

function validateFieldValue(value, path, errors, context) {
  const shape = exactKeys(value, ["posture", "value", "evidence_refs", "inference_note"]);
  if (!isObject(value) || shape.missing.length || shape.extra.length) {
    errors.push({ rule_id: "INT-003", path, message: `FieldValue requires exact keys; missing=${shape.missing.join(",") || "none"}; extra=${shape.extra.join(",") || "none"}` });
    return;
  }
  if (!POSTURES.has(value.posture)) {
    errors.push({ rule_id: "INT-003", path: `${path}.posture`, message: "posture must be declared, inferred, or unresolved" });
    return;
  }
  if (!uniqueStrings(value.evidence_refs)) {
    errors.push({ rule_id: "INT-004", path: `${path}.evidence_refs`, message: "evidence_refs must be unique non-empty strings" });
  }
  if (value.posture === "declared") {
    if (value.value === null) errors.push({ rule_id: "INT-004", path: `${path}.value`, message: "declared value cannot be null" });
    if (!Array.isArray(value.evidence_refs) || value.evidence_refs.length < 1) errors.push({ rule_id: "INT-004", path: `${path}.evidence_refs`, message: "declared value requires evidence" });
    if (value.inference_note !== null) errors.push({ rule_id: "INT-005", path: `${path}.inference_note`, message: "declared value must not carry an inference note" });
  } else if (value.posture === "inferred") {
    if (value.value === null) errors.push({ rule_id: "INT-004", path: `${path}.value`, message: "inferred value cannot be null" });
    if (!Array.isArray(value.evidence_refs) || value.evidence_refs.length < 1) errors.push({ rule_id: "INT-004", path: `${path}.evidence_refs`, message: "inferred value requires evidence" });
    if (!nonEmptyString(value.inference_note)) errors.push({ rule_id: "INT-005", path: `${path}.inference_note`, message: "inferred value requires a falsifiable note" });
  } else {
    if (value.value !== null || value.inference_note !== null || !Array.isArray(value.evidence_refs) || value.evidence_refs.length !== 0) {
      errors.push({ rule_id: "INT-006", path, message: "unresolved requires null value, empty evidence_refs, and null inference_note" });
    }
  }
  for (const evidenceRef of value.evidence_refs ?? []) {
    if (context.manifestSample && evidenceRef !== context.manifestSample.selector && !evidenceRef.startsWith(`${context.manifestSample.sample_id}:`)) {
      errors.push({ rule_id: "INT-007", path: `${path}.evidence_refs`, message: `evidence ref must use the manifest selector or ${context.manifestSample.sample_id}: prefix` });
    }
  }
}

function validateIntentRecord(record, path, errors, context) {
  const keys = ["intent_id", "record_schema", "record_status", "raw_intent", "intent", "revision_history"];
  const shape = exactKeys(record, keys);
  if (!isObject(record) || shape.missing.length || shape.extra.length) {
    errors.push({ rule_id: "INT-001", path, message: `intent record requires exact keys; missing=${shape.missing.join(",") || "none"}; extra=${shape.extra.join(",") || "none"}` });
    return;
  }
  if (!/^INTENT-[A-Z0-9-]+$/.test(record.intent_id ?? "") || record.record_schema !== "intent-record.candidate@1" || !["candidate", "selected-local", "superseded"].includes(record.record_status)) {
    errors.push({ rule_id: "INT-001", path, message: "invalid intent identity, schema handle, or record status" });
  }
  const rawShape = exactKeys(record.raw_intent, ["text_or_ref", "source_ref", "captured_at"]);
  if (!isObject(record.raw_intent) || rawShape.missing.length || rawShape.extra.length || !nonEmptyString(record.raw_intent.text_or_ref) || !nonEmptyString(record.raw_intent.source_ref) || Number.isNaN(Date.parse(record.raw_intent.captured_at))) {
    errors.push({ rule_id: "INT-001", path: `${path}.raw_intent`, message: "raw_intent requires text/ref, source ref, and an ISO-compatible timestamp" });
  }
  const intentShape = exactKeys(record.intent, SEMANTIC_FIELDS);
  if (!isObject(record.intent) || intentShape.missing.length || intentShape.extra.length) {
    errors.push({ rule_id: "INT-002", path: `${path}.intent`, message: `all seven and only seven semantic fields are required; missing=${intentShape.missing.join(",") || "none"}; extra=${intentShape.extra.join(",") || "none"}` });
  }
  if (isObject(record.intent)) {
    for (const field of SEMANTIC_FIELDS) {
      if (Object.hasOwn(record.intent, field)) validateFieldValue(record.intent[field], `${path}.intent.${field}`, errors, context);
    }
  }
  if (!Array.isArray(record.revision_history)) {
    errors.push({ rule_id: "INT-008", path: `${path}.revision_history`, message: "revision_history must be an array" });
  } else {
    record.revision_history.forEach((revision, index) => {
      const revisionPath = `${path}.revision_history[${index}]`;
      const revisionShape = exactKeys(revision, ["revision_id", "changed_fields", "reason", "evidence_refs", "owner_route"]);
      if (!isObject(revision) || revisionShape.missing.length || revisionShape.extra.length || !nonEmptyString(revision.revision_id) || !uniqueStrings(revision.changed_fields, { min: 1 }) || !nonEmptyString(revision.reason) || !uniqueStrings(revision.evidence_refs, { min: 1 }) || !nonEmptyString(revision.owner_route)) {
        errors.push({ rule_id: "INT-008", path: revisionPath, message: "revision requires exact populated identity, fields, reason, evidence, and owner route" });
      }
    });
  }
}

function validateObservation(observation, path, errors) {
  const shape = exactKeys(observation, ["kind", "fields", "evidence_refs", "severity", "note"]);
  if (!isObject(observation) || shape.missing.length || shape.extra.length || !OBSERVATION_KINDS.has(observation.kind) || !uniqueStrings(observation.fields) || !uniqueStrings(observation.evidence_refs) || !SEVERITIES.has(observation.severity) || !nonEmptyString(observation.note)) {
    errors.push({ rule_id: "OBS-001", path, message: "invalid registered observation shape" });
  }
}

function validateCandidateAction(action, path, errors) {
  const shape = exactKeys(action, ["field", "action", "rationale", "owner_decision"]);
  if (!isObject(action) || shape.missing.length || shape.extra.length || !nonEmptyString(action.field) || !ACTIONS.has(action.action) || !nonEmptyString(action.rationale) || action.owner_decision !== "pending") {
    errors.push({ rule_id: "ACT-001", path, message: "candidate action must remain populated and owner_decision=pending" });
  }
}

function validateRow(row, rowNumber, manifestById) {
  const errors = [];
  const path = `$[row:${rowNumber}]`;
  const shape = exactKeys(row, ROW_KEYS);
  if (!isObject(row) || shape.missing.length || shape.extra.length) {
    errors.push({ rule_id: "ROW-002", path, message: `row requires exact keys; missing=${shape.missing.join(",") || "none"}; extra=${shape.extra.join(",") || "none"}` });
    return errors;
  }
  if (!/^\d{4}-\d{2}-\d{2}-intent-schema-\d{2}$/.test(row.run_id ?? "") || !/^SAMPLE-[A-Z0-9-]+$/.test(row.sample_id ?? "") || !ASSIGNMENTS.has(row.assignment) || !STRATA.has(row.stratum) || row.validator_status !== "pending") {
    errors.push({ rule_id: "ROW-010", path, message: "invalid run/sample identity, assignment, stratum, or validator_status" });
  }
  const lockShape = exactKeys(row.source_lock, ["source_path", "selector", "source_sha256", "selected_text_sha256"]);
  if (!isObject(row.source_lock) || lockShape.missing.length || lockShape.extra.length || !nonEmptyString(row.source_lock.source_path) || !nonEmptyString(row.source_lock.selector) || !/^[a-f0-9]{64}$/.test(row.source_lock.source_sha256 ?? "") || !/^[a-f0-9]{64}$/.test(row.source_lock.selected_text_sha256 ?? "")) {
    errors.push({ rule_id: "ROW-020", path: `${path}.source_lock`, message: "invalid source lock" });
  }
  const manifestSample = manifestById?.get(row.sample_id) ?? null;
  if (manifestById && !manifestSample) {
    errors.push({ rule_id: "MANIFEST-004", path: `${path}.sample_id`, message: "sample missing from manifest" });
  } else if (manifestSample) {
    for (const key of ["assignment", "stratum"]) {
      if (row[key] !== manifestSample[key]) errors.push({ rule_id: "MANIFEST-005", path: `${path}.${key}`, message: `row ${key} differs from manifest` });
    }
    for (const key of ["source_path", "selector", "source_sha256", "selected_text_sha256"]) {
      if (row.source_lock[key] !== manifestSample[key]) errors.push({ rule_id: "MANIFEST-005", path: `${path}.source_lock.${key}`, message: `source lock ${key} differs from manifest` });
    }
  }
  validateIntentRecord(row.intent_record, `${path}.intent_record`, errors, { manifestSample });
  if (!Array.isArray(row.observations)) errors.push({ rule_id: "OBS-001", path: `${path}.observations`, message: "observations must be an array" });
  else row.observations.forEach((observation, index) => validateObservation(observation, `${path}.observations[${index}]`, errors));
  if (!Array.isArray(row.candidate_field_actions)) errors.push({ rule_id: "ACT-001", path: `${path}.candidate_field_actions`, message: "candidate_field_actions must be an array" });
  else row.candidate_field_actions.forEach((action, index) => validateCandidateAction(action, `${path}.candidate_field_actions[${index}]`, errors));
  return errors;
}

function loadManifest(path, repoRoot, errors) {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(resolve(path), "utf8"));
  } catch (error) {
    errors.push({ rule_id: "MANIFEST-001", path: "$manifest", message: error.message });
    return { manifest: null, manifestById: null };
  }
  if (!isObject(manifest) || !nonEmptyString(manifest.run_id) || !Array.isArray(manifest.samples)) {
    errors.push({ rule_id: "MANIFEST-001", path: "$manifest", message: "manifest requires run_id and samples" });
    return { manifest, manifestById: null };
  }
  const ids = manifest.samples.map((sample) => sample.sample_id);
  if (ids.length !== 15 || new Set(ids).size !== 15) errors.push({ rule_id: "MANIFEST-002", path: "$manifest.samples", message: "manifest requires exactly 15 unique samples" });
  const population = manifest.samples.filter((sample) => sample.assignment === "population");
  const holdout = manifest.samples.filter((sample) => sample.assignment === "holdout");
  if (population.length !== 12 || holdout.length !== 3 || new Set(holdout.map((sample) => sample.stratum)).size < 2) {
    errors.push({ rule_id: "MANIFEST-003", path: "$manifest.samples", message: "manifest requires 12 population, 3 holdout, and at least 2 holdout strata" });
  }
  for (const sample of manifest.samples) {
    const required = ["sample_id", "assignment", "stratum", "source_path", "selector", "source_sha256", "selected_text", "selected_text_sha256", "inclusion_reason"];
    const shape = exactKeys(sample, required);
    if (!isObject(sample) || shape.missing.length || shape.extra.length || !ASSIGNMENTS.has(sample.assignment) || !STRATA.has(sample.stratum) || !nonEmptyString(sample.source_path) || !nonEmptyString(sample.selector) || !nonEmptyString(sample.selected_text) || !nonEmptyString(sample.inclusion_reason)) {
      errors.push({ rule_id: "MANIFEST-001", path: `$manifest.samples.${sample.sample_id ?? "unknown"}`, message: "invalid manifest sample shape" });
      continue;
    }
    const sourcePath = resolve(repoRoot, sample.source_path);
    if (!existsSync(sourcePath)) {
      errors.push({ rule_id: "MANIFEST-006", path: `$manifest.samples.${sample.sample_id}.source_path`, message: "source file does not exist" });
      continue;
    }
    const sourceBytes = readFileSync(sourcePath);
    if (sha256(sourceBytes) !== sample.source_sha256 || sha256(sample.selected_text) !== sample.selected_text_sha256 || !sourceBytes.toString("utf8").includes(sample.selected_text)) {
      errors.push({ rule_id: "MANIFEST-006", path: `$manifest.samples.${sample.sample_id}`, message: "source or selected-text lock mismatch" });
    }
  }
  return { manifest, manifestById: new Map(manifest.samples.map((sample) => [sample.sample_id, sample])) };
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    usage();
    process.stderr.write(`${error.message}\n`);
    process.exit(2);
  }
  const errors = [];
  let schema;
  let schemaBytes = null;
  let intentSchema = null;
  let intentSchemaPath = null;
  let intentSchemaBytes = null;
  try {
    const schemaPath = resolve(args.schema);
    schemaBytes = readFileSync(schemaPath);
    schema = JSON.parse(schemaBytes.toString("utf8"));
    const intentSchemaRef = schema?.properties?.intent_record?.$ref;
    if (!nonEmptyString(intentSchemaRef) || intentSchemaRef.includes("#")) {
      errors.push({ rule_id: "SCHEMA-003", path: "$schema.properties.intent_record.$ref", message: "run-row schema must name one sibling candidate intent-record schema" });
    } else {
      intentSchemaPath = resolve(dirname(schemaPath), intentSchemaRef);
      intentSchemaBytes = readFileSync(intentSchemaPath);
      intentSchema = JSON.parse(intentSchemaBytes.toString("utf8"));
    }
  } catch (error) {
    errors.push({ rule_id: "SCHEMA-001", path: "$schema", message: error.message });
  }
  if (schema && schema.$id !== "cav2.intent-schema.run-row@1") {
    errors.push({ rule_id: "SCHEMA-002", path: "$schema.$id", message: "unexpected run-row schema ID" });
  }
  if (intentSchema && intentSchema.$id !== "cav2.intent-record.candidate@1") {
    errors.push({ rule_id: "SCHEMA-004", path: "$intentSchema.$id", message: "unexpected candidate intent-record schema ID" });
  }
  let manifest = null;
  let manifestById = null;
  if (args.manifest) ({ manifest, manifestById } = loadManifest(args.manifest, resolve(args.repoRoot), errors));
  const rows = [];
  try {
    const lines = readFileSync(resolve(args.rows), "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      if (!line.trim()) return;
      try {
        rows.push({ rowNumber: index + 1, value: JSON.parse(line) });
      } catch (error) {
        errors.push({ rule_id: "ROW-001", path: `$[row:${index + 1}]`, message: error.message });
      }
    });
  } catch (error) {
    errors.push({ rule_id: "ROW-001", path: "$rows", message: error.message });
  }
  const seen = new Set();
  for (const row of rows) {
    errors.push(...validateRow(row.value, row.rowNumber, manifestById));
    if (seen.has(row.value.sample_id)) errors.push({ rule_id: "ROW-030", path: `$[row:${row.rowNumber}].sample_id`, message: "duplicate sample_id" });
    seen.add(row.value.sample_id);
    if (manifest && row.value.run_id !== manifest.run_id) errors.push({ rule_id: "MANIFEST-005", path: `$[row:${row.rowNumber}].run_id`, message: "row run_id differs from manifest" });
  }
  if (manifestById && (seen.size !== manifestById.size || [...manifestById.keys()].some((id) => !seen.has(id)))) {
    errors.push({ rule_id: "MANIFEST-004", path: "$rows", message: "rows must cover every manifest sample exactly once" });
  }
  const report = {
    validator: "intent-schema-run-validator@1",
    status: errors.length ? "fail" : "pass",
    evidence_boundary: "shape-and-declared-invariant-conformance-only; not-live-empirical-evidence",
    schema_id: schema?.$id ?? null,
    schema_sha256: schemaBytes ? sha256(schemaBytes) : null,
    intent_schema_id: intentSchema?.$id ?? null,
    intent_schema_path: intentSchemaPath,
    intent_schema_sha256: intentSchemaBytes ? sha256(intentSchemaBytes) : null,
    manifest: args.manifest,
    row_file: args.rows,
    rows_parsed: rows.length,
    errors
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exit(errors.length ? 1 : 0);
}

main();
