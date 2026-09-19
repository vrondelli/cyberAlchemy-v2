#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const repo = process.cwd();
const root = resolve(repo, "projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/design/continuations/N37-EMITS-TARGET-MAX-CLOSURE-PROOF-SHAPE/research/closure-evidence-ownership-r1/define/closure-evidence-contract-r1/design/representation-r1/continuations/N43-EMITS-CLOSURE-ENVELOPE-SCHEMA-PROPOSAL");
const json = (path) => JSON.parse(readFileSync(path, "utf8"));
const text = (path) => readFileSync(path, "utf8");
const digest = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const canonicalDigest = (value) => createHash("sha256").update(JSON.stringify(value, Object.keys(value).sort())).digest("hex");
const deepCanonical = (value) => Array.isArray(value)
  ? value.map(deepCanonical)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, deepCanonical(value[key])]))
    : value;
const stableDigest = (value) => createHash("sha256").update(JSON.stringify(deepCanonical(value))).digest("hex");
const clone = (value) => JSON.parse(JSON.stringify(value));
const sha = /^[a-f0-9]{64}$/;
let checks = 0;
const assert = (condition, message) => {
  checks += 1;
  if (!condition) throw new Error(message);
};
const exactKeys = (value, keys, label) => {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assert(JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort()), `${label} key drift`);
};
const nonempty = (value, label) => assert(typeof value === "string" && value.length > 0, `${label} must be nonempty`);
const sha256 = (value, label) => assert(typeof value === "string" && sha.test(value), `${label} must be sha256`);

const manifest = json(resolve(root, "DESIGN-SCOPE-MANIFEST.json"));
const manifestMaterial = { ...manifest };
delete manifestMaterial.input_digest;
assert(stableDigest(manifestMaterial) === manifest.input_digest, "manifest input digest drift");
assert(manifest.authored_by !== "invoke-design-scope-extractor", "manifest self-issued");
assert(manifest.target_footprint.inclusions.length === 10, "source count drift");
for (const item of manifest.target_footprint.inclusions) {
  const path = resolve(repo, item.path);
  assert(existsSync(path), `missing source ${item.selector}`);
  assert(digest(path) === item.digest, `source drift ${item.selector}`);
}

const denominator = json(resolve(root, "DESIGN-DENOMINATOR-RECEIPT.json"));
const denominatorMaterial = { ...denominator };
delete denominatorMaterial.receipt_digest;
assert(stableDigest(denominatorMaterial) === denominator.receipt_digest, "denominator digest drift");
assert(denominator.verdict === "pass", "denominator must pass");
assert(denominator.missing_detector_inputs.length === 0, "missing detector input");
assert(denominator.unbound_signal_ids.length === 0, "unbound signal");

const selection = json(resolve(root, "DESIGN-SELECTION-RESULT.json"));
const selectionMaterial = { ...selection };
delete selectionMaterial.result_digest;
assert(stableDigest(selectionMaterial) === selection.result_digest, "selection digest drift");
assert(selection.verdict === "pass" && selection.fixed_point === true, "selection must pass fixed point");
assert(selection.pass_1_digest === selection.pass_2_digest, "selection pass drift");
assert(JSON.stringify(selection.selected_outputs) === JSON.stringify(["architecture", "architecture:integration-versioning", "validation-contracts"]), "selected outputs drift");

const n42 = json(resolve(repo, manifest.target_footprint.roots[0].path));
assert(n42.selection.response === "A", "N42 response drift");
assert(n42.selection.selected_option_id === "BMC-REL-NONNUMERIC-42-A-INLINE-EXACT-PAYLOAD-SETS", "N42 selection drift");
assert(n42.authorization_boundary.repository_authority_effect === "none", "N42 authority drift");

const schema = json(resolve(root, "schemas/emits-incoming-closure-evidence-envelope.candidate-v1.schema.json"));
assert(schema.$schema === "https://json-schema.org/draft/2020-12/schema", "schema dialect drift");
assert(schema.$id.includes("candidate-v1"), "candidate schema id drift");
assert(schema.additionalProperties === false, "top-level schema must be closed");
assert(schema.properties.authority_effect.const === "none", "schema authority ceiling drift");
assert(schema.$defs.exact_id_set.properties.members.uniqueItems === true, "exact ID set uniqueness missing");
assert(!Object.hasOwn(schema.$defs.exact_id_set.properties.members, "minItems"), "positive population minimum inferred");
assert(schema.$defs.exact_emits_fact_set.properties.facts.uniqueItems === true, "fact set uniqueness missing");
assert(!Object.hasOwn(schema.$defs.exact_emits_fact_set.properties.facts, "minItems"), "positive fact minimum inferred");
const walkSchema = (value) => {
  if (!value || typeof value !== "object") return;
  if (value.type === "object") assert(value.additionalProperties === false, "object schema is not closed");
  for (const child of Object.values(value)) walkSchema(child);
};
walkSchema(schema);

