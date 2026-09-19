---
node_type: work-pack
is_session: false
status: candidate
created: 2026-07-09
authored_by: invoke (mode: plan)
design: ./DESIGN.md
layering: ./implementation-layering.md
target_artifact: DomainSpec v2 R1 AXIOMS authority-home closeout
complexity: low
output_mode: single-file
next_route: task-session
mutation_boundary: plan-only; task-session owns execution
---

# R1 AXIOMS Closeout - Work-Pack

## Control Fields

| Field | Value | Notes |
| --- | --- | --- |
| workPackGateStatus | pass | Ready for one bounded Task Session. |
| complexity | low | One authority-home closeout with validation and state sync. |
| outputMode | single-file | Split task files are unnecessary for this narrow scope. |
| executionPackRef | n/a | Execution details are inline. |
| layeringArtifactRef | `implementation-layering.md` | L0-L3 closeout boundaries. |
| dispatchTechniqueTrace | inline | See Dispatch Technique Trace. |
| distillValidationStatus | pass | One coherent R1 unit; residue is owned elsewhere. |
| activeLayerWindow | L0-L2 | Author authority, clean projection, sync closeout. |
| readinessProfile | internal continuation | Parent Batch-1 continuation, not release. |

## Objective Summary

Close Batch-1 R1 by creating the canonical AXIOMS authority home, removing
independent AXIOMS authority from `impl/spec`, preserving Saturn routing
provenance, validating the repo, and synchronizing Batch-1/Craft state.

## Current State

- R0 is done; relationship projection was deleted and code-tag tests are green.
- SWU-R1A-001 is complete as of 2026-07-09: `authority/AXIOMS.md`
  and `authority/AXIOMS.yml` exist, A2 binds C6, Saturn-routed material is
  preserved as pointers, and `impl/spec/AXIOMS.md` was deleted after
  validation passed.
- SWU-R1A-002 is complete as of 2026-07-10: parent manifest, Craft ledger,
  human Craft view, and related Batch-1 status now record R1 as closed after
  the definition-sync repair.
- `DEC-B1-SATURN-AXIOM-SCOPE` is resolved: DomainSpec keeps A1/A2/A3-recast;
  A4/A6 route to Saturn; A5 splits.
- `GAP-SH-PROSE-HOMES` still needs parent sync because its DRIFT half remains
  open and the R1 ledger/manifest closeout belongs to SWU-R1A-002.
- `impl/spec/AXIOMS.md` no longer carries independent axiom content.

## Delivery Slices

| Slice ID | Outcome | Layer | Dependencies | Validation |
| --- | --- | --- | --- | --- |
| S-R1-001 | Canonical `authority/AXIOMS.{md,yml}` exists. | L0 | none | Review: A1/A2/A3-recast present; Saturn pointers present. |
| S-R1-002 | `impl/spec/AXIOMS.md` is deleted or de-authorized. | L1 | S-R1-001 | `npm run validate` passes. |
| S-R1-003 | Parent status is synchronized. | L2 | S-R1-002 | Full validation plus manifest/Craft review. |

## Task Status Board

| Task ID | Goal | Layer | Source | Gate Status | Status |
| --- | --- | --- | --- | --- | --- |
| TASK-R1A-CLOSE | Execute the R1 AXIOMS authority-home closeout. | L0-L2 | `DEFINE.md`, `DESIGN.md`, parent `WORK-PACK.md` | pass | done |
| TASK-R1A-VERIFY | Verify and synchronize R1 closeout state. | L2 | validation commands, manifest, Craft ledger | pass | done |

## SWU Execution Handoff

| SWU ID | Parent Task | Source Anchors | Related Context | Dependencies | Write Scope | Done Criteria | Acceptance Evidence | Validation Surface | Execution Owner | Handoff Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SWU-R1A-001 | TASK-R1A-CLOSE | `impl/spec/AXIOMS.md`; `.craft/ledger.yml#DEC-B1-SATURN-AXIOM-SCOPE`; `authority/constitutions/domainspec-v2-CONSTITUTION.md#domainspec-v2-C6` | parent Batch-1 R1 row; `DEC-DSV2-SPEC-HOMING` | none | `authority/AXIOMS.md`; `authority/AXIOMS.yml`; `impl/spec/AXIOMS.md`; live references to AXIOMS | `authority/AXIOMS.{md,yml}` is canonical; A2 binds C6; Saturn pointers recorded; `impl/spec/AXIOMS.md` no longer carries independent authority. | `TASK-SESSION-SWU-R1A-001.md` plus passing validation. | `npm run validate` from `impl`; YAML parse | local-fallback | complete |
| SWU-R1A-002 | TASK-R1A-VERIFY | `IMPORT-MANIFEST.md`; `.craft/ledger.yml`; `CRAFT.md`; this work-pack | SWU-R1A-001 receipt; definition-sync repair receipt | SWU-R1A-001; SWU-R1A-002A | `IMPORT-MANIFEST.md`; `.craft/ledger.yml`; `CRAFT.md`; closeout receipts; related Batch-1 status | R1 marked reformulated/closed and residue explicitly named; parent next move advances without hiding R2/R5/R6 residue. | `definition-sync-repair/TASK-SESSION-SWU-R1A-002B.md` plus full validation receipt. | `npm run validate`; `npm run tags:test`; `npm run engine:test`; `npm run typecheck` from `impl` | local-fallback | complete |

