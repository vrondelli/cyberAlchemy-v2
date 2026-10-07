// Gold-blind, bounded source acquisition from distinctive issue identifiers.
// Search observations are hints; only confirmed read_file outputs may enter a
// model request. The caller owns receipt delivery and the model-call budget.
import {NEIGHBORHOOD_POLICY, planSourceNeighborhood} from "./source-neighborhood-live-r1.mjs";
import {stripIssueTemplateNoise} from "./intent-anchor-convergence-r3.mjs";

const GENERIC = new Set(["about", "after", "before", "change", "command", "error", "fails", "failure", "following", "improve", "issue", "message", "parsing", "source", "support", "there", "these", "update", "using", "would"]);
const sourcePath = path => typeof path === "string" && !/(^|\/)(?:documentation|docs|test|tests|fixtures|samples)\//i.test(path) && !/(?:_test\.[^.]+|\.(?:test|spec)\.[^.]+|\.d\.ts)$/.test(path) && /\.(?:c|h|cc|hh|cpp|hpp|go|java|js|jsx|ts|tsx|rs|py)$/.test(path);
const sourcePriority = path => /^(?:src|lib|internal|pkg)\//.test(path) ? 0 : /^(?:packages|apps)\/[^/]+\/(?:src|lib|internal|pkg)\//.test(path) ? 1 : /(?:^|\/)src\//.test(path) ? 2 : 3;
const policy = Object.freeze({...NEIGHBORHOOD_POLICY, source_roots: Object.freeze([...NEIGHBORHOOD_POLICY.source_roots, "pkg"])});

export function distinctiveSearchQueries(problemStatement, enhancedIdentifiers = false) {
  const clean = stripIssueTemplateNoise(problemStatement).slice(0, 1800);
  const title = clean.split(/\r?\n/).find(line => line.trim()) ?? "";
  const code = [...clean.matchAll(/`([^`\n]{3,100})`/g)].map(match => match[1]).find(value => /[a-z][a-z0-9]*(?:-[a-z0-9]+)+/i.test(value));
  const compound = (code ?? title).match(/[a-z][a-z0-9]*(?:-[a-z0-9]+)+/i)?.[0] ?? null;
  const flag = title.match(/`(--[a-z][a-z0-9-]{1,})`/i)?.[1] ?? null;
  const acronym = title.match(/\b[A-Z]{2,6}\b/g)?.[0] ?? null;
  const tag = title.match(/<([a-z][a-z0-9-]{2,})\b[^>]*>/i)?.[1] ?? null;
  const words = (title.match(/[a-z][a-z0-9_]{5,}/gi) ?? []).filter(word => !GENERIC.has(word.toLowerCase()));
  const component = compound?.split("-").find(word => word.length >= 3 && !["non", "type", "with", "from"].includes(word.toLowerCase())) ?? null;
  const values = code ? [compound, component && component[0].toUpperCase() + component.slice(1), component, ...words] : enhancedIdentifiers ? [acronym, tag, flag, compound, ...words, component && component[0].toUpperCase() + component.slice(1)] : [compound, ...words, component && component[0].toUpperCase() + component.slice(1)];
  return Object.freeze([...new Set(values.filter(value => typeof value === "string" && value.length >= 3 && value.length <= 64))].slice(0, 3));
}

export function inferSourcePrefix(searchResult) {
  if (searchResult?.ok !== true || !Array.isArray(searchResult.output?.observations)) return "";
  for (const observation of searchResult.output.observations) {
    const path = observation?.path;
    if (typeof path !== "string") continue;
    const match = path.match(/^(.+)\/(?:test|tests)\//);
    if (match && match[1].split("/").length >= 2) return `${match[1]}/src`;
  }
  return "";
}

export function planDistinctiveSourceReads(searchResult, seenRegions = new Set(), maximumReads = 2, prioritizeCoreSource = false) {
  if (searchResult?.ok !== true || !Array.isArray(searchResult.output?.observations) || !(seenRegions instanceof Set) || !Number.isSafeInteger(maximumReads) || maximumReads < 1 || maximumReads > 2) return [];
  if (typeof prioritizeCoreSource !== "boolean") return [];
  const seen = new Set(seenRegions), files = new Set(), plans = [];
  const observations = prioritizeCoreSource ? [...searchResult.output.observations].sort((left, right) => sourcePriority(left?.path) - sourcePriority(right?.path)) : searchResult.output.observations;
  for (const observation of observations) {
    if (!sourcePath(observation?.path) || files.has(observation.path)) continue;
    const plan = planSourceNeighborhood(observation, seen, policy);
    if (!plan) continue;
    plans.push(plan); seen.add(plan.region); files.add(observation.path);
    if (plans.length >= maximumReads) break;
  }
  return plans;
}
