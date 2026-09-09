# Authority Movement And Ontology Relations - Findings

## Verdict

- Verdict: KEEP-with-fixes, design-scope only. This dispatch produced research evidence and relation guidance; it did not mutate inventory, ontology, definitions, source clusters, schemas, public artifacts, or promotion records. (`research.md:3-6`; `../../reviews/2026-06-21-authority-elevation-protocol-review/findings.md:3-5`)
- Keep the candidate witness loop as a governed design path: source-backed selection -> inventory evidence -> ontology candidate -> owner gate -> `PromotionRecord` -> gated projection/read model. (`research.md:62-65`; `research.md:148-163`; `cyberAlchemy-v2/authority/promotion-policy.md:10-18`)
- Do not promote `authority_relation_record` / ARR now. It remains proposed governance metadata, not an accepted relation, vault edge, schema row, registry entry, `PromotionRecord` substitute, or promotion verdict. (`research.md:267-273`; `research.md:423-425`; `../../reviews/2026-06-21-authority-elevation-protocol-review/findings.md:117-130`)

## Corrected Relation Model

```text
SourceFile/source artifact
  -> SourceSelector
  -> optional SourceDigest
  -> InventoryEvidence / EvidenceCard

EvidenceSet
  -> groups EvidenceCard IDs for lookup or handoff only

InventoryEvidence / EvidenceCard
  -> supports OntologyCandidate

OntologyCandidate
  -> requests owner gate

OwnerDecision / gate verdict
  -> feeds PromotionRecord

PromotionRecord
  -> records transition state, owner, verdict, scope, blocks, and projection permission

PromotionRecord
  -> authorizes or blocks LocalAuthorityArtifact / GovernedProjection / ReadModel
```

- `SourceFile` / source artifact remains authority for its own claims. Raw sources outrank digests, inventory pages, ontology maps, sessions, memory, and observability read models. (`research.md:47-52`; `cyberAlchemy-v2/authority/boundaries.md:16-22`)
- `SourceSelector` locates source material. It does not summarize, promote, or decide authority. (`research.md:217-225`; `projects/ontology/ARCHITECTURE.md:15-19`)
- `SourceDigest` summarizes with provenance and may support candidates, but it is evidence compression, not a source replacement. (`cyberAlchemy/ontology/source-ledger.md:44-57`; `research.md:120-127`)
- `InventoryEvidence` / `EvidenceCard` catalogs source-backed evidence with source refs, authority level, promotion owner, trace, and residue. Handoff cards remain non-authority read models until a downstream owner creates a governed artifact. (`.arcanum/inventory/schema.md:88-96`; `.arcanum/inventory/entries/evidence-cards/2026-06-18-dispersed-knowledge-cards.md:252-264`)
- `EvidenceSet` groups evidence-card IDs for lookup or handoff only. It does not copy or create promotion claims. (`research.md:227-230`; `.arcanum/inventory/schema.md:98-103`)
- `OntologyCandidate` condenses governed meaning and may request promotion, but cannot promote definitions, constitutions, runtime contracts, or public claims by itself. (`cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:922-940`; `research.md:232-245`)
- Owner gate verdicts feed or anchor `PromotionRecord`; `PromotionRecord` owns transition state, gate result, owner, scope, block/defer reasons, and projection permission. (`research.md:114-117`; `research.md:252-259`; `arcanum/development/cyberalchemy-ontology-lifecycle/ONTOLOGY-ARCHITECTURE.md:210-230`)
- Governed projections/read models emit only after the gate permits use. Blocked records withhold projection. (`research.md:256-259`; `cyberAlchemy-v2/authority/boundaries.md:33-43`)

## Witnessed Relations

- `selects_source`: `SourceSelector` -> source artifact. Accepted as locator-only language.
- `summarizes_source`: `SourceDigest` -> source artifact. Accepted as provenance-preserving compression.
- `catalogs_evidence`: `SourceSelector` / `SourceDigest` -> `InventoryEvidence` / `EvidenceCard`. Accepted as candidate witness language only. (`research.md:155-163`; `research.md:222-225`)
- `groups_for_lookup_or_handoff`: `EvidenceSet` -> evidence-card IDs. Accepted with the explicit no-promotion rule. (`research.md:157-159`; `research.md:227-230`)
- `supports_candidate`: `InventoryEvidence` / `EvidenceCard` -> `OntologyCandidate`. Accepted only as meaning support, not promotion. (`research.md:232-235`; `.arcanum/inventory/index.md:40-44`)
- `requests_promotion_gate`: `OntologyCandidate` -> owner gate / `PromotionRecord`. Accepted as the promotion request boundary. (`research.md:242-245`; `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:184-192`)
- `decides_transition`: owner gate verdict / `OwnerDecision` -> `PromotionRecord`. Accepted because promotion is owner-routed and decisioned. (`research.md:252-254`; `cyberAlchemy-v2/authority/promotion-policy.md:20-29`)
- `emits_when_gate_allows`: `PromotionRecord` -> governed projection / read model. Accepted only when the record permits use scope. (`research.md:256-259`; `arcanum/development/cyberalchemy-ontology-lifecycle/PROMOTION-LIFECYCLE.md:92-101`)
- `witnesses_cross_branch_authority_movement`: B4 bridge -> ARR/candidate/projection witness links. Accepted only as bridge evidence, not ARR acceptance, and never as promotion or source redefinition. (`research.md:261-264`; `cyberAlchemy/ontology/source-digests/arcanum-business-ontology.md:63-79`)

