---
module: artifact-admission-validator
version: current
status: planned
updatedAt: 2026-07-11
docType: work-pack
---

# WORK-PACK: Artifact Admission Validator

## Control Fields

| Field | Value | Notes |
| --- | --- | --- |
| workPackGateStatus | pass | `SWU-AAV-001` complete; `SWU-AAV-002` is next eligible but not selected. |
| complexity | medium | More than two outputs, algorithmic policy evaluation, split tasks, and cross-owner closure. |
| outputMode | split | Tasks and waves are separate execution contracts. |
| executionPackRef | [EXECUTION-PACK.md](EXECUTION-PACK.md) | Required wave choreography. |
| layeringArtifactRef | [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md) | L0-L3 decisions. |
| dispatchTechniqueTrace | [artifact-admission-validator.dispatch.json](artifact-admission-validator.dispatch.json) | Full dispatch required by cross-capability ownership. |
| distillValidationStatus | pass | See [DISTILL-VALIDATION.md](DISTILL-VALIDATION.md). |
| activeLayerWindow | L0 | Contract and verdict proof only. |
| lastUpdatedAt | 2026-07-11 | Initial plan. |
| readinessProfile | pilot | Repository-local validator candidate. |

## Objective Summary

- Objective: implement a deterministic, two-phase validator for `CAV2-C18` that checks admission records without claiming constitution, definition, ontology, or promotion authority.
- Primary inputs: C18, the Artifact Tree Admission discipline, CAV2-D42/D51/D52, Canonical Kinds, C7, and C14.
- Success condition: the CLI returns stable receipts for pass/flag/block/defer fixtures, validates one live non-mutating CAV2 witness, fails closed on malformed policy sources, and leaves promotion to the owning routes.

## Delivery Boundary

Included:

- candidate JSON admission-record schema and example template;
- Python standard-library validator and strict Canonical Kinds table reader;
- pre-mutation and post-mutation phases;
- fixture corpus, CLI, JSON/text receipts, documentation, and owner handoffs.

Excluded:

- changing CAV2 definitions or Canonical Kinds semantics;
- promoting C18 or the discipline;
- creating a new canonical or authority kind;
- scanning every repository file automatically;
- CI or pre-commit enforcement before L2 evidence;
- public Arcanum generalization.

## Delivery Slices

| Slice ID | Outcome | Layer | Wave | Dependencies | Validation |
| --- | --- | --- | --- | --- | --- |
| S-AAV-0 | Admission record and verdict semantics are machine-checkable. | L0 | [W0](work-pack/waves/W0.md) | none | Schema parse and exact four-verdict fixtures. |
| S-AAV-1 | Live CAV2 policy sources can drive a repeatable two-phase CLI. | L1 | [W1](work-pack/waves/W1.md) | S-AAV-0 | Unit tests, malformed-table tests, live dry witness. |
| S-AAV-2 | C7/C14 composition, receipts, and degraded behavior are reliable. | L2 | [W2](work-pack/waves/W2.md) | S-AAV-1 | Full fixture matrix and owner-boundary audit. |
| S-AAV-3 | Documentation and governance handoffs are reviewable. | L2 | [W3](work-pack/waves/W3.md) | S-AAV-2 | Link checks, closure audit, owner proposals. |

## Task Status Board

| Task ID | Goal | Layer | Waves | Gate Status | Status |
| --- | --- | --- | --- | --- | --- |
| [TASK-AAV-001](work-pack/tasks/TASK-AAV-001.md) | Define admission contract and verdict fixtures. | L0 | W0 | `SWU-AAV-001` complete; `SWU-AAV-002` ready | in-progress |
| [TASK-AAV-002](work-pack/tasks/TASK-AAV-002.md) | Implement policy loader, validator core, and two-phase checks. | L0-L1 | W1 | waits for TASK-AAV-001 | not-started |
| [TASK-AAV-003](work-pack/tasks/TASK-AAV-003.md) | Harden fixtures, CLI receipts, and C7/C14 composition. | L1-L2 | W2 | waits for TASK-AAV-002 | not-started |
| [TASK-AAV-004](work-pack/tasks/TASK-AAV-004.md) | Integrate validation docs and prepare owner handoffs. | L2 | W3 | waits for TASK-AAV-003 | not-started |
| [TASK-AAV-VERIFY](work-pack/tasks/TASK-AAV-VERIFY.md) | Audit completion and execution evidence. | L2 | W3 | waits for all implementation tasks | not-started |

## SWU Manifest

