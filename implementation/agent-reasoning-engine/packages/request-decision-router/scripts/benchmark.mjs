import {performance} from "node:perf_hooks";
import {fileURLToPath} from "node:url";
import {dirname, resolve} from "node:path";

import {evaluateContinuation, loadVerifiedDecisionProfile, routeRequest} from "../index.mjs";
import {createNativeSemanticModulePort} from "../../module-port/native-semantic-adapter.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const loadStart = performance.now();
const loaded = loadVerifiedDecisionProfile(resolve(packageRoot, "profiles/cyberalchemy-v1.json"), repositoryRoot);
const profileLoadMs = performance.now() - loadStart;
if (!loaded.ok) throw new Error(loaded.reason_codes.join(","));
const profile = loaded.value;
const modulePort = createNativeSemanticModulePort();
const context = {schema_version: "are.request-context/v1", request_id: "BENCH", raw_request: "Please clarify intent and define this concept.", objective_kind: null, requested_effects: [], target_refs: [], constraints: [], evidence_refs: ["benchmark"]};
const continuation = {completion: {completion_id: "BENCH-C", status: "completed", continuation_required: true, evidence_refs: []}, options: [{option_id: "BENCH-O", route_id: "CA2-ROUTE-VALIDATE", effect_classes: ["non-effectful-validate"], reversible: true, owner_gate_ref: null, structurally_admissible: true, rejection_reasons: []}]};

function sample(fn, iterations) {
  for (let index = 0; index < 1000; index += 1) fn();
  const values = [];
  for (let index = 0; index < iterations; index += 1) {
    const start = performance.now();
    fn();
    values.push(performance.now() - start);
  }
  values.sort((a, b) => a - b);
  return {iterations, mean_ms: values.reduce((sum, value) => sum + value, 0) / values.length, p50_ms: values[Math.floor(values.length * 0.50)], p95_ms: values[Math.floor(values.length * 0.95)], max_ms: values.at(-1)};
}

const result = {schema_version: "are.request-decision-benchmark/v1", profile_load_ms: profileLoadMs, route: sample(() => routeRequest(context, profile, modulePort), 10000), continuation: sample(() => evaluateContinuation(continuation, profile), 10000), authority_effect: "none", claim_limit: "Local timing for current machine and bytes only; no universal latency or runtime-admission claim."};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
