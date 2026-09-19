export const SAVVY_FLOW = Object.freeze([
  "login", "onboarding", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11",
]);

export const SCREEN_REGISTRY = Object.freeze({
  login: screen("step-login", []),
  onboarding: screen("step-onboarding", ["onBack", "onNext"]),
  "1": screen("step-1", ["onNext"]),
  "2": screen("step-2", ["onBack", "onNext"]),
  "3": screen("step-3", ["onBack", "onNext"]),
  "4": screen("step-4", ["onBack", "onNext"]),
  "5": screen("step-5", []),
  "6": screen("step-6", ["onBack", "onNext"]),
  "7": screen("step-7", ["onBack"]),
  "8": screen("step-8", ["onBack", "onNext"]),
  "9": screen("step-9-baseline", ["onBack", "onNext"]),
  "10": screen("step-10", ["onBack", "onNext"]),
  "11": screen("step-11", []),
  settings: screen("step-settings", ["onBack"]),
});

export const SESSION_FIXTURES = Object.freeze({
  "active-complete": Object.freeze({ is_active: true, first_pending_step: "11" }),
  "active-pending-3": Object.freeze({ is_active: true, first_pending_step: "3" }),
  inactive: Object.freeze({ is_active: false, first_pending_step: "login" }),
});

export function guardStep(requested, session) {
  if (requested === "login") return { allowed: true, step: requested, requested };
  if (!session.is_active) return { allowed: false, step: "login", requested, reason: "inactive-session" };
  if (requested === "onboarding" || requested === "settings") return { allowed: true, step: requested, requested };
  const pendingIndex = SAVVY_FLOW.indexOf(session.first_pending_step);
  const requestedIndex = SAVVY_FLOW.indexOf(requested);
  if (requestedIndex <= pendingIndex) return { allowed: true, step: requested, requested };
  return { allowed: false, step: session.first_pending_step, requested, reason: "premature-step" };
}

export function nextStep(current) {
  const index = SAVVY_FLOW.indexOf(current);
  if (index < 0) return "1";
  return SAVVY_FLOW[Math.min(index + 1, SAVVY_FLOW.length - 1)];
}

export function previousStep(current) {
  const index = SAVVY_FLOW.indexOf(current);
  if (index < 0) return "1";
  return SAVVY_FLOW[Math.max(index - 1, 0)];
}

export function structuredState({ mounted, step, guardAllowed = null, noticePresent = false, requestedStep = null }) {
  const selected = mounted ? SCREEN_REGISTRY[step] : null;
  if (mounted && !selected) throw new TypeError(`unknown step: ${step}`);
  return {
    rendered_child_id: selected?.rendered_child_id ?? null,
    interaction_ports: selected?.interaction_ports ?? [],
    guard_allowed: guardAllowed,
    notice_present: noticePresent,
    requested_step: requestedStep,
    committed_step: step,
    route_tree_state: mounted ? "mounted" : "unmounted",
  };
}

function screen(renderedChildId, interactionPorts) {
  return Object.freeze({ rendered_child_id: renderedChildId, interaction_ports: Object.freeze(interactionPorts) });
}
