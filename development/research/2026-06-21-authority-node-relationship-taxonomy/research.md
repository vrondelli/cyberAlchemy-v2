# Research Transcript - Authority Node Relationship Taxonomy

Dispatch: `2026-06-21-authority-node-relationship-taxonomy`

This file preserves the explorer returns and robot-talks final positions. Synthesis and review live in `findings.md`.

## Explorer 1 - Mac Lane, Saunders

Angle: ontology-convention conservator using current vault `node_type`, `status`, confidence, and bidirectional edge catalog as primary corpus.

### Initial Return

**Ontology Map**

I read the requested sources read-only. The current law says authority nodes must be constrained by the existing vault axes first: `node_type` is role, `status` is maturity, `veracidade` is evidence, `convicção` is commitment, and tags are only topical. See `/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:71-123`, `:189-208`, `:211-256`, `:260-267`.

**Legal Relationship Classes**

- Authority artifacts may be ordinary vault nodes only through existing `node_type` roles: `constitution`, `axiom`, `premise`, `spec`, `audit`, `discovery`, etc. New labels like `authority-type`, `authority-posture`, `workflow-record`, or `promotion-event` are not legal `node_type` values today; the executable frontmatter model hard-rejects unknown node types. See `/home/vrondelli/projects/domainspec-core/implementation/domainspec/internal_tools/vault_common/frontmatter.py:19-38`, `:203-209`, `:230-280`.

- Authority posture is not a node type. It belongs as source posture / local posture / route metadata on imports, towers, lifecycle envelopes, or records. CyberAlchemy definitions repeatedly frame posture as preserved classification for later promotion, not as canonical authority. See `/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:257-282`, `:296-321`, `:381-409`, `:446-449`.

- Authority confidence can be reviewed/contextualized only through the existing confidence axes when the node role supports them. The strongest current rule says `veracidade`/`convicção` are meaningful for `axiom`, `premise`, and `audit`; constitutions, specs, plans, conceptual docs, tests, and discoveries generally should not carry one document-level score. See `/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:240-256`.

- Workflow records and promotion records are legal as lifecycle/ledger records, not automatically vault nodes. The accepted research says extend the existing `authority_artifact_lifecycle_envelope`, keep the typed-hole `validate_and_promote` contract, and keep `current_status` on the record while vault maturity `status` stays on the node. See `/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-harness-ledger-ontology-unification/findings.md:92-113`, `:166-183`, `:224-241`, `:257-265`.

- Ontology projections are views over authority state and events, not authority themselves. CyberAlchemy's ontology definition says ontology condenses meaning into candidate maps and promotion requests, but cannot promote definitions, constitutions, contracts, or public claims by itself. See `/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:881-901`, `:920-940`.

**Forbidden Collapses**

- Do not create a parallel authority harness or movement envelope. The accepted finding says that would be identity collapse; the existing envelope is the rail. `/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-harness-ledger-ontology-unification/findings.md:10-23`, `:267-272`.

- Do not collapse ledger into ontology subgraph. The legal reading is event log plus atemporal current-state plus typed projection/read model. `/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-harness-ledger-ontology-unification/findings.md:117-142`.

- Do not collapse workflow `current_status` with vault `status`. The former belongs to record/ledger movement; the latter is the vault maturity ladder. `/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-harness-ledger-ontology-unification/findings.md:239-241`, `:319-324`.

- Do not treat tags as authority posture or confidence. Tags have no epistemic weight. `/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:260-267`.

- Do not let candidate ontology, inventory, Craft, projections, or generated indexes become authority by proximity. `/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:922-940`, `:968-978`.

**Schema-Evolution Gates**

The movement bridge edge is still blocked. Current vault edges require bidirectional declarations except for two carve-outs: targets under `.claude/skills/**` or `.claude/agents/**`, and sources with `is_session: true`. See `/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:289-320`.

The accepted audit says the only open link is the movement bridge edge, closable only by schema-evolution: either add a third forward-only carve-out for movement-event logical type, or add a lawful `promotion-event`/`movement` node type with cataloged forward/inverse edges. `/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-harness-ledger-ontology-unification/AUDIT.md:72-87`, `:91-101`.

**Candidate Rules**

1. **Authority-role rule:** an authority node must choose the ordinary `node_type` matching its challenge response; `authority-type` is a profile/envelope selector, not a vault `node_type`.

