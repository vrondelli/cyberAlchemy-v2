// Re-freeze one exposed source-only task against a new immutable source snapshot.
// Diagnostic only: this does not score or create a prospective cohort.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {basename, join, resolve} from "node:path";

const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => { if (!value) throw new Error(`g01-diagnostic.${reason}`); };
const save = (path, value) => {
  const bytes = Buffer.from(JSON.stringify(value, null, 2) + "\n");
  writeFileSync(path, bytes, {flag: "wx", mode: 0o600});
  return hash(bytes);
};

export function prepareDiagnostic({previousFreezePath, sourceRoot, outputRoot, arm = "intent-anchor-terminal-shortlist-distinctive-r1", transportReliability}) {
  need([previousFreezePath, sourceRoot, outputRoot].every(path => typeof path === "string" && path.startsWith("/") && resolve(path) === path), "absolute-paths");
  need(!existsSync(outputRoot) && ["intent-anchor-convergence-r3", "intent-anchor-terminal-shortlist-distinctive-r1", "intent-anchor-terminal-shortlist-distinctive-early-r1", "intent-anchor-terminal-shortlist-distinctive-conditional-r1", "intent-anchor-terminal-shortlist-distinctive-identifier-r1", "intent-anchor-terminal-shortlist-distinctive-reasoning-view-r1", "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1"].includes(arm), "fresh-root-and-arm");
  need(transportReliability === undefined || transportReliability === "bounded-view-and-output-cap-r1", "transport-reliability");
  need(!transportReliability || arm !== "intent-anchor-terminal-shortlist-distinctive-reasoning-view-r1", "incompatible-reasoning-policies");
  const previous = JSON.parse(readFileSync(previousFreezePath));
  need(previous.schema_version === "are.g01-fast-live-freeze/v1" && previous.candidate_view_path === null, "previous-freeze");
  const sourceMarker = previous.sources[0].path.indexOf("/development/");
  need(sourceMarker > 0, "previous-source-root");
  const priorSourceRoot = previous.sources[0].path.slice(0, sourceMarker);
  need(basename(priorSourceRoot) !== basename(sourceRoot), "new-source-snapshot");
  const sources = previous.sources.map(binding => {
    const relative = binding.path.startsWith(priorSourceRoot + "/") ? binding.path.slice(priorSourceRoot.length + 1) : null;
    const path = relative ? join(sourceRoot, relative) : binding.path;
    return {path, sha256: hash(readFileSync(path))};
  });
  const helper = join(sourceRoot, "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/distinctive-source-acquisition-r1.mjs");
  if (!sources.some(binding => binding.path === helper)) sources.splice(sources.length - 1, 0, {path: helper, sha256: hash(readFileSync(helper))});
  const archiveView = join(sourceRoot, "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked-source-hints-views-r1.mjs");
  if (!sources.some(binding => binding.path === archiveView)) sources.splice(sources.length - 1, 0, {path: archiveView, sha256: hash(readFileSync(archiveView))});
  const config = JSON.parse(readFileSync(previous.config_path));
  if (transportReliability) config.transport_reliability = transportReliability;
  need(config.tasks?.length === 1 && config.tasks[0].task_sha256 === previous.task_sha256 && sources.at(-1).sha256 === previous.task_sha256, "source-only-task");
  config.experiment_id = `g01-distinctive-exposed-${basename(outputRoot)}-r1`;
  mkdirSync(outputRoot, {recursive: false, mode: 0o700});
  const configPath = join(outputRoot, "CONFIG.json"), configSha256 = save(configPath, config);
  const freezePath = join(outputRoot, "CANDIDATE-FREEZE.json");
  const freezeSha256 = save(freezePath, {...previous, config_path: configPath, config_sha256: configSha256, sources, arm,
    ...(transportReliability ? {transport_reliability: transportReliability} : {}),
    output_root: join(outputRoot, "candidate"), claim_ceiling: "Exposed-task mechanism diagnostic only; no prospective benchmark or ARE-vs-control proof.",
    open_questions: ["Does the source-only Svelte case become scoreable with receipt-delivered distinctive acquisition?"]});
  return {freeze_path: freezePath, freeze_sha256: freezeSha256};
}

if (process.argv[1] === import.meta.filename) {
  const [previousFreezePath, sourceRoot, outputRoot, arm, transportReliability] = process.argv.slice(2);
  console.log(JSON.stringify(prepareDiagnostic({previousFreezePath, sourceRoot, outputRoot, arm, transportReliability})));
}
