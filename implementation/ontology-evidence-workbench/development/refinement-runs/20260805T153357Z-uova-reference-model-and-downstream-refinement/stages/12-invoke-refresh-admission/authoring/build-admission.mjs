#!/usr/bin/env node

import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../../../../../../../../..");
const RUN = "cyberAlchemy-v2/implementation/ontology-evidence-workbench/development/refinement-runs/20260805T153357Z-uova-reference-model-and-downstream-refinement";
const STAGE = `${RUN}/stages/12-invoke-refresh-admission`;
const OEW = "cyberAlchemy-v2/implementation/ontology-evidence-workbench";
const UI = `${OEW}/upstream/overlay/packages/dashboard/src/oew`;
const SESSION = `${RUN}/session-evidence`;
const capturedAt = new Date().toISOString();

const canonical = (value) => `${JSON.stringify(value, null, 2)}\n`;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function artifact(path) {
  const bytes = await readFile(resolve(ROOT, path));
  const info = await lstat(resolve(ROOT, path));
  if (!info.isFile() || info.isSymbolicLink()) {
    throw new Error(`regular non-symlink file required: ${path}`);
  }
  return { path, sha256: sha256(bytes), size_bytes: bytes.length };
}

async function baseline(path, role) {
  try {
    const ref = await artifact(path);
    return {
      path,
      role,
      baseline: {
        state: "present",
        sha256: ref.sha256,
        size_bytes: ref.size_bytes,
      },
      allowed_delta: "modify",
    };
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    return {
      path,
      role,
      baseline: { state: "absent", sha256: null, size_bytes: null },
      allowed_delta: "create",
    };
  }
}

async function writeNew(path, value) {
  const target = resolve(ROOT, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, canonical(value), { encoding: "utf8", flag: "wx" });
}

