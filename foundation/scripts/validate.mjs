import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cav2Root = resolve(packageRoot, "..");
const projectsRoot = resolve(cav2Root, "..", "..");

const readJson = async (name) => JSON.parse(await readFile(join(packageRoot, name), "utf8"));
const sha256File = async (path) => createHash("sha256").update(await readFile(path)).digest("hex");

const profile = await readJson("profile.json");
const sources = await readJson("sources.json");
const definitions = await readJson("definitions/candidate-pack.json");
const artifactTypes = await readJson("artifact-types.json");
const relations = await readJson("identity-relations.json");
const candidate = await readJson("candidate.json");
const composition = await readJson("composition.json");

const failures = [];
const checkedSources = [];
for (const source of sources.definitions) {
  const path = join(projectsRoot, source.repository, source.path);
  let actual = null;
  try { actual = await sha256File(path); } catch { /* reported below */ }
  checkedSources.push({ term: source.term, expected: source.sha256, actual, current: actual === source.sha256 });
  if (actual !== source.sha256) failures.push(`source drift: ${source.term}`);
}
for (const binding of sources.local_bindings) {
  const path = join(cav2Root, binding.path);
  let actual = null;
  try { actual = await sha256File(path); } catch { /* reported below */ }
  checkedSources.push({ path: binding.path, expected: binding.sha256, actual, current: actual === binding.sha256 });
  if (actual !== binding.sha256) failures.push(`local binding drift: ${binding.path}`);
}

if (profile.canonical_semantic_subject !== "Capability Instance") failures.push("canonical subject must be Capability Instance");
if (profile.ui_alias_policy !== "noncanonical-label-only") failures.push("UI alias must remain noncanonical");
if (definitions.status !== "prototype-noncanonical") failures.push("local definition candidates must remain noncanonical");
if (artifactTypes.status !== "prototype-noncanonical") failures.push("Artifact Types must remain candidates");
if (relations.relations.some((relation) => relation.authority_transfer !== false)) failures.push("identity relations may not transfer authority");
if (candidate.lifecycle.activation !== "not-authorized") failures.push("candidate activation must remain unauthorized");
if (candidate.effect_envelope.effects.length !== 0) failures.push("Foundation candidate must remain effect-free");
if (composition.semantic_core.invariants.length < 5) failures.push("composition invariants are incomplete");

const requiredTerms = new Set(candidate.source_bindings);
for (const source of sources.definitions) requiredTerms.delete(source.term);
if (requiredTerms.size > 0) failures.push(`unbound source terms: ${[...requiredTerms].join(", ")}`);

const report = {
  schema: "cav2.foundation-validation-report/v1",
  outcome: failures.length === 0 ? "PASS" : "FAIL",
  checked_source_count: checkedSources.length,
  checked_sources: checkedSources,
  failures,
  claim_ceiling: "candidate package structure and selected-source currentness only; not product approval, admission, conformance, or effect authority",
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failures.length > 0) process.exitCode = 1;
