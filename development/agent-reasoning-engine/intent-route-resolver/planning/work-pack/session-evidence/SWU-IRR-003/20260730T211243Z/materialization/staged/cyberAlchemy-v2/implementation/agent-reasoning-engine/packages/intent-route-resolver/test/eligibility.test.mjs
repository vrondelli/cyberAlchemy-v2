import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateEligibility,
} from "../index.mjs";

function field(value, posture = "declared") {
  return {
    posture,
    value: posture === "unresolved" ? null : value,
    evidence_refs: posture === "unresolved" ? [] : ["fixture"],
    inference_note: null,
  };
}

function route(id, required = [], exclusions = [], dominates = []) {
  return {
    route_id: id,
    required,
    exclusions,
    dominates,
  };
}

function evaluate(routes, discriminators) {
  return evaluateEligibility(
    {intent: {discriminators}},
    {routes},
  );
}

test("explicit exclusions take precedence over satisfied requirements", () => {
  const result = evaluate(
    [
      route(
        "define",
        [{key: "work_kind", operator: "equals", value: "define"}],
        [{key: "protected", operator: "equals", value: true}],
      ),
    ],
    {work_kind: field("define"), protected: field(true)},
  );
  assert.equal(result.evaluated_routes[0].posture, "rejected");
  assert.deepEqual(result.evaluated_routes[0].reason_codes, ["route.explicit-exclusion"]);
});

test("unresolved requirements and exclusions remain conditional", () => {
  const result = evaluate(
    [
      route(
        "define",
        [{key: "scope_known", operator: "equals", value: true}],
        [{key: "protected", operator: "equals", value: true}],
      ),
    ],
    {
      scope_known: field(null, "unresolved"),
      protected: field(null, "unresolved"),
    },
  );
  assert.deepEqual(result.conditional_route_ids, ["define"]);
  assert.deepEqual(result.material_missing_discriminators, ["protected", "scope_known"]);
});

test("empty predicates produce an eligible route", () => {
  const result = evaluate([route("fallback")], {});
  assert.deepEqual(result.eligible_route_ids, ["fallback"]);
  assert.deepEqual(result.non_dominated_route_ids, ["fallback"]);
});

test("only eligible routes participate in transitive dominance", () => {
  const routes = [
    route("a", [], [], ["b"]),
    route("b", [], [], ["c"]),
    route("c"),
    route("rejected", [{key: "kind", operator: "equals", value: "other"}], [], ["a"]),
  ];
  const result = evaluate(routes, {kind: field("current")});
  assert.deepEqual(result.eligible_route_ids, ["a", "b", "c"]);
  assert.deepEqual(result.non_dominated_route_ids, ["a"]);
});

test("catalog permutation cannot change traces or reduced sets", () => {
  const routes = [
    route("a", [{key: "kind", operator: "equals", value: "x"}], [], ["b"]),
    route("b", [{key: "kind", operator: "equals", value: "x"}]),
  ];
  const left = evaluate(routes, {kind: field("x")});
  const right = evaluate([...routes].reverse(), {kind: field("x")});
  assert.deepEqual(left, right);
});
