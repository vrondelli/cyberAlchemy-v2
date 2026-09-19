---
module: domainspec-v2-foundation-execution
status: refreshed-lane-split
updatedAt: 2026-07-17
docType: context-pack
selectionMode: deep-strict
---

# Planning Context: DomainSpec v2 Foundation Execution

## Intent

Turn the accepted first-production-release route into an execution-grade plan for the smallest safe chain:

```text
restore the retired-reference guard
  -> FPR-01 authority baseline
  -> FPR-02 lane split
       |-> FPR-02B backend release profile -> FPR-03 governed B-to-Spec mapping
       `-> FPR-02U UI development profile -> future UI authority decision
  -> FPR-04 two-node/one-edge Spec projection
```

This is planning evidence, not implementation, authority promotion, profile conformance, or production authorization.

## Context Builder Result

- Mode: deep, strict.
- Reason: the route crosses private authority, definitions, validation, ontology, semantic-engine, and continuation owners.
- Fallback search during execution: forbidden unless a task-local source anchor is missing or stale; the worker must record the fallback and stop on authority ambiguity.
- Runtime context packs: not generated here. Task Session must generate one from the selectors in each SWU.

## Selected Sources

| Source | Selector | Why selected |
|---|---|---|
| `.arcanum/inventory/index.json` | IDs `domainspec-v2-expanded-production-frontiers-strategy-result-synthesis`, `domainspec-v2-engine-gap-inventory-dispatch-closeout-synthesis` | Machine inventory routing. |
| `.arcanum/inventory/entries/domainspec-v2-expanded-production-frontiers-strategy-result-synthesis.md` | Ordered Route, Current Verdict | Non-authority synthesis of the approved release route. |
| `.arcanum/inventory/entries/domainspec-v2-engine-gap-inventory-dispatch-closeout-synthesis.md` | Accepted Result, Validation, Next Human Action | Non-authority synthesis of current engine and guard evidence. |
| `projects/domainspec-v2/.craft/ledger.yml` | `CTX-DSV2-FIRST-PRODUCTION-RELEASE`, `FR-FPR-ONTOLOGY-DIRECTION` | Sole continuation authority and live frontier state. |
| `projects/domainspec-v2/development/first-production-release/ROADMAP.md` | Ordered route, First execution frontier, Persistent frontiers | Canonical operational projection. |
| `projects/domainspec-v2/development/first-production-release/decisions/2026-07-17-fpr02-supported-profile-decision.md` | resolved lane split; remaining backend decisions | Current owner decision. |
| `projects/domainspec-v2/development/first-production-release/profile-lanes/fpr02-lanes.yml` | lanes; dependencies; independence; next SWUs | Machine lane projection. |
| `projects/domainspec-v2/development/ui-profile-implementation/WORK-PACK.md` | status; next SWU; gates | UI lane execution authority. |
| `projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/WORK-PACK.md` | backend formation plan and blockers | Backend lane companion plan. |
| `projects/domainspec-v2/development/first-production-release/craft/expected-node-edge-manifest.yml` | Nodes `FPR-01..04`, frontier `FR-FPR-ONTOLOGY-DIRECTION` | Machine projection of target artifacts, dependencies, proof, and negatives. |
| `projects/domainspec-v2/development/first-production-release/decisions/2026-07-12-product-release-contract.md` | accepted product boundary | Approved scope input. |
| `projects/domainspec-v2/development/first-production-release/research/2026-07-12-expanded-capability-frontiers/findings.md` | `FPR-01..04`, dependency DAG | Auditor-approved evidence and proof commands. |
| `projects/domainspec-v2/research/2026-07-14-engine-gap-inventory/findings.md` | `EGI-001..012`, `EGI-020`, safe slices | Accepted current gap/evidence crosswalk. |
| repository selector `rg -l 'TASK-SGRM-SYNC' projects/domainspec-v2/development` | `SWU-SGRM-006` | Existing identity and synchronization boundary. |
| repository selector `rg -l 'TASK-SGRM-VERIFY' projects/domainspec-v2/development` | `SWU-SGRM-007` algorithm | Existing guard contract. |
| repository selector `rg -l 'task-session-20260711-swu-sgrm-006' projects/domainspec-v2/development` | outcome and boundary | Historical proof that current-plan synchronization passed. |
| repository selector `rg -l 'task-session-20260711-swu-sgrm-007' projects/domainspec-v2/development` | guard evidence | Historical zero-violation receipt. |
| repository selector `rg -l 'task-session-20260711-swu-sgrm-008' projects/domainspec-v2/development` | closeout and residue | Historical aggregate closeout. |
| `projects/domainspec-v2/impl/tools/audit-retired-orchestration-references.ts` | classification precedence and violation kinds | Current deterministic guard behavior. |
| `projects/domainspec-v2/impl/tools/retired-orchestration-reference-allowlist.json` | exact exception contract | Current content-pinned exception surface. |
| repository selector `rg -l 'ACTIVE-REFERENCE-MANIFEST' projects/domainspec-v2/development` | frozen manifest | Historical census that must remain immutable. |
| `projects/domainspec-v2/definitions/meta-types/meta-types.yml`, `projects/domainspec-v2/definitions/relationships/relationships.yml`, `projects/domainspec-v2/definitions/DEFINITIONS.md` | canonical registries and count projections | FPR-01 census anchors. |

## Live Evidence Snapshot

On 2026-07-14, `npm --prefix projects/domainspec-v2/impl run audit:retired-orchestration` returned `FAIL`:

| Path | Current issue | Live whole-word count | Required posture |
|---|---:|---:|---|
| `development/first-production-release/research/2026-07-12-expanded-capability-frontiers/research.md` | unclassified | 1 | Review as evidence; do not auto-allow. |
| `development/meta-type-formalization/research/2026-07-08-open-questions-noncollapse/findings.md` | frozen-manifest count drift, 5 to 11 | 11 | Review the six added matches; use an exception only if all are historical evidence. |
| `research/2026-07-14-engine-gap-inventory/findings.md` | unclassified | 4 | Review as evidence; do not auto-allow. |
| `research/2026-07-14-engine-gap-inventory/research.md` | unclassified | 8 | Review as evidence; do not auto-allow. |

Aggregate: 212 matching files, 1,777 whole-word matches, 208 allowed files, four violations.

## Accepted Constraints

1. Claim must not exceed proof: the roadmap is auditor-approved but not execution authorization and production remains unauthorized.
2. The frozen SGRM-001 manifest remains frozen. Post-manifest changes use reviewed, exact path/count/reason/digest exceptions.
3. Reopen existing `SGRM-006/007`; do not create a parallel SGRM lifecycle/gap or claim the 2026-07-11 receipt was false.
4. `FPR-02` remains the lifecycle family; `FPR-02B` and `FPR-02U` are its
   independently resumable lane nodes. Task and SWU IDs remain execution handles.
5. Before FPR-01 closes, work is limited to guard restoration, census, deterministic drift detection, red fixtures, and proposed source dispositions.
6. Both lanes consume the ratified FPR-01 baseline. Neither may select favorable
   counts or use the other lane's state as evidence.
7. `FR-FPR-ONTOLOGY-DIRECTION` must be decided before FPR-03 promotion.
8. FPR-04 uses exactly one required source, two authoritative nodes, one admitted edge, explicit quotients, and an independently implemented comparator.
9. The interactive ontology application is a read-only downstream consumer after FPR-04; it cannot mint semantic or lifecycle authority.
10. No private DomainSpec material may be copied into the public `arcanum/` subtree.

## 2026-07-17 Refresh Boundary

The apply-approved lane refresh may update the FPR decision, planning artifacts,
Craft continuation, roadmap/manifest projections, and active lane pointers. It
does not change authority registries, supported-profile implementation, schemas,
validators, runtime code, SGRM evidence, prior receipts, release state, or
production authorization.
