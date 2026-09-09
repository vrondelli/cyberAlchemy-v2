import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

export function loadJsonl(path) {
  const rows = readFileSync(path, "utf8").split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line, index) => {
    try { return JSON.parse(line); } catch (error) { throw new Error(`${path}:${index + 1}: ${error.message}`); }
  });
  const ids = new Set();
  for (const row of rows) {
    if (row.schema_version !== "are.benchmark-scenario/v1" || typeof row.scenario_id !== "string") throw new Error(`${path}: invalid scenario`);
    if (ids.has(row.scenario_id)) throw new Error(`${path}: duplicate ${row.scenario_id}`);
    ids.add(row.scenario_id);
  }
  return rows;
}

export function loadExactBoundJsonl(packageRoot, binding) {
  if (!binding || typeof binding.path !== "string" || !/^[a-f0-9]{64}$/.test(binding.sha256 ?? "")) throw new Error("Exact JSONL binding requires path and SHA-256 digest");
  const path = resolve(packageRoot, binding.path);
  const bytes = readFileSync(path);
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (actual !== binding.sha256) throw new Error(`Exact JSONL binding drift: ${binding.path}`);
  return loadJsonl(path);
}

export function validateMultiTurnCorpus(rows, path = "live-multiturn") {
  const policies = new Set(["required", "none", "either"]);
  for (const scenario of rows) {
    if (typeof scenario.conversation_kind !== "string" || !Array.isArray(scenario.turns) || scenario.turns.length < 2) throw new Error(`${path}: invalid multi-turn scenario ${scenario.scenario_id}`);
    const turnIds = new Set();
    for (const turn of scenario.turns) {
      if (typeof turn.turn_id !== "string" || turnIds.has(turn.turn_id) || typeof turn.request !== "string" || typeof turn.objective_kind !== "string") throw new Error(`${path}: invalid turn in ${scenario.scenario_id}`);
      if (!Array.isArray(turn.required_terms) || !Array.isArray(turn.required_concepts ?? []) || !Array.isArray(turn.prohibited_patterns) || !Array.isArray(turn.required_context_item_ids) || !policies.has(turn.next_question_policy ?? "either")) throw new Error(`${path}: invalid turn contract in ${scenario.scenario_id}/${turn.turn_id}`);
      if ((turn.required_concepts ?? []).some((concept) => typeof concept?.concept_id !== "string" || !Array.isArray(concept.any_terms) || concept.any_terms.length === 0 || concept.any_terms.some((term) => typeof term !== "string"))) throw new Error(`${path}: invalid required concept in ${scenario.scenario_id}/${turn.turn_id}`);
      turnIds.add(turn.turn_id);
    }
  }
  return rows;
}

export function validateContinuationCorpus(rows, path = "route-continuation") {
  const frontierStates = new Set(["complete", "runnable", "choice-required", "decision-required", "input-required", "blocked"]);
  const directiveKinds = new Set(["direct", "gate", "block", "complete"]);
  const errorClasses = new Set(["none", "premature-stop", "over-continuation"]);
  for (const scenario of rows) {
    const expected = scenario.expected;
    if (scenario.benchmark_kind !== "route-continuation" || typeof scenario.request !== "string" || !frontierStates.has(scenario.objective_frontier?.state)) throw new Error(`${path}: invalid continuation scenario ${scenario.scenario_id}`);
    if (!Array.isArray(scenario.objective_frontier.evidence_refs) || scenario.objective_frontier.evidence_refs.length === 0 || typeof scenario.provider !== "object" || scenario.provider === null) throw new Error(`${path}: invalid continuation inputs ${scenario.scenario_id}`);
    if (typeof expected?.continuation_needed !== "boolean" || !directiveKinds.has(expected.directive_kind) || typeof expected.reason_code !== "string" || !errorClasses.has(scenario.error_class)) throw new Error(`${path}: invalid continuation expectation ${scenario.scenario_id}`);
    if (scenario.objective_frontier.state === "complete" && expected.continuation_needed !== false) throw new Error(`${path}: completed frontier requires no continuation in ${scenario.scenario_id}`);
    if (scenario.objective_frontier.state !== "complete" && expected.continuation_needed !== true) throw new Error(`${path}: unfinished frontier requires continuation disposition in ${scenario.scenario_id}`);
  }
  return rows;
}

export function loadBenchmark(packageRoot) {
  const profile = JSON.parse(readFileSync(resolve(packageRoot, "profile.json"), "utf8"));
  if (profile.schema_version !== "are.real-reasoning-benchmark-profile/v1") throw new Error("Unsupported benchmark profile");
  const corpora = Object.fromEntries(Object.entries(profile.corpora).map(([name, path]) => [name, loadJsonl(resolve(packageRoot, path))]));
  validateMultiTurnCorpus(corpora.live_multiturn ?? [], profile.corpora.live_multiturn ?? "live-multiturn");
  validateContinuationCorpus(corpora.continuation ?? [], profile.corpora.continuation ?? "route-continuation");
  const splits = JSON.parse(readFileSync(resolve(packageRoot, "corpus/splits.json"), "utf8"));
  if (splits.schema_version !== "are.benchmark-corpus-splits/v1") throw new Error("Unsupported corpus splits");
  const known = new Set(Object.values(corpora).flat().map((row) => row.scenario_id));
  const selected = Object.values(splits).filter(Array.isArray).flat();
  if (selected.some((id) => !known.has(id)) || new Set(selected).size !== selected.length || selected.length !== known.size) throw new Error("Corpus splits must partition every scenario exactly once");
  return {profile, corpora, splits};
}
