import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  validateUpstreamLock,
  verifyPinnedUpstream,
} from "../scripts/prepare-upstream.mjs";

const implementationRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const lockPath = join(implementationRoot, "upstream/UPSTREAM.lock.json");
const schemaPath = join(implementationRoot, "contracts/upstream-lock.schema.json");
const outputDirectory = join(
  implementationRoot,
  "generated/upstream/2cda14e89535049e49120198886bc0b82e9e630f",
);
const temporaryRoots = [];

async function lock() {
  return JSON.parse(await readFile(lockPath, "utf8"));
}

async function temporaryRoot() {
  const root = await mkdtemp(join(tmpdir(), "oew-upstream-test-"));
  temporaryRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map(
      (root) => rm(root, { recursive: true, force: true }),
    ),
  );
});

test("immutable lock matches the admitted repository, commit, license, files, and build", async () => {
  assert.deepEqual(validateUpstreamLock(await lock()), []);
});

test("schema closes the lock root and fixes authority to none", async () => {
  const schema = JSON.parse(await readFile(schemaPath, "utf8"));
  assert.equal(schema.additionalProperties, false);
  assert.equal(
    schema.properties.repository.const,
    "https://github.com/Egonex-AI/Understand-Anything",
  );
  assert.equal(
    schema.properties.commit.const,
    "2cda14e89535049e49120198886bc0b82e9e630f",
  );
  assert.equal(schema.properties.authority_effect.const, "none");
});

test("wrong repository and commit pins fail closed", async () => {
  const wrongRepository = structuredClone(await lock());
  wrongRepository.repository = "https://github.com/example/Understand-Anything";
  assert.ok(
    validateUpstreamLock(wrongRepository).includes("REPOSITORY_PIN_INVALID"),
  );

  const wrongCommit = structuredClone(await lock());
  wrongCommit.commit = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  assert.ok(validateUpstreamLock(wrongCommit).includes("COMMIT_PIN_INVALID"));
});

test("floating refs and changed inspected digests fail closed", async () => {
  const floating = structuredClone(await lock());
  floating.ref = "main";
  assert.ok(
    validateUpstreamLock(floating).includes("FLOATING_PIN_FORBIDDEN:ref"),
  );

  const changedFile = structuredClone(await lock());
  changedFile.inspected_files[0].sha256 = "0".repeat(64);
  assert.ok(
    validateUpstreamLock(changedFile).includes("INSPECTED_FILE_PINS_INVALID"),
  );
});

test("retained source and viewer artifacts independently verify", async () => {
  const result = await verifyPinnedUpstream({
    lockPath,
    outputDirectory,
    implementationRoot,
  });
  assert.equal(result.verified, true, result.issues.join(","));
  assert.equal(result.handle, "oew-upstream-viewer-build/v1");
  assert.equal(result.upstream.commit, (await lock()).commit);
  assert.deepEqual(
    result.artifacts.map(({ path }) => path),
    ["source.tar.gz", "viewer-dist.tar.gz"],
  );
  assert.equal(result.authority_effect, "none");
});

test("receipt tampering is rejected without rebuilding or network access", async () => {
  const root = await temporaryRoot();
  const copy = join(root, "2cda14e89535049e49120198886bc0b82e9e630f");
  await cp(outputDirectory, copy, { recursive: true });
  const receiptPath = join(copy, "build-receipt.json");
  const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
  receipt.authority_effect = "admit";
  await writeFile(receiptPath, `${JSON.stringify(receipt)}\n`);
  const result = await verifyPinnedUpstream({
    lockPath,
    outputDirectory: copy,
    implementationRoot,
  });
  assert.equal(result.verified, false);
  assert.ok(result.issues.includes("AUTHORITY_EFFECT_FORBIDDEN:receipt"));
});
