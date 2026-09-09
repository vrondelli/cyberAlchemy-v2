import assert from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  ThinBuildError,
  exactTypedDiscovery,
  expectedTypedSourceDigest,
  normalizedRelativePath,
  parseBuildArgs,
  renderVitestConfig,
  runTypedGate,
  sanitizeDiagnosticStream,
  selectBuildTerminal,
  sha256,
  treeIdentity,
  validateFailureEvidenceRecord,
  validateOutputLogicalPath,
  validatePatchSpecs,
  validateSemanticBinding,
  validateSemanticOutputLogicalPath,
  validateTypedTestContract,
  validateTypedReceipt,
  validateUnifiedDiffTargets,
  verifySemanticPatchTargetStates,
  writeFailureEvidence,
  writeSemanticPatchSnapshot,
} from "../scripts/build-thin-prototype.mjs";

const issue = (expected) => (error) =>
  error instanceof ThinBuildError && error.issue === expected;

const fixtureDigest = "a".repeat(64);
const fixtureDigestB = "b".repeat(64);
const fixtureDigestC = "c".repeat(64);
const fixtureEmptyDigest = sha256("");
const fixtureBound = (path) => ({
  path,
  sha256: fixtureDigest,
  size_bytes: 1,
});
const fixtureLegacyTypedFiles = [
  "src/oew/EvidenceInspector.test.tsx",
  "src/oew/PokerTour.test.tsx",
  "src/oew/TrustRail.test.tsx",
  "src/oew/navigation.test.tsx",
  "src/oew/responsive.test.tsx",
  "src/oew/viewParity.test.ts",
];
const fixtureSemanticTypedFiles = [
  ...fixtureLegacyTypedFiles,
  "src/oew/relationPresentation.test.ts",
];