const unitSpecs = [
  {
    unit_id: "UOVARR-001",
    task_id: "TASK-UOVARR-001",
    title: "Scene Reference Core",
    behavior: "Implement KnowledgeScene v1.2, canonical digest laws, one immutable relation index, and typed exact-ID RelationRef resolution without tuple fallback.",
    dependencies: [],
    successor: "UOVARR-002",
    targets: [
      [`${UI}/scene/sceneQuery.ts`, "scene-compiler"],
      [`${UI}/types.ts`, "shared-relation-types"],
      [`${UI}/scene/relationReference.ts`, "relation-reference-core"],
      [`${OEW}/test/relation-reference.test.mjs`, "focused-test"],
      [`${OEW}/test/scene-partition.test.mjs`, "focused-test"],
    ],
    focused: ["node", "--experimental-strip-types", "--test", "test/relation-reference.test.mjs", "test/scene-partition.test.mjs"],
    focusedTimeout: 180,
  },
  {
    unit_id: "UOVARR-002",
    task_id: "TASK-UOVARR-002",
    title: "Source-Bound Compatibility Migration",
    behavior: "Migrate v1/v1.1 scenes only after exact SourceGraph and ViewPack comparison, emitting a separately identified v1.2 scene and migration receipt.",
    dependencies: ["UOVARR-001"],
    successor: "UOVARR-003",
    targets: [
      [`${UI}/scene/sceneMigration.ts`, "migration-core"],
      [`${OEW}/test/relation-migration.test.mjs`, "focused-test"],
    ],
    focused: ["node", "--experimental-strip-types", "--test", "test/relation-migration.test.mjs"],
    focusedTimeout: 180,
  },
  {
    unit_id: "UOVARR-003",
    task_id: "TASK-UOVARR-003",
    title: "Reference-First Portals",
    behavior: "Compile grouped labeled portals whose constituents retain exact RelationRef and traversal-local state while summaries remain digest-validated derivations.",
    dependencies: ["UOVARR-001"],
    successor: "UOVARR-004",
    targets: [
      [`${UI}/scene/portalQuery.ts`, "portal-compiler"],
      [`${UI}/scene/sceneQuery.ts`, "portal-integration"],
      [`${OEW}/test/portal-reference.test.mjs`, "focused-test"],
    ],
    focused: ["node", "--experimental-strip-types", "--test", "test/portal-reference.test.mjs", "test/scene-partition.test.mjs"],
    focusedTimeout: 180,
  },
  {
    unit_id: "UOVARR-004",
    task_id: "TASK-UOVARR-004",
    title: "Reference-First Path",
    behavior: "Compute bounded deterministic paths whose hops retain exact RelationRef and explicit traversal-local direction.",
    dependencies: ["UOVARR-001"],
    successor: "UOVARR-005",
    targets: [
      [`${UI}/scene/pathQuery.ts`, "path-compiler"],
      [`${OEW}/test/path-reference.test.mjs`, "focused-test"],
    ],
    focused: ["node", "--experimental-strip-types", "--test", "test/path-reference.test.mjs"],
    focusedTimeout: 180,
  },
  {
    unit_id: "UOVARR-005",
    task_id: "TASK-UOVARR-005",
    title: "Navigation and View-Model Integrity",
    behavior: "Synchronize selection, restoration, Portal and Path cards, and relation view models by one scene-bound reference while compiling the 58-record OEW-owned development UI description.",
    dependencies: ["UOVARR-003", "UOVARR-004"],
    successor: "UOVARR-006",
    targets: [
      [`${UI}/store.ts`, "navigation-store"],
      [`${UI}/relationViewModels.ts`, "relation-view-models"],
      [`${UI}/ui-api/profile.v0.1.json`, "oew-ui-profile-snapshot"],
      [`${UI}/ui-api/compileInventory.ts`, "ui-inventory-compiler"],
      [`${UI}/ui-api/validateInventory.ts`, "ui-inventory-validator"],
      [`${UI}/ui-api/inventory.v0.1.json`, "compiled-ui-inventory"],
      [`${OEW}/test/navigation.test.mjs`, "focused-test"],
      [`${OEW}/test/relation-consumer-sync.test.mjs`, "focused-test"],
      [`${OEW}/test/ui-api-conformance.test.mjs`, "focused-test"],
    ],
    focused: ["node", "--experimental-strip-types", "--test", "test/navigation.test.mjs", "test/relation-consumer-sync.test.mjs", "test/ui-api-conformance.test.mjs"],
    focusedTimeout: 240,
    extraValidations: [
      {
        command_id: "uovarr-005-domainspec-ui-profile-source",
        argv: ["./node_modules/.bin/tsx", "tools/validate-ui-profile.ts", "--profile", "spec/ui-profile/profile.yml", "--fixtures", "spec/ui-profile/fixtures/create-player"],
        cwd: "projects/domainspec-v2/impl",
        timeout_seconds: 240,
        max_output_bytes: 524288,
      },
    ],
  },
  {
    unit_id: "UOVARR-006",
    task_id: "TASK-UOVARR-006",
    title: "Presentation Joins",
    behavior: "Integrate loader, app shell, encoding, geometry, renderer, cards, inspector, and Full Index by exact relation identity while keeping text and non-color meaning complete.",
    dependencies: ["UOVARR-005"],
    successor: "UOVARR-007",
    targets: [
      [`${UI}/loadOewBundle.ts`, "bundle-loader"],
      [`${UI}/relationPresentation.ts`, "relation-presentation"],
      [`${UI}/relationEncoding.ts`, "predicate-encoding-registry"],
      [`${UI}/scene/relationGeometry.ts`, "semantic-free-geometry"],
      [`${UI}/OewApp.tsx`, "application-shell"],
      [`${UI}/EvidenceWorkspace.tsx`, "workspace"],
      [`${UI}/EvidenceInspector.tsx`, "inspector"],
      [`${UI}/EvidenceOutline.tsx`, "outline-index"],
      [`${UI}/EvidenceTable.tsx`, "table-index"],
      [`${UI}/oew.css`, "workspace-style"],
      [`${UI}/inspector.css`, "inspector-style"],
      [`${UI}/EvidenceInspector.test.tsx`, "component-test"],
      [`${UI}/relationPresentation.test.ts`, "component-test"],
      [`${OEW}/test/relation-projection.test.mjs`, "focused-test"],
      [`${OEW}/test/evidence-inspector.test.mjs`, "focused-test"],
      [`${OEW}/test/presentation-edges.test.mjs`, "focused-test"],
      [`${OEW}/test/ui-store.test.mjs`, "focused-test"],
    ],
    focused: ["node", "--experimental-strip-types", "--test", "test/relation-projection.test.mjs", "test/evidence-inspector.test.mjs", "test/presentation-edges.test.mjs", "test/ui-store.test.mjs"],
    focusedTimeout: 300,
  },
  {
    unit_id: "UOVARR-007",
    task_id: "TASK-UOVARR-007",
    title: "Static Projection and Accessibility Fallback",
    behavior: "Emit deterministic self-contained SVG, print, and no-JS output from validated RelationSnapshots with complete text and null-cue fallback.",
    dependencies: ["UOVARR-006"],
    successor: "UOVARR-008",
    targets: [
      [`${UI}/relationSnapshot.ts`, "relation-snapshot"],
      [`${UI}/staticProjection.ts`, "static-serializer"],
      [`${OEW}/test/static-relation-snapshot.test.mjs`, "focused-test"],
      [`${OEW}/test/responsive.test.mjs`, "focused-test"],
    ],
    focused: ["node", "--experimental-strip-types", "--test", "test/static-relation-snapshot.test.mjs", "test/responsive.test.mjs"],
    focusedTimeout: 180,
  },
  {
    unit_id: "UOVARR-008",
    task_id: "TASK-UOVARR-008",
    title: "Full Body War Adapter",
    behavior: "Compile the validated 276-node and 301-relation Body War whole-system ontology through the generic v1.2 pipeline and prove 577 complete Full Index rows.",
    dependencies: ["UOVARR-002", "UOVARR-007"],
    successor: "UOVARR-009",
    targets: [
      [`${OEW}/src/body-war-adapter-writer.mjs`, "body-war-adapter"],
      [`${OEW}/test/body-war-adapter.test.mjs`, "focused-test"],
      ["projects/body-war/ontology/whole-system/scripts/generate-oew-frontend.mjs", "whole-system-generator"],
      ["projects/body-war/ontology/whole-system/scripts/validate-oew-frontend.mjs", "whole-system-validator"],
      ["projects/body-war/ontology/whole-system/tests/whole-system-oew-frontend.test.mjs", "whole-system-test"],
    ],
    focused: ["node", "--experimental-strip-types", "--test", "test/body-war-adapter.test.mjs"],
    focusedTimeout: 300,
    extraValidations: [
      {
        command_id: "uovarr-008-whole-system-owner-test",
        argv: ["node", "--test", "projects/body-war/ontology/whole-system/tests/whole-system-oew-frontend.test.mjs"],
        cwd: ".",
        timeout_seconds: 300,
        max_output_bytes: 1048576,
      },
    ],
  },
  {
    unit_id: "UOVARR-009",
    task_id: "TASK-UOVARR-009",
    title: "Acceptance and Reuse",
    behavior: "Prove full regression, bounded focus-scene browser behavior, relation identity synchronization, deterministic output, UI conformance, and reuse by a non-Body-War fixture.",
    dependencies: ["UOVARR-008"],
    successor: "OWNER-ACCEPTANCE-DECISION",
    targets: [
      [`${OEW}/test/browser-acceptance.test.mjs`, "browser-acceptance-test"],
      [`${OEW}/test/view-parity.test.mjs`, "view-parity-test"],
      [`${OEW}/test/reuse-relation-reference.test.mjs`, "reuse-test"],
      [`${OEW}/fixtures/uovarr-reuse-source-graph.json`, "reuse-fixture"],
      [`${OEW}/fixtures/uovarr-reuse-view-pack.json`, "reuse-fixture"],
      [`${OEW}/scripts/verify-browser-acceptance.mjs`, "browser-receipt-verifier"],
    ],
    focused: ["node", "--experimental-strip-types", "--test", "test/reuse-relation-reference.test.mjs", "test/view-parity.test.mjs"],
    focusedTimeout: 240,
    extraValidations: [
      {
        command_id: "uovarr-009-browser",
        argv: ["npm", "run", "test:browser"],
        cwd: OEW,
        timeout_seconds: 900,
        max_output_bytes: 4194304,
      },
      {
        command_id: "uovarr-009-browser-receipt",
        argv: ["node", "scripts/verify-browser-acceptance.mjs", `generated/runs/UOVARR-009/{attempt_id}/browser-acceptance.json`],
        cwd: OEW,
        timeout_seconds: 120,
        max_output_bytes: 524288,
      },
    ],
  },
];

