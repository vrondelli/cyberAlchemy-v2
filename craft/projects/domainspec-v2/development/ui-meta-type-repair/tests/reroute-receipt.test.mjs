import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { sha256Canonical } from "../contracts/canonical-json-v1.mjs";
import { createRerouteReceipt } from "../evidence/reroute-receipt.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const vectors = JSON.parse(readFileSync(resolve(root, "fixtures/contracts/reroute-vectors.json"), "utf8"));
const specimenDigest = sha256Canonical({ specimen: "same-normalized-input" });

for (const vector of vectors.vectors) {
  test(`two-sided reroute vector: ${vector.id}`, () => {
    const receipt = createRerouteReceipt({
      specimen_digest: specimenDigest,
      source_contract: "contract:source/ui-candidate/v1",
      destination_contract: "contract:destination/example/v1",
      source_outcome: vector.source_outcome,
      destination_outcome: vector.destination_outcome,
      destination_handle: vector.destination_handle,
      owner_handle: vector.owner_handle,
      observed_at: "2026-07-11T00:00:00Z",
    });
    assert.equal(receipt.semantic.disposition, vector.expected);
    assert.equal(receipt.semantic.source_outcome, vector.source_outcome);
    assert.equal(receipt.semantic.destination_outcome, vector.destination_outcome);
    assert.ok(receipt.semantic.prohibited_inferences.length >= 3);
  });
}

test("volatile observation time does not change reroute identity", () => {
  const base = {
    specimen_digest: specimenDigest,
    source_contract: "contract:source/v1",
    destination_contract: "contract:destination/v1",
    source_outcome: "rejected",
    destination_outcome: "shape-accepted",
    destination_handle: "destination:local",
  };
  const first = createRerouteReceipt({ ...base, observed_at: "2026-01-01T00:00:00Z" });
  const second = createRerouteReceipt({ ...base, observed_at: "2027-01-01T00:00:00Z" });
  assert.equal(first.content_digest, second.content_digest);
  assert.equal(first.record_id, second.record_id);
  assert.equal(first.generation_id, second.generation_id);
});

test("pending owner and shape acceptance require their handles", () => {
  const base = {
    specimen_digest: specimenDigest,
    source_contract: "contract:source/v1",
    destination_contract: "contract:destination/v1",
    source_outcome: "rejected",
  };
  assert.throws(() => createRerouteReceipt({ ...base, destination_outcome: "pending-owner" }), /requires owner_handle/);
  assert.throws(() => createRerouteReceipt({ ...base, destination_outcome: "shape-accepted" }), /requires destination_handle/);
});

test("destination identity cannot be smuggled into a reroute receipt", () => {
  assert.throws(
    () => createRerouteReceipt({
      specimen_digest: specimenDigest,
      source_contract: "contract:source/v1",
      destination_contract: "contract:destination/v1",
      source_outcome: "rejected",
      destination_outcome: "shape-accepted",
      destination_handle: "destination:local",
      destination_identity: "Binding",
    }),
    /destination identity is prohibited/,
  );
});

test("reroute generation publishes once and replays as an immutable no-op", () => {
  const outDir = mkdtempSync(resolve(tmpdir(), "uir-reroute-"));
  try {
    const command = [resolve(root, "evidence/build-reroute-generation.mjs"), "--out-dir", outDir];
    const first = spawnSync(process.execPath, command, { encoding: "utf8" });
    assert.equal(first.status, 0, first.stderr);
    assert.match(first.stdout, /PASS: published 6 reroute receipts/);

    const target = resolve(outDir, "receipts.json");
    const before = readFileSync(target, "utf8");
    const second = spawnSync(process.execPath, command, { encoding: "utf8" });
    assert.equal(second.status, 0, second.stderr);
    assert.match(second.stdout, /NO-OP: immutable reroute generation/);
    assert.equal(readFileSync(target, "utf8"), before);

    const conflict = spawnSync(process.execPath, [...command, "--predecessor", `generation:sha256:${"0".repeat(64)}`], { encoding: "utf8" });
    assert.notEqual(conflict.status, 0);
    assert.match(conflict.stderr, /refusing to overwrite non-identical reroute generation/);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});