2. **Posture-placement rule:** `source_authority_posture`, `local posture`, and public/private posture live on imports, towers, envelopes, or records; they must not be encoded as tags or `convicção`.

3. **Confidence-scope rule:** reviewable confidence on an authority concept is legal only when represented as `axiom`, `premise`, or `audit`; otherwise confidence belongs inline per option, in promotion evidence, or in the lifecycle record.

4. **Projection-non-authority rule:** ontology projections may point to candidate/current authority state, but promotion authority stays with definitions-governance, constitution-governance, discipline-governance, decision-gate, or the typed owner profile.

5. **Movement-edge gate rule:** no authority movement bridge edge may be emitted until schema evolution adds either the third carve-out or a `promotion-event`/`movement` node type plus inverse pair.

### Robot-Talks Final Position

**Final Position**

I concede Simon's main correction: `authority-type` and `authority-posture` should be first-class reviewable authority artifacts in CyberAlchemy-v2, but only through the existing `authority_artifact_lifecycle_envelope`, not by extending the vault's ordinary `node_type` enum ad hoc. That matches the accepted typed-hole design: the rail owns intake, evidence, record shape, status ladder, ontology refs, and promotion record, while the per-kind profile owns the verdict (`cyberAlchemy-v2/development/research/2026-06-21-authority-harness-ledger-ontology-unification/findings.md:92-113`, `:166-183`).

I also concede Popper's stricter witness: today, authority type/posture values are envelope fields or owner-profile payload values, not vault node classes. Calling them `authority_type_node` or `authority_posture_node` is acceptable only as read-model language if everyone hears "projection entry," not "lawful vault node." The vault currently has a closed ordinary node role catalog and executable hard-reject behavior for unknown `node_type` values (`implementation/domainspec/vault/ontology-conventions.md:71-76`, `:123`; `implementation/domainspec/internal_tools/vault_common/frontmatter.py:19-38`, `:230-280`).

What I still reject: Simon's relation names must not be treated as current ontology edges. `classifies_authority_kind`, `declares_source_posture`, `uses_owner_profile`, `requests_promotion_gate`, `decides_transition`, and `emits_projection_when_allowed` are lawful envelope/read-model relations now, not vault `## Connections` edge types. The vault edge catalog is typed and constrained; edges between vault nodes require cataloged forward/inverse pairs except the closed carve-outs (`implementation/domainspec/vault/ontology-conventions.md:289-320`, `:554-616`). Movement edges remain blocked exactly because they match neither carve-out and lack a lawful node type/inverse pair (`findings.md:40-65`).

**Allowed Now**

- `authority_type`, `authority_posture`, and `authority_lifecycle_profile` as envelope/profile concepts.
- `source_authority_posture`, `public_private_posture`, `artifact_kind`, `authority_owner`, `gate_route`, `promotion_record`, `ontology_refs.candidates`, and `ontology_refs.projections` as lifecycle-envelope fields.
- Ontology projection entries that expose those fields for review, search, and contextualization, while explicitly remaining non-authority. CyberAlchemy already says ontology condenses candidate maps and promotion requests but cannot promote definitions, constitutions, contracts, or public claims by itself (`cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:920-940`).
- Two status axes: workflow `current_status` on record/envelope, maturity `status` on node/read-model. This is the C7 ruling, and I keep it (`findings.md:239-241`, `:319-324`).

**Allowed Only After Schema Evolution**

- A real `promotion-event`, `movement`, `authority-type`, or `authority-posture` vault `node_type`.
- Any movement bridge edge between authority ledger/event records and ontology nodes.
- Simon's relation names as canonical vault edge types.
- A graph claim that a promotion ledger row is itself a vault subgraph.

The schema-evolution gate has two viable shapes: add a third forward-only carve-out keyed on movement-event logical type, or add a `promotion-event`/`movement` node type with lawful forward/inverse edge pairs. Until one ships, the only legal authority-record-to-ontology bridge is `ontology_refs.candidates/projections`, not a graph edge (`findings.md:57-65`, `:224-251`; `AUDIT.md:81-87`, `:91-101`).

My final taxonomy is therefore conservative but not anti-Simon: first-class authority artifacts, yes; first-class vault nodes, not yet. Envelope now, schema amendment later.

## Explorer 2 - Simon, Herbert

Angle: authority-lifecycle architect using definitions/constitution/discipline governance and `authority_artifact_lifecycle_envelope` as primary corpus.

### Initial Return