const taskPaths = Object.fromEntries(
  unitSpecs.map((unit) => [
    unit.unit_id,
    `${RUN}/stages/09-invoke-plan/tasks/${{
      "UOVARR-001": "TASK-UOVARR-001-SCENE-REFERENCE-CORE.md",
      "UOVARR-002": "TASK-UOVARR-002-MIGRATION.md",
      "UOVARR-003": "TASK-UOVARR-003-PORTALS.md",
      "UOVARR-004": "TASK-UOVARR-004-PATH.md",
      "UOVARR-005": "TASK-UOVARR-005-NAVIGATION-VIEWMODELS.md",
      "UOVARR-006": "TASK-UOVARR-006-PRESENTATION-JOINS.md",
      "UOVARR-007": "TASK-UOVARR-007-STATIC-ACCESSIBILITY.md",
      "UOVARR-008": "TASK-UOVARR-008-BODY-WAR.md",
      "UOVARR-009": "TASK-UOVARR-009-ACCEPTANCE-REUSE.md",
    }[unit.unit_id]}`,
  ]),
);

const ownerRefs = {
  business: "projects/body-war/ontology/business/receipts/validation-receipt.json",
  whole: "projects/body-war/ontology/whole-system/receipts/validation-receipt.json",
  projection: "projects/body-war/ontology/whole-system/frontend/PROJECTION-RECEIPT.json",
  graph: "projects/body-war/ontology/whole-system/frontend/knowledge-graph.json",
};
const business = JSON.parse(await readFile(resolve(ROOT, ownerRefs.business), "utf8"));
const whole = JSON.parse(await readFile(resolve(ROOT, ownerRefs.whole), "utf8"));
const projection = JSON.parse(await readFile(resolve(ROOT, ownerRefs.projection), "utf8"));
const graph = JSON.parse(await readFile(resolve(ROOT, ownerRefs.graph), "utf8"));

