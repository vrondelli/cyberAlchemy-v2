---
artifact_role: non-authoritative-evidence-staging
scope: DomainSpec-v1 relationship pattern cards plus current DS-D8 coverage gaps
v1_source_commit: 33859b561dc34e3d0b9cb3da76b6cb3d196daa65
live_ds_d8_sha256: c41453b06528b957b4bb2e3847e2a05ab93cd07243f0a09a70a55677dfe422e7
status: triaged
owner: architecture-pattern-enforcement
promotion_owner: definitions-governance
---

# Relationship Pattern-Card Evidence Staging

This is a non-authoritative staging matrix. It links practical evidence from
the frozen [v1 architecture pattern library](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md)
against the live [DS-D8 relationship registry](../../../../definitions/relationships/relationships.yml).
The accepted adjudication is in
[`relationship-card-triage/findings.md`](../../../r3-closeout-plan/research/2026-07-12-relationship-card-triage/findings.md).

The v1 source is pinned at commit
`33859b561dc34e3d0b9cb3da76b6cb3d196daa65`. The live DS-D8 file was modified
relative to parent HEAD during triage, so its 31 active signatures are pinned
here by working-content SHA-256
`c41453b06528b957b4bb2e3847e2a05ab93cd07243f0a09a70a55677dfe422e7`;
this document does not represent that state as a committed-HEAD fact.

`evidence-ready` means only that the scoped legacy example adds practical
authoring or review utility under current DS-D8. It does not transfer authority,
create a definition, or make a candidate active.

## Converged 36-row triage