## Execution Detail

### SWU-R1A-001 Algorithm

1. Read `impl/spec/AXIOMS.md` and extract A1-A6.
2. Create `authority/AXIOMS.md` with retained DomainSpec axioms:
   - A1: semantic authority precedes implementation.
   - A2: decisions belong to the domain, not adapters; explicit C6/layering
     adapter-line binding.
   - A3-recast: governance methods must be runnable/computable when they gate
     behavior.
3. Add routed-material entries:
   - A4 -> Saturn observer/executor split.
   - A6 -> Saturn feedback budget.
   - A5 -> split; shift-left stays with C5, reflection routes to Saturn.
4. Repoint live, non-historical references that should cite the canonical
   authority home.
5. Prefer deleting `impl/spec/AXIOMS.md`. If deletion breaks validation, replace
   it with a minimal non-authority redirect stub that links to the authority
   home and carries no duplicate axiom definitions.
6. Run `npm run validate` from `projects/domainspec-v2/impl`.

Edge cases:

- Historical research references may remain historical; do not rewrite them
  into false current authority.
- If A2-C6 cannot be expressed without changing constitution semantics, block
  and route to decision-gate.
- If a redirect stub remains, record it as non-authority compatibility residue.

### SWU-R1A-002 Algorithm

1. Update `IMPORT-MANIFEST.md` R1 row from `reformulation-pending` to
   `reformulated` with evidence summary.
2. Update `.craft/ledger.yml`:
   - add a R1 closeout description/receipt;
   - remove or amend the R1 portion of `GAP-SH-PROSE-HOMES`;
   - preserve the R5 drift-home portion if still open;
   - update next move toward R2/R7/R4/R5 as appropriate.
3. Update `CRAFT.md` as the human view of the ledger.
4. Run full gates from `projects/domainspec-v2/impl`:
   - `npm run validate`
   - `npm run tags:test`
   - `npm run engine:test`
   - `npm run typecheck`

## Blockers And Gaps

| ID | Scope | Description | Owner | Next Action |
| --- | --- | --- | --- | --- |
| none | R1 | No acceptance-critical blocker remains for R1 execution; R1 is closed. | n/a | Proceed to R2/R7 per parent plan. |
| RES-R1A-R6A | downstream | R6a constitution crosswalk remains open and must not be closed by R1 evidence. | CTX-DSV2-REFORMULATE-BATCH1 | Carry to R6a. |
| RES-R1A-R5 | downstream | DRIFT owner-home is a separate prose-home obligation. | CTX-DSV2-REFORMULATE-BATCH1 | Carry to R5. |

## Dispatch Technique Trace

| Technique ID | Applied To | Validation Expectation | Status |
| --- | --- | --- | --- |
| sequence | SWU-R1A-001 -> SWU-R1A-002 | State sync consumes implementation receipt. | pass |
| scu_swu_reduction | SWU boundary | Two SWUs: authority/projection, then sync/verify. | pass |
| recomposition_proof | R1 closeout -> Batch-1 parent | R1 row can close while R2/R5/R6 remain open. | pass |
| validation_loop | Every SWU | Validation command or review check named. | pass |
| owner_boundary_check | authority vs definitions vs impl/spec | Axioms are authority prose, not definition terms. | pass |
| artifact_contract_bridge | Work-pack to files/commands | Acceptance names concrete files and commands. | pass |
| concrete_path_evidence | Source anchors | Paths and row IDs are named. | pass |
| residue_ledger | R5/R6a/R2 residue | Non-R1 residue is explicitly preserved. | pass |
| execution_receipt_handoff | Task Session closeout | Expected receipt is validation + file diff + ledger update. | pass |

Full dispatch JSON is not required because this is a single-owner, local
Task Session handoff with no subagent fan-out, protected-context movement, or
cross-capability delegation.

## Distill Validation

| Check | Result | Evidence Or Gap |
| --- | --- | --- |
| Smallest coherent unit or SWU boundary | pass | R1 authority-home closeout is the smallest unit that closes `GAP-SH-PROSE-HOMES` for AXIOMS. |
| Recomposition proof | pass | R1 closeout recomposes into parent Batch-1 without claiming R2/R5/R6 completion. |
| Hidden acceptance-critical gaps | pass | Saturn decision is resolved; projection fate has an executable fallback. |
| Deferred complexity | pass | R6a/R5/R2 are named downstream residues. |
| Navigation to first executable unit | pass | Start with SWU-R1A-001. |

## Gate Checks

1. Do not start SWU-R1A-002 before SWU-R1A-001 has a receipt.
2. Do not mark R1 closed if `impl/spec/AXIOMS.md` still carries independent
   authority content.
3. Do not edit Saturn or create Saturn authority in this task.
4. Do not close R6a/R6b from this receipt.

## Next Route

R1 closeout is complete. Continue the parent Batch-1 plan with R2 verify-close
and R7 reconcile-close while preserving R5/R6 residue.