**Proposed Model**

Treat `authority-type` and `authority-posture` as first-class reviewable authority artifacts, not as ordinary `node_type` enum values and not as ontology edges. They should be modeled with the existing `authority_artifact_lifecycle_envelope`, because prior accepted work says to extend that envelope, not create a parallel harness: [RESULT.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:54) and [findings.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-harness-ledger-ontology-unification/findings.md:10).

**Authority Node Classes**

1. `authority_type_node`
Represents a governed class such as `definition`, `constitution`, `discipline`, `spec`, `decision`, `authority-posture`, or later `promotion-event` if schema-evolution accepts it. It answers: "What kind of authority artifact is this?" It should have `artifact_kind: authority-type`.

2. `authority_posture_node`
Represents source posture values such as `original-authority`, `evidence`, `template`, `research`, `generated`, `unknown`, already present in the envelope source model: [RESULT.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:63). It answers: "How should this source be relied on?"

3. `authority_lifecycle_profile_node`
Represents the per-kind owner profile, especially the typed-hole `validate_and_promote(payload) -> verdict` contract. The shared rail owns intake/status/record shape, while the owner profile alone produces the verdict: [findings.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-harness-ledger-ontology-unification/findings.md:92) and [findings.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-harness-ledger-ontology-unification/findings.md:224).

**Owner Profiles**

- `definition-authority-profile`: owned by `definitions-governance`; validates normative semantics, three colocated voices, and no override by plain/domain-context language. Source: [SKILL.md](/home/vrondelli/projects/domainspec-core/.agents/skills/definitions-governance/SKILL.md:28), [SKILL.md](/home/vrondelli/projects/domainspec-core/.agents/skills/definitions-governance/SKILL.md:108).
- `constitution-authority-profile`: owned by `constitution-governance`; validates scoped enforceable rules, examples/non-examples, validation mode, conflict preservation, and schema-evolution gates. Source: [SKILL.md](/home/vrondelli/projects/domainspec-core/.agents/skills/constitution-governance/SKILL.md:94), [SKILL.md](/home/vrondelli/projects/domainspec-core/.agents/skills/constitution-governance/SKILL.md:122).
- `discipline-authority-profile`: owned by `discipline-governance`; validates recurring practice evidence, steward, maturity status, hardening route, and Growth Rule. Source: [SKILL.md](/home/vrondelli/projects/domainspec-core/.agents/skills/discipline-governance/SKILL.md:111), [SKILL.md](/home/vrondelli/projects/domainspec-core/.agents/skills/discipline-governance/SKILL.md:122).
- `decision-profile`: owned by `decision-gate` for contested ownership, public/private posture, naming, source conflicts, and promotion scope; those gates are required by policy: [promotion-policy.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/promotion-policy.md:20).

**Statuses**

Use two separate axes.

Envelope workflow status:
`source-evidence | import-candidate | review-candidate | blocked | active | drift-flagged | superseded | deprecated`, per the envelope: [RESULT.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:58).

Node/read-model maturity status:
Use ontology/vault maturity only for projection/read-model reliance, not promotion judgment. Vault `status` is `draft | exploratory | active | consolidated | evergreen`: [ontology-conventions.md](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:53). Inventory status is its own generated-page vocabulary: [schema.md](/home/vrondelli/projects/domainspec-core/.arcanum/inventory/schema.md:35).

**Confidence Lifecycle Fields**

For both authority-type and authority-posture nodes, keep:

`source_confidence`: evidence quality for the source claim.
`commitment_confidence`: confidence that CyberAlchemy should rely on the claim as local authority.
`review_confidence`: owner-profile confidence after validation.
`projection_confidence`: confidence of generated ontology/read-model representation.
`confidence_basis`: source refs, validation refs, contradiction refs.
`confidence_delta`: what changed since last review.
`confidence_owner`: route responsible for review.
`reviewed_at`, `reviewed_by`, `next_review_trigger`.

This follows the existing CyberAlchemy definition that consolidation preserves source links, evidence confidence, commitment confidence, and owner routes: [DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:68).

**Relation Classes**

Allowed now:

- `classifies_authority_kind`: authority artifact -> authority-type node.
- `declares_source_posture`: source/envelope source entry -> authority-posture node.
- `uses_owner_profile`: envelope -> lifecycle profile.
- `requests_promotion_gate`: ontology/import candidate -> owner gate or PromotionRecord.
- `decides_transition`: owner decision -> PromotionRecord.
- `emits_projection_when_allowed`: PromotionRecord -> projection/read model.

