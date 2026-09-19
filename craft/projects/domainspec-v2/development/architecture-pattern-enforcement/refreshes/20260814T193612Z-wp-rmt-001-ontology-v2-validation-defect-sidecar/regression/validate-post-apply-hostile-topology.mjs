#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const repoRoot = resolve(process.argv[2] ?? process.cwd());
const sourceRelative = "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260813T165705Z-wp-rmt-001-ontology-v2-apply-package/validation/validate-apply-package.mjs";
const sourcePath = resolve(repoRoot, sourceRelative);
const canonicalApplyRootRelative = "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260813T165705Z-wp-rmt-001-ontology-v2-apply-package";
const expectedSourceSha256 = "2b27e0861740600a46be207e72d4a385fc82081e82ed5e42e2eed486092b322e";
const expectedSourceSize = 149061;
const expectedOriginalFailure = "V2_HOSTILE_SURVIVED:promotion-wrong-generation-preimage:V2_PROMOTION_ROLLBACK_REF_STALE";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const requireCondition = (condition, message) => {
  if (!condition) throw new Error(message);
};

const oldFragment = [
  "    case \"promotion-wrong-generation-preimage\": {",
  "      const admitted = admittedPreviewFromFixture(syntheticLive, fixtures.positive_admission_fixtures[0]);",
  "      admitted.promotion_records[0].rollback.preimage_ref = clone(admitted.historical_preimage_refs[0]);",
  "      return validatePreview(admitted, { checkLive: true, exactPositive: false, admissionPreimageRef });",
  "    }"
].join("\n");

const repairedFragment = [
  "    case \"promotion-wrong-generation-preimage\": {",
  "      const admitted = admittedPreviewFromFixture(syntheticLive, fixtures.positive_admission_fixtures[0]);",
  "      const targetOntology = parseJson(targetOntologyPath);",
  "      const historicalOntologyPreimage = targetOntology.historical_preimage_refs.find((ref) => ref.path.endsWith(\"/ontology.json\"));",
  "      requireCondition(Boolean(historicalOntologyPreimage), \"V2_PROMOTION_FIXTURE_INVALID\", \"wrong-generation-preimage-ref\");",
  "      admitted.promotion_records[0].rollback.preimage_ref = clone(historicalOntologyPreimage);",
  "      return validatePreview(admitted, { checkLive: true, exactPositive: false, admissionPreimageRef });",
  "    }"
].join("\n");

const cleanEnvironment = () => {
  const environment = { ...process.env };
  delete environment.DOMAINSPEC_REPOSITORY_ROOT;
  delete environment.DOMAINSPEC_V1_ARCHIVE_ROOT;
  delete environment.DOMAINSPEC_SKIP_APPLY_PACKAGE_REENTRY;
  return environment;
};

const runValidator = (validatorPath, mode) => {
  const argumentsList = [validatorPath, repoRoot];
  if (mode === "live") argumentsList.push("live");
  argumentsList.push("--v2-only");
  const run = spawnSync(process.execPath, argumentsList, {
    cwd: repoRoot,
    env: cleanEnvironment(),
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024
  });
  let parsed = null;
  try {
    parsed = JSON.parse(run.stdout);
  } catch {
    throw new Error(`non-JSON ${mode} validator output: ${(run.stderr || run.stdout).trim()}`);
  }
  return {
    exit_code: run.status,
    stdout: run.stdout,
    stdout_sha256: sha256(Buffer.from(run.stdout, "utf8")),
    parsed
  };
};

const sourceBytes = readFileSync(sourcePath);
requireCondition(sourceBytes.length === expectedSourceSize, `source size drift: ${sourceBytes.length}`);
requireCondition(sha256(sourceBytes) === expectedSourceSha256, `source digest drift: ${sha256(sourceBytes)}`);
const source = sourceBytes.toString("utf8");
requireCondition(source.split(oldFragment).length - 1 === 1, "repair fragment occurrence is not exactly one");

const originalLive = runValidator(sourcePath, "live");
requireCondition(originalLive.exit_code === 1, `original live replay exit drift: ${originalLive.exit_code}`);
requireCondition(originalLive.parsed.result === "fail", `original live replay result drift: ${originalLive.parsed.result}`);
requireCondition(originalLive.parsed.errors?.length === 1 && originalLive.parsed.errors[0] === expectedOriginalFailure, `original failure drift: ${JSON.stringify(originalLive.parsed.errors)}`);

