import assert from "node:assert/strict";
import {mkdtempSync, mkdirSync, rmSync, symlinkSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";

import {resolveHostedEffectRoot} from "../src/hosted-effect-root.mjs";

test("hosted effect root is explicit and confined to the selected source subtree", () => {
  const source = mkdtempSync(join(tmpdir(), "are-hosted-root-"));
  try {
    const selected = join(source, "selected");
    const sibling = join(source, "sibling");
    const alias = join(source, "selected-alias");
    mkdirSync(selected);
    mkdirSync(sibling);
    symlinkSync(selected, alias);
    const result = resolveHostedEffectRoot({repository_root: source, effect_root: selected});
    assert.equal(result.root, selected);
    assert.match(result.sha256, /^[0-9a-f]{64}$/);
    assert.throws(() => resolveHostedEffectRoot({repository_root: source}),
      /hosted-effect.root-absolute-required/);
    assert.throws(() => resolveHostedEffectRoot({repository_root: selected, effect_root: sibling}),
      /hosted-effect.root-outside-source/);
    assert.throws(() => resolveHostedEffectRoot({repository_root: source, effect_root: alias}),
      /hosted-effect.root-invalid/);
  } finally { rmSync(source, {recursive: true, force: true}); }
});
