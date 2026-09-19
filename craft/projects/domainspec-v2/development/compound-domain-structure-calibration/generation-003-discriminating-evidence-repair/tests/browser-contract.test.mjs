import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validateProtectedImports } from "../runtime/validate-imports.mjs";
import {
  MUTATION_TARGETS,
  OBSERVABLE_FIELDS,
  TARGET_STATES,
  validateBrowserBaselineWitness,
  validateBrowserEditDiff,
  validateBrowserObservationReceipt,
  validateBrowserSourceManifest,
} from "../runtime/validate-browser-contracts.mjs";
import {
  RUNTIME_COMPONENTS,
  RUNTIME_PACKAGES,
  runtimeHandle,
  validateBrowserRuntimeDescriptor,
} from "../runtime/validate-browser-runtime.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const readJson = (path) => JSON.parse(readFileSync(resolve(packageRoot, path), "utf8"));

const descriptor = readJson("browser-runtime/runtime-descriptor.json");
const vectors = readJson("fixtures/contracts/browser-contract-vectors.json");
const protectedManifest = readJson("runs/SWU-CDSC3-001/protected-input-manifest.json");
const targetSetHandle = descriptor.atomic_target_set_handle;
const sourceManifestHandle = `sha256:${"3".repeat(64)}`;
const baselineWitnessHandle = `sha256:${"4".repeat(64)}`;

const sourceManifest = {
  schema_version: "cdsc.browser-source-manifest.v1",
  runtime_handle: descriptor.runtime_handle,
  target_set_handle: targetSetHandle,
  source_files: [{
    path: "projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/app/page.tsx",
    ranges: [[417, 515], [571, 710]],
    raw_sha256: `sha256:${"5".repeat(64)}`,
  }],
  translations: [{
    source_selector: "app/page.tsx:417-515,571-710",
    generated_path: "harness/browser-baseline/page.jsx",
    adapter_kind: "behavior-copy",
  }],
  protected_roots: [
    "projects/domainspec-v2/development/compound-domain-structure-calibration/evidence",
    "projects/domainspec-v2/development/ui-meta-type-repair",
    "projects/savvy_legal-studio-ai/frontend/savvy-legal-studio",
  ],
};

const baselineWitness = {
  schema_version: "cdsc.browser-baseline-witness.v1",
  runtime_handle: descriptor.runtime_handle,
  source_manifest_handle: sourceManifestHandle,
  vectors: [{ vector_id: "V1", expected: state(), observed: state(), comparison: "match" }],
  supporting_screenshots: [`sha256:${"6".repeat(64)}`],
  replay_state: "identical",
};

const permittedObservation = {
  schema_version: "cdsc.browser-observation-receipt.v1",
  mutation_id: "M3-P",
  runtime_handle: descriptor.runtime_handle,
  source_manifest_handle: sourceManifestHandle,
  baseline_witness_handle: baselineWitnessHandle,
  target_set_handle: targetSetHandle,
  vector_results: [{ vector_id: "V1", baseline: state(), mutant: state({ rendered_child_id: "step-9-alternate" }), comparison: "different" }],
  target_observations: MUTATION_TARGETS["M3-P"].map((targetId) => ({ target_id: targetId, state: "supported", evidence_fields: ["rendered_child_id"] })),
  supporting_screenshots: [`sha256:${"7".repeat(64)}`],
  uncertainty: [],
};

const editDiff = {
  schema_version: "cdsc.browser-edit-diff.v1",
  mutation_id: "M3-P",
  allowed_edit_surface: ["harness/browser-baseline/step-registry.jsx"],
  changed_paths: ["harness/browser-baseline/step-registry.jsx"],
  before_sha256: `sha256:${"8".repeat(64)}`,
  after_sha256: `sha256:${"9".repeat(64)}`,
  protected_roots_unchanged: true,
};

test("browser schemas expose the same direct-validator vocabulary", () => {
  const runtimeSchema = readJson("contracts/browser-runtime.schema.yml");
  const baselineSchema = readJson("contracts/browser-baseline-witness.schema.yml");
  const observationSchema = readJson("contracts/browser-observation-receipt.schema.yml");
  assert.equal(runtimeSchema.properties.runtime_source.const, "pinned-isolated-install");
  assert.deepEqual(baselineSchema.$defs.state.required, OBSERVABLE_FIELDS);
  assert.deepEqual(observationSchema.properties.mutation_id.enum, Object.keys(MUTATION_TARGETS));
  assert.deepEqual(observationSchema.$defs.target_observation.properties.state.enum, TARGET_STATES);
  assert.deepEqual(Object.keys(RUNTIME_PACKAGES), ["@playwright/test", "esbuild", "react", "react-dom"]);
  assert.deepEqual(RUNTIME_COMPONENTS, ["chromium-1228", "chromium_headless_shell-1228", "ffmpeg-1011"]);
});