const productionCandidate = source.replace(oldFragment, repairedFragment);
const stagedOntologyPath = resolve(repoRoot, canonicalApplyRootRelative, "material/staged/projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json");
const stagedOntology = JSON.parse(readFileSync(stagedOntologyPath, "utf8"));
const archivedOntologyPreimage = stagedOntology.historical_preimage_refs.find((ref) => ref.path.endsWith("/ontology.json"));
requireCondition(Boolean(archivedOntologyPreimage), "staged ontology lacks historical ontology preimage");
const archivedOntologyBytes = readFileSync(resolve(repoRoot, archivedOntologyPreimage.path));
requireCondition(archivedOntologyBytes.length === archivedOntologyPreimage.size_bytes && sha256(archivedOntologyBytes) === archivedOntologyPreimage.sha256, "archived wrong-generation preimage is not digest-valid");
const admissionPreimagePath = resolve(repoRoot, "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260813T143151Z-wp-rmt-001-ontology-v2-proposal/preview/ontology-v2.synthetic-live.json");
const admissionPreimageBytes = readFileSync(admissionPreimagePath);
const admissionPreimageRef = {
  path: "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260813T143151Z-wp-rmt-001-ontology-v2-proposal/preview/ontology-v2.synthetic-live.json",
  sha256: sha256(admissionPreimageBytes),
  size_bytes: admissionPreimageBytes.length
};
requireCondition(JSON.stringify(archivedOntologyPreimage) !== JSON.stringify(admissionPreimageRef), "wrong-generation ref collapses to current-generation admission preimage");
const historicalSynthetic = JSON.parse(admissionPreimageBytes.toString("utf8"));
const formerLiveV1Ref = historicalSynthetic.historical_preimage_refs.find((ref) => ref.path.endsWith("/ontology.json"));
const currentLiveBytes = readFileSync(resolve(repoRoot, formerLiveV1Ref.path));
requireCondition(currentLiveBytes.length !== formerLiveV1Ref.size_bytes || sha256(currentLiveBytes) !== formerLiveV1Ref.sha256, "former live-v1 ref unexpectedly remains current after apply");
const applyRootBinding = 'const applyRoot = resolve(validationDir, "..");';
const testOnlyApplyRootBinding = `const applyRoot = resolve(repoRoot, "${canonicalApplyRootRelative}");`;
requireCondition(productionCandidate.split(applyRootBinding).length - 1 === 1, "apply-root test binding occurrence is not exactly one");
const executableCandidate = productionCandidate.replace(applyRootBinding, testOnlyApplyRootBinding);
const tempRoot = mkdtempSync(resolve(tmpdir(), "domainspec-ontology-v2-validator-repair-"));

try {
  const candidatePath = resolve(tempRoot, "validate-apply-package.candidate.mjs");
  writeFileSync(candidatePath, executableCandidate, "utf8");
  const live = runValidator(candidatePath, "live");
  requireCondition(live.exit_code === 0, `live candidate exit: ${live.exit_code}; ${JSON.stringify(live.parsed.errors)}`);
  requireCondition(live.parsed.result === "pass" && live.parsed.target_mode === "live" && live.parsed.errors.length === 0, "live candidate result invalid");
  const wrongGeneration = live.parsed.hostile_results.find((row) => row.hostile_id === "promotion-wrong-generation-preimage");
  const staleRollback = live.parsed.hostile_results.find((row) => row.hostile_id === "stale-promotion-rollback-ref");
  requireCondition(wrongGeneration?.status === "killed" && wrongGeneration.finding_code === "V2_PROMOTION_SUBJECT_ROLLBACK_MISMATCH", "live wrong-generation classification drift");
  requireCondition(staleRollback?.status === "killed" && staleRollback.finding_code === "V2_PROMOTION_ROLLBACK_REF_STALE", "live stale-reference classification drift");
  requireCondition(live.parsed.validations.hostile_controls === "37/37", "live hostile denominator drift");
  process.stdout.write(`${JSON.stringify({
    schema_version: "domainspec-ontology-v2-validator-defect-regression/v1",
    result: "pass",
    source: {
      path: sourceRelative,
      sha256: expectedSourceSha256,
      size_bytes: expectedSourceSize
    },
    classification: "ordering-and-error-classification-only",
    semantic_rollback_generation_hole: false,
    original_live_negative: {
      exit_code: originalLive.exit_code,
      result: originalLive.parsed.result,
      error: originalLive.parsed.errors[0],
      stdout_sha256: originalLive.stdout_sha256
    },
    production_candidate: {
      sha256: sha256(Buffer.from(productionCandidate, "utf8")),
      size_bytes: Buffer.byteLength(productionCandidate, "utf8"),
      changed_target_count: 1,
      target_path: sourceRelative
    },
    focused_staged_topology: {
      result: "pass",
      full_staged_replay: "not-applicable-after-live-apply-baseline-transition",
      archived_wrong_generation_ref_digest_valid: true,
      archived_wrong_generation_ref: archivedOntologyPreimage,
      current_generation_admission_preimage_ref: admissionPreimageRef,
      refs_are_distinct: true,
      former_live_v1_ref_is_stale_after_apply: true
    },
    live_candidate: {
      exit_code: live.exit_code,
      result: live.parsed.result,
      target_mode: live.parsed.target_mode,
      hostile_controls: live.parsed.validations.hostile_controls,
      wrong_generation_code: live.parsed.hostile_results.find((row) => row.hostile_id === "promotion-wrong-generation-preimage").finding_code,
      stale_reference_code: live.parsed.hostile_results.find((row) => row.hostile_id === "stale-promotion-rollback-ref").finding_code,
      stdout_sha256: live.stdout_sha256
    },
    authority_effect: "none"
  }, null, 2)}\n`);
} finally {
  rmSync(tempRoot, { recursive: true, force: false });
}