const validateBoundRef = (value, label) => {
  exactKeys(value, ["ref", "version", "sha256"], label);
  nonempty(value.ref, `${label}.ref`);
  nonempty(value.version, `${label}.version`);
  sha256(value.sha256, `${label}.sha256`);
};
const validateExactSet = (value, label) => {
  exactKeys(value, ["completeness", "membership_digest", "members"], label);
  assert(value.completeness === "declared-complete", `${label} completeness drift`);
  sha256(value.membership_digest, `${label}.membership_digest`);
  assert(Array.isArray(value.members), `${label}.members must be array`);
  assert(new Set(value.members).size === value.members.length, `${label}.members duplicate`);
  for (const member of value.members) nonempty(member, `${label}.member`);
};
const sameSet = (left, right) => JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
const validateEnvelope = (value) => {
  exactKeys(value, ["schema_version", "envelope_id", "contract", "subject", "boundary", "source_population", "source_placement", "target_population", "target_placement", "incoming_adjacency", "snapshot", "attestation", "currentness", "authority_effect"], "envelope");
  assert(value.schema_version === "domainspec.emits-incoming-closure-evidence-envelope/candidate-v1", "schema version drift");
  nonempty(value.envelope_id, "envelope_id");
  validateBoundRef(value.contract, "contract");
  exactKeys(value.subject, ["relation_id", "predicate_id", "counting_unit_receipt", "numeric_policy_receipt", "closure_proof_receipt"], "subject");
  assert(value.subject.relation_id === "emits", "relation drift");
  assert(value.subject.predicate_id === "emits.target_max=1", "predicate drift");
  validateBoundRef(value.subject.counting_unit_receipt, "counting_unit_receipt");
  validateBoundRef(value.subject.numeric_policy_receipt, "numeric_policy_receipt");
  validateBoundRef(value.subject.closure_proof_receipt, "closure_proof_receipt");
  exactKeys(value.boundary, ["boundary_id", "boundary_kind_ref", "owner_ref"], "boundary");
  nonempty(value.boundary.boundary_id, "boundary_id");
  nonempty(value.boundary.boundary_kind_ref, "boundary_kind_ref");
  nonempty(value.boundary.owner_ref, "boundary.owner_ref");
  validateExactSet(value.source_population, "source_population");
  validateExactSet(value.source_placement, "source_placement");
  validateExactSet(value.target_population, "target_population");
  validateExactSet(value.target_placement, "target_placement");
  assert(sameSet(value.source_population.members, value.source_placement.members), "source placement drift");
  assert(sameSet(value.target_population.members, value.target_placement.members), "target placement drift");
  exactKeys(value.incoming_adjacency, ["completeness", "fact_set_digest", "facts", "outgoing_closure"], "incoming_adjacency");
  assert(value.incoming_adjacency.completeness === "declared-complete-incoming", "incoming completeness drift");
  sha256(value.incoming_adjacency.fact_set_digest, "fact_set_digest");
  assert(value.incoming_adjacency.outgoing_closure === "open", "outgoing closure drift");
  assert(Array.isArray(value.incoming_adjacency.facts), "facts must be array");
  assert(new Set(value.incoming_adjacency.facts.map((fact) => JSON.stringify(fact))).size === value.incoming_adjacency.facts.length, "duplicate fact");
  const sourceIds = new Set(value.source_population.members);
  const targetIds = new Set(value.target_population.members);
  for (const fact of value.incoming_adjacency.facts) {
    exactKeys(fact, ["source_entity_id", "target_event_id"], "emits_fact");
    assert(sourceIds.has(fact.source_entity_id), "unbound source endpoint");
    assert(targetIds.has(fact.target_event_id), "unbound target endpoint");
  }
  exactKeys(value.snapshot, ["snapshot_digest", "source_set", "graph", "source_manifest", "relationship_registry", "profile"], "snapshot");
  sha256(value.snapshot.snapshot_digest, "snapshot_digest");
  for (const key of ["source_set", "graph", "source_manifest", "relationship_registry", "profile"]) validateBoundRef(value.snapshot[key], `snapshot.${key}`);
  exactKeys(value.attestation, ["declaring_owner_ref", "producer_ref", "declaration_digest", "completeness_claim"], "attestation");
  assert(value.attestation.declaring_owner_ref === value.boundary.owner_ref, "attestation owner collapse");
  nonempty(value.attestation.producer_ref, "producer_ref");
  sha256(value.attestation.declaration_digest, "declaration_digest");
  assert(value.attestation.completeness_claim === "declares-complete-for-bound-snapshot", "completeness claim drift");
  if (value.currentness.state === "unknown") {
    exactKeys(value.currentness, ["state", "reason"], "currentness.unknown");
    nonempty(value.currentness.reason, "currentness.reason");
  } else if (value.currentness.state === "external-ref") {
    exactKeys(value.currentness, ["state", "reference"], "currentness.external");
    validateBoundRef(value.currentness.reference, "currentness.reference");
  } else {
    assert(false, "currentness state drift");
  }
  assert(value.authority_effect === "none", "authority effect drift");
};

