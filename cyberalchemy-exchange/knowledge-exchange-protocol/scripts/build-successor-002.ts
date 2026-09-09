import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildMintedProjectViews,
  verifyMintedProjectBuild,
} from "../../../../projects/domainspec-v2/impl/tools/minted-project/views";

type JsonObject = Record<string, any>;

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const projectRoot = resolve(packageRoot, "domainspec/successors/002");
const generatedRoot = resolve(projectRoot, "generated");
const bindingPath = resolve(projectRoot, "construction-binding.json");

function bytes(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function readJson(path: string): JsonObject {
  return JSON.parse(readFileSync(path, "utf8")) as JsonObject;
}

function assert(condition: unknown, code: string): asserts condition {
  if (!condition) throw new Error(code);
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function sameMembers(actual: string[], expected: string[]): boolean {
  return JSON.stringify(sortedUnique(actual)) === JSON.stringify(sortedUnique(expected));
}

function verifyPredecessors(binding: JsonObject): { capability: JsonObject; ontology: JsonObject } {
  assert(binding.schema_version === "cav2-d65-domainspec-construction-binding/v2", "BINDING_SCHEMA_INVALID");
  const predecessors = binding.predecessors as JsonObject;
  for (const name of ["canonical_definitions", "product_capability", "business_ontology", "business_ontology_admission"]) {
    const item = predecessors[name] as JsonObject;
    assert(item?.path && item?.sha256, `PREDECESSOR_MISSING:${name}`);
    const actual = sha256(readFileSync(resolve(packageRoot, item.path)));
    assert(actual === item.sha256, `PREDECESSOR_DRIFT:${name}:${actual}`);
  }
  const prior = predecessors.superseded_system_ontology as JsonObject;
  assert(sha256(readFileSync(resolve(packageRoot, prior.path))) === prior.sha256, "PRIOR_SYSTEM_ONTOLOGY_DRIFT");
  assert(sha256(readFileSync(resolve(packageRoot, prior.admission_decision_path))) === prior.admission_decision_sha256, "PRIOR_SYSTEM_ADMISSION_DRIFT");
  const priorDecision = readJson(resolve(packageRoot, prior.admission_decision_path));
  assert(priorDecision.admission?.system_ontology_digest === prior.sha256, "PRIOR_ADMISSION_BINDING_INVALID");

  const capability = readJson(resolve(packageRoot, predecessors.product_capability.path));
  const ontology = readJson(resolve(packageRoot, predecessors.business_ontology.path));
  assert(capability.lifecycle_posture?.status?.value === "adopted", "CAPABILITY_NOT_ADOPTED");
  assert(ontology.lifecycle_status === "admitted", "BUSINESS_ONTOLOGY_NOT_ADMITTED");
  assert(capability.capability_id === ontology.capability_ref, "CAPABILITY_ONTOLOGY_MISMATCH");
  return { capability, ontology };
}

function fieldNames(graph: JsonObject, nodeId: string): string[] {
  const node = graph.nodes.find((candidate: JsonObject) => candidate.node_id === nodeId);
  assert(node, `NODE_MISSING:${nodeId}`);
  return (node.body?.fields ?? []).map((field: JsonObject) => field.name);
}

function requireFields(graph: JsonObject, nodeId: string, required: string[]): void {
  const actual = fieldNames(graph, nodeId);
  const missing = required.filter((field) => !actual.includes(field));
  assert(missing.length === 0, `FIELD_CLOSURE_FAILED:${nodeId}:${missing.join(",")}`);
}

function verifyDefinitionFieldClosure(graph: JsonObject): void {
  requireFields(graph, "encrypted-knowledge-coownership.KnowledgeIdentity", [
    "encryption_binding_id", "encryption_key_version", "encryption_key_valid_from",
    "encryption_key_valid_until", "encryption_key_challenge_digest",
  ]);
  requireFields(graph, "encrypted-knowledge-coownership.EncryptedCoownershipState", [
    "state_revision", "consumed_command_digests", "consumed_challenge_digests",
  ]);
  requireFields(graph, "encrypted-knowledge-coownership.CoownershipGrant", [
    "command_digest", "expected_state_revision", "evaluation_time",
    "recipient_key_binding_id", "recipient_key_binding_version",
  ]);
  requireFields(graph, "encrypted-knowledge-coownership.RecipientKeyEnvelope", [
    "recipient_key_binding_id", "recipient_key_binding_version",
  ]);
  requireFields(graph, "encrypted-knowledge-coownership.KeyReissueRequest", [
    "command_digest", "expected_state_revision", "evaluation_time",
    "previous_key_binding_id", "previous_key_binding_version",
    "replacement_key_binding_id", "replacement_key_binding_version",
  ]);
  requireFields(graph, "encrypted-knowledge-coownership.KeyReissue", [
    "reissue_digest", "request_digest", "expected_state_revision", "issuer_id",
    "replacement_key_binding_id", "replacement_key_binding_version",
    "protected_state_before_digest", "protected_state_after_digest",
    "unaffected_envelopes_before_digest", "unaffected_envelopes_after_digest",
  ]);
  requireFields(graph, "encrypted-knowledge-coownership.DecryptionAcknowledgement", [
    "command_digest", "expected_state_revision", "ciphertext_digest", "challenge_digest",
  ]);
}

function verifySemanticClosure(graph: JsonObject, capability: JsonObject, ontology: JsonObject): JsonObject {
  const definitionRefs = sortedUnique(graph.nodes.flatMap((node: JsonObject) => node.body?.definition_refs ?? []));
  const semanticRefs = sortedUnique(graph.nodes.flatMap((node: JsonObject) => node.body?.semantic_refs ?? []));
  const selectedDefinitions = (ontology.definition_source?.definition_ids ?? []) as string[];
  const ruleIds = (ontology.rules ?? []).map((rule: JsonObject) => rule.rule_id);
  const proofIds = (ontology.proof_requirements ?? []).map((proof: JsonObject) => proof.proof_id);
  const ontologyNodeIds = (ontology.nodes ?? []).map((node: JsonObject) => node.id);
  const allowed = sortedUnique([capability.capability_id, ...ontologyNodeIds, ...ruleIds, ...proofIds]);
  const required = sortedUnique([
    capability.capability_id,
    ...(ontology.definition_bindings ?? []).flatMap((entry: JsonObject) => entry.ontology_refs),
    ...ruleIds,
    ...proofIds,
  ]);
  assert(sameMembers(definitionRefs, selectedDefinitions), "DEFINITION_COVERAGE_FAILED");
  assert(semanticRefs.every((ref) => allowed.includes(ref)), "UNKNOWN_SEMANTIC_REFERENCE");
  assert(required.every((ref) => semanticRefs.includes(ref)), "SEMANTIC_COVERAGE_FAILED");
  assert(graph.nodes.every((node: JsonObject) => node.body?.authority_effect === "none"), "NODE_AUTHORITY_EFFECT_INVALID");
  verifyDefinitionFieldClosure(graph);
  return {
    selected_definition_ids: definitionRefs,
    required_semantic_refs: required,
    authored_semantic_refs: semanticRefs,
    business_rule_ids: ruleIds.sort(),
    proof_requirement_ids: proofIds.sort(),
    field_level_definition_closure: "closed",
    status: "closed",
  };
}

function projectSystemOntology(
  built: ReturnType<typeof buildMintedProjectViews>,
  binding: JsonObject,
  ontology: JsonObject,
  semanticCoverage: JsonObject,
): JsonObject {
  const compilerPath = resolve(packageRoot, "../../../projects/domainspec-v2/impl/tools/minted-project/compiler.ts");
  const viewsPath = resolve(packageRoot, "../../../projects/domainspec-v2/impl/tools/minted-project/views.ts");
  return {
    schema_version: "knowledge-exchange-protocol-system-ontology/v3",
    ontology_id: "knowledge-exchange.system.encrypted-coownership",
    ontology_type: "system",
    lifecycle_status: "successor-candidate",
    authority: "generated-system-ontology-read-model",
    authority_effect: "none",
    enforcement_effect: "none",
    supersedes: binding.predecessors.superseded_system_ontology,
    predecessor_bindings: binding.predecessors,
    construction_binding: {
      binding_id: binding.binding_id,
      path: "domainspec/successors/002/construction-binding.json",
      sha256: sha256(readFileSync(bindingPath)),
    },
    correction_closure: binding.corrections,
    source_project_id: built.graph.project_id,
    source_set_digest: built.graph.source_set_digest,
    source_graph_digest: sha256(built.graphBytes),
    compiler: {
      id: "domainspec-v2-minted-project-tools",
      version: "minted-project-tools/v1",
      compiler_path: "projects/domainspec-v2/impl/tools/minted-project/compiler.ts",
      compiler_sha256: sha256(readFileSync(compilerPath)),
      views_path: "projects/domainspec-v2/impl/tools/minted-project/views.ts",
      views_sha256: sha256(readFileSync(viewsPath)),
      profile_id: built.buildReceipt.language.profile_id,
      profile_version: built.buildReceipt.language.profile_version,
      profile_digest: built.buildReceipt.language.profile_digest,
      profile_release_admission: "not-granted",
    },
    semantic_coverage: semanticCoverage,
    nodes: built.graph.nodes,
    edges: built.graph.edges,
    implementation_contract: {
      product_capability_ref: binding.predecessors.product_capability.capability_id,
      business_ontology_ref: binding.predecessors.business_ontology.ontology_id,
      implementation_target_ref: "cyberAlchemy-v2/product/knowledge-exchange-protocol/runtime/src/lib.rs",
      implementation_language: "rust",
      implementation_binding_status: "blocked-pending-successor-system-ontology-admission",
      permitted_operations: ["grant_coownership", "acknowledge_decryption", "reissue_lost_key", "rotate_compromised_epoch"],
      invariant_refs: (ontology.rules ?? []).map((rule: JsonObject) => rule.rule_id).sort(),
      proof_obligation_refs: (ontology.proof_requirements ?? []).map((proof: JsonObject) => proof.proof_id).sort(),
      required_runtime_mechanisms: [
        "binding-validity-window-evaluation",
        "binding-challenge-commitment",
        "exact-state-revision-binding",
        "consumed-command-replay-protection",
        "consumed-challenge-replay-protection",
        "ciphertext-bound-acknowledgement",
        "same-epoch-single-envelope-reissue",
        "complete-owner-envelope-epoch-rotation",
      ],
      cryptography_scope: "opaque-client-produced-digests-and-verifier-bound-authorization",
      protocol_custody: "none",
      solana_binding: "not-present",
      economic_effect: "none",
      effect_authorized: false,
      authority_effect: "none",
      enforcement_effect: "none",
    },
  };
}

function build() {
  const binding = readJson(bindingPath);
  const { capability, ontology } = verifyPredecessors(binding);
  const options = {
    developmentProfileRegistry: {
      path: resolve(projectRoot, "development-profile.json"),
      handle: "knowledge-exchange-protocol-development-explicit-v0.1",
    },
  };
  const first = buildMintedProjectViews(projectRoot, options);
  const second = buildMintedProjectViews(projectRoot, options);
  assert(verifyMintedProjectBuild(projectRoot, first).status === "pass", "FIRST_BUILD_VERIFICATION_FAILED");
  assert(verifyMintedProjectBuild(projectRoot, second).status === "pass", "SECOND_BUILD_VERIFICATION_FAILED");
  for (const key of ["graphBytes", "sourceManifestBytes", "markdownBytes", "markdownViewBytes", "buildReceiptBytes"] as const) {
    assert(first[key] === second[key], `NON_DETERMINISTIC_BUILD:${key}`);
  }
  const firstCoverage = verifySemanticClosure(first.graph, capability, ontology);
  const secondCoverage = verifySemanticClosure(second.graph, capability, ontology);
  const firstSystemBytes = bytes(projectSystemOntology(first, binding, ontology, firstCoverage));
  const secondSystemBytes = bytes(projectSystemOntology(second, binding, ontology, secondCoverage));
  assert(firstSystemBytes === secondSystemBytes, "NON_DETERMINISTIC_SYSTEM_ONTOLOGY");

  const graphDigest = sha256(first.graphBytes);
  const systemDigest = sha256(firstSystemBytes);
  const bindingDigest = sha256(readFileSync(bindingPath));
  const receipt = {
    schema_version: "knowledge-exchange-protocol-system-ontology-projection/v3",
    status: "successor-candidate",
    deterministic_runs: 2,
    equal_graph_bytes: true,
    equal_system_ontology_bytes: true,
    predecessor_verification: "pass",
    semantic_coverage: "closed",
    field_level_definition_closure: "closed",
    construction_binding_digest: bindingDigest,
    source_graph_digest: graphDigest,
    system_ontology_digest: systemDigest,
    profile_id: first.buildReceipt.language.profile_id,
    profile_version: first.buildReceipt.language.profile_version,
    profile_digest: first.buildReceipt.language.profile_digest,
    profile_release_admission: "not-granted",
    checks: [
      { check_id: "admitted-predecessors-current", status: "PASS" },
      { check_id: "prior-system-ontology-preserved", status: "PASS" },
      { check_id: "domainspec-source-compiled", status: "PASS" },
      { check_id: "semantic-reference-closure", status: "PASS" },
      { check_id: "definition-field-closure", status: "PASS" },
      { check_id: "two-run-determinism", status: "PASS" },
      { check_id: "successor-system-ontology-admission", status: "not_evaluable", causal_blocker: "The successor ontology awaits a new immutable governance decision." },
      { check_id: "implementation-binding", status: "not_evaluable", causal_blocker: "D65 requires successor admission before Rust binding." },
    ],
    authority_effect: "none",
    enforcement_effect: "none",
    claim_limit: "Versioned correction candidate only; no admission, Rust implementation binding, conformance, Solana realization, publication, release, deployment, or external effect.",
  };
  const candidate = {
    schema_version: "knowledge-exchange-protocol-system-ontology-admission-candidate/v2",
    candidate_id: "CA2-CANDIDATE-KEP-SYSTEM-ONTOLOGY-002",
    ontology_id: "knowledge-exchange.system.encrypted-coownership",
    supersedes_decision_id: "CA2-DECISION-KEP-SYSTEM-ONTOLOGY-ADMISSION-001",
    source_graph_digest: graphDigest,
    system_ontology_digest: systemDigest,
    construction_binding_digest: bindingDigest,
    predecessor_bindings: binding.predecessors,
    correction_definition_ids: ["KEP-D4", "KEP-D6", "KEP-D11", "KEP-D12"],
    requested_decision: "admit-successor-system-ontology",
    requested_successor_authorization: "none",
    authority_effect: "none",
    external_effect: "none",
    claim_limit: "Candidate decision input only; a human decision must bind this exact successor digest before implementation binding begins.",
  };
  return {
    "graph.json": first.graphBytes,
    "source-manifest.json": first.sourceManifestBytes,
    "SPEC.md": first.markdownBytes,
    "markdown-view.json": first.markdownViewBytes,
    "build-receipt.json": first.buildReceiptBytes,
    "system-ontology.json": firstSystemBytes,
    "system-ontology-receipt.json": bytes(receipt),
    "system-ontology-admission-candidate.json": bytes(candidate),
  };
}

const artifacts = build();
if (process.argv.includes("--emit-json")) {
  process.stdout.write(bytes(artifacts));
} else {
  mkdirSync(generatedRoot, { recursive: true });
  for (const [name, content] of Object.entries(artifacts)) {
    writeFileSync(resolve(generatedRoot, name), content, "utf8");
  }
  process.stdout.write(`built=${Object.keys(artifacts).length}\n`);
}
