import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  createDeniedWriteProbe,
  verifyWriteIsolation,
} from "../scripts/verify-write-isolation.mjs";

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "ocgp-isolation-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const protectedRoot = join(root, "protected");
  await mkdir(protectedRoot);
  await writeFile(join(protectedRoot, "probe.txt"), "unchanged", "utf8");
  return { root, protectedRoot, probe: join(protectedRoot, "probe.txt") };
}

test("attests stable protected bytes and capability-denied write", async (t) => {
  const { root, probe } = await fixture(t);
  const attestation = await verifyWriteIsolation({
    repositoryRoot: root,
    protectedSelectors: ["protected/**"],
    runEvaluation: async () => {},
    writeProbe: createDeniedWriteProbe(probe),
  });
  assert.equal(attestation.protected_set_digest_before, attestation.protected_set_digest_after);
  assert.equal(attestation.write_probe, "denied");
  assert.equal(attestation.claim, "input-isolation-only");
  assert.equal(attestation.host_security_claim, "none");
  assert.equal(await readFile(probe, "utf8"), "unchanged");
});

test("fails when one protected file changes", async (t) => {
  const { root, probe } = await fixture(t);
  await assert.rejects(
    verifyWriteIsolation({
      repositoryRoot: root,
      protectedSelectors: ["protected/**"],
      runEvaluation: () => writeFile(probe, "changed", "utf8"),
      writeProbe: createDeniedWriteProbe(probe),
    }),
    { code: "PROTECTED_SET_CHANGED" },
  );
});

test("fails when one protected file is added", async (t) => {
  const { root, protectedRoot, probe } = await fixture(t);
  await assert.rejects(
    verifyWriteIsolation({
      repositoryRoot: root,
      protectedSelectors: ["protected/**"],
      runEvaluation: () => writeFile(join(protectedRoot, "added.txt"), "added", "utf8"),
      writeProbe: createDeniedWriteProbe(probe),
    }),
    { code: "PROTECTED_SET_CHANGED" },
  );
});

test("fails when one protected file is deleted", async (t) => {
  const { root, probe } = await fixture(t);
  await assert.rejects(
    verifyWriteIsolation({
      repositoryRoot: root,
      protectedSelectors: ["protected/**"],
      runEvaluation: () => unlink(probe),
      writeProbe: createDeniedWriteProbe(probe),
    }),
    { code: "PROTECTED_SET_CHANGED" },
  );
});

test("fails if the supplied write capability permits the probe", async (t) => {
  const { root } = await fixture(t);
  await assert.rejects(
    verifyWriteIsolation({
      repositoryRoot: root,
      protectedSelectors: ["protected/**"],
      runEvaluation: async () => {},
      writeProbe: async () => {},
    }),
    { code: "WRITE_PROBE_NOT_DENIED" },
  );
});
