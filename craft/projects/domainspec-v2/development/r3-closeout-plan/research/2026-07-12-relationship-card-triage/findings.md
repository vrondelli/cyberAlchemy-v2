---
dispatch_id: 2026-07-12-r3c-relationship-card-triage
artifact_role: relationship-card-triage-findings
status: accepted
created: 2026-07-12
v1_provenance_commit: 33859b561dc34e3d0b9cb3da76b6cb3d196daa65
live_ds_d8_sha256: 567fda214dbf3d2cdfe8f360020d2497cccc611bbcfd05f2fd885e8ad308ab41
final_audit: ACCEPT
---

# SWU-R3C-006 Relationship-Card Triage Findings

## Authority and evidence boundary

This is a non-authority triage artifact. DomainSpec v1 is a frozen practical-evidence
source pinned at commit `33859b561dc34e3d0b9cb3da76b6cb3d196daa65`; it does not
govern v2 semantics ([Import Manifest](../../../../IMPORT-MANIFEST.md#domainspec-v1--v2-import-manifest-the-way)).
The live DS-D8 relationship registry remains authoritative
([relationships.yml](../../../../definitions/relationships/relationships.yml)). Its
content was modified relative to parent `HEAD` during this dispatch, so the current
30-signature state is identified by working-content SHA-256
`567fda214dbf3d2cdfe8f360020d2497cccc611bbcfd05f2fd885e8ad308ab41`,
not represented as a committed-`HEAD` fact. The underlying provenance and full-outer-join
proof are preserved verbatim in [research.md](research.md#agent-2--noether-emmy).

The v1 source has 29 authored relationship rows: 15 backend, eight intra-UI, and six
cross-layer rows ([v1 library:74-118](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#relationship-pattern-cards-one-example-per-relationship-type)).
The keyed full outer join adds six DS-D8 entries with no v1 card, yielding 35 rows.

## Reviewer adjudication

- **Popper — UPHOLD (non-vacuity).** `evidence-ready` is reserved for a legacy row
  with concrete authoring utility beyond restating the DS-D8 schema. All 24 admitted
  rows below identify a usable implementation or review seam. `transitions`, `applies`,
  and `queries` are admitted only for their evidenced v1 subsets; their broader DS-D8
  domains are not inferred from the v1 example.
- **Lakatos — UPHOLD (definitional soundness).** Copying a legacy label never grants
  authority. `owned-by` remains a generated view even though its triage outcome is
  `reject-or-superseded`; `owns` and `belongs-to` have no imported legacy card;
  `produces` stays distinct from `emits`; the `enforces` scope contradiction remains
  review residue; and all three DS-D8 deferred candidates remain deferred.

## Retained disagreement and resolution

Abramsky found practical utility in all 29 v1 rows and would preserve even the
cross-feature enforcement scenario as useful evidence. Noether held that matching IDs
and useful examples are insufficient for admission because current DS-D8 semantics and
provenance govern. The synthesis retains both points: useful, semantically compatible
legacy evidence may be staged as `evidence-ready`, but drifted or incomplete evidence
remains `staged-review`; `enforces-cross` cannot survive as an authored relationship.
The live `enforces` record says cross-feature enforcement is metadata while admitting
only `same-feature` scope, so that contradiction is residue for a later authority-owned
decision—not permission to edit DS-D8 here.

## Cited 35-row full outer join

Path keys in the table are exact selectors relative to this repository:

- `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:Lx` means the file in
  `implementation/domainspec` at the pinned v1 commit.
- `DS-D8@567fda…:relationships.yml:Lx-Ly` means the live working-content digest above
  in `projects/domainspec-v2/definitions/relationships/relationships.yml`.

| ID | Presence | Exact v1 provenance/source | Live DS-D8 state and source | Scoped practical utility | Outcome | Residue / rationale | Parent staging action |
|---|---|---|---|---|---|---|---|
| `performs` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L80` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#backend-edges-15)) | active, Entity → Operation; `DS-D8@567fda…:relationships.yml:L20-L33` ([source](../../../../definitions/relationships/relationships.yml)) | Actor-facing initiation call site. | `evidence-ready` | v1 “actor/entity” prose is broader than its typed Entity endpoint; DS-D8 typing controls. | Stage utility and example under the current typed endpoints. |
| `produces` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L81` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#backend-edges-15)) | active, Operation → Event on successful completion; `DS-D8@567fda…:relationships.yml:L36-L49` ([source](../../../../definitions/relationships/relationships.yml)) | Locates event production after operation postconditions. | `staged-review` | v1 says “emits,” blurring the separate Entity → Event `emits` relationship. | Stage with explicit `produces`/`emits` distinction; require semantic review. |
| `produces-for` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L82` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#backend-edges-15)) | active, Operation → Entity, cross-feature; `DS-D8@567fda…:relationships.yml:L52-L65` ([source](../../../../definitions/relationships/relationships.yml)) | Makes a foreign-feature projection/write seam explicit. | `evidence-ready` | v1 `@A/@B` notation is informal; DS-D8 scope metadata controls. | Stage scenario with explicit cross-feature metadata. |
| `triggers-cross` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L83` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#backend-edges-15)) | active, Event → Operation, cross-feature; `DS-D8@567fda…:relationships.yml:L68-L81` ([source](../../../../definitions/relationships/relationships.yml)) | Identifies subscriber-to-operation cross-feature handoff. | `evidence-ready` | Replace informal `@A/@B` notation with governed scope metadata. | Stage the handoff under current cross-feature obligations. |
| `enforces-cross` | v1 card + deprecated | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L84` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#backend-edges-15)) | deprecated; replacement `enforces`; `DS-D8@567fda…:relationships.yml:L525-L530` ([source](../../../../definitions/relationships/relationships.yml)) | Cross-feature rule-gate scenario is practically useful. | `reject-or-superseded` | Cross-feature is scope metadata, not a separate verb; the scenario cannot preserve this ID. | Record rejection; carry scenario only as unresolved `enforces` review residue. |
| `enforces` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L85` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#backend-edges-15)) | active, Rule → Operation; stated cross-feature metadata but declared scope only `same-feature`; `DS-D8@567fda…:relationships.yml:L84-L97` ([source](../../../../definitions/relationships/relationships.yml)) | Concrete pre-mutation guard placement. | `staged-review` | DS-D8’s prose/scope contradiction must be resolved by the authority owner. | Stage same-feature example; flag contradiction without editing DS-D8. |
| `calculates` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L86` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#backend-edges-15)) | active, Calculation → Operation; `DS-D8@567fda…:relationships.yml:L100-L113` ([source](../../../../definitions/relationships/relationships.yml)) | Shows where a derived value enters a mutating use case. | `evidence-ready` | No material semantic drift found. | Stage utility and example under current obligations. |
| `transitions` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L87` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#backend-edges-15)) | active, Event → State Machine, broader declared scope; `DS-D8@567fda…:relationships.yml:L116-L129` ([source](../../../../definitions/relationships/relationships.yml)) | Identifies an event as lifecycle-transition input. | `evidence-ready` | **Subset qualifier:** v1 proves only its shown Event → State Machine case, not every admitted DS-D8 scope. | Stage only the evidenced case; retain DS-D8 for broader scope. |
| `exposes` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L88` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#backend-edges-15)) | active, Interface → Operation or Query; `DS-D8@567fda…:relationships.yml:L132-L145` ([source](../../../../definitions/relationships/relationships.yml)) | Connects a callable boundary to use-case behavior. | `evidence-ready` | Example covers Operation; typed union remains authority. | Stage example as one admitted target case. |
| `orchestrates` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L89` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#backend-edges-15)) | active, Workflow → Operation with ordered multiplicity and scope obligation; `DS-D8@567fda…:relationships.yml:L148-L161` ([source](../../../../definitions/relationships/relationships.yml)) | Makes ordered multi-operation coordination explicit. | `staged-review` | v1 lacks the current explicit scope obligation. | Stage sequence utility; require scope-obligation review. |
| `applies` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L90` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#backend-edges-15)) | active, Policy → Operation or Calculation; `DS-D8@567fda…:relationships.yml:L164-L177` ([source](../../../../definitions/relationships/relationships.yml)) | Shows runtime strategy selection at consuming behavior. | `evidence-ready` | **Subset qualifier:** v1 evidences only Policy → Operation, not the Calculation target. | Stage Operation case only; do not generalize legacy evidence. |
| `maps` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L91` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#backend-edges-15)) | active, Mapping → Entity or Interface; `DS-D8@567fda…:relationships.yml:L180-L193` ([source](../../../../definitions/relationships/relationships.yml)) | Places explicit shape conversion at a boundary. | `evidence-ready` | Example covers Interface; typed union remains authority. | Stage example as one admitted target case. |
| `contains` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L92` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#backend-edges-15)) | active, Entity → Value Object; `DS-D8@567fda…:relationships.yml:L196-L209` ([source](../../../../definitions/relationships/relationships.yml)) | Gives a field-structure cue for immutable domain values. | `evidence-ready` | No material semantic drift found. | Stage utility and example under current obligations. |
| `queries` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L93` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#backend-edges-15)) | active, Query or Calculation or Operation → Entity; `DS-D8@567fda…:relationships.yml:L212-L225` ([source](../../../../definitions/relationships/relationships.yml)) | Makes read ownership and entity access visible. | `evidence-ready` | **Subset qualifier:** v1 evidences only Query → Entity, not Calculation/Operation sources. | Stage Query-source case only; do not generalize legacy evidence. |
| `emits` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L94` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#backend-edges-15)) | active, Entity → Event; `DS-D8@567fda…:relationships.yml:L228-L241` ([source](../../../../definitions/relationships/relationships.yml)) | Identifies the changed entity as event subject/source. | `evidence-ready` | Must remain distinct from successful Operation → Event `produces`. | Stage with explicit entity-source distinction. |
| `renders` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L100` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#intra-ui-edges-8)) | active, Page → Component; `DS-D8@567fda…:relationships.yml:L276-L289` ([source](../../../../definitions/relationships/relationships.yml)) | Gives a page’s concrete render-tree boundary. | `evidence-ready` | DS-D8 controls multiplicity and UI scope. | Stage render-tree utility and example. |
| `wraps` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L101` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#intra-ui-edges-8)) | active, Layout → Page; `DS-D8@567fda…:relationships.yml:L292-L305` ([source](../../../../definitions/relationships/relationships.yml)) | Shows shared-shell ownership over routes. | `evidence-ready` | DS-D8 controls multiplicity and UI scope. | Stage shell/route utility and example. |
| `composes` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L102` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#intra-ui-edges-8)) | active, Component → Component; `DS-D8@567fda…:relationships.yml:L308-L321` ([source](../../../../definitions/relationships/relationships.yml)) | Makes component containment/import structure explicit. | `evidence-ready` | DS-D8 controls multiplicity and UI scope. | Stage containment utility and example. |
| `consumes` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L103` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#intra-ui-edges-8)) | active, Component → Hook; `DS-D8@567fda…:relationships.yml:L324-L337` ([source](../../../../definitions/relationships/relationships.yml)) | Identifies the reactive data/state dependency. | `evidence-ready` | No material semantic drift found. | Stage utility and example under current obligations. |
| `submits` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L104` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#intra-ui-edges-8)) | active, Form → Action; `DS-D8@567fda…:relationships.yml:L340-L353` ([source](../../../../definitions/relationships/relationships.yml)) | Separates form input/validation from submit behavior. | `evidence-ready` | Hook-like example naming does not change Action typing. | Stage with explicit Action endpoint type. |
| `shapes` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L105` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#intra-ui-edges-8)) | active, Adapter → View Model; `DS-D8@567fda…:relationships.yml:L356-L369` ([source](../../../../definitions/relationships/relationships.yml)) | Locates API-to-render-model transformation. | `evidence-ready` | No material semantic drift found. | Stage utility and example under current obligations. |
| `protects` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L106` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#intra-ui-edges-8)) | active, Guard → Page; `DS-D8@567fda…:relationships.yml:L372-L385` ([source](../../../../definitions/relationships/relationships.yml)) | Shows route/render access gate placement. | `evidence-ready` | No material semantic drift found. | Stage utility and example under current obligations. |
| `displays` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L107` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#intra-ui-edges-8)) | active, Component → View Model; `DS-D8@567fda…:relationships.yml:L388-L401` ([source](../../../../definitions/relationships/relationships.yml)) | Makes render-unit data-shape dependency explicit. | `evidence-ready` | No material semantic drift found. | Stage utility and example under current obligations. |
| `fetches` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L113` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#cross-layer-edges-ui---backend-6)) | active, Binding → Query; `DS-D8@567fda…:relationships.yml:L404-L417` ([source](../../../../definitions/relationships/relationships.yml)) | Connects reactive UI reads to a backend query seam. | `evidence-ready` | No material semantic drift found. | Stage utility and example under current obligations. |
| `mutates` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L114` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#cross-layer-edges-ui---backend-6)) | active, Binding → Operation; `DS-D8@567fda…:relationships.yml:L420-L433` ([source](../../../../definitions/relationships/relationships.yml)) | Connects UI mutation plumbing to the exact use case. | `evidence-ready` | No material semantic drift found. | Stage utility and example under current obligations. |
| `reflects` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L115` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#cross-layer-edges-ui---backend-6)) | active, State Indicator → State Machine; `DS-D8@567fda…:relationships.yml:L436-L449` ([source](../../../../definitions/relationships/relationships.yml)) | Ties visual state to lifecycle state. | `evidence-ready` | No material semantic drift found. | Stage utility and example under current obligations. |
| `derives` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L116` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#cross-layer-edges-ui---backend-6)) | active, View Model → Entity; `DS-D8@567fda…:relationships.yml:L452-L465` ([source](../../../../definitions/relationships/relationships.yml)) | Makes field lineage from domain data reviewable. | `evidence-ready` | No material semantic drift found. | Stage utility and example under current obligations. |
| `contracts` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L117` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#cross-layer-edges-ui---backend-6)) | active, Form → Interface; `DS-D8@567fda…:relationships.yml:L468-L481` ([source](../../../../definitions/relationships/relationships.yml)) | Provides a schema-to-API compatibility review seam. | `staged-review` | v1 targets an interface member; DS-D8 types the endpoint as the Interface itself. | Stage notation as review evidence, not a new endpoint type. |
| `mirrors` | v1 card + active | `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L118` ([source](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#cross-layer-edges-ui---backend-6)) | active, Guard → Rule; `DS-D8@567fda…:relationships.yml:L484-L497` ([source](../../../../definitions/relationships/relationships.yml)) | Exposes client/backend authorization parity for testing. | `evidence-ready` | Backend Rule remains authoritative. | Stage as parity evidence, not client authority. |
| `owns` | no v1 card + active | Absent from all 29 rows at `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L74-L118` ([coverage claim](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#coverage-checklist)) | active canonical, Entity → Entity; `DS-D8@567fda…:relationships.yml:L244-L257` ([source](../../../../definitions/relationships/relationships.yml)) | DS-D8 defines lifecycle/custody/write-responsibility ownership, but v1 supplies no card utility. | `staged-review` | No legacy card may be invented or claimed as imported. | Stage an explicit no-v1-card row; future authoring must originate from DS-D8. |
| `belongs-to` | no v1 card + active | Absent from all 29 rows at `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L74-L118` ([coverage claim](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#coverage-checklist)) | active canonical, Entity → Entity membership/assignment, not `owns` inverse; `DS-D8@567fda…:relationships.yml:L260-L273` ([source](../../../../definitions/relationships/relationships.yml)) | DS-D8 supplies a distinct classification/assignment seam, but v1 supplies no card utility. | `staged-review` | No legacy card may be invented or claimed as imported. | Stage an explicit no-v1-card row; future authoring must originate from DS-D8. |
| `owned-by` | no v1 card + generated view | Absent from all 29 rows at `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L74-L118` ([coverage claim](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#coverage-checklist)) | generated reverse projection of `owns`, never canonical authored; `DS-D8@567fda…:relationships.yml:L500-L509` ([source](../../../../definitions/relationships/relationships.yml)) | Reverse navigation may help readers or tooling, but supplies no authored-card authority. | `reject-or-superseded` | Triage rejection does not alter its DS-D8 state: it remains a generated view. | Record no-authored-card rejection; generate only from `owns` where tooling requires. |
| `depends-on` | no v1 card + deferred | Absent from all 29 rows at `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L74-L118` ([coverage claim](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#coverage-checklist)) | deferred; no distinct validation witness; `DS-D8@567fda…:relationships.yml:L511-L515` ([source](../../../../definitions/relationships/relationships.yml)) | Candidate could express general dependency, but distinct enforcement is unproved. | `deferred` | Current evidence does not distinguish it from reference/field dependency. | Preserve as deferred residue; author no card. |
| `operation-returns-value-object` | no v1 card + deferred | Absent from all 29 rows at `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L74-L118` ([coverage claim](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#coverage-checklist)) | deferred; model as operation signature property; `DS-D8@567fda…:relationships.yml:L516-L519` ([source](../../../../definitions/relationships/relationships.yml)) | Could document return-shape intent, but no distinct edge behavior is witnessed. | `deferred` | A signature property currently carries the meaning without a relationship type. | Preserve as deferred residue; author no card. |
| `event-payload-publisher-composite` | no v1 card + deferred | Absent from all 29 rows at `v1@33859b…:architecture/ARCHITECTURE-PATTERN-LIBRARY.md:L74-L118` ([coverage claim](../../../../../../implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md#coverage-checklist)) | deferred R3-P3 residue; `DS-D8@567fda…:relationships.yml:L520-L523` ([source](../../../../definitions/relationships/relationships.yml)) | Could express a composite event concern, but endpoint enforcement is already unblocked. | `deferred` | No evidence yet warrants a composite authored relationship. | Preserve as deferred residue; author no card. |

## Count proof

| Triage outcome | Count |
|---|---:|
| `evidence-ready` | 24 |
| `staged-review` | 6 |
| `deferred` | 3 |
| `reject-or-superseded` | 2 |
| **Full outer join** | **35** |

Presence proof: 28 v1 rows match active signatures, one v1 row is deprecated,
two canonical active signatures have no v1 card, one generated view has no v1 card,
and three deferred candidates have no v1 card: `28 + 1 + 2 + 1 + 3 = 35`.

## Exact parent handoff

1. Persist this matrix only in the non-authority relationship-card staging surface.
2. Run the relationship staging review check and `validate:docs`.
3. Close the Craft relationship-card gap only because the SWU-R3C-005 receipt already
   exists and this SWU-R3C-006 receipt is being established.
4. Synchronize the R3 closeout and architecture-pattern-enforcement workpacks.
5. Never mutate DS-D8 in this task.

This writer result remains `audit-pending` until Brandenburg returns the dedicated final
approval verdict.
