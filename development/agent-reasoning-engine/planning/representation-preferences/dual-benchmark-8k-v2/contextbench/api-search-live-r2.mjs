// Gold-blind API follow-through for objective-grounded compound identifiers.
import {NEIGHBORHOOD_POLICY, planSourceNeighborhood} from "./source-neighborhood-live-r1.mjs";

const words = value => typeof value === "string" ? (value.match(/[\p{L}\p{N}]+/gu) ?? []).map(word => word.toLowerCase()) : [];
const sourcePath = path => typeof path === "string" && !/(^|\/)(test|tests|fixtures)\//.test(path) && /\.(?:c|h|cc|hh|cpp|hpp|go|js|jsx|ts|tsx|rs|py)$/.test(path);
const underPrefix = (path, prefix) => path === prefix || path.startsWith(`${prefix}/`);
const policy = Object.freeze({...NEIGHBORHOOD_POLICY, source_roots: Object.freeze([...NEIGHBORHOOD_POLICY.source_roots, "pkg"])});

export function planApiSearchFollowThroughR2({args, result, objective, seenRegions, maximumPerSearch = 2}) {
  if (!(seenRegions instanceof Set) || !args || !result || result.ok !== true || args.revision !== "base") return [];
  const objectiveWords = words(objective);
  const exact = new Set(objectiveWords.filter(word => word.length >= 6));
  const compact = objectiveWords.join("");
  if (!words(args.query).some(word => exact.has(word) || (word.length >= 8 && compact.includes(word)))) return [];
  if (typeof args.path_prefix !== "string" || args.path_prefix === "." || !args.path_prefix.split("/").filter(Boolean).length || !Array.isArray(result.output?.observations)) return [];
  const seen = new Set(seenRegions), usedFiles = new Set([...seen].map(region => region.slice(0, region.lastIndexOf(":"))));
  const plans = [];
  for (const observation of result.output.observations) {
    if (!sourcePath(observation?.path) || !underPrefix(observation.path, args.path_prefix) || usedFiles.has(observation.path)) continue;
    const plan = planSourceNeighborhood(observation, seen, policy);
    if (!plan) continue;
    plans.push(plan); seen.add(plan.region); usedFiles.add(observation.path);
    if (plans.length >= maximumPerSearch) break;
  }
  return plans;
}
