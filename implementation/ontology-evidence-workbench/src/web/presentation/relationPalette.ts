const PREDICATE_COLORS: Readonly<Record<string, string>> = {
  awards: "#f6c85f", becomes: "#b78cff", changes_state_of: "#9f86ff", consumes: "#39d6c5",
  contains: "#77bdfb", contests: "#ff7085", controls: "#ff9f43", defends: "#ff5f76",
  depends_on: "#4cc9f0", does_not_promote: "#f38ba8", exposes: "#2dd4bf", governed_by: "#fb923c",
  maps_to: "#4ade80", owns: "#fbbf24", participates_in: "#60a5fa", produces: "#34d399",
  projects: "#22d3ee", provides: "#38bdf8", reads: "#7dd3fc", records: "#c084fc",
  supports: "#818cf8", transitions_to: "#a78bfa", validates: "#e879f9",
};
const FALLBACKS = ["#5eead4", "#93c5fd", "#d8b4fe", "#fda4af", "#fde68a", "#86efac"];

function hash(value: string): number {
  let result = 2166136261;
  for (const character of value) result = Math.imul(result ^ character.charCodeAt(0), 16777619);
  return result >>> 0;
}

export function relationColor(predicate: string): string {
  return PREDICATE_COLORS[predicate] ?? FALLBACKS[hash(predicate) % FALLBACKS.length]!;
}

export function predicatePalette(predicates: readonly string[]) {
  return [...new Set(predicates)].sort().map((predicate) => ({ predicate, color: relationColor(predicate) }));
}