if (business.counts.nodes !== 237 || business.counts.relations !== 231) {
  throw new Error("business subset denominator drift");
}
if (
  whole.business_import.nodes + whole.system_branch.nodes !== 276 ||
  whole.business_import.relations + whole.system_branch.relations + whole.bridge_branch.relations !== 301 ||
  graph.nodes.length !== 276 ||
  graph.edges.length !== 301 ||
  projection.projection.nodes !== 276 ||
  projection.projection.edges !== 301 ||
  projection.projection.predicates !== 39
) {
  throw new Error("whole-system denominator evidence is inconsistent");
}

const denominatorDecision = {
  schema_version: "uovarr.body-war-denominator-decision.v1",
  decision_id: "UOVARR-BODY-WAR-WHOLE-SYSTEM-276-301-577",
  decided_at: capturedAt,
  owner: "body-war-whole-system-ontology",
  selected_scope: "projects/body-war/ontology/whole-system",
  selection: {
    nodes: 276,
    relations: 301,
    full_index_rows: 577,
    predicate_encodings: 39,
    node_algebra: "237 business + 39 system",
    relation_algebra: "231 business + 45 system + 25 bridge",
  },
  historical_compatibility_subset: {
    scope: "projects/body-war/ontology/business",
    nodes: 237,
    relations: 231,
    disposition: "preserved as business-only migration evidence; forbidden as the full UOVARR-008 acceptance denominator",
  },
  rationale: "UOVARR-008 explicitly targets the complete Body War ontology. The current whole-system owner validation and projection receipts independently agree on 276 nodes and 301 relations; the Full Index denominator is their exact sum.",
  evidence: {
    business_validation: await artifact(ownerRefs.business),
    whole_system_validation: await artifact(ownerRefs.whole),
    whole_system_projection: await artifact(ownerRefs.projection),
    whole_system_graph: await artifact(ownerRefs.graph),
  },
  authority_effect: "bounded-plan-selection-only",
  release_admission: "not-granted",
};
await writeNew(`${STAGE}/BODY-WAR-DENOMINATOR-DECISION.json`, denominatorDecision);

const browserBinding = {
  schema_version: "uovarr.browser-runtime-binding.v1",
  captured_at: capturedAt,
  node_version: process.version,
  npm_version: "10.9.2",
  active_global_playwright: null,
  active_global_playwright_state: "absent",
  cached_chromium_candidates: [
    "/home/vrondelli/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome",
    "/home/vrondelli/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome",
    "/home/vrondelli/.cache/ms-playwright/chromium-1232/chrome-linux64/chrome",
  ],
  selection_gate: "Before UOVARR-009 mutation, Task Session must bind an active Playwright CLI/API package, package version and digest, executable Chromium path/version/digest, and a passing smoke launch. Cached browser bytes alone are insufficient.",
  repository_dependency_policy: "Do not add a repository package root or dependency solely to obtain Playwright.",
  authority_effect: "none",
  mutation_ready: false,
};
await writeNew(`${STAGE}/BROWSER-RUNTIME-BINDING.json`, browserBinding);

