---
artifact_id: INVOKE-REFRESH-UIR-2026-07-12
mode: refresh
mutation_mode: proposal-only
phase_status: pass
evidence_date: 2026-07-12
target_root: projects/domainspec-v2/development/ui-meta-type-repair
---

# Invoke Refresh Report: UI Repair Decision Closure

## Refresh Scope

Refresh the existing Invoke-authored architecture and plan after DEC-UIR-007
through DEC-UIR-010 were resolved. Preserve completed SWU-UIR-001 through 009,
all generation-001 artifacts, accepted UIF evidence, candidate status, DS-D1,
and DS-D8. Propose successor work only; do not execute tasks or mutate target
workflow artifacts in this run.

## Source Selection

Context Builder mode: standard, strict obligation mapping. Nine source groups
were selected; all seven refresh obligations are covered.

| Obligation | Selected evidence | Coverage |
| --- | --- | --- |
| O1 Preserve immutable history | generation-001 corpus, packet, dossier, and index | covered |
| O2 Implement bounded absence | DEC-UIR-007 in `DECISION-LEDGER.md` and final gate | covered |
| O3 Evaluate strict portability | DEC-UIR-008 and corpus generation 001 | covered |
| O4 Classify independent positives | DEC-UIR-009 and dossier generation 001 | covered |
| O5 Persist relationship decisions | DEC-UIR-010 and packet generation 001 | covered |
| O6 Recompose successor evidence | `ARCHITECTURE.md`, dossier/index contracts | covered |
| O7 Gate integrated audit | `WORK-PACK.md`, `TASK-UIR-VERIFY.md`, final gate | covered |

Inventory lookup selected the UI repair Invoke synthesis, the accepted repair
architecture research synthesis, and the accepted UIF-010 replication-review
synthesis. Nearby UI/product entries were excluded because they do not close a
repair-package obligation.

## Refresh Signals

| ID | Type | Claim | Safety |
| --- | --- | --- | --- |
| UIR-RS-001 | blocker_resolved | DEC-UIR-007 selects finite exhaustive search for `observed-absent`. | needs review |
| UIR-RS-002 | status_changed | DEC-UIR-008 fixes a per-candidate 2-corpus, 2-style, 2-reviewer threshold; current evidence is below it. | safe |
| UIR-RS-003 | status_changed | DEC-UIR-009 classifies Form and Action independent positives as `missing`, not disputed or failed. | safe |
| UIR-RS-004 | blocker_resolved | DEC-UIR-010 resolves all four DS-D8 owner questions without authority mutation. | needs review |
| UIR-RS-005 | status_changed | SWU-UIR-001 through 009 are complete; SWU-UIR-010 remains blocked downstream. | safe |
| UIR-RS-006 | route_changed | The next owner changed from decision-gate to Invoke planning. | safe |
| UIR-RS-007 | artifact_drift | Architecture, execution, shared gaps, and Inventory still describe owner decisions as pending. | safe |

## Delta Summary

| Delta class | Count | Proposed effect |
| --- | ---: | --- |
| blocker_resolved | 2 | Close human decision gates; retain downstream evidence obligations. |
| status_changed | 3 | Record completed history and typed current evidence states. |
| route_changed | 1 | Route to high-complexity `invoke plan`, then Task Session. |
| artifact_drift | 1 | Refresh stale planning and Inventory read models. |

## Proposed Architecture Delta

Add a versioned successor lane beside, not inside, generation 001:

```text
DEC-UIR-007 -> bounded-search receipt -> corpus generation 002
DEC-UIR-008/009 -> dossier-policy evaluation generation
DEC-UIR-010 + packet generation 001 -> relationship owner-decision generation
all successor handles -> formation dossier v2 -> orchestration index v2
                                                   |
                                                   v
                                         SWU-UIR-010 audit
```

The relationship transport packet remains decision-free. Owner choices belong
in a separate digest-bound decision receipt. The v1 corpus, dossier, packet,
and index contracts remain valid and immutable; extensions use new contract
versions or new record families.

## Proposed Successor SWUs

