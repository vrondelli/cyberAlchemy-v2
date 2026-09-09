# Ontology Package Consolidation Model Research

Dispatch: `2026-06-21-ontology-package-consolidation-model`

## Agent 1 - Mac Lane, Saunders

**Explorer Receipt**

Read-only run completed in `/home/vrondelli/projects/domainspec-core`. No files edited, no definitions promoted.

**1. Artifacts Inspected**

- [cyberAlchemy-v2/ontology/README.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/ontology/README.md)
- [cyberAlchemy-v2/README.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/README.md)
- [cyberAlchemy-v2/SOURCE-MAP.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/SOURCE-MAP.md)
- [.arcanum/ontology-vault/map-2026-06-18-dispersed-knowledge.md](/home/vrondelli/projects/domainspec-core/.arcanum/ontology-vault/map-2026-06-18-dispersed-knowledge.md)
- [cyberAlchemy-v2/development/research/2026-06-21-authority-node-relationship-taxonomy/findings.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-node-relationship-taxonomy/findings.md)
- Supplemental structural pass: current `cyberAlchemy-v2/` directory tree and current empty ontology package surface.

**2. Candidate Artifacts To Create**

I would model `cyberAlchemy-v2/ontology` as a candidate package, not as a promoted vault:

```text
cyberAlchemy-v2/ontology/
  README.md
  PACKAGE-MODEL.md
  ARTIFACT-TREE.md
  BRANCH-AS-VIEW.md
  views/
    README.md
    ontology-view.md
    system-view.md
    bridge-view.md
  projections/
    README.md
  promotion-requests/
    README.md
  examples/
    README.md
```

Recommended roles:

- `PACKAGE-MODEL.md`: declares the package boundary: candidate condensation, projection, and promotion-request preparation only.
- `ARTIFACT-TREE.md`: maps the visible `cyberAlchemy-v2` tree into ontology package views without changing authority ownership.
- `BRANCH-AS-VIEW.md`: states that each branch/view is an interpretive read model over artifacts, not a new canonical taxonomy.
- `views/ontology-view.md`: meaning/candidate-ontology view over definitions, constitutions, source ledgers, and research findings.
- `views/system-view.md`: system/package/runtime view over architecture, capabilities, implementation, validation, generated/runtime projection boundaries.
- `views/bridge-view.md`: traceability/evidence-gap view linking candidate meaning to system evidence when both sides exist.
- `projections/README.md`: rules for read-model exports, explicitly forbidden from changing promotion state.
- `promotion-requests/README.md`: staging area for requests that must route to authority owners, definitions-governance, constitution-governance, decision-gate, etc.

**3. Artifacts To Defer Or Not Create Yet**

Do not create yet:

- New vault `node_type` files or catalog entries.
- New confidence aliases, movement edges, promotion-event nodes, or ledger subgraphs.
- Generated mirrors under `.agents/`, `.claude/`, or public `arcanum`.
- Runtime contracts for ontology projections.
- A full graph schema or validator.
- Branch files for every speculative branch named in older work, such as operational, memory, capability, feedback, research, unless owner review chooses the branch set.

Defer until after package model review:

- Claim-level branch classification.
- Promotion request templates.
- Projection schemas.
- Public-safe derivatives.
- Any movement/PromotionRecord integration beyond referencing existing owner routes.

**4. System-View / Ontology-View Split Risks**

The main risk is authority-by-proximity: if `ontology-view` lists definitions, constitutions, or authority posture beside system artifacts, readers may infer promotion where only condensation exists.

A second risk is system redefinition of meaning. `system-view` can describe packages, generated projections, validators, implementation evidence, and runtime surfaces, but it must not redefine business/ontology meaning just because implementation exists.

A third risk is disconnected views. If `ontology-view` and `system-view` are separated without a bridge view, the package loses the thing it is meant to make visible: where meaning is realized, tested, observed, constrained, or still unsupported.

A fourth risk is private/public leakage. `SOURCE-MAP.md` names public Arcanum, private implementation, and private validation evidence. Any view that crosses those sources needs boundary posture before it becomes shareable.

A fifth risk is status collapse. The authority taxonomy findings are very clear: lifecycle `current_status`, vault maturity `status`, source confidence, PromotionRecord confidence, and vault confidence axes must remain distinct.