const units = [];
for (const spec of unitSpecs) {
  const targetInventory = [];
  for (const [path, role] of spec.targets) targetInventory.push(await baseline(path, role));
  const attemptRoot = `${SESSION}/${spec.unit_id}/{attempt_id}`;
  const outputs = [
    `${attemptRoot}/receipt.json`,
    `${attemptRoot}/changed-files.json`,
    `${attemptRoot}/validation/focused.log`,
    `${attemptRoot}/validation/full-regression.log`,
    `${attemptRoot}/validation/diff-check.txt`,
    `${attemptRoot}/closeout-request.json`,
  ];
  if (spec.unit_id === "UOVARR-008") {
    outputs.push(`${attemptRoot}/denominator-owner-receipt.json`, `${attemptRoot}/generation-manifest.json`);
  }
  if (spec.unit_id === "UOVARR-009") {
    outputs.push(
      `${attemptRoot}/prototype-validation-report.md`,
      `${OEW}/generated/runs/UOVARR-009/{attempt_id}/browser-acceptance.json`,
      `${OEW}/generated/runs/UOVARR-009/{attempt_id}/browser-witness.png`,
      `${OEW}/generated/runs/UOVARR-009/{attempt_id}/browser-trace.zip`,
      `${attemptRoot}/determinism-receipt.json`,
      `${attemptRoot}/ui-conformance-receipt.json`,
    );
  }
  const materialWrites = targetInventory.map(({ path }) => path);
  const validations = [
    {
      command_id: `${spec.unit_id.toLowerCase()}-focused`,
      argv: spec.focused,
      cwd: OEW,
      timeout_seconds: spec.focusedTimeout,
      max_output_bytes: 1048576,
    },
    {
      command_id: `${spec.unit_id.toLowerCase()}-full-regression`,
      argv: ["npm", "test"],
      cwd: OEW,
      timeout_seconds: 600,
      max_output_bytes: 4194304,
    },
    {
      command_id: `${spec.unit_id.toLowerCase()}-whitespace`,
      argv: ["git", "diff", "--check", "--", ...materialWrites],
      cwd: ".",
      timeout_seconds: 60,
      max_output_bytes: 524288,
    },
    ...(spec.extraValidations ?? []),
  ];
  units.push({
    unit_id: spec.unit_id,
    task_id: spec.task_id,
    title: spec.title,
    behavior: spec.behavior,
    task_ref: await artifact(taskPaths[spec.unit_id]),
    dependencies: spec.dependencies,
    canonical_successor: spec.successor,
    target_inventory: targetInventory,
    selection_baseline_rule: spec.unit_id === "UOVARR-003"
      ? "Rehash the closed UOVARR-001 sceneQuery.ts output; the authoring-time hash is provenance only."
      : "Rehash every target immediately before material production; authoring-time baselines are provenance only.",
    validation_contracts: validations,
    attempt_contract: {
      id_policy: "Task Session allocates one new immutable UTC attempt ID at selected-unit admission.",
      collision_policy: "Reject an existing attempt root, unresolved attempt token, target drift, or material-package mismatch.",
      success_teardown: "Retain terminal evidence, close transient processes, and route owner closeout.",
      failure_teardown: "Retain block evidence, close transient processes, and keep the same canonical cursor.",
    },
    execution_outputs: outputs,
    closeout: {
      allowed_delta_classes: [
        "create-declared-absent-target",
        "modify-declared-present-target",
        "create-attempt-scoped-execution-evidence",
        "synchronize-status-after-owner-joined-pass",
      ],
      forbidden_scopes: [
        "undeclared-product-path",
        "public-Arcanum",
        "ontology-promotion",
        "dependency-or-lockfile-mutation",
        "credentials",
        "network",
        "deployment",
        "release",
        "production",
        "Git-publication",
      ],
      live_revalidation_required: true,
      pass: `join terminal and owner-closeout receipts, then select ${spec.successor}`,
      block: `retain ${spec.unit_id} with exact blocker evidence`,
    },
  });
}

const targetBaselines = {
  schema_version: "uovarr.target-baselines.v1",
  captured_at: capturedAt,
  repository_root: ".",
  baseline_semantics: "Authoring-time provenance. Task Session must rehash the selected unit after all dependencies close and before material production.",
  units: Object.fromEntries(units.map((unit) => [unit.unit_id, unit.target_inventory])),
  authority_effect: "none",
};
await writeNew(`${STAGE}/TARGET-BASELINES.json`, targetBaselines);

