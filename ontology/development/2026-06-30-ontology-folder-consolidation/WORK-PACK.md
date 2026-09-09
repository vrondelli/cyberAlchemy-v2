---
node_type: work-pack
is_session: false
status: completed
boundary: INTERNAL - planning evidence only
created: 2026-06-30
authored_by: invoke (mode=plan)
output_mode: split
next_owner: task-session
---

# WORK-PACK: Ontology Folder Consolidation

Canonical executable plan for carrying out the ontology-folder recommendation.
This work-pack is split because the work crosses multiple authority surfaces:
ontology package docs, definitions governance, specs boundary, project-local
witness material, and DomainSpec v2 instantiation guidance.

## Control Fields

| Field | Value | Notes |
| --- | --- | --- |
| workPackGateStatus | pass | L0 is executable; later gated tasks carry explicit blockers. |
| complexity | medium | More than two artifacts and multiple owner routes. |
| outputMode | split | Task and wave contracts are stored under `work-pack/`. |
| executionPackRef | `EXECUTION-PACK.md` | Required for medium complexity. |
| layeringArtifactRef | `IMPLEMENTATION-LAYERING.md` | Global layer decisions. |
| dispatchTechniqueTrace | `PLAN-DISPATCH.json` | Validated dispatch route for cross-owner handoff. |
| distillValidationStatus | pass | Selected slices completed; broader schema mutation remains out of scope and owner-gated. |
| activeLayerWindow | closed | W4 verification completed for selected execution scope. |
| lastUpdatedAt | 2026-06-30 | Verification closeout completed from current repository state. |
| readinessProfile | pilot | The goal is internal clarity and safe follow-up execution. |

## Objective Summary

- Objective: make the ontology-folder recommendation executable without
  collapsing authority surfaces or losing witness evidence.
- Primary inputs: CAV2 ontology package docs, CAV2 definitions, specs boundary,
  `projects/ontology` design evidence, DomainSpec v2 working-home docs, and the
  latest inventory synthesis.
- Success condition: future agents can tell where ontology meaning, definition
  meaning, specs, project witness material, and domain-local instantiation
  belong before creating or promoting ontology entries.

## Delivery Slices

| Slice ID | Outcome | Layer | Wave | Dependencies | Validation |
| --- | --- | --- | --- | --- | --- |
| S-001 | Visible non-collapse status bridge. | L0 | W0 | none | `git diff --check`; link/path review. |
| S-002 | CAV2 package harvest map for `projects/ontology`. | L1 | W1 | S-001 | Crosswalk rows cite source roles and forbidden readings. |
| S-003 | Challenge-contract reconciliation route. | L2 | W2 | S-002 | Decision/definitions receipt before schema mutation. |
| S-004 | Domain-local instantiation guidance and specs boundary. | L3 | W3 | S-002, optional S-003 | Candidate-only review; inventory refresh if new evidence is added. |
| S-005 | Completion audit. | L3 | W4 | S-001 through selected later slices | Gate review and validation notes. |

## Task Status Board

| Task ID | Goal | Layer | Complexity | Waves | Source | Gate Status | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [TASK-OCON-001](work-pack/tasks/TASK-OCON-001.md) | Add visible folder-role bridge. | L0 | low | [W0](work-pack/waves/W0.md) | `CONTEXT-PACK.md#source-anchors` | pass | completed |
| [TASK-OCON-002](work-pack/tasks/TASK-OCON-002.md) | Harvest `projects/ontology` into CAV2 package context. | L1 | medium | [W1](work-pack/waves/W1.md) | `projects/ontology/ARCHITECTURE.md` | pass | completed |
| [TASK-OCON-003](work-pack/tasks/TASK-OCON-003.md) | Reconcile challenge-contract schema tension. | L2 | medium | [W2](work-pack/waves/W2.md) | `DEFINITIONS.md#CAV2-D40`, schema proposal | pass | completed |
| [TASK-OCON-004](work-pack/tasks/TASK-OCON-004.md) | Add domain-local instantiation guidance. | L3 | medium | [W3](work-pack/waves/W3.md) | `projects/domainspec-v2/README.md` | pass | completed |
| [TASK-OCON-VERIFY](work-pack/tasks/TASK-OCON-VERIFY.md) | Verify and synchronize plan outcomes. | L3 | low | [W4](work-pack/waves/W4.md) | selected task receipts | pass | completed |

## SWU Execution Handoff

