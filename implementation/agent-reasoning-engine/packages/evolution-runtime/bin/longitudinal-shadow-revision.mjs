#!/usr/bin/env node
import {createHash} from "node:crypto";
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join, resolve} from "node:path";

import {canonicalJson} from "../../intent-route-resolver/index.mjs";
import {assessLongitudinalShadowRevision, freezeLongitudinalShadowRevision} from "../src/longitudinal-shadow-revision-v1.mjs";

const fileDigest = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const write = (root, name, value) => {
  const path = join(root, name);
  writeFileSync(path, `${canonicalJson(value)}\n`, {encoding: "utf8", flag: "wx", mode: 0o600});
  return {relative_path: name, sha256: fileDigest(path)};
};

try {
  const request = JSON.parse(readFileSync(0, "utf8"));
  if (!request || request.schema_version !== "are.longitudinal-shadow-revision-request/v1"
    || !["freeze", "assess"].includes(request.operation) || typeof request.output_root !== "string"
    || !request.input || typeof request.input !== "object"
    || Object.keys(request).some((key) => !["schema_version", "operation", "output_root", "input"].includes(key))) {
    throw new Error("request-invalid");
  }
  const root = resolve(request.output_root);
  mkdirSync(root, {recursive: false, mode: 0o700});
  let value;
  if (request.operation === "freeze") {
    if (typeof request.input.ingestion_path !== "string" || typeof request.input.classifications_path !== "string"
      || Object.keys(request.input).some((key) => !["ingestion_path", "classifications_path", "episodes_per_stratum", "maximum_per_session"].includes(key))) {
      throw new Error("request-invalid");
    }
    value = freezeLongitudinalShadowRevision({
      ingestion: JSON.parse(readFileSync(resolve(request.input.ingestion_path), "utf8")),
      classifications: JSON.parse(readFileSync(resolve(request.input.classifications_path), "utf8")),
      episodes_per_stratum: request.input.episodes_per_stratum ?? 4,
      maximum_per_session: request.input.maximum_per_session ?? 4,
    });
    const artifacts = [write(root, "REVISION-COHORT.json", value)];
    artifacts.push(write(root, "EVALUATOR-QUEUE.json", {
      schema_version: "are.longitudinal-shadow-revision-evaluator-queue/v1",
      cohort_digest: value.cohort_digest,
      status: value.status,
      deficits: value.deficits,
      episodes: value.episodes,
      required_verdict_fields: ["episode_ref", "evaluator_id", "events", "query", "expected", "protected_failure_codes"],
      excluded_content: value.excluded_content,
      authority_effect: "none",
    }));
    write(root, "RUN-RECEIPT.json", {
      schema_version: "are.longitudinal-shadow-revision-freeze-receipt/v1",
      cohort_digest: value.cohort_digest,
      status: value.status,
      deficits: value.deficits,
      artifacts,
      activation: "none",
      authority_effect: "none",
    });
  } else {
    if (typeof request.input.cohort_path !== "string" || !Array.isArray(request.input.verdicts)
      || Object.keys(request.input).some((key) => !["cohort_path", "verdicts"].includes(key))) throw new Error("request-invalid");
    value = assessLongitudinalShadowRevision({
      cohort: JSON.parse(readFileSync(resolve(request.input.cohort_path), "utf8")),
      verdicts: request.input.verdicts,
    });
    const verdicts = [...request.input.verdicts].sort((left, right) => left.episode_ref.localeCompare(right.episode_ref));
    const artifacts = [write(root, "TYPED-VERDICTS.json", verdicts), write(root, "REVISION-RESULT.json", value)];
    write(root, "RUN-RECEIPT.json", {
      schema_version: "are.longitudinal-shadow-revision-assessment-receipt/v1",
      result_digest: value.result_digest,
      disposition: value.disposition,
      artifacts,
      activation: "none",
      authority_effect: "none",
    });
  }
  process.stdout.write(`${JSON.stringify({ok: true, operation: request.operation, value, output_root: root, authority_effect: "none"})}\n`);
} catch (error) {
  process.stdout.write(`${JSON.stringify({ok: false, reason_codes: [`longitudinal-shadow-revision.${error.message}`], authority_effect: "none"})}\n`);
  process.exitCode = 2;
}
