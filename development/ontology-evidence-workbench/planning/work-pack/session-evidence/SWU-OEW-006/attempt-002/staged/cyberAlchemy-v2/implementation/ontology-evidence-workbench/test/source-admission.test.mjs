import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { afterEach, test } from "node:test";
import { cp, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import {
  SourceAdmissionError,
  admitCandidateRun,
  isVerifiedRunHandle,
} from "../src/source-admission.mjs";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(testDirectory, "../../../..");
const sourceRun = join(
  repositoryRoot,
  "cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/generated/runs/SWU-OCGP-008",
);
const sourceReceipt = join(sourceRun, "terminal-receipt.json");
const tamperedFixture = resolve(
  testDirectory,
  "../fixtures/tampered-result/terminal-receipt.json",
);
const temporaryRoots = [];
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true })));
});

async function copyRun() {
  const root = await mkdtemp(join(tmpdir(), "oew-admission-"));
  temporaryRoots.push(root);
  const run = join(root, "run");
  await cp(sourceRun, run, { recursive: true });
  return { root, run, receipt: join(run, "terminal-receipt.json") };
}

async function treeFingerprint(directory) {
  const entries = [];
  for (const name of (await readdir(directory)).sort()) {
    const bytes = await readFile(join(directory, name));
    entries.push([name, sha256(bytes), bytes.length]);
  }
  return entries;
}

async function rejectsWith(receiptPath, root, expectedIssue) {
  await assert.rejects(
    admitCandidateRun(receiptPath, { repositoryRoot: root }),
    (error) => {
      assert.ok(error instanceof SourceAdmissionError);
      assert.equal(error.code, "OEW_SOURCE_ADMISSION_REJECTED");
      assert.deepEqual(error.issues, [...error.issues].sort());
      assert.ok(
        error.issues.some((issue) => issue.includes(expectedIssue)),
        `expected ${expectedIssue} in ${error.issues.join(",")}`,
      );
      return true;
    },
  );
}

test("admits the current independently verified run without writing", async () => {
  const before = await treeFingerprint(sourceRun);
  const handle = await admitCandidateRun(sourceReceipt, { repositoryRoot });
  const after = await treeFingerprint(sourceRun);

  assert.equal(isVerifiedRunHandle(handle), true);
  assert.equal(handle.schema_version, "oew-verified-run-handle/v1");
  assert.equal(handle.source.swu_id, "SWU-OCGP-008");
  assert.equal(handle.authority_effect, "none");
  assert.deepEqual(
    handle.files.map((file) => file.name),
    [
      "digest-map.v1.json",
      "projection.v1.json",
      "result.v1.json",
      "terminal-receipt.json",
    ],
  );
  assert.deepEqual(after, before);
});

test("rejects missing and repository-escaping receipt paths", async () => {
  await rejectsWith("missing/terminal-receipt.json", repositoryRoot, "MISSING_SOURCE");
  await rejectsWith("/etc/passwd", repositoryRoot, "PATH_ESCAPE");
});

test("rejects a symlink that escapes the admitted repository root", async () => {
  const root = await mkdtemp(join(tmpdir(), "oew-symlink-root-"));
  temporaryRoots.push(root);
  const run = join(root, "run");
  await cp(sourceRun, run, { recursive: true });
  await rm(join(run, "terminal-receipt.json"));
  await symlink(sourceReceipt, join(run, "terminal-receipt.json"));
  await rejectsWith(join(run, "terminal-receipt.json"), root, "PATH_ESCAPE");
});

test("rejects tampered receipt digests", async () => {
  const { root, run, receipt } = await copyRun();
  await cp(tamperedFixture, join(run, "terminal-receipt.json"));
  await rejectsWith(receipt, root, "RECEIPT_DIGEST_MISMATCH");
});

test("rejects unsupported source schemas", async () => {
  const { root, run, receipt } = await copyRun();
  const resultPath = join(run, "result.v1.json");
  const result = JSON.parse(await readFile(resultPath, "utf8"));
  result.schema_version = "candidate-result-v2";
  await writeFile(resultPath, `${JSON.stringify(result)}\n`);
  await rejectsWith(receipt, root, "UNKNOWN_VERSION:result");
});

test("rejects authority-effecting input", async () => {
  const { root, run, receipt } = await copyRun();
  const resultPath = join(run, "result.v1.json");
  const result = JSON.parse(await readFile(resultPath, "utf8"));
  result.authority_effect = "admit";
  await writeFile(resultPath, `${JSON.stringify(result)}\n`);
  await rejectsWith(receipt, root, "AUTHORITY_EFFECT_FORBIDDEN");
});

test("rejects extra source inventory", async () => {
  const { root, run, receipt } = await copyRun();
  await writeFile(join(run, "extra.json"), "{}\n");
  await rejectsWith(receipt, root, "INVENTORY_MISMATCH");
});
