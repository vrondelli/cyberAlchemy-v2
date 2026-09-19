#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const POSTIMAGE_MARKER = `${path.sep}postimages${path.sep}`;
const markerIndex = SELF.indexOf(POSTIMAGE_MARKER);
const CANDIDATE_ROOT = markerIndex >= 0 ? SELF.slice(0, markerIndex) : null;
const REPOSITORY_ROOT = process.cwd();
const EVF = "projects/domainspec-v2/development/evolvable-validation-framework";
const FIXTURE_ROOT = `${EVF}/fixtures/BMC-REL-EMITS-CLOSURE-EVIDENCE`;

const TARGETS = [
  `${EVF}/contracts/emits-incoming-closure-evidence-envelope.v1.schema.json`,
  `${FIXTURE_ROOT}/valid-minimal-envelope.v1.json`,
  `${EVF}/contracts/emits-target-max-evaluation-receipt.v1.schema.json`,
  `${FIXTURE_ROOT}/pass-evaluation-receipt.v1.json`,
  `${FIXTURE_ROOT}/invalid-evaluation-receipt.v1.json`,
  `${FIXTURE_ROOT}/incomplete-evaluation-receipt.v1.json`,
  `${FIXTURE_ROOT}/error-evaluation-receipt.v1.json`,
  `${EVF}/contracts/closure-evidence-contract-manifest.v1.json`,
  `${EVF}/tools/validate-emits-closure-evidence-contracts.mjs`,
];

const SOURCES = {
  n43: "projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/design/continuations/N37-EMITS-TARGET-MAX-CLOSURE-PROOF-SHAPE/research/closure-evidence-ownership-r1/define/closure-evidence-contract-r1/design/representation-r1/continuations/N43-EMITS-CLOSURE-ENVELOPE-SCHEMA-PROPOSAL/schemas/emits-incoming-closure-evidence-envelope.candidate-v1.schema.json",
  n44: "projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/design/continuations/N37-EMITS-TARGET-MAX-CLOSURE-PROOF-SHAPE/research/closure-evidence-ownership-r1/define/closure-evidence-contract-r1/design/representation-r1/continuations/N44-EMITS-TARGET-MAX-EVALUATION-RECEIPT-SCHEMA-PROPOSAL/schemas/emits-target-max-evaluation-receipt.candidate-v1.schema.json",
};

const PROTECTED_REFS = {
  graph: {
    path: "projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/candidates/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json",
    sha256: "a9f659fc847f7cbfe87d7f68d02f0f996dcae9daa196275042a4e1b7ec9e62c0",
    size_bytes: 132533,
  },
  source_manifest: {
    path: "projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/schemas/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.schema.json",
    sha256: "d68616768f5018b1023481a6cb507f8fd1b4eb0df656b518bc101cd1315508e7",
    size_bytes: 16942,
  },
  relationship_registry: {
    path: "projects/domainspec-v2/definitions/relationships/relationships.yml",
    sha256: "82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1",
    size_bytes: 26867,
  },
  profile: {
    path: "projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/validators/validate-bmc-rel-001-decision-packet.mjs",
    sha256: "69681598b58529d64037335e6f47935cce769c79a95fc7140daa9f77dd74b975",
    size_bytes: 54148,
  },
};

