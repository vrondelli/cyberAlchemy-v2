import {canonicalModuleJson, sealModuleManifest} from "./index.mjs";

export const ROUTE_AVAILABILITY_INPUT_PROTOCOL = "are.route-availability-query/v1";
export const ROUTE_AVAILABILITY_OUTPUT_PROTOCOL = "are.route-availability-result/v1";

const ID = /^[a-z0-9](?:[-a-z0-9._/:]{0,126}[a-z0-9])?$/u;
const DECLARATION_KEYS = new Set(["route_id", "capability_id", "available", "reason_codes"]);
const OUTPUT_KEYS = new Set(["schema_version", "route_id", "available", "reason_codes", "authority_effect"]);

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value, keys) {
  return record(value) && Object.keys(value).every((key) => keys.has(key));
}

function validReasonCodes(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string" && item.length > 0)
    && new Set(value).size === value.length;
}

export function validateRouteAvailabilityOutput(value) {
  return exactKeys(value, OUTPUT_KEYS)
    && value.schema_version === ROUTE_AVAILABILITY_OUTPUT_PROTOCOL
    && typeof value.route_id === "string" && value.route_id.length > 0
    && typeof value.available === "boolean"
    && validReasonCodes(value.reason_codes)
    && (value.available ? value.reason_codes.length === 0 : value.reason_codes.length > 0)
    && value.authority_effect === "none";
}

export const routeAvailabilityOutputValidators = Object.freeze({
  [ROUTE_AVAILABILITY_OUTPUT_PROTOCOL]: validateRouteAvailabilityOutput,
});

export function createRouteAvailabilityAdapter({module_id, version, routes} = {}) {
  if (!ID.test(module_id ?? "") || typeof version !== "string" || version.length === 0 || !Array.isArray(routes) || routes.length === 0) {
    throw new TypeError("Route availability adapter configuration is invalid.");
  }
  const normalized = routes.map((route) => {
    if (!exactKeys(route, DECLARATION_KEYS)
      || typeof route.route_id !== "string" || route.route_id.length === 0
      || !ID.test(route.capability_id ?? "") || typeof route.available !== "boolean"
      || !validReasonCodes(route.reason_codes)
      || (route.available ? route.reason_codes.length !== 0 : route.reason_codes.length === 0)) {
      throw new TypeError("Route availability declaration is invalid.");
    }
    return JSON.parse(canonicalModuleJson({...route, reason_codes: [...route.reason_codes].sort()}));
  }).sort((left, right) => left.capability_id.localeCompare(right.capability_id));
  if (new Set(normalized.map((route) => route.capability_id)).size !== normalized.length
    || new Set(normalized.map((route) => route.route_id)).size !== normalized.length) {
    throw new TypeError("Route availability declaration is duplicated.");
  }
  const byCapability = new Map(normalized.map((route) => [route.capability_id, route]));
  const manifest = sealModuleManifest({
    schema_version: "are.module-manifest/v1",
    module_id,
    version,
    adapter_protocol: "are.module-adapter/v1",
    capabilities: normalized.map((route) => ({
      capability_id: route.capability_id,
      input_protocol: ROUTE_AVAILABILITY_INPUT_PROTOCOL,
      output_protocol: ROUTE_AVAILABILITY_OUTPUT_PROTOCOL,
    })),
    required_permissions: [],
    side_effects: false,
    authority_effect: "none",
  });
  return Object.freeze({
    manifest,
    invoke(invocation) {
      const route = byCapability.get(invocation.capability_id);
      if (!route || !exactKeys(invocation.input, new Set(["route_id"])) || invocation.input.route_id !== route.route_id) {
        throw new TypeError("Route availability invocation is invalid.");
      }
      return Object.freeze({
        schema_version: ROUTE_AVAILABILITY_OUTPUT_PROTOCOL,
        route_id: route.route_id,
        available: route.available,
        reason_codes: route.reason_codes,
        authority_effect: "none",
      });
    },
  });
}

export function queryRouteAvailability(modulePort, {route_id, capability_id, invocation_id, consumer_id = "request-decision-router"}) {
  return modulePort.invoke({
    schema_version: "are.module-invocation/v1",
    invocation_id,
    consumer_id,
    capability_id,
    input: {route_id},
    dependency_posture: "required-for-judgment",
    authority_effect: "none",
  });
}
