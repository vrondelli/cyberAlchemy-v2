import {digest, freeze, text} from "./canonical.mjs";
import {createUsabilityObservation} from "./improvement-handoff.mjs";

export const CHAT_USABILITY_CORPUS_SCHEMA = "are.chat-usability-corpus/v1";
export const CHAT_USABILITY_RESULT_SCHEMA = "are.real-reasoning-benchmark-result/v1";

const domains = new Set(["reasoning-engine", "interaction-adapter", "conversation-protocol", "not_evaluable"]);
const statuses = new Set(["PASS", "FAIL", "NOT_EVALUATED"]);

function validateCorpus(corpus) {
  if (!corpus || corpus.schema_version !== CHAT_USABILITY_CORPUS_SCHEMA || !text(corpus.benchmark_id) || !Array.isArray(corpus.scenarios) || corpus.scenarios.length === 0) {
    throw new TypeError("Chat usability corpus identity is invalid");
  }
  const scenarioIds = new Set();
  for (const scenario of corpus.scenarios) {
    if (!text(scenario?.scenario_id) || scenarioIds.has(scenario.scenario_id) || !Array.isArray(scenario.checks) || scenario.checks.length === 0) {
      throw new TypeError("Chat usability scenario is invalid or duplicated");
    }
    scenarioIds.add(scenario.scenario_id);
    const checkIds = new Set();
    for (const check of scenario.checks) {
      if (!text(check?.check_id) || checkIds.has(check.check_id) || !domains.has(check.failure_domain) || !text(check.expected_behavior)) {
        throw new TypeError("Chat usability check is invalid or duplicated");
      }
      if (check.failure_domain === "reasoning-engine" && !text(check.target_component)) throw new TypeError("Reasoning-engine check requires target_component");
      checkIds.add(check.check_id);
    }
  }
  return freeze(corpus);
}

export async function runChatUsabilityBenchmark({corpus, executeScenario} = {}) {
  const selected = validateCorpus(corpus);
  if (typeof executeScenario !== "function") throw new TypeError("Chat usability benchmark requires executeScenario");
  const profileDigest = digest(selected);
  const collected = [];
  for (const scenario of selected.scenarios) {
    let actual;
    try {
      actual = await executeScenario(scenario);
    } catch (error) {
      actual = {checks: Object.fromEntries(scenario.checks.map((check) => [check.check_id, {
        status: "NOT_EVALUATED",
        observed_behavior: `Scenario executor stopped: ${error?.name ?? "Error"}`,
        evidence_refs: [],
      }]))};
    }
    const checks = scenario.checks.map((expected) => {
      const observed = actual?.checks?.[expected.check_id];
      const status = statuses.has(observed?.status) ? observed.status : "NOT_EVALUATED";
      return freeze({
        check_id: expected.check_id,
        status,
        passed: status === "PASS" ? true : status === "FAIL" ? false : null,
        failure_domain: expected.failure_domain,
        target_component: expected.target_component ?? null,
        expected_behavior: expected.expected_behavior,
        observed_behavior: text(observed?.observed_behavior) ? observed.observed_behavior.trim() : "No observation was produced.",
        evidence_refs: Array.isArray(observed?.evidence_refs) ? [...new Set(observed.evidence_refs.filter(text))].sort() : [],
        authority_effect: "none",
      });
    });
    collected.push(freeze({scenario_id: scenario.scenario_id, checks, passed: checks.every((check) => check.passed === true), authority_effect: "none"}));
  }

  const flat = collected.flatMap((scenario) => scenario.checks.map((check) => ({scenario_id: scenario.scenario_id, check})));
  const hasNotEvaluated = flat.some(({check}) => check.status === "NOT_EVALUATED");
  const hasFailure = flat.some(({check}) => check.status === "FAIL");
  const status = hasNotEvaluated ? "NOT_EVALUATED" : hasFailure ? "FAIL" : "PASS";
  const result = freeze({
    schema_version: CHAT_USABILITY_RESULT_SCHEMA,
    benchmark_id: selected.benchmark_id,
    profile_digest: profileDigest,
    mode: "single-chat-usability",
    status,
    summary: {checks: Object.fromEntries(flat.map(({check}) => [check.check_id, check.passed]))},
    cases: collected,
    authority_effect: "none",
  });
  const resultDigest = digest(result);
  const observations = flat.filter(({check}) => check.status !== "PASS").map(({scenario_id, check}) => createUsabilityObservation({
    source_benchmark_result_digest: resultDigest,
    scenario_id: scenario_id,
    status: check.status,
    observed_behavior: check.observed_behavior,
    expected_behavior: check.expected_behavior,
    failure_domain: check.status === "NOT_EVALUATED" ? "not_evaluable" : check.failure_domain,
    target_component: check.status === "NOT_EVALUATED" ? null : check.target_component,
    evidence_refs: check.evidence_refs,
  }));
  return freeze({result, result_digest: resultDigest, observations, authority_effect: "none"});
}
