import assert from "node:assert/strict";
import test from "node:test";

import {
  admitCapabilityCatalog,
  sealCapabilityCatalog,
} from "../index.mjs";

function route(id, value, dominates = []) {
  return {
    route_id: id,
    label: id.toUpperCase(),
    capability_ref: `capability:${id}`,
    mode: "execute",
    required: [{key: "work_kind", operator: "equals", value}],
    exclusions: [],
    required_inputs: ["intent"],
    dominates,
    owner_ref: `owner:${id}`,
    contract_refs: [`contract:${id}`],
    forbidden_effects: ["approval", "dispatch"],
  };
}

function catalog() {
  return {
    schema_version: "intent-route.catalog@1",
    catalog_id: "catalog-001",
    catalog_version: "1.0.0",
    owner_ref: "owner:catalog",
    effective_state: {status: "effective", revision: "rev-1"},
    clarification_prompts: {
      work_kind: "What kind of work should be routed?",
    },
    routes: [route("define", "define"), route("research", "research")],
  };
}

test("a finite effective catalog seals, admits, and freezes", () => {
  const sealed = sealCapabilityCatalog(catalog());
  const result = admitCapabilityCatalog(sealed);
  assert.equal(result.ok, true);
  assert.equal(Object.isFrozen(result.value), true);
  assert.equal(result.value.routes[0].route_id, "define");
  assert.equal(result.digest, sealed.content_digest);
});

test("route and predicate permutations produce identical canonical bytes", () => {
  const left = catalog();
  const right = catalog();
  right.routes.reverse();
  for (const item of right.routes) {
    item.required_inputs.push("context");
    item.required_inputs.reverse();
  }
  for (const item of left.routes) item.required_inputs.push("context");
  const admittedLeft = admitCapabilityCatalog(sealCapabilityCatalog(left));
  const admittedRight = admitCapabilityCatalog(sealCapabilityCatalog(right));
  assert.equal(admittedLeft.ok, true);
  assert.equal(admittedRight.ok, true);
  assert.equal(admittedLeft.bytes, admittedRight.bytes);
});

test("digest mismatch and duplicate IDs fail closed", () => {
  const mismatch = sealCapabilityCatalog(catalog());
  mismatch.content_digest = "0".repeat(64);
  assert.deepEqual(admitCapabilityCatalog(mismatch).diagnostic.reason_codes, [
    "catalog.content_digest.mismatch",
  ]);

  const duplicate = catalog();
  duplicate.routes[1].route_id = "define";
  const result = admitCapabilityCatalog({...duplicate, content_digest: "0".repeat(64)});
  assert.equal(result.ok, false);
  assert.ok(result.diagnostic.reason_codes.includes("catalog.routes.duplicate-id"));
});

test("missing, unsupported, and stale effective states fail closed", () => {
  const missing = catalog();
  delete missing.effective_state;
  assert.ok(
    admitCapabilityCatalog({...missing, content_digest: "0".repeat(64)})
      .diagnostic.reason_codes.includes("catalog.effective_state.required"),
  );

  for (const status of ["draft", "stale"]) {
    const candidate = catalog();
    candidate.effective_state.status = status;
    assert.ok(
      admitCapabilityCatalog({...candidate, content_digest: "0".repeat(64)})
        .diagnostic.reason_codes.includes("catalog.effective_state.not-effective"),
    );
  }
});

test("unknown edges, cycles, self edges, and operators fail closed", () => {
  const unknown = catalog();
  unknown.routes[0].dominates = ["missing"];
  assert.ok(
    admitCapabilityCatalog({...unknown, content_digest: "0".repeat(64)})
      .diagnostic.reason_codes.includes("catalog.dominance.unknown:define->missing"),
  );

  const cyclic = catalog();
  cyclic.routes[0].dominates = ["research"];
  cyclic.routes[1].dominates = ["define"];
  assert.ok(
    admitCapabilityCatalog({...cyclic, content_digest: "0".repeat(64)})
      .diagnostic.reason_codes.some((code) => code.startsWith("catalog.dominance.cycle:")),
  );

  const self = catalog();
  self.routes[0].dominates = ["define"];
  assert.ok(
    admitCapabilityCatalog({...self, content_digest: "0".repeat(64)})
      .diagnostic.reason_codes.includes("catalog.dominance.self:define"),
  );

  const operator = catalog();
  operator.routes[0].required[0].operator = "similar-to";
  assert.ok(
    admitCapabilityCatalog({...operator, content_digest: "0".repeat(64)})
      .diagnostic.reason_codes.includes("catalog.routes[0].required[0].operator.unsupported"),
  );
});
