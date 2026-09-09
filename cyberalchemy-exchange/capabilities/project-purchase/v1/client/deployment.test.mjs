import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, stat, unlink, access, chmod, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { prepare, roles, rpc } from "./deployment.mjs";

test("preparation preserves seven distinct private keys and publishes only their addresses", async () => {
  const root = await mkdtemp(join(tmpdir(), "exchange-deployment-test-"));
  try {
    const dir = join(root, "keys"), dest = join(root, "public.json");
    const first = await prepare(dir, dest);
    assert.equal(new Set(Object.values(first.keys)).size, 7);
    assert.deepEqual(await prepare(dir, dest), first);
    for (const role of roles) {
      assert.equal((await stat(join(dir, role + ".json"))).mode & 0o777, 0o600);
      assert.equal(typeof first.keys[role], "string");
    }
    const before = await readFile(dest, "utf8");
    await unlink(join(dir, "kepProgram.json"));
    await assert.rejects(prepare(dir, dest), /Missing key for existing/);
    await assert.rejects(access(join(dir, "kepProgram.json")));
    assert.equal(await readFile(dest, "utf8"), before);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("preparation rejects readable private keys instead of changing their permissions", async () => {
  const root = await mkdtemp(join(tmpdir(), "exchange-deployment-test-"));
  try {
    const dir = join(root, "keys"), dest = join(root, "public.json");
    await prepare(dir, dest);
    await chmod(join(dir, "releaseAuthority.json"), 0o644);
    await assert.rejects(prepare(dir, dest), /private regular file/);
    assert.equal((await stat(join(dir, "releaseAuthority.json"))).mode & 0o777, 0o644);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("client bindings reject partial overrides and use both selected deployment IDs", () => {
  const env = { ...process.env }; delete env.EXCHANGE_KEP_PROGRAM_ID; delete env.EXCHANGE_PURCHASE_PROGRAM_ID;
  const source = `import { KEP, PURCHASE } from ${JSON.stringify(new URL("./transactions.mjs", import.meta.url).href)}; console.log(JSON.stringify([KEP.toBase58(),PURCHASE.toBase58()]));`;
  const call = (overrides) => spawnSync(process.execPath, ["--input-type=module", "-e", source], { env: { ...env, ...overrides }, encoding: "utf8" });
  const kep = "GVL5KF2tX63y8W8VDjJQCzH6opg74DQFyBWYs3FAtBVm", purchase = "BoB7fWtTuoJ1jHuAy1LmqNqAixRY7HXjDgaC1Vd6iC3S";
  assert.notEqual(call({ EXCHANGE_KEP_PROGRAM_ID: kep }).status, 0);
  const result = call({ EXCHANGE_KEP_PROGRAM_ID: kep, EXCHANGE_PURCHASE_PROGRAM_ID: purchase });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), [kep, purchase]);
});

test("deployment preflight cannot submit transactions or request funds", async () => {
  await assert.rejects(rpc("sendTransaction", []), /Read-only/);
  await assert.rejects(rpc("requestAirdrop", []), /Read-only/);
});
