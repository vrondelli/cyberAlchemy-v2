import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const tourPath = new URL("../upstream/overlay/packages/dashboard/src/oew/tours/poker-o13.json", import.meta.url);
const sidecarPath = new URL("../generated/runs/SWU-OEW-004/evidence-sidecar.json", import.meta.url);

test("Poker walkthrough tells the exact six-step O13 story", async () => {
  const tour = JSON.parse(await readFile(tourPath, "utf8"));
  assert.equal(tour.schema_version, "oew.poker-tour.v1");
  assert.deepEqual(tour.steps.map((step) => step.focus), [
    "F1",
    "R1",
    "D1",
    "D2",
    "C-SPECIALIZES-D2-D1",
    "receipt",
  ]);
  assert.equal(tour.authority_effect, "none");
});

test("tour grounding and residue match exact sidecar state", async () => {
  const sidecar = JSON.parse(await readFile(sidecarPath, "utf8"));
  assert.deepEqual(sidecar.grounding.included_path, ["F1", "R1", "D1"]);
  assert.deepEqual(sidecar.grounding.visible_excluded, ["D2"]);
  assert.deepEqual(sidecar.grounding.indeterminate_candidates, ["C-SPECIALIZES-D2-D1"]);
  assert.deepEqual(
    sidecar.edges["presentation-edge:D2:specializes:D1"].diagnostics,
    ["POLICY_OWNER_UNBOUND"],
  );
});

test("tour source provides next, back, finish, and receipt transitions", async () => {
  const source = await readFile(
    new URL("../upstream/overlay/packages/dashboard/src/oew/PokerTour.tsx", import.meta.url),
    "utf8",
  );
  for (const token of ["Back", "Next evidence", "Finish", "onOpenReceipts"]) {
    assert.match(source, new RegExp(token));
  }
});