These stay request/witness/read-model relations. Promotion remains with owner gates and `PromotionRecord`, not the relation itself. Promotion policy ladder supports this staged path: [promotion-policy.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/promotion-policy.md:8).

Blocked until schema evolution:

- `witnesses_authority_movement`
- `promotion-movement edge`
- treating `promotion-event` as a vault `node_type`

The bridge edge is explicitly killed until a third forward-only carve-out or lawful `promotion-event`/`movement` node type exists: [findings.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-harness-ledger-ontology-unification/findings.md:40). Current vault edges require both endpoints unless carved out: [ontology-conventions.md](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:289).

**What Remains Per-Kind**

Definitions: normative meaning and voice completeness remain in definitions-governance. Ontology may represent meaning and drift, but cannot redefine terms: [SKILL.md](/home/vrondelli/projects/domainspec-core/.agents/skills/definitions-governance/SKILL.md:108).

Constitutions: enforceable rule scope, precedence, examples, validators, and conflict handling remain in constitution-governance. Do not smooth conflicts into a graph fact: [SKILL.md](/home/vrondelli/projects/domainspec-core/.agents/skills/constitution-governance/SKILL.md:131).

Disciplines: practice maturity, steward, route, and hardening remain in discipline-governance. Disciplines may not directly promote registry, ontology, glossary, sigil, or spell knowledge: [SKILL.md](/home/vrondelli/projects/domainspec-core/.agents/skills/discipline-governance/SKILL.md:70).

Workflow records: keep as lifecycle execution/evidence records, not authority nodes.

Promotion records: keep as canonical governance decision records about one primary claim/relation; they carry evidence, review gate, confidence split, contradiction path, and rollback/supersession path, but do not replace the owner artifact: [GOVERNED-CANDIDATE-BUNDLE.md](/home/vrondelli/projects/domainspec-core/arcanum/arcana/ontology-vault/development/schema-validation-plan/GOVERNED-CANDIDATE-BUNDLE.md:112).

Ledger events: append-only movement/event facts. They witness transitions but do not decide them; the vault already separates current state from event ledgers: [ontology-architecture-draft.md](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-architecture-draft.md:138).

Ontology projections: generated/read-model JOINs over current state and events, never lifecycle owner: [RESULT.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:38).

Ordinary vault `node_type`: keep as document role, not authority lifecycle. It classifies what role a document plays and does not change with maturity: [ontology-conventions.md](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:71).

Bottom line: authority-type and authority-posture nodes are reviewable lifecycle objects because they govern how other objects are classified and relied on. But their review happens through the envelope plus owner profile; ontology can project/query them, and ledgers can witness their movement, only after owner gates permit it.

### Robot-Talks Final Position

Using `robot-talks` as read-only final-position framing.

**Concessions**

Mac Lane is right on present legality. I withdraw any claim that `authority-type`, `authority-posture`, `workflow-record`, or `promotion-event` are legal current `node_type` values. Current vault law defines `node_type` as document role, while `status`, `veracidade`, and `convicção` carry separate maturity/evidence/commitment axes: [ontology-conventions.md](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:53), [ontology-conventions.md](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:71). So these cannot be introduced as vault node classes by architectural taste.

Popper is right on smallest witness. Today, authority type/posture exist as envelope or source metadata, not graph node classes. The accepted envelope already has `artifact_kind`, `authority_owner`, `current_status`, `source_authority_posture`, `confidence`, `promotion`, `drift_owner`, and `ontology_refs`: [RESULT.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:54). The only legal current bridge between authority lifecycle and ontology is reference/projection metadata, not a graph movement edge.

I also concede the movement bridge remains blocked. Current vault edges require declared forward and inverse endpoints, except closed carve-outs for skill/agent targets and session-origin edges: [ontology-conventions.md](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:289), [ontology-conventions.md](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:301), [ontology-conventions.md](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:314). The prior unification finding correctly kills movement edges until a third carve-out or `promotion-event`/`movement` node type ships through schema evolution: [findings.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-harness-ledger-ontology-unification/findings.md:40).

**What I Still Defend**

I still defend modeling authority-type and authority-posture as reviewable lifecycle objects, but not as current ontology nodes. The correct implementation surface is the existing `authority_artifact_lifecycle_envelope` plus per-kind owner profiles. That preserves the accepted rule that ontology is a candidate/projection layer and not the lifecycle owner: [RESULT.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:38).