function semanticV1Fixture() {
  return {
    schema_version: "oew.semantic-navigation-build-binding.v1",
    binding_id: "oewsn-build/SWU-OEWSN-004",
    owner_swu: "SWU-OEWSN-004",
    authority_effect: "none",
    historical_base: {
      l1_build_lock: fixtureBound("upstream/L1-BUILD.lock.json"),
      overlay_manifest: fixtureBound(
        "upstream/overlay/overlay-manifest.json",
      ),
      first_working_manifest: fixtureBound(
        "upstream/overlay/first-working-version-manifest.json",
      ),
      patches: [
        fixtureBound("upstream/patches/0001-oew-entrypoint.patch"),
        fixtureBound("upstream/patches/0002-knowledge-focus-scene.patch"),
      ],
    },
    builder: {
      mode: "build-semantic-navigation",
      source: fixtureBound("scripts/build-thin-prototype.mjs"),
      test: fixtureBound("test/thin-prototype-build.test.mjs"),
    },
    additive_overlay: {
      apply_order: "after-historical-overlay-before-historical-patches",
      collision_policy: "reject",
      files: [
        {
          ...fixtureBound(
            "upstream/overlay/packages/dashboard/src/oew/relationPresentation.ts",
          ),
          destination:
            "understand-anything-plugin/packages/dashboard/src/oew/relationPresentation.ts",
        },
        {
          ...fixtureBound(
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
      files: fixtureSemanticTypedFiles,
    },
    package_manifest_inventory: {
      count: 46,
      path_inventory_sha256: fixtureDigest,
      byte_inventory_sha256: fixtureDigest,
    },
  };
}

function semanticV2Fixture() {
  const predecessorBinding = semanticV1Fixture();
  const predecessorArtifact = {
    path: "upstream/OEWSN-BUILD.binding.json",
    sha256: fixtureDigestB,
    size_bytes: 5312,
  };
  const binding = {
    schema_version: "oew.semantic-navigation-build-binding.v2",
    binding_id: "oewsn-build/SWU-OEWSN-005",
    owner_swu: "SWU-OEWSN-005",
    authority_effect: "none",
    predecessor_binding: {...predecessorArtifact},
    historical_base: structuredClone(predecessorBinding.historical_base),
    builder: {
      mode: "build-semantic-navigation",
      source: fixtureBound("scripts/build-thin-prototype.mjs"),
      test: fixtureBound("test/thin-prototype-build.test.mjs"),
    },
    additive_overlay: structuredClone(predecessorBinding.additive_overlay),
    semantic_patches: {
      apply_order: "after-historical-patches",
      collision_policy: "reject",
      patches: [
        {
          path: "upstream/patches/0003-selected-edge-evidence.patch",
          sha256: fixtureDigestC,
          size_bytes: 2,
          apply_exactly_once: true,
          targets: [
            {
              path:
                "understand-anything-plugin/packages/dashboard/src/components/KnowledgeGraph.tsx",
              operation: "modify",
              preimage_state: "file",
              postimage_state: "file",
              preimage_sha256: fixtureDigest,
              postimage_sha256: fixtureDigestB,
            },
            {
              path:
                "understand-anything-plugin/packages/dashboard/src/oew/relationRendering.test.ts",
              operation: "create",
              preimage_state: "absent",
              postimage_state: "file",
              preimage_sha256: fixtureEmptyDigest,
              postimage_sha256: fixtureDigestC,
            },
          ],
        },
      ],
    },
    typed_test_contract: {
      expected_file_count: 8,
      expected_test_count: 11,
      files: [
        ...fixtureSemanticTypedFiles,
        "src/oew/selectedEdgeEvidence.test.tsx",
      ],
    },
    package_manifest_inventory: structuredClone(
      predecessorBinding.package_manifest_inventory,
    ),
    output_contract: {
      handle_pattern:
        "generated/runs/SWU-OEWSN-005/<attempt-id>/semantic-navigation-build-handle.json",
      dashboard_dist_pattern:
        "generated/runs/SWU-OEWSN-005/<attempt-id>/dashboard-dist/",
      semantic_patch_snapshot_pattern:
        "generated/runs/SWU-OEWSN-005/<attempt-id>/semantic-patch-snapshot/",
      handle_schema: "oew.semantic-navigation-build-handle.v2",
      collision_policy: "reject",
    },
  };
  const context = {
    predecessorBinding,
    predecessorArtifact,
    outputLogicalPath:
      "generated/runs/SWU-OEWSN-005/20260802T140000Z/semantic-navigation-build-handle.json",
  };
  return {binding, context};
}

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

test("v2 cumulative binding accepts an exact predecessor and bound owner output", () => {
  const {binding, context} = semanticV2Fixture();
  assert.equal(validateSemanticBinding(binding, context), binding);
  assert.equal(
    validateSemanticOutputLogicalPath(
      context.outputLogicalPath,
      binding.owner_swu,
    ).attemptId,
    "20260802T140000Z",
  );
});

test("v2 unified-diff inventory accepts exact ordered modify and create targets", () => {
  const {binding} = semanticV2Fixture();
  const targets = binding.semantic_patches.patches[0].targets;
  const patch = [
    `--- a/${targets[0].path}`,
    `+++ b/${targets[0].path}`,
    "@@ -1 +1 @@",
    "-old",
    "+new",
    "--- /dev/null",
    `+++ b/${targets[1].path}`,
    "@@ -0,0 +1 @@",
    "+created",
    "",
  ].join("\n");
  assert.deepEqual(validateUnifiedDiffTargets(patch, targets), [
    {path: targets[0].path, operation: "modify"},
    {path: targets[1].path, operation: "create"},
  ]);
});

test("v2 unified-diff inventory rejects undeclared, escaping, and mismatched headers", () => {
  const {binding} = semanticV2Fixture();
  const targets = binding.semantic_patches.patches[0].targets;
  const multiFilePatch = [
    `--- a/${targets[0].path}`,
    `+++ b/${targets[0].path}`,
    "@@ -1 +1 @@",
    "-old",
    "+new",
    "--- /dev/null",
    `+++ b/${targets[1].path}`,
    "@@ -0,0 +1 @@",
    "+created",
    "",
  ].join("\n");
  assert.throws(
    () => validateUnifiedDiffTargets(multiFilePatch, targets.slice(0, 1)),
    issue("SEMANTIC_PATCH_TARGET_INVENTORY_DRIFT"),
  );
  assert.throws(
    () =>
      validateUnifiedDiffTargets(
        "--- a/../outside\n+++ b/../outside\n@@ -1 +1 @@\n-x\n+y\n",
        targets,
      ),
    issue("PATH_INVALID"),
  );
  assert.throws(
    () =>
      validateUnifiedDiffTargets(
        `--- a/${targets[0].path}\n+++ b/${targets[1].path}\n@@ -1 +1 @@\n-x\n+y\n`,
        targets,
      ),
    issue("SEMANTIC_PATCH_HEADER_MISMATCH"),
  );
});

test("v2 create target rejects an existing empty file despite its empty digest", async () => {
  const root = await mkdtemp(join(tmpdir(), "oewsn-create-state-"));
  try {
    const {binding} = semanticV2Fixture();
    const target = binding.semantic_patches.patches[0].targets[1];
    const absolute = join(root, target.path);
    await mkdir(join(absolute, ".."), {recursive: true});
    await writeFile(absolute, "");
    await assert.rejects(
      () => verifySemanticPatchTargetStates(root, [target], "preimage"),
      issue("SEMANTIC_PATCH_PREIMAGE_STATE_DRIFT"),
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("v2 semantic patch snapshot copies exact patches and emits a deterministic manifest", async () => {
  const root = await mkdtemp(join(tmpdir(), "oewsn-snapshot-"));
  try {
    const {binding} = semanticV2Fixture();
    const sources = [
      {
        name: "0003-selected-edge-evidence.patch",
        content: "patch-three\n",
        spec: binding.semantic_patches.patches[0],
      },
      {
        name: "0004-path-branch.patch",
        content: "patch-four\n",
        spec: {
          ...structuredClone(binding.semantic_patches.patches[0]),
          path: "upstream/patches/0004-path-branch.patch",
        },
      },
    ];
    const patchBindings = [];
    for (const source of sources) {
      const path = join(root, source.name);
      await writeFile(path, source.content);
      patchBindings.push({
        path,
        spec: source.spec,
        artifact: {
          path: source.spec.path,
          sha256: sha256(source.content),
          size_bytes: Buffer.byteLength(source.content),
        },
      });
    }
    const bindingArtifact = {
      path: "upstream/OEWSN-005.binding.json",
      sha256: fixtureDigest,
      size_bytes: 2,
    };
    const logical =
      "generated/runs/SWU-OEWSN-005/20260802T140000Z/semantic-patch-snapshot";
    const first = await writeSemanticPatchSnapshot({
      snapshotRoot: join(root, "snapshot-one"),
      snapshotLogicalPath: logical,
      containmentRoot: root,
      ownerSwu: binding.owner_swu,
      bindingArtifact,
      semanticPatchBindings: patchBindings,
    });
    const second = await writeSemanticPatchSnapshot({
      snapshotRoot: join(root, "snapshot-two"),
      snapshotLogicalPath: logical,
      containmentRoot: root,
      ownerSwu: binding.owner_swu,
      bindingArtifact,
      semanticPatchBindings: patchBindings,
    });
    assert.equal(first.path, `${logical}/`);
    assert.equal(first.file_count, 3);
    assert.equal(first.tree_sha256, second.tree_sha256);
    const manifest = JSON.parse(
      await readFile(join(root, "snapshot-one/manifest.json"), "utf8"),
    );
    assert.equal(manifest.owner_swu, "SWU-OEWSN-005");
    assert.equal(manifest.patches.length, 2);
    assert.equal(
      await readFile(
        join(root, "snapshot-one/patches/0003-selected-edge-evidence.patch"),
        "utf8",
      ),
      sources[0].content,
    );
    await assert.rejects(
      () =>
        writeSemanticPatchSnapshot({
          snapshotRoot: join(root, "snapshot-one"),
          snapshotLogicalPath: logical,
          containmentRoot: root,
          ownerSwu: binding.owner_swu,
          bindingArtifact,
          semanticPatchBindings: patchBindings,
        }),
      issue("SEMANTIC_PATCH_SNAPSHOT_COLLISION"),
    );
    await assert.rejects(
      () =>
        writeSemanticPatchSnapshot({
          snapshotRoot: join(root, "..", "escaped-snapshot"),
          snapshotLogicalPath: logical,
          containmentRoot: root,
          ownerSwu: binding.owner_swu,
          bindingArtifact,
          semanticPatchBindings: patchBindings,
        }),
      issue("SEMANTIC_PATCH_SNAPSHOT_ESCAPE"),
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("v2 cumulative binding rejects predecessor identity drift", () => {
  const {binding, context} = semanticV2Fixture();
  context.predecessorArtifact.sha256 = fixtureDigestC;
  assert.throws(
    () => validateSemanticBinding(binding, context),
    issue("SEMANTIC_PREDECESSOR_DIGEST_DRIFT"),
  );
});

test("v2 cumulative binding rejects historical-base drift", () => {
  const {binding, context} = semanticV2Fixture();
  binding.historical_base.l1_build_lock.sha256 = fixtureDigestC;
  assert.throws(
    () => validateSemanticBinding(binding, context),
    issue("SEMANTIC_HISTORICAL_BASE_DRIFT"),
  );
});

test("v2 cumulative binding rejects owner identity disagreement", () => {
  const {binding, context} = semanticV2Fixture();
  binding.binding_id = "oewsn-build/SWU-OEWSN-006";
  assert.throws(
    () => validateSemanticBinding(binding, context),
    issue("SEMANTIC_OWNER_INVALID"),
  );
});

test("v2 cumulative binding rejects output identity disagreement", () => {
  const {binding, context} = semanticV2Fixture();
  context.outputLogicalPath =
    "generated/runs/SWU-OEWSN-006/20260802T140000Z/semantic-navigation-build-handle.json";
  assert.throws(
    () => validateSemanticBinding(binding, context),
    issue("SEMANTIC_OUTPUT_PATH_INVALID"),
  );
  const missingSnapshot = semanticV2Fixture();
  delete missingSnapshot.binding.output_contract
    .semantic_patch_snapshot_pattern;
  assert.throws(
    () =>
      validateSemanticBinding(
        missingSnapshot.binding,
        missingSnapshot.context,
      ),
    issue("SEMANTIC_OUTPUT_CONTRACT_INVALID"),
  );
});

test("v2 cumulative binding rejects semantic patch order drift", () => {
  const {binding, context} = semanticV2Fixture();
  binding.semantic_patches.apply_order = "before-historical-patches";
  assert.throws(
    () => validateSemanticBinding(binding, context),
    issue("SEMANTIC_PATCH_ORDER_INVALID"),
  );
});

test("v2 cumulative binding rejects semantic patch path escape", () => {
  const {binding, context} = semanticV2Fixture();
  binding.semantic_patches.patches[0].targets[0].path =
    "packages/dashboard/src/App.tsx";
  assert.throws(
    () => validateSemanticBinding(binding, context),
    issue("SEMANTIC_PATCH_TARGET_INVALID"),
  );
});

test("v2 cumulative binding rejects repeatable semantic patches", () => {
  const {binding, context} = semanticV2Fixture();
  binding.semantic_patches.patches[0].apply_exactly_once = false;
  assert.throws(
    () => validateSemanticBinding(binding, context),
    issue("SEMANTIC_PATCH_BINDING_INVALID"),
  );
});

test("v2 cumulative binding rejects semantic patch collisions", () => {
  const {binding, context} = semanticV2Fixture();
  binding.semantic_patches.patches[0].targets[0].path =
    binding.additive_overlay.files[0].destination;
  assert.throws(
    () => validateSemanticBinding(binding, context),
    issue("SEMANTIC_PATCH_COLLISION"),
  );
});

test("v2 cumulative binding rejects typed count and path drift", () => {
  const countFixture = semanticV2Fixture();
  countFixture.binding.typed_test_contract.expected_file_count = 7;
  assert.throws(
    () =>
      validateSemanticBinding(countFixture.binding, countFixture.context),
    issue("SEMANTIC_TYPED_CONTRACT_INVALID"),
  );
  const pathFixture = semanticV2Fixture();
  pathFixture.binding.typed_test_contract.files[0] = "src/other.test.ts";
  assert.throws(
    () => validateSemanticBinding(pathFixture.binding, pathFixture.context),
    issue("SEMANTIC_TYPED_CONTRACT_INVALID"),
  );
});

test("v2 typed contract isolates one selected DOM file and keeps Node as default", () => {
  const {binding, context} = semanticV2Fixture();
  binding.typed_test_contract.environment_match_globs = [
    {
      file: "src/oew/navigation.test.tsx",
      environment: "jsdom",
      dependency_name: "jsdom",
      dependency_version: "28.1.0",
      manifest_path:
        "understand-anything-plugin/packages/dashboard/package.json",
      lockfile_path: "pnpm-lock.yaml",
    },
  ];
  assert.equal(validateSemanticBinding(binding, context), binding);
  const config = renderVitestConfig(binding.typed_test_contract);
  assert.match(config, /environment: "node"/);
  assert.match(
    config,
    /environmentMatchGlobs: \[\["\*\*\/src\/oew\/navigation\.test\.tsx","jsdom"\]\]/,
  );

  for (const changed of [
    {file: "src/oew/not-selected.test.tsx"},
    {environment: "node", dependency_name: "node"},
    {dependency_version: "latest"},
    {lockfile_path: "understand-anything-plugin/pnpm-lock.yaml"},
  ]) {
    const invalid = structuredClone(binding.typed_test_contract);
    invalid.environment_match_globs[0] = {
      ...invalid.environment_match_globs[0],
      ...changed,
    };
    assert.throws(
      () => validateTypedTestContract(invalid),
      issue("SEMANTIC_TYPED_ENVIRONMENT_INVALID"),
    );
  }
});

test("v2 semantic patches admit only the exact workspace root lockfile", () => {
  const {binding, context} = semanticV2Fixture();
  binding.semantic_patches.patches[0].targets.push({
    path: "pnpm-lock.yaml",
    operation: "modify",
    preimage_state: "file",
    postimage_state: "file",
    preimage_sha256: fixtureDigestB,
    postimage_sha256: fixtureDigestC,
  });
  assert.equal(validateSemanticBinding(binding, context), binding);

  const invalid = semanticV2Fixture();
  invalid.binding.semantic_patches.patches[0].targets.push({
    path: "package.json",
    operation: "modify",
    preimage_state: "file",
    postimage_state: "file",
    preimage_sha256: fixtureDigestB,
    postimage_sha256: fixtureDigestC,
  });
  assert.throws(
    () => validateSemanticBinding(invalid.binding, invalid.context),
    issue("SEMANTIC_PATCH_TARGET_INVALID"),
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

test("failure diagnostics are deterministic, bounded, redacted, and digest-bound", () => {
  const exact = "x".repeat(64);
  const exactResult = sanitizeDiagnosticStream(exact, {maxBytes: 64});
  assert.equal(exactResult.truncated, false);
  assert.equal(exactResult.retained_text, exact);
  assert.equal(exactResult.original_sha256, sha256(exact));

  const oversized = sanitizeDiagnosticStream(
    `prefix TOKEN=synthetic-secret ${"middle".repeat(40)} /tmp/oew-private/work stderr-tail`,
    {maxBytes: 96},
  );
  assert.equal(oversized.truncated, true);
  assert.ok(oversized.retained_size_bytes <= 96);
  assert.match(oversized.retained_text, /truncated [0-9]+ bytes/);
  assert.doesNotMatch(oversized.retained_text, /synthetic-secret/);
  assert.doesNotMatch(oversized.retained_text, /\/tmp\/oew-private/);
  assert.equal(oversized.redaction_version, "oew-diagnostic-redaction.v1");

  const invalidUtf8 = sanitizeDiagnosticStream(Buffer.from([0xc3, 0x28]), {
    maxBytes: 64,
  });
  assert.equal(invalidUtf8.original_size_bytes, 2);
  assert.match(invalidUtf8.retained_text, /\uFFFD\(/);
  assert.throws(
    () => sanitizeDiagnosticStream("x", {maxBytes: 8}),
    issue("DIAGNOSTIC_LIMIT_INVALID"),
  );
});

test("failure evidence writer is contained, exclusive, reread-verified, and fail-closed", async () => {
  const root = await mkdtemp(join(tmpdir(), "oewfr-writer-test-"));
  const outside = await mkdtemp(join(tmpdir(), "oewfr-writer-outside-"));
  const commandResult = {
    id: "typed-tests",
    program: "/opt/node/bin/node",
    args: ["vitest", "run", "TOKEN=synthetic-secret"],
    cwd: "/tmp/private-workroot",
    exit_code: 1,
    duration_ms: 17,
    stdout: "ReferenceError: document is not defined\n",
    stderr: "AUTH_TOKEN=synthetic-secret /tmp/private-workroot/file.ts\n",
  };
  const admittedOutput = {
    root,
    path: "runs/attempt-1/failure-evidence.json",
    schema_version: "oew.failure-evidence.v1",
    producer: "private-oew-builder",
    gate: "typed-tests",
    issue: "TYPED_TESTS_FAILED",
    max_stream_bytes: 256,
    max_artifact_bytes: 8192,
  };
  const input = {
    commandResult,
    admittedOutput,
    binding: {
      path: "upstream/OEWSN-BUILD.SWU-OEWSN-006.binding.json",
      sha256: fixtureDigest,
      size_bytes: 1,
    },
    authorization: {
      authorization_id: "fixture-one-attempt",
      attempts_allowed: 1,
      attempts_used: 1,
      consumed: true,
      retry_authorized: false,
    },
    cleanupIntent: "remove-workroot-and-isolated-store",
  };
  try {
    const reference = await writeFailureEvidence(input);
    assert.equal(reference.status, "available");
    assert.equal(reference.path, admittedOutput.path);
    const persisted = JSON.parse(
      await readFile(join(root, admittedOutput.path), "utf8"),
    );
    assert.equal(validateFailureEvidenceRecord(persisted, admittedOutput), true);
    assert.equal(persisted.command.program, "node");
    assert.equal(persisted.command.cwd, undefined);
    assert.equal(persisted.environment, undefined);
    assert.equal(persisted.authorization.retry_authorized, false);
    assert.doesNotMatch(JSON.stringify(persisted), /synthetic-secret/);
    assert.doesNotMatch(JSON.stringify(persisted), /private-workroot/);

    await assert.rejects(
      () => writeFailureEvidence(input),
      issue("FAILURE_EVIDENCE_COLLISION"),
    );
    await assert.rejects(
      () =>
        writeFailureEvidence({
          ...input,
          admittedOutput: {...admittedOutput, path: "../escape.json"},
        }),
      issue("PATH_INVALID"),
    );
    await symlink(outside, join(root, "linked"));
    await assert.rejects(
      () =>
        writeFailureEvidence({
          ...input,
          admittedOutput: {...admittedOutput, path: "linked/evidence.json"},
        }),
      issue("SYMLINK_ANCESTOR"),
    );

    const mismatchPath = "runs/attempt-2/failure-evidence.json";
    await assert.rejects(
      () =>
        writeFailureEvidence(
          {
            ...input,
            admittedOutput: {...admittedOutput, path: mismatchPath},
          },
          {readFile: async () => Buffer.from("{}\n")},
        ),
      issue("FAILURE_EVIDENCE_REREAD_MISMATCH"),
    );
    await assert.rejects(() => readFile(join(root, mismatchPath)), /ENOENT/);
  } finally {
    await rm(root, {recursive: true, force: true});
    await rm(outside, {recursive: true, force: true});
  }
});

test("typed gate uses injected collaborators, stops on nonzero, and returns one safe reference", async () => {
  const root = await mkdtemp(join(tmpdir(), "oewfr-typed-gate-test-"));
  const expectedFiles = ["src/oew/navigation.test.tsx"];
  const passStdout = `${expectedFiles[0]}\nTest Files  1 passed (1)\nTests  1 passed (1)\n`;
  const calls = [];
  const observed = [];
  const resultFor = (exitCode, stdout, stderr = "") => ({
    id: "typed-tests",
    program: "/opt/node/bin/node",
    args: ["vitest", "run", ...expectedFiles],
    cwd: "/tmp/isolated-source",
    exit_code: exitCode,
    duration_ms: 23,
    stdout,
    stderr,
  });
  const runner = async (...args) => {
    calls.push(args);
    return resultFor(0, passStdout);
  };
  let writerCalls = 0;
  try {
    const passing = await runTypedGate({
      commandRunner: runner,
      failureEvidenceWriter: async () => {
        writerCalls += 1;
      },
      program: "/opt/node/bin/node",
      args: ["vitest", "run", ...expectedFiles],
      cwd: "/tmp/isolated-source",
      expectedFiles,
      expectedTestCount: 1,
      onCommandResult: (value) => observed.push(value.id),
    });
    assert.equal(calls.length, 1);
    assert.deepEqual(observed, ["typed-tests"]);
    assert.equal(writerCalls, 0);
    assert.equal(passing.typedDiscovery.failed, 0);

    const admittedOutput = {
      root,
      path: "runs/failure/failure-evidence.json",
      schema_version: "oew.failure-evidence.v1",
      producer: "private-oew-builder",
      gate: "typed-tests",
      issue: "TYPED_TESTS_FAILED",
      max_stream_bytes: 256,
      max_artifact_bytes: 8192,
    };
    const failingCalls = [];
    let typedError;
    await assert.rejects(
      () =>
        runTypedGate({
          commandRunner: async (...args) => {
            failingCalls.push(args);
            return resultFor(
              1,
              "ReferenceError: document is not defined\n",
              "TOKEN=synthetic-secret /tmp/isolated-source/navigation.test.tsx\n",
            );
          },
          program: "/opt/node/bin/node",
          args: ["vitest", "run", ...expectedFiles],
          cwd: "/tmp/isolated-source",
          expectedFiles,
          expectedTestCount: 1,
          failureEvidence: {
            admittedOutput,
            binding: {
              path: "upstream/OEWSN-BUILD.SWU-OEWSN-006.binding.json",
              sha256: fixtureDigest,
              size_bytes: 1,
            },
            authorization: {
              authorization_id: "fixture-consumed",
              attempts_allowed: 1,
              attempts_used: 1,
              consumed: true,
              retry_authorized: false,
            },
          },
        }),
      (error) => {
        typedError = error;
        return issue("TYPED_TESTS_FAILED")(error);
      },
    );
    assert.equal(failingCalls.length, 1);
    assert.equal(typedError.evidence_reference.status, "available");
    assert.equal(typedError.evidence_reference.path, admittedOutput.path);
    assert.equal(
      JSON.parse(await readFile(join(root, admittedOutput.path), "utf8")).result,
      "block",
    );

    let emptyWriterCalls = 0;
    await assert.rejects(
      () =>
        runTypedGate({
          commandRunner: async () => resultFor(1, "", "  \n"),
          failureEvidenceWriter: async () => {
            emptyWriterCalls += 1;
          },
          program: "node",
          args: [],
          cwd: "/tmp/isolated-source",
          expectedFiles,
          expectedTestCount: 1,
        }),
      issue("DIAGNOSTIC_EVIDENCE_MISSING"),
    );
    assert.equal(emptyWriterCalls, 0);

    await assert.rejects(
      () =>
        runTypedGate({
          commandRunner: async () => resultFor(1, "failure\n"),
          failureEvidenceWriter: async () => {
            throw new Error("disk unavailable");
          },
          program: "node",
          args: [],
          cwd: "/tmp/isolated-source",
          expectedFiles,
          expectedTestCount: 1,
        }),
      issue("FAILURE_EVIDENCE_PERSIST_FAILED"),
    );
    await assert.rejects(
      () =>
        runTypedGate({
          commandRunner: async () => {
            throw new Error("runner unavailable");
          },
          program: "node",
          args: [],
          cwd: "/tmp/isolated-source",
          expectedFiles,
          expectedTestCount: 1,
        }),
      issue("COMMAND_RUNNER_FAILED"),
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("cleanup failure is strongest while typed evidence survives terminal precedence", () => {
  const evidenceReference = {
    status: "available",
    path: "generated/runs/SWU-OEWSN-006/attempt/failure-evidence.json",
    sha256: fixtureDigest,
    size_bytes: 1,
    schema_version: "oew.failure-evidence.v1",
    producer: "private-oew-builder",
    gate: "typed-tests",
    issue: "TYPED_TESTS_FAILED",
    unavailable_reason: null,
  };
  const typedError = new ThinBuildError("TYPED_TESTS_FAILED", "", {
    evidenceReference,
  });
  const cleanFailureState = {
    finally_executed: true,
    workroot_removed: true,
    isolated_store_removed: true,
    retained_dist_preserved: false,
    semantic_patch_snapshot_preserved: null,
  };
  assert.throws(
    () =>
      selectBuildTerminal({
        handleBody: null,
        primaryError: typedError,
        cleanupState: cleanFailureState,
      }),
    (error) =>
      issue("TYPED_TESTS_FAILED")(error) &&
      error.evidence_reference.path === evidenceReference.path,
  );
  assert.throws(
    () =>
      selectBuildTerminal({
        handleBody: null,
        primaryError: typedError,
        cleanupError: new Error("remove failed"),
        cleanupState: {...cleanFailureState, workroot_removed: false},
      }),
    (error) =>
      issue("CLEANUP_FAILED")(error) &&
      error.evidence_reference.path === evidenceReference.path,
  );
  assert.throws(
    () =>
      selectBuildTerminal({
        handleBody: null,
        primaryError: new ThinBuildError("FAILURE_EVIDENCE_PERSIST_FAILED"),
        cleanupState: cleanFailureState,
      }),
    issue("FAILURE_EVIDENCE_PERSIST_FAILED"),
  );
  const handle = {result: "pass"};
  assert.equal(
    selectBuildTerminal({
      handleBody: handle,
      cleanupState: {
        ...cleanFailureState,
        retained_dist_preserved: true,
      },
    }),
    handle,
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
