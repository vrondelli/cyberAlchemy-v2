import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  EdgeProjectionError,
  projectPresentationEdges,
  supportedSourceRelations,
} from "../src/presentation-edges.mjs";

const testDirectory = dirname(fileURLToPath(import.meta.url));

const pokerSubset = {
  schema_version: "oew-source-relation-subset/v1",
  source_node_ids: ["D1", "D2", "F1", "R1"],
  relations: [
    {
      relation_id: "E3",
      source: "R1",
      exact_relation: "derives-from",
      target: "D1",
      policy_disposition: "policy-pass",
      diagnostics: [],
      grounding_inclusion: "included",
      evidence_refs: [
        "validation/poker-team/docs/features/financial-settlement/OBSERVABILITY-REPORT.md",
      ],
      authority_effect: "none",
    },
    {
      relation_id: "E4",
      source: "F1",
      exact_relation: "derives-from",
      target: "R1",
      policy_disposition: "policy-pass",
      diagnostics: [],
      grounding_inclusion: "included",
      evidence_refs: [
        "validation/poker-team/docs/features/financial-settlement/PIPELINE-REPORT.md",
      ],
      authority_effect: "none",
    },
    {
      relation_id: "E5",
      source: "D2",
      exact_relation: "contradicts",
      target: "D1",
      policy_disposition: "not-applicable",
      diagnostics: [],
      grounding_inclusion: "excluded",
      evidence_refs: [
        "validation/poker-team/backend/src/infrastructure/telemetry/instruments.ts",
        "validation/poker-team/docs/features/financial-settlement/observability.md",
      ],
      authority_effect: "none",
    },
    {
      relation_id: "C-SPECIALIZES-D2-D1",
      source: "D2",
      exact_relation: "specializes",
      target: "D1",
      policy_disposition: "policy-indeterminate",
      diagnostics: ["POLICY_OWNER_UNBOUND"],
      grounding_inclusion: "excluded",
      evidence_refs: [
        "validation/poker-team/backend/src/infrastructure/telemetry/instruments.ts",
        "validation/poker-team/docs/features/financial-settlement/observability.md",
      ],
      authority_effect: "none",
    },
  ],
  authority_effect: "none",
};

const clone = (value) => structuredClone(value);

test("projects the exact Poker lineage, conflict, and indeterminate candidate", () => {
  const result = projectPresentationEdges(pokerSubset);
  assert.equal(result.schema_version, "oew-relation-projection/v1");
  assert.deepEqual(
    result.presentation_edges.map(({ source, type, target }) => [source, type, target]),
    [
      ["presentation:D2", "contradicts", "presentation:D1"],
      ["presentation:D2", "related", "presentation:D1"],
      ["presentation:F1", "builds_on", "presentation:R1"],
      ["presentation:R1", "builds_on", "presentation:D1"],
    ],
  );
  assert.deepEqual(result.counts.by_mapping_loss, {
    exact: 1,
    generalized: 2,
    lossy: 1,
  });
});

test("preserves exact relation and policy-grounding state in every sidecar row", () => {
  const result = projectPresentationEdges(pokerSubset);
  for (const relation of pokerSubset.relations) {
    const id = `presentation-edge:${relation.source}:${relation.exact_relation}:${relation.target}`;
    const row = result.sidecar_edges[id];
    assert.equal(row.source_ref, relation.relation_id);
    assert.equal(row.source_relation, relation.exact_relation);
    assert.equal(row.policy_disposition, relation.policy_disposition);
    assert.equal(row.grounding_inclusion, relation.grounding_inclusion);
    assert.deepEqual(row.diagnostics, [...relation.diagnostics].sort());
    assert.equal(row.authority_effect, "none");
  }
});

test("is byte-stable across source relation and evidence-ref order", () => {
  const shuffled = clone(pokerSubset);
  shuffled.relations.reverse();
  shuffled.relations.forEach((relation) => relation.evidence_refs.reverse());
  assert.equal(
    JSON.stringify(projectPresentationEdges(pokerSubset)),
    JSON.stringify(projectPresentationEdges(shuffled)),
  );
});

test("rejects the unknown-relation fixture", async () => {
  const fixture = JSON.parse(await readFile(
    resolve(testDirectory, "../fixtures/unknown-relation.json"),
    "utf8",
  ));
  assert.throws(
    () => projectPresentationEdges(fixture),
    (error) => error instanceof EdgeProjectionError &&
      error.issues.includes("UNKNOWN_RELATION:supports"),
  );
});

test("rejects duplicate IDs, missing endpoints, and authority effects", () => {
  const invalid = clone(pokerSubset);
  invalid.relations.push(clone(invalid.relations[0]));
  invalid.relations[1].target = "MISSING";
  invalid.relations[2].authority_effect = "admit";
  assert.throws(
    () => projectPresentationEdges(invalid),
    (error) => {
      assert.equal(error.code, "OEW_EDGE_PROJECTION_REJECTED");
      assert.ok(error.issues.includes("DUPLICATE_RELATION_ID:E3"));
      assert.ok(error.issues.some((issue) => issue.startsWith("DUPLICATE_PRESENTATION_EDGE:")));
      assert.ok(error.issues.includes("MISSING_ENDPOINT:E4:target:MISSING"));
      assert.ok(error.issues.includes("AUTHORITY_EFFECT_FORBIDDEN:E5"));
      return true;
    },
  );
});

test("rejects an admitted-looking specializes candidate", () => {
  const invalid = clone(pokerSubset);
  invalid.relations[3].policy_disposition = "policy-pass";
  invalid.relations[3].diagnostics = [];
  invalid.relations[3].grounding_inclusion = "included";
  assert.throws(
    () => projectPresentationEdges(invalid),
    (error) => error.issues.includes(
      "SPECIALIZES_POLICY_STATE_INVALID:C-SPECIALIZES-D2-D1",
    ),
  );
});

test("publishes the exact closed relation vocabulary", () => {
  assert.deepEqual(supportedSourceRelations, [
    "contradicts",
    "derives-from",
    "specializes",
  ]);
  assert.equal(Object.isFrozen(supportedSourceRelations), true);
});
