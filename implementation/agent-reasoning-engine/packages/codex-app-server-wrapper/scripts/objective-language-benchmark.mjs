import {readFileSync} from "node:fs";
import {resolveObjectiveTransition, digestIntentMaterial} from "../../request-intent-runtime/index.mjs";
import {createModulePort} from "../../module-port/index.mjs";
import {createSemanticTextFacade, semanticTextOutputValidators} from "../../module-port/semantic-text.mjs";
import {createAlchSemanticAdapter} from "../../module-port/alch-semantic-adapter.mjs";
const cases = JSON.parse(readFileSync(new URL("../test/fixtures/objective-language-challenge.json", import.meta.url)));
const identity = {consumer_ref: "benchmark", scope_ref: "language-challenge"};
const semanticText = createSemanticTextFacade(createModulePort({adapters: [createAlchSemanticAdapter()], output_validators: semanticTextOutputValidators}), {consumer_id: "request-intent-runtime"});
const resolveObjective = input => resolveObjectiveTransition(input, null, semanticText);
const seed = await resolveObjective({...identity, request_ref: "seed", request: "Research context reuse"});
const rows = [];
for (const [i, [request, expected, active]] of cases.entries()) {
  const r = await resolveObjective({...identity, request, request_ref: `challenge:${i}`,
    ...(active ? {state: seed.next_state, expected_state_digest: seed.next_state.state_digest} : {})});
  const actual = r.disposition === "resolved" ? r.transition : r.disposition;
  rows.push({request, expected, actual, matched: actual === expected, deferred_known_intent: expected !== "ask" && actual === "ask",
    unexpected_resolution: actual !== "ask" && actual !== expected, provider_calls: r.provider_calls});
}
const result = {schema_version: "are.objective-language-challenge/v1", fixture_digest: digestIntentMaterial(cases), cases: rows.length, matched: rows.filter(r => r.matched).length,
  deferred_known_intent: rows.filter(r => r.deferred_known_intent).length, unexpected_resolutions: rows.filter(r => r.unexpected_resolution).length,
  provider_calls: rows.reduce((n,r) => n+r.provider_calls,0), rows,
  scope: "Authored development challenge set, deterministic path only; no model accuracy or held-out claim", authority_effect: "none"};
console.log(JSON.stringify({...result, result_digest: digestIntentMaterial(result)}, null, 2));
if (result.unexpected_resolutions > 0) process.exitCode = 1;