| SWU ID | Parent Task | Goal | Source Anchors | Related Context | Dependencies | Write Scope | Acceptance Evidence | Verification | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `SWU-AAV-001` | [TASK-AAV-001](work-pack/tasks/TASK-AAV-001.md) | Define JSON schema, example template, receipt shape, and exit codes. | [C18/D51/D52 context](work-pack/shared/context.md) | [decisions](work-pack/shared/cross-task-decisions.md) | none | `cyberAlchemy-v2/validation/artifact-admission/{README.md,admission-record.schema.json,admission-record.example.json,receipt.schema.json}` | Schemas parse; examples represent working and governed admissions; no term is redefined. | `python3 -m unittest discover -s cyberAlchemy-v2/validation/artifact-admission/tests -p 'test_*.py'` after fixture kernel exists; schema parse review initially. | local-fallback | completed |
| `SWU-AAV-002` | [TASK-AAV-001](work-pack/tasks/TASK-AAV-001.md) | Encode pass/flag/block/defer policy fixtures and expected receipts. | [C18 verdict context](work-pack/shared/context.md) | [traceability](work-pack/shared/traceability.md) | SWU-AAV-001 | `cyberAlchemy-v2/validation/artifact-admission/fixtures/` | At least one exact fixture per verdict plus working inheritance and forbidden-claim cases. | Fixture JSON parse and expectation manifest check. | local-fallback | ready |
| `SWU-AAV-003` | [TASK-AAV-002](work-pack/tasks/TASK-AAV-002.md) | Implement strict Canonical Kinds table loader and policy snapshot. | [Canonical Kinds context](work-pack/shared/context.md) | [G-AAV-002](work-pack/shared/cross-task-gaps.md) | SWU-AAV-001 | `cyberAlchemy-v2/validation/artifact-admission/artifact_admission/policy.py`, tests | Header-driven parser returns unique kinds and fails closed on missing, duplicate, or malformed rows. | Targeted policy-loader unit tests. | local-fallback | blocked-by-001 |
| `SWU-AAV-004` | [TASK-AAV-002](work-pack/tasks/TASK-AAV-002.md) | Implement admission evaluation, inheritance, path containment, and pre/post phases. | [C18/D51/D52 context](work-pack/shared/context.md) | [decisions and gaps](work-pack/shared/cross-task-decisions.md) | SWU-AAV-002, SWU-AAV-003 | `cyberAlchemy-v2/validation/artifact-admission/artifact_admission/{model.py,validator.py,cli.py}`, tests | All rule checks produce deterministic check IDs, verdicts, evidence, and exit codes. | Full unit suite plus CLI fixture checks. | local-fallback | blocked-by-002-003 |
| `SWU-AAV-005` | [TASK-AAV-003](work-pack/tasks/TASK-AAV-003.md) | Add C7/C14 composition and malformed/degraded fixture matrix. | [C7/C14 context](work-pack/shared/context.md) | [traceability](work-pack/shared/traceability.md) | SWU-AAV-004 | validator package tests and fixtures | Load-bearing, durable-area, owner-gated extension, unresolved axiom, and durability-override cases behave as planned. | Fixture harness returns expected verdict for every manifest row. | local-fallback | blocked-by-004 |
| `SWU-AAV-006` | [TASK-AAV-003](work-pack/tasks/TASK-AAV-003.md) | Add stable JSON/text receipts and non-mutating live witness. | [validation boundary](work-pack/shared/context.md) | [G-AAV-001/G-AAV-004](work-pack/shared/cross-task-gaps.md) | SWU-AAV-005 | validator CLI/report modules, `cyberAlchemy-v2/validation/artifact-admission/evidence/` | Receipt schema passes; no repository mutation; policy digests and rule refs are present. | CLI against fixture corpus and one temporary live witness. | local-fallback | blocked-by-005 |
| `SWU-AAV-007` | [TASK-AAV-004](work-pack/tasks/TASK-AAV-004.md) | Document operation and prepare constitution/discipline owner handoff proposals. | [authority boundary](work-pack/shared/context.md) | [all cross-task gaps](work-pack/shared/cross-task-gaps.md) | SWU-AAV-006 | validator README, `cyberAlchemy-v2/validation/README.md`, plan evidence/handoff files | Validation owner docs name command and limits; proposed owner updates cite receipts without mutating authority silently. | Link check, public/private scan, owner-boundary review. | manual | blocked-by-006 |

## Blockers And Gaps

