import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { validateSource } from "./compiler.ts";

type RecordJson = { [key: string]: any };
const sourceFile = fileURLToPath(import.meta.url);
const executionRoot = resolve(dirname(sourceFile), "..");
const repoRoot = resolve(dirname(sourceFile), "../../../../../../../..");
const campaignRoot = resolve(executionRoot, "..");
const buildRoot = join(executionRoot, "build");
const verticalsRoot = join(executionRoot, "verticals");
const evidenceRoot = join(executionRoot, "evidence");
const tsx = join(repoRoot, "projects/domainspec-v2/impl/node_modules/.bin/tsx");
const tsc = join(repoRoot, "projects/domainspec-v2/impl/node_modules/.bin/tsc");

function sha256(bytes: string | Buffer): string { return createHash("sha256").update(bytes).digest("hex"); }
function readJson(path: string): RecordJson { return JSON.parse(readFileSync(path, "utf8")) as RecordJson; }
function stable(value: any): any { if (Array.isArray(value)) return value.map(stable); if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])])); return value; }
function jsonBytes(value: any): string { return `${JSON.stringify(stable(value), null, 2)}\n`; }
function writeJson(path: string, value: any): void { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, jsonBytes(value)); }
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(`ALCHLANG_VALIDATE:${message}`); }
function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }

const campaignPath = join(campaignRoot, "CAMPAIGN.v1-candidate.json");
const authorizationPath = join(executionRoot, "AUTHORIZATION.v1.json");
const decisionPath = join(executionRoot, "INDEPENDENT-VALIDATION-DECISION.v1.json");
const replayPath = join(executionRoot, "CURRENT-INTEGRATION-REPLAY.v1.json");
const campaign = readJson(campaignPath);
const authorization = readJson(authorizationPath);
const decision = readJson(decisionPath);
const replay = readJson(replayPath);
assert(sha256(readFileSync(campaignPath)) === authorization.campaign_sha256, "authorization-campaign-digest");
assert(sha256(readFileSync(campaignPath)) === replay.historical_campaign.sha256, "replay-campaign-digest");
assert(sha256(readFileSync(authorizationPath)) === replay.historical_authorization.sha256, "replay-historical-authorization-digest");
assert(sha256(readFileSync(decisionPath)) === replay.accepted_decision.sha256, "replay-accepted-decision-digest");
assert(replay.ontology_id === "cav2.alchlang.business", "replay-ontology-id");
assert(replay.preflight_intent === "reference-integration-currentness-replay", "replay-preflight-intent");
assert(replay.authority_effect === "none", "replay-authority-effect");
assert(decision.campaign_id === campaign.campaign_id, "decision-campaign-id");
assert(decision.acceptance === "accept-all-three-reference-verticals", "decision-acceptance");
assert(decision.authority_effect === "none", "decision-authority-effect");
const reviewedReceiptPath = join(executionRoot, decision.reviewed_receipt.ref);
assert(sha256(readFileSync(reviewedReceiptPath)) === decision.reviewed_receipt.sha256, "decision-reviewed-receipt-digest");
assert(decision.verticals.length === 3, "decision-vertical-count");
for (const integration of Object.values(replay.current_integration) as RecordJson[]) {
  assert(sha256(readFileSync(resolve(executionRoot, integration.ref))) === integration.sha256, `current-integration-drift:${integration.ref}`);
}
for (const source of replay.source_snapshot) {
  const actual = sha256(readFileSync(join(repoRoot, source.path)));
  assert(actual === source.sha256, `predecessor-drift:${source.path}`);
}

const hostileResults: RecordJson[] = [];
for (const name of readdirSync(verticalsRoot).sort()) {
  const root = join(verticalsRoot, name);
  const source = readJson(join(root, "alchlang.domain.json"));
  const capability = readJson(join(root, "product-capability.json"));
  const ontology = readJson(join(root, "business-ontology.json"));
  validateSource(source, capability, ontology);
  const cases: Array<[string, (candidate: RecordJson) => void]> = [
    ["dangling-ontology-edge", (candidate) => { candidate.ontology_edges[0].target = "missing-term"; }],
    ["unresolved-required-question", (candidate) => { candidate.open_questions.push({ id: "hostile", question: "unknown", status: "open" }); }],
    ["missing-authority-boundary", (candidate) => { candidate.actions[0].authority_boundary_ref = "missing-authority"; }]
  ];
  for (const [caseId, mutate] of cases) {
    const candidate = clone(source); mutate(candidate); let rejected = false;
    try { validateSource(candidate, capability, ontology); } catch { rejected = true; }
    assert(rejected, `hostile-not-rejected:${name}:${caseId}`);
    hostileResults.push({ vertical_id: name, case_id: caseId, status: "PASS" });
  }
}

