#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(process.argv[2] ?? process.cwd());
const validationDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(validationDir, "..");
const packageRootRelative = "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260815T214711Z-wp-rmt-001-ontology-v2-validator-repair-package";
const packageId = "WP-RMT-001-ONTOLOGY-V2-VALIDATOR-ONE-TARGET-REPAIR-20260815T214711Z";
const targetPath = "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260813T165705Z-wp-rmt-001-ontology-v2-apply-package/validation/validate-apply-package.mjs";
const expectedOriginalFailure = "V2_HOSTILE_SURVIVED:promotion-wrong-generation-preimage:V2_PROMOTION_ROLLBACK_REF_STALE";
const expectedPreimage = { sha256: "2b27e0861740600a46be207e72d4a385fc82081e82ed5e42e2eed486092b322e", size_bytes: 149061 };
const expectedPostimage = { sha256: "985e4c5404fb7037b2aecf282e9cb05ebe129ae08cd6d6093a3d018c2bcf522c", size_bytes: 149370 };
const expectedTargetInventoryDigest = "817ef12b2ae3261b578b82570423ca984fd786363cd1488becabf1e9f3f04bb0";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const requireCondition = (condition, code, detail = "") => {
  if (!condition) throw new Error(detail ? `${code}:${detail}` : code);
};
const normalizeRelative = (path) => relative(packageRoot, path).split("\\").join("/");
const stableSort = (rows) => rows.sort((left, right) => left < right ? -1 : left > right ? 1 : 0);

const inspectFile = (path, expected, code) => {
  const stat = lstatSync(path);
  requireCondition(stat.isFile() && !stat.isSymbolicLink(), `${code}_TYPE`, path);
  const bytes = readFileSync(path);
  requireCondition(bytes.length === expected.size_bytes, `${code}_SIZE`, `${path}:${bytes.length}`);
  requireCondition(sha256(bytes) === expected.sha256, `${code}_SHA256`, path);
  return bytes;
};

const parseJsonBytes = (bytes, path) => {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`JSON_PARSE:${path}:${error.message}`);
  }
};

const readJson = (path) => parseJsonBytes(readFileSync(path), path);

const cleanEnvironment = () => {
  const environment = { ...process.env };
  delete environment.DOMAINSPEC_REPOSITORY_ROOT;
  delete environment.DOMAINSPEC_V1_ARCHIVE_ROOT;
  delete environment.DOMAINSPEC_SKIP_APPLY_PACKAGE_REENTRY;
  return environment;
};

const runNode = (argumentsList) => spawnSync(process.execPath, argumentsList, {
  cwd: repoRoot,
  env: cleanEnvironment(),
  encoding: "utf8",
  maxBuffer: 16 * 1024 * 1024
});

const walkPackageFiles = (directory) => {
  const rows = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    const stat = lstatSync(path);
    requireCondition(!stat.isSymbolicLink(), "PACKAGE_SYMLINK_FORBIDDEN", normalizeRelative(path));
    if (stat.isDirectory()) rows.push(...walkPackageFiles(path));
    else {
      requireCondition(stat.isFile(), "PACKAGE_NONREGULAR_FORBIDDEN", normalizeRelative(path));
      rows.push(normalizeRelative(path));
    }
  }
  return stableSort(rows);
};

const requiredPackageFiles = stableSort([
  "CONTEXT-PACK.md",
  "DISPATCH.json",
  "FAILURE-LEDGER.json",
  "REFRESH-PATCH-PROPOSAL.md",
  "REFRESH-REPORT.md",
  "REGRESSION-RESULT.json",
  "REPAIR-PACKAGE.md",
  "context-index.json",
  "material/MATERIAL-PACKAGE.json",
  "material/MATERIAL-RECEIPT.json",
  `material/preimages/${targetPath}`,
  `material/staged/${targetPath}`,
  "ordinary-live-validator.stdout.json",
  "refresh-report.json",
  "regression/validate-post-apply-hostile-topology.mjs",
  "repair-manifest.json",
  "repair/validate-apply-package.patch",
  "validation/validate-repair-package.mjs"
]);
const optionalPackageFiles = new Set(["VALIDATION-RESULT.json", "REPAIR-PACKAGE-RECEIPT.json"]);

