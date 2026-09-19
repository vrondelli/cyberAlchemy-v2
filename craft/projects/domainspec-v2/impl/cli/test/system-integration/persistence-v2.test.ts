import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { compilePersistenceCompositionV2, PersistenceCompositionError, validatePersistenceCompositionV2 } from "../../src/system-integration/persistence-v2.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.resolve(here, "../../../system-integration/fixtures/persistence-composition-v2/commerce-postgresql.json");
const schemaPath = path.resolve(here, "../../../system-integration/contracts/persistence-composition-v2.schema.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

test("R3 persistence composition is deterministic and preserves all logical shapes", () => {
  const left = compilePersistenceCompositionV2(fixture);
  const right = compilePersistenceCompositionV2(clone(fixture));
  assert.deepEqual(left, right);
  assert.match(left.composition_digest, /^[a-f0-9]{64}$/);
  assert.match(left.integration_kernel.kernel_digest, /^[a-f0-9]{64}$/);
  assert.deepEqual([...new Set(left.persistence_mappings[0]!.field_mappings.map(item => item.logical_shape))].sort(), ["entity-reference", "enum", "list", "optional", "scalar", "set", "sum", "value-object"]);
  assert.equal(left.runtime_guarantees_observed, false);
  assert.equal(left.authority_effect, "none");
});

test("R3 schema closes every persistence and migration record", () => {
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  assert.equal(schema.additionalProperties, false);
  for (const name of ["persistenceBinding", "physicalModel", "identityMapping", "fieldMapping", "relationMapping", "indexMapping", "conversionRule", "persistenceMapping", "transactionGuarantee", "migrationStep", "migration"]) {
    assert.equal(schema.$defs[name].additionalProperties, false, name);
  }
});

test("D46 specialization must agree exactly with the shared integration kernel", () => {
  const changed = clone(fixture);
  changed.persistence_bindings[0].resource_ref = "resource:other-database";
  assert.throws(() => validatePersistenceCompositionV2(changed), (error) => error instanceof PersistenceCompositionError && error.code === "PERSISTENCE_BINDING_DRIFT");
});

test("logical-to-physical mapping references and identities fail closed", () => {
  const missingConversion = clone(fixture);
  missingConversion.persistence_mappings[0].field_mappings.find((item: { logical_shape: string }) => item.logical_shape === "value-object").conversion_ref = "conversion:missing";
  assert.throws(() => validatePersistenceCompositionV2(missingConversion), (error) => error instanceof PersistenceCompositionError && error.code === "PERSISTENCE_REFERENCE_UNRESOLVED");
  const changedIdentity = clone(fixture);
  changedIdentity.persistence_mappings[0].identity_mappings[0].physical_field_ref = "physical:customers/other-id";
  assert.throws(() => validatePersistenceCompositionV2(changedIdentity), (error) => error instanceof PersistenceCompositionError && error.code === "PERSISTENCE_IDENTITY_DRIFT");
});

test("logical property references preserve snake-case field identities", () => {
  const changed = clone(fixture);
  const field = changed.persistence_mappings[0].field_mappings[0];
  field.logical_property_ref = "commerce:order#billing_customer_id";
  changed.persistence_mappings[0].identity_mappings[0].logical_property_ref = field.logical_property_ref;
  assert.equal(validatePersistenceCompositionV2(changed).persistence_mappings[0]!.field_mappings.some(item => item.logical_property_ref === "commerce:order#billing_customer_id"), true);
});

test("relation fields must belong to their declared source and target physical models", () => {
  const changed = clone(fixture);
  changed.persistence_mappings[0].relation_mappings[0].target_field_ref = "physical:other/id";
  assert.throws(() => validatePersistenceCompositionV2(changed), (error) => error instanceof PersistenceCompositionError && error.code === "PERSISTENCE_RELATION_FIELD");
});

test("optional, list, and set cardinalities cannot collapse", () => {
  const listAsSet = clone(fixture);
  listAsSet.persistence_mappings[0].field_mappings.find((item: { logical_shape: string }) => item.logical_shape === "list").collection_semantics = "unique-unordered";
  assert.throws(() => validatePersistenceCompositionV2(listAsSet), (error) => error instanceof PersistenceCompositionError && error.code === "PERSISTENCE_CARDINALITY_COLLAPSE");
  const optionalAsScalar = clone(fixture);
  optionalAsScalar.persistence_mappings[0].field_mappings.find((item: { logical_shape: string }) => item.logical_shape === "optional").storage_shape = "scalar";
  assert.throws(() => validatePersistenceCompositionV2(optionalAsScalar), (error) => error instanceof PersistenceCompositionError && error.code === "PERSISTENCE_SHAPE_COLLAPSE");
});

test("D47 exposes exactly one local commit boundary without claiming runtime proof", () => {
  const compiled = validatePersistenceCompositionV2(fixture);
  assert.equal(compiled.transaction_guarantees[0]!.atomicity_scope, "single-resource-local");
  assert.equal(compiled.transaction_guarantees[0]!.local_commit_boundary_ref, "commit-boundary:orders-database-transaction");
  assert.equal(compiled.transaction_guarantees[0]!.runtime_guarantees_observed, false);
  const secondBoundary = clone(fixture);
  secondBoundary.transaction_guarantees[0].local_commit_boundary_refs = ["commit-boundary:first", "commit-boundary:second"];
  assert.throws(() => validatePersistenceCompositionV2(secondBoundary), (error) => error instanceof PersistenceCompositionError && error.code === "PERSISTENCE_SCHEMA");
});

test("migration rollback posture cannot contradict its declared steps", () => {
  const forwardOnly = clone(fixture);
  forwardOnly.migrations[0].rollback_posture = "forward-only";
  assert.throws(() => validatePersistenceCompositionV2(forwardOnly), (error) => error instanceof PersistenceCompositionError && error.code === "PERSISTENCE_ROLLBACK");
  const noVerification = clone(fixture);
  noVerification.migrations[0].verification_refs = [];
  assert.throws(() => validatePersistenceCompositionV2(noVerification), (error) => error instanceof PersistenceCompositionError && error.code === "PERSISTENCE_SCHEMA");
});
