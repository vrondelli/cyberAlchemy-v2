import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildMintedProjectViews,
  verifyMintedProjectBuild,
} from "../../../../projects/domainspec-v2/impl/tools/minted-project/views";

type JsonObject = Record<string, any>;

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDir, "..");
const projectRoot = resolve(packageRoot, "domainspec");
const generatedRoot = resolve(projectRoot, "generated");
const constructionBindingPath = resolve(projectRoot, "construction-binding.json");

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function bytes(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
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

function resolvePredecessor(path: string): string {
  return resolve(packageRoot, path);
}

function verifyPredecessors(binding: JsonObject): {
  decision: JsonObject;
  capability: JsonObject;
  ontology: JsonObject;
  selectedDefinitionIds: string[];
} {
  assert(binding.schema_version === "cav2-d65-domainspec-construction-binding/v1", "CONSTRUCTION_BINDING_SCHEMA_INVALID");
  assert(binding.route_id === "CA2-ROUTE-IMPLEMENT", "CONSTRUCTION_ROUTE_INVALID");
  const predecessors = binding.predecessors as JsonObject;
  assert(predecessors, "CONSTRUCTION_PREDECESSORS_MISSING");

  for (const name of ["canonical_definitions", "product_capability", "business_ontology", "admission_decision"]) {
    const predecessor = predecessors[name] as JsonObject;
    assert(predecessor?.path && predecessor?.sha256, `PREDECESSOR_BINDING_MISSING:${name}`);
    const actual = sha256(readFileSync(resolvePredecessor(predecessor.path)));
    assert(actual === predecessor.sha256, `PREDECESSOR_DIGEST_DRIFT:${name}:${actual}`);
  }

  const decision = readJson(resolvePredecessor(predecessors.admission_decision.path));
  const capability = readJson(resolvePredecessor(predecessors.product_capability.path));
  const ontology = readJson(resolvePredecessor(predecessors.business_ontology.path));
  const selectedDefinitionIds = predecessors.canonical_definitions.selected_ids as string[];

  assert(decision.decision_id === predecessors.admission_decision.decision_id, "ADMISSION_DECISION_ID_MISMATCH");
  assert(decision.ontology_id === predecessors.business_ontology.ontology_id, "ADMISSION_ONTOLOGY_ID_MISMATCH");
  assert(decision.admitted_artifacts?.definitions?.sha256 === predecessors.canonical_definitions.sha256, "ADMITTED_DEFINITION_DIGEST_MISMATCH");
  assert(decision.admitted_artifacts?.product_capability?.sha256 === predecessors.product_capability.sha256, "ADMITTED_CAPABILITY_DIGEST_MISMATCH");
  assert(decision.admitted_artifacts?.business_ontology?.sha256 === predecessors.business_ontology.sha256, "ADMITTED_ONTOLOGY_DIGEST_MISMATCH");
  assert(sameMembers(decision.admitted_artifacts?.definitions?.selected_ids ?? [], selectedDefinitionIds), "ADMITTED_DEFINITION_SELECTION_MISMATCH");

  assert(capability.capability_id === predecessors.product_capability.capability_id, "CAPABILITY_ID_MISMATCH");
  assert(capability.business_ontology_ref === predecessors.business_ontology.ontology_id, "CAPABILITY_ONTOLOGY_BINDING_MISMATCH");
  assert(capability.lifecycle_posture?.status?.value === "adopted", "PRODUCT_CAPABILITY_NOT_ADOPTED");

  assert(ontology.ontology_id === predecessors.business_ontology.ontology_id, "BUSINESS_ONTOLOGY_ID_MISMATCH");
  assert(ontology.capability_ref === predecessors.product_capability.capability_id, "ONTOLOGY_CAPABILITY_BINDING_MISMATCH");
  assert(ontology.lifecycle_status === predecessors.business_ontology.required_lifecycle_status, "BUSINESS_ONTOLOGY_NOT_ADMITTED");
  assert(ontology.definition_source?.sha256 === predecessors.canonical_definitions.sha256, "ONTOLOGY_DEFINITION_DIGEST_MISMATCH");
  assert(sameMembers(ontology.definition_source?.definition_ids ?? [], selectedDefinitionIds), "ONTOLOGY_DEFINITION_SELECTION_MISMATCH");
  assert(sameMembers((ontology.definition_bindings ?? []).map((entry: JsonObject) => entry.definition_id), selectedDefinitionIds), "ONTOLOGY_DEFINITION_BINDING_CLOSURE_FAILED");

  return { decision, capability, ontology, selectedDefinitionIds };
}

function verifySemanticCoverage(
  graph: JsonObject,
  capability: JsonObject,
  ontology: JsonObject,
  selectedDefinitionIds: string[],
): { definitionRefs: string[]; semanticRefs: string[]; requiredSemanticRefs: string[] } {
  const definitionRefs = sortedUnique(graph.nodes.flatMap((node: JsonObject) => node.body?.definition_refs ?? []));
  const semanticRefs = sortedUnique(graph.nodes.flatMap((node: JsonObject) => node.body?.semantic_refs ?? []));
  const ontologyNodeIds = (ontology.nodes ?? []).map((node: JsonObject) => node.id);
  const ruleIds = (ontology.rules ?? []).map((rule: JsonObject) => rule.rule_id);
  const proofIds = (ontology.proof_requirements ?? []).map((proof: JsonObject) => proof.proof_id);
  const admittedSemanticRefs = sortedUnique([
    capability.capability_id,
    ...ontologyNodeIds,
    ...ruleIds,
    ...proofIds,
  ]);
  const requiredSemanticRefs = sortedUnique([
    capability.capability_id,
    ...(ontology.definition_bindings ?? []).flatMap((entry: JsonObject) => entry.ontology_refs),
    ...ruleIds,
    ...proofIds,
  ]);

  assert(sameMembers(definitionRefs, selectedDefinitionIds), "DOMAINSPEC_DEFINITION_COVERAGE_FAILED");
  const unknownRefs = semanticRefs.filter((ref) => !admittedSemanticRefs.includes(ref));
  assert(unknownRefs.length === 0, `DOMAINSPEC_UNKNOWN_SEMANTIC_REFS:${unknownRefs.join(",")}`);
  const missingRefs = requiredSemanticRefs.filter((ref) => !semanticRefs.includes(ref));
  assert(missingRefs.length === 0, `DOMAINSPEC_SEMANTIC_COVERAGE_FAILED:${missingRefs.join(",")}`);
  assert(graph.nodes.every((node: JsonObject) => node.body?.authority_effect === "none"), "DOMAINSPEC_NODE_AUTHORITY_EFFECT_INVALID");

  return { definitionRefs, semanticRefs, requiredSemanticRefs };
}

function projectSystemOntology(
  built: ReturnType<typeof buildMintedProjectViews>,
  binding: JsonObject,
  ontology: JsonObject,
  coverage: { definitionRefs: string[]; semanticRefs: string[]; requiredSemanticRefs: string[] },
): JsonObject {
  const compilerPath = resolve(packageRoot, "../../../projects/domainspec-v2/impl/tools/minted-project/compiler.ts");
  const viewsPath = resolve(packageRoot, "../../../projects/domainspec-v2/impl/tools/minted-project/views.ts");
  return {
    schema_version: "knowledge-exchange-protocol-system-ontology/v2",
    ontology_id: "knowledge-exchange.system.encrypted-coownership",
    ontology_type: "system",
    lifecycle_status: "candidate",
    authority: "generated-system-ontology-read-model",
    authority_effect: "none",
    enforcement_effect: "none",
    predecessor_bindings: binding.predecessors,
    construction_binding: {
      binding_id: binding.binding_id,
      path: "domainspec/construction-binding.json",
      sha256: sha256(readFileSync(constructionBindingPath)),
    },
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
    semantic_coverage: {
      selected_definition_ids: coverage.definitionRefs,
      required_semantic_refs: coverage.requiredSemanticRefs,
      authored_semantic_refs: coverage.semanticRefs,
      business_rule_ids: (ontology.rules ?? []).map((rule: JsonObject) => rule.rule_id).sort(),
      proof_requirement_ids: (ontology.proof_requirements ?? []).map((proof: JsonObject) => proof.proof_id).sort(),
      status: "closed",
    },
    nodes: built.graph.nodes,
    edges: built.graph.edges,
    implementation_contract: {
      product_capability_ref: binding.predecessors.product_capability.capability_id,
      business_ontology_ref: binding.predecessors.business_ontology.ontology_id,
      implementation_target_ref: "cyberAlchemy-v2/product/knowledge-exchange-protocol/runtime/src/lib.rs",
      implementation_language: "rust",
      implementation_binding_status: "blocked-pending-system-ontology-admission",
      permitted_operations: [
        "grant_coownership",
        "acknowledge_decryption",
        "reissue_lost_key",
        "rotate_compromised_epoch",
      ],
      invariant_refs: (ontology.rules ?? []).map((rule: JsonObject) => rule.rule_id).sort(),
      proof_obligation_refs: (ontology.proof_requirements ?? []).map((proof: JsonObject) => proof.proof_id).sort(),
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
  const binding = readJson(constructionBindingPath);
  const { capability, ontology, selectedDefinitionIds } = verifyPredecessors(binding);
  const options = {
    developmentProfileRegistry: {
      path: resolve(projectRoot, "development-profile.json"),
      handle: "knowledge-exchange-protocol-development-explicit-v0.1",
    },
  };
  const first = buildMintedProjectViews(projectRoot, options);
  const second = buildMintedProjectViews(projectRoot, options);
  const firstVerification = verifyMintedProjectBuild(projectRoot, first);
  const secondVerification = verifyMintedProjectBuild(projectRoot, second);
  assert(firstVerification.status === "pass", `DOMAINSPEC_BUILD_VERIFICATION_FAILED:${firstVerification.codes.join(",")}`);
  assert(secondVerification.status === "pass", `DOMAINSPEC_BUILD_VERIFICATION_FAILED:${secondVerification.codes.join(",")}`);
  for (const key of ["graphBytes", "sourceManifestBytes", "markdownBytes", "markdownViewBytes", "buildReceiptBytes"] as const) {
    assert(first[key] === second[key], `NON_DETERMINISTIC_DOMAINSPEC_BUILD:${key}`);
  }

  const firstCoverage = verifySemanticCoverage(first.graph, capability, ontology, selectedDefinitionIds);
  const secondCoverage = verifySemanticCoverage(second.graph, capability, ontology, selectedDefinitionIds);
  const firstSystemOntologyBytes = bytes(projectSystemOntology(first, binding, ontology, firstCoverage));
  const secondSystemOntologyBytes = bytes(projectSystemOntology(second, binding, ontology, secondCoverage));
  assert(firstSystemOntologyBytes === secondSystemOntologyBytes, "NON_DETERMINISTIC_SYSTEM_ONTOLOGY_BUILD");

  const graphDigest = sha256(first.graphBytes);
  const systemOntologyDigest = sha256(firstSystemOntologyBytes);
  const projectionReceipt = {
    schema_version: "knowledge-exchange-protocol-system-ontology-projection/v2",
    status: "candidate",
    deterministic_runs: 2,
    equal_graph_bytes: true,
    equal_system_ontology_bytes: true,
    predecessor_verification: "pass",
    semantic_coverage: "closed",
    construction_binding_digest: sha256(readFileSync(constructionBindingPath)),
    source_graph_digest: graphDigest,
    system_ontology_digest: systemOntologyDigest,
    profile_id: first.buildReceipt.language.profile_id,
    profile_version: first.buildReceipt.language.profile_version,
    profile_digest: first.buildReceipt.language.profile_digest,
    profile_release_admission: "not-granted",
    checks: [
      { check_id: "canonical-definitions-current", status: "PASS" },
      { check_id: "product-capability-adopted", status: "PASS" },
      { check_id: "business-ontology-admitted", status: "PASS" },
      { check_id: "domainspec-source-compiled", status: "PASS" },
      { check_id: "semantic-reference-closure", status: "PASS" },
      { check_id: "two-run-determinism", status: "PASS" },
      { check_id: "system-ontology-admission", status: "not_evaluable", causal_blocker: "The generated system ontology is a candidate awaiting a separate immutable governance decision." },
      { check_id: "implementation-binding", status: "not_evaluable", causal_blocker: "CAV2-D65 requires system-ontology admission before an exact Rust implementation binding." },
      { check_id: "conformance", status: "not_evaluable", causal_blocker: "No admitted system ontology or post-admission Rust binding exists." },
    ],
    authority_effect: "none",
    enforcement_effect: "none",
    claim_limit: "Deterministic DomainSpec v2 and system-ontology candidate only; no system-ontology admission, Rust implementation binding, conformance, cryptographic security, Solana binding, publication, release, deployment, or external effect.",
  };
  const admissionCandidate = {
    schema_version: "knowledge-exchange-protocol-system-ontology-admission-candidate/v1",
    candidate_id: "CA2-CANDIDATE-KEP-SYSTEM-ONTOLOGY-001",
    ontology_id: "knowledge-exchange.system.encrypted-coownership",
    source_graph_digest: graphDigest,
    system_ontology_digest: systemOntologyDigest,
    construction_binding_digest: sha256(readFileSync(constructionBindingPath)),
    predecessor_bindings: binding.predecessors,
    requested_decision: "admit-system-ontology",
    requested_successor_authorization: "none",
    authority_effect: "none",
    external_effect: "none",
    claim_limit: "Candidate decision input only. A human decision must bind this exact system-ontology digest before implementation binding begins.",
  };

  return {
    "graph.json": first.graphBytes,
    "source-manifest.json": first.sourceManifestBytes,
    "SPEC.md": first.markdownBytes,
    "markdown-view.json": first.markdownViewBytes,
    "build-receipt.json": first.buildReceiptBytes,
    "system-ontology.json": firstSystemOntologyBytes,
    "system-ontology-receipt.json": bytes(projectionReceipt),
    "system-ontology-admission-candidate.json": bytes(admissionCandidate),
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
