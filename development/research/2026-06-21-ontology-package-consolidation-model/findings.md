# Ontology Package Consolidation Findings

## Revised Verdict

Build `cyberAlchemy-v2/ontology/` as the base repository's candidate authority
model package, not merely as a small passive map. The earlier safety verdict
still holds as a guardrail: ontology may model, explain, crosswalk, stage, and
project authority structure, but it must route every authority transition to
the existing owner route: `definitions-governance` for terms,
`constitution-governance` for structural rules, `discipline-governance` for
recurring practices, `decision-gate` for contested ownership or public/private
decisions, PromotionRecord-compatible records for verdicts, and `task-session`
only after those owner routes pass. This preserves the ontology README boundary
that ontology can condense meaning and prepare promotion requests, but cannot
promote itself or redefine definitions, constitutions, specs, capabilities,
runtime contracts, or public claims (research.md, Agent 1 lines 20-52, 85-100;
Agent 2 lines 124-132; Agent 3 lines 217-228; source:
`cyberAlchemy-v2/ontology/README.md`).

Repository-objective correction: because CyberAlchemy v2 is now defined as the
future downloadable CyberAlchemy base repository, ontology must make authority
constructible for downstream work. Therefore authority kinds, authority
postures, node concepts, relation concepts, lifecycle concepts, ledger evidence,
projection rules, and promotion-request records may be modeled as candidate
ontology concepts and read-model structures. They do not become live vault
`node_type` values, executable edges, schemas, runtime contracts, or promotion
verdicts until their owner routes pass.

## One-Line Answer

Build `cyberAlchemy-v2/ontology/` as the authority model package for the
CyberAlchemy base: ontology may model authority objects and relations as
candidate/read-model structures, while authority decisions, lifecycle verdicts,
runtime emission, and schema evolution remain upstream in owner routes
(research.md, Agent 1 lines 45-52; Agent 4 lines 258-282).

## Artifact Plan

Create this kept package surface:

```text
cyberAlchemy-v2/ontology/
  README.md
  PACKAGE-MODEL.md
  ARTIFACT-TREE.md
  BRANCH-AS-VIEW.md
  NODE-MODEL.md
  RELATION-MODEL.md
  LIFECYCLE-MODEL.md
  AUTHORITY-KINDS.md
  AUTHORITY-POSTURES.md
  TAXONOMY-CROSSWALK.md
  RELATIONSHIP-CROSSWALK.md
  views/
    ontology-view.md
    system-view.md
    bridge-view.md
  projections/
    README.md
  promotion-requests/
    README.md
```

`README.md` states the package role and repeats the no-authority boundary.
`PACKAGE-MODEL.md` defines candidate condensation, projection, authority model
scope, and promotion-request preparation only. `ARTIFACT-TREE.md` orients the
visible source tree into views without replacing `SOURCE-MAP.md`, inventory
indexes, branch taxonomy, or authority maps. `BRANCH-AS-VIEW.md` defines branch
as an interpretive view over cited artifacts/evidence, not a canonical ontology
branch, vault node type, or lifecycle state. `NODE-MODEL.md`,
`RELATION-MODEL.md`, and `LIFECYCLE-MODEL.md` define candidate ontology-model
concepts without changing live vault schemas. `AUTHORITY-KINDS.md` and
`AUTHORITY-POSTURES.md` model authority classification and reliance posture as
reviewable concepts, not as minted `node_type` values, tags, or verdicts. The
three view files split meaning, system/runtime, and bridge/evidence
perspectives. `TAXONOMY-CROSSWALK.md` classifies candidate objects through
DS-D1 while preserving DS-D1 as the normative owner.
`RELATIONSHIP-CROSSWALK.md` may now exist as a candidate relation model, with
DS-D2/DS-D7/DS-D8 cited for edge-family and endpoint validation; it must not
create vault `## Connections` edges or executable movement edges. `projections/README.md`
defines read-model projection rules. `promotion-requests/README.md` stages
requests without becoming PromotionRecord, owner decision, lifecycle transition,
or promoted definition (research.md, Agent 1 lines 20-52, 85-100; Agent 3
lines 191-228; Agent 4 lines 267-297).

