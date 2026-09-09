// routeCode composes the route and region components as "<route>/<region>",
// selecting the highest-numbered revision independently for each component.
// Entries are populated from the supplied notes; later revisions supersede
// earlier ones for the same component.
const REVISIONS = {
  route: new Map(),
  region: new Map(),
};

export function latestComponent(kind) {
  const entries = REVISIONS[kind];
  let bestRev = -Infinity;
  let bestValue = null;
  for (const [rev, value] of entries) {
    if (rev > bestRev) {
      bestRev = rev;
      bestValue = value;
    }
  }
  return bestValue;
}

export function routeCode() {
  const route = latestComponent("route");
  const region = latestComponent("region");
  if (route === null || region === null) {
    return "UNKNOWN";
  }
  return route + "/" + region;
}

export function stableLabel() {
  return "stable";
}
