import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import test from "node:test";

import {inspectCompositionClosure, inspectPackagedCandidateFiles, previewPackagedCandidateModulePort, runPackagedCandidateVerifier} from "./packaged-preview.mjs";

const root = resolve(import.meta.dirname, "../../../..");
const artifactBase = "implementation/agent-reasoning-engine/packages/module-port-governance-binding-rust/artifacts/linux-x64-v2-candidate";
const manifestRelative = `${artifactBase}/manifest.json`;
const binaryRelative = `${artifactBase}/are-module-port-v2-candidate`;
const manifest = JSON.parse(readFileSync(resolve(root, manifestRelative)));
const boundFiles = [
  "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-module-port-v1/governance-candidate/MODULE-PORT-CONSTITUTION.md",
  "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-module-port-v1/governance-candidate/adoption-request.json",
  "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-runtime-configuration-v2/runtime-configuration.alch",
  "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-runtime-configuration-v2/generated/manifest.json",
  "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-runtime-configuration-v2/generated/runtime/configuration.json",
  "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-runtime-configuration-v2/generated/runtime/entrypoints.json",
  "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-runtime-configuration-v2/generated/provenance/runtime-bindings.json",
  "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-runtime-configuration-v2/evidence/runtime-conformance.json",
  "implementation/agent-reasoning-engine/packages/module-port/alch-semantic-adapter.mjs",
  "language/capabilities/alchlang/plans/general-compiler-v1/extensions/semantic-contract-v1/consumer-runtime.mjs",
  "language/capabilities/alchlang/plans/general-compiler-v1/extensions/semantic-contract-v1/evidence/bundle/app/prelude.mjs",
];
const compositionFiles = [
  "implementation/agent-reasoning-engine/packages/module-port-governance-cutover-v2-candidate/index.mjs",
  "implementation/agent-reasoning-engine/packages/module-port/index.mjs",
  "implementation/agent-reasoning-engine/packages/module-port/semantic-text.mjs",
  "implementation/agent-reasoning-engine/packages/module-port/static-composition.mjs",
];

function fixture({withBoundFiles = false, withCompositionFiles = false} = {}) {
  const target = mkdtempSync(join(tmpdir(), "are-v2-packaged-"));
  const selected = new Set([manifestRelative, binaryRelative, ...manifest.source_files.map((row) => row.path),
    ...(withBoundFiles ? boundFiles : []), ...(withCompositionFiles ? compositionFiles : [])]);
  for (const path of selected) {
    const destination = resolve(target, path);
    mkdirSync(dirname(destination), {recursive: true});
    copyFileSync(resolve(root, path), destination);
  }
  return target;
}

function replaceWithDrift(path) {
  unlinkSync(path);
  writeFileSync(path, "drift");
}

test("exact packaged verifier runs before candidate composition without admission", async () => {
  const result = await previewPackagedCandidateModulePort();
  assert.equal(result.ok, true, JSON.stringify(result.reason_codes));
  assert.equal(result.verifier_delivery, "packaged-artifact");
  assert.equal(result.verifier_artifact_id, manifest.artifact_id);
  assert.equal(result.runtime_admitted, false);
  assert.equal(result.activation_selected, false);
  assert.equal(result.cutover_completed, false);
  assert.equal(result.enforcement_active, false);
  assert.equal(result.effect_authorized, false);
  const invoked = result.port.invoke({schema_version: "are.module-invocation/v1", invocation_id: "packaged.semantic-key",
    consumer_id: "request-intent-runtime", capability_id: "text.semantic-key/v1", input: {text: "Build—a—new system"},
    dependency_posture: "required-for-judgment", authority_effect: "none"});
  assert.equal(invoked.ok, true);
  assert.deepEqual(invoked.value, {key: "build a new system"});
});

test("packaged candidate preview needs no Cargo or package manager on PATH", () => {
  const script = 'import {previewPackagedCandidateModulePort} from "./implementation/agent-reasoning-engine/packages/module-port-governance-cutover-v2-candidate/packaged-preview.mjs"; const result=await previewPackagedCandidateModulePort(); if(!result.ok) process.exit(1);';
  const run = spawnSync(process.execPath, ["--input-type=module", "-e", script],
    {cwd: root, env: {...process.env, PATH: ""}, encoding: "utf8", timeout: 60_000});
  assert.equal(run.status, 0, run.stderr || run.stdout);
});

