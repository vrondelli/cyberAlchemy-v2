import {createCodexAppServerWrapper, protocolBindingCheck} from "../../../packages/codex-app-server-wrapper/index.mjs";
import {loadRuntime, reasonsFromAction, resultEnvelope, turnMessage} from "./common.mjs";

function makeWrapper(loaded, overrides = {}) {
  return createCodexAppServerWrapper({loaded_profile: overrides.loaded_profile ?? loaded.value, decision_profile: loaded.decision_profile, definition_catalog: loaded.definition_catalog, ontology_snapshot: loaded.ontology_snapshot, instructions: loaded.instructions, supplemental_context_items: loaded.supplemental_context_items, source_snapshot: loaded.source_snapshot, context_source_provider: overrides.context_source_provider ?? loaded.context_source_provider});
}

function bindingFor(scenario) {
  if (scenario.lane === "plan-bound") return {lane: "plan-bound", consumer_ref: "codex:benchmark-plan", purpose: "benchmark-lifecycle", source_epoch: "benchmark:current", window_ref: `benchmark:${scenario.scenario_id}`, request_id: `benchmark:${scenario.scenario_id}`};
  return {lane: "interaction-bound", consumer_ref: `codex:benchmark:${scenario.scenario_id}`, purpose: "benchmark-lifecycle", source_epoch: "benchmark:current"};
}

export async function runIntegrationBenchmark(benchmark) {
  const {profile, corpora} = benchmark;
  const loaded = loadRuntime(profile);
  const lifecycleCases = [];
  for (const scenario of corpora.lifecycle) {
    const scenarioProfile = structuredClone(loaded.value);
    scenarioProfile.turn_bindings.default = bindingFor(scenario);
    const wrapper = makeWrapper(loaded, {loaded_profile: scenarioProfile});
    let priorView = null;
    const turns = [];
    for (const [index, turn] of scenario.turns.entries()) {
      const message = turnMessage(`${scenario.scenario_id}:${index}`, scenario.scenario_id, turn.request, turn.objective_kind ?? null);
      const action = await wrapper.processClientMessage(message);
      const forwarded = action.to_server?.[0];
      const fragmentEntry = forwarded?.params?.additionalContext?.["cyberalchemy.are.context-basis"];
      const fragment = fragmentEntry ? JSON.parse(fragmentEntry.value) : null;
      const same = priorView !== null && fragment?.view_id === priorView;
      const passed = Boolean(fragment) && same === turn.expect_same_view;
      turns.push({turn: index + 1, passed, expected_same_view: turn.expect_same_view, actual_same_view: same, view_id: fragment?.view_id ?? null, context_epoch_id: fragment?.context_epoch_id ?? null, reasons: reasonsFromAction(action)});
      priorView = fragment?.view_id ?? priorView;
    }
    lifecycleCases.push({scenario_id: scenario.scenario_id, passed: turns.every((entry) => entry.passed), turns});
  }
  const failureCases = [];
  for (const scenario of corpora.failure) {
    let forwarded = false;
    let reasons = [];
    if (scenario.failure_kind === "protocol-version-drift") {
      const assessment = protocolBindingCheck(loaded.value.protocol_binding, "codex-cli 0.0.0-benchmark");
      reasons = assessment.reason_codes ?? [];
    } else {
      let selectedLoaded = loaded;
      let sourceProvider = loaded.context_source_provider;
      if (scenario.failure_kind === "missing-live-source") sourceProvider = () => ({ok: false, reason_codes: ["benchmark.source-missing"]});
      if (scenario.failure_kind === "mandatory-overflow") selectedLoaded = {...loaded, value: {...loaded.value, context_projection: {...loaded.value.context_projection, max_inline_bytes: 64}}};
      const wrapper = makeWrapper(selectedLoaded, {loaded_profile: selectedLoaded.value, context_source_provider: sourceProvider});
      const message = turnMessage(scenario.scenario_id, `failure:${scenario.scenario_id}`, scenario.request, null);
      if (scenario.failure_kind === "malformed-hint") message.params.additionalContext["cyberalchemy.request-context"] = {kind: "application", value: "{}"};
      const action = await wrapper.processClientMessage(message);
      forwarded = (action.to_server?.length ?? 0) > 0;
      reasons = reasonsFromAction(action);
    }
    failureCases.push({scenario_id: scenario.scenario_id, passed: forwarded === scenario.expected_forward && reasons.includes(scenario.expected_reason), forwarded, reasons});
  }
  const checks = {lifecycle: lifecycleCases.every((entry) => entry.passed), failure_safety: failureCases.every((entry) => entry.passed)};
  return resultEnvelope(profile, "integration", Object.values(checks).every(Boolean) ? "PASS" : "FAIL", {checks}, {lifecycle: lifecycleCases, failure_safety: failureCases});
}
