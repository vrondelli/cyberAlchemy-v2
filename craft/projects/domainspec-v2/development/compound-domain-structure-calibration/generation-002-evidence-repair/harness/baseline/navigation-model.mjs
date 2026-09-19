import { selectScreen, SCREEN_REGISTRY } from "./screen-registry.mjs";

export const SAVVY_FLOW = Object.freeze([
  "login",
  "onboarding",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
]);

export const HARNESS_DESCRIPTOR = Object.freeze({
  model_version: "cdsc2-savvy-page-model-v1",
  flow: SAVVY_FLOW,
  screen_contracts: Object.fromEntries(
    Object.entries(SCREEN_REGISTRY).map(([step, screen]) => [step, { screen_key: screen.screen_key, ports: screen.ports }]),
  ),
  modeled_decisions: ["guarded-step-commit", "next-step", "previous-step", "mounted-screen-selection"],
});

export function guardStepModel(requestedStep, session) {
  requireKnownStep(requestedStep, true);
  requireSession(session);
  if (requestedStep === "login") return { allowed: true, step: requestedStep, requested: requestedStep };
  if (!session.is_active) return { allowed: false, step: "login", requested: requestedStep, reason: "inactive-session" };
  if (requestedStep === "onboarding" || requestedStep === "settings") {
    return { allowed: true, step: requestedStep, requested: requestedStep };
  }
  requireKnownStep(session.first_pending_step, false);
  const pendingIndex = SAVVY_FLOW.indexOf(session.first_pending_step);
  const requestedIndex = SAVVY_FLOW.indexOf(requestedStep);
  if (requestedIndex <= pendingIndex) return { allowed: true, step: requestedStep, requested: requestedStep };
  return { allowed: false, step: session.first_pending_step, requested: requestedStep, reason: "premature-step" };
}

export function nextStepModel(currentStep) {
  const index = SAVVY_FLOW.indexOf(currentStep);
  if (index < 0) return "1";
  return SAVVY_FLOW[Math.min(index + 1, SAVVY_FLOW.length - 1)];
}

export function previousStepModel(currentStep) {
  const index = SAVVY_FLOW.indexOf(currentStep);
  if (index < 0) return "1";
  return SAVVY_FLOW[Math.max(index - 1, 0)];
}

export function commitNavigation({ currentStep, requestedStep, session, mounted = true, bypassGuard = false, registry = SCREEN_REGISTRY }) {
  requireKnownStep(currentStep, true);
  const guard = guardStepModel(requestedStep, session);
  const committedStep = bypassGuard ? requestedStep : guard.step;
  return {
    allowed: guard.allowed,
    requested_step: requestedStep,
    committed_step: committedStep,
    screen_key: mounted ? selectScreen(committedStep, registry).screen_key : null,
    next_step: null,
    previous_step: null,
    notice_present: !guard.allowed,
    route_tree_rendered: mounted,
  };
}

export function renderRoute({ mounted, currentStep, registry = SCREEN_REGISTRY }) {
  requireKnownStep(currentStep, true);
  return {
    allowed: null,
    requested_step: null,
    committed_step: currentStep,
    screen_key: mounted ? selectScreen(currentStep, registry).screen_key : null,
    next_step: null,
    previous_step: null,
    notice_present: false,
    route_tree_rendered: mounted,
  };
}

function requireKnownStep(step, allowSettings) {
  if (SAVVY_FLOW.includes(step)) return;
  if (allowSettings && step === "settings") return;
  throw new TypeError(`unknown step: ${step}`);
}

function requireSession(session) {
  if (session === null || typeof session !== "object") throw new TypeError("session fixture required");
  if (typeof session.is_active !== "boolean") throw new TypeError("session is_active must be boolean");
  if (typeof session.first_pending_step !== "string") throw new TypeError("session first_pending_step required");
}
