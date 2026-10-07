#!/usr/bin/env node
import {createHash} from "node:crypto";
import {createReadStream, readFileSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {createInterface} from "node:readline";

import {canonicalJson} from "../../intent-route-resolver/index.mjs";
import {verifyInteractionIngestion} from "../src/interaction-learning-ingestion.mjs";
import {verifyLongitudinalShadowCohort} from "../src/longitudinal-shadow-v1.mjs";

const SECRET = /(-----BEGIN [A-Z ]*PRIVATE KEY-----|\bBearer\s+[A-Za-z0-9._~+/=-]{8,}|\b(?:sk|ghp|xox[baprs])[-_][A-Za-z0-9_-]{8,}|\b(?:password|passwd|api[_-]?key|access[_-]?token|refresh[_-]?token)\s*[:=])/i;

function text(payload) {
  if (!payload || payload.type !== "message" || !["user", "assistant"].includes(payload.role) || !Array.isArray(payload.content)) return null;
  const parts = payload.content.filter((part) => part && ["input_text", "output_text"].includes(part.type) && typeof part.text === "string").map((part) => part.text);
  return parts.length ? parts.join("\n") : null;
}

async function selectedMessages(path, ordinals, expectedHash) {
  const messages = new Map();
  let ordinal = 0;
  const sourceHash = createHash("sha256");
  const stream = createReadStream(path);
  stream.on("data", (chunk) => sourceHash.update(chunk));
  const lines = createInterface({input: stream, crlfDelay: Infinity});
  for await (const line of lines) {
    ordinal += 1;
    if (!ordinals.has(ordinal)) continue;
    const record = JSON.parse(line);
    const value = record.type === "response_item" ? text(record.payload) : null;
    if (value === null || SECRET.test(value)) throw new Error("selected-message-invalid-or-sensitive");
    messages.set(ordinal, {role: record.payload.role, text: value});
  }
  if (messages.size !== ordinals.size) throw new Error("selected-message-missing");
  if (sourceHash.digest("hex") !== expectedHash) throw new Error("source-drift");
  return messages;
}

try {
  const request = JSON.parse(readFileSync(0, "utf8"));
  if (!request || request.schema_version !== "are.longitudinal-shadow-handoff-request/v1"
    || typeof request.cohort_path !== "string" || typeof request.ingestion_path !== "string"
    || typeof request.output_path !== "string" || typeof request.source_roots !== "object"
    || Object.keys(request).some((key) => !["schema_version", "cohort_path", "ingestion_path", "output_path", "source_roots"].includes(key))) throw new Error("request-invalid");
  const outputPath = resolve(request.output_path);
  if (!outputPath.startsWith("/tmp/") || dirname(outputPath) === "/tmp") throw new Error("output-must-be-bounded-temporary-path");
  const cohort = JSON.parse(readFileSync(resolve(request.cohort_path), "utf8"));
  const ingestion = JSON.parse(readFileSync(resolve(request.ingestion_path), "utf8"));
  if (!verifyLongitudinalShadowCohort(cohort) || !verifyInteractionIngestion(ingestion).ok
    || cohort.ingestion_manifest_digest !== ingestion.manifest_digest) throw new Error("binding-invalid");
  const sessionIndex = new Map(ingestion.sessions.map((session) => [session.session_ref, session]));
  const episodes = [];
  for (const episode of cohort.episodes) {
    const session = sessionIndex.get(episode.session_ref);
    const turns = new Map(session.turns.map((turn) => [turn.turn_ref, turn]));
    const selectedTurns = [...episode.context_turn_refs, episode.anchor_turn_ref].map((ref) => turns.get(ref));
    if (selectedTurns.some((turn) => !turn || turn.sensitive_signal !== false)) throw new Error("turn-binding-invalid");
    const ordinals = new Set(selectedTurns.flatMap((turn) => [turn.user_record_ordinal, turn.assistant_record_ordinal]));
    const root = request.source_roots[episode.source_id];
    if (typeof root !== "string") throw new Error("source-root-missing");
    const path = resolve(root, episode.source_locator);
    if (!path.startsWith(`${resolve(root)}/`)) throw new Error("source-path-invalid");
    const messages = await selectedMessages(path, ordinals, episode.source_sha256);
    episodes.push({
      episode_ref: episode.episode_ref,
      language_hint: episode.language_hint,
      correction_signal_classes: episode.correction_signal_classes,
      provisional_family: episode.provisional_family,
      turns: selectedTurns.map((turn) => ({turn_ref: turn.turn_ref, sequence: turn.sequence, user: messages.get(turn.user_record_ordinal).text, assistant: messages.get(turn.assistant_record_ordinal).text})),
    });
  }
  const handoff = {schema_version: "are.longitudinal-shadow-ephemeral-evaluator-handoff/v1", cohort_digest: cohort.cohort_digest, handling: "temporary-delete-after-typed-verdict-ingestion", included_content: "selected-nonsensitive-user-and-assistant-messages-only", excluded_records: ["reasoning", "tool-calls", "tool-outputs", "credentials", "environment-values", "unselected-messages"], episodes, authority_effect: "none"};
  writeFileSync(outputPath, `${canonicalJson(handoff)}\n`, {encoding: "utf8", flag: "wx", mode: 0o600});
  process.stdout.write(`${JSON.stringify({ok: true, output_path: outputPath, episode_count: episodes.length, cohort_digest: cohort.cohort_digest, authority_effect: "none"})}\n`);
} catch (error) {
  process.stdout.write(`${JSON.stringify({ok: false, reason_codes: [`longitudinal-shadow-handoff.${error.message}`], authority_effect: "none"})}\n`);
  process.exitCode = 2;
}