## Authority Relation Record Boundary

`authority_relation_record` is design-scope governance metadata for describing possible authority movement. It is not a vault edge, accepted relation, schema row, registry entry, `PromotionRecord` substitute, or promotion verdict.

- ARR may describe candidate movement between a source meaning, target context, gate, owner route, semantic delta, origin constraint, evidence refs, and blocked/proposed/emitted status.
- ARR cannot authorize movement. The owner gate and `PromotionRecord` authorize or block movement.
- ARR cannot become a vault edge by assertion. If it becomes a relation family later, it must enter through relation schema governance and an explicit registry route.
- Kill `records_authority_movement_metadata` as an accepted present-tense relation today. The phrase remains design wording only until there is an owner route, schema, registry, and examples. (`research.md:247-250`; `research.md:267-273`)

## Product Profile Witness

- `OutcomeEvent`, `MetricObservation`, `PromotionCandidate`, `OwnerDecision`, and `KnowledgeProjection` are Ontologize/product-profile witness terms, not generic CyberAlchemy v2 canon unless definitions-governance promotes reusable vocabulary. (`research.md:126`; `research.md:382-389`; `research.md:462-467`)
- The product witness spine is valid as an application profile: `OutcomeEvent` and `MetricObservation` supply evidence, `PromotionCandidate` proposes movement, `OwnerDecision` decides, and `KnowledgeProjection` carries the promoted product result. (`research.md:306-310`; `projects/ontologize/DAG-AND-METRICS.md:43-48`)
- Ontologize's B1/B2/B3/B4 branch model supports the witness pattern, but B3 run-context and B4 bridge remain product-specific proof surfaces. (`projects/ontologize/ONTOLOGY-BRANCHES.md:19-34`; `projects/ontologize/development/view-triad-method/DESIGN.md:84-106`)
- Product reuse requires owner reuse scope, boundary review, and public/private scrub before a client lesson, metric, or message becomes reusable or public-facing. (`research.md:320-326`; `projects/ontologize/clients/hellbender/engineer-view.md:180-183`; `cyberAlchemy-v2/authority/boundaries.md:6-14`)

## Authority Boundaries

- Inventory and ontology may represent, condense, route, or request promotion. They do not promote authority by themselves. (`../../reviews/2026-06-21-authority-elevation-protocol-review/findings.md:44-54`; `cyberAlchemy-v2/authority/definitions/DEFINITION-TOWERS.md:307-312`)
- Source clusters represent external authority for search, dedupe, tower assignment, and local adaptation review. They do not redefine source terms or promote them into v2 canon. (`cyberAlchemy-v2/authority/definitions/source-clusters/arcanum.md:11-19`)
- Authority-by-proximity is killed: copying, relocating, digesting, clustering, indexing, bridging, or placing material near authority surfaces does not promote it. (`cyberAlchemy-v2/development/refinement-runs/20260621T030752Z-definition-promotion-governance/RESULT.md:10-20`; `cyberAlchemy-v2/authority/boundaries.md:24-31`)
- Vault analog edges such as `derives-from`, `validates`, `codified-as`, `governed-by`, `operationalized-by`, `supersedes`, and `contradicts` can witness movement, but none equals promotion or a gate verdict. (`research.md:423-427`; `implementation/domainspec/vault/constitution/edge-constitution.md:52-58`)
- Any new vault edge or relation family must enter through schema governance. Inline-coined edges and schema/catalog changes are blocked until the amendment route passes. (`implementation/domainspec/vault/constitution/edge-constitution.md:52-58`; `implementation/domainspec/vault/constitution/schema-amendment-discipline-constitution.md:26-38`)

## Owner Matrix

