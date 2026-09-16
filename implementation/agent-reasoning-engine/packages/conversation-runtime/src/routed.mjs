import {routeRequest} from "../../request-decision-router/index.mjs";
import {createConversationRuntime} from "./runtime.mjs";

function requestContext(turn) {
  return {
    schema_version: "are.request-context/v1",
    request_id: `conversation:${turn.conversation_id}:turn:${turn.turn_id}`,
    raw_request: turn.text,
    objective_kind: turn.intent_contract.route_candidate ?? null,
    requested_effects: [],
    target_refs: [],
    constraints: [],
    evidence_refs: [`conversation:${turn.conversation_id}`],
  };
}

export function createRoutedConversationRuntime(options = {}) {
  if (!options.decisionProfile) throw new TypeError("Routed conversation runtime requires a verified decision profile");
  const routeHandlers = Object.freeze({...options.routeHandlers});
  const route = options.routeRequest ?? routeRequest;
  const onRouteDecision = options.onRouteDecision ?? (() => {});

  return createConversationRuntime({
    ...options,
    turnHandler: async (turn) => {
      const decision = route(requestContext(turn), options.decisionProfile, options.modulePort);
      onRouteDecision(decision, turn);
      if (decision.kind === "gate") {
        return {
          question: `I found more than one valid internal route: ${decision.candidates.join(", ")}. What outcome should I prioritize?`,
          diagnostic: {kind: "route-ambiguity", candidates: decision.candidates, decision_digest: decision.decision_digest, authority_effect: "none"},
        };
      }
      if (decision.kind !== "direct" || !decision.selected?.route_id) {
        return {blocked: true, reason_codes: decision.reason_codes ?? ["conversation.route-unavailable"], diagnostic: {kind: "route-block", decision_digest: decision.decision_digest, authority_effect: "none"}};
      }
      const handler = routeHandlers[decision.selected.route_id];
      if (typeof handler !== "function") {
        return {blocked: true, reason_codes: [`conversation.route-handler-unavailable:${decision.selected.route_id}`], diagnostic: {kind: "route-handler-unavailable", route_id: decision.selected.route_id, authority_effect: "none"}};
      }
      return handler(Object.freeze({...turn, route_decision: decision}));
    },
  });
}
