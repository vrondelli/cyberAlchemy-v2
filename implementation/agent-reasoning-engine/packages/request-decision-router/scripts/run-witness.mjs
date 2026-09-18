import {createHash} from "node:crypto";
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname, resolve} from "node:path";

import {evaluateContinuation, loadVerifiedDecisionProfile, routeRequest} from "../index.mjs";
import {createNativeSemanticModulePort} from "../../module-port/native-semantic-adapter.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const profilePath = resolve(packageRoot, "profiles/cyberalchemy-v1.json");
const loaded = loadVerifiedDecisionProfile(profilePath, repositoryRoot);
if (!loaded.ok) throw new Error(loaded.reason_codes.join(","));
const profile = loaded.value;
const modulePort = createNativeSemanticModulePort();
const contexts = [
  ["define", "Please clarify intent and define this concept.", "CA2-ROUTE-DEFINE"],
  ["goal", "Decompose goal into a work graph.", "CA2-ROUTE-PLAN"],
  ["implement", "Implement the bounded repair.", "CA2-ROUTE-IMPLEMENT"],
];
const routing = contexts.map(([id, raw_request, expected]) => {
  const result = routeRequest({schema_version: "are.request-context/v1", request_id: id, raw_request, objective_kind: null, requested_effects: [], target_refs: [], constraints: [], evidence_refs: ["witness"]}, profile, modulePort);
  if (result.kind !== "direct" || result.selected.route_id !== expected) throw new Error(`ROUTE_WITNESS_FAILED:${id}`);
  return {id, expected, decision_digest: result.decision_digest};
});
const safe = evaluateContinuation({completion: {completion_id: "safe", status: "completed", continuation_required: true, evidence_refs: []}, options: [{option_id: "validate", route_id: "CA2-ROUTE-VALIDATE", effect_classes: ["non-effectful-validate"], reversible: true, owner_gate_ref: null, structurally_admissible: true, rejection_reasons: []}]}, profile);
const protectedResult = evaluateContinuation({completion: {completion_id: "publish", status: "completed", continuation_required: true, evidence_refs: []}, options: [{option_id: "publish", route_id: "CA2-ROUTE-PUBLISH", effect_classes: ["publication"], reversible: false, owner_gate_ref: null, structurally_admissible: true, rejection_reasons: []}]}, profile);
if (safe.kind !== "direct" || protectedResult.kind !== "gate") throw new Error("CONTINUATION_WITNESS_FAILED");
const profileBytes = readFileSync(profilePath);
const receipt = {schema_version: "are.request-decision-witness/v1", status: "PASS", profile_ref: "profiles/cyberalchemy-v1.json", profile_sha256: createHash("sha256").update(profileBytes).digest("hex"), profile_digest: profile.profile_digest, routing, continuation: {safe: safe.decision_digest, protected: protectedResult.decision_digest}, authority_effect: "none", claim_limit: "Bounded deterministic routing and consequence classification only; no route execution, owner decision, governance adoption, or effect authority."};
const output = resolve(packageRoot, "generated/witness-receipt.json");
mkdirSync(dirname(output), {recursive: true});
writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
