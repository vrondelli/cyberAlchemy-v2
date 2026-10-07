import assert from "node:assert/strict";
import {readFileSync, realpathSync} from "node:fs";
import {createRequire} from "node:module";
import {dirname, join} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

const adapterRoot = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(new URL("../package.json", import.meta.url));
const dshRequire = createRequire(require.resolve("@deepseek-ai/dsh/package.json"));

for (const [bridge, original] of [
  ["session-controller", "@deepseek-ai/dsh-api-session-controller"],
  ["workspace-controller", "@deepseek-ai/dsh-api-workspace-controller"],
]) {
  test(`${bridge} bridge enrolls the exact pinned DSH browser half without a Host service`, async () => {
    const path = join(adapterRoot, "web-client-bridges", bridge, "package.json");
    const declared = JSON.parse(readFileSync(path, "utf8"));
    const originalPath = dshRequire.resolve(`${original}/package.json`);
    const pinned = JSON.parse(readFileSync(originalPath, "utf8"));
    assert.equal(declared.name, pinned.name);
    assert.equal(declared.version, pinned.version);
    assert.deepEqual(declared.dsh.client, pinned.dsh.client);
    assert.equal(realpathSync(join(dirname(path), declared.exports["./client"])),
      realpathSync(join(dirname(originalPath), pinned.exports["./client"].default)));
    const host = await import(new URL(`../web-client-bridges/${bridge}/index.mjs`, import.meta.url));
    assert.deepEqual(Object.keys(host), ["apply"]);
    assert.equal(host.apply({}), undefined);
  });
}