| Movement | Owner route | Allowed before gate | Blocked before gate |
| --- | --- | --- | --- |
| Source -> digest | Inventory / ontology evidence route | selectors, digests, source refs | replacing source authority |
| Evidence -> ontology candidate | Ontology-vault / definitions-governance route | candidate meaning, confidence, invalidation | canon, schemas, public claims |
| Candidate -> definition | definitions-governance | proposed vocabulary and intuition | canonical definition mutation |
| Candidate -> constitution | constitution-governance | lifecycle matrix, form proposal | enforceable constitution |
| Candidate -> schema/relation | schema governance / decision-gate | design relation, registry proposal | vault edge, relation row, generated catalog |
| Candidate -> local artifact | task-session after owner gate | implementation plan, fixtures in block/candidate state | runtime mutation or public derivative |
| Product profile -> generic canon | definitions-governance plus boundary review | profile witness, analog, evidence packet | generic CyberAlchemy v2 vocabulary |

## Killed Or Blocked Claims

- Block canonical promotion of protocol terms, constitution-level enforcement, task-session mutation, relation-record schema implementation, promotion-record schema implementation, source-cluster mutation, and public derivatives. (`../../reviews/2026-06-21-authority-elevation-protocol-review/findings.md:117-128`)
- Block any promotion with unknown source authority. Unknown source authority may support representation, search, or flagged inventory staging only. (`../../reviews/2026-06-21-authority-elevation-protocol-review/findings.md:128-130`)
- Block product/application vocabulary becoming generic CyberAlchemy v2 canon without owner reuse scope, boundary review, and definitions-governance. (`research.md:462-467`; `cyberAlchemy-v2/authority/promotion-policy.md:20-29`)
- Block B4 bridge as an automatic product promotion lane. B4 may validate, trace, or flag insufficiency, but it does not redefine source or target meaning. (`research.md:76-81`; `research.md:261-264`; `research.md:391-397`)
- Block schema/catalog changes until relation schema, relation registry, lifecycle matrix, decision-gate contract, and schema-amendment route exist. (`research.md:431-449`; `research.md:499-505`)
- Block authority-by-proximity in all forms: path proximity, source cluster proximity, inventory proximity, ontology map proximity, generated projection proximity, and product proof proximity.

## Inventory Backfill Sequence

1. Start from `.arcanum/inventory/index.md` and existing EvidenceSets, treating evidence cards and sets as candidate read models rather than promoted authority. (`research.md:183-186`; `.arcanum/inventory/index.md:15-19`; `.arcanum/inventory/index.md:40-44`)
2. Expand the selected EvidenceSet into evidence-card source refs, preserving inclusion reasons, exclusions, handoff target, synthesis note, status, and residue. (`research.md:187-188`; `.arcanum/inventory/entries/evidence-sets/2026-06-18-dispersed-knowledge-sets.md:47-68`)
3. Backfill evidence cards for authority movement protocol, digest-to-candidate support, ontology-candidate gate requests, origin provenance, semantic delta from source, bridge evidence, relation registry, lifecycle matrix, and boundary checklist selectors. (`research.md:54-58`; `research.md:189-190`)
4. Synthesize ontology candidates only after cards exist, with branch target, evidence confidence, commitment confidence, invalidation, review owner, and promotion gate. (`research.md:189-191`; `projects/ontology/ARCHITECTURE.md:112-134`)
5. Create `PromotionRecord` fixtures in `block` or `candidate` state until owner gates pass, then compile projections/read models last. (`research.md:190-192`; `projects/ontology/ARCHITECTURE.md:150-156`)

## Next Routes

1. Run `definitions-governance` for vocabulary/design only: `authority context`, `authority movement`, `elevation`, `promotion`, `adaptation`, `inheritance`, `origin constraint`, `origin back-reference`, and `authority_relation_record`. (`../../reviews/2026-06-21-authority-elevation-protocol-review/findings.md:140-151`)
2. Run `constitution-governance` for the artifact-kind lifecycle matrix and gate rules before schema or enforcement work. (`../../reviews/2026-06-21-authority-elevation-protocol-review/findings.md:132-138`; `../../reviews/2026-06-21-authority-elevation-protocol-review/findings.md:152-153`)
3. Run `decision-gate` for owner conflict, public/private conflict, scope, naming, promotion disputes, and contested reuse. (`research.md:444-449`; `cyberAlchemy-v2/authority/promotion-policy.md:27-29`)
4. Treat the unblocker bundle as mandatory: owner matrix, boundary checklist, multi-source conflict handling, source authority posture, drift owner, and naming scope. (`../../reviews/2026-06-21-authority-elevation-protocol-review/findings.md:63-90`; `../../reviews/2026-06-21-authority-elevation-protocol-review/findings.md:132-138`; `cyberAlchemy-v2/authority/promotion-policy.md:27-28`)
5. Only after those owner routes pass, run `task-session` to implement relation schemas, promotion schemas, source-cluster origin rows, or vault catalog amendments. (`../../reviews/2026-06-21-authority-elevation-protocol-review/findings.md:151-159`)
