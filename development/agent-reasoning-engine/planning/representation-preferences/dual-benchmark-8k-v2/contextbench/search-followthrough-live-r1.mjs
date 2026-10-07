// Gold-blind bridge from model-requested search hits to bounded base-source reads.
import {planSourceNeighborhood} from "./source-neighborhood-live-r1.mjs";

const implementationPath = path => typeof path === "string" && !/(^|\/)(test|tests|fixtures)\//.test(path) && /\.(?:c|cc|cpp|go|js|jsx|ts|tsx|rs|py)$/.test(path);
const symbolQuery = query => typeof query === "string" && query.length >= 6 && query.length <= 128 && !/\s/.test(query) && (/[a-z][A-Z]/.test(query) || query.includes("_"));

export function planSearchFollowThrough({args, result, seenRegions, maximumPerSearch = 2}) {
  if (!(seenRegions instanceof Set) || !args || !result || result.ok !== true || !symbolQuery(args.query) || args.revision !== "base") return [];
  if (typeof args.path_prefix !== "string" || args.path_prefix.split("/").filter(Boolean).length < 2 || !Array.isArray(result.output?.observations)) return [];
  const seen = new Set(seenRegions), plans = [];
  for (const observation of result.output.observations) {
    if (!implementationPath(observation?.path) || !observation.path.startsWith(args.path_prefix)) continue;
    const plan = planSourceNeighborhood(observation, seen);
    if (!plan) continue;
    plans.push(plan); seen.add(plan.region);
    if (plans.length >= maximumPerSearch) break;
  }
  return plans;
}