| SWU ID | Parent Task | Source Anchors | Related Context | Dependencies | Write Scope | Done Criteria | Acceptance Evidence | Validation Surface | Execution Owner | Handoff Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SWU-OCON-001 | [TASK-OCON-001](work-pack/tasks/TASK-OCON-001.md) | `projects/ontology/ARCHITECTURE.md`, `cyberAlchemy-v2/ontology/ARTIFACT-TREE.md` | `CONTEXT-PACK.md` | none | `projects/ontology/README.md`; `cyberAlchemy-v2/ontology/ARTIFACT-TREE.md` | README marks witness/incubator role; artifact tree points to it as private witness evidence. | [TASK-SESSION-SWU-OCON-001.md](TASK-SESSION-SWU-OCON-001.md). | `git diff --check -- projects/ontology/README.md cyberAlchemy-v2/ontology/ARTIFACT-TREE.md` | local-fallback | completed |
| SWU-OCON-002 | [TASK-OCON-002](work-pack/tasks/TASK-OCON-002.md) | `projects/ontology/ARCHITECTURE.md`, `GLOSSARY-CONSISTENCY.md` | CAV2 `PACKAGE-MODEL.md` | SWU-OCON-001 | `cyberAlchemy-v2/ontology/SOURCE-SURFACE-CROSSWALK.md`; `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md` | Crosswalk maps source role, allowed reading, forbidden reading, owner route, and harvest action. | [TASK-SESSION-SWU-OCON-002.md](TASK-SESSION-SWU-OCON-002.md). | `git diff --check -- cyberAlchemy-v2/ontology/SOURCE-SURFACE-CROSSWALK.md cyberAlchemy-v2/ontology/PACKAGE-MODEL.md` | local-fallback | completed |
| SWU-OCON-003 | [TASK-OCON-003](work-pack/tasks/TASK-OCON-003.md) | `DEFINITIONS.md#CAV2-D40`, `NODE-MODEL.md`, schema proposal | definitions-governance, decision-gate | SWU-OCON-002 | decision/definition review artifact only | Owner route selects canonical confidence wording and decides whether legacy keys survive. | [2026-06-30 challenge-contract confidence-axis review](../../../authority/definitions/reviews/2026-06-30-challenge-contract-confidence-axis-review.md) and [TASK-SESSION-SWU-OCON-003.md](TASK-SESSION-SWU-OCON-003.md). | Review receipt, not source mutation. | manual | completed |
| SWU-OCON-004 | [TASK-OCON-003](work-pack/tasks/TASK-OCON-003.md) | SWU-OCON-003 receipt, `NODE-MODEL.md`, schema proposal | CAV2 ontology route | SWU-OCON-003 | `cyberAlchemy-v2/ontology/NODE-MODEL.md`; `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md`; `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md`; `DEFINITIONS-INDEX.md` lookup sync | Docs reflect the owner-approved challenge-contract confidence wording. | [TASK-SESSION-SWU-OCON-004.md](TASK-SESSION-SWU-OCON-004.md); diff cites the owner receipt and does not add a third confidence axis. | `git diff --check -- cyberAlchemy-v2/ontology/NODE-MODEL.md cyberAlchemy-v2/ontology/PACKAGE-MODEL.md cyberAlchemy-v2/authority/definitions/DEFINITIONS.md cyberAlchemy-v2/authority/definitions/DEFINITIONS-INDEX.md` | local-fallback | completed |
| SWU-OCON-005 | [TASK-OCON-004](work-pack/tasks/TASK-OCON-004.md) | `projects/domainspec-v2/README.md`, CAV2 crosswalk | `cyberAlchemy-v2/specs/README.md` | SWU-OCON-002, SWU-OCON-004 | `projects/domainspec-v2/ontology/README.md` | DomainSpec v2 example is marked candidate/local and specs remain gated targets. | [TASK-SESSION-SWU-OCON-005.md](TASK-SESSION-SWU-OCON-005.md); reviewable candidate guidance with no promotion claim. | `git diff --check -- projects/domainspec-v2/ontology/README.md cyberAlchemy-v2/ontology/development/2026-06-30-ontology-folder-consolidation` | local-fallback | completed |
| SWU-OCON-006 | [TASK-OCON-VERIFY](work-pack/tasks/TASK-OCON-VERIFY.md) | selected SWU receipts | `.arcanum/inventory` if refreshed | selected implementation SWUs | verification notes only, plus inventory refresh if new evidence was added | Work-pack status and validation notes reflect completed slices. | [TASK-SESSION-SWU-OCON-006.md](TASK-SESSION-SWU-OCON-006.md); dispatch validation, diff check, and inventory refresh decision recorded. | `python arcanum/formulae/dispatch-spec/scripts/validate-dispatch.py PLAN-DISPATCH.json`; `git diff --check` | local-fallback | completed |

