import {createHash} from "node:crypto";
import {lstatSync, realpathSync, statSync} from "node:fs";
import {isAbsolute, relative, sep} from "node:path";

// The profile source root may contain several checkouts. A hosted command
// needs a separately selected canonical sandbox root, never an implicit
// fallback to that source root.
export function resolveHostedEffectRoot({repository_root: repositoryRoot, effect_root: effectRoot} = {}) {
  if (typeof repositoryRoot !== "string" || !isAbsolute(repositoryRoot)
    || typeof effectRoot !== "string" || !isAbsolute(effectRoot)) {
    throw new Error("hosted-effect.root-absolute-required");
  }
  let source, selected;
  try {
    source = realpathSync(repositoryRoot);
    selected = realpathSync(effectRoot);
    if (!statSync(source).isDirectory() || !statSync(selected).isDirectory()
      || lstatSync(effectRoot).isSymbolicLink() || selected !== effectRoot) {
      throw new Error("invalid-directory");
    }
  } catch { throw new Error("hosted-effect.root-invalid"); }
  const path = relative(source, selected);
  if (path === ".." || path.startsWith(`..${sep}`) || isAbsolute(path)) {
    throw new Error("hosted-effect.root-outside-source");
  }
  return Object.freeze({root: selected,
    sha256: createHash("sha256").update(selected).digest("hex")});
}