The durable Simon position is: authority-type/posture are governed vocabulary artifacts with confidence and review history, but their first legal form is envelope/profile/PromotionRecord-compatible record metadata. Only after schema-evolution may they become vault node types or movement event nodes.

I also defend the typed-hole contract. Shared rails may own intake, evidence, status ladder, and projection handles, but verdict production belongs to the per-kind owner profile. That is necessary because definitions forbid interpretive voices from overriding the formal definition, while constitutions preserve conflicts instead of smoothing them away: [definitions-governance/SKILL.md](/home/vrondelli/projects/domainspec-core/.agents/skills/definitions-governance/SKILL.md:108), [constitution-governance/SKILL.md](/home/vrondelli/projects/domainspec-core/.agents/skills/constitution-governance/SKILL.md:122). A shared validator would collapse incompatible judgment laws.

**Allowed Now**

- `authority_type`: field/value in lifecycle envelopes, import ledgers, PromotionRecord-compatible records, and owner-profile payloads.
- `authority_posture`: source posture/local posture/route metadata on imports, towers, envelope `sources[]`, and records.
- `workflow_record`: workflow or ledger artifact outside vault node law; may cite or reference authority artifacts.
- `promotion_record`: canonical governance decision record-kind for one primary claim or relation; it does not replace the owner artifact: [GOVERNED-CANDIDATE-BUNDLE.md](/home/vrondelli/projects/domainspec-core/arcanum/arcana/ontology-vault/development/schema-validation-plan/GOVERNED-CANDIDATE-BUNDLE.md:112).
- `ontology_refs.candidates/projections`: current legal relation handle from lifecycle record to ontology read model.
- Confidence review: use existing `confidence` on envelope sources plus existing vault axes where the target is a legal vault node; keep evidence confidence and commitment confidence distinct.

**Only After Schema-Evolution**

- `authority-type` or `authority-posture` as new vault `node_type` values.
- `promotion-event` or `movement` as vault node roles.
- Forward-only movement bridge edges.
- A graph edge such as `witnesses_authority_movement`.
- Treating ledger events as graph nodes instead of append-only evidence/state records.
- Promoting "schema" as a first-class authority type without its owner profile and typed-hole validation contract.

**Final Taxonomy**

Current taxonomy is four-layered:

1. Authority lifecycle envelope: source posture, authority kind, status, owner route, confidence, conflicts, promotion handle.
2. Owner profile: per-kind `validate_and_promote` judgment.
3. PromotionRecord/workflow/ledger: decision and event evidence, not ontology authority.
4. Ontology projection: read model over candidates/projections, not a promotion gate.

So I converge with Mac Lane and Popper on legality, but keep the lifecycle architecture claim in narrower form: reviewable authority objects are real, but today they live as governed records/envelopes and profile payloads. They are not yet vault node classes.

## Explorer 3 - Popper, Karl

Angle: concrete witness builder using ledger-as-primitive, recursivity-as-invariant-candidate, and schema-definition examples.

### Initial Return

**Witness Verdict**
Smallest sound taxonomy: keep authority lifecycle records, ontology nodes, workflow ledgers, promotion records, and projections separate. Relate them only through typed references until a schema-evolution amendment adds lawful movement edges.

**Nodes That Exist**

- `authority_artifact_lifecycle_envelope`: existing authority record rail, not a new harness. It carries `artifact_id`, `artifact_kind`, `authority_owner`, `current_status`, sources, promotion, conflicts, `drift_owner`, and `ontology_refs` ([cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:54)).
- Authority type/posture values exist as envelope fields: `artifact_kind` and `source_authority_posture`, not yet ontology node classes ([RESULT.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:58)).
- Concept/ontology nodes exist as vault nodes with `node_type`, `status`, confidence fields, and graph role ([implementation/domainspec/vault/ontology-conventions.md](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:51)).
- Promotion records exist as review/change records with claim, source inputs, status, evidence confidence, commitment confidence, owner, gate result, contradiction path, bridge validation ([arcanum/development/cyberalchemy-ontology-lifecycle/first-slice/promotion-record-fixture.md](/home/vrondelli/projects/domainspec-core/arcanum/development/cyberalchemy-ontology-lifecycle/first-slice/promotion-record-fixture.md:14)).
- Workflow records exist in Craft ledger space; ledger is source of truth, generated views are derived ([cyberAlchemy-v2/authority/definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:463)).
- Ledger events exist as event-sourcing precedent: `ontology_events` is the machine-readable mutation ledger, separate from vault current state ([implementation/domainspec/vault/ontology-architecture-draft.md](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-architecture-draft.md:138)).
- Ordinary vault `node_type` values exist, but no `promotion-event` / `movement` node type exists today ([ontology-conventions.md](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:56)).

