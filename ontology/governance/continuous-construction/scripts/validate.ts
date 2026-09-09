import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../..");

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function readJson(path: string): any {
  return JSON.parse(readFileSync(path, "utf8"));
}

function files(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(root, entry.name);
    if (entry.isDirectory()) return entry.name === "target" ? [] : files(path);
    return [path];
  });
}

function headingSection(path: string, selector: string): Buffer {
  const lines = readFileSync(path, "utf8").match(/.*(?:\n|$)/g)?.filter(Boolean) ?? [];
  const matches = lines.flatMap((line, index) => line.replace(/[\r\n]+$/, "") === selector ? [index] : []);
  if (matches.length !== 1) throw new Error(`AMBIGUOUS_SOURCE_SELECTOR:${selector}:${matches.length}`);
  let end = lines.length;
  for (let index = matches[0]! + 1; index < lines.length; index += 1) {
    if (lines[index]!.startsWith("## ")) { end = index; break; }
  }
  return Buffer.from(lines.slice(matches[0], end).join(""));
}

let checked = 0;
for (const path of files(packageRoot).filter((path) => path.endsWith(".json"))) {
  readJson(path);
  checked += 1;
}

const binding = readJson(resolve(packageRoot, "construction-binding.json"));
for (const selected of binding.selected_sources) {
  const observed = sha256(headingSection(resolve(repositoryRoot, selected.path), selected.selector));
  if (observed !== selected.sha256) throw new Error(`STALE_SELECTED_SOURCE:${selected.id}`);
  checked += 1;
}

function verifyArtifact(value: any): void {
  if (!value || typeof value !== "object") return;
  if (typeof value.path === "string" && typeof value.sha256 === "string") {
    const path = resolve(repositoryRoot, value.path);
    if (!statSync(path).isFile() || sha256(readFileSync(path)) !== value.sha256) {
      throw new Error(`STALE_ARTIFACT:${value.path}`);
    }
    checked += 1;
  }
  for (const child of Array.isArray(value) ? value : Object.values(value)) verifyArtifact(child);
}
verifyArtifact(binding.stages);

const exactPairs = [
  [binding.stages[4].compiler.compiler_path, binding.stages[4].compiler.compiler_sha256],
  [binding.stages[4].compiler.views_path, binding.stages[4].compiler.views_sha256],
  ["cyberAlchemy-v2/ontology/governance/continuous-construction/runtime/Cargo.toml", binding.stages[5].runtime.manifest_sha256],
  ["cyberAlchemy-v2/ontology/governance/continuous-construction/runtime/Cargo.lock", binding.stages[5].runtime.lock_sha256],
  [binding.stages[5].runtime.library_path, binding.stages[5].runtime.library_sha256],
  [binding.stages[5].runtime.cli_path, binding.stages[5].runtime.cli_sha256],
];
for (const [path, expected] of exactPairs) {
  if (sha256(readFileSync(resolve(repositoryRoot, path))) !== expected) throw new Error(`STALE_EXACT_BINDING:${path}`);
  checked += 1;
}

const evidence = readJson(resolve(packageRoot, "evidence/conformance-candidate.json"));
const evidencePairs = [
  ["cyberAlchemy-v2/ontology/governance/continuous-construction/domainspec/generated/graph.json", evidence.domainspec_build.graph_sha256],
  ["cyberAlchemy-v2/ontology/governance/continuous-construction/domainspec/generated/system-ontology.json", evidence.domainspec_build.system_ontology_sha256],
  ["cyberAlchemy-v2/ontology/governance/continuous-construction/domainspec/generated/build-receipt.json", evidence.domainspec_build.build_receipt_sha256],
  ["cyberAlchemy-v2/ontology/governance/continuous-construction/runtime/Cargo.toml", evidence.exact_runtime_baseline.manifest_sha256],
  ["cyberAlchemy-v2/ontology/governance/continuous-construction/runtime/Cargo.lock", evidence.exact_runtime_baseline.lock_sha256],
  ["cyberAlchemy-v2/ontology/governance/continuous-construction/runtime/src/lib.rs", evidence.exact_runtime_baseline.library_sha256],
  ["cyberAlchemy-v2/ontology/governance/continuous-construction/runtime/src/main.rs", evidence.exact_runtime_baseline.cli_sha256],
];
for (const [path, expected] of evidencePairs) {
  if (sha256(readFileSync(resolve(repositoryRoot, path))) !== expected) throw new Error(`STALE_EVIDENCE_BINDING:${path}`);
  checked += 1;
}
for (const [sourceIndex, field] of [[0, "d65_section_sha256"], [1, "d67_section_sha256"]] as const) {
  if (binding.selected_sources[sourceIndex].sha256 !== evidence.selected_source_gate[field]) {
    throw new Error(`STALE_EVIDENCE_SOURCE:${field}`);
  }
  checked += 1;
}

const readyAttempt = readJson(resolve(packageRoot, "examples/attempts/ready-for-human-test.json"));
const terminalAttempt = readJson(resolve(packageRoot, "examples/attempts/request-terminal-confirmation.json"));
for (const [attemptName, attempt] of [["ready-for-human-test.json", readyAttempt], ["request-terminal-confirmation.json", terminalAttempt]]) {
  const packetPath = resolve(repositoryRoot, attempt.human_test_packet.path);
  if (sha256(readFileSync(packetPath)) !== attempt.human_test_packet.sha256) {
    throw new Error(`STALE_PACKET_BINDING:${attemptName}`);
  }
  checked += 1;
}
if (JSON.stringify(readyAttempt.human_test_packet) !== JSON.stringify(terminalAttempt.human_test_packet)) {
  throw new Error("TERMINAL_REPLACED_FROZEN_PACKET");
}
if (readyAttempt.human_test_observation !== null || !terminalAttempt.human_test_observation) {
  throw new Error("HUMAN_TEST_OBSERVATION_SEPARATION_INVALID");
}
const observationPath = resolve(repositoryRoot, terminalAttempt.human_test_observation.path);
if (sha256(readFileSync(observationPath)) !== terminalAttempt.human_test_observation.sha256) {
  throw new Error("STALE_HUMAN_TEST_OBSERVATION");
}
const observation = readJson(observationPath);
if (observation.packet_ref !== terminalAttempt.human_test_packet.path || observation.packet_sha256 !== terminalAttempt.human_test_packet.sha256 || observation.result !== "passed") {
  throw new Error("OBSERVATION_PACKET_BINDING_INVALID");
}
checked += 4;

function assertNoAuthority(value: any, path = "$."): void {
  if (Array.isArray(value)) return value.forEach((item, index) => assertNoAuthority(item, `${path}[${index}]`));
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (key === "authority_effect" && child !== "none") throw new Error(`AUTHORITY_EFFECT:${path}${key}`);
    if (key === "effect_authorized" && child !== false) throw new Error(`EFFECT_AUTHORIZED:${path}${key}`);
    assertNoAuthority(child, `${path}${key}.`);
  }
}
for (const path of files(packageRoot).filter((path) => path.endsWith(".json"))) assertNoAuthority(readJson(path));

process.stdout.write(`validation=PASS checked=${checked} authority_effect=none effect_authorized=false\n`);