**5. Proposed Package Creation Sequence**

1. Create only the ontology package frame: `PACKAGE-MODEL.md`, `ARTIFACT-TREE.md`, `BRANCH-AS-VIEW.md`, plus README stubs for `views/`, `projections/`, and `promotion-requests/`.

2. In `PACKAGE-MODEL.md`, restate the hard boundary already present in the ontology README: ontology condenses and prepares promotion requests; it does not promote or redefine definitions, constitutions, specs, capabilities, runtime contracts, or public claims.

3. In `ARTIFACT-TREE.md`, map existing top-level areas into views:
   `authority/`, `research/`, `inventory/`, `ontology/` lean ontology/meaning/bridge;
   `architecture/`, `capabilities/`, `specs/`, `implementation/`, `validation/` lean system/bridge;
   `observability/`, `ops/`, `.craft/` lean bridge/evidence/run context.

4. In `BRANCH-AS-VIEW.md`, define "view" as an artifact-tree lens with source paths, allowed readings, forbidden authority moves, and required owner route. Avoid canonical node-type language.

5. Create `views/ontology-view.md`, `views/system-view.md`, and `views/bridge-view.md` as candidate indexes only. Each should cite source cohorts and list open questions rather than assert final branch ontology.

6. After review, add projection rules and promotion-request templates. Only then consider claim-level classification or schema work.

**6. Blockers**

- The current ontology README has OQ-1 open: which ontology branch is first.
- `SOURCE-MAP.md` still leaves visible `inventory/` and `ontology/` versus hidden `.arcanum/` unresolved.
- Authority-node research explicitly blocks new vault node types, movement edges, authority-posture tags, confidence aliases, and ledger-as-subgraph semantics.
- No current legal movement-edge model or append-only authority-ledger validator exists.
- Public/private boundary review is required before any package view becomes public-facing.
- Owner review is needed before treating branch-as-view as more than a candidate package architecture.

My synthesis: create the package as a small categorical frame over the existing artifact tree: objects are existing artifacts and folders; arrows are cited evidence/projection/owner-route references; views are lawful projections over that tree. Keep it humble, legible, and incapable of silently becoming authority.

## Agent 2 - Lawvere, F. William

Explorer receipt: `2026-06-21-ontology-package-consolidation-model`

1. Artifacts inspected:
- [ontology-conventions.md](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md)
- [frontmatter.py](/home/vrondelli/projects/domainspec-core/implementation/domainspec/internal_tools/vault_common/frontmatter.py)
- [findings.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-node-relationship-taxonomy/findings.md)
- [README.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/ontology/README.md)
- Memory used only to check prior boundary cautions; live files were treated as authority.

2. Current legal schema surfaces:
- Legal vault `node_type`: exactly the 16 values in `NodeType`: `axiom`, `premise`, `constitution`, `discovery`, `implementation-plan`, `spec`, `audit`, `conceptual`, `test`, `backlog`, `readme`, `research`, `domainspec-subagents-strategy`, `subagents-research`, `subagents-findings`, `discussion`.
- Unknown or missing `node_type` is an executable hard reject through `validate_node`.
- Legal executable `status`: `draft`, `exploratory`, `active`, `consolidated`, `evergreen`, `retracted`. Note: prose convention lists the lifecycle as `draft -> exploratory -> active -> consolidated -> evergreen`; executable schema currently also admits `retracted`.
- Legal confidence axes: `veracidade` and `convicção`, conceptually `high | medium | low`; executable code stores them as optional strings only on `axiom`, `premise`, `discovery`, and `audit` subclasses. Prose says they are meaningful mainly for `axiom`, `premise`, and `audit`, and should generally be omitted for `discovery`, `constitution`, `implementation-plan`, `spec`, `conceptual`, and `test`.
- Legal base frontmatter: `schema_version`, `node_type`, `layer`, `nature`, `status`, `version`, `last_updated`, `tags`, `is_session`; extra fields are allowed during soft rollout, but that does not make them canonical schema.
- Legal executable edge field constant: `derives-from`, `cites`, `contradicts`, `supersedes`, `governs`, `lenses`, `codified-as`, `operationalized-by`, `validates`, `part-of`, `creates`, `modifies`.
- Legal prose edge catalog is broader and authoring-oriented: 22 forward edges with inverse rules, plus carve-outs for `.claude/skills/**`, `.claude/agents/**`, session-origin forward-only edges, and `retrofits` as intentionally no-inverse. For schema conservation, do not treat the prose catalog as permission to invent new executable relation fields.
- CyberAlchemy ontology is explicitly candidate-map territory: it may condense meaning and prepare promotion requests; it cannot promote itself or redefine definitions, constitutions, specs, capabilities, runtime contracts, or public claims.

