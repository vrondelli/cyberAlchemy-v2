import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import test from "node:test";

import {computeRepositoryRuntimeBundleDigest, loadVerifiedRepositoryRuntimeBundle} from "../index.mjs";

const bundlePath = new URL("../profiles/repository-runtime-v1.json", import.meta.url).pathname;

test("repository runtime bundle supplies a fixed product context epoch", () => {
  const loaded = loadVerifiedRepositoryRuntimeBundle(bundlePath);
  assert.equal(loaded.ok, true, JSON.stringify(loaded));
  assert.equal(loaded.source_mode, "product-bundle");
  assert.equal(loaded.context_source_provider().source_snapshot.length > 0, true);
  assert.deepEqual(loaded.context_source_provider().source_snapshot, loaded.source_snapshot);
  assert.equal(loaded.decision_profile.profile_digest, loaded.context_source_provider().decision_profile.profile_digest);
  assert.equal(loaded.context_source_provider().decision_profile, loaded.decision_profile,
    "the fixed context must retain the admitted profile's verification identity");
  assert.match(loaded.value.gateway.session_store.path, /codex-app-server-wrapper\/\.runtime\/gateway-sessions\.jsonl$/u);
  const interactionConsumers = loaded.value.gateway.allowed_clients
    .filter((client) => client.lane === "interaction-bound").map((client) => client.consumer_id);
  assert.ok(interactionConsumers.includes("codex:define-cli"));
  assert.ok(interactionConsumers.includes("codex:desktop-wsl"));
  assert.ok(interactionConsumers.includes("codex:human-chat"));
  assert.notEqual(interactionConsumers.indexOf("codex:define-cli"), interactionConsumers.indexOf("codex:human-chat"));
});

test("repository runtime bundle rejects tampering without a live-source fallback", () => {
  const temporary = mkdtempSync(resolve(tmpdir(), "are-runtime-bundle-test-"));
  try {
    const value = JSON.parse(readFileSync(bundlePath, "utf8"));
    value.instructions[0].content += " tampered";
    const copy = resolve(temporary, "tampered.json");
    writeFileSync(copy, JSON.stringify(value));
    const loaded = loadVerifiedRepositoryRuntimeBundle(copy);
    assert.equal(loaded.ok, false);
    assert.match(loaded.reason_codes.join(), /runtime-bundle.digest-mismatch/u);
  } finally {
    rmSync(temporary, {recursive: true, force: true});
  }
});

test("repository runtime bundle rejects an unavailable compiled policy artifact", () => {
  const temporary = mkdtempSync(resolve(tmpdir(), "are-runtime-policy-missing-"));
  try {
    const loaded = loadVerifiedRepositoryRuntimeBundle(bundlePath, {
      policy_bundle_path: resolve(temporary, "missing.json"),
    });
    assert.equal(loaded.ok, false);
    assert.ok(loaded.reason_codes.includes("runtime-bundle.policy-bundle-unverified"));
  } finally {
    rmSync(temporary, {recursive: true, force: true});
  }
});

test("repository runtime bundle rejects policy digest drift even with a resealed runtime bundle", () => {
  const temporary = mkdtempSync(resolve(tmpdir(), "are-runtime-policy-drift-"));
  try {
    const bundle = JSON.parse(readFileSync(bundlePath, "utf8"));
    bundle.policy_bundle_digest = "f".repeat(64);
    bundle.bundle_digest = computeRepositoryRuntimeBundleDigest(bundle);
    const copy = resolve(temporary, "drifted-runtime.json");
    writeFileSync(copy, JSON.stringify(bundle));
    const loaded = loadVerifiedRepositoryRuntimeBundle(copy);
    assert.equal(loaded.ok, false);
    assert.ok(loaded.reason_codes.includes("runtime-bundle.policy-bundle-digest-mismatch"));
  } finally {
    rmSync(temporary, {recursive: true, force: true});
  }
});