const typecheck = spawnSync(tsc, ["-p", join(executionRoot, "tsconfig.generated.json"), "--pretty", "false"], { cwd: executionRoot, encoding: "utf8" });
const typecheckOutput = `${typecheck.stdout}${typecheck.stderr}`;
writeFileSync(join(evidenceRoot, "static-typecheck-output.txt"), typecheckOutput);
assert(typecheck.status === 0, `static-typecheck:${typecheck.status}\n${typecheckOutput}`);
const typecheckOutputSha256 = sha256(typecheckOutput);

const verticalResults: RecordJson[] = [];
for (const name of readdirSync(buildRoot).sort()) {
  const root = join(buildRoot, name);
  const generatedRoot = join(root, "generated");
  const receipt = readJson(join(root, "evidence/generation-receipt.json"));
  const expectedArtifacts = ["domain.types.ts", "domain.schema.ts", "domain.machine.ts", "domain.events.ts", "domain.tools.ts", "domain.test.ts", "domain.graph.json", "system-ontology.json", "traceability.json"];
  for (const artifact of expectedArtifacts) {
    const actual = sha256(readFileSync(join(generatedRoot, artifact)));
    assert(actual === receipt.outputs[artifact], `generated-digest:${name}:${artifact}`);
  }
  const graph = readJson(join(generatedRoot, "domain.graph.json"));
  const system = readJson(join(generatedRoot, "system-ontology.json"));
  const traceability = readJson(join(generatedRoot, "traceability.json"));
  assert(sha256(readFileSync(join(generatedRoot, "domain.graph.json"))) === system.source_graph_sha256, `system-graph-binding:${name}`);
  assert(graph.nodes.length > 0 && graph.relationships.length > 0, `graph-empty:${name}`);
  assert(traceability.artifact_bindings.length === 8, `traceability-covered-artifacts:${name}`);
  const testPath = join(generatedRoot, "domain.test.ts");
  const test = spawnSync(tsx, ["--test", testPath], { cwd: executionRoot, encoding: "utf8" });
  const output = `${test.stdout}${test.stderr}`;
  writeFileSync(join(root, "evidence/runtime-test-output.txt"), output);
  assert(test.status === 0, `runtime-tests:${name}:${test.status}\n${output}`);
  const conformance = {
    schema_version: "cav2.alchlang.source-local-conformance/v1-candidate",
    vertical_id: name,
    status: "FLAG",
    checks: [
      { id: "exact-generated-digests", status: "PASS" },
      { id: "domainspec-graph-closure", status: "PASS", node_count: graph.nodes.length, relationship_count: graph.relationships.length },
      { id: "system-ontology-graph-binding", status: "PASS" },
      { id: "traceability-artifact-coverage", status: "PASS", covered_artifacts: 8, manifest_artifact: "traceability.json" },
      { id: "strict-typescript-typecheck", status: "PASS", output_sha256: typecheckOutputSha256 },
      { id: "reference-runtime-tests", status: "PASS", output_sha256: sha256(output) },
      { id: "declared-node-toolchain", status: receipt.toolchain_drift ? "FLAG" : "PASS", observed: receipt.node_runtime, declared: receipt.declared_node_runtime },
      { id: "independent-owner-review", status: "not_evaluable", blocker: "The user explicitly reserved final validation; this report is source-local evidence for that review." }
    ],
    claim_ceiling: "Source-local structural and runtime evidence only; final independent user validation, admission, release, deployment, and real effects remain outside this receipt.",
    authority_effect: "none"
  };
  const conformancePath = join(root, "evidence/conformance.json");
  writeJson(conformancePath, conformance);
  const bindingPath = join(root, "evidence/construction-binding.candidate.json");
  const binding = readJson(bindingPath);
  const verticalDecision = decision.verticals.find((row: RecordJson) => row.vertical_id === name);
  assert(verticalDecision, `decision-missing-vertical:${name}`);
  assert(verticalDecision.decision === "accept", `decision-not-accepted:${name}`);
  assert(verticalDecision.original_binding_ref === relative(executionRoot, bindingPath), `decision-original-binding-ref:${name}`);
  const acceptedBindingPath = join(executionRoot, verticalDecision.binding_ref);
  assert(sha256(readFileSync(acceptedBindingPath)) === verticalDecision.binding_sha256, `decision-accepted-binding-digest:${name}`);
  const acceptedBinding = readJson(acceptedBindingPath);
  const acceptedConformancePath = join(evidenceRoot, "accepted", `${name}.source-local-conformance.json`);
  assert(sha256(readFileSync(acceptedConformancePath)) === acceptedBinding.conformance.digest, `decision-accepted-conformance-digest:${name}`);
  acceptedBinding.conformance = null;
  assert(jsonBytes(binding) === jsonBytes(acceptedBinding), `decision-binding-structural-drift:${name}`);
  binding.conformance = { ref: relative(executionRoot, conformancePath), digest: sha256(readFileSync(conformancePath)), posture: "source-local-pending-independent-user-review" };
  writeJson(bindingPath, binding);
  const bindingSha256 = sha256(readFileSync(bindingPath));
  verticalResults.push({
    vertical_id: name,
    status: "PASS",
    binding_status: binding.status,
    independent_review: "accepted",
    accepted_binding_sha256: verticalDecision.binding_sha256,
    test_output_sha256: sha256(output),
    binding_sha256: bindingSha256
  });
}