const selectedSources = [
  {
    role: "accepted_package_receipt",
    path: "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260813T165705Z-wp-rmt-001-ontology-v2-apply-package/APPLY-PACKAGE-RECEIPT.json",
    sha256: "ebdbb200f0df38d8cb63593ee09786cf79ca00fd648a972d9d611ab05a76e2e8",
    size_bytes: 21494
  },
  {
    role: "accepted_validator_preimage",
    path: targetPath,
    ...expectedPreimage
  },
  {
    role: "live_apply_block_receipt",
    path: "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260814T192631Z-wp-rmt-001-ontology-v2-live-apply/LIVE-APPLY-RECEIPT.json",
    sha256: "a8d4e29bb48159a953f986d4fdb34434f0fd81467ed321bd384544bdc0d97dda",
    size_bytes: 9506
  },
  {
    role: "governance_defect_sidecar_receipt",
    path: "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260814T193612Z-wp-rmt-001-ontology-v2-validation-defect-sidecar/SIDECAR-RECEIPT.json",
    sha256: "706e42dd9f0fd4ab9a220ab85e284a0b93bb9dfebc6a7b994683894c57b77f76",
    size_bytes: 10634
  },
  {
    role: "repair_patch",
    path: "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260814T193612Z-wp-rmt-001-ontology-v2-validation-defect-sidecar/repair/validate-apply-package.patch",
    sha256: "484c1ef52b8799d93c22a8ed646e39700061391bdd7104409645cc34721028de",
    size_bytes: 1632
  },
  {
    role: "permanent_regression",
    path: "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260814T193612Z-wp-rmt-001-ontology-v2-validation-defect-sidecar/regression/validate-post-apply-hostile-topology.mjs",
    sha256: "db3c26bbefc430011c3db12d170fec227f3fb7ce0c878ed17114a67cd6e69c1c",
    size_bytes: 9894
  },
  {
    role: "ordinary_live_validator",
    path: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-ontology.mjs",
    sha256: "3de34afb076339bce71b7a935a4bd7295df878cdc0c9e529600ce7f0803d9dbc",
    size_bytes: 169605
  }
];

const immutableParentInputs = [
  { path: "DISPATCH.json", sha256: "63c48d7a29dd5b4d2971d9026fbfa565bba17f9a29ebabbe54b97b6680dafe34", size_bytes: 8053 },
  { path: "CONTEXT-PACK.md", sha256: "943edf3697f6619c65912699b834a37e7d3230f80f60614a75a98f04b21fac6b", size_bytes: 5241 },
  { path: "context-index.json", sha256: "d0859b3ba0de62c0eaaf1120f52d1934d1e1d1c107a8dd41fb3d58864faef5b4", size_bytes: 3445 }
];