const sourcePaths = {
  current_work_pack: `${STAGE}/WORK-PACK.md`,
  base_work_pack: `${RUN}/stages/09-invoke-plan/WORK-PACK.md`,
  base_execution_pack: `${RUN}/stages/09-invoke-plan/EXECUTION-PACK.md`,
  base_swu_manifest: `${RUN}/stages/09-invoke-plan/SWU-MANIFEST.md`,
  design_receipt: `${RUN}/stages/06-invoke-design/RECEIPT.json`,
  plan_receipt: `${RUN}/stages/09-invoke-plan/RECEIPT.json`,
  ui_refresh_receipt: `${RUN}/stages/11-invoke-refresh/RECEIPT.json`,
  ui_contract: `${RUN}/stages/11-invoke-refresh/UI-API-CONTRACT.md`,
  ui_inventory: `${RUN}/stages/11-invoke-refresh/UI-API-INVENTORY.json`,
  target_baselines: `${STAGE}/TARGET-BASELINES.json`,
  denominator_decision: `${STAGE}/BODY-WAR-DENOMINATOR-DECISION.json`,
  browser_runtime: `${STAGE}/BROWSER-RUNTIME-BINDING.json`,
  package: `${OEW}/package.json`,
  terminal_schema: ".agents/skills/task-session/schemas/executor-receipt.schema.json",
  mutation_validator: ".agents/skills/task-session/scripts/verify-mutation-readiness.py",
  closeout_policy: ".agents/skills/task-session/decision-validation-policy.json",
  audit_schema: ".agents/skills/work-pack-readiness-audit/schemas/audit-config-v2.schema.json",
  audit_runner: ".agents/skills/work-pack-readiness-audit/scripts/audit_work_pack.py",
};
const sourceBindings = {};
for (const [key, path] of Object.entries(sourcePaths)) sourceBindings[key] = await artifact(path);
sourceBindings.tasks = Object.fromEntries(
  await Promise.all(Object.entries(taskPaths).map(async ([key, path]) => [key, await artifact(path)])),
);

const successors = Object.fromEntries(units.map((unit) => [unit.unit_id, unit.canonical_successor]));
const admission = {
  schema_version: "uovarr.work-pack-admission-contract.v1",
  contract_id: "UOVA-RR-20260805-selection-profile",
  captured_at: capturedAt,
  claim_ceiling: "whole-pack-plan-semantic-readiness-for-selected-unit-admission",
  objective: {
    pack_id: "UOVA-RR-20260805",
    behavior: "Implement the repaired unified ontology view through exact relation references, portals, paths, synchronized UI projections, static fallback, full Body War whole-system compilation, browser acceptance, and reuse evidence.",
    finite_frontier: units.map(({ unit_id }) => unit_id),
    canonical_cursor: "UOVARR-001",
    admission_timing: "selected-unit-at-task-session",
  },
  source_bindings: sourceBindings,
  closure_inputs: [
    { kind: "design-closure", state: "closed-repaired-architecture", source_key: "design_receipt" },
    { kind: "plan-closure", state: "closed-nine-unit-work-pack", source_key: "plan_receipt" },
    { kind: "ui-description-refresh", state: "apply-approved-58-contract-delta", source_key: "ui_refresh_receipt" },
    { kind: "body-war-denominator", state: "selected-whole-system-276-301-577", source_key: "denominator_decision" },
  ],
  decision: {
    mode: "apply-approved",
    approved_by: "direct-user",
    approval_source: "user request: i want to have the work pack ready for implementing",
    scope: "planning and selected-unit admission profile only; no product mutation",
    authority_effect: "bounded-planning-authority-only",
  },
  semantic: {
    owner: {
      plan_owner: "invoke-plan",
      admission_owner: "invoke-refresh",
      material_producer: "implementation-readiness",
      mutation_owner: "task-session",
      closeout_owner: "invoke-refresh",
    },
    material: {
      state: "selected-unit-materialization-required",
      audit_time_baselines: "provenance-only",
      selection_rule: "rehash exact targets after dependency closeout, stage one selected unit, and bind a schema-valid material package plus producer receipt",
    },
    validation: {
      policy: "focused-negative-and-positive-tests, full OEW regression, scoped whitespace, then declared cross-owner or browser witnesses",
      configured_commands_executed_by_readiness_audit: false,
      live_validation_required_after_apply: true,
    },
    receipt: {
      terminal_owner: "task-session",
      result_values: ["pass", "block"],
      required_evidence: [
        "selected unit, task, plan epoch, and immutable attempt ID",
        "preimage and postimage hashes for every declared material target",
        "material package and producer receipt",
        "all structured validation results and retained logs",
        "changed-files and allowed-delta comparison",
        "blockers, residue, capability ceiling, and canonical successor",
      ],
    },
    closeout: {
      policy: "advance only after joined terminal pass and owner allowed-delta validation",
      block: "retain the same unit and evidence",
      drift: "stop and reissue Invoke Refresh selection material",
    },
  },
  units,
  receipt_contract: {
    terminal_schema: sourceBindings.terminal_schema,
    semantic_validator: sourceBindings.mutation_validator,
    closeout_policy: sourceBindings.closeout_policy,
    terminal_receipt: `${SESSION}/{selected_unit}/{attempt_id}/receipt.json`,
  },
  runtime: {
    node: process.version,
    npm: "10.9.2",
    typescript_loader: ["node", "--experimental-strip-types", "--test"],
    browser_binding_source_key: "browser_runtime",
    browser_state: "selection-gated-until-active-global-playwright-is-bound",
  },
  risk: {
    effect_class: "repository-local-reversible-selected-unit",
    run_budget: 9,
    allowed_risk_classes: ["bounded-write", "browser"],
    stop_conditions: [
      "plan epoch or target baseline drift",
      "missing material package, producer receipt, or mutation-admission receipt",
      "unbound write or forbidden scope",
      "acceptance-critical validation failure",
      "missing active browser runtime at UOVARR-009",
      "dependency or lockfile mutation",
      "credentials, network, deployment, promotion, release, or production effect",
    ],
  },
  status: {
    plan_artifact: "whole-pack-selected-unit-profile-authored",
    audit: "pending",
    approval: "direct-user-apply-approved",
    chain: "pending-plan-semantic-audit",
    artifact_authored: "complete",
    registry_released: "not-applicable",
    mutation_runtime_ready: "false",
  },
  successors,
  continuation: {
    cursor: "UOVARR-001",
    equivalence_rule: "recompute the Plan Semantic Manifest and require the same plan epoch and selected unit contract digest before material admission",
    verification_state: "pending-selection",
  },
  authority_effect: "none",
  mutation_ready: false,
};
await writeNew(`${STAGE}/ADMISSION-CONTRACT.json`, admission);

