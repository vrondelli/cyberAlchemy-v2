import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createRelationshipOwnerPacket } from "../evidence/relationship-owner-packet.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fixture = JSON.parse(readFileSync(resolve(root, "fixtures/contracts/relationship-owner-packet.json"), "utf8"));
const authorityDigest = fixture.authority.digest;

function clone(value) {
  return structuredClone(value);
}

test("finite owner packet remains pending and resolves no question", () => {
  const packet = createRelationshipOwnerPacket(fixture, { actualAuthorityDigest: authorityDigest });
  assert.equal(packet.status, "pending-owner");
  assert.equal(packet.semantic.packet_state, "pending-owner");
  assert.equal(packet.semantic.closure.decision, null);
  assert.equal(packet.semantic.questions.length, 4);
  assert.ok(packet.semantic.questions.every((question) => question.alternatives.length >= 2));
});

test("incomplete owner and empty alternatives fail closed", () => {
  const noOwner = clone(fixture);
  noOwner.owner.handle = "";
  assert.throws(() => createRelationshipOwnerPacket(noOwner, { actualAuthorityDigest: authorityDigest }), /owner.handle is required/);

  const noOptions = clone(fixture);
  noOptions.questions[0].alternatives = [];
  assert.throws(() => createRelationshipOwnerPacket(noOptions, { actualAuthorityDigest: authorityDigest }), /requires at least two finite alternatives/);
});

test("endpoint-only evidence cannot support the packet", () => {
  const endpointOnly = clone(fixture);
  for (const example of [...endpointOnly.examples.positive, ...endpointOnly.examples.negative]) example.kind = "endpoint-only";
  assert.throws(() => createRelationshipOwnerPacket(endpointOnly, { actualAuthorityDigest: authorityDigest }), /endpoint-only evidence cannot support/);
});

test("owner acknowledgement without decision remains pending-owner", () => {
  const acknowledged = clone(fixture);
  acknowledged.closure.acknowledgement = { owner_handle: acknowledged.owner.handle, acknowledged_at: "2026-07-11T00:00:00Z" };
  const packet = createRelationshipOwnerPacket(acknowledged, { actualAuthorityDigest: authorityDigest });
  assert.equal(packet.semantic.packet_state, "pending-owner");
  assert.equal(packet.semantic.closure.decision, null);
  assert.ok(packet.semantic.prohibited_inferences.includes("owner-acknowledgement-is-not-owner-decision"));
});

test("superseded authority digest and embedded decisions fail closed", () => {
  assert.throws(
    () => createRelationshipOwnerPacket(fixture, { actualAuthorityDigest: `sha256:${"0".repeat(64)}` }),
    /authority digest is superseded/,
  );
  const adjudicated = clone(fixture);
  adjudicated.closure.decision = { selected_option_id: "retain-target-only" };
  assert.throws(() => createRelationshipOwnerPacket(adjudicated, { actualAuthorityDigest: authorityDigest }), /transport packet cannot contain an owner decision/);
});

test("relationship packet generation replays as an immutable no-op", () => {
  const outDir = mkdtempSync(resolve(tmpdir(), "uir-relationship-packet-"));
  try {
    const command = [resolve(root, "evidence/build-relationship-packet-generation.mjs"), "--out-dir", outDir];
    const first = spawnSync(process.execPath, command, { encoding: "utf8" });
    assert.equal(first.status, 0, first.stderr);
    assert.match(first.stdout, /PASS: published pending-owner packet with 4 finite questions/);
    const target = resolve(outDir, "packet.json");
    const before = readFileSync(target, "utf8");
    const second = spawnSync(process.execPath, command, { encoding: "utf8" });
    assert.equal(second.status, 0, second.stderr);
    assert.match(second.stdout, /NO-OP: immutable relationship packet/);
    assert.equal(readFileSync(target, "utf8"), before);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});
