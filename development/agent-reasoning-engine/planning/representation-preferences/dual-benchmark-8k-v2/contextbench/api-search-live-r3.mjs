// Gold-blind source follow-through with bounded pagination for file diversity.
import {NEIGHBORHOOD_POLICY, planSourceNeighborhood} from "./source-neighborhood-live-r1.mjs";

const words = value => typeof value === "string" ? (value.match(/[\p{L}\p{N}]+/gu) ?? []).map(word => word.toLowerCase()) : [];
const testPath = path => /(^|\/)(test|tests|fixtures)\//i.test(path) || /(?:_test\.[^.]+|\.(?:test|spec)\.[^.]+)$/.test(path);
const sourcePath = path => typeof path === "string" && !testPath(path) && /\.(?:c|h|cc|hh|cpp|hpp|go|js|jsx|ts|tsx|rs|py)$/.test(path);
const underPrefix = (path, prefix) => path === prefix || path.startsWith(`${prefix}/`);
const policy = Object.freeze({...NEIGHBORHOOD_POLICY, source_roots: Object.freeze([...NEIGHBORHOOD_POLICY.source_roots, "pkg"])});

export function eligibleApiSearchR3({args, result, objective}) {
  if (!args || !result || result.ok !== true || args.revision !== "base" || typeof args.path_prefix !== "string" || args.path_prefix === "." || !args.path_prefix.split("/").filter(Boolean).length || !Array.isArray(result.output?.observations)) return false;
  const objectiveWords = words(objective), exact = new Set(objectiveWords.filter(word => word.length >= 6)), compact = objectiveWords.join("");
  return words(args.query).some(word => exact.has(word) || (word.length >= 8 && compact.includes(word)));
}

export function planApiSearchFollowThroughR3({args, results, objective, seenRegions, maximumPerSearch = 2}) {
  if (!(seenRegions instanceof Set) || !Array.isArray(results) || !results.length || !eligibleApiSearchR3({args, result: results[0], objective})) return [];
  const seen = new Set(seenRegions), usedFiles = new Set([...seen].map(region => region.slice(0, region.lastIndexOf(":"))));
  const plans = [];
  for (const result of results) {
    if (result?.ok !== true || !Array.isArray(result.output?.observations)) continue;
    for (const observation of result.output.observations) {
      if (!sourcePath(observation?.path) || !underPrefix(observation.path, args.path_prefix) || usedFiles.has(observation.path)) continue;
      const plan = planSourceNeighborhood(observation, seen, policy);
      if (!plan) continue;
      plans.push(plan); seen.add(plan.region); usedFiles.add(observation.path);
      if (plans.length >= maximumPerSearch) return plans;
    }
  }
  return plans;
}

export function nextApiSearchPageR3({args, result, visitedOffsets, pageCount, maximumPages = 2}) {
  if (!result || result.ok !== true || !Number.isSafeInteger(result.output?.next_offset) || !Number.isSafeInteger(pageCount) || pageCount >= maximumPages || !(visitedOffsets instanceof Set)) return null;
  const offset = result.output.next_offset;
  if (offset <= args.offset || visitedOffsets.has(offset)) return null;
  return Object.freeze({...args, offset, limit: Math.min(20, Math.max(1, args.limit))});
}
