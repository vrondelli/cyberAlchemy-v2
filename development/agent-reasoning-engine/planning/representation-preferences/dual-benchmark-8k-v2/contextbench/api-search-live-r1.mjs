// Task-grounded identifier follow-through; accepts API spelling variants, not gold.
import {planSourceNeighborhood} from "./source-neighborhood-live-r1.mjs";

const parts = value => typeof value === "string" ? (value.match(/[\p{L}\p{N}]+/gu) ?? []).map(part => part.toLowerCase()).filter(part => part.length >= 6) : [];
const sourcePath = path => typeof path === "string" && !/(^|\/)(test|tests|fixtures)\//.test(path) && /\.(?:c|h|cc|hh|cpp|hpp|go|js|jsx|ts|tsx|rs|py)$/.test(path);
const underPrefix = (path, prefix) => path === prefix || path.startsWith(`${prefix}/`);

export function planApiSearchFollowThrough({args, result, objective, seenRegions, maximumPerSearch = 2}) {
  if (!(seenRegions instanceof Set) || !args || !result || result.ok !== true || args.revision !== "base") return [];
  const objectiveParts = new Set(parts(objective));
  if (!parts(args.query).some(part => objectiveParts.has(part))) return [];
  if (typeof args.path_prefix !== "string" || args.path_prefix === "." || !args.path_prefix.split("/").filter(Boolean).length || !Array.isArray(result.output?.observations)) return [];
  const seen = new Set(seenRegions), usedFiles = new Set([...seen].map(region => region.slice(0, region.lastIndexOf(":"))));
  const plans = [];
  for (const observation of result.output.observations) {
    if (!sourcePath(observation?.path) || !underPrefix(observation.path, args.path_prefix) || usedFiles.has(observation.path)) continue;
    const plan = planSourceNeighborhood(observation, seen);
    if (!plan) continue;
    plans.push(plan); seen.add(plan.region); usedFiles.add(observation.path);
    if (plans.length >= maximumPerSearch) break;
  }
  return plans;
}
