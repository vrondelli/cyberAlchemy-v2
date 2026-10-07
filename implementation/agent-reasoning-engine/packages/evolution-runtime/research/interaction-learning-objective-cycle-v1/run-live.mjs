#!/usr/bin/env node
import {createHash} from "node:crypto";
import {closeSync, fsyncSync, mkdirSync, mkdtempSync, openSync, readFileSync, renameSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";

import {canonicalJson, canonicalizeJson} from "../../../intent-route-resolver/index.mjs";
import {createRemoteMountedCredentialBinding, createRemoteMountedPost} from "../hen-10-live-contextbench-v1/remote-mounted-glm-v1.mjs";
import {CHECKPOINT_SYSTEM_PROMPT, LIVE_SCENARIOS} from "./live-scenarios.mjs";
import {LEDGER_SYSTEM_PROMPT, LIVE_SCENARIOS_V2} from "./live-scenarios-v2.mjs";
import {ENVELOPE_SYSTEM_PROMPT, LIVE_SCENARIOS_V3} from "./live-scenarios-v3.mjs";

const digest = (value) => createHash("sha256").update(typeof value === "string" ? value : canonicalJson(canonicalizeJson(value))).digest("hex");
const argument = (name) => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : null; };
const cycleRoot = resolve(argument("--cycle-root") ?? "");
const revision = Number(argument("--revision") ?? 1);
const second = revision === 2;
const third = revision === 3;
const hypothesisPath = join(cycleRoot, third ? "hypothesis-v3.json" : second ? "hypothesis-v2.json" : "hypothesis.json");
const hypothesis = JSON.parse(readFileSync(hypothesisPath, "utf8"));
const scenarios = third ? LIVE_SCENARIOS_V3 : second ? LIVE_SCENARIOS_V2 : LIVE_SCENARIOS;
const systemPrompt = third ? ENVELOPE_SYSTEM_PROMPT : second ? LEDGER_SYSTEM_PROMPT : CHECKPOINT_SYSTEM_PROMPT;
if (hypothesis.candidate?.candidate_ref !== (third ? "engine-owned-transition-envelope/v3" : second ? "objective-transition-ledger/v2" : "objective-transition-checkpoint/v1") || scenarios.length !== hypothesis.experiment?.prospective_scenario_count) throw new Error("interaction-live.hypothesis-invalid");

function atomicJson(path, value) {
  mkdirSync(dirname(path), {recursive:true, mode:0o700});
  const temporary = `${path}.tmp-${process.pid}`;
  const descriptor = openSync(temporary, "wx", 0o600);
  try { writeFileSync(descriptor, `${canonicalJson(canonicalizeJson(value))}\n`); fsyncSync(descriptor); } finally { closeSync(descriptor); }
  renameSync(temporary, path);
  const directory = openSync(dirname(path), "r");
  try { fsyncSync(directory); } finally { closeSync(directory); }
}

function parseStructural(content) {
  try {
    const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const value = JSON.parse(cleaned);
    if (third) return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 1 && typeof value.response === "string" && value.response.length > 0 ? {valid:true,model_response_valid:true} : {valid:false,model_response_valid:false};
    const keys = second ? ["transition", "active_objective", "active_cycle", "relationship_code", "response_language", "next_action", "clarification_needed", "response"] : ["transition", "active_objective", "active_cycle", "relationship", "next_action", "clarification_needed", "response"];
    return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key))
      ? {valid:true, transition:value.transition, active_cycle:value.active_cycle, clarification_needed:value.clarification_needed, ...(second ? {relationship_code:value.relationship_code,response_language:value.response_language} : {})}
      : {valid:false};
  } catch { return {valid:false}; }
}

const temporaryRoot = mkdtempSync(join(tmpdir(), "are-interaction-live-"));
const post = createRemoteMountedPost();
const {registry, reference} = createRemoteMountedCredentialBinding();
const raw = [];
const redacted = [];
for (const scenario of scenarios) {
  const envelope = third ? {transition:scenario.expected_transition,active_objective:scenario.active_objective,active_cycle:scenario.active_cycle,relationship_code:scenario.relationship_code,response_language:scenario.response_language,next_action:scenario.next_pending_action,clarification_needed:scenario.clarification_expected} : null;
  const user = third ? `ENGINE ENVELOPE: ${JSON.stringify(envelope)}\nUSER REQUEST: ${scenario.user_request}` : second ? `OBJECTIVE LEDGER: ${JSON.stringify({active_objective:scenario.active_objective,active_cycle:scenario.active_cycle,active_cycle_kind:"evolution-cycle",relationship_code:scenario.relationship_code,response_language:scenario.response_language,next_pending_action:scenario.next_pending_action,invariants:["evolution-cycles-are-siblings","benchmark-is-an-artifact","engine-coordinates-cycles"]})}\nUSER REQUEST: ${scenario.user_request}` : `ACTIVE OBJECTIVE: ${scenario.active_objective}\nACTIVE CYCLE: ${scenario.active_cycle}\nCURRENT STATE: ${scenario.state}\nUSER REQUEST: ${scenario.user_request}`;
  const body = JSON.stringify({model:"glm-5.3-flash", stream:false, max_tokens:512, temperature:0, thinking:{type:"enabled", clear_thinking:false}, reasoning_effort:"low", messages:[{role:"system",content:systemPrompt},{role:"user",content:user}]});
  const started = Date.now();
  let result;
  await registry.consume({secret_ref:reference, consumer_id:"interaction-live", request_digest:digest(body), consumer:async (apiKey) => {
    result = await post(new URL("https://api.z.ai/api/paas/v4/chat/completions"), body, {apiKey:apiKey.toString("utf8"), timeout_ms:120000, maximum_response_bytes:262144});
  }});
  const content = result.payload?.choices?.[0]?.message?.content;
  if (result.status !== 200 || typeof content !== "string") throw new Error(`interaction-live.provider-response-invalid:${scenario.scenario_id}`);
  const structural = parseStructural(content);
  raw.push({scenario, ...(third ? {engine_envelope:envelope} : {}), content, provider_status:result.status, usage:result.payload?.usage ?? null});
  redacted.push({scenario_id:scenario.scenario_id, input_digest:digest(user), response_digest:digest(content), expected_transition:scenario.expected_transition, clarification_expected:scenario.clarification_expected, structural:third ? {...envelope,...structural} : structural, provider_status:result.status, elapsed_ms:Date.now()-started, usage:result.payload?.usage ?? null});
  atomicJson(join(temporaryRoot, "responses.partial.json"), {hypothesis_digest:hypothesis.hypothesis_digest, completed_scenario_count:raw.length, scenarios:raw});
}
atomicJson(join(temporaryRoot, "responses.json"), {hypothesis_digest:hypothesis.hypothesis_digest, scenarios:raw});
const material = {schema_version:"are.interaction-learning-live-run/v1", cycle_id:hypothesis.cycle_id, hypothesis_digest:hypothesis.hypothesis_digest, model:"glm-5.3-flash", provider_binding:"remote-mounted-secret", raw_response_retention:"temporary-evaluator-transfer-only", scenario_count:redacted.length, scenarios:redacted, authority_effect:"none"};
const manifest = {...material, run_digest:digest(material)};
const manifestPath = join(cycleRoot, third ? "live-run-v3.json" : second ? "live-run-v2.json" : "live-run.json");
atomicJson(manifestPath, manifest);
process.stdout.write(`${canonicalJson({ok:true, run_digest:manifest.run_digest, scenario_count:redacted.length, temporary_evaluator_path:join(temporaryRoot,"responses.json"), persisted_manifest:manifestPath, authority_effect:"none"})}\n`);
