import assert from "node:assert/strict";
import {mkdtempSync, mkdirSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";

import {freezeProductCandidate} from "../scripts/freeze-product-candidate.mjs";

test("current coding-agent candidate excludes discontinued TUI bytes", () => {
  const root = mkdtempSync(join(tmpdir(), "are-runtime-candidate-"));
  try {
    const runtime = join(root, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/coding-agent-runtime");
    const tui = join(root, "cyberAlchemy-v2/implementation/cyberalchemy-tui");
    mkdirSync(runtime, {recursive: true});
    mkdirSync(tui, {recursive: true});
    writeFileSync(join(runtime, "runtime.mjs"), "export const runtime = true;\n");
    const before = freezeProductCandidate({repository_root: root});
    assert.equal(before.schema_version, "cav2.coding-agent-product-candidate/v2");
    assert.deepEqual(Object.keys(before.files), ["cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/coding-agent-runtime/runtime.mjs"]);
    writeFileSync(join(tui, "retired.mjs"), "export const retired = true;\n");
    const after = freezeProductCandidate({repository_root: root});
    assert.equal(after.source_set_digest, before.source_set_digest);
    assert.equal(after.source_file_count, before.source_file_count);
    assert.deepEqual(after.files, before.files);
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});