| SWU | Layer | Parent task | Responsibility | Dependencies |
| --- | --- | --- | --- | --- |
| SWU-UIR-011 | L0S | TASK-UIR-ABSENCE | Define and test the finite bounded-search receipt and corpus-v2 observation rules. | 001-003, 006, DEC-UIR-007 |
| SWU-UIR-012 | L1S | TASK-UIR-ABSENCE | Produce immutable corpus generation 002; emit `observed-absent` only for a complete error-free universe and otherwise preserve `not-observed`. | 011 |
| SWU-UIR-013 | L1S | TASK-UIR-DOSSIER-POLICY | Produce a typed policy-evaluation generation recording per-candidate portability below threshold and Form/Action independent-positive `missing`. | 006, 008, DEC-UIR-008/009 |
| SWU-UIR-014 | L1S | TASK-UIR-RELATIONSHIP-DECISION | Produce a separate owner-decision generation bound to packet generation 001 and the unchanged DS-D8 digest. | 007, DEC-UIR-010 |
| SWU-UIR-015 | L2S | TASK-UIR-SUCCESSOR-COMPOSITION | Produce formation dossier v2 and orchestration index v2 from 012-014, preserving `DEFER` and predecessor lineage. | 009, 012-014 |

After SWU-UIR-015, SWU-UIR-010 may run its integrated audit. No successor SWU
collects new portability corpora, admits an Action-source signature, promotes a
candidate, or mutates DS-D1/DS-D8.

## SWU Acceptance Outline

### SWU-UIR-011

- Inputs: declared finite source universe, pinned source and extractor digests,
  enumerated selectors, and fail-closed parse/extraction outcomes.
- Output: versioned bounded-search and corpus-v2 contracts plus positive,
  incomplete-universe, extractor-error, stale-digest, and zero-match fixtures.
- Done: only a complete, error-free, zero-match search can construct
  `observed-absent`; all incomplete paths construct `not-observed` or invalid.
- Validation: focused Node tests and schema validation.

### SWU-UIR-012

- Inputs: SWU-011 contracts and corpus generation 001 as predecessor.
- Output: immutable corpus generation 002 with explicit predecessor and input
  handles.
- Done: generation 001 is byte-unchanged; generation 002 replays identically;
  every absence claim has a bounded-search receipt.
- Validation: corpus tests, generation replay, and overwrite refusal.

### SWU-UIR-013

- Inputs: DEC-UIR-008/009, corpus generation 002, and accepted bounded review.
- Output: typed dossier-policy evaluation generation.
- Done: thresholds are counted per candidate, never pooled across candidates;
  current portability is below threshold; Form and Action independent-positive
  states are `missing`; no kill, collapse, identity, or promotion inference.
- Validation: threshold boundary fixtures, reviewer-independence fixtures, and
  deterministic replay.

### SWU-UIR-014

- Inputs: relationship packet generation 001, unchanged DS-D8 digest, and all
  four DEC-UIR-010 decisions.
- Output: separate immutable relationship owner-decision generation.
- Done: Action-source is route-open but unadmitted; Hook-Binding separation,
  Guard Page/Rule targets, and Binding endpoint retention are recorded; the
  transport packet remains unchanged; digest drift fails closed.
- Validation: option completeness, authority-digest mismatch, prohibited
  embedded mutation, and replay fixtures.

### SWU-UIR-015

- Inputs: successor corpus, dossier-policy, relationship-decision, and existing
  mutation/reroute generations.
- Output: formation dossier v2 and orchestration index v2 with predecessor
  handles.
- Done: independent-positive is `missing`, portability is non-pass below
  threshold, owner-firewall reflects resolved decisions, outcome remains
  `DEFER`, and generation 001 remains replayable.
- Validation: conjunct order/state, handle integrity, predecessor chain,
  deterministic replay, and in-place mutation refusal.

## Target Artifact Patch Set

The apply-stage plan should update:

- `SPEC.md`, `ARCHITECTURE.md`, and `EVIDENCE-CONTRACTS.md` for successor
  contracts and prohibited inferences;
