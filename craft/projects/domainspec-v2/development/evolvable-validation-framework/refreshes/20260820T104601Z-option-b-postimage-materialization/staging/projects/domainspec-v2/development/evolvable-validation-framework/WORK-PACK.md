---
workPackId: graph-composability-evidence-spine-candidate-a
proposalState: selected-and-applied
currentExecutionEntryState: selection-ready-blocked-on-audit
canonicalExecutionEntryState: selection-ready-blocked-on-audit
workPackGateStatus: blocked-on-audit
complexity: high
outputMode: split
activeLayerWindow: L0
swuCoverageStatus: complete
swuAtomicityStatus: pass
taskShapedSwuCount: 0
firstUnitNarrownessStatus: pass
closeoutSyncStatus: pass
authorityEffect: none
materialTopologyDecision: EVF-PKG-TOPOLOGY-001/EVF-PKG-B-EVIDENCE-ONLY
---

# Candidate A One-Shot Work Pack

## Objective

Prove one EVF-local causal path from the raw `HasKeyRule --enforces--> UnlockDoor` edge through exactly one derived obligation, an owner-admitted typed predicate, an exact fresh runtime binding, one generated executable assertion, a real pure harness runtime, independent expected evaluation, hostile controls, and a non-admitting receipt/closeout chain.

The Work Pack is plan-complete and the exact Option A planning/material corpus is applied, but execution remains blocked. It becomes eligible for Implementation Readiness only after fresh independent acceptance of those exact applied bytes.

## Planning And Source Mapping

`EVF-PKG-TOPOLOGY-001 / EVF-PKG-B-EVIDENCE-ONLY` keeps the material package
and producer receipt as run-local evidence. They are required inputs after
materialization, but never canonical targets in the 34-target apply.

| Planning concern | Proposal authority | Canonical apply target or runtime owner |
| --- | --- | --- |
| semantic/runtime choice | `DEC-GCP-001-R1.md` | decision file after explicit owner selection |
| layer boundary | `IMPLEMENTATION-LAYERING.candidate-a.md` | `IMPLEMENTATION-LAYERING.md` via Invoke Refresh |
| target/baseline ownership | `target-inventory.candidate-a.json` | work-pack machine inventory via Invoke Refresh; revalidated by Task Session |
| failure/command contract | `validation-contract.s1.json`, `FAILURE-MATRIX.md` | work-pack validation contract via Invoke Refresh |
| entry state | canonical selection-ready entry, blocked on its absent audit input | G1 created `work-pack/EXECUTION-ENTRY.json` from the reviewed postimage; G2 must supply the independent audit before classification |
| closeout | `CLOSEOUT-CONTRACT.md` | work-pack closeout contract; Task Session/Invoke owners |
| execution choreography | `EXECUTION-PACK.candidate-a.md` | `EXECUTION-PACK.md` via Invoke Refresh |
| gaps/decisions/traceability | proposal ledger and technique trace | existing shared planning targets via Invoke Refresh |

## Delivery Slice And Task Board

| Task | Role | Layer | Status | Selectable for implementation? |
| --- | --- | --- | --- | --- |
| `TASK-GCP-CONTRACT` | planning facet: exact source/runtime/material/failure contract | L0 | conditional proposal complete | no |
| `TASK-GCP-ENFORCES` | parent execution task for `SWU-GCP-001` | L0 | blocked on lifecycle gates | only after exact entry/admission |
| `TASK-GCP-VERIFY` | acceptance/closeout facet: replay, mutants, receipts, P/O/T | L0 | conditional proposal complete | no |

Contract and Verify cannot close separately and do not create independent implementation receipts.

## Smallest Working Unit Manifest

### `SWU-GCP-001`

- Parent task: `TASK-GCP-ENFORCES`.
- Primary behavior: one admitted `enforces` edge causally prevents or permits the bounded `UnlockDoor` harness operation and produces a replayable non-admitting receipt.
- Independent acceptance boundary: the only acceptance boundary is terminal `verify:evf-s1` plus exact E/P/O/T closure; no internal seam counts as completion.
- Dependencies: `S1-GATE-OWNER`, `S1-GATE-APPLY`, `S1-GATE-AUDIT`, `S1-GATE-ENTRY`, and `S1-GATE-ADMISSION` all pass.
- Source anchors: exact owner material in `proposals/candidate-a/postimages/`; raw key-door Rule source/graph/source-manifest refs in `key-door-binding.v1.json`; `relationships.yml` `enforces`; Stage-6 seven-seam design; target inventory; validation contract; closeout contract.
- Related context: current `WORK-PACK.md`, `DESIGN.md`, `PLAN.md`, findings, `audit.refresh-002`, and current dirty-state inventory selected by the Stage-1 Context Pack. Task Session must rebuild strict context from current applied bytes.
- Write scope: exactly forty-two unique route paths from the validated execution entry—eighteen implementation targets, twenty-one project-evidence outputs, and P/O/T. The eleven owner-material paths are required read-only inputs and are forbidden Task Session writes.
- Done criteria: exact acceptance vector; one generated test ID and one joined child-result envelope ID containing exactly two ordered runtime observations and one aggregate equality assertion; both runtime cases have exact transitions; all thirty-four failure contracts covered; 16/16 mutants killed; sixteen required negative receipts; one positive receipt; all eleven command contracts exit 0 in order; final T joins exact P and O; no successor executed.
- Acceptance evidence: target-result inventory, focused test output, typecheck, relationship validation, exact-content check, terminal verifier output, executor/validation/EVF receipts, P/O/T, and continuity cursor.
- Validation surface: `validation-contract.s1.json` is machine authority. Its eleven literal argv contracts run from `/home/vrondelli/projects/domainspec-core`, stop on the first nonzero exit, and preserve that exit.
- Execution owner recommendation: `local-fallback` governed by a fresh Task Session; Task Session may use one bounded native helper only under its own validated route and receipt rules.
- Expected result shape: native-stage or local-fallback receipt with `swu_id`, pass/flag/block/interrupted result, exact touched files, each validation result, blockers, residue, reroute, and handoff note; pass additionally includes exact E/P/O/T and EVF receipt refs.
- Handoff status: the canonical entry is selection-ready but the Work Pack remains `blocked-on-audit`; only G3 may classify it after G2, and Task Session remains blocked until admission is consumed.