3. Schema-evolution blockers:
- No legal vault `node_type` exists for `authority-type`, `authority-posture`, `promotion-event`, `movement`, `legal-node`, `lifecycle-record`, or package-specific authority classes.
- No legal movement edge exists today. Prior findings explicitly kill `witnesses_authority_movement`, `promotion-movement edge`, and ledger-row-as-ontology-subgraph until schema evolution.
- No current append-only authority-ledger validator is present as a schema authority for movement semantics.
- `current_status` on lifecycle/envelope records must not collapse into vault `status`.
- Source confidence, promotion confidence, and vault `veracidade`/`convicção` must not be aliases.
- Ontology projections cannot decide promotion, replace owner routes, or mutate canonical authority by proximity.

4. Minimal candidate/projection model:
- Package node, as candidate/projection only: ordinary vault-compatible artifact metadata using an existing legal `node_type`, likely `research`, `discovery`, `conceptual`, or `readme` depending on artifact role.
- Package relationships, as projection rows only: `classifies_authority_kind`, `declares_source_posture`, `uses_owner_profile`, `requests_promotion_gate`, `decides_transition`, `emits_projection_when_allowed`. These are not vault `## Connections` edge types.
- Lifecycle state, outside vault maturity: `artifact_kind`, `authority_owner`, `current_status`, `sources[]`, `promotion_handle`, `conflicts`, `drift_owner`, `ontology_refs`.
- Confidence: keep projection/source confidence separate from vault `veracidade` and `convicção`; only use vault confidence fields where the selected legal `node_type` actually supports that meaning.
- Edges into canonical vault graph: only use existing catalog edges when the artifact is a real vault node and both endpoint/category rules are satisfied. Otherwise keep relation data in candidate projection metadata.

5. Artifacts not to create yet:
- New schema files for ontology package legality.
- New vault node classes or frontmatter subclasses.
- New edge catalog entries or movement edges.
- Ledger subgraphs for promotion movement.
- Runtime contracts, generated mirrors, or promoted definitions.
- Public/canonical ontology package definitions.
- Any canonical `authority-type` / `authority-posture` artifacts outside owned lifecycle/envelope/profile/projection surfaces.

6. Exact no-go clauses:
- Do not invent new vault `node_type` values.
- Do not use tags for epistemic role, authority posture, lifecycle, or confidence.
- Do not create confidence aliases for `veracidade` or `convicção`.
- Do not encode `authority-type` or `authority-posture` as vault node classes.
- Do not encode `promotion-event` or `movement` as vault node classes.
- Do not add movement graph edges.
- Do not treat ledger rows as ontology subgraphs.
- Do not let ontology projection promote definitions, constitutions, specs, capabilities, runtime contracts, or public claims.
- Do not collapse workflow `current_status` into vault maturity `status`.
- Do not collapse owner decisions or PromotionRecord-compatible decisions into ontology proximity.
- Do not create generated mirrors or runtime contracts before schema-evolution authority exists.
- Do not promote candidate package terminology into canonical schema without a schema-evolution discovery/owner route.

Read-only constraint honored; no files edited.

## Agent 3 - Simon, Herbert

**Explorer Receipt**

Dispatch: `2026-06-21-ontology-package-consolidation-model`
Role/angle: Simon, Herbert, EXPLORER; taxonomy-use validation; normative-vs-explanatory lineage.
Mode: read-only, no file edits.

1. Artifacts inspected:

- [arcanum/definitions/TAXONOMY.md](/home/vrondelli/projects/domainspec-core/arcanum/definitions/TAXONOMY.md:1)
- [arcanum/definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/arcanum/definitions/DEFINITIONS.md:280), especially DS-D1 through DS-D8
- [arcanum/definitions/RELATIONSHIPS.md](/home/vrondelli/projects/domainspec-core/arcanum/definitions/RELATIONSHIPS.md:1)
- [cyberAlchemy-v2/authority/definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:855), especially CAV2-D16, D18, D19
- [cyberAlchemy-v2/ontology/README.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/ontology/README.md:1)
- Supporting boundary/crosswalk surfaces: [DEFINITION-TOWERS.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITION-TOWERS.md:204), [boundaries.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/boundaries.md:16), [promotion-policy.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/promotion-policy.md:8), imports manifest hits for `TAXONOMY.md` / `RELATIONSHIPS.md`.

2. What `TAXONOMY.md` can classify:

`TAXONOMY.md` can classify ontology nodes that are already domain/modeling things into the DS-D1 meta-type vocabulary: backend nodes such as `Entity`, `Value Object`, `Enum / Type`, `Operation`, `Query`, `Calculation`, `Rule`, `Policy`, `Workflow`, `Saga`, `Interface`, `Event`, `Mapping`, `State Machine`; and UI nodes such as `Page`, `Layout`, `Component`, `View Model`, `Hook`, `Form`, `Action`, `Guard`, `Binding`, `Adapter`, `State Indicator`.

It is suitable as a human-facing classifier and selection guide for ontology entries, especially when an ontology entry is a DomainSpec concept, UI/backend concept, boundary shape, operation, relationship endpoint, or graph node. It should not classify arbitrary CyberAlchemy governance terms as if they were DomainSpec domain concepts unless the object is intentionally being modeled as a concept-graph node.

Important: `TAXONOMY.md` labels itself "Example / explanatory layer" and points to DS-D1 as canonical. So in ontology it should appear as a crosswalk/reference layer, not as a source of new term authority.

3. What DS-D1 owns normatively:

DS-D1 owns the normative meta-type set. In [DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/arcanum/definitions/DEFINITIONS.md:293), DS-D1 defines the canonical composition-extension profile: 14 backend types plus 11 UI types, with `Saga` included as part of the canonical 25-type profile. It also records the historical 24-type baseline and requires profile-specific counts when reporting evidence.

DS-D1 owns the allowed concept-type vocabulary. `TAXONOMY.md` can explain "when to use" and examples, but if wording differs, DS-D1 wins. DS-D2 owns relationship verbs; DS-D7 owns edge-family partitioning; DS-D8 owns endpoint signature validation. Together these give the ontology package a typed graph discipline: classify nodes by DS-D1, classify edges by DS-D2/RELATIONSHIPS, validate edge endpoints through DS-D8.

4. Useful crosswalk artifacts:

Most useful artifact: a candidate ontology crosswalk, not a definition promotion. Shape:

- `ontology/TAXONOMY-CROSSWALK.md` or equivalent candidate map
- Columns: `ontology object`, `object role/branch`, `DS-D1 meta-type`, `source evidence`, `confidence`, `promotion state`, `owner/gate`, `notes/residue`
- Include a companion edge crosswalk if relationships are in scope: `ontology/RELATIONSHIP-CROSSWALK.md` with `source`, `edge`, `target`, `DS-D2 family`, `DS-D8 endpoint validity`, `evidence`, `residue`.

This aligns with CAV2-D19: ontology requires typed knowledge objects, typed relations, branch/ownership, provenance, confidence, promotion state, and use obligations. It also fits CAV2-D16: any non-orthogonal bridge between authority, ontology, inventory, and implementation must be explicit as a typed relation rather than implied by adjacency.

A second useful artifact is a T2 source-cluster row set for DomainSpec, analogous to the existing Arcanum source cluster. `DEFINITION-TOWERS.md` already identifies T2 as the DomainSpec semantic/modeling spine and lists DS-D1, DS-D2, DS-D3 as active external terms. That suggests local representation rows are useful, but not local redefinitions.

5. Where ontology must reference rather than redefine:

Ontology must reference, not redefine:

