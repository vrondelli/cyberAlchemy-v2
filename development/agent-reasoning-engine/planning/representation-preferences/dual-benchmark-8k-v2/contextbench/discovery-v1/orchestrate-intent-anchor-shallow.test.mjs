import test from "node:test";
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {existsSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {prepareIsolatedShallowSourceCheckout} from "./orchestrate-intent-anchor-r3.mjs";

const git = (cwd, ...args) => execFileSync("git", ["-C", cwd, "-c", "core.hooksPath=/dev/null", ...args], {encoding: "utf8"}).trim();

test("depth-one source checkout is commit-identical and cache-independent", () => {
  const root = mkdtempSync(join(tmpdir(), "g01-shallow-source-"));
  try {
    const cache = join(root, "cache"), destination = join(root, "source");
    git(root, "init", "--quiet", cache);
    writeFileSync(join(cache, "selected.txt"), "source at the selected commit\n");
    git(cache, "add", ".");
    git(cache, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "--quiet", "-m", "selected");
    const commit = git(cache, "rev-parse", "HEAD"), expectedTree = git(cache, "rev-parse", "HEAD^{tree}");
    writeFileSync(join(cache, "later.txt"), "unrelated later history\n");
    git(cache, "add", ".");
    git(cache, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "--quiet", "-m", "later");
    const result = prepareIsolatedShallowSourceCheckout({cache, destination, base_commit: commit});
    assert.deepEqual(result, {head: commit, tree: expectedTree});
    assert.equal(git(destination, "remote", "get-url", "origin"), cache);
    assert.equal(git(destination, "rev-parse", "--is-shallow-repository"), "true");
    assert.equal(existsSync(join(destination, ".git", "objects", "info", "alternates")), false);
    assert.equal(readFileSync(join(destination, "selected.txt"), "utf8"), "source at the selected commit\n");
    assert.equal(existsSync(join(destination, "later.txt")), false);
    renameSync(cache, join(root, "cache-offline"));
    assert.equal(git(destination, "-c", "protocol.file.allow=never", "cat-file", "-p", `${commit}:selected.txt`), "source at the selected commit");
    assert.throws(() => prepareIsolatedShallowSourceCheckout({cache, destination, base_commit: commit}), /shallow-checkout-arguments/);
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});