test("packaged verifier cannot accept source-only fixture as a passing startup", () => {
  const target = fixture();
  try {
    assert.equal(inspectPackagedCandidateFiles(target).ok, true);
    const result = runPackagedCandidateVerifier(target);
    assert.equal(result.ok, false);
    assert.equal(result.reason, "packaged.verifier-blocked");
  } finally {
    rmSync(target, {recursive: true, force: true});
  }
});

test("direct packaged verifier passes exact bound files and blocks adapter drift", () => {
  const target = fixture({withBoundFiles: true});
  try {
    const exact = runPackagedCandidateVerifier(target);
    assert.equal(exact.ok, true, exact.reason);
    assert.equal(exact.receipt.checks.length, 17);
    replaceWithDrift(resolve(target, boundFiles[8]));
    const drifted = runPackagedCandidateVerifier(target);
    assert.equal(drifted.ok, false);
    assert.equal(drifted.reason, "packaged.verifier-blocked");
  } finally {
    rmSync(target, {recursive: true, force: true});
  }
});

test("transitive executable composition sources are digest-bound before import", () => {
  assert.equal(inspectCompositionClosure(root).ok, true);
  const target = fixture({withCompositionFiles: true});
  try {
    assert.equal(inspectCompositionClosure(target).ok, true);
    for (const path of compositionFiles) {
      const copied = resolve(target, path);
      const bytes = readFileSync(copied);
      replaceWithDrift(copied);
      assert.equal(inspectCompositionClosure(target).ok, false, path);
      writeFileSync(copied, bytes);
    }
  } finally {
    rmSync(target, {recursive: true, force: true});
  }
});

test("failed artifact verification never imports unverified composition code", () => {
  const target = fixture();
  const relative = "implementation/agent-reasoning-engine/packages/module-port-governance-cutover-v2-candidate";
  const marker = resolve(target, "unverified-import-executed");
  try {
    mkdirSync(resolve(target, relative), {recursive: true});
    copyFileSync(resolve(root, relative, "packaged-preview.mjs"), resolve(target, relative, "packaged-preview.mjs"));
    writeFileSync(resolve(target, relative, "index.mjs"),
      `import {writeFileSync} from "node:fs"; writeFileSync(${JSON.stringify(marker)}, "executed");`);
    replaceWithDrift(resolve(target, binaryRelative));
    const script = 'import {pathToFileURL} from "node:url"; const mod=await import(pathToFileURL(process.argv[1]+"/implementation/agent-reasoning-engine/packages/module-port-governance-cutover-v2-candidate/packaged-preview.mjs")); const result=await mod.previewPackagedCandidateModulePort(); if(result.ok) process.exit(1);';
    const run = spawnSync(process.execPath, ["--input-type=module", "-e", script, target],
      {cwd: target, encoding: "utf8", timeout: 60_000});
    assert.equal(run.status, 0, run.stderr || run.stdout);
    assert.equal(existsSync(marker), false);
  } finally {
    rmSync(target, {recursive: true, force: true});
  }
});

test("binary, manifest, source, symlink, and missing-file drift fail closed", () => {
  const cases = [
    (target) => replaceWithDrift(resolve(target, binaryRelative)),
    (target) => replaceWithDrift(resolve(target, manifestRelative)),
    (target) => replaceWithDrift(resolve(target, manifest.source_files[2].path)),
    (target) => {
      const path = resolve(target, binaryRelative);
      unlinkSync(path);
      symlinkSync(resolve(root, binaryRelative), path);
    },
    (target) => unlinkSync(resolve(target, binaryRelative)),
    (target) => chmodSync(resolve(target, binaryRelative), 0o644),
  ];
  for (const mutate of cases) {
    const target = fixture();
    try {
      mutate(target);
      const inspected = inspectPackagedCandidateFiles(target);
      assert.equal(inspected.ok, false);
      assert.equal(runPackagedCandidateVerifier(target).ok, false);
    } finally {
      rmSync(target, {recursive: true, force: true});
    }
  }
});
