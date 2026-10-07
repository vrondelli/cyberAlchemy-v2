#!/usr/bin/env node
import {closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, writeFileSync} from "node:fs";
import {dirname, join, resolve} from "node:path";

import {canonicalJson, canonicalizeJson} from "../../intent-route-resolver/index.mjs";
import {calculateInteractionBaseline, scanCodexInteractionSources, verifyInteractionIngestion} from "../src/interaction-learning-ingestion.mjs";
import {materializeInteractionHypothesis, materializeInteractionLearningPackage, materializeInteractionLiveValidation, materializeInteractionOfflineScreen, materializeInteractionOwnerDecision} from "../src/interaction-learning-cycle-v1.mjs";

function failure(reasonCodes, residue = []) {
  return {schema_version: "are.interaction-learning-cli-result/v1", ok: false, reason_codes: reasonCodes, residue, authority_effect: "none"};
}

function closed(value, allowed) {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).every((key) => allowed.has(key));
}

function persist(root, cycleId, name, value) {
  const directory = resolve(root, "cycles", cycleId);
  const path = join(directory, name);
  mkdirSync(dirname(path), {recursive: true, mode: 0o700});
  const bytes = `${canonicalJson(canonicalizeJson(value))}\n`;
  const temporary = `${path}.tmp-${process.pid}`;
  writeFileSync(temporary, bytes, {flag: "wx", mode: 0o600});
  const descriptor = openSync(temporary, "r");
  try { fsyncSync(descriptor); } finally { closeSync(descriptor); }
  renameSync(temporary, path);
  const directoryDescriptor = openSync(dirname(path), "r");
  try { fsyncSync(directoryDescriptor); } finally { closeSync(directoryDescriptor); }
  return path;
}

function receipt(cycleId, operation, artifactName, value) {
  const baseOperation = operation.replace(/-v[234]$/, "");
  const digestKey = {scan: "manifest_digest", baseline: "baseline_digest", hypothesis: "hypothesis_digest", screen: "screen_digest", assess: "validation_digest", package: "package_digest", close: "decision_digest"}[baseOperation];
  return {
    schema_version: "are.interaction-learning-stage-receipt/v1",
    cycle_id: cycleId,
    operation,
    artifact_ref: artifactName,
    artifact_digest: value[digestKey],
    status: baseOperation === "scan" ? "INGESTION_COMPLETE" : baseOperation === "baseline" ? value.status : baseOperation === "hypothesis" ? "HYPOTHESIS_FROZEN" : ["screen", "assess"].includes(baseOperation) ? value.disposition : baseOperation === "close" ? value.cycle_status : value.decision,
    authority_effect: "none",
  };
}

