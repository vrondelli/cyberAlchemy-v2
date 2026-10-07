import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildMintedProjectViews } from "../../craft/projects/domainspec-v2/impl/tools/minted-project/views";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDir, "..");
const repositoryRoot = resolve(packageRoot, "../..");
const projectRoot = resolve(packageRoot, "domainspec");
const generatedRoot = resolve(projectRoot, "generated");

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function bytes(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

type SourceBinding = {
  id: string;
  path: string;
  scope_kind: "whole-file" | "heading-section";
  selector: string | null;
  sha256: string;
  role: string;
  branch: string;
};

function headingSection(path: string, selector: string): Buffer {
  const lines = readFileSync(path, "utf8").match(/.*(?:\r?\n|$)/g)?.filter(Boolean) ?? [];
  const start = lines.findIndex((line) => line.replace(/\r?\n$/, "") === selector);
  if (start < 0) throw new Error(`SEMANTIC_SELECTOR_NOT_FOUND:${selector}`);
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (lines[index].startsWith("## ")) {
      end = index;
      break;
    }
  }
  return Buffer.from(lines.slice(start, end).join(""));
}

function verifySources(): SourceBinding[] {
  const registry = JSON.parse(readFileSync(resolve(packageRoot, "sources.json"), "utf8"));
  const sources = registry?.sources as SourceBinding[];
  if (!Array.isArray(sources) || sources.length === 0) throw new Error("SOURCE_BINDINGS_MISSING");
  for (const source of sources) {
    const path = resolve(repositoryRoot, source.path);
    const selected = source.scope_kind === "whole-file"
      ? readFileSync(path)
      : headingSection(path, String(source.selector));
    const actual = sha256(selected);
    if (actual !== source.sha256) throw new Error(`SOURCE_BINDING_DRIFT:${source.id}:${actual}`);
  }
  return sources;
}

