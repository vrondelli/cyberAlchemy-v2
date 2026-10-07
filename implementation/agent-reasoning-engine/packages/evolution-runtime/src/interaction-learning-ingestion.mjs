import {createHash} from "node:crypto";
import {createReadStream, existsSync, readdirSync, statSync} from "node:fs";
import {relative, resolve, sep} from "node:path";
import {createInterface} from "node:readline";

import {canonicalJson, canonicalizeJson, deepFreeze} from "../../intent-route-resolver/index.mjs";

const OUTCOMES = new Set(["success", "failure", "indeterminate"]);
const ATTRIBUTIONS = new Set(["assistant_caused", "user_changed_objective", "external_failure", "ambiguous", "none"]);
const CATEGORIES = new Set([
  "state_continuity",
  "scope_transition",
  "ordering_coordination",
  "language_clarity",
  "evidence_completion",
  "environment_recovery",
  "execution_error",
]);
const MESSAGE_ROLES = new Set(["user", "assistant"]);
const SECRET_PATTERN = /(-----BEGIN [A-Z ]*PRIVATE KEY-----|\bBearer\s+[A-Za-z0-9._~+/=-]{8,}|\b(?:sk|ghp|xox[baprs])[-_][A-Za-z0-9_-]{8,}|\b(?:password|passwd|api[_-]?key|access[_-]?token|refresh[_-]?token)\s*[:=])/i;
const CORRECTION_SIGNALS = Object.freeze([
  ["explicit_correction", /(?:^|\b)(?:no|wrong|incorrect|i mean|not this|we had this|you changed|you confused|não|errado|quero dizer)(?:\b|$)/i],
  ["lost_or_unclear", /(?:i(?:'m| am)? lost|i don'?t understand|what is this|confused|não entendo|estou perdido)/i],
  ["continuity_repair", /(?:we were|already doing|resume|continue from|after (?:the )?(?:reset|restart)|restate|repeat|retomar|continuar)/i],
  ["ordering_repair", /(?:one (?:gate|decision) at a time|wrong order|before that|first .* then|uma .* por vez)/i],
]);

function freeze(value) {
  return deepFreeze(canonicalizeJson(value));
}

function digest(value) {
  return createHash("sha256").update(typeof value === "string" ? value : canonicalJson(canonicalizeJson(value))).digest("hex");
}

function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function listJsonl(root, output = []) {
  if (!existsSync(root)) return output;
  for (const entry of readdirSync(root, {withFileTypes: true}).sort((left, right) => left.name.localeCompare(right.name))) {
    const path = resolve(root, entry.name);
    if (entry.isDirectory()) listJsonl(path, output);
    else if (entry.isFile() && entry.name.endsWith(".jsonl")) output.push(path);
  }
  return output;
}

function messageText(payload) {
  if (!object(payload) || payload.type !== "message" || !MESSAGE_ROLES.has(payload.role) || !Array.isArray(payload.content)) return null;
  const parts = payload.content
    .filter((item) => object(item) && ["input_text", "output_text"].includes(item.type) && typeof item.text === "string")
    .map((item) => item.text);
  return parts.length ? parts.join("\n") : null;
}

function languageHint(text) {
  const normalized = text.toLowerCase();
  const portuguese = (normalized.match(/\b(?:não|sim|isso|como|porque|então|estou|temos|precisamos|vamos|quero|deve|uma|para)\b/g) ?? []).length;
  const english = (normalized.match(/\b(?:the|this|what|why|then|we|should|need|have|with|from|continue|wrong)\b/g) ?? []).length;
  if (portuguese > 0 && english > 0) return "mixed";
  if (portuguese > 0) return "pt";
  if (english > 0) return "en";
  return "unknown";
}

function correctionSignals(text) {
  return CORRECTION_SIGNALS.filter(([, pattern]) => pattern.test(text)).map(([code]) => code).sort();
}

function safeRelative(root, path) {
  const value = relative(root, path).split(sep).join("/");
  if (!value || value.startsWith("../") || value === "..") throw new Error("interaction-ingestion.source-path-invalid");
  return value;
}

async function scanFile(source, path, cwdPatterns) {
  const sourceLocator = safeRelative(source.root, path);
  const sourceHash = createHash("sha256");
  const sessionRef = `codex-session:${digest([source.source_id, sourceLocator])}`;
  const messages = [];
  const toolKinds = new Map();
  let relevant = false;
  let recordCount = 0;
  let invalidLineCount = 0;
  let reasoningRecordCount = 0;
  let encryptedReasoningCount = 0;
  let toolOutputCount = 0;
  let sensitiveSignalCount = 0;
  let firstTimestamp = null;
  let lastTimestamp = null;
  let recordOrdinal = 0;
  const stream = createReadStream(path);
  stream.on("data", (chunk) => sourceHash.update(chunk));
  const lines = createInterface({input: stream, crlfDelay: Infinity});
  for await (const line of lines) {
    recordOrdinal += 1;
    if (!line) continue;
    let record;
    try { record = JSON.parse(line); } catch { invalidLineCount += 1; continue; }
    recordCount += 1;
    if (typeof record.timestamp === "string") {
      firstTimestamp ??= record.timestamp;
      lastTimestamp = record.timestamp;
    }
    const payload = record.payload;
    if (record.type === "turn_context" && typeof payload?.cwd === "string" && cwdPatterns.some((pattern) => pattern.test(payload.cwd))) relevant = true;
    if (record.type === "response_item" && payload?.type === "reasoning") {
      reasoningRecordCount += 1;
      if (typeof payload.encrypted_content === "string" && payload.encrypted_content.length > 0) encryptedReasoningCount += 1;
      continue;
    }
    if (record.type === "response_item" && ["function_call", "custom_tool_call"].includes(payload?.type)) {
      const name = typeof payload.name === "string" ? payload.name : "unknown";
      toolKinds.set(name, (toolKinds.get(name) ?? 0) + 1);
      continue;
    }
    if (record.type === "response_item" && ["function_call_output", "custom_tool_call_output"].includes(payload?.type)) {
      toolOutputCount += 1;
      continue;
    }
    const text = record.type === "response_item" ? messageText(payload) : null;
    if (text !== null) {
      const secretDetected = SECRET_PATTERN.test(text);
      if (secretDetected) sensitiveSignalCount += 1;
      messages.push({
        record_ordinal: recordOrdinal,
        timestamp: typeof record.timestamp === "string" ? record.timestamp : null,
        role: payload.role,
        message_digest: digest(text),
        character_count: text.length,
        language_hint: languageHint(text),
        correction_signals: payload.role === "user" ? correctionSignals(text) : [],
        sensitive_signal: secretDetected,
      });
    }
  }
  if (!relevant) return null;
  const turns = [];
  let pendingUser = null;
  let sequence = 0;
  for (const message of messages) {
    if (message.role === "user") { pendingUser = message; continue; }
    if (message.role !== "assistant" || !pendingUser) continue;
    sequence += 1;
    const turnRef = `interaction-turn:${digest([sessionRef, pendingUser.record_ordinal, message.record_ordinal])}`;
    turns.push({
      turn_ref: turnRef,
      sequence,
      started_at: pendingUser.timestamp,
      completed_at: message.timestamp,
      user_record_ordinal: pendingUser.record_ordinal,
      assistant_record_ordinal: message.record_ordinal,
      user_message_digest: pendingUser.message_digest,
      assistant_message_digest: message.message_digest,
      user_character_count: pendingUser.character_count,
      assistant_character_count: message.character_count,
      language_hint: pendingUser.language_hint,
      correction_signals: pendingUser.correction_signals,
      sensitive_signal: pendingUser.sensitive_signal || message.sensitive_signal,
      evaluator_status: "pending",
    });
    pendingUser = null;
  }
  const stats = statSync(path);
  return {
    session_ref: sessionRef,
    source_id: source.source_id,
    source_locator: sourceLocator,
    source_sha256: sourceHash.digest("hex"),
    byte_length: stats.size,
    first_timestamp: firstTimestamp,
    last_timestamp: lastTimestamp,
    record_count: recordCount,
    invalid_line_count: invalidLineCount,
    message_count: messages.length,
    turn_candidate_count: turns.length,
    reasoning_record_count: reasoningRecordCount,
    encrypted_reasoning_count: encryptedReasoningCount,
    tool_call_counts: Object.fromEntries([...toolKinds.entries()].sort(([left], [right]) => left.localeCompare(right))),
    tool_output_count: toolOutputCount,
    sensitive_signal_count: sensitiveSignalCount,
    turns,
  };
}

export async function scanCodexInteractionSources(input) {
  if (!object(input) || !Array.isArray(input.sources) || input.sources.length === 0 || !Array.isArray(input.cwd_markers) || input.cwd_markers.length === 0) throw new Error("interaction-ingestion.request-invalid");
  const sources = input.sources.map((source) => {
    if (!object(source) || typeof source.source_id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(source.source_id) || typeof source.root !== "string" || !existsSync(source.root)) throw new Error("interaction-ingestion.source-invalid");
    const excludeLocators = source.exclude_locators ?? [];
    if (!Array.isArray(excludeLocators) || !excludeLocators.every((locator) => typeof locator === "string" && locator.length > 0 && !locator.startsWith("/") && !locator.includes(".."))) throw new Error("interaction-ingestion.source-exclusion-invalid");
    return {source_id: source.source_id, root: resolve(source.root), exclude_locators: new Set(excludeLocators)};
  });
  if (new Set(sources.map((source) => source.source_id)).size !== sources.length) throw new Error("interaction-ingestion.source-duplicate");
  const cwdPatterns = input.cwd_markers.map((marker) => {
    if (typeof marker !== "string" || marker.length === 0 || marker.length > 256) throw new Error("interaction-ingestion.cwd-marker-invalid");
    return new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  });
  const sessions = [];
  const sourceInventory = [];
  for (const source of sources) {
    const files = listJsonl(source.root);
    let selected = 0;
    let excluded = 0;
    let totalBytes = 0;
    for (const path of files) {
      totalBytes += statSync(path).size;
      if (source.exclude_locators.has(safeRelative(source.root, path))) { excluded += 1; continue; }
      const session = await scanFile(source, path, cwdPatterns);
      if (session) { sessions.push(session); selected += 1; }
    }
    sourceInventory.push({source_id: source.source_id, discovered_file_count: files.length, explicitly_excluded_file_count: excluded, selected_session_count: selected, discovered_byte_length: totalBytes});
  }
  sessions.sort((left, right) => String(left.first_timestamp).localeCompare(String(right.first_timestamp)) || left.session_ref.localeCompare(right.session_ref));
  const taskCount = sessions.reduce((total, session) => total + session.turn_candidate_count, 0);
  const manifest = {
    schema_version: "are.interaction-learning-ingestion/v1",
    cycle_kind: "interaction-learning",
    cohort_policy: "cwd-marker-selected-codex-sessions",
    source_inventory: sourceInventory,
    selected_session_count: sessions.length,
    evaluation_task_count: taskCount,
    durable_content_policy: "metadata-digests-and-structural-signals-only",
    excluded_content: ["message_text", "tool_arguments", "tool_outputs", "environment_values", "encrypted_reasoning", "credentials"],
    sessions,
    authority_effect: "none",
  };
  return freeze({...manifest, manifest_digest: digest(manifest)});
}

export function verifyInteractionIngestion(ingestion) {
  if (!object(ingestion) || ingestion.schema_version !== "are.interaction-learning-ingestion/v1" || typeof ingestion.manifest_digest !== "string") return freeze({ok: false, reason_codes: ["interaction-ingestion.manifest-invalid"], authority_effect: "none"});
  const {manifest_digest: observed, ...material} = ingestion;
  const expected = digest(material);
  return freeze({ok: observed === expected, observed_digest: observed, expected_digest: expected, reason_codes: observed === expected ? [] : ["interaction-ingestion.manifest-digest-mismatch"], authority_effect: "none"});
}

function validateLabel(label, turnRefs) {
  if (!object(label) || typeof label.episode_id !== "string" || typeof label.objective_key !== "string" || !Array.isArray(label.turn_refs) || label.turn_refs.length === 0 || !label.turn_refs.every((ref) => turnRefs.has(ref)) || !OUTCOMES.has(label.outcome) || !ATTRIBUTIONS.has(label.attribution)) throw new Error("interaction-baseline.label-invalid");
  if (!CATEGORIES.has(label.primary_category) && label.primary_category !== "none") throw new Error("interaction-baseline.category-invalid");
  if (!Array.isArray(label.contributing_categories) || !label.contributing_categories.every((category) => CATEGORIES.has(category))) throw new Error("interaction-baseline.contributors-invalid");
  if (label.outcome === "failure" && label.attribution !== "assistant_caused") throw new Error("interaction-baseline.failure-attribution-invalid");
  if (label.outcome === "success" && label.attribution === "assistant_caused") throw new Error("interaction-baseline.success-attribution-invalid");
  if (typeof label.evaluator_id !== "string" || typeof label.evidence_note !== "string") throw new Error("interaction-baseline.evaluator-evidence-required");
}

function metric(labels) {
  const eligible = labels.filter((label) => label.outcome !== "indeterminate");
  const success = eligible.filter((label) => label.outcome === "success").length;
  const failure = eligible.length - success;
  return {eligible_count: eligible.length, success_count: success, failure_count: failure, indeterminate_count: labels.length - eligible.length, episode_success_rate: eligible.length ? success / eligible.length : null};
}

function chronologicalGroups(labels) {
  const groups = new Map();
  for (const label of labels) {
    if (!groups.has(label.objective_key)) groups.set(label.objective_key, []);
    groups.get(label.objective_key).push(label);
  }
  return [...groups.entries()].map(([objectiveKey, episodes]) => ({objective_key: objectiveKey, episodes: episodes.sort((left, right) => String(left.started_at).localeCompare(String(right.started_at)))}))
    .sort((left, right) => String(left.episodes[0]?.started_at).localeCompare(String(right.episodes[0]?.started_at)) || left.objective_key.localeCompare(right.objective_key));
}

function partition(labels, ratios) {
  if (!object(ratios) || !["discovery", "validation", "holdout"].every((key) => typeof ratios[key] === "number" && ratios[key] > 0) || Math.abs(ratios.discovery + ratios.validation + ratios.holdout - 1) > 1e-9) throw new Error("interaction-baseline.partition-policy-invalid");
  const groups = chronologicalGroups(labels);
  const targetDiscovery = labels.length * ratios.discovery;
  const targetValidation = labels.length * (ratios.discovery + ratios.validation);
  const result = {discovery: [], validation: [], holdout: []};
  let assigned = 0;
  for (const group of groups) {
    const bucket = assigned < targetDiscovery ? "discovery" : assigned < targetValidation ? "validation" : "holdout";
    result[bucket].push(...group.episodes);
    assigned += group.episodes.length;
  }
  return result;
}

export function calculateInteractionBaseline({ingestion, labels, partition_policy}) {
  if (!object(ingestion) || ingestion.schema_version !== "are.interaction-learning-ingestion/v1" || !Array.isArray(ingestion.sessions) || !Array.isArray(labels)) throw new Error("interaction-baseline.request-invalid");
  if (!verifyInteractionIngestion(ingestion).ok) throw new Error("interaction-baseline.ingestion-digest-invalid");
  const turns = ingestion.sessions.flatMap((session) => session.turns);
  const turnRefs = new Set(turns.map((turn) => turn.turn_ref));
  labels.forEach((label) => validateLabel(label, turnRefs));
  const seenTurns = new Set();
  for (const label of labels) for (const ref of label.turn_refs) {
    if (seenTurns.has(ref)) throw new Error("interaction-baseline.turn-labeled-twice");
    seenTurns.add(ref);
  }
  const turnIndex = new Map(turns.map((turn) => [turn.turn_ref, turn]));
  const normalized = labels.map((label) => freeze({...label, started_at: label.turn_refs.map((ref) => turnIndex.get(ref)?.started_at).filter(Boolean).sort()[0] ?? null}));
  const partitions = partition(normalized, partition_policy);
  const baseline = {
    schema_version: "are.interaction-learning-baseline/v1",
    ingestion_manifest_digest: ingestion.manifest_digest,
    evaluator_ids: [...new Set(normalized.map((label) => label.evaluator_id))].sort(),
    partition_policy,
    overall: metric(normalized),
    partitions: Object.fromEntries(Object.entries(partitions).map(([name, episodes]) => [name, {...metric(episodes), episode_refs: episodes.map((episode) => episode.episode_id)}])),
    diagnostic_counts: Object.fromEntries([...CATEGORIES].sort().map((category) => [category, normalized.filter((label) => label.primary_category === category || label.contributing_categories.includes(category)).length])),
    unlabeled_turn_candidate_count: turns.length - seenTurns.size,
    status: normalized.length === 0 || metric(normalized).eligible_count === 0 ? "NOT_EVALUATED" : "BASELINE_MEASURED",
    empirical_parameters: {minimum_live_sample: null, numeric_completion_target: null},
    claim_limit: "Evaluator-labeled historical cohort baseline; no candidate improvement or live-validation claim.",
    authority_effect: "none",
  };
  return freeze({...baseline, baseline_digest: digest(baseline)});
}