Defer `examples/README.md` until there is a reviewed example with cited sources
and an owner route. Defer live schema/edge artifacts: `node-schema.md`,
`relation-schema.md`, `lifecycle-schema.md`, `movement-edges.md`, and
`ledger-graph.md` (research.md, Agent 2 lines 134-170; Agent 4 lines 299-329).

## Creation Sequence

1. Create the candidate authority-model frame: `README.md`,
`PACKAGE-MODEL.md`, `ARTIFACT-TREE.md`, `BRANCH-AS-VIEW.md`, `NODE-MODEL.md`,
`RELATION-MODEL.md`, `LIFECYCLE-MODEL.md`, `AUTHORITY-KINDS.md`,
`AUTHORITY-POSTURES.md`, `views/ontology-view.md`, `views/system-view.md`,
`views/bridge-view.md`, `TAXONOMY-CROSSWALK.md`,
`RELATIONSHIP-CROSSWALK.md`, `projections/README.md`, and
`promotion-requests/README.md` (research.md, Agent 1 lines 85-100).

2. In `PACKAGE-MODEL.md`, state that ontology is a candidate authority-model
and projection package and that promotion authority remains upstream in owner
routes and PromotionRecord-compatible decisions (research.md, Agent 2 lines
142-147; Agent 4 lines 282-295).

3. In `ARTIFACT-TREE.md`, map source-tree areas into view roles only: authority/research/inventory/ontology lean toward ontology/bridge; architecture/capabilities/specs/implementation/validation lean toward system/bridge; observability/ops/`.craft/` lean toward bridge/evidence/run context. This is an orientation map, not a source-map replacement or authority map (research.md, Agent 1 lines 91-96; sources: `cyberAlchemy-v2/SOURCE-MAP.md`, `.arcanum/inventory/index.md`).

4. In `BRANCH-AS-VIEW.md`, define each branch/view as an artifact-tree lens with source paths, allowed readings, forbidden authority moves, and required owner route. Avoid canonical branch, node-type, or lifecycle-state language (research.md, Agent 1 lines 96-99).

5. Add projection and promotion-request rules only after the model frame
exists, and keep them to staging/read-model semantics. No runtime contract,
generated mirror authority, vault connection, schema amendment, live
`node_type`, movement edge, or promotion decision is created here (research.md,
Agent 4 lines 267-329).

## View Split

`views/ontology-view.md` is the meaning/candidate-ontology view. It can cite definitions, constitutions, research findings, source ledgers, and CAV2 ontology definitions, but it must phrase its output as candidate meaning and promotion preparation (research.md, Agent 1 lines 45-52; Agent 3 lines 217-228; source: `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md` CAV2-D16/D18/D19).

`views/system-view.md` is the package/runtime/evidence view. It can describe architecture, implementation, validation, generated/runtime projection boundaries, inventory evidence, authority envelopes, owner-route state, PromotionRecord-compatible decisions, and ledger evidence. It must not redefine source meaning because implementation exists (research.md, Agent 1 lines 73-83; Agent 4 lines 258-282; sources: `.arcanum/inventory/schema.md`, `cyberAlchemy-v2/development/research/2026-06-21-authority-harness-ledger-ontology-unification/findings.md`).

`views/bridge-view.md` links candidate meaning to system evidence and identifies gaps. It exists to prevent the package from splitting meaning and runtime evidence into disconnected silos while also preventing authority-by-proximity (research.md, Agent 1 lines 73-83; Agent 4 lines 284-297).

## Candidate Model

The ontology package is instantiable as candidate ontology concepts,
candidate/projection records, and read-model rows, not as live vault
`node_type` values, movement edges, schemas, or authority decisions. A candidate
record may include: `candidate_id`, `artifact_kind`, `authority_kind`,
`source_refs[]`, `owner_route`, `evidence_posture`, `current_status`,
`promotion_handle`, `conflicts[]`, `drift_owner`,
`ontology_refs.candidates[]`, `ontology_refs.projections[]`, and
`projection_effect` (research.md, Agent 2 lines 142-147; Agent 4 lines
289-297).

