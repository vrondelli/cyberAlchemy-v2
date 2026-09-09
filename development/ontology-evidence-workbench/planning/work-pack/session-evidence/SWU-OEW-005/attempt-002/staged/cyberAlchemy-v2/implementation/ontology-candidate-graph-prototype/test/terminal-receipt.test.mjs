import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { evaluatePokerTeamO13 } from "../src/cli.mjs";
import { verifyTerminalReceipt } from "../scripts/verify-terminal-receipt.mjs";

const ISOLATION = Object.freeze({
  schema_version: "candidate-isolation-attestation-v1",
  protected_set_digest_before: "a".repeat(64),
  protected_set_digest_after: "a".repeat(64),
  protected_file_count: 1,
  write_probe: "denied",
  claim: "input-isolation-only",
  host_security_claim: "none",
  authority_effect: "none",
});

async function bundle(t) {
  const parent = await mkdtemp(join(tmpdir(), "ocgp-verifier-"));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const run = join(parent, "run");
  await evaluatePokerTeamO13({
    outDir: run,
    isolationAttestation: ISOLATION,
    receiptContext: { task_id: "T", swu_id: "S" },
  });
  return { run, receipt: join(run, "terminal-receipt.json") };
}

async function rewrite(path, mutate) {
  const value = JSON.parse(await readFile(path, "utf8"));
  mutate(value);
  await writeFile(path, JSON.stringify(value), "utf8");
}

test("independently verifies an exact bounded bundle", async (t) => {
  const { receipt } = await bundle(t);
  assert.deepEqual(await verifyTerminalReceipt(receipt), {
    verified: true,
    receipt_sha256: (await import("node:crypto"))
      .createHash("sha256")
      .update(await readFile(receipt))
      .digest("hex"),
    artifact_count: 4,
    issues: [],
  });
});

test("rejects a missing artifact", async (t) => {
  const { run, receipt } = await bundle(t);
  await unlink(join(run, "projection.v1.json"));
  assert.equal((await verifyTerminalReceipt(receipt)).verified, false);
});

test("rejects an extra artifact", async (t) => {
  const { run, receipt } = await bundle(t);
  await writeFile(join(run, "extra.json"), "{}", "utf8");
  assert.ok((await verifyTerminalReceipt(receipt)).issues.includes("INVENTORY_MISMATCH"));
});

test("rejects tampered body bytes", async (t) => {
  const { run, receipt } = await bundle(t);
  await writeFile(join(run, "result.v1.json"), "{}", "utf8");
  const result = await verifyTerminalReceipt(receipt);
  assert.equal(result.verified, false);
  assert.ok(result.issues.includes("RECEIPT_DIGEST_MISMATCH:result.v1.json"));
});

test("rejects an unknown body version", async (t) => {
  const { run, receipt } = await bundle(t);
  await rewrite(join(run, "result.v1.json"), (value) => {
    value.schema_version = "candidate-result-v999";
  });
  assert.ok((await verifyTerminalReceipt(receipt)).issues.includes("UNKNOWN_VERSION:result"));
});

test("rejects an invalid or missing isolation attestation", async (t) => {
  const { run, receipt } = await bundle(t);
  await rewrite(join(run, "result.v1.json"), (value) => {
    value.isolation_attestation = null;
  });
  assert.ok((await verifyTerminalReceipt(receipt)).issues.includes("ISOLATION_ATTESTATION_INVALID"));
});

test("rejects overwritten terminal state", async (t) => {
  const { receipt } = await bundle(t);
  await rewrite(receipt, (value) => {
    value.state = "overwritten";
  });
  assert.ok((await verifyTerminalReceipt(receipt)).issues.includes("TERMINAL_STATE_INVALID"));
});

test("rejects self-promoting evidence", async (t) => {
  const { run, receipt } = await bundle(t);
  await rewrite(join(run, "projection.v1.json"), (value) => {
    value.authority_effect = "promotion";
  });
  const result = await verifyTerminalReceipt(receipt);
  assert.equal(result.verified, false);
  assert.ok(result.issues.some((issue) => issue.startsWith("AUTHORITY_EFFECT_FORBIDDEN")));
});
