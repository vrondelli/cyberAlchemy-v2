import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const receiptPath = new URL("../generated/runs/SWU-OEW-004/adapter-receipt.json", import.meta.url);
const sourcePath = new URL("../upstream/overlay/packages/dashboard/src/oew/TrustRail.tsx", import.meta.url);

test("trust rail labels are justified by the admitted adapter receipt", async () => {
  const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
  assert.equal(receipt.result, "pass");
  assert.equal(receipt.state, "receipt-complete");
  assert.equal(receipt.determinism.byte_identical, true);
  assert.equal(receipt.protected_source_check.read_only, true);
  assert.equal(receipt.authority_effect, "none");
});

test("trust rail exposes textual verified, candidate, and authority states", async () => {
  const source = await readFile(sourcePath, "utf8");
  for (const label of ["SOURCE ✓", "ADAPTER ✓", "CANDIDATE ONLY", "AUTHORITY: NONE"]) {
    assert.match(source, new RegExp(label.replace("✓", "\\\\u2713|✓")));
  }
  assert.match(source, /Evidence blocked/);
  assert.match(source, /role="alert"/);
});

test("a failed or incomplete receipt cannot derive verified state", async () => {
  const source = await readFile(sourcePath, "utf8");
  assert.match(source, /receipt\?\.result === "pass"/);
  assert.match(source, /receipt\?\.state === "receipt-complete"/);
  assert.match(source, /protected_source_check\?\.read_only === true/);
  assert.match(source, /determinism\?\.byte_identical === true/);
});