| Relationship | v1 presence / selector | Live DS-D8 state / selector | Outcome | Scoped utility or residue | Owner action |
|---|---|---|---|---|---|
| `performs` | card, L80 | active, L20-L33 | `evidence-ready` | Entity-facing initiation call site; “actor” prose is non-authoritative. | Stage under typed Entity → Operation endpoints. |
| `produces` | card, L81 | active, L36-L49 | `staged-review` | Postcondition event placement is useful, but v1 “emits” wording blurs Entity `emits`. | Require explicit successful-Operation causation distinction. |
| `produces-for` | card, L82 | active, L52-L65 | `evidence-ready` | Foreign-feature projection/write seam. | Replace informal `@A/@B` with cross-feature metadata. |
| `creates` | no v1 card | active canonical | `staged-review` | Same-feature Operation creation effect, exact-target-bound by `creation_targets`; v1 supplies no card. | Preserve current DS-D8 contract and positive witnesses; manufacture no imported v1 evidence. |
| `triggers-cross` | card, L83 | active, L68-L81 | `evidence-ready` | Subscriber-to-operation cross-feature handoff. | Stage under current cross-feature obligations. |
| `enforces-cross` | card, L84 | deprecated, L525-L530 | `reject-or-superseded` | The scenario is residue; the separate verb is not. | Never author this label; route scenario to `enforces` review. |
| `enforces` | card, L85 | active with residue, L84-L97 | `staged-review` | Same-feature pre-mutation gate is useful; semantics mention cross-feature metadata while scope admits only `same-feature`. | Preserve contradiction for authority-owner review; do not edit DS-D8 here. |
| `calculates` | card, L86 | active, L100-L113 | `evidence-ready` | Derived-value consumption in a mutating use case. | Stage under current endpoints. |
| `transitions` | card, L87 | active, L116-L129 | `evidence-ready` | Event as lifecycle-transition input. | Subset only: do not infer every admitted scope from v1. |
| `exposes` | card, L88 | active, L132-L145 | `evidence-ready` | Boundary-to-use-case routing seam. | Stage shown Operation case under current target union. |
| `orchestrates` | card, L89 | active, L148-L161 | `staged-review` | Ordered multi-operation coordination. | Require current explicit Workflow scope before definition evidence. |
| `applies` | card, L90 | active, L164-L177 | `evidence-ready` | Runtime strategy selection. | Subset only: Operation target does not evidence Calculation target. |
| `maps` | card, L91 | active, L180-L193 | `evidence-ready` | Explicit boundary shape conversion. | Stage shown Interface case under current target union. |
| `contains` | card, L92 | active, L196-L209 | `evidence-ready` | Entity field placement for immutable values. | Stage under current endpoints. |
| `reads` | card, L93 | active, L212-L225 | `evidence-ready` | Entity-data dependency without ownership. | Subset only: Query source does not evidence the admitted Operation source; Calculation is excluded. |
| `emits` | card, L94 | active, L228-L241 | `evidence-ready` | Entity as event subject/source. | Preserve non-collapse from successful Operation `produces`. |
| `renders` | card, L100 | active, L276-L289 | `evidence-ready` | Page render-tree boundary. | Stage under current UI scope and multiplicity. |
| `wraps` | card, L101 | active, L292-L305 | `evidence-ready` | Shared layout shell over routes. | Stage under current UI scope and multiplicity. |
| `composes` | card, L102 | active, L308-L321 | `evidence-ready` | Component containment/import structure. | Stage under current UI scope and multiplicity. |
| `consumes` | card, L103 | active, L324-L337 | `evidence-ready` | Reactive Hook dependency. | Stage under current endpoints. |
| `submits` | card, L104 | active, L340-L353 | `evidence-ready` | Form input separated from submit behavior. | Keep Action typing despite hook-like example naming. |
| `shapes` | card, L105 | active, L356-L369 | `evidence-ready` | API-to-render-model transformation seam. | Stage under current endpoints. |
| `protects` | card, L106 | active, L372-L385 | `evidence-ready` | Route/render access gate. | Stage under current endpoints. |
| `displays` | card, L107 | active, L388-L401 | `evidence-ready` | Render-unit View Model dependency. | Stage under current endpoints. |
| `fetches` | card, L113 | active, L404-L417 | `evidence-ready` | UI-read bridge to backend Query. | Stage under current endpoints. |
| `mutates` | card, L114 | active, L420-L433 | `evidence-ready` | UI-write bridge to backend Operation. | Stage under current endpoints. |
| `reflects` | card, L115 | active, L436-L449 | `evidence-ready` | Visual state tied to lifecycle state. | Stage under current endpoints. |
| `derives` | card, L116 | active, L452-L465 | `evidence-ready` | Domain-to-render field lineage. | Stage under current endpoints. |
| `contracts` | card, L117 | active, L468-L481 | `staged-review` | Schema-to-API compatibility seam; v1 example targets an interface member. | Clarify member notation is not a distinct endpoint type. |
| `mirrors` | card, L118 | active, L484-L497 | `evidence-ready` | Client/backend authorization parity-test seam. | State that backend Rule remains authoritative. |
| `owns` | no v1 card | active canonical, L244-L257 | `staged-review` | Authority supplies custody/write-responsibility semantics; v1 supplies no card. | Record coverage gap only; future authoring must originate from DS-D8. |
| `belongs-to` | no v1 card | active canonical, L260-L273 | `staged-review` | Authority supplies membership/assignment semantics; v1 supplies no card. | Record coverage gap only; manufacture no imported card. |
| `owned-by` | no v1 card | generated view, L500-L509 | `reject-or-superseded` | Reverse navigation only; triage rejection does not change generated-view state. | Never author or count as an active canonical signature. |
| `depends-on` | no v1 card | deferred, L511-L515 | `deferred` | No distinct validation witness. | Preserve deferred residue; author no card. |
| `operation-returns-value-object` | no v1 card | deferred, L516-L519 | `deferred` | Currently modeled as an Operation signature property. | Preserve deferred residue; author no card. |
| `event-payload-publisher-composite` | no v1 card | deferred, L520-L523 | `deferred` | No distinct edge witness; current endpoint enforcement is sufficient. | Preserve deferred residue; author no card. |

Counts:

- 36 keyed rows = 29 v1-card-present + 7 no-v1-card.
- 24 `evidence-ready`, 7 `staged-review`, 3 `deferred`, and 2
  `reject-or-superseded`.
- 31 active signatures remain an authority count: 28 legacy-ID matches plus
  authority-only `owns`, `belongs-to`, and `creates`. Generated, deprecated, and deferred
  rows do not enter it.
