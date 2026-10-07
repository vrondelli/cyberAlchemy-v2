// Gold-blind, task-grounded search follow-through with file diversity.
import {planSourceNeighborhood} from "./source-neighborhood-live-r1.mjs";

const implementationPath = path => typeof path === "string" && !/(^|\/)(test|tests|fixtures)\//.test(path) && /\.(?:c|cc|cpp|go|js|jsx|ts|tsx|rs|py)$/.test(path);
const tokens = text => new Set((text.toLowerCase().match(/[\p{L}\p{N}_]+/gu) ?? []).filter(token => token.length >= 4));

export function planObjectiveSearchFollowThrough({args, result, objective, seenRegions, maximumPerSearch = 2}) {
  if (!(seenRegions instanceof Set) || !args || !result || result.ok !== true || typeof objective !== "string" || args.revision !== "base") return [];
  if (typeof args.query !== "string" || !/^[\p{L}\p{N}_]{4,64}$/u.test(args.query) || !tokens(objective).has(args.query.toLowerCase())) return [];
  if (typeof args.path_prefix !== "string" || args.path_prefix.split("/").filter(Boolean).length < 2 || !Array.isArray(result.output?.observations)) return [];
  const seen = new Set(seenRegions), usedFiles = new Set([...seen].map(region => region.slice(0, region.lastIndexOf(":"))));
  const plans = [];
  for (const observation of result.output.observations) {
    if (!implementationPath(observation?.path) || !observation.path.startsWith(args.path_prefix) || usedFiles.has(observation.path)) continue;
    const plan = planSourceNeighborhood(observation, seen);
    if (!plan) continue;
    plans.push(plan); seen.add(plan.region); usedFiles.add(observation.path);
    if (plans.length >= maximumPerSearch) break;
  }
  return plans;
}
