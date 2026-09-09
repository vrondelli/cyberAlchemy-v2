import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import type { InstantiationPlanV1 } from "../../src/generation/contracts.ts";
import { PublicationError, publishInstantiation } from "../../src/generation/publish-instantiation.ts";
import { sha256 } from "../../src/input/source-manifest.ts";
import { testPlan } from "../helpers/plans.ts";

function sandbox(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "mtcli-publish-"));
}

function clean(root: string): void {
  assert.equal(root.startsWith(path.join(os.tmpdir(), "mtcli-publish-")), true);
  fs.rmSync(root, { recursive: true, force: true });
}

function expectCode(action: () => unknown, code: string): void {
  assert.throws(action, (error) => error instanceof PublicationError && error.code === code);
}

test("publication atomically creates the declared target and receipt", () => {
  const root = sandbox();
  const target = path.join(root, "target");
  try {
    const result = publishInstantiation(testPlan("Entity"), target);
    assert.equal(result.target_root, target);
    assert.equal(fs.existsSync(path.join(target, result.receipt_path)), true);
    assert.equal(fs.readFileSync(path.join(target, result.receipt.artifacts[0]!.relative_path), "utf8").includes("export class Account"), true);
    assert.deepEqual(fs.readdirSync(root), ["target"]);
  } finally {
    clean(root);
  }
});

test("traversal, overwrite, and symlinked parents fail closed", () => {
  const root = sandbox();
  try {
    const plan = testPlan("Entity");
    const artifact = plan.artifacts[0]!;
    const traversal = { ...plan, artifacts: [{ ...artifact, relative_path: "../escape.ts" }] } as InstantiationPlanV1;
    expectCode(() => publishInstantiation(traversal, path.join(root, "traversal")), "MTCLI_PUBLISH_PATH");
    assert.equal(fs.existsSync(path.join(root, "escape.ts")), false);

    const existing = path.join(root, "existing");
    fs.mkdirSync(existing);
    fs.writeFileSync(path.join(existing, "sentinel"), "preserve");
    expectCode(() => publishInstantiation(plan, existing), "MTCLI_PUBLISH_EXISTS");
    assert.equal(fs.readFileSync(path.join(existing, "sentinel"), "utf8"), "preserve");

    const realParent = path.join(root, "real-parent");
    const aliasParent = path.join(root, "alias-parent");
    fs.mkdirSync(realParent);
    fs.symlinkSync(realParent, aliasParent, "dir");
    expectCode(() => publishInstantiation(plan, path.join(aliasParent, "target")), "MTCLI_PUBLISH_SYMLINK");
  } finally {
    clean(root);
  }
});

test("a staging failure leaves no target or staging residue", () => {
  const root = sandbox();
  const target = path.join(root, "target");
  try {
    const plan = testPlan("Entity");
    const first = { relative_path: "collision", content: "file", size_bytes: 4, sha256: sha256("file") };
    const second = { relative_path: "collision/child", content: "child", size_bytes: 5, sha256: sha256("child") };
    const hostile = { ...plan, artifacts: [first, second] } as InstantiationPlanV1;
    expectCode(() => publishInstantiation(hostile, target), "MTCLI_PUBLISH_ATOMIC");
    assert.equal(fs.existsSync(target), false);
    assert.deepEqual(fs.readdirSync(root), []);
  } finally {
    clean(root);
  }
});