test("isolated runtime descriptor binds exact packages, browser, and smoke proof", () => {
  assert.equal(validateBrowserRuntimeDescriptor(descriptor, { repositoryRoot }), true);
  assert.equal(descriptor.runtime_handle, runtimeHandle(descriptor));
  const first = readJson("runs/SWU-CDSC3-002/smoke-run-1.json");
  const second = readJson("runs/SWU-CDSC3-002/smoke-run-2.json");
  assert.deepEqual(first, second);
  assert.equal(first.structured_state.ready, true);
  assert.equal(first.screenshot_sha256, descriptor.smoke.screenshot_sha256);
});

test("source, baseline, observation, and edit contracts accept complete structured evidence", () => {
  assert.equal(validateBrowserSourceManifest(sourceManifest, { runtimeHandle: descriptor.runtime_handle, targetSetHandle }), true);
  assert.equal(validateBrowserBaselineWitness(baselineWitness, { runtimeHandle: descriptor.runtime_handle, sourceManifestHandle }), true);
  assert.equal(validateBrowserObservationReceipt(permittedObservation, {
    runtimeHandle: descriptor.runtime_handle,
    sourceManifestHandle,
    baselineWitnessHandle,
    targetSetHandle,
  }), true);
  assert.equal(validateBrowserEditDiff(editDiff), true);
});

test("declared browser negatives reject at their owning boundary", async (t) => {
  const mutations = {
    "launch-failure": () => mutateDescriptor((candidate) => { candidate.smoke.status = "failed"; }),
    "missing-browser": () => mutateDescriptor((candidate) => { candidate.browser.executable_path = "node_modules/playwright-core/.local-browsers/missing/chrome"; }),
    "screenshot-only": () => mutateObservation((candidate) => { candidate.vector_results = []; }),
    "unknown-observable": () => mutateObservation((candidate) => { candidate.target_observations[0].evidence_fields = ["visual_impression"]; }),
    "partial-vector": () => mutateObservation((candidate) => { delete candidate.vector_results[0].mutant.committed_step; }),
    "wrong-runtime": () => mutateObservation((candidate) => { candidate.runtime_handle = `sha256:${"0".repeat(64)}`; }),
    "edit-leak": () => {
      const candidate = structuredClone(editDiff);
      candidate.changed_paths = ["harness/browser-baseline/commit-adapter.js"];
      return () => validateBrowserEditDiff(candidate);
    },
    "source-escape": () => {
      const candidate = structuredClone(sourceManifest);
      candidate.source_files[0].path = "projects/other/source.ts";
      return () => validateBrowserSourceManifest(candidate, { runtimeHandle: descriptor.runtime_handle, targetSetHandle });
    },
  };
  for (const vector of vectors.negative_vectors) {
    await t.test(vector.id, () => assert.throws(mutations[vector.id](), new RegExp(vector.expected_error)));
  }
});

test("SWU002 preserves every SWU001 protected import", () => {
  assert.equal(validateProtectedImports(protectedManifest, { root: repositoryRoot, allowSuccessors: true }), true);
});

function state(overrides = {}) {
  return {
    rendered_child_id: "step-9",
    interaction_ports: ["onNext", "onBack"],
    guard_allowed: true,
    notice_present: false,
    requested_step: "9",
    committed_step: "9",
    route_tree_state: "mounted",
    ...overrides,
  };
}

function mutateDescriptor(mutate) {
  const candidate = structuredClone(descriptor);
  mutate(candidate);
  candidate.runtime_handle = runtimeHandle(candidate);
  return () => validateBrowserRuntimeDescriptor(candidate, { repositoryRoot });
}

function mutateObservation(mutate) {
  const candidate = structuredClone(permittedObservation);
  mutate(candidate);
  return () => validateBrowserObservationReceipt(candidate, {
    runtimeHandle: descriptor.runtime_handle,
    sourceManifestHandle,
    baselineWitnessHandle,
    targetSetHandle,
  });
}
