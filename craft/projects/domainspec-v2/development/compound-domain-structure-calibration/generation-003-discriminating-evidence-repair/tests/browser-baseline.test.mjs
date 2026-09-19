import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validateProtectedImports } from "../runtime/validate-imports.mjs";
import { validateBrowserBaselineWitness, validateBrowserSourceManifest } from "../runtime/validate-browser-contracts.mjs";
import { validateBrowserRuntimeDescriptor } from "../runtime/validate-browser-runtime.mjs";
import { SESSION_FIXTURES, guardStep, nextStep, previousStep } from "../harness/browser-baseline/model.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const readJson = (path) => JSON.parse(readFileSync(resolve(packageRoot, path), "utf8"));
const descriptor = readJson("browser-runtime/runtime-descriptor.json");
const sourceManifest = readJson("fixtures/generation-003/browser-source-manifest.json");
const witness = readJson("evidence/generation-003/browser-baseline/witness.json");
const firstRun = readJson("evidence/generation-003/browser-baseline/raw-run-1/run.json");
const secondRun = readJson("evidence/generation-003/browser-baseline/raw-run-2/run.json");
const translationMap = readJson("harness/browser-baseline/translation-map.json");
const protectedManifest = readJson("runs/SWU-CDSC3-001/protected-input-manifest.json");

test("source manifest freezes exact Savvy bytes, versions, and predecessor adapter", () => {
  assert.equal(validateBrowserRuntimeDescriptor(descriptor, { repositoryRoot }), true);
  assert.equal(validateBrowserSourceManifest(sourceManifest, { runtimeHandle: descriptor.runtime_handle, targetSetHandle: descriptor.atomic_target_set_handle }), true);
  for (const source of sourceManifest.source_files) {
    assert.equal(digest(readFileSync(resolve(repositoryRoot, source.path))), source.raw_sha256);
  }
  const lock = JSON.parse(readFileSync(resolve(repositoryRoot, sourceManifest.source_files.find((item) => item.path.endsWith("package-lock.json")).path), "utf8"));
  assert.equal(lock.packages["node_modules/react"].version, "19.2.7");
  assert.equal(lock.packages["node_modules/react-dom"].version, "19.2.7");
  assert.ok(sourceManifest.translations.some((item) => item.source_selector.includes("record:sha256:d7c8eca72c04c69eca6e8dc37b740a37ae0a4a3ca0cec648c20dfca0b3299e41")));
});

test("translation map covers every generated harness file with live digests", () => {
  assert.equal(translationMap.source_manifest_handle, digest(readFileSync(resolve(packageRoot, "fixtures/generation-003/browser-source-manifest.json"))));
  assert.equal(translationMap.files.length, 8);
  for (const file of translationMap.files) {
    assert.ok(file.sources.length > 0);
    assert.equal(digest(readFileSync(resolve(packageRoot, file.path))), file.sha256, `translation drift: ${file.path}`);
  }
});

test("guard and finite-flow adapters retain the accepted predecessor behavior", () => {
  assert.equal(nextStep("9"), "10");
  assert.equal(previousStep("9"), "8");
  assert.equal(nextStep("unknown"), "1");
  assert.equal(previousStep("unknown"), "1");
  assert.deepEqual(guardStep("9", SESSION_FIXTURES.inactive), { allowed: false, step: "login", requested: "9", reason: "inactive-session" });
  assert.deepEqual(guardStep("9", SESSION_FIXTURES["active-pending-3"]), { allowed: false, step: "3", requested: "9", reason: "premature-step" });
});

test("two fresh React/browser runs are semantically and visually identical", () => {
  assert.deepEqual(firstRun, secondRun);
  assert.equal(firstRun.render_engine, "react");
  assert.equal(firstRun.react_version, "19.2.7");
  assert.equal(firstRun.vectors.length, 7);
  assert.ok(firstRun.vectors.every((vector) => vector.comparison === "match"));
  const expectedIds = ["V1-active-request-9", "V2-step-9-next", "V3-step-9-back", "V4-inactive-request-9", "V5-premature-request-9", "V6-unmounted-step-9", "V7-mounted-step-9"];
  assert.deepEqual(firstRun.vectors.map((vector) => vector.vector_id), expectedIds);
  assert.deepEqual(screenshotDigests("raw-run-1"), screenshotDigests("raw-run-2"));
  assert.deepEqual(screenshotDigests("raw-run-1"), firstRun.supporting_screenshots);
});

test("baseline witness is total, structured, replayed, and screenshot-supported", () => {
  assert.equal(validateBrowserBaselineWitness(witness, { runtimeHandle: descriptor.runtime_handle, sourceManifestHandle: firstRun.source_manifest_handle }), true);
  assert.equal(witness.replay_state, "identical");
  assert.equal(witness.vectors.length, 7);
  for (const vector of witness.vectors) {
    assert.deepEqual(vector.observed, vector.expected);
    assert.equal(Object.hasOwn(vector.observed, "rendered_child_id"), true);
    assert.equal(Object.hasOwn(vector.observed, "interaction_ports"), true);
    assert.equal(Object.hasOwn(vector.observed, "guard_allowed"), true);
    assert.equal(Object.hasOwn(vector.observed, "notice_present"), true);
    assert.equal(Object.hasOwn(vector.observed, "requested_step"), true);
    assert.equal(Object.hasOwn(vector.observed, "committed_step"), true);
    assert.equal(Object.hasOwn(vector.observed, "route_tree_state"), true);
  }
  assert.equal(witness.supporting_screenshots.length, 7);
});

test("baseline leaves protected imports unchanged and contains no mutation adapter", () => {
  assert.equal(validateProtectedImports(protectedManifest, { root: repositoryRoot, allowSuccessors: true }), true);
  const generatedSources = ["App.jsx", "model.mjs", "vectors.json", "build.mjs", "run-baseline.mjs", "build-witness.mjs"]
    .map((name) => readFileSync(resolve(packageRoot, "harness/browser-baseline", name), "utf8"))
    .join("\n");
  assert.equal(generatedSources.includes("M3-P"), false);
  assert.equal(generatedSources.includes("M3-B"), false);
});

function screenshotDigests(runName) {
  const root = resolve(packageRoot, "evidence/generation-003/browser-baseline", runName, "screenshots");
  return readdirSync(root).sort().map((name) => digest(readFileSync(resolve(root, name)))).sort();
}

function digest(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}
