import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { defaultDomainSpecPackageRoot } from "../src/domainspec-cli.js";
import { validateCandidate } from "../scripts/p03-exact-candidate.js";

const repo = path.resolve(defaultDomainSpecPackageRoot(), "../../../../..");
const implementation = path.join(repo, "language/capabilities/alchlang/plans/general-compiler-v1/implementation");
const evidence = path.join(repo, "craft/projects/domainspec-v2/development/authoring-to-runtime-v1/evidence/p03-exact-candidate");
const candidatePath = path.join(evidence, "successor-v3-candidate/candidate.json");
const qualificationPath = path.join(evidence, "successor-v3-candidate/qualification.json");
const previousCandidatePath = path.join(evidence, "successor-v2-candidate/candidate.json");
const previousQualificationPath = path.join(evidence, "successor-v2-candidate/qualification.json");
const historicalCandidatePath = path.join(evidence, "candidate.json");
const historicalQualificationPath = path.join(evidence, "qualification.json");
const schemaPath = path.join(repo, "craft/projects/domainspec-v2/development/authoring-to-runtime-v1/p03-candidate.v2.schema.json");
const sha256 = (file: string) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const read = (file: string) => JSON.parse(fs.readFileSync(file, "utf8"));

function snapshot(): Array<[string, number, string]> {
  return [historicalCandidatePath, historicalQualificationPath, previousCandidatePath, previousQualificationPath, candidatePath, qualificationPath]
    .map(file => [path.relative(evidence, file), fs.statSync(file).mtimeMs, sha256(file)]);
}

test("P03 successor is current, schema-valid, closed and fully denominator-bound", () => {
  const candidate = read(candidatePath);
  const result = validateCandidate(candidate, true);
  assert.equal(result.result, "pass", JSON.stringify(result, null, 2));
  assert.equal(candidate.schema_version, "alchlang.p03-exact-candidate/v2-candidate");
  const schema = spawnSync("python3", ["-c", "import json,jsonschema,sys;jsonschema.Draft202012Validator(json.load(open(sys.argv[1]))).validate(json.load(open(sys.argv[2])))", schemaPath, candidatePath], { encoding: "utf8" });
  assert.equal(schema.status, 0, schema.stderr || String(schema.error));
  assert.equal(candidate.source_groups.length, 7);
  assert.equal(candidate.package_archives.length, 4);
  assert.deepEqual(candidate.generated_projects.map((item: any) => item.language), ["typescript", "python", "rust"]);
  assert.ok(candidate.source_groups.every((item: any) => item.files.length > 0));
  assert.ok(candidate.package_archives.every((item: any) => item.archive_sha256 === item.p02_archive_sha256));
  assert.ok(candidate.generated_projects.every((item: any) => item.build_manifest_sha256 === item.p02_build_manifest_sha256));
});

test("P03 currentness command is non-mutating", () => {
  const before = snapshot();
  const result = spawnSync(process.execPath, ["scripts/run-toolchain.mjs", "tsx", "scripts/p03-exact-candidate.ts", "--check"], { cwd: implementation, encoding: "utf8" });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(JSON.parse(result.stdout).result, "pass");
  assert.deepEqual(snapshot(), before);
});

test("P03 rejects stale files, archive drift, generated drift, tool drift and claim growth", () => {
  const original = read(candidatePath);
  const mutations = [
    (value: any) => { value.source_groups[0].files[0].sha256 = "0".repeat(64); },
    (value: any) => { value.package_archives[0].files.pop(); },
    (value: any) => { value.package_archives[1].archive_sha256 = "0".repeat(64); },
    (value: any) => { value.generated_projects[0].build_manifest_sha256 = "0".repeat(64); },
    (value: any) => { value.tools[0].version = "v0.0.0"; },
    (value: any) => { value.receipts[0].sha256 = "0".repeat(64); },
    (value: any) => { value.materialization.historical_evidence_refreshed = true; },
    (value: any) => { value.claim_ceiling.publication = true; },
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(original);
    mutate(changed);
    assert.equal(validateCandidate(changed, true).result, "fail");
  }
});

test("P03 qualification binds candidate, schema, validator, test and predecessor", () => {
  const qualification = read(qualificationPath);
  assert.equal(qualification.schema_version, "alchlang.p03-exact-candidate-qualification/v3-candidate");
  assert.equal(qualification.task, "P03");
  assert.equal(qualification.result, "scoped-pass");
  assert.equal(qualification.authority_effect, "none");
  assert.equal(qualification.candidate.path, path.relative(repo, candidatePath));
  assert.equal(qualification.supersedes_historical_candidate.path, path.relative(repo, historicalCandidatePath));
  assert.equal(qualification.supersedes_historical_qualification.path, path.relative(repo, historicalQualificationPath));
  assert.equal(qualification.supersedes_previous_candidate.path, path.relative(repo, previousCandidatePath));
  assert.equal(qualification.supersedes_previous_qualification.path, path.relative(repo, previousQualificationPath));
  for (const binding of [qualification.candidate, qualification.supersedes_historical_candidate,
    qualification.supersedes_historical_qualification, qualification.supersedes_previous_candidate,
    qualification.supersedes_previous_qualification, ...Object.values(qualification.bindings)] as Array<{ path: string; size_bytes: number; sha256: string }>) {
    const file = path.join(repo, binding.path);
    assert.equal(sha256(file), binding.sha256, binding.path);
    assert.equal(fs.statSync(file).size, binding.size_bytes, binding.path);
  }
  assert.deepEqual(Object.keys(qualification.bindings), ["schema", "materializer_and_validator", "adversarial_test", "safety_test", "p01_predecessor", "p02_predecessor"]);
  assert.equal(qualification.bindings.schema.path, path.relative(repo, schemaPath));
  assert.match(qualification.bindings.p01_predecessor.path, /qualification\.v3-candidate\.json$/u);
  assert.match(qualification.bindings.p02_predecessor.path, /successor-v5-candidate\/qualification\.json$/u);
  const candidate = read(candidatePath);
  assert.equal(qualification.candidate_id, candidate.candidate_id);
  assert.equal(qualification.candidate_manifest_sha256, candidate.manifest_sha256);
  assert.deepEqual(qualification.validation, { currentness: "pass", non_mutating: true, adversarial_cases: 8, failed: 0, skipped: 0 });
  assert.ok(Object.values(qualification.hard_stops).every(item => item === false));
  assert.match(qualification.claim_ceiling, /construction evidence only/u);
});

test("previous P03 v2 remains preserved but cannot claim current source", () => {
  const previous = read(previousCandidatePath);
  const result = validateCandidate(previous, true);
  assert.equal(result.result, "fail");
  assert.equal(result.checks.find(item => item.id === "source-current")?.result, "fail");
});
