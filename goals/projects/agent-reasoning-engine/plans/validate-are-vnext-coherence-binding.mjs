import { createHash } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = resolve(dirname(scriptPath), "../../../..");
const bindingPath = resolve(dirname(scriptPath), "ARE-VNEXT-COHERENCE-CONSTRUCTION-BINDING.v1-candidate.json");
const binding = JSON.parse(readFileSync(bindingPath, "utf8"));
const errors = [];
const requiredStages = [
  "prototype-definitions",
  "ontology-scaffold",
  "product-capability-and-capability-local-business-prototypes",
  "domainspec-authored-source",
  "deterministic-graph-and-system-ontology",
  "implementation-prototype",
  "testable-candidate",
  "product-tests",
  "product-approval",
  "authority-decisions"
];

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const stages = new Map(binding.stages.map((stage) => [stage.stage, stage]));
for (const stage of requiredStages) {
  if (!stages.has(stage)) errors.push(`missing stage: ${stage}`);
}
for (const stage of binding.stages) {
  for (const artifact of stage.artifacts ?? []) {
    const target = resolve(repositoryRoot, artifact.path);
    let canonical;
    try {
      canonical = realpathSync(target);
    } catch {
      errors.push(`missing artifact: ${artifact.path}`);
      continue;
    }
    if (!(canonical === repositoryRoot || canonical.startsWith(`${repositoryRoot}/`))) {
      errors.push(`artifact escapes repository: ${artifact.path}`);
      continue;
    }
    const actual = digest(readFileSync(canonical));
    if (actual !== artifact.sha256) errors.push(`digest drift: ${artifact.path}`);
  }
}
if (binding.binding_posture !== "project-local-candidate-exact-byte-binding-not-accepted") errors.push("binding posture grants too much authority");
if (binding.registration?.status !== "unregistered") errors.push("binding must remain unregistered");
if (binding.authority_effect !== "none") errors.push("binding must have authority_effect=none");
if (stages.get("product-approval")?.status !== "absent") errors.push("product approval must remain absent");
if (stages.get("authority-decisions")?.status !== "absent") errors.push("authority decisions must remain absent");
const registry = readFileSync(resolve(repositoryRoot, binding.registration.registry_path), "utf8");
if (registry.includes(binding.binding_id)) errors.push("candidate unexpectedly appears in the construction registry");
const project = readFileSync(resolve(repositoryRoot, "goals/projects/agent-reasoning-engine/project.json"), "utf8");
if (project.includes(binding.binding_id)) errors.push("candidate unexpectedly appears in the project binding refs");

const result = {
  schema_version: "cav2-d65-construction-binding-validation/v1",
  binding_id: binding.binding_id,
  artifact_count: binding.stages.reduce((count, stage) => count + (stage.artifacts?.length ?? 0), 0),
  errors,
  status: errors.length === 0 ? "PASS" : "BLOCK",
  authority_effect: "none"
};
console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exitCode = 1;