## Blockers

| Blocker ID | Scope | Description | Owner | Next Action | Target Date |
| --- | --- | --- | --- | --- | --- |
| BLK-OCON-001 | TASK-OCON-003 | Resolved by SWU-OCON-003 and SWU-OCON-004: canonical forward fields are `evidence_confidence` and `commitment_confidence`; legacy-field support is removed from active CAV2 schema/docs. | decision-gate plus definitions-governance | Closed for W2; future broader schema mutation still needs owner gates. | closed 2026-06-30 |
| BLK-OCON-002 | TASK-OCON-004 | Resolved by SWU-OCON-005: DomainSpec v2 gets a project-local candidate ontology instantiation surface, not a base ontology package. | ontology route | Closed for W3; promotion or spec mutation still needs owner gates. | closed 2026-06-30 |

## Dispatch Technique Trace

| Technique ID | Applied To | Validation Expectation | Status |
| --- | --- | --- | --- |
| sequence | context -> layering -> work-pack -> dispatch -> task-session | Downstream tasks consume explicit source refs and prior layer evidence. | pass |
| scu_swu_reduction | first executable unit | SWU-OCON-001 is small enough to execute and meaningful enough to reduce authority confusion. | pass |
| recomposition_proof | SWU set -> recommendation | SWUs recompose into "do not collapse; clarify roles; harvest safely; gate semantics." | pass |
| validation_loop | every delivery slice | Each slice has diff, review, receipt, or validator evidence. | pass |
| owner_boundary_check | invoke, task-session, definitions-governance, decision-gate | Invoke authors; task-session executes; owners decide promotion/schema meaning. | pass |
| handle_handoff | artifact paths and SWU IDs | Handoffs name handles instead of copying raw context. | pass |
| residue_ledger | blockers and deferred scope | BLK-OCON-001 and BLK-OCON-002 remain visible. | pass |
| execution_receipt_handoff | task-session SWUs | Later execution returns structured receipts. | pass |
| authority_split_gate | definitions vs ontology vs specs vs projects | Authority owner is separated from modeling/read-model surfaces. | pass |
| concrete_path_evidence | source anchors | Load-bearing claims cite concrete paths. | pass |
| state_namespace_boundary | private parent, public Arcanum, generated inventory | Plan does not write private evidence into public `arcanum/`. | pass |

## Distill Validation

| Check | Result | Evidence Or Gap |
| --- | --- | --- |
| Smallest coherent unit or SWU boundary | pass | SWU-OCON-001 is the first unit: status bridge only, no migration or deletion. |
| Recomposition proof | pass | L0-L3 recompose into the non-collapse recommendation. |
| Hidden acceptance-critical gaps | pass | BLK-OCON-001 is resolved for source sync by SWU-OCON-003 and SWU-OCON-004; broader schema mutation remains owner-gated. |
| Deferred complexity | pass | DomainSpec v2 instantiation and specs updates are deferred until base role clarity exists. |
| Navigation to first executable unit | pass | Start with `TASK-OCON-001` / `SWU-OCON-001`. |

## Gate Checks

1. `PLAN-DISPATCH.json` validates before handoff.
2. L0 can execute without resolving BLK-OCON-001.
3. Challenge-contract source sync consumed the SWU-OCON-003 owner receipt in SWU-OCON-004; broader schema mutation still needs owner gates.
4. No task deletes or moves `projects/ontology` unless a later owner decision replaces this plan.
5. No task writes private parent evidence into public `arcanum/`.
6. Specs receive candidate references only after promotion gates name the spec owner.

## Change Log

| Date | Change | Author |
| --- | --- | --- |
| 2026-06-30 | Initial invoke plan work-pack created. | invoke |
| 2026-06-30 | SWU-OCON-001 completed; W1/SWU-OCON-002 opened. | task-session |
| 2026-06-30 | SWU-OCON-002 completed; W3/SWU-OCON-005 opened with challenge-contract caveat. | task-session |
| 2026-06-30 | SWU-OCON-003 completed; W2 owner receipt opened SWU-OCON-004 doc sync. | task-session |
| 2026-06-30 | SWU-OCON-003 receipt revised by owner update to remove active legacy-key support. | decision-gate |
| 2026-06-30 | SWU-OCON-004 completed; challenge-contract confidence wording synced into active CAV2 model and definitions docs. | task-session |
| 2026-06-30 | SWU-OCON-005 completed; DomainSpec v2 local ontology instantiation guidance added. | task-session |
| 2026-06-30 | SWU-OCON-006 completed; verification closeout passed and inventory refresh was deferred until stabilization, promotion, or explicit request. | task-session |