Package relations such as `requests_promotion_gate`,
`classifies_authority_kind`, `declares_source_posture`,
`uses_owner_profile`, `decides_transition`, or
`emits_projection_when_allowed` are candidate model predicates or
projection-row predicates only. They are not vault `## Connections`, not
executable edge-family additions, and not movement edges (research.md, Agent 2
lines 130-147, 158-170; Agent 4 lines 267-282).

## TAXONOMY / DS-D1 Rules

Use `TAXONOMY-CROSSWALK.md` as an explanatory DS-D1 crosswalk, not as local definition authority. Columns should be: `ontology object`, `object role/view`, `DS-D1 meta-type`, `source evidence`, `confidence/evidence posture`, `promotion state`, `owner/gate`, and `notes/residue` (research.md, Agent 3 lines 191-215).

DS-D1 remains normative for the concept-type vocabulary; `TAXONOMY.md` is a human-facing classifier and example layer. If ontology wording differs from DS-D1, DS-D1 wins. Relationship semantics remain deferred unless DS-D2, DS-D7, and DS-D8 are explicitly joined for edge family and endpoint validation (research.md, Agent 3 lines 197-203, 217-237; sources: `arcanum/definitions/DEFINITIONS.md`, `arcanum/definitions/TAXONOMY.md`, `arcanum/definitions/RELATIONSHIPS.md`).

## Runtime / Authority Projection Boundary

Allowed projections: candidate ontology maps, thick entries, lifecycle-envelope `ontology_refs.candidates`, lifecycle-envelope `ontology_refs.projections`, review/search rows that expose candidate or owner-approved state, and read models joining source evidence, owner-route state, PromotionRecord-compatible records, and runtime/ledger evidence (research.md, Agent 4 lines 267-282).

Forbidden projections: ontology must not decide promotion, define runtime
contracts, create generated mirror authority, become vault connections, bypass
public/private review, mint live `authority-type`, `authority-posture`,
`promotion-event`, or `movement` vault `node_type` values, or treat ledger rows
as ontology subgraphs (research.md, Agent 2 lines 134-170; Agent 4 lines
274-313).

The runtime chain remains: `raw/runtime evidence -> inventory evidence cards/sets -> authority_artifact_lifecycle_envelope -> owner route/profile -> PromotionRecord-compatible decision -> authority artifact -> optional ontology projection/read model` (research.md, Agent 4 lines 258-287; sources: `.arcanum/inventory/README.md`, `.arcanum/inventory/schema.md`).

## Non-Vacuity Witness

Witness candidate: `Ledger as Primitive`.

Candidate node: `Ledger as Primitive` exists only as a candidate/projection record. It is not a vault node type, movement edge, schema change, or authority decision (research.md, Agent 2 lines 134-147; Agent 4 lines 299-329).

Projection relation: `requests_promotion_gate -> definitions-governance term-selection/review`. This relation expresses a staged request for owner review, not a vault edge and not a PromotionRecord verdict (research.md, Agent 2 lines 142-147; Agent 4 lines 267-282).

Lifecycle: `candidate -> reviewed_candidate` if the owner route accepts it for further work, or `candidate -> deferred` if owner/schema conditions are not met. This lifecycle belongs to workflow/projection records, not vault maturity `status` (research.md, Agent 2 lines 138-146; Agent 4 lines 293-297).

Taxonomy row: classify the review workflow as DS-D1 `Workflow`; do not classify "ledger" itself as canonical ledger meaning from this package. DS-D1 is referenced, not redefined (research.md, Agent 3 lines 191-228).

Blocked extensions: live `node-schema.md`, `relation-schema.md`, and
`lifecycle-schema.md` remain no-go until schema evolution. Candidate
`NODE-MODEL.md`, `RELATION-MODEL.md`, and `LIFECYCLE-MODEL.md` are allowed in
this slice because they model authority concepts without changing schemas.
`movement-edges.md` and `ledger-graph.md` remain no-go until current edge law
admits promotion movement and an append-only authority-ledger validator exists
(research.md, Agent 2 lines 134-170; Agent 4 lines 299-329).

## Blocker / No-Go Table

