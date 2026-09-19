import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildEnvelope } from "../../evaluation/canonical-json.mjs";
import { evaluateSuccessorSuite } from "../runtime/evaluate-successor-suite.mjs";
import {
  readReceiptVocabulary,
  validateEvidenceReceiptV2,
  validateHarnessManifest,
  validateObservationReceipt,
  verifyProtectedGeneration,
} from "../runtime/validate-generation-002.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const parent = resolve(root, "..");
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const readParent = (path) => JSON.parse(readFileSync(resolve(parent, path), "utf8"));
const schema = readParent("contracts/evidence-receipt.schema.yml");
const vectors = readJson("fixtures/contracts/parity-vectors.json");
const protectedManifest = readJson("fixtures/contracts/generation-001-protected-files.json");
const prohibitions = ["candidate-promotion", "ds-d1-formation", "ds-d8-authority", "identity", "irreducibility", "pattern-admission", "portability"];

test("generation-1 receipts pass strict schema vocabulary parity", () => {
  for (const path of vectors.valid_receipts) assert.equal(validateEvidenceReceiptV2(readParent(path), schema), true);
});

test("unknown explanation kinds and observable classes fail before evaluation", () => {
  for (const vector of vectors.invalid_mutations) {
    const source = structuredClone(readParent(vector.source));
    let target = source;
    for (const part of vector.path.slice(0, -1)) target = target[part];
    target[vector.path.at(-1)] = vector.value;
    const receipt = buildEnvelope({
      schemaVersion: source.schema_version,
      contractId: source.contract_id,
      contractVersion: source.contract_version,
      status: source.status,
      semantic: source.semantic,
      prohibitedInferences: source.prohibited_inferences,
      predecessorGenerationId: source.predecessor_generation_id,
      inputHandles: source.input_handles,
    });
    assert.throws(() => validateEvidenceReceiptV2(receipt, schema), new RegExp(vector.error));
  }
  const brokenSchema = structuredClone(schema);
  delete brokenSchema.$defs.explanation.properties.kind.enum;
  assert.throws(() => readReceiptVocabulary(brokenSchema), /missing explanation kind enum/);
});

test("generation-2 harness and observation envelope contracts validate", () => {
  const manifest = buildEnvelope({
    schemaVersion: "cdsc.harness-manifest.v1",
    contractId: "cdsc.harness-manifest",
    status: "frozen",
    semantic: {
      parent_generation_id: protectedManifest.generation_id,
      source_selectors: [{ path: "projects/example/source.ts", ranges: [[1, 2]], digest: `sha256:${"1".repeat(64)}` }],
      harness_digest: `sha256:${"2".repeat(64)}`,
      baseline_vectors: [{ vector_id: "V1", input: { step: "9" }, expected: { step: "9" } }],
      observable_fields: ["committed_step"],
      mutations: [
        { mutation_id: "M1", kind: "permitted", target: "screen", allowed_edit_surface: ["screen-9"], prediction: "preserve", vector_ids: ["V1"], observables: ["committed_step"], stop_conditions: ["drift"] },
        { mutation_id: "M2", kind: "breaking", target: "guard", allowed_edit_surface: ["commit"], prediction: "change", vector_ids: ["V1"], observables: ["committed_step"], stop_conditions: ["drift"] },
      ],
    },
    prohibitedInferences: prohibitions,
    inputHandles: [`record:sha256:${"3".repeat(64)}`],
  });
  assert.equal(validateHarnessManifest(manifest), true);

  const observation = buildEnvelope({
    schemaVersion: "cdsc.observation-receipt.v1",
    contractId: "cdsc.observation-receipt",
    status: "frozen",
    semantic: {
      mutation_id: "M1",
      manifest_handle: manifest.record_id,
      harness_handle: manifest.semantic.harness_digest,
      baseline_witness_handle: `record:sha256:${"4".repeat(64)}`,
      vector_results: [{ vector_id: "V1", baseline: { step: "9" }, mutant: { step: "9" }, comparison: "match" }],
      observation_state: "supported",
      predicted_consequence: "preserve",
      observed_consequence: "preserved",
      uncertainty: [],
    },
    prohibitedInferences: prohibitions,
    inputHandles: [manifest.record_id, `record:sha256:${"4".repeat(64)}`],
  });
  assert.equal(validateObservationReceipt(observation), true);
});

test("successor suite binds the exact generation-1 tail", () => {
  const results = ["f1", "f2", "f3"].map((id) => readParent(`results/generation-001/${id}-result.json`));
  const storedIndex = readParent("generations/index.json");
  const index = { schema_version: storedIndex.schema_version, entries: [structuredClone(storedIndex.entries[0])] };
  const predecessor = index.entries[0].generation_id;
  const successor = evaluateSuccessorSuite(results, { replayState: "identical", predecessorGenerationId: predecessor, generationIndex: index });
  assert.equal(successor.predecessor_generation_id, predecessor);
  assert.equal(successor.semantic.suite_verdict, "CALIBRATION-DEFER");
  assert.notEqual(successor.generation_id, predecessor);
  assert.throws(() => evaluateSuccessorSuite(results, { replayState: "identical", predecessorGenerationId: null, generationIndex: index }), /predecessor is required/);
  assert.throws(() => evaluateSuccessorSuite(results, { replayState: "identical", predecessorGenerationId: `generation:sha256:${"0".repeat(64)}`, generationIndex: index }), /current generation tail/);
});

test("generation-1 protected bytes and index projection remain unchanged", () => {
  assert.equal(verifyProtectedGeneration(parent, protectedManifest), true);
  const drift = structuredClone(protectedManifest);
  drift.files[0].digest = `sha256:${"0".repeat(64)}`;
  assert.throws(() => verifyProtectedGeneration(parent, drift), /protected file drift/);
});

test("generation-2 schemas declare disjoint semantic and volatile fields", () => {
  for (const path of ["contracts/harness-manifest.schema.yml", "contracts/observation-receipt.schema.yml"]) {
    const contract = readJson(path);
    const semantic = new Set(contract["x-cdsc-semantic-fields"]);
    const volatile = new Set(contract["x-cdsc-volatile-fields"]);
    assert.equal([...semantic].some((field) => volatile.has(field)), false);
  }
});
