#!/usr/bin/env node
import {readFileSync} from "node:fs";

import {canonicalJson} from "../../intent-route-resolver/index.mjs";
import {createDurableEvolutionKernel} from "../src/durable-kernel-v1.mjs";

function failure(stage, reasonCodes) {
  return {schema_version: "are.evolution-kernel-failure/v1", ok: false, stage, reason_codes: [...new Set(reasonCodes)].sort(), residue: [], authority_effect: "none"};
}

function closed(value, allowed) {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).every((key) => allowed.has(key));
}

let output;
try {
  const request = JSON.parse(readFileSync(0, "utf8"));
  const rootIndex = process.argv.indexOf("--root");
  const root = rootIndex >= 0 ? process.argv[rootIndex + 1] : null;
  const operationKeys = {
    process: new Set(["schema_version", "operation", "command", "event_drafts"]),
    inspect: new Set(["schema_version", "operation"]),
    diagnose: new Set(["schema_version", "operation"]),
    recover: new Set(["schema_version", "operation"]),
    "put-artifact": new Set(["schema_version", "operation", "artifact"]),
  };
  const allowed = operationKeys[request?.operation];
  const artifactValid = request?.operation !== "put-artifact" || closed(request.artifact, new Set(["bytes_utf8", "media_type", "semantic_binding"]));
  if (typeof root !== "string" || root.length === 0 || !allowed || !closed(request, allowed) || !artifactValid || request.schema_version !== "are.evolution-kernel-request/v1") {
    output = failure("request-validation", ["kernel.request-invalid"]);
  } else {
    const kernel = createDurableEvolutionKernel({root, require_enabled: true});
    if (request.operation === "process") output = kernel.process(request.command, {event_drafts: request.event_drafts});
    if (request.operation === "inspect") output = kernel.inspect();
    if (request.operation === "diagnose") output = kernel.diagnose();
    if (request.operation === "recover") output = kernel.recover();
    if (request.operation === "put-artifact") {
      const artifact = request.artifact ?? {};
      output = kernel.putArtifact({
        bytes: typeof artifact.bytes_utf8 === "string" ? artifact.bytes_utf8 : null,
        media_type: artifact.media_type,
        semantic_binding: artifact.semantic_binding,
      });
    }
  }
} catch (error) {
  output = failure("request-processing", [error?.message ?? "kernel.request-processing-failed"]);
}

process.stdout.write(`${canonicalJson(output)}\n`);
if (!output?.ok) process.exitCode = 2;
