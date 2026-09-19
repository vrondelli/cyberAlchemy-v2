---
artifact_id: CDSC2-INVOKE-TRANSPORT-v0.1
mode: define+design+plan
status: pass
target_owner: DomainSpec v2 compound calibration generation-2 cycle
next_route: task-session SWU-CDSC2-001
---

# Invoke Transport

## Intent And Discovery

The operator requested Invoke Define, Design, and Plan after generation 1
closed `CALIBRATION-DEFER`. The approved intent is to run the recommended
isolated F3 evidence repair and append a successor generation. The parent final
audit is the discovery artifact; no discovery waiver is required.

## Template Selection

| Stage | Selection | Eligibility |
| --- | --- | --- |
| define | DomainSpec specification baseline | stable objective, glossary, outcomes, invariants, and scope required |
| design | DomainSpec six-view architecture profile | normal design from approved define outputs with protected boundaries |
| plan | standalone implementation-layering and split work-pack companions | seven SWUs, cross-artifact append, and L0-L3 gates make complexity medium |
| execution | DomainSpec execution-pack | wave ordering and optional mutation fanout require explicit choreography |

No template tie exists.

## Outputs

### Define

- `SPEC.md`
- `GLOSSARY.md`
- `DECISION-LEDGER.md`
- `GAP-LEDGER.md`

### Design

- `ARCHITECTURE.md`, with all six required views
- `GLOSSARY-CONSISTENCY.md`, verdict `pass`

### Plan

- `IMPLEMENTATION-LAYERING.md`
- `IMPLEMENTATION-PLAN.md`
- `WORK-PACK.md`
- `EXECUTION-PACK.md`
- split task, wave, and shared context contracts under `work-pack/`
- `DISTILL-VALIDATION.md`, verdict `pass`
- `generation-002-evidence-repair.dispatch.json`

Full dispatch validation: `pass`, with zero blocks and zero flags.

## Dispatch Technique Trace

| Technique | Effect |
| --- | --- |
| `sequence` | fixes 001 -> 002 -> mutation join -> 005 -> 006 -> 007 |
| `scu_swu_reduction` | selects seven one-parent SWUs and SWU-001 as the first coherent unit |
| `recomposition_proof` | maps L0-L3 evidence into one successor generation and audit |
| `validation_loop` | gives every SWU a command and evidence gate |
| `owner_boundary_check` | separates Invoke planning, Task Session execution, source ownership, and governance authority |
| `handle_handoff` | reuses generation-1 receipts/results by stable handle |
| `residue_ledger` | preserves visual, portability, and pattern-replication exclusions |
| `execution_receipt_handoff` | requires one structured receipt and observability signal per SWU |
| `authority_split_gate` | prevents evidence outcomes from becoming type/pattern/promotion actions |
| `artifact_contract_bridge` | binds schemas, manifests, receipts, results, and index validation |
| `concrete_path_evidence` | pins parent artifacts and Savvy source selectors |
| `state_namespace_boundary` | separates generation 1, generation 2, mutant subtrees, and fixture sources |

`observability_grouping` was considered but skipped: only two optional parallel
mutation workers exist, and normal per-SWU Task Session signals are sufficient.

## Decisions

- Use a source-derived isolated harness.
- Require baseline equivalence before mutation execution.
- Target step 9 for M1 and direct requested-step commit for M2.
- Add a versioned parity/successor layer without changing parent v1 modules.
- Reuse F1/F2 by handle and replace only F3 evidence in generation 2.

## Gaps And Gates

No authoring blocker remains. Runtime blockers are source/generation drift,
baseline mismatch, mutant edit-surface breach, and predecessor conflict.

Necronomicon transport: no matching target section was present or required;
Inventory synchronization is deferred to execution closeout so planning does
not masquerade as verified experiment evidence.

## Handoff

Next owner: `task-session`.

Start: `SWU-CDSC2-001`. Select its task contract, parent frozen schema and
validator modules, generation-1 protected artifacts, and no fixture source.