const HOSTILE_CASES = [
  ["N01-envelope-additional-property", "envelope", "additional-property", "SCHEMA_INSTANCE_INVALID"],
  ["N02-envelope-authority-effect", "envelope", "authority-effect", "SCHEMA_INSTANCE_INVALID"],
  ["N03-envelope-outgoing-closure", "envelope", "outgoing-closure", "SCHEMA_INSTANCE_INVALID"],
  ["N04-envelope-membership-digest", "envelope", "membership-digest", "SEMANTIC_DIGEST_MISMATCH"],
  ["N05-envelope-placement-subset", "envelope", "placement-subset", "SEMANTIC_SUBSET_MISMATCH"],
  ["N06-receipt-additional-property", "receipt-pass", "additional-property", "SCHEMA_INSTANCE_INVALID"],
  ["N07-error-as-pass", "receipt-error", "result-pass", "SCHEMA_INSTANCE_INVALID"],
  ["N08-invalid-as-pass", "receipt-invalid", "result-pass", "SCHEMA_INSTANCE_INVALID"],
  ["N09-incomplete-as-pass", "receipt-incomplete", "result-pass", "SCHEMA_INSTANCE_INVALID"],
  ["N10-runtime-claim", "receipt-pass", "runtime-claim", "SCHEMA_INSTANCE_INVALID"],
  ["N11-semantic-result-digest", "receipt-pass", "semantic-digest", "SEMANTIC_DIGEST_MISMATCH"],
  ["N12-receipt-payload-digest", "receipt-pass", "payload-digest", "RECEIPT_PAYLOAD_DIGEST_MISMATCH"],
  ["N13-manifest-schema-digest", "manifest", "schema-digest", "MANIFEST_DIGEST_MISMATCH"],
  ["N14-manifest-duplicate-path", "manifest", "duplicate-path", "MANIFEST_INVENTORY_MISMATCH"],
  ["N15-mapping-drop-target", "mapping", "drop-target", "CANDIDATE_INVENTORY_MISMATCH"],
  ["N16-protected-ref-forgery", "receipt-pass", "protected-ref", "PROTECTED_REF_MISMATCH"],
].map(([id, target, mutation, expected_code]) => ({ id, target, mutation, expected_code }));

class Failure extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

function canonicalDigest(value) {
  return crypto.createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

function bytesRef(canonicalPath) {
  const bytes = fs.readFileSync(resolveCanonical(canonicalPath));
  return {
    path: canonicalPath,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    size_bytes: bytes.length,
  };
}

function clone(value) {
  return structuredClone(value);
}

function equal(left, right) {
  return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
}

function requireCondition(condition, code, message) {
  if (!condition) throw new Failure(code, message);
}

function loadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Failure("JSON_INVALID", `${filePath}: ${error.message}`);
  }
}

function resolveCanonical(canonicalPath) {
  return CANDIDATE_ROOT && TARGETS.includes(canonicalPath)
    ? path.join(CANDIDATE_ROOT, "postimages", canonicalPath)
    : path.join(REPOSITORY_ROOT, canonicalPath);
}

