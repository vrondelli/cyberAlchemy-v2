import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { MintedProjectCompilerError } from "../../../../impl/tools/minted-project/compiler.ts";
import {
  buildMintedProjectViews,
  verifyMintedProjectBuild,
  type MintedProjectBuildArtifacts,
} from "../../../../impl/tools/minted-project/views.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const developmentDir = resolve(scriptDir, "..");
const experimentRoot = resolve(developmentDir, "..");
const domainspecRoot = resolve(experimentRoot, "../..");
const repositoryRoot = resolve(domainspecRoot, "../..");

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function artifactBytes(artifacts: MintedProjectBuildArtifacts): string[] {
  return [
    artifacts.graphBytes,
    artifacts.sourceManifestBytes,
    artifacts.markdownBytes,
    artifacts.markdownViewBytes,
    artifacts.buildReceiptBytes,
  ];
}

function byteEqual(left: MintedProjectBuildArtifacts, right: MintedProjectBuildArtifacts): boolean {
  return artifactBytes(left).every((bytes, index) => bytes === artifactBytes(right)[index]);
}

function compileErrorCode(projectRoot: string): string | null {
  try {
    buildMintedProjectViews(projectRoot);
    return null;
  } catch (error) {
    if (error instanceof MintedProjectCompilerError) return error.code;
    throw error;
  }
}

const positiveRoot = resolve(developmentDir, "fixtures/positive");
const unsupportedWorkflowRoot = resolve(developmentDir, "fixtures/hostile/unsupported-workflow");
const sourceShortcutRoot = resolve(developmentDir, "fixtures/hostile/source-shortcut");

const first = buildMintedProjectViews(positiveRoot);
const second = buildMintedProjectViews(positiveRoot);
const positiveVerification = verifyMintedProjectBuild(positiveRoot, first);

const unsupportedWorkflowCode = compileErrorCode(unsupportedWorkflowRoot);
const sourceShortcut = buildMintedProjectViews(sourceShortcutRoot);
const sourceShortcutVerification = verifyMintedProjectBuild(sourceShortcutRoot, sourceShortcut);

const catalog = JSON.parse(
  readFileSync(resolve(repositoryRoot, "arcanum/spells/invoke/invoke-cli-stage-catalog.json"), "utf8"),
) as { modes: { define: { stages: Record<string, { operations: string[] }> } } };
const liveStages = Object.keys(catalog.modes.define.stages);
const expectedStages = ["semantic-context", "semantic-closure", "source", "bundle", "admission", "status"];

const ontologyReceipt = JSON.parse(
  readFileSync(
    resolve(experimentRoot, "ontology/receipts/20260828T213256Z-VALIDATION.json"),
    "utf8",
  ),
) as { run_1: { overall: string }; run_2: { overall: string }; determinism: { stdout_byte_identical: boolean } };

const assertions = {
  live_stage_catalog_matches: JSON.stringify(liveStages) === JSON.stringify(expectedStages),
  positive_compile: true,
  positive_verification: positiveVerification.status === "pass" && positiveVerification.codes.length === 0,
  positive_two_run_determinism: byteEqual(first, second),
  unsupported_workflow_blocks: unsupportedWorkflowCode === "KIND_UNSUPPORTED",
  source_shortcut_structurally_compiles:
    sourceShortcutVerification.status === "pass" && sourceShortcutVerification.codes.length === 0,
  ontology_validation_passes:
    ontologyReceipt.run_1.overall === "PASS" &&
    ontologyReceipt.run_2.overall === "PASS" &&
    ontologyReceipt.determinism.stdout_byte_identical,
};

const unexpectedFailures = Object.entries(assertions)
  .filter(([, passed]) => !passed)
  .map(([assertion]) => assertion);

const result = {
  schema_version: "invoke-define-cli-model-experiment-result.v1",
  experiment_id: "invoke-define-cli-domainspec-v2-v1",
  overall: unexpectedFailures.length === 0 ? "FLAG" : "BLOCK",
  interpretation:
    unexpectedFailures.length === 0
      ? "The full ontology is source-current and deterministic; the selected JSON profile compiles the artifact path but admits the unsafe source shortcut, exposing a real expressivity gap."
      : "One or more expected structural or negative-control outcomes did not hold.",
  live_cli: {
    stages: liveStages,
    modeled_artifact_stages: expectedStages.slice(0, 5),
    read_only_stage: "status",
  },
  ontology: {
    ontology_id: "invoke-define-cli.system-runtime.v1",
    validation: assertions.ontology_validation_passes ? "pass" : "fail",
    complete_contract_roles: ["Interface", "Workflow", "Operation", "Query", "Artifact", "Rule", "status-axis"],
  },
  selected_json_projection: {
    profile_id: "feature-with-independent-node-files@1",
    positive: {
      compile: assertions.positive_compile ? "pass" : "fail",
      verification: assertions.positive_verification ? "pass" : "fail",
      two_run_determinism: assertions.positive_two_run_determinism ? "pass" : "fail",
      nodes: first.graph.nodes.length,
      edges: first.graph.edges.length,
      graph_sha256: hash(first.graphBytes),
    },
    hostile: {
      unsupported_workflow: {
        outcome: assertions.unsupported_workflow_blocks ? "block" : "unexpected",
        compiler_code: unsupportedWorkflowCode,
      },
      source_shortcut: {
        outcome: assertions.source_shortcut_structurally_compiles ? "pass" : "unexpected",
        classification: "expressivity-gap",
        meaning: "Structural Rule -> Operation -> Event conformance does not prove current semantic-closure eligibility.",
      },
    },
    unsupported_semantics: [
      "CLI Interface",
      "ordered Workflow",
      "read-only Query behavior",
      "exact receipt dependency evaluation",
      "independent status axes",
    ],
  },
  assertions,
  unexpected_failures: unexpectedFailures,
  work_pack_boundary: {
    work_pack_id: "WIR-WP-001",
    reused_swu: "SWU-WIR-006",
    swu_execution: "not-started",
    producer_vs_downgrade_selection: "unresolved",
  },
  claim_ceiling:
    "Private modeling evidence only; no SWU execution, Invoke aggregate acceptance, canonical definition change, release, publication, deployment, or runtime authority.",
  authority_effect: "none",
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = unexpectedFailures.length === 0 ? 0 : 1;