| ID | Type | Description | Owner | Handling |
| --- | --- | --- | --- | --- |
| G-AAV-001 | promotion gap | C18 and the discipline remain candidate. | constitution-governance and discipline-governance | Build a candidate validator; do not promote either authority surface. |
| G-AAV-002 | source-shape gap | Canonical Kinds is Markdown-only. | ontology route | Use one strict section/table parser with fail-closed tests; propose a machine projection only after evidence. |
| G-AAV-003 | definition gap | Per-instance durability override carrier is unresolved in Canonical Kinds OQ-3. | definitions/ontology owner | Exact default passes; override without owner note blocks; any override with note defers pending owner decision. |
| G-AAV-004 | rollout gap | No evidence yet supports repository-wide CI enforcement. | validation owner | Keep L3 deferred until L2 receipts establish false-positive behavior. |

No gap blocks `SWU-AAV-001`.

## Dispatch Technique Trace

| Technique | Applied To | Validation Expectation | Status |
| --- | --- | --- | --- |
| `sequence` | schema -> policy loader -> validator -> fixtures -> owner handoffs | every wave consumes prior evidence | pass |
| `scu_swu_reduction` | first handoff | `SWU-AAV-001` is independently executable and reviewable | pass |
| `recomposition_proof` | SWU chain | seven SWUs recompose into the C18 adapter without promotion | pass |
| `validation_loop` | fixtures and live witness | each implementation slice returns deterministic evidence | pass |
| `owner_boundary_check` | validation vs constitution/discipline/ontology | implementation never edits authority semantics | pass |
| `handle_handoff` | source anchors and receipts | owners receive paths, not copied private context | pass |
| `residue_ledger` | G-AAV-001 through G-AAV-004 | every gap has owner and handling | pass |
| `execution_receipt_handoff` | Task Session SWUs | result shape includes files, validation, blockers, and residue | pass |
| `authority_split_gate` | promotion and policy ownership | validation evidence cannot promote C18 or Canonical Kinds | pass |
| `artifact_contract_bridge` | C18/D51/D52 to validator checks | check IDs cite the contract they implement | pass |

Full route: [artifact-admission-validator.dispatch.json](artifact-admission-validator.dispatch.json).

## Distill Validation

See [DISTILL-VALIDATION.md](DISTILL-VALIDATION.md). Verdict: **pass**. The first
mutation-capable handoff is exactly `SWU-AAV-001`.

## Validation Strategy

- Structure: JSON parse, schema-shape checks, required/forbidden fields.
- Policy: strict Canonical Kinds section/table parser with exact header mapping.
- Semantics: fixture manifest covering all verdicts and C7/C14 selectors.
- Paths: normalized repository containment, existing owner surface, post-phase target/link checks.
- Reliability: malformed inputs, duplicate rows, missing policy files, inheritance cycles, and symlink-parent escape.
- Receipts: stable JSON schema, deterministic check IDs, policy source paths/digests, no hidden mutation.
- Governance: source links, owner boundaries, candidate status, and no automatic promotion.

## Gate Checks

1. Only `SWU-AAV-001` is selected for initial Task Session execution.
2. Every later SWU waits for explicit dependency evidence.
3. A policy parse failure blocks or reports tool error; it never defaults to allow.
4. Any canonical or authority claim unsupported by source contracts blocks.
5. Flags may create draft evidence but cannot constrain or promote.
6. Constitution and discipline updates require their owner routes after validator evidence exists.
7. L3 CI work requires a separate owner approval and L2 run receipts.

## Expected Task Session Receipt

```yaml
swu_id: SWU-AAV-001
result: pass | flag | block | interrupted
capability_ref: task-session
receipt_kind: native-stage | local-fallback | blocked
receipt_artifact: <path or none>
files_touched: []
validation: []
blockers: []
residue: []
reroute: <next owner or none>
handoff_note: <what the coordinator needs next>
```

## Execution Evidence

| SWU | Result | Receipt | Validation | Next State |
| --- | --- | --- | --- | --- |
| `SWU-AAV-001` | pass | [Task Session result](task-sessions/20260711T223159Z-SWU-AAV-001/RESULT.md) | Draft 2020-12 schema checks, 13-case contract matrix, JSON parse, link/scope/diff checks | `SWU-AAV-002` ready, not selected |

## Change Log

| Date | Change | Author |
| --- | --- | --- |
| 2026-07-11 | Synchronized passing `SWU-AAV-001` evidence. | Task Session |
| 2026-07-11 | Initial Invoke plan package. | Codex / invoke plan |