const contractRef = await artifact(`${STAGE}/ADMISSION-CONTRACT.json`);
let bindingCounter = 0;
const bind = (label, owner_ref, selector) => ({
  binding_id: `uovarr-${String(++bindingCounter).padStart(3, "0")}-${label}`,
  owner_ref,
  artifact_ref: contractRef,
  selector,
});
const executionBindings = units.map((unit) => {
  const materialWrites = unit.target_inventory.map(({ path }) => path);
  return {
    task_id: unit.task_id,
    swu_id: unit.unit_id,
    lifecycle_owner: "task-session",
    authority_class: "private",
    publication_class: "internal",
    attempt_contract: unit.attempt_contract,
    unit_id: unit.unit_id,
    dependencies: unit.dependencies,
    canonical_successors: [unit.canonical_successor],
    command: {
      argv: unit.validation_contracts[0].argv,
      cwd: unit.validation_contracts[0].cwd,
      risk_class: unit.unit_id === "UOVARR-009" ? "browser" : "bounded-write",
    },
    validation_contracts: unit.validation_contracts.map(({ command_id, argv, cwd, timeout_seconds, max_output_bytes }) => ({ command_id, argv, cwd, timeout_seconds, max_output_bytes })),
    material_writes: materialWrites,
    execution_outputs: unit.execution_outputs,
    allowed_writes: [...materialWrites, ...unit.execution_outputs],
    material_package: {
      package_ref: null,
      producer_owner_ref: "implementation-readiness",
      producer_receipt_ref: null,
      schema_ref: null,
      declared_sha256: null,
      target_inventory_ref: null,
    },
    byte_baselines: [],
  };
});
const closeoutBindings = units.map((unit, index) => ({
  unit_id: unit.unit_id,
  allowed_delta_policy_ref: bind(`${unit.unit_id.toLowerCase()}-allowed-delta`, "invoke-refresh", `/units/${index}/closeout/allowed_delta_classes`),
  owner_receipt_contract_ref: bind(`${unit.unit_id.toLowerCase()}-owner-receipt`, "task-session", "/receipt_contract"),
  compensation: {
    mode: "none",
    rationale: "Declared effects are repository-local and reversible; failed bytes and immutable receipts remain evidence for repair.",
  },
}));

