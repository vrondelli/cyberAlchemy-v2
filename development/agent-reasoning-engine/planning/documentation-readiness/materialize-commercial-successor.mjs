#!/usr/bin/env node
import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {canonicalJson} from "../../../../implementation/agent-reasoning-engine/packages/intent-route-resolver/index.mjs";
import {digestValue} from "../../../../implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/index.mjs";
import {canonicalJson as evolutionCanonicalJson, digest as evolutionDigest} from "../../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs";
import {materializeBenchmarkRegistration, verifyBenchmarkRegistration} from "../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/benchmark-registration.mjs";

const here = dirname(fileURLToPath(import.meta.url));
export const projectRoot = resolve(here, "../../../..");
export const sourceRepositoryRoot = resolve(projectRoot, "..");
export const baselineCandidatePath = resolve(projectRoot, "implementation/agent-reasoning-engine/evidence/product-candidate.018.json");
export const SUCCESSOR_VERSION = "0.10.0-rc.1";
export const SUCCESSOR_PRODUCT_ID = "keld-agent-reasoning-engine";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = (path) => JSON.parse(readFileSync(path, "utf8"));
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");

function emptyDirectory(path) {
  return !existsSync(path) || readdirSync(path).length === 0;
}

function successorPath(sourcePath) {
  const prefix = "cyberAlchemy-v2/";
  if (!sourcePath.startsWith(prefix)) throw new Error(`successor.source-prefix-invalid:${sourcePath}`);
  const stripped = sourcePath.slice(prefix.length);
  return stripped === "implementation/agent-reasoning-engine/packages/request-decision-router/profiles/cyberalchemy-v1.json"
    ? "implementation/agent-reasoning-engine/packages/request-decision-router/profiles/are-v1.json"
    : stripped;
}