## Split Analysis

Plausible children are typed source loading, obligation derivation, predicate evaluation, binding, generation/execution, receipts/mutants, and aggregation. They have useful local tests, but none has an independently reviewable acceptance boundary for the primary behavior:

- source/derivation without execution can pass vacuously;
- runtime without independent predicate expectation is tautological;
- generation without exact binding/child execution can preserve todo/skip greens;
- receipts without raw-byte replay and mutants can self-attest;
- aggregate without every upstream identity join can count unrelated greens.

The retained unit is therefore the smallest executable semantic closure. Local seam failures stop later seams; local seam passes are checkpoints, not separately closable work.

## Ordered Implementation Detail

1. ICR-S1-001 loads exact source/input/runtime contracts, validates schemas and decision refs, and defines closed TypeScript data types. No fallback to Markdown, fixture expectation, generated graph, or receipt is allowed.
2. ICR-S1-002 reads the raw Rule edge and canonical relationship signature, verifies source-manifest lineage, derives one stable obligation, and compares the exact O_gen set to the validation-owned O_spec set.
3. ICR-S1-003 validates only `eq(variable:boolean,literal:boolean)` and evaluates fixture vars directly. Unsupported nodes/operators/types fail before runtime import.
4. ICR-S1-004 resolves exactly one binding, reconciles every pinned digest plus the newly materialized runtime-module digest, and distinguishes missing, duplicate, ambiguous, and stale cases.
5. ICR-S1-005 adds an opt-in `evf-s1-strict` emitter mode and produces exactly one generated Vitest test ID, `evf.s1.generated-test.has-key-unlock-door.v1`, with no skip/todo/needs_formal/orphan/unrunnable marker. Inside that test, it invokes `attemptUnlock` exactly twice in fixture order, validates each output shape/transition, and makes exactly one aggregate deep-equality assertion, `evf.s1.aggregate.has-key-unlock-door.v1`, over the observed-versus-independent-expected Boolean vectors. Child Vitest emits exactly one joined result envelope ID, `evf.s1.child-result.has-key-unlock-door.v1`; `T_gen=1` and `E_run=1` count those two IDs, not the two runtime calls.
6. ICR-S1-006 rehashes raw artifacts, runs all sixteen isolated mutant cases, requires each typed negative receipt, validates the positive receipt independently, and rejects tamper before mutant aggregation.
7. ICR-S1-007 adds only `scripts.verify:evf-s1` surgically to the dirty `impl/package.json`, runs the eleven ordered command contracts, enforces the exact vector, and returns 0/1/2 by contract.

## Edge Cases And Failure Rules

- Absent or unselected source/runtime/material blocks before mutation or execution.
- Schema success never substitutes for owner admission.
- Output `unlocked/true`, `denied/false`, extra/missing fields, throw, or missing export fails before result projection.
- The false input is mandatory and kills always-unlock; the true input kills always-deny.
- Binding cardinality is exactly one; first-match-wins is forbidden.
- Empty tests, omitted targets, todo/skip markers, stale bytes, surviving mutants, missing negative receipts, or receipt tamper forbid the positive receipt.
- Any occupied create/P/O/T path or changed existing preimage is drift and blocks; no overwrite, reset, cleanup, mass-format, dependency install, or unrelated refactor.

## Task Session Closeout Synchronization

| SWU | Owner route | Source receipt | Owner receipt | Terminal receipt | Allowed planning deltas | Successor |
| --- | --- | --- | --- | --- | --- | --- |
| `SWU-GCP-001` | `invoke:refresh:apply-approved` after P | exact canonical P path/schema in `CLOSEOUT-CONTRACT.md` | exact O path/schema | exact T path/schema | `evidence_added`, `blocker_opened`, `blocker_resolved`, `status_changed`, `route_changed` only | none; emit cursor and set `successor_executed:false` |

Closeout may synchronize only the seven exact owner targets declared in the closeout contract. It cannot implement another task, alter semantics/authority, or begin a successor.

## Current Gate Summary

- Plan artifact completeness: conditional pass.
- SWU coverage/atomicity/first-unit narrowness: pass.
- Closeout synchronization: pass.
- Owner selection: pass for `DEC-GCP-001-R1:option-a`.
- Exact planning/material apply: pass, bound by the run-local package and producer-receipt paths named in the entry.
- Canonical entry: validator-clean and selection-ready, but non-routable until G2 supplies the exact audit input and G3 classifies the unchanged bytes.
- Mutation handoff: forbidden.
- Next owner: independent reviewer of the exact applied 34-target corpus.