- DS-D1 meta-type semantics from [arcanum/definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/arcanum/definitions/DEFINITIONS.md:293)
- DS-D2 relationship vocabulary and DS-D7/DS-D8 edge rules from the same file
- `TAXONOMY.md` examples as explanatory guidance only
- `RELATIONSHIPS.md` edge prose as explanatory guidance only
- CyberAlchemy v2's own ontology definition, CAV2-D19, from local authority definitions
- Promotion semantics from `promotion-policy.md`

The ontology folder's README is explicit: ontology can condense meaning and prepare promotion requests, but cannot promote itself or redefine definitions, constitutions, specs, capabilities, runtime contracts, or public claims. So any ontology package should say "classified by DS-D1" or "uses DS-D1 meta-type" rather than restating "Entity means..." as local authority.

6. Risks/blockers:

- **Redefinition risk:** copying `TAXONOMY.md` descriptions into ontology as if they were local canonical definitions would violate both DS-D1 lineage and CAV2 authority boundaries.
- **Authority conflation risk:** the word `contracts` appears as a DomainSpec typed edge and must not be collapsed into Arcanum `contract`.
- **Public/private risk:** T2 DomainSpec evidence is marked private implementation evidence in the tower map. Public derivatives need scrub and owner review.
- **Profile drift risk:** DS-D1 has a historical 24-type baseline and canonical 25-type profile. Any ontology count/report must name the profile.
- **Graph validation gap:** a taxonomy-only crosswalk is insufficient if ontology uses relationships. DS-D2/DS-D8 must join the package or edge semantics will become prose-only.
- **Promotion blocker:** ontology outputs can become candidates or promotion requests, not authority. If a term becomes load-bearing, route through definitions-governance.

Verdict: `arcanum/definitions/TAXONOMY.md` is safe and useful for `cyberAlchemy-v2/ontology` as an explanatory DS-D1 crosswalk and classification aid. The normative anchor remains DS-D1; ontology should preserve provenance, classify already-owned things, and route any new or adapted terminology through the promotion ladder.

## Agent 4 - Fong, Brendan

**Explorer Receipt**
Dispatch: `2026-06-21-ontology-package-consolidation-model`
Role/angle: Fong, Brendan, EXPLORER; runtime/evidence integration; SYSTEM-VIEW and runtime boundary
Mode: read-only, no edits made

**1. Artifacts Inspected**
- [.arcanum/inventory/README.md](/home/vrondelli/projects/domainspec-core/.arcanum/inventory/README.md:1)
- [.arcanum/inventory/index.md](/home/vrondelli/projects/domainspec-core/.arcanum/inventory/index.md:1)
- [.arcanum/inventory/schema.md](/home/vrondelli/projects/domainspec-core/.arcanum/inventory/schema.md:1)
- [.arcanum/ontology-vault/map-2026-06-18-dispersed-knowledge.md](/home/vrondelli/projects/domainspec-core/.arcanum/ontology-vault/map-2026-06-18-dispersed-knowledge.md:1)
- [cyberAlchemy-v2/development/research/2026-06-21-authority-harness-ledger-ontology-unification/findings.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-harness-ledger-ontology-unification/findings.md:1)
- [cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:1)
- [cyberAlchemy-v2/development/research/2026-06-21-authority-node-relationship-taxonomy/findings.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-node-relationship-taxonomy/findings.md:1)
- [cyberAlchemy-v2/ontology/README.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/ontology/README.md:1)

**2. SYSTEM-VIEW Candidate Scope**
The ontology package should be modeled as a runtime-facing candidate/projection package, not as an authority owner. The SYSTEM-VIEW scope is:

`raw/runtime evidence -> inventory evidence cards/sets -> authority_artifact_lifecycle_envelope -> owner route/profile -> PromotionRecord-compatible decision -> authority artifact -> optional ontology projection/read model`

Inventory is the evidence substrate: raw repo files, ledgers, generated runtime packages, and submodules are source evidence; inventory pages are compiled read models that must cite sources or label inference. Ontology then condenses candidate meaning, branch maps, thick entries, and promotion requests. It may represent lifecycle state, provenance, confidence, source support, owner-route pointers, and projection handles, but it does not decide lifecycle transitions.