**Edges**

- The governing edge rule is `CAV2-D16`: any authority/source/schema/promotion dependency that matters must become an explicit typed relation with endpoints, type, direction, owner, evidence, and effect ([DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:632)).
- Ledger primitive candidate edges are not canonical yet: `contains`, `recomposes_into`, `promotes_to`, `inherits_constraint_from`, `derived_from`, `emits_residue`, etc. are candidates only ([ledger-primitive-review.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/reviews/ledger-primitive-review.md:115)).
- Current legal edge between authority record and ontology is a reference/projection handle: `ontology_refs.candidates/projections`, not a graph movement edge ([RESULT.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:83)).
- Bridge/movement edge breaks today: vault edges require bidirectional declaration except two closed carve-outs, skills/agents and session-origin edges ([ontology-conventions.md](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:289), [ontology-conventions.md](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:301), [ontology-conventions.md](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:314)). A promotion movement is neither.

**Statuses Live Where**

- Authority workflow status lives on the envelope: `source-evidence`, `import-candidate`, `review-candidate`, `blocked`, `active`, `drift-flagged`, `superseded`, `deprecated` ([RESULT.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:61)).
- Gate result lives in promotion/gate records: pass/flag/block is owner-route output ([DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:204)).
- Ontology maturity `status` lives on vault nodes: `draft`, `exploratory`, `active`, `consolidated`, `evergreen` ([ontology-conventions.md](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:60)).
- Ontology confidence lives on ontology nodes as `veracidade` / `convicção`, while PromotionRecord splits `evidenceConfidence` and `commitmentConfidence` ([ontology-conventions.md](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:61), [promotion-record-fixture.md](/home/vrondelli/projects/domainspec-core/arcanum/development/cyberalchemy-ontology-lifecycle/first-slice/promotion-record-fixture.md:25)).
- Craft artifact/ledger statuses live inside Craft schema, separately from ontology maturity ([arcanum/arcana/craft/templates/ledger.schema.yml](/home/vrondelli/projects/domainspec-core/arcanum/arcana/craft/templates/ledger.schema.yml:111)).

**Three Witnesses**

1. Ledger as Primitive: witnessed only as a scoped state/evidence register. It may carry candidate definitions, residue, gates, validation evidence, and recomposition, but it is source-of-truth only for its own rows and cannot define term meaning or ontology authority ([ledger-primitive-review.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/reviews/ledger-primitive-review.md:46)).
2. Recursivity as Invariant Candidate: witnessed as same governed process applied to its own artifacts across distinct altitudes while preserving authority boundaries, but not promotable yet because it overlaps CAV2-D17 and CAV2-D20 ([2026-06-21-recursivity-promotion-verdict/findings.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-recursivity-promotion-verdict/findings.md:110)).
3. Schema as Definition / Authority Type: currently a typed hole, not a settled node class. The existing envelope has no `schema` artifact kind, so a schema must be handled as `spec`/`other` or via future schema-evolution. DomainSpec taxonomy has `Enum / Type`, `Rule`, `Policy`, `Workflow`, etc., but not an authority-schema meta-type ([arcanum/definitions/TAXONOMY.md](/home/vrondelli/projects/domainspec-core/arcanum/definitions/TAXONOMY.md:11)).

**What Breaks**

- Promoting `ledger` breaks until recursivity, relation vocabulary, inheritance/containment separation, and Craft conformance are settled ([ledger-primitive-review.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/reviews/ledger-primitive-review.md:53)).
- Treating `parent_id`/containment as authority inheritance breaks; review explicitly forbids that collapse ([ledger-primitive-review.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/reviews/ledger-primitive-review.md:103)).
- Treating ontology projection as promotion breaks: ontology may represent lifecycle, but owner routes own transitions and verdicts ([RESULT.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:14)).
- Building movement edges now breaks bidirectionality/schema rules unless a discovery amends conventions with a third carve-out or adds `promotion-event` / `movement` node type ([2026-06-21-authority-harness-ledger-ontology-unification/findings.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-harness-ledger-ontology-unification/findings.md:40)).

