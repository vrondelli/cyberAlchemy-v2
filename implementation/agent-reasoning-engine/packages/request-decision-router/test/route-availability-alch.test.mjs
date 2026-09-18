import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

import {execute} from "../generated/route-availability/app/function/behavior.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(packageRoot, "alch/route-availability.alch");
const generated = resolve(packageRoot, "generated/route-availability");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

test("frozen route availability bundle is internally digest-bound", () => {
  const manifest = JSON.parse(readFileSync(resolve(generated, "manifest.json"), "utf8"));
  const sourceBytes = readFileSync(source);
  assert.equal(manifest.profile, "declarative-function-v1");
  assert.equal(manifest.source_sha256, sha256(sourceBytes));
  assert.deepEqual(readFileSync(resolve(generated, "provenance/function/source.alch")), sourceBytes);
  assert.equal(JSON.parse(readFileSync(resolve(generated, "provenance/function/ontology.json"), "utf8")).authority_effect, "none");
  assert.equal(JSON.parse(readFileSync(resolve(generated, "evidence/lowering/certificate.json"), "utf8")).authority_effect, "none");
  for (const [path, digest] of Object.entries(manifest.files)) {
    assert.equal(sha256(readFileSync(resolve(generated, path))), digest, path);
  }
});

test("compiled route availability keeps registry, lifecycle, capability, and identity orthogonal", () => {
  const decide = (input) => execute({input});
  assert.deepEqual(decide({registry_declared: true, lifecycle_available: true, capability_required: false, capability_available: false, route_identity_matches: false}),
    {status: "available", repair_focus: "none", authority_effect: "none"});
  assert.equal(decide({registry_declared: false, lifecycle_available: true, capability_required: false, capability_available: false, route_identity_matches: false}).repair_focus, "registry");
  assert.equal(decide({registry_declared: true, lifecycle_available: false, capability_required: false, capability_available: false, route_identity_matches: false}).repair_focus, "lifecycle");
  assert.equal(decide({registry_declared: true, lifecycle_available: true, capability_required: true, capability_available: false, route_identity_matches: false}).repair_focus, "module-capability");
  assert.equal(decide({registry_declared: true, lifecycle_available: true, capability_required: true, capability_available: true, route_identity_matches: false}).repair_focus, "route-identity");
});