The most useful SYSTEM-VIEW package boundary is therefore a bridge layer spanning inventory, authority envelopes, ledger evidence, owner decisions, and runtime projections. It should make review/query surfaces visible without collapsing them into one graph authority.

**3. Projection Boundaries**
Allowed projection:
- Candidate ontology maps and thick entries.
- `ontology_refs.candidates` and `ontology_refs.projections` on lifecycle envelopes.
- Projection rows that expose owner-approved or candidate state for search/review.
- Read models that join source evidence, owner-route state, PromotionRecord-compatible records, and runtime/ledger evidence.

Forbidden projection:
- Ontology projection must not become promotion authority.
- Ledger rows must not be treated as ontology subgraphs.
- Runtime/generated mirrors must not define source meaning.
- Projection rows must not become vault `## Connections` movement edges.
- `authority-type`, `authority-posture`, `promotion-event`, and `movement` must not be minted as vault `node_type`s.
- Confidence axes must stay distinct: envelope source confidence, PromotionRecord evidence/commitment confidence, and vault confidence are not aliases.

The clean boundary is: projections can expose and relate evidence; only owner routes and PromotionRecord-compatible decisions can authorize transitions.

**4. Lifecycle Operations And Evidence-Flow Requirements**
Lifecycle starts before ontology. The owned sequence is:

`SourceArtifact(s) -> import/evidence staging -> authority_artifact_lifecycle_envelope -> owner governance route -> owner decision / PromotionRecord -> authority artifact -> optional ontology projection/read model`

Requirements:
- Each material claim needs concrete source refs or explicit inference/synthesis labeling.
- Evidence cards should carry claim/candidate, source refs, authority level, promotion owner, trace, and residue.
- EvidenceSets should reference card IDs rather than copying claims.
- The lifecycle envelope should carry `artifact_kind`, `authority_owner`, `current_status`, `sources[]`, `conflicts[]`, `drift_owner`, `ontology_refs`, and promotion handle.
- The rail may produce a promotion record, but the per-kind owner profile produces the verdict.
- Runtime projections should be emitted only after the relevant owner route permits them.
- Ledger evidence should remain evidence/movement witness until a validating append-only authority-ledger contract exists.
- `current_status` belongs on workflow/envelope/ledger records; vault `status` remains maturity state on ontology nodes.

**5. Blockers And No-Go Clauses**
Blockers:
- The movement bridge edge is KILL-until-amendment: current vault edge law does not admit promotion movement as a lawful edge.
- No complete append-only authority-ledger validator exists yet.
- The `ledger_spec_axis` is only partially witnessed: craft/register are covered, signals remain unread in the cited finding.
- Schema evolution has not selected either a third forward-only carve-out or a lawful `promotion-event` / `movement` node type with inverse edges.

No-go clauses:
- Do not mutate ontology first.
- Do not author a parallel authority harness or movement envelope; extend the existing lifecycle envelope.
- Do not assign promotion authority to ontology.
- Do not let ontology edges become fake gates.
- Do not promote ARR or movement relations into vault relation families from this slice.
- Do not implement lifecycle schema before governance routes pass.
- Do not use ontology projection to bypass public/private review, owner decisions, or PromotionRecord-compatible records.

**6. Candidate Artifacts To Create/Defer**
Create or formalize next:
- SYSTEM-VIEW package note describing the evidence-to-projection flow above.
- Envelope/profile/PromotionRecord-compatible projection contract that keeps the verdict in owner profiles.
- Projection manifest for `ontology_refs.candidates/projections`, with source refs, owner route, evidence, direction, and promotion effect fields.
- Evidence-flow requirements for runtime projection emission.
- Ledger-spec-axis review note, clearly marked partial until signals and validator work land.

Defer:
- New vault node types.
- Movement/promotion-event graph edges.
- Ledger-as-ontology-subgraph model.
- Generated runtime mirrors as authority.
- Any promoted definition, tag, confidence alias, canonical node type, or runtime contract.
- Full ontology-tie closure until schema evolution resolves the bridge-edge blocker.

Bottom line: the ontology package is the SYSTEM-VIEW projection surface for governed authority evidence. It should show how inventory evidence, authority envelopes, PromotionRecord-compatible decisions, ledger evidence, and runtime projections relate, while keeping lifecycle authority upstream in owner routes.
