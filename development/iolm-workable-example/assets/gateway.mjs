import {
  validateBindingContract,
  validatePinnedBundle,
} from "./binding-guard.mjs";

export const BINDING_ROUTE = "/contracts/source-binding.v1.json";

async function fetchJsonArtifact(fetchImpl, route) {
  const response = await fetchImpl(route, {
    method: "GET",
    cache: "no-store",
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  if (!response?.ok) {
    throw new Error(`FIXTURE_FETCH_FAILED: ${route} returned ${response?.status ?? "no response"}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  let json;
  try {
    json = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch (error) {
    throw new Error(`FIXTURE_JSON_INVALID: ${route}: ${error.message}`);
  }
  return Object.freeze({ route, bytes, json });
}

export async function loadPinnedMintedFixture({ fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== "function") {
    throw new TypeError("A fetch implementation is required.");
  }
  const bindingArtifact = await fetchJsonArtifact(fetchImpl, BINDING_ROUTE);
  const binding = validateBindingContract(bindingArtifact.json);
  const artifacts = {};
  for (const [role, entry] of Object.entries(binding.inputs)) {
    artifacts[role] = await fetchJsonArtifact(fetchImpl, entry.route);
  }
  return validatePinnedBundle(binding, artifacts);
}
