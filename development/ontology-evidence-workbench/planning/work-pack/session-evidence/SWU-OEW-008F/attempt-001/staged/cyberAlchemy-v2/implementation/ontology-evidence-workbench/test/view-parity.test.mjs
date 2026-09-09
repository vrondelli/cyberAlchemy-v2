import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";

const fixtureRoot = new URL("../generated/runs/SWU-OEW-004/", import.meta.url);
const sourceRoot = new URL("../upstream/overlay/packages/dashboard/src/oew/", import.meta.url);
const read = (name) => readFile(new URL(name, fixtureRoot), "utf8");
const sha = (text) => createHash("sha256").update(text).digest("hex");
const importSource = async (name) => import(
  `data:text/javascript;base64,${Buffer.from(await readFile(new URL(name, sourceRoot))).toString("base64")}`
);
const {validateOewBundle} = await importSource("types.ts");
const {assertViewParity, buildViewModel, paritySnapshot} =
  await importSource("viewParity.ts");

async function bundle() {
  const [graphText, sidecarText, receiptText] = await Promise.all([
    read("presentation-graph.json"),
    read("evidence-sidecar.json"),
    read("adapter-receipt.json"),
  ]);
  return validateOewBundle({
    graph: JSON.parse(graphText),
    sidecar: JSON.parse(sidecarText),
    receipt: JSON.parse(receiptText),
    hashes: {graph: sha(graphText), sidecar: sha(sidecarText), receipt: sha(receiptText)},
    expectedReceiptSha256: sha(receiptText),
  });
}

test("graph, outline, and table share exact visible and selected state", async () => {
  const snapshots = paritySnapshot(await bundle(), {
    selectedSourceRef: "F1",
    filters: {text: "O13"},
  });
  assert.equal(assertViewParity(snapshots), true);
  for (const view of ["graph", "outline", "table"]) {
    assert.equal(snapshots[view].selectedSourceRef, "F1");
    assert.deepEqual(snapshots[view].groundingPath, ["F1", "R1", "D1"]);
    assert.deepEqual(snapshots[view].visibleResidue, ["D2"]);
    assert.equal(snapshots[view].authorityEffect, "none");
  }
});

test("exact relation, disposition, diagnostic, and path survive every view", async () => {
  const model = buildViewModel(await bundle(), {
    selectedSourceRef: "C-SPECIALIZES-D2-D1",
    filters: {},
  });
  assert.deepEqual(
    {
      relation: model.selected.relation,
      disposition: model.selected.disposition,
      diagnostic: model.selected.diagnostics,
      path: model.selected.sourcePath,
    },
    {
      relation: "specializes",
      disposition: "policy-indeterminate",
      diagnostic: ["POLICY_OWNER_UNBOUND"],
      path: [
        "validation/poker-team/backend/src/infrastructure/telemetry/instruments.ts",
        "validation/poker-team/docs/features/financial-settlement/observability.md",
      ].join(" · "),
    },
  );
});

test("F1 grounding selection retains D2 as visible non-composing residue", async () => {
  const model = buildViewModel(await bundle(), {selectedSourceRef: "F1", filters: {}});
  assert.equal(model.rows.find((row) => row.sourceRef === "D2").residue, true);
  assert.equal(model.rows.find((row) => row.sourceRef === "D2").grounding, false);
});
