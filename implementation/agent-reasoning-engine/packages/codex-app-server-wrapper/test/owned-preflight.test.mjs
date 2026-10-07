import assert from "node:assert/strict";
import test from "node:test";
import {resolve} from "node:path";
import {loadRepositoryProfile} from "../index.mjs";
import {evaluateOwnedRequestPreflight, evaluateTurnPreflight} from "../src/preflight.mjs";
import {buildOwnedRequestContext} from "../src/owned-request-context.mjs";
import {createOwnedObjectiveLifecycle} from "../src/objective-session-lifecycle.mjs";
import {createReasoningStateLedger} from "../../reasoning-state-runtime/index.mjs";
import {semanticModulePort} from "./semantic-module-fixture.mjs";

const root = resolve(import.meta.dirname, "..");
const loaded = loadRepositoryProfile(resolve(root, "profiles/repository-v1.json"),
  resolve(root, "../../../../.."));
assert.equal(loaded.ok, true, loaded.reason_codes?.join(","));
const request = (id, text) => ({consumer_ref: "dsh:host", scope_ref: "conversation-a",
  thread_ref: "backend-thread:a", request_ref: `dsh-request:${id}`, request: text});
const binding = {lane: "interaction-bound", consumer_ref: "dsh:host", purpose: "repository-request",
  source_epoch: "fixture-source", turn_id: "turn-a", interaction_id: "interaction-a"};
const sources = {decision_profile: loaded.decision_profile, definition_catalog: loaded.definition_catalog,
  ontology_snapshot: loaded.ontology_snapshot, context: loaded.value.context,
  instructions: loaded.instructions, supplemental_context_items: loaded.supplemental_context_items,
  current_sources: loaded.source_snapshot, projection_policy: loaded.value.context_projection};

test("native preflight composes the same selected route as Codex without Codex forwarding", () => {
  const ownedRequest = request(1, "Explain this architecture");
  const native = evaluateOwnedRequestPreflight({...sources, owned_request: ownedRequest,
    turn_binding: binding}, {module_port: semanticModulePort()});
  const codex = evaluateTurnPreflight({...sources, turn_binding: binding,
    message: {id: "dsh-request:1", method: "turn/start", params: {
      threadId: "backend-thread:a", input: [{type: "text", text: ownedRequest.request}]}}},
  {module_port: semanticModulePort()});
  assert.equal(native.action, "prepared", JSON.stringify(native));
  assert.equal(native.directive.schema_version, "are.owned-preflight-directive/v1");
  assert.deepEqual(native.directive.selected_route_or_candidates, codex.directive.selected_route_or_candidates);
  assert.deepEqual(native.original_request, ownedRequest);
  assert.equal(native.forwarded_message, undefined);
  assert.equal(native.fragment, undefined);
  assert.equal(native.context_envelope.ok, true);
  assert.equal(codex.action, "forward");
  assert.equal(codex.directive.schema_version, "are.codex-preflight-directive/v2");
});

test("continuation routes and composes from verified objective while retaining original input", async () => {
  const ledger = createReasoningStateLedger();
  const lifecycle = () => createOwnedObjectiveLifecycle({ledger,
    configuration: {enabled: true}, module_port: semanticModulePort()});
  const first = await lifecycle().prepare(request(1, "Research context management approaches."));
  const secondRequest = request(2, "do next");
  const second = await lifecycle().prepare(secondRequest);
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  const result = evaluateOwnedRequestPreflight({...sources, owned_request: secondRequest,
    turn_binding: binding, objective_resolution: second.resolution}, {module_port: semanticModulePort()});
  assert.equal(result.action, "prepared", JSON.stringify(result));
  assert.equal(result.original_request.request, "do next");
  assert.equal(result.request_context.raw_request, "Research context management approaches.");
  assert.equal(result.request_context.field_postures.raw_request, "inferred");
  assert.deepEqual(result.directive.selected_route_or_candidates, ["CA2-ROUTE-RESEARCH"]);
});

test("verified resolution cannot cross request, consumer, conversation or text boundaries", async () => {
  const input = request(1, "Research context management approaches.");
  const lifecycle = createOwnedObjectiveLifecycle({ledger: createReasoningStateLedger(),
    configuration: {enabled: true}, module_port: semanticModulePort()});
  const prepared = await lifecycle.prepare(input);
  for (const override of [{request_ref: "foreign"}, {scope_ref: "foreign"},
    {consumer_ref: "foreign"}, {request: "Other text"}]) {
    const changed = {...input, ...override};
    assert.equal(buildOwnedRequestContext(changed,
      {...binding, consumer_ref: changed.consumer_ref}, prepared.resolution).ok, false);
  }
  assert.equal(buildOwnedRequestContext({...input, browserClaim: "owned"}, binding).ok, false);
});
