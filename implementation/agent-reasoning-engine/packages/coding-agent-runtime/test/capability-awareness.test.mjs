import assert from "node:assert/strict";
import {mkdtempSync, mkdirSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, resolve} from "node:path";
import test from "node:test";

import {loadCapabilityProjection, prepareCapabilityAwareness} from "../capability-awareness.mjs";

function capability(id, status = "candidate-not-adopted") {
  return {
    schema_version: "cav2-product-capability/v1",
    capability_id: id,
    definition_ref: "CAV2-D67",
    product_ref: "CA2-PRODUCT-CYBERALCHEMY",
    project_ref: "CA2-PROJECT-AGENT-REASONING-ENGINE",
    business_ontology_ref: `ONTOLOGY-${id}`,
    outcome: `Produce the ${id} bounded outcome.`,
    scope: `Only the ${id} fixture scope.`,
    exclusions: ["implicit effect authority", "deployment"],
    input_contract_refs: [`INPUT-${id}`],
    output_contract_refs: [`OUTPUT-${id}`],
    owner_routes: [{responsibility: "implementation", owner: "runtime owner"}],
    status,
    authority_effect: "none",
    claim_limit: "Candidate awareness evidence only."
  };
}

function write(root, path, value) {
  const target = resolve(root, path);
  mkdirSync(dirname(target), {recursive: true});
  writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

function config(capabilities) {
  return {
    catalog_id: "fixture-capabilities",
    catalog_version: "1.0.0",
    owner_ref: "fixture-owner",
    revision: "fixture-revision-1",
    capabilities
  };
}

function entry(path, id, intentKind, terms) {
  return {
    source_path: path,
    route_id: `route-${id}`,
    label: id,
    mode: "propose",
    owner_ref: "fixture-owner",
    intent_kind: intentKind,
    request_terms: terms,
    required_inputs: ["intent-contract"],
    dominates: [],
    forbidden_effects: ["implicit-effect-authority"]
  };
}

test("explicit capability projection preserves lifecycle and exact source provenance", () => {
  const root = mkdtempSync(resolve(tmpdir(), "are-capability-projection-"));
  try {
    write(root, "capabilities/code.json", capability("CAP-CODE"));
    const projection = loadCapabilityProjection({repository_root: root, config: config([entry("capabilities/code.json", "code", "coding", ["repair"])])});
    assert.equal(projection.descriptors.length, 1);
    assert.equal(projection.descriptors[0].lifecycle_status, "candidate-not-adopted");
    assert.equal(projection.descriptors[0].source_ref, "capabilities/code.json");
    assert.match(projection.descriptors[0].source_sha256, /^[a-f0-9]{64}$/u);
    assert.equal(projection.descriptors[0].authority_effect, "none");
  } finally { rmSync(root, {recursive: true, force: true}); }
});
test("intent selects one capability and injects no unselected descriptor", async () => {
  const root = mkdtempSync(resolve(tmpdir(), "are-capability-selection-"));
  try {
    write(root, "capabilities/code.json", capability("CAP-CODE"));
    write(root, "capabilities/research.json", capability("CAP-RESEARCH", "adopted-meaning-only"));
    const awareness = await prepareCapabilityAwareness({
      repository_root: root,
      request: "Repair this code defect.",
      run_id: "selection-test",
      config: config([
        entry("capabilities/research.json", "research", "research", ["research", "investigate"]),
        entry("capabilities/code.json", "code", "coding", ["code", "repair"])
      ])
    });
    assert.equal(awareness.status, "PASS", JSON.stringify(awareness));
    assert.equal(awareness.selection.capability_ref, "CAP-CODE");
    assert.deepEqual(awareness.selected_capabilities.map((item) => item.capability_id), ["CAP-CODE"]);
    assert.equal(JSON.stringify(awareness).includes("CAP-RESEARCH"), false);
    assert.equal(awareness.authority_effect, "none");
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("ambiguous or unmatched intent blocks before model eligibility", async () => {
  const root = mkdtempSync(resolve(tmpdir(), "are-capability-ambiguous-"));
  try {
    write(root, "capabilities/code.json", capability("CAP-CODE"));
    write(root, "capabilities/research.json", capability("CAP-RESEARCH"));
    const selectedConfig = config([
      entry("capabilities/code.json", "code", "coding", ["build"]),
      entry("capabilities/research.json", "research", "research", ["build"])
    ]);
    const ambiguous = await prepareCapabilityAwareness({repository_root: root, request: "Build it.", run_id: "ambiguous-test", config: selectedConfig});
    assert.equal(ambiguous.status, "BLOCK");
    assert.ok(ambiguous.reason_codes.includes("capability.disposition-ambiguous"));

    const unmatched = await prepareCapabilityAwareness({repository_root: root, request: "Translate this.", run_id: "unmatched-test", config: selectedConfig});
    assert.equal(unmatched.status, "BLOCK");
    assert.ok(unmatched.reason_codes.includes("capability.disposition-ambiguous"));
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("capability source ordering cannot change the source-set digest", () => {
  const root = mkdtempSync(resolve(tmpdir(), "are-capability-order-"));
  try {
    write(root, "capabilities/a.json", capability("CAP-A"));
    write(root, "capabilities/b.json", capability("CAP-B"));
    const a = entry("capabilities/a.json", "a", "a", ["alpha"]);
    const b = entry("capabilities/b.json", "b", "b", ["beta"]);
    const left = loadCapabilityProjection({repository_root: root, config: config([a, b])});
    const right = loadCapabilityProjection({repository_root: root, config: config([b, a])});
    assert.equal(left.source_set_digest, right.source_set_digest);
  } finally { rmSync(root, {recursive: true, force: true}); }
});