| Surface | Status | Reason | Owner Route |
|---|---|---|---|
| `README.md` | keep | Package boundary and orientation; ontology README supports authority-model and candidate-map role | package review |
| `PACKAGE-MODEL.md` | keep | Declares candidate authority-model, projection, and staging boundary | package review |
| `ARTIFACT-TREE.md` | keep | Source-tree orientation only; not source map, inventory index, branch taxonomy, or authority map | package review |
| `BRANCH-AS-VIEW.md` | keep | Interpretive view over cited artifacts/evidence; not canonical branch/node/lifecycle | package review |
| `NODE-MODEL.md` | keep | Candidate ontology concepts for authority objects; not live vault `node_type` schema | schema route before schema effect |
| `RELATION-MODEL.md` | keep | Candidate relation predicates with endpoints, owner, evidence, direction, and effect | schema route before edge effect |
| `LIFECYCLE-MODEL.md` | keep | Candidate workflow/lifecycle concepts separate from vault maturity `status` | lifecycle/schema owner before enforcement |
| `AUTHORITY-KINDS.md` | keep | Reviewable authority-kind model; not minted `authority-type` node classes | governance owner before authority effect |
| `AUTHORITY-POSTURES.md` | keep | Reviewable source/local/public-private reliance posture model | governance owner before authority effect |
| `views/ontology-view.md` | keep | Candidate meaning view with source refs and owner gates | definitions/constitution routes as needed |
| `views/system-view.md` | keep | Runtime/evidence projection view without runtime authority | owner route plus PromotionRecord-compatible verdict |
| `views/bridge-view.md` | keep | Connects meaning and evidence while preventing authority-by-proximity | package review |
| `TAXONOMY-CROSSWALK.md` | keep | DS-D1 explanatory classifier; not a local definition source | definitions-governance for new terms |
| `RELATIONSHIP-CROSSWALK.md` | keep as candidate model | May explain candidate relation semantics through DS-D2/DS-D7/DS-D8; not vault edges | definitions-governance / schema route before edge effect |
| `projections/README.md` | keep | Candidate read-model projection rules only | owner route before emission authority |
| `promotion-requests/README.md` | keep | Staging only; request is not verdict, PromotionRecord, or lifecycle transition | relevant owner route |
| `examples/README.md` | defer | Needs reviewed example with cited sources and owner route | package review |
| `node-schema.md` | defer live schema / no-go here | No new legal vault `node_type` values are created in this slice | schema evolution |
| `relation-schema.md` | defer live schema / no-go here | Candidate relations are not vault edges | schema evolution |
| `lifecycle-schema.md` | defer live schema / no-go here | `current_status` must not collapse into vault `status` | lifecycle/schema owner |
| `movement-edges.md` | defer to owner route / no-go here | Current edge law does not admit promotion movement | schema evolution |
| `ledger-graph.md` | defer to owner route / no-go here | Ledger rows are evidence/witnesses until validator exists | authority-ledger owner |

Blockers are not permanent kills. Precedent never kills owned surfaces; it routes them. The correct disposition for owned surfaces is "defer to owner route" unless the owner route later approves a schema or authority change (research.md, Agent 2 lines 134-170; Agent 4 lines 299-329).

## Next Implementation Slice

Implement the candidate authority-model package, not live schema evolution:

1. Create/refresh `README.md`, `PACKAGE-MODEL.md`, `ARTIFACT-TREE.md`,
`BRANCH-AS-VIEW.md`, `NODE-MODEL.md`, `RELATION-MODEL.md`,
`LIFECYCLE-MODEL.md`, `AUTHORITY-KINDS.md`, `AUTHORITY-POSTURES.md`,
`views/ontology-view.md`, `views/system-view.md`, `views/bridge-view.md`,
`TAXONOMY-CROSSWALK.md`, `RELATIONSHIP-CROSSWALK.md`,
`projections/README.md`, and `promotion-requests/README.md`.

2. Put source references, owner-route fields, relation direction, validation or
promotion effect, and residue handling in every model/view/projection rule.

3. Add the `Ledger as Primitive` witness as a candidate/projection example only if it is explicitly labeled non-authoritative and cites the owner gate.

4. Do not create live schema files, examples, generated mirrors, runtime
contracts, movement edges, ledger graphs, vault `node_type` values, or promoted
definitions in this slice.

That slice gives the ontology package something real to instantiate while
preserving the current authority law: ontology models, explains, and stages;
owners decide.
