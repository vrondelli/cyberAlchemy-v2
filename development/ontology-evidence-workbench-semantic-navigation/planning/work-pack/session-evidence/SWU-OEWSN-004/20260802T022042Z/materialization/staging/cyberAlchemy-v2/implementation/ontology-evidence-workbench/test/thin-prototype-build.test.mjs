import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  ThinBuildError,
  exactTypedDiscovery,
  expectedTypedSourceDigest,
  normalizedRelativePath,
  parseBuildArgs,
  treeIdentity,
  validateOutputLogicalPath,
  validatePatchSpecs,
  validateSemanticBinding,
  validateSemanticOutputLogicalPath,
  validateTypedReceipt,
} from "../scripts/build-thin-prototype.mjs";

const issue = (expected) => (error) =>
  error instanceof ThinBuildError && error.issue === expected;

test("CLI accepts only the exact build contract", () => {
  assert.deepEqual(
    parseBuildArgs([
      "build",
      "--typed-receipt",
      "cyberAlchemy-v2/development/receipt.json",
      "--output",
      "generated/runs/SWU-OEWTP-002/20260729T184000Z/thin-prototype-build-handle.json",
    ]),
    {
      mode: "build",
      typedReceipt: "cyberAlchemy-v2/development/receipt.json",
      semanticBinding: null,
      output:
        "generated/runs/SWU-OEWTP-002/20260729T184000Z/thin-prototype-build-handle.json",
    },
  );
  assert.deepEqual(
    parseBuildArgs([
      "build-semantic-navigation",
      "--typed-receipt",
      "cyberAlchemy-v2/development/receipt.json",
      "--semantic-binding",
      "upstream/OEWSN-BUILD.binding.json",
      "--output",
      "generated/runs/SWU-OEWSN-004/20260802T022042Z/semantic-navigation-build-handle.json",
    ]),
    {
      mode: "build-semantic-navigation",
      typedReceipt: "cyberAlchemy-v2/development/receipt.json",
      semanticBinding: "upstream/OEWSN-BUILD.binding.json",
      output:
        "generated/runs/SWU-OEWSN-004/20260802T022042Z/semantic-navigation-build-handle.json",
    },
  );
  assert.throws(() => parseBuildArgs(["run"]), issue("COMMAND_INVALID"));
  assert.throws(
    () => parseBuildArgs(["build", "--output", "x"]),
    issue("ARGUMENT_COUNT_INVALID"),
  );
  assert.throws(
    () =>
      parseBuildArgs([
        "build",
        "--output",
        "x",
        "--output",
        "y",
      ]),
    issue("ARGUMENT_DUPLICATE"),
  );
});

test("paths reject absolute, traversal, normalization, and wrong output identity", () => {
  for (const path of ["/tmp/x", "../x", "a/../x", "a/./x", "a\\x"]) {
    assert.throws(() => normalizedRelativePath(path), issue("PATH_INVALID"));
  }
  assert.throws(
    () =>
      validateOutputLogicalPath(
        "generated/runs/SWU-OEWTP-003/20260729T184000Z/thin-prototype-build-handle.json",
      ),
    issue("OUTPUT_PATH_INVALID"),
  );
  assert.equal(
    validateOutputLogicalPath(
      "generated/runs/SWU-OEWTP-002/20260729T184000Z/thin-prototype-build-handle.json",
    ).attemptId,
    "20260729T184000Z",
  );
  assert.equal(
    validateSemanticOutputLogicalPath(
      "generated/runs/SWU-OEWSN-004/20260802T022042Z/semantic-navigation-build-handle.json",
    ).attemptId,
    "20260802T022042Z",
  );
  assert.throws(
    () =>
      validateSemanticOutputLogicalPath(
        "generated/runs/SWU-OEWTP-002/20260802T022042Z/semantic-navigation-build-handle.json",
      ),
    issue("SEMANTIC_OUTPUT_PATH_INVALID"),
  );
});

