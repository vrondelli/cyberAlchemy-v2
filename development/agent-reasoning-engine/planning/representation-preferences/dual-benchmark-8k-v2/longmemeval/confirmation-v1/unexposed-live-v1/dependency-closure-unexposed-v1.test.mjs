import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {collectExecutableClosure, collectPlanningTree} from "./dependency-closure-unexposed-v1.mjs";

test("recursive closure includes transitive static and literal dynamic imports and rejects bare imports", () => {
  const root = mkdtempSync(join(tmpdir(), "g03-closure-")); try {
    writeFileSync(join(root, "a.mjs"), "import './b.mjs'; await import('./c.json');\n"); writeFileSync(join(root, "b.mjs"), "export {x} from './d.js';\n"); writeFileSync(join(root, "c.json"), "{}\n"); writeFileSync(join(root, "d.js"), "export const x=1;\n");
    const closure = collectExecutableClosure([join(root, "a.mjs")]); assert.deepEqual(closure.files.map((item) => item.path), ["a.mjs", "b.mjs", "c.json", "d.js"].map((name) => resolve(root, name)).sort()); assert.match(closure.tree_sha256, /^[a-f0-9]{64}$/);
    writeFileSync(join(root, "bad.mjs"), "import x from 'not-node-bare';\n"); assert.throws(() => collectExecutableClosure([join(root, "bad.mjs")]), /import-unresolved/);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("planning tree is an exact 315-file whitelist", () => {
  const root = resolve(import.meta.dirname, "../../../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/longmemeval-unexposed-planning-v1"), tree = collectPlanningTree(root);
  assert.equal(tree.files.length, 315); assert.equal(tree.whitelist.exact_file_count, 315); assert.match(tree.tree_sha256, /^[a-f0-9]{64}$/);
});