let output;
try {
  const rootIndex = process.argv.indexOf("--root");
  const root = rootIndex >= 0 ? process.argv[rootIndex + 1] : null;
  const request = JSON.parse(readFileSync(0, "utf8"));
  const allowedTop = new Set(["schema_version", "operation", "cycle_id", "input"]);
  const validTop = typeof root === "string" && root.length > 0
    && closed(request, allowedTop)
    && request.schema_version === "are.interaction-learning-cli-request/v1"
    && ["scan", "seal-scan", "baseline", "hypothesis", "hypothesis-v2", "hypothesis-v3", "hypothesis-v4", "screen", "screen-v2", "screen-v3", "screen-v4", "assess", "assess-v2", "assess-v3", "assess-v4", "package", "package-v2", "package-v3", "package-v4", "close"].includes(request.operation)
    && typeof request.cycle_id === "string"
    && /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(request.cycle_id)
    && closed(request.input, request.operation === "scan" ? new Set(["sources", "cwd_markers"])
      : request.operation === "seal-scan" ? new Set(["ingestion_path"])
      : request.operation === "baseline" ? new Set(["ingestion_path", "labels", "partition_policy"])
      : request.operation === "hypothesis" ? new Set(["baseline_path"])
      : ["hypothesis-v2", "hypothesis-v3", "hypothesis-v4"].includes(request.operation) ? new Set(["baseline_path", "prior_validation_path"])
      : ["screen", "screen-v2", "screen-v3", "screen-v4"].includes(request.operation) ? new Set(["baseline_path", "hypothesis_path", "labels"])
      : ["assess", "assess-v2", "assess-v3", "assess-v4"].includes(request.operation) ? new Set(["hypothesis_path", "run_manifest_path", "verdicts"])
      : request.operation === "close" ? new Set(["learning_package_path", "decision_ref"])
      : new Set(["baseline_path", "hypothesis_path", "offline_screen_path", "validation_path"]));
  if (!validTop) output = failure(["interaction-learning.request-invalid"]);
  else if (request.operation === "scan") {
    const value = await scanCodexInteractionSources(request.input);
    const path = persist(root, request.cycle_id, "ingestion.json", value);
    const receiptPath = persist(root, request.cycle_id, "receipts/scan.json", receipt(request.cycle_id, "scan", "ingestion.json", value));
    output = {schema_version: "are.interaction-learning-cli-result/v1", ok: true, operation: "scan", value, persisted_path: path, receipt_path: receiptPath, authority_effect: "none"};
  } else if (request.operation === "seal-scan") {
    const ingestionPath = resolve(request.input.ingestion_path ?? "");
    const expectedPath = resolve(root, "cycles", request.cycle_id, "ingestion.json");
    if (ingestionPath !== expectedPath || !existsSync(ingestionPath)) output = failure(["interaction-learning.ingestion-missing-or-outside-cycle"]);
    else {
      const value = JSON.parse(readFileSync(ingestionPath, "utf8"));
      const verification = verifyInteractionIngestion(value);
      if (!verification.ok) output = failure(verification.reason_codes);
      else {
        const receiptPath = persist(root, request.cycle_id, "receipts/scan.json", receipt(request.cycle_id, "scan", "ingestion.json", value));
        output = {schema_version: "are.interaction-learning-cli-result/v1", ok: true, operation: "seal-scan", value: verification, persisted_path: ingestionPath, receipt_path: receiptPath, authority_effect: "none"};
      }
    }
  } else if (request.operation === "baseline") {
    const ingestionPath = resolve(request.input.ingestion_path ?? "");
    const expectedPath = resolve(root, "cycles", request.cycle_id, "ingestion.json");
    if (ingestionPath !== expectedPath) output = failure(["interaction-learning.ingestion-outside-cycle"]);
    else if (!existsSync(ingestionPath)) output = failure(["interaction-learning.ingestion-missing"]);
    else {
      const ingestion = JSON.parse(readFileSync(ingestionPath, "utf8"));
      const value = calculateInteractionBaseline({ingestion, labels: request.input.labels, partition_policy: request.input.partition_policy});
      const path = persist(root, request.cycle_id, "baseline.json", value);
      const receiptPath = persist(root, request.cycle_id, "receipts/baseline.json", receipt(request.cycle_id, "baseline", "baseline.json", value));
      output = {schema_version: "are.interaction-learning-cli-result/v1", ok: true, operation: "baseline", value, persisted_path: path, receipt_path: receiptPath, authority_effect: "none"};
    }
  } else {
    const cycleDirectory = resolve(root, "cycles", request.cycle_id);
    const readCycleArtifact = (supplied, name) => {
      const path = resolve(supplied ?? "");
      if (path !== resolve(cycleDirectory, name) || !existsSync(path)) throw new Error("interaction-learning.artifact-missing-or-outside-cycle");
      return JSON.parse(readFileSync(path, "utf8"));
    };
    let value, artifactName;
    if (["hypothesis", "hypothesis-v2", "hypothesis-v3", "hypothesis-v4"].includes(request.operation)) {
      const baseline = readCycleArtifact(request.input.baseline_path, "baseline.json");
      const revision = request.operation === "hypothesis-v4" ? 4 : request.operation === "hypothesis-v3" ? 3 : request.operation === "hypothesis-v2" ? 2 : 1;
      const priorValidation = revision === 4 ? readCycleArtifact(request.input.prior_validation_path, "validation-v3.json") : revision === 3 ? readCycleArtifact(request.input.prior_validation_path, "validation-v2.json") : revision === 2 ? readCycleArtifact(request.input.prior_validation_path, "validation.json") : null;
      value = materializeInteractionHypothesis({cycle_id: request.cycle_id, baseline, revision, prior_validation:priorValidation});
      artifactName = revision === 4 ? "hypothesis-v4.json" : revision === 3 ? "hypothesis-v3.json" : revision === 2 ? "hypothesis-v2.json" : "hypothesis.json";
    } else if (["screen", "screen-v2", "screen-v3", "screen-v4"].includes(request.operation)) {
      const baseline = readCycleArtifact(request.input.baseline_path, "baseline.json");
      const revision = request.operation === "screen-v4" ? 4 : request.operation === "screen-v3" ? 3 : request.operation === "screen-v2" ? 2 : 1;
      const hypothesis = readCycleArtifact(request.input.hypothesis_path, revision === 4 ? "hypothesis-v4.json" : revision === 3 ? "hypothesis-v3.json" : revision === 2 ? "hypothesis-v2.json" : "hypothesis.json");
      value = materializeInteractionOfflineScreen({baseline, hypothesis, labels:request.input.labels});
      artifactName = revision === 4 ? "offline-screen-v4.json" : revision === 3 ? "offline-screen-v3.json" : revision === 2 ? "offline-screen-v2.json" : "offline-screen.json";
    } else if (["assess", "assess-v2", "assess-v3", "assess-v4"].includes(request.operation)) {
      const revision = request.operation === "assess-v4" ? 4 : request.operation === "assess-v3" ? 3 : request.operation === "assess-v2" ? 2 : 1;
      const hypothesis = readCycleArtifact(request.input.hypothesis_path, revision === 4 ? "hypothesis-v4.json" : revision === 3 ? "hypothesis-v3.json" : revision === 2 ? "hypothesis-v2.json" : "hypothesis.json");
      const runManifest = readCycleArtifact(request.input.run_manifest_path, revision === 4 ? "live-run-v4.json" : revision === 3 ? "live-run-v3.json" : revision === 2 ? "live-run-v2.json" : "live-run.json");
      value = materializeInteractionLiveValidation({hypothesis, run_manifest: runManifest, verdicts: request.input.verdicts});
      artifactName = revision === 4 ? "validation-v4.json" : revision === 3 ? "validation-v3.json" : revision === 2 ? "validation-v2.json" : "validation.json";
    } else if (request.operation === "close") {
      const learningPackage = readCycleArtifact(request.input.learning_package_path, "learning-package-v4.json");
      value = materializeInteractionOwnerDecision({learning_package:learningPackage, decision_ref:request.input.decision_ref});
      artifactName = "owner-decision.json";
    } else {
      const revision = request.operation === "package-v4" ? 4 : request.operation === "package-v3" ? 3 : request.operation === "package-v2" ? 2 : 1;
      const baseline = readCycleArtifact(request.input.baseline_path, "baseline.json");
      const hypothesis = readCycleArtifact(request.input.hypothesis_path, revision === 4 ? "hypothesis-v4.json" : revision === 3 ? "hypothesis-v3.json" : revision === 2 ? "hypothesis-v2.json" : "hypothesis.json");
      const offlineScreen = readCycleArtifact(request.input.offline_screen_path, revision === 4 ? "offline-screen-v4.json" : revision === 3 ? "offline-screen-v3.json" : revision === 2 ? "offline-screen-v2.json" : "offline-screen.json");
      const validation = readCycleArtifact(request.input.validation_path, revision === 4 ? "validation-v4.json" : revision === 3 ? "validation-v3.json" : revision === 2 ? "validation-v2.json" : "validation.json");
      value = materializeInteractionLearningPackage({baseline, hypothesis, offline_screen:offlineScreen, validation});
      artifactName = revision === 4 ? "learning-package-v4.json" : revision === 3 ? "learning-package-v3.json" : revision === 2 ? "learning-package-v2.json" : "learning-package.json";
    }
    const path = persist(root, request.cycle_id, artifactName, value);
    const receiptPath = persist(root, request.cycle_id, `receipts/${request.operation}.json`, receipt(request.cycle_id, request.operation, artifactName, value));
    output = {schema_version: "are.interaction-learning-cli-result/v1", ok: true, operation: request.operation, value, persisted_path: path, receipt_path: receiptPath, authority_effect: "none"};
  }
} catch (error) {
  output = failure([error?.message ?? "interaction-learning.request-failed"]);
}

process.stdout.write(`${canonicalJson(output)}\n`);
if (!output.ok) process.exitCode = 2;
