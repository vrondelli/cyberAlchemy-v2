import {
  canonicalJson,
  canonicalizeJson,
  deepFreeze,
} from "./canonical-json.mjs";

function equalJson(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

export function evaluatePredicate(discriminators, predicate) {
  const field = discriminators[predicate.key];
  if (!field || field.posture === "unresolved") {
    return deepFreeze({
      key: predicate.key,
      operator: predicate.operator,
      result: "unresolved",
    });
  }

  let matches = false;
  if (predicate.operator === "equals") matches = equalJson(field.value, predicate.value);
  else if (predicate.operator === "one-of") {
    matches = predicate.value.some((candidate) => equalJson(field.value, candidate));
  } else if (predicate.operator === "present") matches = field.value !== null;
  else if (predicate.operator === "absent") matches = field.value === null;

  return deepFreeze({
    key: predicate.key,
    operator: predicate.operator,
    result: matches ? "match" : "mismatch",
  });
}

function traceRoute(discriminators, route) {
  const exclusionChecks = route.exclusions.map((predicate) => (
    evaluatePredicate(discriminators, predicate)
  ));
  const requirementChecks = route.required.map((predicate) => (
    evaluatePredicate(discriminators, predicate)
  ));
  const exclusionMatched = exclusionChecks.some((check) => check.result === "match");
  const requirementMismatched = requirementChecks.some((check) => check.result === "mismatch");
  const unresolvedChecks = [...exclusionChecks, ...requirementChecks]
    .filter((check) => check.result === "unresolved");
  const materialMissing = [...new Set(unresolvedChecks.map((check) => check.key))].sort();

  let posture = "eligible";
  const reasonCodes = [];
  if (exclusionMatched) {
    posture = "rejected";
    reasonCodes.push("route.explicit-exclusion");
  } else if (requirementMismatched) {
    posture = "rejected";
    reasonCodes.push("route.required-predicate-mismatch");
  } else if (materialMissing.length > 0) {
    posture = "conditional";
    reasonCodes.push("route.material-discriminator-unresolved");
  } else {
    reasonCodes.push("route.all-predicates-satisfied");
  }

  return canonicalizeJson({
    route_id: route.route_id,
    posture,
    exclusion_checks: exclusionChecks,
    requirement_checks: requirementChecks,
    material_missing_discriminators: materialMissing,
    reason_codes: reasonCodes,
  });
}

function reachableEligible(startId, byId, eligibleIds) {
  const reached = new Set();
  const stack = [...(byId.get(startId)?.dominates ?? [])];
  while (stack.length > 0) {
    const current = stack.pop();
    if (reached.has(current)) continue;
    reached.add(current);
    for (const child of byId.get(current)?.dominates ?? []) stack.push(child);
  }
  return new Set([...reached].filter((routeId) => eligibleIds.has(routeId)));
}

export function evaluateEligibility(request, catalog) {
  const traces = catalog.routes
    .map((route) => traceRoute(request.intent.discriminators, route))
    .sort((left, right) => left.route_id.localeCompare(right.route_id));
  const eligibleIds = new Set(
    traces.filter((trace) => trace.posture === "eligible").map((trace) => trace.route_id),
  );
  const conditionalIds = traces
    .filter((trace) => trace.posture === "conditional")
    .map((trace) => trace.route_id)
    .sort();
  const byId = new Map(catalog.routes.map((route) => [route.route_id, route]));
  const dominated = new Set();
  for (const routeId of [...eligibleIds].sort()) {
    for (const target of reachableEligible(routeId, byId, eligibleIds)) dominated.add(target);
  }
  const nonDominated = [...eligibleIds].filter((routeId) => !dominated.has(routeId)).sort();
  const materialMissing = [...new Set(
    traces
      .filter((trace) => trace.posture === "conditional")
      .flatMap((trace) => trace.material_missing_discriminators),
  )].sort();

  return deepFreeze(canonicalizeJson({
    evaluated_routes: traces,
    eligible_route_ids: [...eligibleIds].sort(),
    conditional_route_ids: conditionalIds,
    non_dominated_route_ids: nonDominated,
    material_missing_discriminators: materialMissing,
  }));
}
