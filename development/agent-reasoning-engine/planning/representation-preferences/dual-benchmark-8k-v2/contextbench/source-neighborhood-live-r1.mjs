// Gold-blind, opt-in source acquisition. The caller must prove request delivery.
const sourcePath = (path, roots) => typeof path === "string" && path.split("/").some(part => roots.includes(part)) && /\.(?:c|h|cc|hh|cpp|hpp|go|java|js|jsx|ts|tsx|rs|py)$/.test(path);

export const NEIGHBORHOOD_POLICY = Object.freeze({radius: 16, maximum_reads: 6, maximum_bytes: 6144, source_roots: Object.freeze(["src", "lib", "internal"])});

export function planSourceNeighborhood(observation, seenRegions, policy = NEIGHBORHOOD_POLICY) {
  if (!(seenRegions instanceof Set) || !observation || observation.source_revision !== "base" || !sourcePath(observation.path, policy.source_roots ?? NEIGHBORHOOD_POLICY.source_roots)) return null;
  const {start_line, end_line, total_lines} = observation;
  if (![start_line, end_line, total_lines].every(Number.isSafeInteger) || start_line < 1 || end_line < start_line || total_lines < end_line) return null;
  if (seenRegions.size >= policy.maximum_reads) return null;
  const center = Math.floor((start_line + end_line) / 2);
  const region = `${observation.path}:${Math.floor((center - 1) / 64)}`;
  if (seenRegions.has(region)) return null;
  const start = Math.max(1, center - policy.radius);
  const end = Math.min(total_lines, center + policy.radius);
  if (start === start_line && end === end_line) return null;
  return Object.freeze({region, path: observation.path, args: Object.freeze({path: observation.path, revision: "base", start_line: start, line_count: end - start + 1})});
}
