export function routeCode() {
  // Highest-numbered revision of each component from the supplied notes;
  // later revisions supersede earlier ones.
  const route = "R2"; // superseded: R1
  const region = "REG2"; // superseded: REG1
  return route + "/" + region;
}
export function stableLabel() { return "stable"; }
