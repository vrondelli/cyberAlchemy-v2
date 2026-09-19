#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repositoryRoot = process.cwd();
const planBase = "projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/design/continuations/N37-EMITS-TARGET-MAX-CLOSURE-PROOF-SHAPE/research/closure-evidence-ownership-r1/define/closure-evidence-contract-r1/plan/closure-evidence-chain-contract-r1";
const machineBase = `${planBase}/machine`;
const evfBase = "projects/domainspec-v2/development/evolvable-validation-framework";
const fixtureBase = `${evfBase}/fixtures/BMC-REL-EMITS-CLOSURE-EVIDENCE`;
const workPackId = "WP-BMC-REL-EMITS-CLOSURE-EVIDENCE-CHAIN-001";
const ownerReceiptIdentity = "invoke.precloseout-refresh-closeout-receipt.v1";
const node = "/home/vrondelli/.nvm/versions/node/v22.12.0/bin/node";

function canonical(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) throw new Error("only safe integers are canonical");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  throw new Error(`unsupported canonical value: ${typeof value}`);
}

function digestValue(value) {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

async function exact(relativePath) {
  const bytes = await readFile(path.join(repositoryRoot, relativePath));
  return { path: relativePath, sha256: createHash("sha256").update(bytes).digest("hex"), size_bytes: bytes.length };
}

async function writeJson(relativePath, value) {
  const target = path.join(repositoryRoot, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

const schemaCheck = [
  "-c",
  "import json,sys; from jsonschema import Draft202012Validator as V; s=json.load(open(sys.argv[1])); V.check_schema(s); v=V(s); [v.validate(json.load(open(p))) for p in sys.argv[2:]]"
];
const manifestCheck = [
  "-c",
  "import hashlib,json,sys,pathlib\nm=json.load(open(sys.argv[1]))\nassert m['schema_version']=='evf.closure-evidence-contract-manifest/v1'\nassert len(m['contracts'])==2\npaths=[x['path'] for x in m['contracts']]\nassert len(paths)==len(set(paths))\nroot=pathlib.Path('.')\nfor e in m['contracts']:\n b=(root/e['path']).read_bytes()\n assert hashlib.sha256(b).hexdigest()==e['sha256']\n assert len(b)==e['size_bytes']",
];

const envelopeSchema = `${evfBase}/contracts/emits-incoming-closure-evidence-envelope.v1.schema.json`;
const envelopeFixture = `${fixtureBase}/valid-minimal-envelope.v1.json`;
const receiptSchema = `${evfBase}/contracts/emits-target-max-evaluation-receipt.v1.schema.json`;
const receiptFixtures = [
  `${fixtureBase}/pass-evaluation-receipt.v1.json`,
  `${fixtureBase}/invalid-evaluation-receipt.v1.json`,
  `${fixtureBase}/incomplete-evaluation-receipt.v1.json`,
  `${fixtureBase}/error-evaluation-receipt.v1.json`
];
const contractManifest = `${evfBase}/contracts/closure-evidence-contract-manifest.v1.json`;
const chainValidator = `${evfBase}/tools/validate-emits-closure-evidence-contracts.mjs`;
const n43Schema = "projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/design/continuations/N37-EMITS-TARGET-MAX-CLOSURE-PROOF-SHAPE/research/closure-evidence-ownership-r1/define/closure-evidence-contract-r1/design/representation-r1/continuations/N43-EMITS-CLOSURE-ENVELOPE-SCHEMA-PROPOSAL/schemas/emits-incoming-closure-evidence-envelope.candidate-v1.schema.json";
const n44Schema = "projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/design/continuations/N37-EMITS-TARGET-MAX-CLOSURE-PROOF-SHAPE/research/closure-evidence-ownership-r1/define/closure-evidence-contract-r1/design/representation-r1/continuations/N44-EMITS-TARGET-MAX-EVALUATION-RECEIPT-SCHEMA-PROPOSAL/schemas/emits-target-max-evaluation-receipt.candidate-v1.schema.json";
const envelopeEquivalence = "import copy,json,sys\nc=json.load(open(sys.argv[1])); t=json.load(open(sys.argv[2])); assert t['$id']=='https://domainspec.dev/schemas/evf/emits-incoming-closure-evidence-envelope/v1'; assert t['properties']['schema_version']['const']=='evf.emits-incoming-closure-evidence-envelope/v1'; u=copy.deepcopy(t); u['$id']=c['$id']; u['title']=c['title']; u['description']=c['description']; u['properties']['schema_version']['const']=c['properties']['schema_version']['const']; assert u==c";
const receiptEquivalence = "import copy,json,sys\nc=json.load(open(sys.argv[1])); t=json.load(open(sys.argv[2])); assert t['$id']=='https://domainspec.dev/schemas/evf/emits-target-max-evaluation-receipt/v1'; assert t['properties']['schema_version']['const']=='evf.emits-target-max-evaluation-receipt/v1'; u=copy.deepcopy(t); u['$id']=c['$id']; u['title']=c['title']; u['properties']['schema_version']['const']=c['properties']['schema_version']['const']; assert u==c";

const unitSpecs = [
  {
    unit_id: "SWU-CCE-002",
    task_id: "TASK-CCE-SCHEMAS",
    objective: "Materialize the EVF emits incoming-closure envelope schema and its minimal valid fixture.",
    material_writes: [envelopeSchema, envelopeFixture],
    validation_contracts: [
      { command_id: "evf-emits-envelope-schema", argv: ["python3", ...schemaCheck, envelopeSchema, envelopeFixture], cwd: ".", timeout_seconds: 60, max_output_bytes: 262144 },
      { command_id: "evf-emits-envelope-equivalence", argv: ["python3", "-c", envelopeEquivalence, n43Schema, envelopeSchema], cwd: ".", timeout_seconds: 60, max_output_bytes: 262144 }
    ]
  },
  {
    unit_id: "SWU-CCE-003",
    task_id: "TASK-CCE-SCHEMAS",
    objective: "Materialize the EVF emits target-max evaluation-receipt schema and its four deterministic result fixtures.",
    material_writes: [receiptSchema, ...receiptFixtures],
    validation_contracts: [
      { command_id: "evf-emits-receipt-schema", argv: ["python3", ...schemaCheck, receiptSchema, ...receiptFixtures], cwd: ".", timeout_seconds: 60, max_output_bytes: 262144 },
      { command_id: "evf-emits-receipt-equivalence", argv: ["python3", "-c", receiptEquivalence, n44Schema, receiptSchema], cwd: ".", timeout_seconds: 60, max_output_bytes: 262144 }
    ]
  },
  {
    unit_id: "SWU-CCE-004",
    task_id: "TASK-CCE-MANIFEST",
    objective: "Materialize the scoped immutable-v1 manifest for the two EVF closure-evidence schemas.",
    material_writes: [contractManifest],
    validation_contracts: [{ command_id: "evf-emits-contract-manifest", argv: ["python3", ...manifestCheck, contractManifest], cwd: ".", timeout_seconds: 60, max_output_bytes: 262144 }]
  },
  {
    unit_id: "SWU-CCE-005",
    task_id: "TASK-CCE-VALIDATION",
    objective: "Validate the complete envelope-to-receipt-to-manifest chain and its hostile controls.",
    material_writes: [chainValidator],
    validation_contracts: [
      { command_id: "evf-emits-chain-positive", argv: [node, chainValidator], cwd: ".", timeout_seconds: 120, max_output_bytes: 1048576 },
      { command_id: "evf-emits-chain-hostile", argv: [node, chainValidator, "--self-test"], cwd: ".", timeout_seconds: 120, max_output_bytes: 1048576 }
    ]
  }
];

const units = unitSpecs.map((unit, index, all) => {
  const executionReceipt = `${planBase}/execution-receipts/${unit.unit_id}.json`;
  const precloseoutReceipt = `${planBase}/precloseout-receipts/${unit.unit_id}.json`;
  const closeoutReceipt = `${planBase}/closeout-receipts/${unit.unit_id}.json`;
  const terminalReceipt = `${planBase}/terminal-receipts/${unit.unit_id}.json`;
  const executorWrites = [...unit.material_writes, executionReceipt];
  const routeWriteScope = [...executorWrites, precloseoutReceipt, closeoutReceipt, terminalReceipt];
  return {
    ...unit,
    swu_id: unit.unit_id,
    dependencies: index === 0 ? [] : [all[index - 1].unit_id],
    canonical_successors: [index === all.length - 1 ? "__complete__" : all[index + 1].unit_id],
    execution_receipt: executionReceipt,
    precloseout_receipt: precloseoutReceipt,
    closeout_receipt: closeoutReceipt,
    terminal_receipt: terminalReceipt,
    allowed_writes: executorWrites,
    route_write_scope: routeWriteScope,
    byte_baselines: []
  };
});

const sourcePaths = [
  `${planBase}/WORK-PACK.md`,
  `${planBase}/IMPLEMENTATION-PLAN.md`,
  `${planBase}/IMPLEMENTATION-LAYERING.md`,
  `${planBase}/EXECUTION-PACK.md`,
  `${planBase}/DISTILL-VALIDATION.md`,
  `${planBase}/GAP-LEDGER.md`,
  `${planBase}/work-pack/tasks/TASK-CCE-BOUNDARY.md`,
  `${planBase}/work-pack/tasks/TASK-CCE-SCHEMAS.md`,
  `${planBase}/work-pack/tasks/TASK-CCE-MANIFEST.md`,
  `${planBase}/work-pack/tasks/TASK-CCE-VALIDATION.md`,
  `${planBase}/work-pack/tasks/TASK-CCE-READINESS.md`,
  `${planBase}/work-pack/waves/W0.md`,
  `${planBase}/work-pack/waves/W1.md`,
  `${planBase}/work-pack/waves/W2.md`,
  `${planBase}/work-pack/waves/W3.md`,
  `${planBase}/work-pack/shared/SWU-MANIFEST.json`,
  `${planBase}/decisions/BMC-REL-PLAN-01-CLOSURE-EVIDENCE-CONTRACT-PLACEMENT-AND-LIFECYCLE/OWNER-SELECTION-RECEIPT.json`,
  `${planBase}/machine/generate-plan-contracts.mjs`,
  n43Schema,
  n44Schema,
  "projects/domainspec-v2/definitions/relationships/relationships.yml",
  "projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/candidates/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json",
  "projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/schemas/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.schema.json",
  "projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/validators/validate-bmc-rel-001-decision-packet.mjs"
];
const planDocuments = [];
for (const sourcePath of sourcePaths) planDocuments.push(await exact(sourcePath));

const targetBaselines = [...new Set(units.flatMap((unit) => unit.material_writes))].map((targetPath) => ({ path: targetPath, state: "absent" }));
const evidence = {
  schema_version: "bmc-rel.emits-closure-evidence-plan-evidence/v1",
  work_pack_id: workPackId,
  created_at: "2026-08-26T16:30:25+01:00",
  objective: {
    statement: "Implement and locally validate the owner-selected EVF emits closure-evidence envelope and evaluator-receipt contract chain.",
    acceptance: [
      "two closed Draft 2020-12 schemas use selected EVF immutable-v1 identities",
      "five fixtures validate with deterministic error-invalid-incomplete-pass precedence",
      "the scoped manifest binds exact path, identity, digest, size, ownership, and compatibility",
      "the coordinated validator rejects every declared hostile inference and preserves canonical relationship and packet bytes"
    ],
    claim_ceiling: "Contract-shape and digest-chain evidence only; no consumer graph verdict, relationship/profile admission, evaluator runtime authority, publication, release, deployment, or D06 effect."
  },
  owner: "EVF evidence-chain lifecycle owner",
  semantic_owner: "relationship-validation contract owner",
  material: { source: "owner-selected-plan-01-a", plan_document_refs: planDocuments, target_baselines: targetBaselines },
  validation: { configured_commands_execute_at_plan_time: false, hostile_probe_floor: 12, canonical_preservation_required: true },
  receipt: { terminality: "task-session-terminal-then-invoke-closeout", pass_after_closeout_checks: 0, block_preserves_failure_evidence: true },
  closeout: { allowed_delta: ["evidence_added", "blocker_opened", "blocker_resolved", "status_changed", "route_changed"], owner: "invoke:refresh", successor_admission: false },
  terminalSchema: { type: "object", additionalProperties: false, required: ["status", "unit_id", "validation"], properties: { status: { enum: ["pass", "block", "interrupted"] }, unit_id: { type: "string" }, validation: { type: "array" } } },
  validator: { id: "task-session-terminal-and-closeout-semantic-validator", fail_closed: true },
  status: { value: "candidate", execution: "not-started" },
  approval: { status: "unapproved", owner: "relationship-validation contract owner" },
  risk: { maximum: "bounded-write", network: "forbidden", credentials: "forbidden", publication: "forbidden" },
  decision: { selection: "pending-final-implementation-acceptance", placement_selection: "BMC-REL-PLAN-01-A-EVF-EVIDENCE-CONTRACT-FAMILY" },
  successor: units[0].unit_id,
  equivalence: { version: "plan-once-v1", exact_unit_contract_required: true },
  continuation: units[0].unit_id,
  precloseoutSchema: { type: "object", required: ["unit_id", "result", "files_touched", "validation", "blockers"] },
  ownerSchema: { type: "object", properties: { schema_version: { const: ownerReceiptIdentity } }, required: ["schema_version"] },
  terminalSchemaV1: { type: "object", required: ["status", "unit_id"] },
  continuitySchema: { type: "object", required: ["canonical_successor"] },
  routerSchema: { type: "object", required: ["next_owner", "authority_effect"] },
  units
};

await writeJson(`${machineBase}/PLAN-EVIDENCE.json`, evidence);
const evidenceRef = await exact(`${machineBase}/PLAN-EVIDENCE.json`);
const binding = (bindingId, selector, ownerRef = "invoke-plan") => ({ binding_id: bindingId, owner_ref: ownerRef, artifact_ref: evidenceRef, selector });
const exactBinding = async (bindingId, ownerRef, artifactPath) => ({ binding_id: bindingId, owner_ref: ownerRef, artifact_ref: await exact(artifactPath), selector: "" });
const precloseoutSchemaRef = await exactBinding("precloseout-execution-schema", "task-session", "arcanum/arcana/task-session/schemas/precloseout-execution-receipt.schema.json");
const ownerCloseoutSchemaRef = await exactBinding("invoke-refresh-owner-schema", "invoke", "arcanum/spells/invoke/schemas/precloseout-refresh-closeout-receipt.schema.json");
const terminalSchemaRef = await exactBinding("task-session-terminal-schema", "task-session", "arcanum/arcana/task-session/schemas/governance-terminal-receipt.schema.json");
const continuitySchemaRef = await exactBinding("task-session-continuity-schema", "task-session", "arcanum/arcana/task-session/continuity.schema.json");
const routerSchemaRef = await exactBinding("continuation-router-schema", "continuation-router", "arcanum/arcana/continuation-router/schemas/continuation-route.schema.json");
const terminalValidatorRef = { binding_id: "task-session-terminal-semantic-validator", owner_ref: "task-session", artifact_ref: await exact("arcanum/arcana/task-session/scripts/plan-once-material-controller.py"), binding_mode: "opaque-exact-artifact" };

const automaticDecisions = ["internal-tool-selection", "capability-owner-routing", "reversible-local-default", "declared-fallback", "declared-retry", "fresh-task-session-resumption"];
const stopDecisions = ["product-or-semantic-choice", "scope-expansion", "destructive-or-irreversible-effect", "credentials-or-secret-access", "external-message-or-network-effect", "cost-policy-or-risk-acceptance", "authority-promotion-publication-deployment", "failed-acceptance-critical-validation"];
const allowedRoutes = units.flatMap((unit) => [
  {
    route_id: `task-session:${unit.unit_id}`,
    frontier_swu: unit.unit_id,
    capability: "task-session",
    mode: "execute",
    target: unit.unit_id,
    write_scope: unit.route_write_scope,
    effect_class: "repository-local-reversible",
    required_inputs: [`${planBase}/WORK-PACK.md`, `${machineBase}/PLAN-EVIDENCE.json`, `${machineBase}/selection-receipt-${unit.unit_id}.json`],
    expected_receipt: unit.terminal_receipt
  },
  {
    route_id: `invoke-refresh:${unit.unit_id}`,
    frontier_swu: unit.unit_id,
    capability: "invoke",
    mode: "refresh",
    target: workPackId,
    write_scope: [unit.closeout_receipt],
    effect_class: "repository-local-reversible",
    required_inputs: [unit.execution_receipt, `${machineBase}/PLAN-EVIDENCE.json`],
    expected_receipt: unit.closeout_receipt
  }
]);
const allowedRoutesDigest = digestValue(allowedRoutes);
const closureSource = {
  work_pack_id: workPackId,
  execution_entry_closure: {
    schema_version: "execution-entry-closure.v1",
    consumer_rehearsal: {
      effect: "deterministic-no-effect",
      exact_finalized_unit: units[0].unit_id,
      fixture_only_substitution: "forbidden",
      required_runs: 2,
      stages: ["wpra", "implementation-readiness", "context-builder", "mutation-admission", "governance-prepare", "closeout-preflight", "heterogeneous-owner-closeout", "terminal", "continuity"]
    },
    material_delta_classes: ["declared-add", "declared-replace", "generated-from-canonical"],
    lifecycle_closeout_delta_classes: ["evidence_added", "status_changed", "route_changed"],
    semantic_acceptance_binding: { required: true, eligibility_receipt: null, owner_acceptance_receipt: null }
  },
  units: units.map((unit) => {
    const lifecycleScopes = [
      { path: unit.precloseout_receipt, owner_capability: "task-session", write_class: "precloseout-receipt" },
      { path: unit.closeout_receipt, owner_capability: "invoke", write_class: "owner-closeout-receipt" }
    ];
    const executionContract = {
      writeProfile: "material-bound",
      materialWrites: unit.material_writes,
      executionOutputs: [unit.execution_receipt],
      allowedWrites: unit.allowed_writes,
      validationCommands: unit.validation_contracts.map((item) => item.argv.join(" ")),
      lifecycleOwner: "invoke",
      authorityClass: "private",
      publicationClass: "internal"
    };
    return {
      task_id: unit.task_id,
      unit_id: unit.unit_id,
      lifecycle_owner: "invoke",
      owner_receipt_schema_identity: ownerReceiptIdentity,
      authority_class: "private",
      publication_class: "internal",
      material_writes: unit.material_writes,
      executor_outputs: [unit.execution_receipt],
      validation_contracts: unit.validation_contracts,
      material_delta_classes: ["declared-add"],
      lifecycle_closeout_delta_classes: ["evidence_added", "status_changed", "route_changed"],
      native_context_projection: {
        task_id: unit.task_id,
        swu_id: unit.unit_id,
        strict_coverage: true,
        admission_schema_version: "1.2.0",
        execution_contract: executionContract
      },
      route_scope_partition: {
        schema_version: "task-session.fast-entry-route-scope-partition.v1",
        executor_write_scopes: unit.allowed_writes,
        lifecycle_owner_scopes: lifecycleScopes,
        terminal_receipt_scope: unit.terminal_receipt,
        exact_union_scope: unit.route_write_scope
      },
      route_write_scope: unit.route_write_scope
    };
  })
};
await writeJson(`${machineBase}/EXECUTION-ENTRY-CLOSURE.json`, closureSource);
const closureSourceRef = await exact(`${machineBase}/EXECUTION-ENTRY-CLOSURE.json`);
const closureBinding = (bindingId, selector) => ({ binding_id: bindingId, owner_ref: "invoke-plan", artifact_ref: closureSourceRef, selector });
const closureValidatorRef = { binding_id: "execution-entry-closure-validator", owner_ref: "task-session", artifact_ref: await exact("arcanum/arcana/task-session/scripts/execution_entry_projection.py"), binding_mode: "opaque-exact-artifact" };
const executionBindings = units.map((unit) => ({
  unit_id: unit.unit_id,
  task_id: unit.task_id,
  swu_id: unit.swu_id,
  lifecycle_owner: "task-session",
  authority_class: "private",
  publication_class: "internal",
  attempt_contract: { id_policy: "attempt-id-equals-task-session-run-id", collision_policy: "reject-existing-different-ticket", success_teardown: "retain-terminal-receipt", failure_teardown: "retain-block-receipt" },
  dependencies: unit.dependencies,
  canonical_successors: unit.canonical_successors,
  command: { argv: unit.validation_contracts[0].argv, cwd: unit.validation_contracts[0].cwd, risk_class: "bounded-write" },
  validation_contracts: unit.validation_contracts,
  material_writes: unit.material_writes,
  execution_outputs: [unit.execution_receipt],
  allowed_writes: unit.allowed_writes,
  material_package: { package_ref: null, producer_owner_ref: "task-session", producer_receipt_ref: null, schema_ref: null, declared_sha256: null, target_inventory_ref: null },
  byte_baselines: []
}));

const auditConfig = {
  schema_version: "2.0.0",
  audit_id: "bmc-rel-emits-closure-evidence-chain-plan-readiness",
  repository_root: ".",
  evidence_ceiling: "frozen-input-contractual-readiness",
  classifier_version: "wpra-projection-v1",
  admission_timing: "selected-unit-at-task-session",
  objective_ref: binding("objective", "/objective"),
  closure_receipt_refs: [binding("design-exit", "/status"), binding("placement-exit", "/decision"), binding("plan-receipt", "/status")],
  authority_bindings: { canonical_authority_refs: [binding("canonical-objective", "/objective")], semantic_bindings: { owner: binding("semantic-owner", "/owner"), material: binding("semantic-material", "/material"), validation: binding("semantic-validation", "/validation"), receipt: binding("semantic-receipt", "/receipt"), closeout: binding("semantic-closeout", "/closeout") } },
  execution_bindings: executionBindings,
  execution_entry_closure: { closure_ref: closureBinding("execution-entry-closure", "/execution_entry_closure"), units_ref: closureBinding("execution-entry-units", "/units"), validator_ref: closureValidatorRef, rehearsal_effect: "deterministic-no-effect" },
  receipt_bindings: { terminal_schema_ref: terminalSchemaRef, semantic_validator_ref: terminalValidatorRef, expected_receipt_refs: units.map((unit, index) => binding(`expected-terminal-${index + 1}`, `/units/${index}/terminal_receipt`)) },
  closeout_bindings: units.map((unit, index) => ({ unit_id: unit.unit_id, allowed_delta_policy_ref: binding(`allowed-delta-${index + 1}`, "/closeout/allowed_delta"), owner_receipt_contract_ref: binding(`closeout-owner-${index + 1}`, "/closeout"), compensation: { mode: "none", rationale: "Repository-local contract and evidence writes have no separately declared runtime side effect to compensate." } })),
  task_session_closeout_contracts: units.map((unit) => ({
    unit_id: unit.unit_id,
    receipt_profile: "precloseout-execution-v1",
    precloseout_execution_schema_ref: { ...precloseoutSchemaRef, binding_id: `precloseout-execution-schema-${unit.unit_id}` },
    expected_owner_receipt_schema_ref: { ...ownerCloseoutSchemaRef, binding_id: `invoke-refresh-owner-schema-${unit.unit_id}` },
    declared_owner_receipt_schema_identity: ownerReceiptIdentity,
    final_terminal_schema_ref: { ...terminalSchemaRef, binding_id: `final-terminal-schema-${unit.unit_id}` },
    continuity_schema_ref: { ...continuitySchemaRef, binding_id: `continuity-schema-${unit.unit_id}` },
    continuation_router_schema_ref: { ...routerSchemaRef, binding_id: `continuation-router-schema-${unit.unit_id}` }
  })),
  runtime_binding: { requested_task_session_execution_mode: "routed-mutation", task_session_admission_receipt_ref: null },
  status_receipt_refs: {
    artifact_authored_status: { value: "authored", owner_ref: "invoke-plan", receipt_ref: binding("status-artifact-authored", "/status") },
    registry_released_status: { value: "unreleased", owner_ref: "invoke-plan", receipt_ref: binding("status-registry-released", "/status") },
    mutation_runtime_ready_status: { value: "candidate", owner_ref: "invoke-plan", receipt_ref: binding("status-mutation-runtime", "/status") },
    audit_verdict: { value: "pending", owner_ref: "work-pack-readiness-audit", receipt_ref: binding("status-audit-verdict", "/status") }
  },
  lifecycle_status_refs: {
    plan_artifact_status: { value: "authored", owner_ref: "invoke-plan", receipt_ref: binding("lifecycle-plan", "/status") },
    audit_status: { value: "pending", owner_ref: "work-pack-readiness-audit", receipt_ref: binding("lifecycle-audit", "/status") },
    approval_status: { value: "unapproved", owner_ref: "relationship-validation contract owner", receipt_ref: binding("lifecycle-approval", "/approval") },
    chain_status: { value: "not-started", owner_ref: "task-session", receipt_ref: binding("lifecycle-chain", "/status") }
  },
  approval_policy: { approval_owner_ref: "relationship-validation contract owner", decision_gate_receipt_ref: binding("decision-gate", "/decision"), run_budget: { max_task_session_requests: 4 }, risk_policy_ref: binding("risk-policy", "/risk"), allowed_audit_verdicts: ["pass"], allowed_flag_classes: ["observability-residue"] },
  continuity_projection: { cursor: units[0].unit_id, completed_unit_receipt_refs: [], joined_closeout_receipt_refs: [], projected_next_successor: { unit_id: units[0].unit_id, canonical_successor_ref: binding("canonical-successor", "/successor"), projection_owner_ref: "work-pack-readiness-audit", equivalence_validator_ref: binding("equivalence-validator", "/equivalence"), continuation_router_verification_receipt_ref: binding("continuation-verification", "/continuation"), authority_effect: "none" } },
  execution_policy: { work_pack_id: workPackId, route_policy: "automatic-in-scope", allowed_routes: allowedRoutes, allowed_routes_digest: allowedRoutesDigest, automatic_decisions: automaticDecisions, stop_decisions: stopDecisions, scope_source: "exact-work-pack-and-captured-frontier", validation_policy: "owner-gates-remain-mandatory" },
  expected_material_digests: {}
};

const executionEntry = {
  schema_version: "arcanum.work-pack-execution-entry/v1",
  work_pack_id: workPackId,
  admission_timing: "selected-unit-at-task-session",
  frontier: units.map((unit) => unit.unit_id),
  execution_policy: { route_policy: "automatic-in-scope", allowed_routes: allowedRoutes, allowed_routes_digest: allowedRoutesDigest, digest_algorithm: "sha256 of RFC8785-compatible canonical JSON for allowed_routes", automatic_decisions: automaticDecisions, stop_decisions: stopDecisions, scope_source: "exact-work-pack-and-captured-frontier", validation_policy: "owner-gates-remain-mandatory", declared_retry: { max: 1, only_after: "REPAIRABLE_OWNER_CONDITION", same_route_and_binding: true } },
  execution_entry: { state: "selection-ready", selected_unit: null, route_id: null, next_owner: "implementation-readiness:execute" },
  pre_execution_owner_prerequisite: null,
  continuation_rule: "Select exactly one dependency-ready unit through fresh Implementation Readiness and Task Session admission; never execute a successor implicitly.",
  authority_effect: "none"
};

await writeJson(`${machineBase}/AUDIT-CONFIG.json`, auditConfig);
await writeJson(`${machineBase}/EXECUTION-ENTRY.json`, executionEntry);
console.log(JSON.stringify({ status: "pass", work_pack_id: workPackId, frontier_count: units.length, route_count: allowedRoutes.length, allowed_routes_digest: allowedRoutesDigest, evidence_ref: evidenceRef, authority_effect: "none" }));
