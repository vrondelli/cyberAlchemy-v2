import {mkdirSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {attachImprovementFeedback, packageRoot, readProfileBytes, sha256} from "./common.mjs";

export function writeReport(result, path = null) {
  const stamp = new Date().toISOString().replaceAll(":", "-");
  const target = path ? resolve(path) : resolve(packageRoot, "runs", `${stamp}-${result.mode}.json`);
  mkdirSync(dirname(target), {recursive: true});
  writeFileSync(target, `${JSON.stringify(result, null, 2)}\n`);
  return target;
}

export function combineResults(profile, results) {
  const evaluable = results.filter((entry) => entry.status !== "NOT_EVALUATED");
  const status = results.some((entry) => entry.status === "FAIL") ? "FAIL" : evaluable.length === 0 ? "NOT_EVALUATED" : "PASS";
  const componentStatuses = Object.fromEntries(results.map((entry) => [entry.mode, entry.status]));
  return attachImprovementFeedback({schema_version: "are.real-reasoning-benchmark-result/v1", benchmark_id: profile.benchmark_id, profile_digest: sha256(readProfileBytes(profile)), mode: "all", status, environment: {node: process.version, platform: process.platform, arch: process.arch}, summary: {checks: Object.fromEntries(results.map((entry) => [`component:${entry.mode}`, entry.status !== "FAIL"])), component_statuses: componentStatuses}, metrics: {}, cases: [], components: results, authority_effect: "none", claim_limit: profile.claim_limit});
}