function validateWithDraft202012(schema, instances) {
  const program = String.raw`
import json, sys
from jsonschema import Draft202012Validator
from jsonschema.exceptions import SchemaError
payload = json.load(sys.stdin)
try:
    Draft202012Validator.check_schema(payload["schema"])
except SchemaError as error:
    print(json.dumps({"schema_valid": False, "detail": error.message, "instances": []}))
    raise SystemExit(0)
validator = Draft202012Validator(payload["schema"])
results = []
for instance in payload["instances"]:
    errors = sorted(validator.iter_errors(instance), key=lambda item: [str(part) for part in item.path])
    results.append({"valid": not errors, "detail": None if not errors else errors[0].message})
print(json.dumps({"schema_valid": True, "instances": results}, separators=(",", ":")))
`;
  const run = spawnSync("python3", ["-c", program], {
    cwd: REPOSITORY_ROOT,
    input: JSON.stringify({ schema, instances }),
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  requireCondition(run.status === 0, "DRAFT202012_RUNNER_FAILED", run.stderr || `python exited ${run.status}`);
  const report = JSON.parse(run.stdout);
  requireCondition(report.schema_valid, "SCHEMA_INVALID", report.detail || "Draft 2020-12 schema invalid");
  return report.instances;
}

function validateSchemaInstance(schema, instance) {
  const result = validateWithDraft202012(schema, [instance])[0];
  requireCondition(result.valid, "SCHEMA_INSTANCE_INVALID", result.detail || "instance invalid");
}

function validateSchemaEquivalence(source, postimage, kind) {
  const normalized = clone(postimage);
  if (kind === "n43") {
    requireCondition(postimage.$id === "https://domainspec.dev/schemas/evf/emits-incoming-closure-evidence-envelope/v1", "IDENTITY_MISMATCH", "N43 postimage $id mismatch");
    requireCondition(postimage.properties.schema_version.const === "evf.emits-incoming-closure-evidence-envelope/v1", "IDENTITY_MISMATCH", "N43 schema_version mismatch");
    normalized.$id = source.$id;
    normalized.title = source.title;
    normalized.description = source.description;
    normalized.properties.schema_version.const = source.properties.schema_version.const;
  } else {
    requireCondition(postimage.$id === "https://domainspec.dev/schemas/evf/emits-target-max-evaluation-receipt/v1", "IDENTITY_MISMATCH", "N44 postimage $id mismatch");
    requireCondition(postimage.properties.schema_version.const === "evf.emits-target-max-evaluation-receipt/v1", "IDENTITY_MISMATCH", "N44 schema_version mismatch");
    normalized.$id = source.$id;
    normalized.title = source.title;
    normalized.properties.schema_version.const = source.properties.schema_version.const;
  }
  requireCondition(equal(source, normalized), "SOURCE_SEMANTICS_DRIFT", `${kind} changed beyond approved identity fields`);
}

function validateEnvelopeSemantics(envelope) {
  for (const key of ["source_population", "source_placement", "target_population", "target_placement"]) {
    requireCondition(envelope[key].membership_digest === canonicalDigest(envelope[key].members), "SEMANTIC_DIGEST_MISMATCH", `${key} membership digest mismatch`);
    requireCondition(equal(envelope[key].members, [...envelope[key].members].sort()), "ORDERING_MISMATCH", `${key} members must be sorted`);
  }
  requireCondition(envelope.incoming_adjacency.fact_set_digest === canonicalDigest(envelope.incoming_adjacency.facts), "SEMANTIC_DIGEST_MISMATCH", "fact set digest mismatch");
  const sourcePopulation = new Set(envelope.source_population.members);
  const targetPopulation = new Set(envelope.target_population.members);
  requireCondition(envelope.source_placement.members.every((id) => sourcePopulation.has(id)), "SEMANTIC_SUBSET_MISMATCH", "source placement exceeds population");
  requireCondition(envelope.target_placement.members.every((id) => targetPopulation.has(id)), "SEMANTIC_SUBSET_MISMATCH", "target placement exceeds population");
  const placedSources = new Set(envelope.source_placement.members);
  const placedTargets = new Set(envelope.target_placement.members);
  const incoming = new Map();
  for (const fact of envelope.incoming_adjacency.facts) {
    requireCondition(placedSources.has(fact.source_entity_id) && placedTargets.has(fact.target_event_id), "FACT_OUTSIDE_PLACEMENT", "incoming fact falls outside declared placements");
    const sources = incoming.get(fact.target_event_id) || new Set();
    sources.add(fact.source_entity_id);
    incoming.set(fact.target_event_id, sources);
  }
  requireCondition([...incoming.values()].every((sources) => sources.size <= 1), "TARGET_MAX_VIOLATION", "positive envelope violates emits.target_max=1");
  const snapshotPayload = clone(envelope.snapshot);
  delete snapshotPayload.snapshot_digest;
  requireCondition(envelope.snapshot.snapshot_digest === canonicalDigest(snapshotPayload), "SEMANTIC_DIGEST_MISMATCH", "snapshot digest mismatch");
  const declarationPayload = {
    subject: envelope.subject,
    boundary: envelope.boundary,
    source_population: envelope.source_population,
    source_placement: envelope.source_placement,
    target_population: envelope.target_population,
    target_placement: envelope.target_placement,
    incoming_adjacency: envelope.incoming_adjacency,
    snapshot_digest: envelope.snapshot.snapshot_digest,
  };
  requireCondition(envelope.attestation.declaration_digest === canonicalDigest(declarationPayload), "SEMANTIC_DIGEST_MISMATCH", "attestation declaration digest mismatch");
}

function derivedReceiptResult(summary) {
  if (summary.binding_errors.length) return ["error", "none"];
  if (summary.duplicate_fact_ids.length || summary.target_max_violations.length) return ["invalid", "refuted-for-bound-snapshot"];
  if (summary.missing_closure_components.length) return ["not-evaluated-incomplete-closure", "none"];
  return ["pass", "established-for-bound-snapshot"];
}

function validateProtectedRefs(receipt) {
  for (const [key, expected] of Object.entries(PROTECTED_REFS)) {
    requireCondition(equal(receipt.inputs[key], expected), "PROTECTED_REF_MISMATCH", `${key} exact ref mismatch`);
    requireCondition(equal(bytesRef(expected.path), expected), "PROTECTED_SOURCE_DRIFT", `${key} protected source bytes drifted`);
  }
}

function validateReceiptSemantics(receipt) {
  requireCondition(equal(receipt.receipt_schema, bytesRef(TARGETS[2])), "RECEIPT_SCHEMA_REF_MISMATCH", "receipt schema ref mismatch");
  requireCondition(equal(receipt.inputs.closure_envelope, bytesRef(TARGETS[1])), "CLOSURE_ENVELOPE_REF_MISMATCH", "closure envelope ref mismatch");
  requireCondition(receipt.evaluator.sha256 === bytesRef(TARGETS[8]).sha256, "EVALUATOR_IDENTITY_MISMATCH", "evaluator digest mismatch");
  validateProtectedRefs(receipt);
  const [expectedResult, expectedClaim] = derivedReceiptResult(receipt.evaluation_summary);
  requireCondition(receipt.result === expectedResult && receipt.claim_ceiling.property_claim === expectedClaim, "RESULT_PRECEDENCE_MISMATCH", "error-invalid-incomplete-pass precedence mismatch");
  const precedence = { EMITS_INPUT_BINDING_ERROR: 1, EMITS_DUPLICATE_AUTHORED_FACT: 2, EMITS_TARGET_MAX_VIOLATION: 3, EMITS_INCOMPLETE_CLOSURE: 4, EMITS_EVALUATOR_ERROR: 5 };
  const expectedDiagnosticCodes = [];
  if (receipt.evaluation_summary.binding_errors.length) expectedDiagnosticCodes.push("EMITS_INPUT_BINDING_ERROR");
  if (receipt.evaluation_summary.duplicate_fact_ids.length) expectedDiagnosticCodes.push("EMITS_DUPLICATE_AUTHORED_FACT");
  if (receipt.evaluation_summary.target_max_violations.length) expectedDiagnosticCodes.push("EMITS_TARGET_MAX_VIOLATION");
  if (receipt.evaluation_summary.missing_closure_components.length) expectedDiagnosticCodes.push("EMITS_INCOMPLETE_CLOSURE");
  requireCondition(equal(receipt.diagnostics.map((item) => item.code), expectedDiagnosticCodes), "DIAGNOSTIC_COVERAGE_MISMATCH", "diagnostic coverage does not match the evaluation summary");
  requireCondition(receipt.diagnostics.every((item) => item.precedence === precedence[item.code]), "DIAGNOSTIC_PRECEDENCE_MISMATCH", "diagnostic precedence mismatch");
  requireCondition(receipt.diagnostics.every((item, index, items) => index === 0 || items[index - 1].precedence <= item.precedence), "DIAGNOSTIC_PRECEDENCE_MISMATCH", "diagnostics not ordered by precedence");
  const semanticPayload = { evaluation_summary: receipt.evaluation_summary, result: receipt.result, property_claim: receipt.claim_ceiling.property_claim };
  requireCondition(receipt.semantic_result_digest === canonicalDigest(semanticPayload), "SEMANTIC_DIGEST_MISMATCH", "semantic result digest mismatch");
  const payload = clone(receipt);
  delete payload.receipt_payload_digest;
  requireCondition(receipt.receipt_payload_digest === canonicalDigest(payload), "RECEIPT_PAYLOAD_DIGEST_MISMATCH", "receipt payload digest mismatch");
}

function validateContractManifest(manifest) {
  requireCondition(manifest.schema_version === "evf.closure-evidence-contract-manifest/v1" && manifest.authority_effect === "none", "MANIFEST_IDENTITY_MISMATCH", "manifest identity or authority mismatch");
  requireCondition(Array.isArray(manifest.contracts) && manifest.contracts.length === 2, "MANIFEST_INVENTORY_MISMATCH", "manifest must contain two contracts");
  const expectedPaths = [TARGETS[0], TARGETS[2]];
  requireCondition(equal(manifest.contracts.map((entry) => entry.path), expectedPaths), "MANIFEST_INVENTORY_MISMATCH", "manifest paths/order mismatch");
  requireCondition(new Set(manifest.contracts.map((entry) => entry.path)).size === 2, "MANIFEST_INVENTORY_MISMATCH", "manifest paths are not unique");
  for (const entry of manifest.contracts) {
    requireCondition(equal({ path: entry.path, sha256: entry.sha256, size_bytes: entry.size_bytes }, bytesRef(entry.path)), "MANIFEST_DIGEST_MISMATCH", `${entry.path} digest mismatch`);
    requireCondition(entry.compatibility_version === "v1" && entry.authority_effect === "none" && entry.lifecycle_owner === "EVF evidence-chain lifecycle owner" && entry.semantic_boundary_owner === "relationship-validation contract owner", "MANIFEST_OWNERSHIP_MISMATCH", `${entry.path} ownership/compatibility mismatch`);
  }
}

function validateCandidateMapping(mapping, checkBytes = true) {
  requireCondition(mapping.schema_version === "invoke.staged-candidate-mapping-manifest/v1" && mapping.authority_effect === "none", "CANDIDATE_INVENTORY_MISMATCH", "mapping identity/authority mismatch");
  requireCondition(Array.isArray(mapping.targets) && mapping.targets.length === 9, "CANDIDATE_INVENTORY_MISMATCH", "mapping must contain exactly nine targets");
  requireCondition(equal(mapping.targets.map((entry) => entry.target_path), TARGETS), "CANDIDATE_INVENTORY_MISMATCH", "mapping target order/denominator mismatch");
  requireCondition(new Set(mapping.targets.map((entry) => entry.target_path)).size === 9, "CANDIDATE_INVENTORY_MISMATCH", "mapping targets are not unique");
  if (checkBytes) {
    for (const entry of mapping.targets) {
      requireCondition(entry.baseline_state === "absent", "CANDIDATE_BASELINE_MISMATCH", `${entry.target_path} baseline must be absent`);
      requireCondition(!fs.existsSync(path.join(REPOSITORY_ROOT, entry.target_path)), "CANDIDATE_BASELINE_MISMATCH", `${entry.target_path} exists in live repository`);
      requireCondition(equal({ path: entry.target_path, sha256: entry.sha256, size_bytes: entry.size_bytes }, bytesRef(entry.target_path)), "CANDIDATE_POSTIMAGE_DIGEST_MISMATCH", `${entry.target_path} postimage mismatch`);
    }
  }
}

function mutate(caseDef, docs) {
  const document = clone(docs[caseDef.target]);
  switch (caseDef.mutation) {
    case "additional-property": document.forbidden = true; break;
    case "authority-effect": document.authority_effect = "admit"; break;
    case "outgoing-closure": document.incoming_adjacency.outgoing_closure = "closed"; break;
    case "membership-digest": document.source_population.membership_digest = "0".repeat(64); break;
    case "placement-subset": document.source_placement.members.push("entity.outside"); document.source_placement.members.sort(); document.source_placement.membership_digest = canonicalDigest(document.source_placement.members); break;
    case "result-pass": document.result = "pass"; break;
    case "runtime-claim": document.claim_ceiling.runtime_claim = true; break;
    case "semantic-digest": document.semantic_result_digest = "0".repeat(64); break;
    case "payload-digest": document.receipt_payload_digest = "0".repeat(64); break;
    case "schema-digest": document.contracts[0].sha256 = "0".repeat(64); break;
    case "duplicate-path": document.contracts[1].path = document.contracts[0].path; break;
    case "drop-target": document.targets.pop(); break;
    case "protected-ref": document.inputs.relationship_registry.sha256 = "0".repeat(64); break;
    default: throw new Failure("SELF_TEST_CONFIGURATION_INVALID", `unknown mutation ${caseDef.mutation}`);
  }
  return document;
}

function expectFailure(caseDef, docs, envelopeSchema, receiptSchema) {
  const mutated = mutate(caseDef, docs);
  let observed = null;
  try {
    if (caseDef.target === "envelope") {
      validateSchemaInstance(envelopeSchema, mutated);
      validateEnvelopeSemantics(mutated);
    } else if (caseDef.target.startsWith("receipt")) {
      validateSchemaInstance(receiptSchema, mutated);
      validateReceiptSemantics(mutated);
    } else if (caseDef.target === "manifest") {
      validateContractManifest(mutated);
    } else {
      validateCandidateMapping(mutated, false);
    }
  } catch (error) {
    observed = error instanceof Failure ? error.code : "UNEXPECTED_ERROR";
  }
  requireCondition(observed === caseDef.expected_code, "HOSTILE_EXPECTATION_MISMATCH", `${caseDef.id}: expected ${caseDef.expected_code}, observed ${observed}`);
}

function main() {
  const envelopeSchema = loadJson(resolveCanonical(TARGETS[0]));
  const envelope = loadJson(resolveCanonical(TARGETS[1]));
  const receiptSchema = loadJson(resolveCanonical(TARGETS[2]));
  const receipts = {
    "receipt-pass": loadJson(resolveCanonical(TARGETS[3])),
    "receipt-invalid": loadJson(resolveCanonical(TARGETS[4])),
    "receipt-incomplete": loadJson(resolveCanonical(TARGETS[5])),
    "receipt-error": loadJson(resolveCanonical(TARGETS[6])),
  };
  const manifest = loadJson(resolveCanonical(TARGETS[7]));
  const mapping = CANDIDATE_ROOT
    ? loadJson(path.join(CANDIDATE_ROOT, "CANDIDATE-MAPPING-MANIFEST.json"))
    : { schema_version: "invoke.staged-candidate-mapping-manifest/v1", authority_effect: "none", targets: TARGETS.map((target_path) => ({ target_path })) };

  validateSchemaEquivalence(loadJson(path.join(REPOSITORY_ROOT, SOURCES.n43)), envelopeSchema, "n43");
  validateSchemaEquivalence(loadJson(path.join(REPOSITORY_ROOT, SOURCES.n44)), receiptSchema, "n44");
  validateSchemaInstance(envelopeSchema, envelope);
  validateEnvelopeSemantics(envelope);
  for (const receipt of Object.values(receipts)) {
    validateSchemaInstance(receiptSchema, receipt);
    validateReceiptSemantics(receipt);
  }
  validateContractManifest(manifest);
  validateCandidateMapping(mapping, Boolean(CANDIDATE_ROOT));

  let hostile = null;
  if (process.argv.includes("--self-test")) {
    const docs = { envelope, ...receipts, manifest, mapping };
    if (CANDIDATE_ROOT) {
      const declared = loadJson(path.join(CANDIDATE_ROOT, "hostile", "hostile-probes.v1.json"));
      requireCondition(declared.schema_version === "evf.emits-closure-evidence-hostile-probes/v1" && equal(declared.cases, HOSTILE_CASES), "SELF_TEST_CONFIGURATION_INVALID", "hostile probe bundle drifted from validator denominator");
    }
    for (const caseDef of HOSTILE_CASES) expectFailure(caseDef, docs, envelopeSchema, receiptSchema);
    hostile = { verdict: "pass", passed: HOSTILE_CASES.length, failed: 0 };
  }

  return {
    schema_version: "evf.emits-closure-evidence-validation-result/v1",
    verdict: "pass",
    mode: process.argv.includes("--self-test") ? "positive-and-hostile" : "positive",
    target_count: 9,
    schema_count: 2,
    fixture_count: 5,
    result_precedence: ["error", "invalid", "not-evaluated-incomplete-closure", "pass"],
    hostile,
    canonical_targets_mutated: false,
    authority_effect: "none",
    claim_ceiling: "contract-shape-and-digest-chain-evidence-only",
  };
}

try {
  process.stdout.write(`${JSON.stringify(main(), null, 2)}\n`);
} catch (error) {
  const code = error instanceof Failure ? error.code : "UNEXPECTED_ERROR";
  process.stderr.write(`${JSON.stringify({ verdict: "block", code, detail: error.message })}\n`);
  process.exitCode = 1;
}
