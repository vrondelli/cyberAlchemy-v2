# SWU-UOVA-001 test-loader repair proposal

Target: `cyberAlchemy-v2/implementation/ontology-evidence-workbench/package.json`

Baseline SHA-256: `a1719f598dd49f6a74413491ebc058e779de65691bc98d82854c1a5095f6d004`

Baseline size: `2376` bytes

Proposed postimage SHA-256: `4359890ef94739124c7be5cd4c8317db291e21dce958735196144098d5dc877a`

Proposed postimage size: `2423` bytes

```diff
--- a/cyberAlchemy-v2/implementation/ontology-evidence-workbench/package.json
+++ b/cyberAlchemy-v2/implementation/ontology-evidence-workbench/package.json
@@
   "engines": {
-    "node": ">=22"
+    "node": ">=22.6"
   },
   "scripts": {
-    "test": "node --test",
+    "test": "node --experimental-strip-types --test \"**/*.test.mjs\"",
```

The quoted `.test.mjs` glob preserves the current 127-test inventory, including candidate-local staged `.mjs` evidence, while excluding upstream `.test.ts` files owned by Vitest. The Node floor is tightened because built-in type stripping was introduced during Node 22 rather than at 22.0.

No source behavior, test assertion, dependency, ontology, or generated Body War file changes.

## Required validation after apply

```sh
node --experimental-strip-types --test cyberAlchemy-v2/implementation/ontology-evidence-workbench/test/focus-scene.test.mjs
npm --prefix cyberAlchemy-v2/implementation/ontology-evidence-workbench test
git diff --check -- cyberAlchemy-v2/implementation/ontology-evidence-workbench/package.json
```

Expected full-suite measurement on the current tree: 127 total, 126 passed, 0 failed, 1 skipped.