### Robot-Talks Final Position

**Final Position**

I mostly converge with Mac Lane on legality and with Simon on useful modeling, but I keep one Popper constraint sharp: a "reviewable authority node" is admissible now only as an authority artifact represented by an envelope plus optional projection. It is not yet a vault `node_type`, not yet a movement event, and not yet an ontology edge family with authority effects.

**What I Concede**

Mac Lane is right about current ontology law. Existing vault frontmatter allows `node_type` values such as `axiom`, `premise`, `constitution`, `discovery`, `spec`, `conceptual`, etc.; it does not allow `authority-type`, `authority-posture`, `workflow-record`, `promotion-event`, or `movement` ([implementation/domainspec/vault/ontology-conventions.md](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:53)). The same file defines `node_type` as document role, while trust/maturity lives in `status`, `veracidade`, and `convicção` ([ontology-conventions.md](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:71)). So Mac Lane's axis discipline is not just elegant; it is the current law.

I also concede Simon's modeling move: `authority-type` and `authority-posture` can be first-class reviewable authority artifacts if they are modeled through the existing `authority_artifact_lifecycle_envelope`, not forced into the vault enum. The envelope already carries `artifact_kind`, `authority_owner`, `current_status`, source posture, promotion fields, and `ontology_refs` ([cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:54)). That is the right witness surface.

**What I Still Reject**

I reject treating Simon's proposed `authority_type_node`, `authority_posture_node`, and `authority_lifecycle_profile_node` as current ontology node classes. The names are useful design handles, but today they must compile down to authority artifacts plus projections, not vault `node_type` values.

I reject movement bridge edges now. Vault node edges require explicit forward and inverse declarations, except closed carve-outs for skills/agents and session-origin edges ([ontology-conventions.md](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:289), [ontology-conventions.md](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:301), [ontology-conventions.md](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:314)). The unification finding already names the movement edge as KILL-until-amendment ([cyberAlchemy-v2/development/research/2026-06-21-authority-harness-ledger-ontology-unification/findings.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-harness-ledger-ontology-unification/findings.md:40)).

I reject letting confidence lifecycle float free. Ontology confidence can use `veracidade` / `convicção`; promotion records can use evidence/commitment confidence; authority envelopes can carry source confidence. These are related but not interchangeable.

**Allowed Now**

Concrete witness taxonomy I allow now:

- `AuthorityTypeArtifact`: envelope-backed authority artifact whose subject is a classification rule for authority kinds. Current representation: `artifact_kind: spec | decision | other`, owner route, workflow `current_status`.
- `AuthorityPostureArtifact`: envelope-backed artifact defining source/local posture semantics. Current representation: source posture metadata on imports/envelopes, not vault node role.
- `AuthorityLifecycleProfileArtifact`: envelope-backed profile that names owner route and validate/promote behavior per kind.
- `PromotionRecord`: separate review/change record that carries claim, source inputs, status, confidence split, owner, gate result, contradiction path, and bridge validation ([arcanum/development/cyberalchemy-ontology-lifecycle/first-slice/promotion-record-fixture.md](/home/vrondelli/projects/domainspec-core/arcanum/development/cyberalchemy-ontology-lifecycle/first-slice/promotion-record-fixture.md:14)).
- `OntologyProjection`: derived/read-model representation only. Ontology may represent lifecycle state and promotion requests, but lifecycle transitions belong to owner routes, not ontology ([RESULT.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:14)).

Allowed-now relations are envelope fields or non-graph references: `classifies_authority_kind`, `declares_source_posture`, `uses_owner_profile`, `requests_promotion_gate`, `decides_transition`, `emits_projection_when_allowed`. They are admissible as candidate relation names only if each records endpoints, direction, owner, evidence, and effect, per `CAV2-D16` ([cyberAlchemy-v2/authority/definitions/DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:632)).

**Only After Schema-Evolution**

After schema-evolution, I would allow either:

- a new `promotion-event` / `movement` vault `node_type` with lawful inverse edge pairs, or
- a third forward-only carve-out for temporal authority-movement records.

Only then can movement bridge edges become graph edges instead of projection metadata. Until that ships, the safe taxonomy is: authority artifacts are reviewable through envelopes; ontology nodes remain governed by existing vault axes; projections may show the relationship, but they do not enact it.
