---
artifact: invoke-refresh-report
status: pass
updatedAt: 2026-07-18
mode: refresh
mutationMode: apply-approved
observedCapability: invoke
targetOwner: DomainSpec-v2 evolvable-validation-framework development cycle
---

# Refresh Report: Relocate The Invoke Package To Development

## Scope And Approval

- Source package before relocation:
  `projects/domainspec-v2/research/evolvable-validation-framework/invoke/`
- Target package:
  `projects/domainspec-v2/development/evolvable-validation-framework/`
- Approval evidence: the user explicitly requested refresh and relocation to the
  development directory on 2026-07-18.
- Mutation mode: `apply-approved`.
- Execution boundary: artifact relocation and reference repair only. No SWU,
  implementation, consumer proof, release transition, or authority promotion.

## Refresh Signals

| Signal | Type | Claim | Evidence | Safety |
| --- | --- | --- | --- | --- |
| REF-GCP-001 | route_changed | the Invoke package belongs in the development lifecycle tree | explicit user request plus existing Task Session handoff | safe |
| REF-GCP-002 | evidence_added | v1 `operations.md` and `interfaces.md` are selected adaptation patterns | `V1-ASPECT-ADOPTION.md` and v1 source files | safe |
| REF-GCP-003 | artifact_drift | relative links and planned evidence paths become stale after relocation | pre-move path scan | safe to repair |
| REF-GCP-004 | no_op | lifecycle and execution state remain unchanged | `PLAN.md`, `WORK-PACK.md`, `DISTILL-VALIDATION.md` | safe |

## Target Inventory

The complete Invoke package moved as one unit: define, glossary, six-view
design, layering, plan, split work-pack, execution pack, Distill result,
dispatch artifacts, v1 aspect decision, transport report, and observability.
Research findings and the plain-language research artifacts remain under the
research tree and are linked as evidence sources.

## Applied Changes

1. Relocated the package to the development directory without copying or
   deleting the research findings.
2. Repaired links to research findings, relationship authority, and the
   first-production-release backend completeness package.
3. Updated the planned `SWU-GCP-001` evidence write scope to the development
   package.
4. Updated plan dispatch and transport target paths.
5. Added this report, its machine-readable projection, bounded refresh context,
   and a validated refresh dispatch.

## Status And Distill

- Work-pack status remains `candidate-awaiting-task-session`.
- First unit remains `SWU-GCP-001`; nothing was selected or executed here.
- Existing Distill verdict remains `pass-with-flags`.
- A new Distill run was skipped because relocation changes paths and provenance,
  not task scope, acceptance boundaries, decomposition, or recomposition.

## Skipped Changes

- Inventory entries were not rewritten: their authorities are the research
  findings and guide, which did not move.
- No first-production-release, implementation, canonical definition, consumer,
  or release artifact was changed.
- No structured interview was needed because source, destination, mutation mode,
  and expected next route were explicit and collision-free.

## Validation

| Check | Result |
| --- | --- |
| refresh Dispatch Spec | pass, zero blocks and flags |
| original planning Dispatch Spec | pass, zero blocks and flags |
| all seven JSON artifacts | parse successfully |
| local Markdown links | zero broken links |
| old source path in operational artifacts | absent; refresh provenance retains the former path as historical evidence |
| research findings preserved and old `invoke/` child removed | pass |
| whitespace and `git diff --check` | pass |

## Result And Next Route

Phase status: `pass`. The next lifecycle owner
remains `task-session`, which may select only `SWU-GCP-001` from
`work-pack/tasks/TASK-GCP-ENFORCES.md`.
