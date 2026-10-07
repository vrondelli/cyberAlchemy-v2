// Gold-blind follow-through for issue terms absent from confirmed model-facing
// source reads. Search results are not model-facing; the episode must deliver
// and receipt-bind any planned read before using it as evidence.
import {distinctiveSearchQueries, planDistinctiveSourceReads} from "./distinctive-source-acquisition-r1.mjs";

const nonProductPath = path => typeof path !== "string" ||
  /(?:^|\/)(?:vendor|third[_-]party|external|deps|node_modules|gtest|googletest|gbenchmark|mocks?)(?:\/|$)/i.test(path) ||
  /(?:^|\/)[^/]*(?:_mock\.go|\.mock\.[cm]?[jt]sx?)$/i.test(path);

export function uncoveredRequirementQueries(problemStatement, deliveredReads) {
  if (typeof problemStatement !== "string" || !Array.isArray(deliveredReads)) return [];
  const covered = deliveredReads.map(read => typeof read?.body === "string" ? read.body.toLowerCase() : "").join("\n");
  return distinctiveSearchQueries(problemStatement, true).filter(query => !covered.includes(query.toLowerCase()));
}

export function planUncoveredRequirementReads(searches, seenRegions = new Set(), maximumReads = 2) {
  if (!Array.isArray(searches) || !(seenRegions instanceof Set) || !Number.isSafeInteger(maximumReads) || maximumReads < 1 || maximumReads > 2) return [];
  const candidates = searches.flatMap(({query, result}) => {
    if (typeof query !== "string" || result?.ok !== true || !Number.isSafeInteger(result.output?.total)) return [];
    const productObservations = result.output.observations?.filter(observation => !nonProductPath(observation?.path));
    const plans = planDistinctiveSourceReads({...result, output: {...result.output, observations: productObservations}}, seenRegions, 2, true);
    return plans.length ? [{query, total: result.output.total, plans}] : [];
  }).sort((a, b) => a.total - b.total || a.query.localeCompare(b.query));
  const selected = [], regions = new Set(seenRegions), paths = new Set();
  for (const candidate of candidates) {
    for (const plan of candidate.plans) {
      if (regions.has(plan.region) || paths.has(plan.args.path)) continue;
      selected.push({query: candidate.query, total: candidate.total, ...plan});
      regions.add(plan.region); paths.add(plan.args.path);
      if (selected.length >= maximumReads) return selected;
    }
  }
  return selected;
}
