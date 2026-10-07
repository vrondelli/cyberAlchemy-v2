import assert from "node:assert/strict";
import {mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {test} from "node:test";
import {bindSourceTree} from "./prepare-campaign.mjs";

test("full source tree binding detects added, changed, and symlinked files", () => {
  const root = mkdtempSync(join(tmpdir(), "g01-source-tree-"));
  try {
    mkdirSync(join(root, "module"));
    writeFileSync(join(root, "module", "a.mjs"), "export const a = 1;\n");
    const initial = bindSourceTree(root);
    assert.equal(initial.file_count, 1);
    assert.equal(initial.sources[0].path, join(root, "module", "a.mjs"));
    writeFileSync(join(root, "module", "a.mjs"), "export const a = 2;\n");
    assert.notEqual(bindSourceTree(root).tree_sha256, initial.tree_sha256);
    writeFileSync(join(root, "module", "b.py"), "pass\n");
    assert.equal(bindSourceTree(root).file_count, 2);
    mkdirSync(join(root, "module", "__pycache__"));
    writeFileSync(join(root, "module", "__pycache__", "b.cpython-314.pyc"), "generated");
    assert.equal(bindSourceTree(root).file_count, 2);
    symlinkSync(join(root, "module", "a.mjs"), join(root, "link.mjs"));
    assert.throws(() => bindSourceTree(root), /source-tree-symlink/);
  } finally {rmSync(root, {recursive: true, force: true});}
});
