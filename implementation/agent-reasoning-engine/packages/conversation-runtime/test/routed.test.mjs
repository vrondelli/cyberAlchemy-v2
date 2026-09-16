import assert from "node:assert/strict";
import {resolve} from "node:path";
import test from "node:test";

import {loadVerifiedDecisionProfile} from "../../request-decision-router/index.mjs";
import {createModulePort} from "../../module-port/index.mjs";
import {createAlchSemanticAdapter} from "../../module-port/alch-semantic-adapter.mjs";
import {semanticTextOutputValidators} from "../../module-port/semantic-text.mjs";
import {createRoutedConversationRuntime} from "../index.mjs";

const repositoryRoot = resolve(import.meta.dirname, "../../../../../..");
const profilePath = resolve(import.meta.dirname, "../../request-decision-router/profiles/cyberalchemy-v1.json");
const loaded = loadVerifiedDecisionProfile(profilePath, repositoryRoot);
assert.equal(loaded.ok, true, (loaded.reason_codes ?? []).join(","));
const modulePort = createModulePort({adapters: [createAlchSemanticAdapter()], output_validators: semanticTextOutputValidators});

function ids() { let sequence = 0; return (kind) => `${kind}-${++sequence}`; }

test("ARE changes internal routes while the user remains in one conversation", async () => {
  const routes = [];
  const runtime = createRoutedConversationRuntime({
    decisionProfile: loaded.value,
    modulePort,
    idFactory: ids(),
    onRouteDecision: (decision) => routes.push(decision.selected?.route_id ?? decision.kind),
    routeHandlers: {
      "CA2-ROUTE-DEFINE": async () => ({assistant_text: "Definition candidate prepared."}),
      "CA2-ROUTE-RESEARCH": async () => ({assistant_text: "Research comparison prepared."}),
    },
  });
  runtime.open({conversation_id: "one-chat"});
  assert.equal((await runtime.submitMessage({conversation_id: "one-chat", text: "Define the product intent."})).ok, true);
  assert.equal((await runtime.submitMessage({conversation_id: "one-chat", text: "Research comparable products."})).ok, true);
  assert.deepEqual(routes, ["CA2-ROUTE-DEFINE", "CA2-ROUTE-RESEARCH"]);
  assert.equal(runtime.inspect({conversation_id: "one-chat"}).value.messages.length, 4);
});

test("route ambiguity becomes an inline question rather than a TUI mode choice", async () => {
  const runtime = createRoutedConversationRuntime({decisionProfile: loaded.value, modulePort, idFactory: ids(), routeHandlers: {}});
  runtime.open({conversation_id: "one-chat"});
  const result = await runtime.submitMessage({conversation_id: "one-chat", text: "Research and validate this evidence."});
  assert.equal(result.ok, true);
  const events = result.value.events;
  assert.equal(events.some((event) => event.event_type === "question.required"), true);
  assert.equal(events.some((event) => event.event_type === "diagnostic.available" && event.payload.kind === "route-ambiguity"), true);
});

test("an unavailable internal handler blocks inside ARE", async () => {
  const runtime = createRoutedConversationRuntime({decisionProfile: loaded.value, modulePort, idFactory: ids(), routeHandlers: {}});
  runtime.open({conversation_id: "one-chat"});
  const result = await runtime.submitMessage({conversation_id: "one-chat", text: "Implement the single chat."});
  assert.equal(result.ok, false);
  assert.deepEqual(result.reason_codes, ["conversation.route-handler-unavailable:CA2-ROUTE-IMPLEMENT"]);
});