const liveBaselines = [
  { path: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/schema/architecture-property-ontology-v2.schema.json", sha256: "d616095d63a656af121df2ebc41cd9e6cd3e88d7fd3b6f3edebf50a9a2252f59", size_bytes: 43684 },
  { path: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/schema/promotion-record-v1.schema.json", sha256: "9e1e144308ccaadbfc71fe9e7004f68fef82da3860fc13c2cae9fd4c29fcb86f", size_bytes: 11066 },
  { path: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json", sha256: "6cd5a46c8d51c3c88f16a5ee483e190c6225e5aebeffbb909070ad6cac44169a", size_bytes: 151653 },
  { path: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/domain-meta-types.projection.json", sha256: "43afaa7532614ddc1894b1d4760cb434792964295b1ec637e9ddcbf74f052323", size_bytes: 34206 },
  { path: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-ontology.mjs", sha256: "3de34afb076339bce71b7a935a4bd7295df878cdc0c9e529600ce7f0803d9dbc", size_bytes: 169605 }
];

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

const validate = () => {
  requireCondition(normalizeRelative(packageRoot) === "", "PACKAGE_ROOT_SELF_RELATIVE_INVALID");
  requireCondition(relative(repoRoot, packageRoot).split("\\").join("/") === packageRootRelative, "PACKAGE_ROOT_INVALID", packageRoot);

  const actualFiles = walkPackageFiles(packageRoot);
  for (const required of requiredPackageFiles) requireCondition(actualFiles.includes(required), "PACKAGE_FILE_MISSING", required);
  for (const actual of actualFiles) requireCondition(requiredPackageFiles.includes(actual) || optionalPackageFiles.has(actual), "PACKAGE_FILE_UNDECLARED", actual);

  for (const relativePath of actualFiles) {
    const path = resolve(packageRoot, relativePath);
    const bytes = readFileSync(path);
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const text = bytes.toString("utf8");
    requireCondition(text.endsWith("\n"), "HYGIENE_FINAL_LF", relativePath);
    requireCondition(!text.includes("\r"), "HYGIENE_CR_FORBIDDEN", relativePath);
    requireCondition(!/[ \t]+$/m.test(text), "HYGIENE_TRAILING_WHITESPACE", relativePath);
    if (relativePath.endsWith(".json")) parseJsonBytes(bytes, relativePath);
  }

  for (const input of immutableParentInputs) inspectFile(resolve(packageRoot, input.path), input, "PARENT_INPUT_DRIFT");
  const sourceBytes = new Map();
  for (const source of selectedSources) sourceBytes.set(source.role, inspectFile(resolve(repoRoot, source.path), source, "SELECTED_SOURCE_DRIFT"));

  const acceptedReceipt = parseJsonBytes(sourceBytes.get("accepted_package_receipt"), "accepted-package-receipt");
  requireCondition(acceptedReceipt.result === "pass", "ACCEPTED_PACKAGE_RECEIPT_NOT_PASS");
  requireCondition(acceptedReceipt.pre_receipt_inventory?.sha256 === "4f3d288494408c22c8c0342aa29837d80803cb8cfad995050b2e3374335cd3b9", "ACCEPTED_PACKAGE_INVENTORY_DRIFT");
  const liveReceipt = parseJsonBytes(sourceBytes.get("live_apply_block_receipt"), "live-apply-receipt");
  requireCondition(liveReceipt.result === "block" && liveReceipt.post_apply_validation?.failure_code === expectedOriginalFailure, "LIVE_APPLY_FAILURE_BINDING_DRIFT");
  const sidecarReceipt = parseJsonBytes(sourceBytes.get("governance_defect_sidecar_receipt"), "sidecar-receipt");
  requireCondition(sidecarReceipt.result === "pass" && sidecarReceipt.classification?.ordering_and_error_classification_only === true, "SIDECAR_CLASSIFICATION_DRIFT");
  requireCondition(sidecarReceipt.minimal_repair?.target?.candidate_postimage?.sha256 === expectedPostimage.sha256, "SIDECAR_POSTIMAGE_DRIFT");

  const contextIndex = readJson(resolve(packageRoot, "context-index.json"));
  requireCondition(contextIndex.strict_coverage === "pass" && contextIndex.obligation_coverage === "7/7", "CONTEXT_COVERAGE_INVALID");
  const dispatch = readJson(resolve(packageRoot, "DISPATCH.json"));
  requireCondition(dispatch.dispatch_id === "wp-rmt-002-prerequisite-validator-repair-20260815T214711Z", "DISPATCH_ID_INVALID");
  requireCondition(dispatch.subagent_strategy?.authorization === "approved", "DISPATCH_AUTHORIZATION_INVALID");

  const rawPath = resolve(packageRoot, `material/preimages/${targetPath}`);
  const stagedPath = resolve(packageRoot, `material/staged/${targetPath}`);
  const rawBytes = inspectFile(rawPath, expectedPreimage, "RAW_PREIMAGE_INVALID");
  const stagedBytes = inspectFile(stagedPath, expectedPostimage, "STAGED_POSTIMAGE_INVALID");
  requireCondition(Buffer.compare(rawBytes, sourceBytes.get("accepted_validator_preimage")) === 0, "RAW_PREIMAGE_NOT_ACCEPTED_BYTES");
  requireCondition(Buffer.compare(readFileSync(resolve(packageRoot, "repair/validate-apply-package.patch")), sourceBytes.get("repair_patch")) === 0, "PATCH_COPY_DRIFT");
  requireCondition(Buffer.compare(readFileSync(resolve(packageRoot, "regression/validate-post-apply-hostile-topology.mjs")), sourceBytes.get("permanent_regression")) === 0, "REGRESSION_COPY_DRIFT");
  const rawText = rawBytes.toString("utf8");
  requireCondition(rawText.split(oldFragment).length - 1 === 1, "REPAIR_FRAGMENT_OCCURRENCE_INVALID");
  requireCondition(rawText.replace(oldFragment, repairedFragment) === stagedBytes.toString("utf8"), "PATCH_MATERIALIZATION_NOT_EXACT");
  const targetInventoryRow = `${expectedPreimage.sha256}\t${expectedPreimage.size_bytes}\t${expectedPostimage.sha256}\t${expectedPostimage.size_bytes}\t${targetPath}\n`;
  requireCondition(sha256(Buffer.from(targetInventoryRow, "utf8")) === expectedTargetInventoryDigest, "TARGET_INVENTORY_DIGEST_INVALID");

  const materialPackage = readJson(resolve(packageRoot, "material/MATERIAL-PACKAGE.json"));
  requireCondition(materialPackage.package_id === packageId && materialPackage.target_count === 1, "MATERIAL_PACKAGE_ID_OR_SCOPE_INVALID");
  requireCondition(materialPackage.canonical_target_inventory?.sha256 === expectedTargetInventoryDigest, "MATERIAL_PACKAGE_DIGEST_INVALID");
  requireCondition(materialPackage.apply_authorization === "absent" && materialPackage.authority_effect === "none", "MATERIAL_PACKAGE_AUTHORITY_INVALID");
  const materialReceipt = readJson(resolve(packageRoot, "material/MATERIAL-RECEIPT.json"));
  requireCondition(materialReceipt.result === "pass" && materialReceipt.validated_target_count === 1, "MATERIAL_RECEIPT_INVALID");
  requireCondition(materialReceipt.apply_authorization === "absent" && materialReceipt.authority_effect === "none", "MATERIAL_RECEIPT_AUTHORITY_INVALID");
  const manifest = readJson(resolve(packageRoot, "repair-manifest.json"));
  requireCondition(manifest.package_id === packageId && manifest.target_count === 1, "MANIFEST_SCOPE_INVALID");
  requireCondition(manifest.package_contract?.pre_receipt_file_count === 19, "MANIFEST_FILE_COUNT_INVALID");
  requireCondition(manifest.selected_source_bindings?.length === 7 && manifest.live_target_baselines?.length === 5, "MANIFEST_DENOMINATOR_INVALID");
  const failureLedger = readJson(resolve(packageRoot, "FAILURE-LEDGER.json"));
  requireCondition(failureLedger.status === "repair-staged-not-applied" && failureLedger.classification?.semantic_rollback_generation_hole === false, "FAILURE_LEDGER_INVALID");
  const refreshReport = readJson(resolve(packageRoot, "refresh-report.json"));
  requireCondition(refreshReport.phaseStatus === "pass" && refreshReport.mutationMode === "proposal-only" && refreshReport.mutationReady === false, "REFRESH_REPORT_STATUS_INVALID");
  requireCondition(refreshReport.targetArtifacts?.length === 1 && refreshReport.targetArtifacts[0] === targetPath && refreshReport.appliedChanges?.length === 0, "REFRESH_REPORT_SCOPE_INVALID");

  const stagedSyntax = runNode(["--check", stagedPath]);
  requireCondition(stagedSyntax.status === 0, "STAGED_SYNTAX_FAILED", (stagedSyntax.stderr || stagedSyntax.stdout).trim());

  const regressionPath = resolve(packageRoot, "regression/validate-post-apply-hostile-topology.mjs");
  const regressionRun = runNode([regressionPath, repoRoot]);
  requireCondition(regressionRun.status === 0, "REGRESSION_COMMAND_FAILED", (regressionRun.stderr || regressionRun.stdout).trim());
  const storedRegressionBytes = inspectFile(resolve(packageRoot, "REGRESSION-RESULT.json"), { sha256: "804ad1a01af8c6f4ba388d249d2798dcfbd7c6ec0ffe1caa29035ce4c0277426", size_bytes: 2584 }, "STORED_REGRESSION_INVALID");
  requireCondition(Buffer.compare(Buffer.from(regressionRun.stdout, "utf8"), storedRegressionBytes) === 0, "REGRESSION_OUTPUT_NOT_DETERMINISTIC");
  const regression = parseJsonBytes(storedRegressionBytes, "REGRESSION-RESULT.json");
  requireCondition(regression.result === "pass", "REGRESSION_RESULT_NOT_PASS");
  requireCondition(regression.original_live_negative?.exit_code === 1 && regression.original_live_negative?.error === expectedOriginalFailure, "ORIGINAL_LIVE_NEGATIVE_INVALID");
  requireCondition(regression.production_candidate?.sha256 === expectedPostimage.sha256 && regression.production_candidate?.size_bytes === expectedPostimage.size_bytes, "REGRESSION_CANDIDATE_INVALID");
  requireCondition(regression.live_candidate?.exit_code === 0 && regression.live_candidate?.result === "pass" && regression.live_candidate?.hostile_controls === "37/37", "CANDIDATE_LIVE_REPLAY_INVALID");
  requireCondition(regression.live_candidate?.wrong_generation_code === "V2_PROMOTION_SUBJECT_ROLLBACK_MISMATCH", "WRONG_GENERATION_CODE_INVALID");
  requireCondition(regression.live_candidate?.stale_reference_code === "V2_PROMOTION_ROLLBACK_REF_STALE", "STALE_REFERENCE_CODE_INVALID");

  const ordinaryValidatorPath = resolve(repoRoot, selectedSources.find((row) => row.role === "ordinary_live_validator").path);
  const ordinaryRun = runNode([ordinaryValidatorPath]);
  requireCondition(ordinaryRun.status === 0, "ORDINARY_LIVE_VALIDATOR_FAILED", (ordinaryRun.stderr || ordinaryRun.stdout).trim());
  const storedOrdinaryBytes = inspectFile(resolve(packageRoot, "ordinary-live-validator.stdout.json"), { sha256: "9fcc614912fc9c3c3f4ea49f28aabbff507f7839c0e9e8205292b7f3a5927dc2", size_bytes: 15468 }, "STORED_ORDINARY_INVALID");
  requireCondition(Buffer.compare(Buffer.from(ordinaryRun.stdout, "utf8"), storedOrdinaryBytes) === 0, "ORDINARY_OUTPUT_NOT_DETERMINISTIC");
  const ordinary = parseJsonBytes(storedOrdinaryBytes, "ordinary-live-validator.stdout.json");
  requireCondition(ordinary.verdict === "pass" && ordinary.v2_validation?.result === "pass" && ordinary.checks?.length === 24 && ordinary.errors?.length === 0, "ORDINARY_LIVE_RESULT_INVALID");

  inspectFile(resolve(repoRoot, targetPath), expectedPreimage, "ACCEPTED_VALIDATOR_POST_VALIDATION_DRIFT");
  for (const baseline of liveBaselines) inspectFile(resolve(repoRoot, baseline.path), baseline, "LIVE_TARGET_POST_VALIDATION_DRIFT");

  return {
    schema_version: "domainspec-ontology-v2-validator-repair-package-validation/v1",
    package_id: packageId,
    result: "pass",
    target_mode: "isolated-one-target-repair-package",
    validations: {
      immutable_parent_inputs: "3/3 exact",
      selected_source_bindings: "7/7 exact",
      accepted_package_receipt_and_inventory: "exact",
      target_scope: "1/1",
      raw_preimage: "exact accepted bytes",
      staged_postimage: "exact sidecar projection",
      patch_materialization: "byte-exact",
      original_live_negative: "expected-fail exit 1 exact stale-code collision",
      candidate_live_replay: "pass 37/37 hostiles",
      distinct_hostile_diagnostics: "wrong-generation and stale-reference exact",
      ordinary_live_no_environment_validator: "pass 24 checks",
      stored_regression_output: "byte-exact",
      stored_ordinary_output: "byte-exact",
      accepted_validator_baseline: "unchanged",
      live_target_baselines: "5/5 unchanged",
      package_scope_and_hygiene: "18/18 required materials; only validation result and terminal receipt are optional",
      deterministic_validation_result_comparison: "external byte comparison required"
    },
    command_exits: {
      staged_candidate_syntax: 0,
      permanent_regression_wrapper: 0,
      original_live_negative: 1,
      candidate_live_replay: 0,
      ordinary_live_validator: 0
    },
    failure_replay: {
      observed_error: expectedOriginalFailure,
      expected_error: "V2_PROMOTION_SUBJECT_ROLLBACK_MISMATCH",
      classification: "ordering-and-error-classification-only",
      semantic_rollback_generation_hole: false
    },
    candidate_replay: {
      staged_sha256: expectedPostimage.sha256,
      staged_size_bytes: expectedPostimage.size_bytes,
      hostile_controls: "37/37",
      wrong_generation_code: "V2_PROMOTION_SUBJECT_ROLLBACK_MISMATCH",
      stale_reference_code: "V2_PROMOTION_ROLLBACK_REF_STALE"
    },
    ordinary_live_validator: {
      verdict: "pass",
      check_count: 24,
      v2_result: "pass"
    },
    owner_gate: {
      fresh_exact_byte_owner_acceptance: "required-and-absent",
      apply_authorization: "absent",
      admission_authorization: "absent",
      promotion_record_creation_authorization: "absent",
      promotion_authorization: "absent"
    },
    authority_effect: "none",
    errors: [],
    claim_ceiling: "Validation proves only the exact one-target staged repair package. It does not apply the candidate or authorize admission, PromotionRecord creation, promotion, publication, release, deployment, production, Git, network, or WP-RMT-002 execution."
  };
};

let output;
let exitCode = 0;
try {
  output = validate();
} catch (error) {
  exitCode = 1;
  output = {
    schema_version: "domainspec-ontology-v2-validator-repair-package-validation/v1",
    package_id: packageId,
    result: "fail",
    target_mode: "isolated-one-target-repair-package",
    errors: [error.message],
    authority_effect: "none"
  };
}
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
process.exitCode = exitCode;
