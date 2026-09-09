export function routeCode() {
  // Highest-numbered revision wins for each component; later revisions supersede earlier ones.
  const routeRevisions = [];
  const regionRevisions = [];

  const pickHighest = (list) =>
    list.reduce((best, item) => (best === null || item.rev > best.rev ? item : best), null);

  const route = pickHighest(routeRevisions);
  const region = pickHighest(regionRevisions);

  if (route === null || region === null) return "UNKNOWN";
  return route.value + "/" + region.value;
}

export function stableLabel() { return "stable"; }
