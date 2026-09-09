import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const sidecarPath = new URL("../generated/runs/SWU-OEW-004/evidence-sidecar.json", import.meta.url);
const sourcePath = new URL("../upstream/overlay/packages/dashboard/src/oew/EvidenceInspector.tsx", import.meta.url);

test("exact inspector source preserves generalized derives-from semantics", async () => {
  const sidecar = JSON.parse(await readFile(sidecarPath, "utf8"));
  const edges = Object.values(sidecar.edges).filter((row) => row.source_relation === "derives-from");
  assert.equal(edges.length, 2);
  for (const edge of edges) {
    assert.equal(edge.presentation_relation, "builds_on");
    assert.equal(edge.mapping_loss, "generalized");
    assert.equal(edge.policy_disposition, "policy-pass");
    assert.equal(edge.authority_effect, "none");
  }
});

test("specializes remains lossy, indeterminate, diagnosed, and excluded", async () => {
  const sidecar = JSON.parse(await readFile(sidecarPath, "utf8"));
  const edge = sidecar.edges["presentation-edge:D2:specializes:D1"];
  assert.deepEqual(
    {
      source_relation: edge.source_relation,
      presentation_relation: edge.presentation_relation,
      mapping_loss: edge.mapping_loss,
      policy_disposition: edge.policy_disposition,
      diagnostics: edge.diagnostics,
      grounding_inclusion: edge.grounding_inclusion,
    },
    {
      source_relation: "specializes",
      presentation_relation: "related",
      mapping_loss: "lossy",
      policy_disposition: "policy-indeterminate",
      diagnostics: ["POLICY_OWNER_UNBOUND"],
      grounding_inclusion: "excluded",
    },
  );
});

test("inspector renders all exact evidence fields and no promotion action", async () => {
  const source = await readFile(sourcePath, "utf8");
  for (const field of [
    "Exact relation",
    "Presentation relation",
    "Mapping loss",
    "Policy disposition",
    "Grounding inclusion",
    "Diagnostics",
    "Exact source",
    "Source digest",
    "Exact relation ID",
    "Exact endpoints",
    "Source direction",
    "Direction text",
    "Scene digest",
    "Relation digest",
    "Redundant display cues",
    "authority_effect",
  ]) assert.match(source, new RegExp(field));
  assert.doesNotMatch(source, />\\s*(Accept|Promote|Publish)\\s*</i);
});
