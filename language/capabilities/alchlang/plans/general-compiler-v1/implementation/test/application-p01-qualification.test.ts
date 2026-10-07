import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { defaultDomainSpecPackageRoot } from "../src/domainspec-cli.js";

const repo = path.resolve(defaultDomainSpecPackageRoot(), "../../../../..");
const evidence = "craft/projects/domainspec-v2/development/authoring-to-runtime-v1/evidence";
const previousPath = `${evidence}/p01-package-boundaries/qualification.v3-candidate.json`;
const currentPath = `${evidence}/p01-package-boundaries/qualification.v4-candidate.json`;
const l3xPath = `${evidence}/l3-completion/qualification.v4-candidate.json`;
const dagPath = "craft/projects/domainspec-v2/development/authoring-to-runtime-v1/EXECUTION-DAG.json";
const sha256 = (file: string) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const read = (file: string) => JSON.parse(fs.readFileSync(path.join(repo, file), "utf8"));
const digest = (file: string) => sha256(path.join(repo, file));

function validate(value: any): void {
  assert.equal(value.schema_version, "alchlang.p01-package-boundaries-qualification/v4-candidate");
  assert.equal(value.task, "P01");
  assert.equal(value.result, "blocked");
  assert.equal(value.package_shape_result, "scoped-pass");
  assert.equal(value.authority_effect, "none");
  assert.deepEqual(value.supersedes_previous_qualification, { path: previousPath, sha256: digest(previousPath) });
  assert.deepEqual(value.inherited_boundary, { task: "L3X", path: l3xPath, sha256: digest(l3xPath), result: "blocked" });
  assert.equal(read(l3xPath).result, "blocked");
  assert.deepEqual(value.dag, { path: dagPath, sha256: digest(dagPath), node: "P01" });
  const previous = read(previousPath);
  assert.deepEqual(Object.keys(value.bindings), Object.keys(previous.bindings));
  for (const [key, binding] of Object.entries(value.bindings) as Array<[string, { path: string; sha256: string }]>) {
    assert.equal(binding.path, previous.bindings[key].path);
    assert.equal(binding.sha256, digest(binding.path), binding.path);
  }
  assert.deepEqual(value.packages.map((item: any) => item.id), ["core", "rust", "local-host", "domainspec-cli"]);
  assert.deepEqual(value.packages.map((item: any) => item.file_count), [246, 219, 227, 1595]);
  assert.deepEqual(value.packages.map((item: any) => item.allowlist_sha256), [
    "d0c58f97f31fa6657d8f34f4251286b2156646fe9032fb62e5d7d15c80533569",
    "7ae69b4b4f1468934c433d5cca260b272833d7c66ebd9814fe01a433e1546c23",
    "3362f7dc0b7811f301d8643e34c8c8e3a7ef2b9672dd789d18bc69d4c11d1b50",
    "05081140422cf4c3bc17eb0c2c4a6f80f4830f040f73b8a5335c180e11169edb",
  ]);
  assert.deepEqual(value.packages.map((item: any) => item.name), previous.packages.map((item: any) => item.name));
  const boundaries = read(value.bindings.package_boundaries.path);
  assert.deepEqual(value.packages.slice(0, 3).map((item: any) => [item.id, item.name, item.file_count, item.allowlist_sha256]),
    boundaries.packages.map((item: any) => [item.id, item.name, item.files.length, item.allowlist_sha256]));
  assert.deepEqual([value.packages[3].name, value.packages[3].file_count, value.packages[3].allowlist_sha256],
    [boundaries.domainspec_cli.name, boundaries.domainspec_cli.expanded_files.length, boundaries.domainspec_cli.expanded_allowlist_sha256]);
  assert.ok(value.packages.every((item: any) => item.exact_export_map === true && item.checkout_only_declaration_imports === 0));
  assert.equal(value.validation.typecheck, "pass");
  assert.equal(value.validation.build, "not_run_current");
  assert.equal(value.validation.boundary_check, "pass");
  assert.deepEqual(value.validation.package_boundary_suite, { tests: 5, passed: 5, failed: 0, skipped: 0 });
  assert.deepEqual(value.validation.optional_layer_suite, { tests: 3, passed: 3, failed: 0, skipped: 0 });
  assert.deepEqual(value.validation.combined_package_suite, { tests: 8, passed: 8, failed: 0, skipped: 0 });
  assert.deepEqual(value.hard_stops, { broad_directory_copy_used_as_allowlist: false, development_residue_packaged: false,
    checkout_only_declaration_import_present: false, missing_export_target: false, alchlang_archive_inventory_differs_from_allowlist: false,
    domainspec_cli_expanded_inventory_differs_from_allowlist: false, clean_consumer_claimed_before_p02: false,
    publication_or_release_performed: false, authority_effect_inferred: false });
  assert.match(value.claim_ceiling, /P01 lifecycle remains blocked by current L3X v4/u);
  assert.match(value.claim_ceiling, /three AlchLang archives/u);
  assert.equal(value.open_questions.length, 2);
}

test("P01 v4 separates current package-shape evidence from blocked lifecycle qualification", () => {
  validate(read(currentPath));
});

test("P01 v4 rejects false passes, stale inputs, fabricated counts and archive-scope expansion", () => {
  const original = read(currentPath);
  for (const mutate of [
    (value: any) => { value.result = "scoped-pass"; },
    (value: any) => { value.inherited_boundary.result = "scoped-pass"; },
    (value: any) => { value.inherited_boundary.path = previousPath; },
    (value: any) => { value.bindings.package_boundaries.sha256 = "0".repeat(64); },
    (value: any) => { value.bindings.public_execution_request.sha256 = "0".repeat(64); },
    (value: any) => { value.packages[0].allowlist_sha256 = "0".repeat(64); },
    (value: any) => { value.packages[0].file_count += 1; },
    (value: any) => { value.packages[1].checkout_only_declaration_imports = 1; },
    (value: any) => { value.validation.combined_package_suite.passed = 7; },
    (value: any) => { value.validation.build = "pass"; },
    (value: any) => { value.hard_stops.broad_directory_copy_used_as_allowlist = true; },
    (value: any) => { value.hard_stops.domainspec_cli_expanded_inventory_differs_from_allowlist = true; },
    (value: any) => { value.claim_ceiling = "P01 lifecycle complete"; },
  ]) {
    const changed = structuredClone(original);
    mutate(changed);
    assert.throws(() => validate(changed));
  }
});

test("historical P01 v2 and v3 remain intact but are not current", () => {
  for (const file of [`${evidence}/p01-package-boundaries/qualification.v2-candidate.json`, previousPath]) {
    const historical = read(file);
    assert.notEqual(digest(historical.bindings.package_boundaries.path), historical.bindings.package_boundaries.sha256);
    assert.throws(() => validate(historical));
  }
});