function transformedText(text) {
  const successorIdentity = (match) => match[0] === match[0].toLowerCase() ? "are" : "ARE";
  return text
    .replaceAll("0.10.0-self-contained-candidate.7", SUCCESSOR_VERSION)
    .replaceAll("cyberalchemy-agent-reasoning-engine", SUCCESSOR_PRODUCT_ID)
    .replace(/cyberalchemy-v2\//giu, "")
    .replace(/cyberalchemy(?:[ -]v2)?/giu, successorIdentity);
}

const layoutReplacements = new Map([
  ["implementation/agent-reasoning-engine/src/product.mjs", [["resolve(productRoot, \"../../..\")", "resolve(productRoot, \"../..\")"]]],
  ["implementation/agent-reasoning-engine/src/decision-cli.mjs", [["resolve(productRoot, \"../../..\")", "resolve(productRoot, \"../..\")"]]],
  ["implementation/agent-reasoning-engine/packages/coding-agent-runtime/bin/live-demo.mjs", [["resolve(productRoot, \"../../..\")", "resolve(productRoot, \"../..\")"]]],
  ["implementation/agent-reasoning-engine/packages/request-decision-router/scripts/build-profile.mjs", [["resolve(packageRoot, \"../../../../..\")", "resolve(packageRoot, \"../../../..\")"]]],
  ["agent-reasoning-engine/scripts/validate.py", [["REPOSITORY_ROOT = Path(__file__).resolve().parents[3]", "REPOSITORY_ROOT = Path(__file__).resolve().parents[2]"]]],
  ["development/agent-reasoning-engine/codex-integration/runtime/engine.mjs", [["resolve(packageRoot, \"../../../..\")", "resolve(packageRoot, \"../../..\")"]]],
  ["development/agent-reasoning-engine/codex-integration/scripts/run-regression.mjs", [["resolve(packageRoot, \"../../../..\")", "resolve(packageRoot, \"../../..\")"]]],
  ["development/agent-reasoning-engine/codex-integration/scripts/build-runtime-closure.mjs", [["resolve(packageRoot, \"../../../..\")", "resolve(packageRoot, \"../../..\")"]]],
  ["development/agent-reasoning-engine/codex-integration/coding-agent-runtime/scripts/validate.mjs", [["resolve(packageRoot, \"../../../../..\")", "resolve(packageRoot, \"../../../..\")"]]],
  ["development/agent-reasoning-engine/codex-integration/coding-agent-runtime/scripts/validate-l2.mjs", [["resolve(packageRoot, \"../../../../..\")", "resolve(packageRoot, \"../../../..\")"]]],
]);

const packageRootConsumers = [
  "packages/codex-app-server-wrapper/scripts/benchmark.mjs",
  "packages/codex-app-server-wrapper/scripts/canary.mjs",
  "packages/codex-app-server-wrapper/scripts/objective-canary.mjs",
  "packages/codex-app-server-wrapper/scripts/persistent-gateway-canary.mjs",
  "packages/codex-app-server-wrapper/scripts/semantic-continuation-canary.mjs",
  "packages/codex-app-server-wrapper/test/continuation-frontier.test.mjs",
  "packages/codex-app-server-wrapper/test/interaction-learning.test.mjs",
  "packages/codex-app-server-wrapper/test/objective-lifecycle.test.mjs",
  "packages/codex-app-server-wrapper/test/objective-meanings.test.mjs",
  "packages/codex-app-server-wrapper/test/objective-requirements.test.mjs",
  "packages/codex-app-server-wrapper/test/stdio-proxy.test.mjs",
  "packages/codex-app-server-wrapper/test/wrapper.test.mjs",
  "packages/coding-agent-runtime/scripts/benchmark-secrets.mjs",
  "packages/coding-agent-runtime/test/integrated-context.test.mjs",
  "packages/context-basis-runtime/test/context-basis.test.mjs",
  "packages/reasoning-policy-runtime/test/reasoning-policy.test.mjs",
  "packages/request-decision-router/scripts/benchmark.mjs",
  "packages/request-decision-router/scripts/run-witness.mjs",
  "packages/request-decision-router/test/consequence.test.mjs",
  "packages/request-decision-router/test/profile.test.mjs",
  "packages/request-decision-router/test/router.test.mjs",
  "packages/semantic-input-runtime/test/semantic-input.test.mjs",
  "packages/semantic-judgment-evaluator/test/context-envelope-integration.test.mjs",
].map((path) => `implementation/agent-reasoning-engine/${path}`);

for (const path of packageRootConsumers) {
  layoutReplacements.set(path, [["../../../../..", "../../../.."]]);
}

const deepConsumers = [
  "benchmarks/real-reasoning-v1/interaction-learning/live.mjs",
  "packages/codex-app-server-wrapper/src/interaction-review.mjs",
  "packages/conversation-runtime/test/routed.test.mjs",
  "packages/intent-route-resolver/scripts/run-witness.mjs",
  "packages/request-decision-router/test/locate.test.mjs",
  "packages/request-decision-router/test/recent.test.mjs",
  "packages/request-decision-router/test/sibling.test.mjs",
].map((path) => `implementation/agent-reasoning-engine/${path}`);

for (const path of deepConsumers) {
  layoutReplacements.set(path, [["../../../../../..", "../../../../.."]]);
}

layoutReplacements.get("implementation/agent-reasoning-engine/packages/context-basis-runtime/test/context-basis.test.mjs")
  .push(["[\"AREV2\", \"Ontology\"]", "[\"Ontology\", \"AREV2\"]"]);
layoutReplacements.set("implementation/agent-reasoning-engine/benchmarks/real-reasoning-v1/src/common.mjs", [["../../../../..", "../../../.."]]);
layoutReplacements.set("implementation/agent-reasoning-engine/test/product.test.mjs", [
  ...["goals/profile.json", "authority/AUTHORITY-MODEL.md", "ontology/governance/invariants.json", "ontology/governance/rules.json", "define/profile.json", "agent-routing/routes.json", "define/system-ontology/PROFILE.json", "define/system-ontology/NODES.json", "define/system-ontology/RELATIONS.json", "define/definitions.json"]
    .map((path) => [`\"/${path}\"`, `\"${path}\"`]),
  ["entry.path.endsWith(required)", "entry.path === required"],
  ["path.endsWith(\"/agent-reasoning-engine/tests/test_negative_mutations.py\")", "path.endsWith(\"agent-reasoning-engine/tests/test_negative_mutations.py\")"],
]);

function applyLayoutReplacements(outputRoot) {
  for (const [relative, replacements] of layoutReplacements) {
    const path = resolve(outputRoot, relative);
    let text = readFileSync(path, "utf8");
    for (const [before, after] of replacements) {
      if (!text.includes(before)) throw new Error(`successor.layout-anchor-missing:${relative}:${before}`);
      text = text.replaceAll(before, after);
    }
    writeFileSync(path, text, "utf8");
  }
}

function runNode(productRoot, args) {
  return spawnSync(process.execPath, args, {cwd: productRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024});
}

function rebindSemanticProfile(productRoot, relative) {
  const path = resolve(productRoot, relative);
  const profile = json(path);
  for (const binding of profile.bindings ?? []) {
    for (const provider of Object.values(binding.providers ?? {})) {
      const providerPath = resolve(resolve(productRoot, "../.."), provider.path);
      if (provider.path && existsSync(providerPath)) provider.sha256 = sha256(readFileSync(providerPath));
    }
  }
  delete profile.profile_digest;
  profile.profile_digest = digestValue(profile);
  writeJson(path, profile);
}

function rebindRepositoryProfile(productRoot, relative) {
  const path = resolve(productRoot, relative);
  const repositoryRoot = resolve(productRoot, "../..");
  const profile = json(path);
  const walk = (value) => {
    if (!value || typeof value !== "object") return;
    if (typeof value.path === "string" && typeof value.sha256 === "string") {
      const source = resolve(repositoryRoot, value.path);
      if (existsSync(source)) value.sha256 = sha256(readFileSync(source));
    }
    for (const child of Array.isArray(value) ? value : Object.values(value)) walk(child);
  };
  walk(profile.sources);
  const protocol = {interface_sha256: "interface", observation_sha256: "protocol_observation", selected_projection_sha256: "protocol_projection"};
  for (const [field, source] of Object.entries(protocol)) {
    if (profile.sources?.[source]?.sha256) profile.protocol_binding[field] = profile.sources[source].sha256;
  }
  writeJson(path, profile);
}

function repairEvolutionRegistrations(productRoot) {
  const directory = resolve(productRoot, "packages/evolution-runtime/research-records");
  const replacements = [];
  for (const name of readdirSync(directory).filter((entry) => entry.endsWith(".json")).sort()) {
    const path = resolve(directory, name);
    const prior = json(path);
    if (verifyBenchmarkRegistration(prior)) continue;
    prior.evidence.result.manifest_digest = evolutionDigest(prior.evidence.manifest);
    const successor = materializeBenchmarkRegistration({
      experiment_id: prior.experiment_id,
      manifest: prior.evidence.manifest,
      result: prior.evidence.result,
      expected_result_digest: evolutionDigest(prior.evidence.result),
    });
    const successorName = `${successor.registration_digest}.json`;
    writeFileSync(resolve(directory, successorName), `${evolutionCanonicalJson(successor)}\n`, "utf8");
    if (successorName !== name) unlinkSync(path);
    replacements.push([prior.registration_digest, successor.registration_digest]);
  }
  for (const relative of ["packages/evolution-runtime/plans/requirement-fast-path-v1.json", "packages/evolution-runtime/plans/requirement-research-v1.json"]) {
    const path = resolve(productRoot, relative);
    let text = readFileSync(path, "utf8");
    for (const [before, after] of replacements) text = text.replaceAll(before, after);
    writeFileSync(path, text, "utf8");
  }
}

function repairDigestBindings(outputRoot) {
  const productRoot = resolve(outputRoot, "implementation/agent-reasoning-engine");
  const build = runNode(productRoot, ["packages/request-decision-router/scripts/build-profile.mjs"]);
  if (build.status !== 0) throw new Error(`successor.profile-build-failed:${build.stderr.trim()}`);
  rebindSemanticProfile(productRoot, "packages/semantic-input-runtime/profiles/definition-readiness-v1/profile.json");
  rebindSemanticProfile(productRoot, "packages/codex-app-server-wrapper/test/fixtures/semantic/profile.json");
  repairEvolutionRegistrations(productRoot);
  rebindRepositoryProfile(productRoot, "packages/codex-app-server-wrapper/profiles/repository-v1.json");
  rebindRepositoryProfile(productRoot, "packages/codex-app-server-wrapper/profiles/interaction-learning-canary-v1.json");
}

function scanLegacyIdentity(root) {
  const matches = [];
  const visit = (directory) => {
    for (const name of readdirSync(directory)) {
      const path = resolve(directory, name);
      const stat = lstatSync(path);
      if (stat.isDirectory()) visit(path);
      else if (stat.isFile()) {
        const bytes = readFileSync(path);
        if (bytes.includes(0)) continue;
        const text = bytes.toString("utf8");
        if (/cyberalchemy(?:-v2)?/iu.test(text) || /cyberalchemy/iu.test(name)) matches.push(path.slice(root.length + 1));
      }
    }
  };
  visit(root);
  return matches.sort();
}

export function materializeCommercialSuccessor({outputRoot, runTests = false} = {}) {
  if (!outputRoot) throw new TypeError("successor.output-required");
  outputRoot = resolve(outputRoot);
  if (outputRoot === sourceRepositoryRoot || outputRoot.startsWith(`${sourceRepositoryRoot}/`)) throw new Error("successor.output-inside-source-repository");
  if (!emptyDirectory(outputRoot)) throw new Error("successor.output-not-empty");
  mkdirSync(outputRoot, {recursive: true});

  const candidate = json(baselineCandidatePath);
  let copiedBytes = 0;
  for (const entry of candidate.source_closure.files) {
    const source = resolve(sourceRepositoryRoot, entry.path);
    const bytes = readFileSync(source);
    if (sha256(bytes) !== entry.sha256) throw new Error(`successor.baseline-source-drift:${entry.path}`);
    const relative = successorPath(entry.path);
    const target = resolve(outputRoot, relative);
    mkdirSync(dirname(target), {recursive: true});
    if (entry.kind === "symlink") symlinkSync(entry.link_target, target);
    else {
      let output = bytes;
      if (!bytes.includes(0)) {
        try { output = Buffer.from(transformedText(bytes.toString("utf8")), "utf8"); } catch {}
      }
      writeFileSync(target, output);
      chmodSync(target, entry.mode);
      copiedBytes += output.length;
    }
  }

  applyLayoutReplacements(outputRoot);
  repairDigestBindings(outputRoot);
  const productRoot = resolve(outputRoot, "implementation/agent-reasoning-engine");
  const legacyIdentityMatches = scanLegacyIdentity(outputRoot);
  if (legacyIdentityMatches.length > 0) throw new Error(`successor.legacy-identity-remains:${legacyIdentityMatches.join(",")}`);

  const doctor = runNode(productRoot, ["bin/are.mjs", "doctor", "--json"]);
  let health = null;
  try { health = JSON.parse(doctor.stdout); } catch {}
  const tests = runTests ? runNode(productRoot, ["bin/are.mjs", "test"]) : null;
  let testResult = null;
  try { testResult = tests ? JSON.parse(tests.stdout) : null; } catch {}
  const status = doctor.status === 0 && health?.status === "PASS" && (!runTests || (tests.status === 0 && testResult?.status === "PASS")) ? "PASS" : "BLOCK";
  const material = {
    schema_version: "are.commercial-successor-materialization-receipt/v1",
    status,
    successor: {
      product_id: health?.product_id ?? SUCCESSOR_PRODUCT_ID,
      product_version: health?.product_version ?? SUCCESSOR_VERSION,
      source_closure_digest: health?.source_closure?.closure_digest ?? null,
      file_count: health?.source_closure?.file_count ?? candidate.source_closure.files.length,
      total_bytes: health?.source_closure?.total_bytes ?? copiedBytes,
      legacy_identity_matches: legacyIdentityMatches,
    },
    baseline: {
      candidate_id: candidate.candidate_id,
      candidate_digest: candidate.candidate_digest,
      source_closure_digest: candidate.source_closure.closure_digest,
      file_count: candidate.source_closure.files.length,
    },
    verification: {
      doctor_status: health?.status ?? "UNREADABLE",
      doctor_reason_codes: health?.reason_codes ?? [],
      tests_requested: runTests,
      test_status: testResult?.status ?? (runTests ? "UNREADABLE" : "NOT_RUN"),
      test_files: testResult?.results?.reduce((sum, item) => sum + item.test_files, 0) ?? 0,
      test_cases: testResult?.results?.reduce((sum, item) => sum + item.test_cases, 0) ?? 0,
      failing_targets: testResult?.results?.filter((item) => item.status !== "PASS").map((item) => item.target_ref) ?? [],
    },
    identity_rule: "Customer-facing successor artifacts use only ARE and Keld identities; legacy repository-wrapper names, paths, and product identifiers must not appear.",
    claim_limit: "This receipt proves only deterministic materialization and the recorded local checks. It grants no product approval, publication, sale, deployment, commit, push, or legal clearance.",
    authority_effect: "none",
  };
  const receipt = {...material, receipt_digest: sha256(canonicalJson(material))};
  return {receipt, doctor, tests};
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const outputRoot = argument("--output");
  const receiptPath = argument("--receipt");
  if (!outputRoot) {
    process.stderr.write("Usage: materialize-commercial-successor.mjs --output <empty-outside-repository-directory> [--receipt <path>] [--test]\n");
    process.exitCode = 2;
  } else {
    try {
      const result = materializeCommercialSuccessor({outputRoot, runTests: process.argv.includes("--test")});
      const rendered = `${JSON.stringify(result.receipt, null, 2)}\n`;
      if (receiptPath) writeFileSync(resolve(receiptPath), rendered, "utf8");
      process.stdout.write(rendered);
      process.exitCode = result.receipt.status === "PASS" ? 0 : 1;
    } catch (error) {
      process.stderr.write(`${error.stack ?? error}\n`);
      process.exitCode = 1;
    }
  }
}
