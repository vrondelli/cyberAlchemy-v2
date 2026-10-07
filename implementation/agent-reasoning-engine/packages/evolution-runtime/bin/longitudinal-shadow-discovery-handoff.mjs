#!/usr/bin/env node
import {createHash} from "node:crypto";
import {createReadStream, readFileSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {createInterface} from "node:readline";

import {canonicalJson} from "../../intent-route-resolver/index.mjs";
import {verifyInteractionIngestion} from "../src/interaction-learning-ingestion.mjs";

const SECRET = /(-----BEGIN [A-Z ]*PRIVATE KEY-----|\bBearer\s+[A-Za-z0-9._~+/=-]{8,}|\b(?:sk|ghp|xox[baprs])[-_][A-Za-z0-9_-]{8,}|\b(?:password|passwd|api[_-]?key|access[_-]?token|refresh[_-]?token)\s*[:=])/i;
const ENV_DUMP = /(?:^|\n)\s*(?:export\s+)?[A-Z][A-Z0-9_]{2,}\s*=/;

function selectedText(line, role) {
  const record = JSON.parse(line);
  const payload = record.type === "response_item" ? record.payload : null;
  if (payload?.type !== "message" || payload.role !== role || !Array.isArray(payload.content)) throw new Error("selected-message-invalid");
  const parts = payload.content.filter((part) => part && ["input_text", "output_text"].includes(part.type) && typeof part.text === "string").map((part) => part.text);
  if (!parts.length) throw new Error("selected-message-empty");
  const value = parts.join("\n");
  if (SECRET.test(value) || ENV_DUMP.test(value)) throw new Error("selected-message-sensitive");
  return value;
}

async function inspectSession(session, root) {
  const rootPath = resolve(root);
  const path = resolve(rootPath, session.source_locator);
  if (!path.startsWith(`${rootPath}/`)) throw new Error("source-path-invalid");
  const selected = session.turns.filter((turn) => turn.sensitive_signal === false);
  const ordinals = new Map(selected.flatMap((turn) => [
    [turn.user_record_ordinal, "user"],
    [turn.assistant_record_ordinal, "assistant"],
  ]));
  const messages = new Map();
  const hash = createHash("sha256");
  const stream = createReadStream(path);
  stream.on("data", (bytes) => hash.update(bytes));
  const lines = createInterface({input: stream, crlfDelay: Infinity});
  let ordinal = 0;
  for await (const line of lines) {
    ordinal += 1;
    const role = ordinals.get(ordinal);
    if (role) messages.set(ordinal, selectedText(line, role));
  }
  if (hash.digest("hex") !== session.source_sha256) throw new Error("source-drift");
  if (messages.size !== ordinals.size) throw new Error("selected-message-missing");
  return {
    session_ref: session.session_ref,
    source_id: session.source_id,
    source_sha256: session.source_sha256,
    turns: selected.map((turn) => ({
      turn_ref: turn.turn_ref,
      started_at: turn.started_at,
      completed_at: turn.completed_at,
      correction_signal_classes: turn.correction_signals,
      user: messages.get(turn.user_record_ordinal),
      assistant: messages.get(turn.assistant_record_ordinal),
    })),
  };
}

try {
  const request = JSON.parse(readFileSync(0, "utf8"));
  if (request?.schema_version !== "are.longitudinal-shadow-discovery-handoff-request/v1"
    || typeof request.ingestion_path !== "string" || typeof request.output_path !== "string"
    || !request.source_roots || typeof request.source_roots !== "object"
    || !Array.isArray(request.session_refs)
    || Object.keys(request).some((key) => !["schema_version", "ingestion_path", "output_path", "source_roots", "session_refs"].includes(key))) {
    throw new Error("request-invalid");
  }
  const outputPath = resolve(request.output_path);
  if (!outputPath.startsWith("/tmp/") || dirname(outputPath) === "/tmp") throw new Error("output-must-be-bounded-temporary-path");
  const ingestion = JSON.parse(readFileSync(resolve(request.ingestion_path), "utf8"));
  if (!verifyInteractionIngestion(ingestion).ok) throw new Error("ingestion-invalid");
  const sessions = new Map(ingestion.sessions.map((session) => [session.session_ref, session]));
  if (new Set(request.session_refs).size !== request.session_refs.length) throw new Error("session-ref-duplicate");
  const selected = request.session_refs.map((ref) => sessions.get(ref));
  if (selected.some((session) => !session || session.turns.length < 1)) throw new Error("session-ref-invalid");
  const reviewed = [];
  const sensitiveOmissions = [];
  for (const session of selected) {
    const root = request.source_roots[session.source_id];
    if (typeof root !== "string") throw new Error("source-root-missing");
    try {
      reviewed.push(await inspectSession(session, root));
    } catch (error) {
      if (error.message === "selected-message-sensitive") {
        sensitiveOmissions.push(session.session_ref);
        continue;
      }
      throw new Error(`${session.session_ref}:${error.message}`);
    }
  }
  const handoff = {
    schema_version: "are.longitudinal-shadow-discovery-handoff/v1",
    ingestion_manifest_digest: ingestion.manifest_digest,
    handling: "temporary-delete-after-derived-classification",
    included_content: "selected-nonsensitive-user-and-assistant-messages-only",
    excluded_records: ["reasoning", "tool-calls", "tool-outputs", "credentials", "environment-values", "unselected-messages"],
    sessions: reviewed,
    sensitive_omission_count: sensitiveOmissions.length,
    authority_effect: "none",
  };
  writeFileSync(outputPath, `${canonicalJson(handoff)}\n`, {encoding: "utf8", flag: "wx", mode: 0o600});
  process.stdout.write(`${JSON.stringify({ok: true, output_path: outputPath, session_count: reviewed.length, turn_count: reviewed.reduce((count, session) => count + session.turns.length, 0), sensitive_omission_count: sensitiveOmissions.length, ingestion_manifest_digest: ingestion.manifest_digest, authority_effect: "none"})}\n`);
} catch (error) {
  process.stdout.write(`${JSON.stringify({ok: false, reason_codes: [`longitudinal-shadow-discovery-handoff.${error.message}`], authority_effect: "none"})}\n`);
  process.exitCode = 2;
}
