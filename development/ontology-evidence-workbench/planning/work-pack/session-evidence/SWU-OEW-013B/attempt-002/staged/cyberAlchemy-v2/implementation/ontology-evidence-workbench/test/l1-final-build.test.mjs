import assert from "node:assert/strict";
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

import {
  L1BuildError,
  materializeL1Build,
  validateBuildLock,
  workrootName,
} from "../scripts/materialize-l1-build.mjs";
import {
  L1BuildVerificationError,
  validateBuildHandle,
  verifyL1Build,
} from "../scripts/verify-l1-build.mjs";

const implementationRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryImplementationRoot = resolve(
  "/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/implementation/ontology-evidence-workbench",
);
const lockPath = join(repositoryImplementationRoot, "upstream/L1-BUILD.lock.json");
const load = async (path) => JSON.parse(await readFile(path, "utf8"));

test("the final-build lock closes the exact post-feature build boundary", async () => {
  const lock = await load(lockPath);
  assert.deepEqual(validateBuildLock(lock), []);
  assert.equal(lock.owner_swu, "SWU-OEW-013B");
  assert.equal(lock.execution_contract.mode.frozen_lockfile, true);
  assert.equal(lock.execution_contract.mode.ignore_scripts, true);
  assert.equal(lock.execution_contract.mode.isolated_store, true);
  assert.equal(lock.execution_contract.mode.workspace_fallback, false);
  assert.equal(lock.execution_contract.mode.global_fallback, false);
  assert.equal(lock.feature_inputs.swu_008f.first_working_version_manifest.bound_file_count, 27);
  assert.match(workrootName(lock), /^oew-l1-build-[a-f0-9]{16}$/);
  assert.equal(lock.authority_effect, "none");
});

test("fallback, package mutation, and authority inflation fail closed", async () => {
  const lock = await load(lockPath);
  const fallback = structuredClone(lock);
  fallback.execution_contract.mode.global_fallback = true;
  assert.deepEqual(validateBuildLock(fallback), ["MODE_GLOBAL_FALLBACK"]);
  const packageMutation = structuredClone(lock);
  packageMutation.oe_workbench_registry.mutation_forbidden = false;
  assert.deepEqual(validateBuildLock(packageMutation), ["PACKAGE_MUTATION"]);
  const inflated = structuredClone(lock);
  inflated.authority_effect = "admit";
  assert.deepEqual(validateBuildLock(inflated), ["AUTHORITY_EFFECT"]);
});

test("wrong Node bytes block before install or build", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "oew-l1-build-negative-node-"));
  try {
    const lock = await load(lockPath);
    lock.verified_toolchain.node.sha256 = "0".repeat(64);
    const alteredLock = join(temporary, "lock.json");
    await writeFile(alteredLock, `${JSON.stringify(lock, null, 2)}\n`);
    await assert.rejects(
      materializeL1Build({
        lockPath: alteredLock,
        outputPath: join(temporary, "handle.json"),
        implementationRoot: repositoryImplementationRoot,
      }),
      (error) => error instanceof L1BuildError && error.issue === "NODE_BYTES_DRIFT",
    );
  } finally {
    await rm(temporary, {recursive: true, force: true});
  }
});

test("a pre-feature or inflated producer handle is rejected", async () => {
  const preFeature = {
    schema_version: "oew.l1-toolchain-handle.v1",
    handle: "oew-l1-toolchain-handle/v1",
    result: "pass",
  };
  assert.ok(validateBuildHandle(preFeature).includes("HANDLE_KIND"));
  const inflated = {
    schema_version: "oew.l1-build-handle.v1",
    handle: "oew-l1-build-handle/v1",
    result: "pass",
    producer: {
      id: "materialize-l1-build",
      script: {path: "scripts/materialize-l1-build.mjs", sha256: "0".repeat(64)},
    },
    mode: {
      frozen_lockfile: true,
      ignore_scripts: true,
      isolated_store: true,
      workspace_fallback: false,
      global_fallback: false,
    },
    patch: {applied_once: true, reapply_rejected: true},
    install: {exit_code: 0},
    dashboard_test: {exit_code: 0},
    dashboard_build: {exit_code: 0},
    output: {
      immutable: true,
      file_count: 1,
      tree_sha256: "0".repeat(64),
      archive: {sha256: "0".repeat(64)},
    },
    protected_set: {equal_current: true, set_digest: "0".repeat(64)},
    cleanup: {
      finally_executed: true,
      workroot_removed: true,
      workroot_absent: true,
      store_absent: true,
      owned_ports: [],
      ports_open_after_cleanup: [],
    },
    residue: {unexpected_paths: []},
    browser_acceptance_claim: false,
    manual_ux_claim: false,
    release_claim: false,
    production_claim: true,
    authority_effect: "none",
  };
  assert.ok(validateBuildHandle(inflated).includes("PRODUCTION_CLAIM"));
});

test("the verifier rejects producer-only evidence before reading output", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "oew-l1-build-negative-handle-"));
  try {
    const handlePath = join(temporary, "handle.json");
    await writeFile(
      handlePath,
      `${JSON.stringify({
        schema_version: "oew.l1-toolchain-handle.v1",
        handle: "oew-l1-toolchain-handle/v1",
        result: "pass",
      }, null, 2)}\n`,
    );
    await assert.rejects(
      verifyL1Build({
        lockPath,
        handlePath,
        outputPath: join(temporary, "verification.json"),
        implementationRoot: repositoryImplementationRoot,
      }),
      (error) =>
        error instanceof L1BuildVerificationError &&
        error.issue === "HANDLE_VERSION",
    );
  } finally {
    await rm(temporary, {recursive: true, force: true});
  }
});

test("published schemas are closed and preserve the evidence ceiling", async () => {
  const handleSchema = await load(
    join(implementationRoot, "contracts/l1-build-handle.schema.json"),
  );
  const verificationSchema = await load(
    join(implementationRoot, "contracts/l1-build-verification.schema.json"),
  );
  for (const schema of [handleSchema, verificationSchema]) {
    assert.equal(schema.additionalProperties, false);
    assert.equal(schema.properties.authority_effect.const, "none");
    assert.equal(schema.properties.browser_acceptance_claim.const, false);
    assert.equal(schema.properties.manual_ux_claim.const, false);
    assert.equal(schema.properties.release_claim.const, false);
    assert.equal(schema.properties.production_claim.const, false);
  }
});