const auditConfig = {
  schema_version: "2.0.0",
  admission_timing: "selected-unit-at-task-session",
  audit_id: "UOVA-RR-20260805-selection-readiness",
  repository_root: ".",
  evidence_ceiling: "frozen-input-contractual-readiness",
  classifier_version: "uovarr-selected-unit-1.0.0",
  objective_ref: bind("objective", "invoke-plan", "/objective"),
  closure_receipt_refs: [
    bind("design-closure", "invoke-design", "/closure_inputs/0"),
    bind("plan-closure", "invoke-plan", "/closure_inputs/1"),
    bind("ui-refresh-closure", "invoke-refresh", "/closure_inputs/2"),
    bind("denominator-closure", "body-war-whole-system-ontology", "/closure_inputs/3"),
  ],
  authority_bindings: {
    canonical_authority_refs: [
      bind("source-current-work-pack", "invoke-refresh", "/source_bindings/current_work_pack"),
      bind("source-design", "invoke-design", "/source_bindings/design_receipt"),
      bind("source-plan", "invoke-plan", "/source_bindings/plan_receipt"),
      bind("source-ui-refresh", "invoke-refresh", "/source_bindings/ui_refresh_receipt"),
      bind("source-denominator", "body-war-whole-system-ontology", "/source_bindings/denominator_decision"),
    ],
    semantic_bindings: {
      owner: bind("semantic-owner", "invoke-refresh", "/semantic/owner"),
      material: bind("semantic-material", "implementation-readiness", "/semantic/material"),
      validation: bind("semantic-validation", "task-session", "/semantic/validation"),
      receipt: bind("semantic-receipt", "task-session", "/semantic/receipt"),
      closeout: bind("semantic-closeout", "invoke-refresh", "/semantic/closeout"),
    },
  },
  execution_bindings: executionBindings,
  receipt_bindings: {
    terminal_schema_ref: bind("terminal-schema", "task-session", "/receipt_contract/terminal_schema"),
    semantic_validator_ref: bind("terminal-validator", "task-session", "/receipt_contract/semantic_validator"),
    expected_receipt_refs: [bind("expected-terminal-receipt", "task-session", "/receipt_contract/terminal_receipt")],
  },
  closeout_bindings: closeoutBindings,
  runtime_binding: {
    requested_task_session_execution_mode: "one-selected-unit-with-byte-current-material-package",
    task_session_admission_receipt_ref: null,
  },
  status_receipt_refs: {
    artifact_authored_status: { value: "complete", owner_ref: "invoke-refresh", receipt_ref: bind("status-artifact", "invoke-refresh", "/status/artifact_authored") },
    registry_released_status: { value: "not-applicable", owner_ref: "invoke-refresh", receipt_ref: bind("status-registry", "invoke-refresh", "/status/registry_released") },
    mutation_runtime_ready_status: { value: "false", owner_ref: "task-session", receipt_ref: bind("status-mutation", "invoke-refresh", "/status/mutation_runtime_ready") },
    audit_verdict: { value: "pending", owner_ref: "work-pack-readiness-audit", receipt_ref: bind("status-audit", "invoke-refresh", "/status/audit") },
  },
  lifecycle_status_refs: {
    plan_artifact_status: { value: "whole-pack-selected-unit-profile-authored", owner_ref: "invoke-refresh", receipt_ref: bind("lifecycle-plan", "invoke-refresh", "/status/plan_artifact") },
    audit_status: { value: "pending", owner_ref: "work-pack-readiness-audit", receipt_ref: bind("lifecycle-audit", "invoke-refresh", "/status/audit") },
    approval_status: { value: "direct-user-apply-approved", owner_ref: "direct-user", receipt_ref: bind("lifecycle-approval", "invoke-refresh", "/status/approval") },
    chain_status: { value: "pending-plan-semantic-audit", owner_ref: "invoke-refresh", receipt_ref: bind("lifecycle-chain", "invoke-refresh", "/status/chain") },
  },
  approval_policy: {
    approval_owner_ref: "direct-user",
    decision_gate_receipt_ref: bind("direct-user-decision", "direct-user", "/decision"),
    run_budget: { max_task_session_requests: 9 },
    risk_policy_ref: bind("risk-policy", "invoke-refresh", "/risk"),
    allowed_audit_verdicts: ["pass", "flag"],
    allowed_flag_classes: ["observability-residue"],
  },
  continuity_projection: {
    cursor: "UOVARR-001",
    completed_unit_receipt_refs: [],
    joined_closeout_receipt_refs: [],
    projected_next_successor: {
      unit_id: "UOVARR-001",
      canonical_successor_ref: bind("canonical-successor", "invoke-plan", "/successors/UOVARR-001"),
      projection_owner_ref: "work-pack-readiness-audit",
      equivalence_validator_ref: bind("equivalence-rule", "work-pack-readiness-audit", "/continuation/equivalence_rule"),
      continuation_router_verification_receipt_ref: bind("continuation-state", "continuation-router", "/continuation/verification_state"),
      authority_effect: "none",
    },
  },
};
await writeNew(`${STAGE}/readiness/audit-config.json`, auditConfig);

process.stdout.write(`${JSON.stringify({
  result: "pass",
  stage: STAGE,
  units: units.length,
  exact_target_rows: units.reduce((sum, unit) => sum + unit.target_inventory.length, 0),
  admission_contract: await artifact(`${STAGE}/ADMISSION-CONTRACT.json`),
  audit_config: await artifact(`${STAGE}/readiness/audit-config.json`),
}, null, 2)}\n`);
