import assert from "node:assert/strict";
import test from "node:test";

import {createModulePort} from "../index.mjs";
import {
  createRouteAvailabilityAdapter,
  queryRouteAvailability,
  routeAvailabilityOutputValidators,
} from "../route-availability.mjs";

const capabilityId = "route.available/define/v1";

function configured(available = true, reason_codes = []) {
  return createRouteAvailabilityAdapter({
    module_id: "define-route-availability",
    version: "1-candidate",
    routes: [{route_id: "CA2-ROUTE-DEFINE", capability_id: capabilityId, available, reason_codes}],
  });
}

test("route availability adapter returns a sealed exact-route receipt", () => {
  const port = createModulePort({adapters: [configured()], output_validators: routeAvailabilityOutputValidators});
  const result = queryRouteAvailability(port, {
    route_id: "CA2-ROUTE-DEFINE",
    capability_id: capabilityId,
    invocation_id: "route-availability:test:define",
  });
  assert.equal(result.disposition, "available");
  assert.deepEqual(result.value, {
    schema_version: "are.route-availability-result/v1",
    route_id: "CA2-ROUTE-DEFINE",
    available: true,
    reason_codes: [],
    authority_effect: "none",
  });
  assert.equal(result.receipt.module_id, "define-route-availability");
  assert.match(result.receipt.receipt_digest, /^[a-f0-9]{64}$/u);
});

test("negative availability is an available judgment with explicit reasons", () => {
  const port = createModulePort({
    adapters: [configured(false, ["define.module-not-configured"])],
    output_validators: routeAvailabilityOutputValidators,
  });
  const result = queryRouteAvailability(port, {
    route_id: "CA2-ROUTE-DEFINE",
    capability_id: capabilityId,
    invocation_id: "route-availability:test:negative",
  });
  assert.equal(result.disposition, "available");
  assert.equal(result.value.available, false);
  assert.deepEqual(result.value.reason_codes, ["define.module-not-configured"]);
});

test("route declarations are closed, unique, and identity-bound", () => {
  const adapter = configured();
  const port = createModulePort({adapters: [adapter], output_validators: routeAvailabilityOutputValidators});
  const mismatched = queryRouteAvailability(port, {
    route_id: "CA2-ROUTE-PLAN",
    capability_id: capabilityId,
    invocation_id: "route-availability:test:mismatch",
  });
  assert.equal(mismatched.disposition, "blocked");
  assert.deepEqual(mismatched.reason_codes, ["module.invoke-failed"]);

  assert.throws(() => createRouteAvailabilityAdapter({
    module_id: "duplicated-route",
    version: "1-candidate",
    routes: [
      {route_id: "CA2-ROUTE-DEFINE", capability_id: "route.available/one/v1", available: true, reason_codes: []},
      {route_id: "CA2-ROUTE-DEFINE", capability_id: "route.available/two/v1", available: true, reason_codes: []},
    ],
  }), /duplicated/u);
  assert.throws(() => createModulePort({
    adapters: [configured(), createRouteAvailabilityAdapter({
      module_id: "ambiguous-provider",
      version: "1-candidate",
      routes: [{route_id: "CA2-ROUTE-DEFINE", capability_id: capabilityId, available: true, reason_codes: []}],
    })],
    output_validators: routeAvailabilityOutputValidators,
  }), /ambiguous/u);
});