const determinism = readJson(join(evidenceRoot, "determinism.json"));
assert(determinism.comparisons.length === 3 && determinism.comparisons.every((row: RecordJson) => row.status === "PASS"), "determinism-evidence");
const declaredToolchainPass = process.version === "v26.8.1";
const report = {
  schema_version: "cav2.alchlang.current-integration-validation/v1-candidate",
  replay_id: replay.replay_id,
  campaign_id: campaign.campaign_id,
  status: declaredToolchainPass ? "PASS" : "FLAG",
  checks: {
    current_replay_bindings: "PASS",
    current_replay_sha256: sha256(readFileSync(replayPath)),
    historical_authorization_integrity: "PASS",
    current_predecessor_digests: "PASS",
    current_integration_material: "PASS",
    vertical_count: verticalResults.length === 3 ? "PASS" : "FAIL",
    two_run_determinism: "PASS",
    hostile_cases: hostileResults.every((row) => row.status === "PASS") ? "PASS" : "FAIL",
    hostile_case_count: hostileResults.length,
    generated_typescript_typecheck: "PASS",
    typecheck_output_sha256: typecheckOutputSha256,
    generated_runtime_tests: "PASS",
    construction_bindings: "candidate-owner-accepted-for-reference-integration",
    declared_toolchain: declaredToolchainPass ? "PASS" : "FLAG",
    independent_user_validation: "PASS",
    independent_validation_decision_sha256: sha256(readFileSync(decisionPath)),
    reviewed_pre_acceptance_receipt_sha256: decision.reviewed_receipt.sha256
  },
  verticals: verticalResults,
  residue: [
    ...(declaredToolchainPass ? [] : [`DomainSpec CLI declares Node v26.8.1; this run observed ${process.version}.`]),
    "The DomainSpec profile and compiler remain private candidates with release admission not granted.",
    "The user accepted the exact three candidate bindings for governed reference integration; that acceptance is not canonical admission.",
    "No publication, release, deployment, credential, network, or real infrastructure effect was attempted."
  ],
  claim_ceiling: "The already accepted three reference vertical candidates replayed against the exact current integrated predecessor set. This does not extend acceptance or grant canonical admission, publication, release, deployment, production status, product-value proof, or a real external effect.",
  authority_effect: "none"
};
writeJson(join(evidenceRoot, "current-integration-replay.json"), report);
process.stdout.write(jsonBytes(report));