- `IMPLEMENTATION-LAYERING.md`, `EXECUTION-PACK.md`, and `WORK-PACK.md` for
  SWU-UIR-011 through 015 and the `011 -> 012`, `013 || 014`, `015 -> 010`
  dependency route;
- task, wave, shared-gap, and traceability files under `work-pack/`;
- `ui-meta-type-repair.dispatch.json` and `INVOKE-TRANSPORT.md` for the revised
  cross-capability route and validation gates;
- `DISTILL-VALIDATION.md` with the successor reduction/recomposition result;
- the UI repair Inventory synthesis after the plan is applied and validated.

## Dispatch Technique Trace

| Technique | Activation | Effect / validation |
| --- | --- | --- |
| `sequence` | successor generations have strict dependencies | records the `011 -> 012`, `013 || 014`, `015 -> 010` route |
| `scu_swu_reduction` | broad policy closure spans several record families | reduces work to five single-parent SWUs |
| `recomposition_proof` | producer lanes must rejoin safely | SWU-015 proves all handles recompose before audit |
| `owner_boundary_check` | DS-D1/DS-D8 remain external | blocks promotion and authority mutation |
| `residue_ledger` | portability and Action-source evidence remain unmet | preserves gaps with owners and repair routes |
| `artifact_contract_bridge` | decisions must become typed records | maps DEC-UIR-007 through 010 into versioned receipt contracts |
| `execution_receipt_handoff` | Invoke hands bounded units to Task Session | requires one receipt per SWU |
| `authority_split_gate` | owner decisions are not transport or authority mutation | keeps the relationship decision record separate |

A full dispatch revision is required in `invoke plan` because the applied route
crosses Invoke, Task Session, evidence, DS-D1, and DS-D8 boundaries. It is not
created in this proposal-only refresh; the current validated dispatch remains
historical baseline evidence.

## Distill Validation

- Mode: Standard, inferred because the refresh spans architecture and plan.
- Role execution: local Proposer/Balancer simulation.
- Round 1 proposer: use four vertical successor slices.
- Round 1 balancer objection, responsibility overlap: bounded-search contract
  definition and corpus generation have different failure/replay boundaries.
- Reconciliation: split them into SWU-011 and SWU-012.
- Round 2 proposer: five SWUs with separate absence, policy, relationship, and
  recomposition responsibilities.
- Round 2 balancer objection, authority leakage: relationship closure could be
  embedded into the transport packet or read as DS-D8 mutation.
- Reconciliation: require a separate digest-bound owner-decision record and an
  explicit no-authority-effect field.
- Verdict: pass.
- Smallest coherent start: SWU-UIR-011, because the absence vocabulary cannot
  safely widen until its finite-search contract and failure fixtures exist.
- Recomposition proof: 011 enables 012; 012-014 supply independent successor
  handles; 015 composes those handles; 010 audits the complete chain.
- Premortem: likely failure is silently rewriting v1 artifacts or treating an
  owner decision as authority mutation. Guard with new versions, predecessor
  handles, overwrite refusal, digest checks, and prohibited-inference tests.
- Frame expiry: rerun refresh if the DS-D8 authority digest, generation-001
  handles, or selected decision policies change before plan application.

## Skipped Changes

- No target workflow artifacts were patched because mutation mode is
  proposal-only.
- No generation-001 artifact, accepted UIF evidence, candidate card, DS-D1
  definition, or DS-D8 signature was changed.
- No corpus collection, benchmark, experiment, or SWU execution was run.

## Remaining Gaps

- Apply approval and a high-complexity `invoke plan` are required before the
  work-pack can assign SWU-UIR-011.
- Current evidence remains below DEC-UIR-008's portability threshold.
- Form and Action still lack independent positives.
- Action-source has no exact signature witness and remains route-open only.
- SWU-UIR-010 remains blocked until SWU-UIR-011 through 015 produce accepted
  receipts.

## Next Route

Run `invoke plan` against this refresh bundle. The plan must apply the approved
artifact deltas, produce the high-complexity L0S-L3 slices and task specs,
revise and validate the full dispatch, rerun Distill validation, and hand only
SWU-UIR-011 to Task Session.
