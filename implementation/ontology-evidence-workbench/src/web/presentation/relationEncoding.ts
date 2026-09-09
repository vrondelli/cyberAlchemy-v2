import type { RelationFamily } from "../contracts/relation";

const FAMILY_BY_PREDICATE: Readonly<Record<string, RelationFamily>> = {
  owns: "authority", controls: "authority", governed_by: "authority", does_not_promote: "authority",
  depends_on: "dependency", supports: "dependency", provides: "dependency", reads: "dependency",
  consumes: "flow", produces: "flow", maps_to: "flow", projects: "flow", exposes: "flow",
  contains: "membership", participates_in: "membership",
  records: "evidence", validates: "evidence",
  becomes: "state", changes_state_of: "state", transitions_to: "state",
  contests: "competition", defends: "competition", awards: "competition",
};

export function normalizePredicate(value: string | undefined): string {
  const normalized = value?.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return normalized || "unknown_relation";
}

export function relationFamily(predicate: string): RelationFamily {
  return FAMILY_BY_PREDICATE[predicate] ?? "other";
}

export function predicateLabel(predicate: string): string {
  return predicate.replaceAll("_", " ");
}

export function relationSentence(source: string, predicate: string, target: string): string {
  return `${source} ${predicateLabel(predicate)} ${target}`;
}
