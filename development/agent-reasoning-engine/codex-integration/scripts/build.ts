import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildMintedProjectViews } from "../../../../../projects/domainspec-v2/impl/tools/minted-project/views";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDir, "..");
const repositoryRoot = resolve(packageRoot, "../../../..");
const projectRoot = resolve(packageRoot, "domainspec");
const generatedRoot = resolve(projectRoot, "generated");

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function bytes(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function verifySources() {
  const registry = JSON.parse(readFileSync(resolve(packageRoot, "sources.json"), "utf8"));
  const sources = registry?.sources as Array<{source_id: string; path: string; sha256: string}>;
  if (!Array.isArray(sources) || sources.length === 0) throw new Error("SOURCE_BINDINGS_MISSING");
  for (const source of sources) {
    const actual = sha256(readFileSync(resolve(repositoryRoot, source.path)));
    if (actual !== source.sha256) throw new Error(`SOURCE_BINDING_DRIFT:${source.source_id}:${actual}`);
  }
  return sources;
}

function build() {
  const sources = verifySources();
  const options = {developmentProfileRegistry:{path:resolve(projectRoot, "development-profile.json"),handle:"agent-reasoning-engine-development-explicit-v0.1"}};
  const first = buildMintedProjectViews(projectRoot, options);
  const second = buildMintedProjectViews(projectRoot, options);
  for (const key of ["graphBytes", "sourceManifestBytes", "markdownBytes", "markdownViewBytes", "buildReceiptBytes"] as const) {
    if (first[key] !== second[key]) throw new Error(`NON_DETERMINISTIC_DOMAINSPEC_BUILD:${key}`);
  }

  const compilerPath = resolve(repositoryRoot, "projects/domainspec-v2/impl/tools/minted-project/compiler.ts");
  const viewsPath = resolve(repositoryRoot, "projects/domainspec-v2/impl/tools/minted-project/views.ts");
  const builderPath = resolve(packageRoot, "scripts/build.ts");
  const validatorPath = resolve(packageRoot, "scripts/validate.py");
  const capabilityPath = resolve(packageRoot, "product-capability.json");
  const businessPath = resolve(packageRoot, "business-ontology.json");
  const bridgePath = resolve(packageRoot, "bridge.json");
  const interfacePath = resolve(packageRoot, "interfaces/codex-app-server-wrapper.contract.json");
  const decisionPath = resolve(packageRoot, "decisions/codex-app-server-boundary-selection.v1.json");
  const continuationDecisionPath = resolve(packageRoot, "decisions/continuation-source-model-selection.v1.json");
  const observationPath = resolve(packageRoot, "evidence/codex-app-server-protocol-observation.v1.json");
  const implementationBindingPath = resolve(packageRoot, "implementation-binding.v2.json");
  const implementationBinding = JSON.parse(readFileSync(implementationBindingPath, "utf8"));
  const conformanceAssessmentPath = resolve(packageRoot, "assessments/ARE-CODEX-CONFORMANCE-ASSESSMENT-002.json");
  const conformanceAssessment = JSON.parse(readFileSync(conformanceAssessmentPath, "utf8"));
  const acceptanceDecisionPath = resolve(packageRoot, "decisions/implementation-binding-002-acceptance.v1.json");
  const acceptanceDecision = JSON.parse(readFileSync(acceptanceDecisionPath, "utf8"));
  const routerPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-decision-router/index.mjs");
  const routerProfilePath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-decision-router/profiles/cyberalchemy-v1.json");
  const routerWitnessPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-decision-router/generated/witness-receipt.json");

  const systemOntology = {
    schema_version: "are.codex-request-governance-system-ontology/v1",
    ontology_id: "CA2-ARE-CODEX-SYSTEM-ONTOLOGY",
    ontology_type: "system-runtime",
    branch: "system",
    authority: "generated-system-ontology-read-model",
    authority_effect: "none",
    source_project_id: first.graph.project_id,
    source_set_digest: first.graph.source_set_digest,
    source_graph_digest: sha256(first.graphBytes),
    construction_inputs: sources,
    compiler: {
      id: "domainspec-v2-minted-project-tools",
      version: "minted-project-tools/v1",
      compiler_path: "projects/domainspec-v2/impl/tools/minted-project/compiler.ts",
      compiler_sha256: sha256(readFileSync(compilerPath)),
      views_path: "projects/domainspec-v2/impl/tools/minted-project/views.ts",
      views_sha256: sha256(readFileSync(viewsPath)),
      projection_builder_path: "cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/scripts/build.ts",
      projection_builder_sha256: sha256(readFileSync(builderPath)),
    },
    nodes: first.graph.nodes,
    edges: first.graph.edges,
    business_system_bridge: {
      business_ontology_ref: "cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/business-ontology.json",
      business_ontology_sha256: sha256(readFileSync(businessPath)),
      bridge_ref: "cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/bridge.json",
      bridge_sha256: sha256(readFileSync(bridgePath)),
    },
    implementation_contract: {
      product_capability_ref: "CA2-CAP-GOVERN-CODEX-REQUESTS",
      product_capability_sha256: sha256(readFileSync(capabilityPath)),
      selected_host_boundary_ref: "CA2-ARE-CODEX-INTERFACE-APP-SERVER-WRAPPER",
      host_boundary_selection_sha256: sha256(readFileSync(decisionPath)),
      continuation_source_selection_sha256: sha256(readFileSync(continuationDecisionPath)),
      host_interface_sha256: sha256(readFileSync(interfacePath)),
      protocol_observation_sha256: sha256(readFileSync(observationPath)),
      exact_implementation_binding: {
        binding_id: implementationBinding.binding_id,
        binding_ref: "cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/implementation-binding.v2.json",
        binding_sha256: sha256(readFileSync(implementationBindingPath)),
        binding_posture: implementationBinding.binding_posture,
        component_digests: implementationBinding.components.map((component: {component_id: string; sha256: string}) => ({component_id: component.component_id, sha256: component.sha256})),
        evidence_digests: implementationBinding.evidence.map((evidence: {evidence_id: string; sha256: string}) => ({evidence_id: evidence.evidence_id, sha256: evidence.sha256})),
        candidate_authoring_acceptance_state: implementationBinding.acceptance_state,
        effective_acceptance_state: acceptanceDecision.acceptance_state,
        conformance_state: implementationBinding.conformance_state,
      },
      conformance_assessment: {
        assessment_id: conformanceAssessment.assessment_id,
        assessment_ref: "cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/assessments/ARE-CODEX-CONFORMANCE-ASSESSMENT-002.json",
        assessment_sha256: sha256(readFileSync(conformanceAssessmentPath)),
        verdict: conformanceAssessment.verdict,
        acceptance_state: conformanceAssessment.acceptance_state,
      },
      acceptance_decision: {
        decision_id: acceptanceDecision.decision_id,
        decision_ref: "cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/decisions/implementation-binding-002-acceptance.v1.json",
        decision_sha256: sha256(readFileSync(acceptanceDecisionPath)),
        selected_option: acceptanceDecision.selected_option,
        acceptance_state: acceptanceDecision.acceptance_state,
        installation_state: acceptanceDecision.installation_state,
        authority_effect: acceptanceDecision.authority_effect,
      },
      request_decision_router: {
        implementation_sha256: sha256(readFileSync(routerPath)),
        profile_sha256: sha256(readFileSync(routerProfilePath)),
        witness_sha256: sha256(readFileSync(routerWitnessPath)),
        posture: "bounded-candidate-evidence"
      },
      app_server_wrapper_status: "implemented-accepted-not-installed",
      accepted_baseline_required: false,
      accepted_baseline_ref: "cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/decisions/implementation-binding-002-acceptance.v1.json",
      implementation_binding_status: "accepted-exact-binding",
      static_conformance_status: "assessed-conformant-candidate",
      runtime_evidence_status: "controlled-live-canary-pass",
      validator_sha256: sha256(readFileSync(validatorPath)),
      authority_effect: "none"
    },
    claim_limit: "Generated system read model projects the accepted exact-byte binding 002, assessment 002, and bounded live evidence. It does not install the wrapper, adopt the Product Capability, admit a DomainSpec profile or ontology, publish, release, deploy, or authorize general external effects."
  };
  const systemOntologyBytes = bytes(systemOntology);
  const projectionReceipt = {
    schema_version: "are.codex-request-governance-system-ontology-projection/v1",
    status: "candidate",
    deterministic_runs: 2,
    equal_graph_bytes: true,
    equal_system_ontology_bytes: true,
    source_graph_digest: sha256(first.graphBytes),
    system_ontology_digest: sha256(systemOntologyBytes),
    profile_id: first.buildReceipt.language.profile_id,
    profile_version: first.buildReceipt.language.profile_version,
    profile_digest: first.buildReceipt.language.profile_digest,
    profile_release_admission: "not-granted",
    host_boundary_selection: "codex-app-server-wrapper",
    adapter_implementation_status: "implemented-accepted-not-installed",
    implementation_binding_status: "accepted-exact-binding",
    acceptance_decision_digest: sha256(readFileSync(acceptanceDecisionPath)),
    static_conformance_status: "assessed-conformant-candidate",
    runtime_evidence_status: "controlled-live-canary-pass",
    authority_effect: "none",
    claim_limit: "Two-run deterministic projection of accepted exact-byte binding 002 and candidate conformance assessment 002; no installation, Product Capability adoption, DomainSpec admission, publication, release, deployment, or general external effect."
  };

  return {
    "graph.json": first.graphBytes,
    "source-manifest.json": first.sourceManifestBytes,
    "SPEC.md": first.markdownBytes,
    "markdown-view.json": first.markdownViewBytes,
    "build-receipt.json": first.buildReceiptBytes,
    "system-ontology.json": systemOntologyBytes,
    "system-ontology-receipt.json": bytes(projectionReceipt)
  };
}

const artifacts = build();
if (process.argv.includes("--emit-json")) {
  process.stdout.write(bytes(artifacts));
} else {
  mkdirSync(generatedRoot, {recursive:true});
  for (const [name, content] of Object.entries(artifacts)) writeFileSync(resolve(generatedRoot, name), content, "utf8");
  process.stdout.write(`built=${Object.keys(artifacts).length}\n`);
}