function build() {
  const sources = verifySources();
  const options = {
    developmentProfileRegistry: {
      path: resolve(projectRoot, "development-profile.json"),
      handle: "agent-reasoning-engine-development-explicit-v0.1",
    },
  };
  const first = buildMintedProjectViews(projectRoot, options);
  const second = buildMintedProjectViews(projectRoot, options);
  for (const key of ["graphBytes", "sourceManifestBytes", "markdownBytes", "markdownViewBytes", "buildReceiptBytes"] as const) {
    if (first[key] !== second[key]) throw new Error(`NON_DETERMINISTIC_DOMAINSPEC_BUILD:${key}`);
  }

  const compilerPath = resolve(repositoryRoot, "cyberAlchemy-v2/craft/projects/domainspec-v2/impl/tools/minted-project/compiler.ts");
  const viewsPath = resolve(repositoryRoot, "cyberAlchemy-v2/craft/projects/domainspec-v2/impl/tools/minted-project/views.ts");
  const builderPath = resolve(packageRoot, "scripts/build.ts");
  const validatorPath = resolve(packageRoot, "scripts/validate.py");
  const bridgePath = resolve(packageRoot, "bridge.json");
  const capabilityPath = resolve(packageRoot, "product-capability.json");
  const businessPath = resolve(packageRoot, "business-ontology.json");
  const evaluatorPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/README.md");
  const contextSemanticAdapterPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/src/context-envelope.mjs");
  const semanticReducerPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/src/reducer.mjs");
  const semanticReceiptPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/src/receipt.mjs");
  const semanticContextTestPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/test/context-envelope-integration.test.mjs");
  const resolverPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/package.json");
  const requestDecisionPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-decision-router/index.mjs");
  const requestDecisionProfilePath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-decision-router/profiles/cyberalchemy-v1.json");
  const requestDecisionWitnessPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-decision-router/generated/witness-receipt.json");
  const contextLifecyclePath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/context-basis-runtime/index.mjs");
  const codexWrapperPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/index.mjs");
  const semanticInputRuntimePath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/semantic-input-runtime/README.md");
  const runtimeJournalPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/runtime-journal/index.mjs");
  const receiptConstraintsPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/reasoning-receipt-constraints.mjs");
  const journaledWrapperPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/wrapper.mjs");
  const reasoningStateRuntimePath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/reasoning-state-runtime/index.mjs");
  const semanticCanaryPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/semantic-continuation-canary.mjs");
  const persistentGatewayPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/gateway.mjs");
  const gatewayBackendPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/backend.mjs");
  const gatewayCanaryPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/persistent-gateway-canary.mjs");
  const evolutionRuntimePath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs");
  const evolutionVariantWorkspacePath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/src/variant-workspace.mjs");
  const evolutionUpgradeControllerPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/src/upgrade-controller.mjs");
  const evolutionOperationsTestPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/test/operations.test.mjs");
  const evolutionProtocolPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/src/protocol-v1.mjs");
  const evolutionProtocolSchemaPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/schemas/protocol-v1.schema.json");
  const evolutionCycleDefinitionSchemaPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/schemas/cycle-definition-v1.schema.json");
  const evolutionCyclePolicySchemaPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/schemas/cycle-policies-v1.schema.json");
  const evolutionCycleRegistryPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/registry/cycle-definitions.v1.json");
  const evolutionProtocolTestPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/test/protocol-v1.test.mjs");
  const evolutionDurableKernelPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/src/durable-kernel-v1.mjs");
  const evolutionDurableKernelCliPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/bin/kernel.mjs");
  const evolutionDurableKernelTestPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/test/durable-kernel-v1.test.mjs");
  const evolutionDurableKernelFixturePath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/fixtures/durable-kernel-v1/three-layer-snapshot.json");
  const evolutionBenchmarkBridgePath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/benchmarks/real-reasoning-v1/src/evolution-bridge.mjs");
  const evolutionCanaryPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/benchmarks/real-reasoning-v1/bin/evolution-canary.mjs");
  const codexEvolutionSignalsPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/evolution-signals.mjs");

  const systemOntology = {
    schema_version: "cav2-agent-reasoning-engine-system-ontology/v1",
    ontology_id: "cav2.agent-reasoning-engine.system.v1",
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
      compiler_path: "cyberAlchemy-v2/craft/projects/domainspec-v2/impl/tools/minted-project/compiler.ts",
      compiler_sha256: sha256(readFileSync(compilerPath)),
      views_path: "cyberAlchemy-v2/craft/projects/domainspec-v2/impl/tools/minted-project/views.ts",
      views_sha256: sha256(readFileSync(viewsPath)),
      projection_builder_path: "cyberAlchemy-v2/agent-reasoning-engine/scripts/build.ts",
      projection_builder_sha256: sha256(readFileSync(builderPath)),
    },
    nodes: first.graph.nodes,
    edges: first.graph.edges,
    business_system_bridge: {
      business_ontology_ref: "cyberAlchemy-v2/agent-reasoning-engine/business-ontology.json",
      business_ontology_sha256: sha256(readFileSync(businessPath)),
      bridge_ref: "cyberAlchemy-v2/agent-reasoning-engine/bridge.json",
      bridge_sha256: sha256(readFileSync(bridgePath)),
    },
    implementation_contract: {
      product_capability_ref: "CA2-CAP-REASON-AND-MANAGE-CONTEXT",
      product_capability_path: "cyberAlchemy-v2/agent-reasoning-engine/product-capability.json",
      product_capability_sha256: sha256(readFileSync(capabilityPath)),
      implementation_target_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine",
      bounded_partial_realizations: [
        {
          id: "semantic-judgment-evaluator@1",
          evidence_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/README.md",
          evidence_sha256: sha256(readFileSync(evaluatorPath)),
          context_envelope_adapter_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/src/context-envelope.mjs",
          context_envelope_adapter_sha256: sha256(readFileSync(contextSemanticAdapterPath)),
        },
        {
          id: "context-bound-semantic-integrity@1",
          reducer_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/src/reducer.mjs",
          reducer_sha256: sha256(readFileSync(semanticReducerPath)),
          receipt_assembler_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/src/receipt.mjs",
          receipt_assembler_sha256: sha256(readFileSync(semanticReceiptPath)),
          integration_test_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/test/context-envelope-integration.test.mjs",
          integration_test_sha256: sha256(readFileSync(semanticContextTestPath)),
          cross_record_binding_verification: true,
          context_identity_receipt_binding: true,
          historical_unbound_receipt_compatibility: true,
          authority_effect: "none",
        },
        {
          id: "intent-route-resolver@1",
          evidence_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/package.json",
          evidence_sha256: sha256(readFileSync(resolverPath)),
        },
        {
          id: "request-decision-router@1",
          evidence_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-decision-router/index.mjs",
          evidence_sha256: sha256(readFileSync(requestDecisionPath)),
          profile_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-decision-router/profiles/cyberalchemy-v1.json",
          profile_sha256: sha256(readFileSync(requestDecisionProfilePath)),
          witness_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-decision-router/generated/witness-receipt.json",
          witness_sha256: sha256(readFileSync(requestDecisionWitnessPath)),
        },
        {
          id: "context-basis-runtime@1",
          evidence_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/context-basis-runtime/index.mjs",
          evidence_sha256: sha256(readFileSync(contextLifecyclePath)),
        },
        {
          id: "codex-app-server-wrapper@2",
          evidence_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/index.mjs",
          evidence_sha256: sha256(readFileSync(codexWrapperPath)),
        },
        {
          id: "semantic-input-runtime@1",
          evidence_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/semantic-input-runtime/README.md",
          evidence_sha256: sha256(readFileSync(semanticInputRuntimePath)),
          adopted_production_catalog: false,
        },
        {
          id: "runtime-journal@1",
          evidence_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/runtime-journal/index.mjs",
          evidence_sha256: sha256(readFileSync(runtimeJournalPath)),
          durable_storage: false,
        },
        {
          id: "reasoning-receipt-constraints@1",
          evidence_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/reasoning-receipt-constraints.mjs",
          evidence_sha256: sha256(readFileSync(receiptConstraintsPath)),
          wrapper_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/wrapper.mjs",
          wrapper_sha256: sha256(readFileSync(journaledWrapperPath)),
        },
        {
          id: "reasoning-state-runtime@1",
          evidence_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/reasoning-state-runtime/index.mjs",
          evidence_sha256: sha256(readFileSync(reasoningStateRuntimePath)),
          append_only_events: true,
          content_addressed_epochs: true,
          exact_dispatch_reconstruction: true,
          checkpoint_postures: ["process-memory", "append-only-file-fsync"],
          file_log_recovery: false,
          authority_effect: "none",
        },
        {
          id: "reasoning-state-recovery@1",
          evidence_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/reasoning-state-runtime/index.mjs",
          evidence_sha256: sha256(readFileSync(reasoningStateRuntimePath)),
          wrapper_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/wrapper.mjs",
          wrapper_sha256: sha256(readFileSync(journaledWrapperPath)),
          canonical_log_verification: true,
          deterministic_disposable_index_rebuild: true,
          final_checkpoint_required: true,
          source_recheck_before_hydration: true,
          external_calls_during_recovery: 0,
          log_repair: false,
          cross_process_coordination: false,
          authority_effect: "none",
        },
        {
          id: "completed-turn-reasoning-frontier@1",
          evidence_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/reasoning-state-runtime/index.mjs",
          evidence_sha256: sha256(readFileSync(reasoningStateRuntimePath)),
          wrapper_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/wrapper.mjs",
          wrapper_sha256: sha256(readFileSync(journaledWrapperPath)),
          append_only_frontier: true,
          exact_subject_binding: true,
          after_completion_checkpoint: true,
          recovery_replay_external_calls: 0,
          automatic_successor_delivery: "at-most-once-no-retry-after-recovery",
          delivery_acknowledgement: false,
          authority_effect: "none",
        },
        {
          id: "semantic-continuation-live-canary@1",
          evidence_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/semantic-continuation-canary.mjs",
          evidence_sha256: sha256(readFileSync(semanticCanaryPath)),
          authority_effect: "none",
        },
        {
          id: "persistent-codex-gateway@1",
          evidence_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/gateway.mjs",
          evidence_sha256: sha256(readFileSync(persistentGatewayPath)),
          backend_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/backend.mjs",
          backend_sha256: sha256(readFileSync(gatewayBackendPath)),
          durable_storage: false,
        },
        {
          id: "persistent-gateway-live-canary@1",
          evidence_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/scripts/persistent-gateway-canary.mjs",
          evidence_sha256: sha256(readFileSync(gatewayCanaryPath)),
          managed_daemon_mutated: false,
          authority_effect: "none",
        },
        {
          id: "evolution-runtime@1",
          evidence_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs",
          evidence_sha256: sha256(readFileSync(evolutionRuntimePath)),
          variant_workspace_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/src/variant-workspace.mjs",
          variant_workspace_sha256: sha256(readFileSync(evolutionVariantWorkspacePath)),
          upgrade_controller_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/src/upgrade-controller.mjs",
          upgrade_controller_sha256: sha256(readFileSync(evolutionUpgradeControllerPath)),
          operations_test_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/test/operations.test.mjs",
          operations_test_sha256: sha256(readFileSync(evolutionOperationsTestPath)),
          append_only_records: true,
          content_addressed_variants: true,
          single_writer_workspaces: true,
          recommend_only_default: true,
          canary_rollback: true,
          authority_effect: "none",
        },
        {
          id: "multi-cycle-evolution-protocol@1",
          evidence_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/src/protocol-v1.mjs",
          evidence_sha256: sha256(readFileSync(evolutionProtocolPath)),
          protocol_schema_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/schemas/protocol-v1.schema.json",
          protocol_schema_sha256: sha256(readFileSync(evolutionProtocolSchemaPath)),
          cycle_definition_schema_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/schemas/cycle-definition-v1.schema.json",
          cycle_definition_schema_sha256: sha256(readFileSync(evolutionCycleDefinitionSchemaPath)),
          cycle_policy_schema_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/schemas/cycle-policies-v1.schema.json",
          cycle_policy_schema_sha256: sha256(readFileSync(evolutionCyclePolicySchemaPath)),
          candidate_registry_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/registry/cycle-definitions.v1.json",
          candidate_registry_sha256: sha256(readFileSync(evolutionCycleRegistryPath)),
          protocol_test_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/test/protocol-v1.test.mjs",
          protocol_test_sha256: sha256(readFileSync(evolutionProtocolTestPath)),
          closed_json_boundaries: true,
          direct_state_assignment: false,
          candidate_definition_count: 5,
          admitted_definition_count: 0,
          enabled_definition_count: 0,
          durable_storage: false,
          authority_effect: "none",
        },
        {
          id: "multi-cycle-evolution-durable-kernel@1",
          evidence_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/src/durable-kernel-v1.mjs",
          evidence_sha256: sha256(readFileSync(evolutionDurableKernelPath)),
          json_cli_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/bin/kernel.mjs",
          json_cli_sha256: sha256(readFileSync(evolutionDurableKernelCliPath)),
          recovery_test_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/test/durable-kernel-v1.test.mjs",
          recovery_test_sha256: sha256(readFileSync(evolutionDurableKernelTestPath)),
          projection_fixture_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/fixtures/durable-kernel-v1/three-layer-snapshot.json",
          projection_fixture_sha256: sha256(readFileSync(evolutionDurableKernelFixturePath)),
          atomic_commit_visibility: true,
          append_only_event_and_receipt_entries: true,
          content_addressed_objects: true,
          disposable_sqlite_index: true,
          projection_layer_count: 3,
          cycle_admission_changed: false,
          external_execution: false,
          authority_effect: "none",
        },
        {
          id: "benchmark-evolution-cycle@1",
          evidence_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/benchmarks/real-reasoning-v1/src/evolution-bridge.mjs",
          evidence_sha256: sha256(readFileSync(evolutionBenchmarkBridgePath)),
          canary_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/benchmarks/real-reasoning-v1/bin/evolution-canary.mjs",
          canary_sha256: sha256(readFileSync(evolutionCanaryPath)),
          deterministic_full_cycle_fixture: true,
          default_upgrade_disposition: "recommend-only",
          authority_effect: "none",
        },
        {
          id: "codex-evolution-signal-emission@1",
          evidence_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/evolution-signals.mjs",
          evidence_sha256: sha256(readFileSync(codexEvolutionSignalsPath)),
          wrapper_ref: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/wrapper.mjs",
          wrapper_sha256: sha256(readFileSync(journaledWrapperPath)),
          default_enabled: false,
          duplicate_completion_emission: false,
          authority_effect: "none",
        },
      ],
      context_management_realization: "bounded-serving-and-measured-evolution-candidate",
      whole_engine_realization: "absent",
      accepted_baseline_required: true,
      accepted_baseline_ref: null,
      implementation_binding_status: "not_evaluable",
      static_conformance_status: "not_evaluable",
      runtime_evidence_status: "not_evaluable",
      validator_ref: "cyberAlchemy-v2/agent-reasoning-engine/scripts/validate.py",
      validator_sha256: sha256(readFileSync(validatorPath)),
      authority_effect: "none",
    },
    claim_limit: "Generated candidate system model and bounded partial-realization bindings only; no profile or system-ontology admission, complete reasoning or context-management runtime, implementation binding, conformance, publication, release, deployment, or external effect.",
  };
  const systemOntologyBytes = bytes(systemOntology);
  const projectionReceipt = {
    schema_version: "cav2-agent-reasoning-engine-system-ontology-projection/v1",
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
    implementation_binding_status: "not_evaluable",
    static_conformance_status: "not_evaluable",
    runtime_evidence_status: "not_evaluable",
    authority_effect: "none",
    claim_limit: "Two-run deterministic candidate projection only; no profile or system-ontology admission, implementation acceptance, conformance, publication, release, deployment, or external effect.",
  };

  return {
    "graph.json": first.graphBytes,
    "source-manifest.json": first.sourceManifestBytes,
    "SPEC.md": first.markdownBytes,
    "markdown-view.json": first.markdownViewBytes,
    "build-receipt.json": first.buildReceiptBytes,
    "system-ontology.json": systemOntologyBytes,
    "system-ontology-receipt.json": bytes(projectionReceipt),
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
