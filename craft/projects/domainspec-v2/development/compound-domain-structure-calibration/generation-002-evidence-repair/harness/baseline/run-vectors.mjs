import { sha256Canonical } from "../../../evaluation/canonical-json.mjs";

import { HARNESS_DESCRIPTOR, commitNavigation, nextStepModel, previousStepModel, renderRoute } from "./navigation-model.mjs";
import { SCREEN_REGISTRY } from "./screen-registry.mjs";
import { SESSION_FIXTURES } from "./session-fixtures.mjs";

export const OBSERVABLE_FIELDS = Object.freeze([
  "allowed",
  "requested_step",
  "committed_step",
  "screen_key",
  "next_step",
  "previous_step",
  "notice_present",
  "route_tree_rendered",
]);

export function harnessDigest() {
  return sha256Canonical(HARNESS_DESCRIPTOR);
}

export function runVector(vector, { registry = SCREEN_REGISTRY, bypassGuard = false } = {}) {
  const input = vector.input;
  if (input.action === "render") return renderRoute({ mounted: input.mounted, currentStep: input.current_step, registry });
  const session = SESSION_FIXTURES[input.session_fixture];
  if (!session) throw new TypeError(`unknown session fixture: ${input.session_fixture}`);
  let requestedStep = input.requested_step;
  if (input.action === "next") requestedStep = nextStepModel(input.current_step);
  if (input.action === "back") requestedStep = previousStepModel(input.current_step);
  const result = commitNavigation({
    currentStep: input.current_step,
    requestedStep,
    session,
    mounted: input.mounted,
    bypassGuard,
    registry,
  });
  if (input.action === "next") result.next_step = requestedStep;
  if (input.action === "back") result.previous_step = requestedStep;
  return result;
}

export function runBaseline(vectors) {
  return vectors.map((vector) => ({
    vector_id: vector.vector_id,
    expected: vector.expected,
    actual: runVector(vector),
  }));
}

export function compareObservables(left, right) {
  return OBSERVABLE_FIELDS.every((field) => Object.is(left[field], right[field]));
}
