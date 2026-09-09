import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  ThinBuildError,
  normalizedRelativePath,
  parseBuildArgs,
  treeIdentity,
  validateOutputLogicalPath,
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
      typedReceipt: "cyberAlchemy-v2/development/receipt.json",
      output:
        "generated/runs/SWU-OEWTP-002/20260729T184000Z/thin-prototype-build-handle.json",
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
