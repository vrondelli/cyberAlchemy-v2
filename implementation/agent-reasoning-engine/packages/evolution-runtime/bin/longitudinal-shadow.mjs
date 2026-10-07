#!/usr/bin/env node
import {createHash} from "node:crypto";
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join, resolve} from "node:path";

import {canonicalJson} from "../../intent-route-resolver/index.mjs";
import {assessLongitudinalShadow, excludeInteractionIngestionSessions, freezeLongitudinalShadowCohort} from "../src/longitudinal-shadow-v1.mjs";

const digestBytes = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const write = (root, name, value) => {
  const path = join(root, name);
  writeFileSync(path, `${canonicalJson(value)}\n`, {encoding: "utf8", flag: "wx", mode: 0o600});
  return {relative_path: name, sha256: digestBytes(path)};
};

try {
  const request = JSON.parse(readFileSync(0, "utf8"));
  if (!request || request.schema_version !== "are.longitudinal-shadow-request/v1"
    || !["freeze", "assess"].includes(request.operation) || typeof request.output_root !== "string"
    || typeof request.input !== "object" || Object.keys(request).some((key) => !["schema_version", "operation", "output_root", "input"].includes(key))) throw new Error("request-invalid");
  const root = resolve(request.output_root);
  mkdirSync(root, {recursive: false, mode: 0o700});
  let value;
  if (request.operation === "freeze") {
    if (Object.keys(request.input).some((key) => !["ingestion_path", "predecessor_ingestion_digest", "minimum_episodes", "excluded_session_refs"].includes(key))) throw new Error("request-invalid");
    const scannedIngestion = JSON.parse(readFileSync(resolve(request.input.ingestion_path), "utf8"));
    const ingestion = request.input.excluded_session_refs?.length
      ? excludeInteractionIngestionSessions(scannedIngestion, request.input.excluded_session_refs)
      : scannedIngestion;
    value = freezeLongitudinalShadowCohort({
      ingestion,
      predecessor_ingestion_digest: request.input.predecessor_ingestion_digest,
      minimum_episodes: request.input.minimum_episodes ?? 20,
    });
    const artifacts = [write(root, "SOURCE-INGESTION.json", ingestion), write(root, "SHADOW-COHORT.json", value)];
    const queue = {schema_version: "are.longitudinal-shadow-evaluator-queue/v1", cohort_digest: value.cohort_digest, status: value.status, required_fields: ["episode_ref", "evaluator_id", "family", "events", "query", "expected", "protected_failure_codes", "evidence_note"], episodes: value.episodes.map((episode) => ({episode_ref: episode.episode_ref, source_id: episode.source_id, source_locator: episode.source_locator, source_sha256: episode.source_sha256, context_turn_refs: episode.context_turn_refs, anchor_turn_ref: episode.anchor_turn_ref, user_record_ordinal: episode.user_record_ordinal, assistant_record_ordinal: episode.assistant_record_ordinal, language_hint: episode.language_hint, correction_signal_classes: episode.correction_signal_classes, provisional_family: episode.provisional_family})), excluded_content: value.excluded_content, authority_effect: "none"};
    artifacts.push(write(root, "EVALUATOR-QUEUE.json", queue));
    const receipt = {schema_version: "are.longitudinal-shadow-freeze-receipt/v1", cohort_digest: value.cohort_digest, status: value.status, artifacts, activation: "none", authority_effect: "none"};
    write(root, "RUN-RECEIPT.json", receipt);
  } else {
    if (Object.keys(request.input).some((key) => !["cohort_path", "verdicts"].includes(key)) || !Array.isArray(request.input.verdicts)) throw new Error("request-invalid");
    value = assessLongitudinalShadow({cohort: JSON.parse(readFileSync(resolve(request.input.cohort_path), "utf8")), verdicts: request.input.verdicts});
    const verdicts = [...request.input.verdicts].sort((left, right) => left.episode_ref.localeCompare(right.episode_ref));
    const artifacts = [write(root, "TYPED-VERDICTS.json", verdicts), write(root, "SHADOW-RESULT.json", value)];
    write(root, "RUN-RECEIPT.json", {schema_version: "are.longitudinal-shadow-assessment-receipt/v1", result_digest: value.result_digest, disposition: value.disposition, artifacts, activation: "none", authority_effect: "none"});
  }
  process.stdout.write(`${JSON.stringify({ok: true, operation: request.operation, value, output_root: root, authority_effect: "none"})}\n`);
} catch (error) {
  process.stdout.write(`${JSON.stringify({ok: false, reason_codes: [`longitudinal-shadow.${error.message}`], authority_effect: "none"})}\n`);
  process.exitCode = 2;
}
