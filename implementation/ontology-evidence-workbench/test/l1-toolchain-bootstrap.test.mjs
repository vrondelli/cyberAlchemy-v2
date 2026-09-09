import assert from "node:assert/strict";
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

import {
  L1ToolchainError,
  materializeL1Toolchain,
  validateOverlayManifest,
  validateToolchainLock,
  workrootName,
} from "../scripts/materialize-l1-workroot.mjs";
import {
  L1ToolchainVerificationError,
  verifyL1Toolchain,
} from "../scripts/verify-l1-toolchain.mjs";

const implementationRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryImplementationRoot = resolve(
  "/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/implementation/ontology-evidence-workbench",
);
const lockPath = join(implementationRoot, "upstream/L1-TOOLCHAIN.lock.json");
const manifestPath = join(
  implementationRoot,
  "fixtures/l1-bootstrap-overlay/overlay-manifest.json",
);

const load = async (path) => JSON.parse(await readFile(path, "utf8"));

test("the L1 toolchain lock is closed, exact, and makes no final build claim", async () => {
  const lock = await load(lockPath);
  assert.deepEqual(validateToolchainLock(lock), []);
  assert.equal(lock.mode.kind, "online");
  assert.equal(lock.mode.frozen_lockfile, true);
  assert.equal(lock.mode.isolated_store, true);
  assert.equal(lock.mode.workspace_fallback, false);
  assert.equal(lock.mode.global_fallback, false);
  assert.equal(lock.final_feature_build_claim, false);
  assert.equal(lock.authority_effect, "none");
  assert.match(workrootName(lock), /^oew-l1-toolchain-[a-f0-9]{16}$/);
});

test("undeclared fallback and feature-build inflation fail closed", async () => {
  const lock = await load(lockPath);
  const fallback = structuredClone(lock);
  fallback.mode.global_fallback = true;
  assert.deepEqual(validateToolchainLock(fallback), ["MODE_GLOBAL_FALLBACK"]);
  const inflated = structuredClone(lock);
  inflated.final_feature_build_claim = true;
  assert.deepEqual(validateToolchainLock(inflated), ["FEATURE_BUILD_CLAIM"]);
});

test("the self-owned patch fixture binds preimage, postimage, and oracle", async () => {
  const manifest = await load(manifestPath);
  assert.deepEqual(validateOverlayManifest(manifest), []);
  const drifted = structuredClone(manifest);
  drifted.patches[0].postimage_sha256 = "not-a-digest";
  assert.deepEqual(validateOverlayManifest(drifted), ["OVERLAY_postimage_sha256"]);
  assert.equal(manifest.retained_in_feature_overlay, false);
  assert.equal(manifest.authority_effect, "none");
});

test("wrong Node bytes block before dependency materialization", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "oew-l1-negative-node-"));
  try {
    const lock = await load(lockPath);
    lock.toolchain.node.sha256 = "0".repeat(64);
    const alteredLock = join(temporary, "lock.json");
    await writeFile(alteredLock, `${JSON.stringify(lock, null, 2)}\n`);
    await assert.rejects(
      materializeL1Toolchain({
        lockPath: alteredLock,
        outputPath: join(temporary, "handle.json"),
        implementationRoot: repositoryImplementationRoot,
        contractRoot: implementationRoot,
      }),
      (error) =>
        error instanceof L1ToolchainError && error.issue === "NODE_BYTES_DRIFT",
    );
  } finally {
    await rm(temporary, {recursive: true, force: true});
  }
});

test("a tampered producer handle is rejected by the distinct verifier", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "oew-l1-negative-handle-"));
  try {
    const fake = {
      schema_version: "oew.l1-toolchain-handle.v1",
      handle: "oew-l1-toolchain-handle/v1",
      result: "pass",
      final_feature_build_claim: true,
      authority_effect: "none",
    };
    const handlePath = join(temporary, "handle.json");
    await writeFile(handlePath, `${JSON.stringify(fake, null, 2)}\n`);
    await assert.rejects(
      verifyL1Toolchain({
        lockPath,
        handlePath,
        outputPath: join(temporary, "verification.json"),
        implementationRoot: repositoryImplementationRoot,
        contractRoot: implementationRoot,
      }),
      (error) =>
        error instanceof L1ToolchainVerificationError &&
        error.issue === "FEATURE_BUILD_CLAIM",
    );
  } finally {
    await rm(temporary, {recursive: true, force: true});
  }
});

test("published schemas close their roots and preserve private authority ceilings", async () => {
  const handleSchema = await load(
    join(implementationRoot, "contracts/l1-toolchain-handle.schema.json"),
  );
  const verificationSchema = await load(
    join(implementationRoot, "contracts/l1-toolchain-verification.schema.json"),
  );
  for (const schema of [handleSchema, verificationSchema]) {
    assert.equal(schema.additionalProperties, false);
    assert.equal(schema.properties.authority_effect.const, "none");
    assert.equal(schema.properties.final_feature_build_claim.const, false);
  }
});