const fixture = json(resolve(root, "fixtures/valid-minimal-envelope.json"));
validateEnvelope(fixture);
const reordered = clone(fixture);
reordered.source_population.members.reverse();
reordered.source_placement.members.reverse();
reordered.incoming_adjacency.facts.reverse();
validateEnvelope(reordered);
const empty = clone(fixture);
for (const key of ["source_population", "source_placement", "target_population", "target_placement"]) empty[key].members = [];
empty.incoming_adjacency.facts = [];
validateEnvelope(empty);

const hostile = [
  ["unknown-property", (v) => { v.latest = true; }],
  ["duplicate-source-member", (v) => { v.source_population.members.push(v.source_population.members[0]); }],
  ["source-placement-drift", (v) => { v.source_placement.members.pop(); }],
  ["target-placement-drift", (v) => { v.target_placement.members.pop(); }],
  ["unbound-source", (v) => { v.incoming_adjacency.facts[0].source_entity_id = "Entity:Unknown"; }],
  ["unbound-target", (v) => { v.incoming_adjacency.facts[0].target_event_id = "Event:Unknown"; }],
  ["duplicate-fact", (v) => { v.incoming_adjacency.facts.push(clone(v.incoming_adjacency.facts[0])); }],
  ["predicate-drift", (v) => { v.subject.predicate_id = "emits.target_max=2"; }],
  ["outgoing-closure-overreach", (v) => { v.incoming_adjacency.outgoing_closure = "closed"; }],
  ["latest-currentness", (v) => { v.currentness = { state: "latest" }; }],
  ["authority-growth", (v) => { v.authority_effect = "schema-admitted"; }],
  ["bad-snapshot-digest", (v) => { v.snapshot.snapshot_digest = "bad"; }],
  ["attestation-owner-collapse", (v) => { v.attestation.declaring_owner_ref = "compiler-owner"; }],
  ["nested-unknown-property", (v) => { v.subject.runtime = true; }]
];
let hostileRejected = 0;
for (const [name, mutate] of hostile) {
  const value = clone(fixture);
  mutate(value);
  try {
    validateEnvelope(value);
    throw new Error(`hostile probe accepted: ${name}`);
  } catch (error) {
    if (String(error.message).startsWith("hostile probe accepted")) throw error;
    hostileRejected += 1;
  }
}
assert(hostileRejected === hostile.length, "hostile rejection count drift");

const architecture = text(resolve(root, "ARCHITECTURE-BUNDLE.md"));
for (let view = 1; view <= 6; view += 1) assert(architecture.includes(`## ${view}.`), `missing architecture view ${view}`);
const distill = text(resolve(root, "DESIGN-DISTILL-VALIDATION.md"));
assert(distill.includes("Mode: Standard") && distill.includes("## Round 1") && distill.includes("## Round 2"), "Distill trace incomplete");
const result = text(resolve(root, "DESIGN-RESULT.md"));
assert(result.includes("proposal-complete, not admitted"), "proposal ceiling missing");
const transport = json(resolve(root, "DESIGN-TRANSPORT.json"));
assert(transport.decision_gate_required === false, "Decision Gate manufactured");
assert(transport.authority_effect === "none" && transport.schema_admitted === false, "transport authority drift");

const preserved = {
  "projects/domainspec-v2/definitions/relationships/relationships.yml": "82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1",
  "projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/candidates/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json": "a9f659fc847f7cbfe87d7f68d02f0f996dcae9daa196275042a4e1b7ec9e62c0",
  "projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/schemas/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.schema.json": "d68616768f5018b1023481a6cb507f8fd1b4eb0df656b518bc101cd1315508e7",
  "projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/validators/validate-bmc-rel-001-decision-packet.mjs": "69681598b58529d64037335e6f47935cce769c79a95fc7140daa9f77dd74b975"
};
for (const [path, expected] of Object.entries(preserved)) assert(digest(resolve(repo, path)) === expected, `protected target drift ${path}`);

console.log(JSON.stringify({
  result: "pass",
  checks,
  sources: manifest.target_footprint.inclusions.length,
  fixed_point: selection.fixed_point,
  six_views: 6,
  hostile_probes_rejected: hostileRejected,
  positive_fixtures: 3,
  preserved_targets: Object.keys(preserved).length,
  n42_selection: n42.selection.selected_option_id,
  n43_route: "direct-proposal",
  schema_admitted: false,
  authority_effect: "none"
}, null, 2));