test("semantic binding and typed discovery are exact and fail closed", () => {
  const sha256 = "a".repeat(64);
  const bound = (path) => ({path, sha256, size_bytes: 1});
  const legacyFiles = [
    "src/oew/EvidenceInspector.test.tsx",
    "src/oew/PokerTour.test.tsx",
    "src/oew/TrustRail.test.tsx",
    "src/oew/navigation.test.tsx",
    "src/oew/responsive.test.tsx",
    "src/oew/viewParity.test.ts",
  ];
  const semanticFiles = [...legacyFiles, "src/oew/relationPresentation.test.ts"];
  const binding = {
    schema_version: "oew.semantic-navigation-build-binding.v1",
    binding_id: "oewsn-build/SWU-OEWSN-004",
    owner_swu: "SWU-OEWSN-004",
    authority_effect: "none",
    historical_base: {
      l1_build_lock: bound("upstream/L1-BUILD.lock.json"),
      overlay_manifest: bound("upstream/overlay/overlay-manifest.json"),
      first_working_manifest: bound(
        "upstream/overlay/first-working-version-manifest.json",
      ),
      patches: [
        bound("upstream/patches/0001-oew-entrypoint.patch"),
        bound("upstream/patches/0002-knowledge-focus-scene.patch"),
      ],
    },
    builder: {
      mode: "build-semantic-navigation",
      source: bound("scripts/build-thin-prototype.mjs"),
      test: bound("test/thin-prototype-build.test.mjs"),
    },
    additive_overlay: {
      apply_order: "after-historical-overlay-before-historical-patches",
      collision_policy: "reject",
      files: [
        {
          ...bound(
            "upstream/overlay/packages/dashboard/src/oew/relationPresentation.ts",
          ),
          destination:
            "understand-anything-plugin/packages/dashboard/src/oew/relationPresentation.ts",
        },
        {
          ...bound(
            "upstream/overlay/packages/dashboard/src/oew/relationPresentation.test.ts",
          ),
          destination:
            "understand-anything-plugin/packages/dashboard/src/oew/relationPresentation.test.ts",
        },
      ],
    },
    typed_test_contract: {
      expected_file_count: 7,
      expected_test_count: 7,
      files: semanticFiles,
    },
    package_manifest_inventory: {
      count: 46,
      path_inventory_sha256: sha256,
      byte_inventory_sha256: sha256,
    },
  };
  assert.equal(validateSemanticBinding(binding), binding);
  assert.throws(
    () => validateSemanticBinding({...binding, owner_swu: "wrong"}),
    issue("SEMANTIC_BINDING_INVALID"),
  );
  assert.throws(
    () =>
      validateSemanticBinding({
        ...binding,
        additive_overlay: {
          ...binding.additive_overlay,
          files: [
            binding.additive_overlay.files[0],
            {
              ...binding.additive_overlay.files[1],
              destination: binding.additive_overlay.files[0].destination,
            },
          ],
        },
      }),
    issue("SEMANTIC_ADDITIVE_FILES_INVALID"),
  );
  const stdout = `${semanticFiles.join("\n")}\nTest Files  7 passed (7)\nTests  7 passed (7)\n`;
  assert.equal(exactTypedDiscovery(stdout, semanticFiles).file_count, 7);
  assert.throws(
    () => exactTypedDiscovery(stdout.replace("7 passed", "6 passed"), semanticFiles),
    issue("TYPED_TEST_DISCOVERY_INVALID"),
  );
});

test("predecessor receipt rejects failure, partial inventory, and diagnostics", () => {
  const valid = {
    schema_version: "oewtp.task-session-receipt.v1",
    swu_id: "SWU-OEWTP-001",
    result: "pass",
    files_touched: ["1", "2", "3", "4", "5"],
    validation: {
      strict_typescript: { after_diagnostics: 0 },
      typed_oew_tests: { failed: 0 },
      package_manifest_inventory: { result: "pass" },
    },
  };
  assert.equal(validateTypedReceipt(valid), true);
  for (const changed of [
    { result: "block" },
    { files_touched: ["1"] },
    { validation: { ...valid.validation, strict_typescript: { after_diagnostics: 1 } } },
  ]) {
    assert.throws(
      () => validateTypedReceipt({ ...valid, ...changed }),
      issue("TYPED_RECEIPT_INVALID"),
    );
  }
});

test("patch bindings retain declared order and reject incomplete or duplicate rows", () => {
  const digest = "a".repeat(64);
  const secondDigest = "b".repeat(64);
  const patches = [
    {
      path: "upstream/patches/0001.patch",
      target: "src/App.tsx",
      sha256: digest,
      preimage_sha256: digest,
      postimage_sha256: secondDigest,
      apply_exactly_once: true,
    },
    {
      path: "upstream/patches/0002.patch",
      target: "src/View.tsx",
      sha256: secondDigest,
      preimage_sha256: digest,
      postimage_sha256: secondDigest,
      apply_exactly_once: true,
    },
  ];
  assert.deepEqual(
    validatePatchSpecs(patches).map(({path}) => path),
    ["upstream/patches/0001.patch", "upstream/patches/0002.patch"],
  );
  assert.throws(() => validatePatchSpecs([]), issue("PATCH_BINDINGS_MISSING"));
  assert.throws(
    () => validatePatchSpecs([patches[0], patches[0]]),
    issue("PATCH_BINDING_INVALID"),
  );
  assert.throws(
    () => validatePatchSpecs([{...patches[0], apply_exactly_once: false}]),
    issue("PATCH_BINDING_INVALID"),
  );
});

test("only the two typed manifests may rebind through the focus build lock", () => {
  const typed = "a".repeat(64);
  const overlay = "b".repeat(64);
  const first = "c".repeat(64);
  const lock = {
    feature_inputs: {
      swu_007: {overlay_manifest: {sha256: overlay}},
      swu_008f: {first_working_version_manifest: {sha256: first}},
    },
  };
  assert.equal(
    expectedTypedSourceDigest(
      "root/upstream/overlay/overlay-manifest.json",
      typed,
      lock,
    ),
    overlay,
  );
  assert.equal(
    expectedTypedSourceDigest(
      "root/upstream/overlay/first-working-version-manifest.json",
      typed,
      lock,
    ),
    first,
  );
  assert.equal(
    expectedTypedSourceDigest("root/upstream/overlay/src/oew/store.ts", typed, lock),
    typed,
  );
  assert.throws(
    () =>
      expectedTypedSourceDigest(
        "root/upstream/overlay/overlay-manifest.json",
        typed,
        {},
      ),
    issue("BUILD_LOCK_REBINDING_MISSING"),
  );
});

test("tree identity is stable and rejects symlinked outputs", async () => {
  const root = await mkdtemp(join(tmpdir(), "oewtp-build-test-"));
  try {
    await mkdir(join(root, "assets"));
    await writeFile(join(root, "index.html"), "ok\n");
    await writeFile(join(root, "assets/app.js"), "app\n");
    const first = await treeIdentity(root);
    const second = await treeIdentity(root);
    assert.deepEqual(first, second);
    assert.equal(first.file_count, 2);
    await symlink(join(root, "index.html"), join(root, "assets/link"));
    await assert.rejects(() => treeIdentity(root), issue("TREE_SYMLINK"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
