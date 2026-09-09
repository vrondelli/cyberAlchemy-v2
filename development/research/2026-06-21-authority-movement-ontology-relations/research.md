# Authority Movement And Ontology Relations - Research

Dispatch: `2026-06-21-authority-movement-ontology-relations`
Dispatch type: `research`
Status: collected explorer transcript
Authority effect: research only; no inventory, ontology, definition, source-cluster, schema, public artifact, or promotion mutation.

## Agent 1 - Bateson, Gregory

Role: explorer
Lens: CyberAlchemy ontology pack as governed meaning

### Initial Receipt

Artifacts inspected:

- `cyberAlchemy/ontology/README.md`
- `cyberAlchemy/ontology/source-ledger.md`
- `cyberAlchemy/ontology/entries/knowledge-governance-authority-ladder.md`
- `cyberAlchemy/ontology/source-digests/`
- `cyberAlchemy-v2/authority/README.md`
- `cyberAlchemy-v2/authority/boundaries.md`
- `cyberAlchemy-v2/authority/promotion-policy.md`
- `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md`
- `cyberAlchemy-v2/authority/definitions/DEFINITION-TOWERS.md`
- CyberAlchemy v2 source-cluster/localization files
- `cyberAlchemy-v2/development/reviews/2026-06-21-authority-elevation-protocol-review/findings.md`

Source-backed relation candidates:

- `source_digest_supports_ontology_candidate`: source digests compile imported concepts into CyberAlchemy ontology context while preserving provenance; they are evidence, not source replacement. Evidence: `cyberAlchemy/ontology/README.md:22`, `cyberAlchemy/ontology/source-ledger.md:42`.
- `ontology_candidate_requests_promotion_gate`: ontology condenses governed meaning into thick entries, confidence, edges, and promotion paths, but v2 promotion gates decide crossing into authority. Evidence: `cyberAlchemy/ontology/entries/knowledge-governance-authority-ladder.md:114`, `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:184`.
- `candidate_adapts_source_meaning`: a local v2 candidate may adapt a source definition only by naming source authority, tower need, semantic delta, and owner route. Evidence: `cyberAlchemy-v2/development/refinement-runs/20260621T030752Z-definition-promotion-governance/stages/subagents/novelty-upward-promotion-receipt.md:12`.
- `origin_reference_preserves_provenance`: origin/back-reference ledgers should preserve source owner, source path/id, promotion record, drift state, and boundary review without becoming canon. Evidence: `cyberAlchemy-v2/development/refinement-runs/20260621T030752Z-definition-promotion-governance/stages/subagents/novelty-origin-reference-receipt.md:10`.
- `telemetry_or_memory_feeds_candidate_only`: memory, telemetry, reflection, and execution envelopes can feed inventory/ontology candidates, not mutation. Evidence: `cyberAlchemy/ontology/source-digests/necronomicon-knowledge-substrate.md:88`, `cyberAlchemy/ontology/source-digests/arcanum-observed-invocation-reflection.md:90`.
- `bridge_evidence_validates_movement`: bridge claims must cite intent and realization evidence; this fits authority movement records as evidence/conflict/drift support, not as promotion itself. Evidence: `cyberAlchemy/ontology/source-digests/arcanum-business-ontology.md:63`.

Boundary rules:

- Inventory prepares reusable evidence.
- Ontology owns governed meaning.
- Definitions, constitutions, and decisions own authority.
- Candidate ontology entries are not final authority.
- Source digests do not replace originals.
- Inventory and ontology may represent, condense, route, or request promotion, but cannot promote authority themselves.

Conflicts with inventory, definition, and promotion authority:

- Do not let `authority movement protocol` absorb ontology. Ontology supplies candidate relation meaning; the protocol supplies cross-authority movement records and gates.
- Do not let source digests outrank source files. Raw sources remain highest evidence for their own claims.
- Do not let source clusters become definitions. Source clusters represent external authority and route local adaptation review only.
- Do not treat relation schemas or typed edges as promotion proof. Typed relations need owner gates and relation profiles.

Next inventory lookup/backfill needs:

- Backfill evidence cards for `authority movement protocol`, `source_digest_supports_candidate`, `ontology_candidate_requests_promotion`, `origin_reference_preserves_provenance`, `semantic_delta_from_source`, and `bridge_evidence_validates_movement`.
- Each card should include source refs, authority level, promotion owner, trace, and residue per inventory schema.
- Then run the existing schema/relationship search ladder before any repo-wide sweep.

### Final Robot-Talks Position

Bateson accepts Shannon's ladder:

```text
source selector -> InventoryEvidence/evidence-card -> OntologyCandidate -> PromotionRecord -> governed projection/read model
```

Bateson accepts Simon's product/application witness:

```text
OutcomeEvent / MetricObservation -> PromotionCandidate -> OwnerDecision -> KnowledgeProjection
```

Bateson accepts Ashby's constraint that `authority_relation_record` is governance metadata for now. Vault edges may witness or point at movement, but they are not the movement protocol and none equals promotion.

Bateson rejects or constrains:

- source digests becoming source authority;
- ontology absorbing the authority movement protocol;
- B4 bridge becoming an automatic product promotion lane;
- immediate implementation of `authority_relation_record` as a vault edge.

Recommended relation map fragment:

```text
SourceSelector
  -> supports
InventoryEvidence / EvidenceCard
  -> supports
SourceDigest
  -> condenses_for
OntologyCandidate
  -> requests
AuthorityRelationRecord
  -> may_require
PromotionRecord
  -> authorizes_or_blocks
GovernedProjection / LocalAuthorityArtifact
```

Cross-links:

```text
OntologyCandidate
  -> has_origin
SourceSelector

AuthorityRelationRecord
  -> records
relation_mode, source_context, target_context, semantic_delta,
structural_delta, enforcement_delta, owner_gate, drift_state,
boundary_review, evidence_confidence, commitment_confidence

PromotionRecord
  -> records
gate_verdict, decision_owner, mutation_scope, promoted_target,
blocked_or_deferred_reason
```

Residue:

- Source digests are evidence compression, not replacement.
- Ontology candidates are meaning condensation, not authority.
- InventoryEvidence supports candidate formation, not promotion.
- B4 bridge can host authority relation references only as bridge evidence.
- Product/application movement terms should remain local witnesses until definitions-governance decides reusable vocabulary.
- Vault edge compatibility is unresolved.

## Agent 2 - Shannon, Claude

Role: explorer
Lens: Inventory and ontology materialization substrate

### Initial Receipt

Artifacts inspected:

- `.arcanum/inventory/index.md`
- `.arcanum/inventory/schema.md`
- `.arcanum/inventory/queries/2026-06-21-schema-relationship-invariants/search-sequence.md`
- `.arcanum/inventory/entries/evidence-cards/`
- `.arcanum/inventory/entries/evidence-sets/`
- `projects/ontology/ARCHITECTURE.md`
- `projects/ontology/GLOSSARY-CONSISTENCY.md`
- `projects/ontology/research/`
- `.arcanum/ontology-vault/map-2026-06-18-dispersed-knowledge.md`
- `cyberAlchemy-v2/development/reviews/2026-06-21-authority-elevation-protocol-review/findings.md`

Source-backed relation candidates:

```text
source selector -> InventoryEvidence/evidence-card -> OntologyCandidate -> PromotionRecord -> governed projection/read model
```

Candidate relations:

- `catalogs_evidence`: source selector -> evidence-card / `InventoryEvidence`.
- `groups_for_handoff`: EvidenceSet -> evidence-card IDs -> downstream task/route.
- `supports_candidate`: evidence-card / `InventoryEvidence` -> `OntologyCandidate`.
- `governed_by`: `OntologyCandidate` -> `PromotionRecord`.
- `emits_or_realizes_when_gated`: `PromotionRecord` -> promoted ontology node / governed projection.
- `derived_from`: generated read model / index / bounded graph projection -> authority records.
- `authority_relation_record`: cross-artifact movement record that complements `PromotionRecord`.

Gaps:

- `authority_relation_record` and its registry are design-only.
- Existing evidence-cards and EvidenceSets are first-pass candidate read models, not promoted authority.
- Claim-level branch mapping remains draft/candidate.
- Witness IDs such as `IE-0001`, `OC-0001`, and `PR-0001` are fixture patterns, not deployed runtime records.
- There is no current deterministic compiler/invalidation runtime for selector-to-evidence, evidence-to-candidates, candidate-to-promotion, typed sets, or graph projections.
- Bridge evidence is still insufficient for OD-1/OD-2 paths, especially branch-as-view and legal B3 run-view production.
- Older research uses "authority record" broadly, while current inventory schema says evidence-card handoffs are non-authority read models.

Non-authority handoff language:

> Inventory can represent, group, and route source-backed evidence. Ontology-vault can condense candidate meaning and request promotion. Neither promotes authority by itself.

> Treat this EvidenceSet as a lookup and handoff bundle. It does not establish canonical definitions, architecture decisions, runtime contracts, public claims, or promoted ontology nodes.

> Use the candidate relation as promotion evidence only. Owner route, boundary review, and gate verdict remain required before any authority movement is promoted.

Recommended inventory lookup/backfill sequence:

1. Start with `.arcanum/inventory/index.md` plus EvidenceSets.
2. Pick `evset-knowledge-governance-stack`, `evset-public-private-boundary`, or `evset-residue-and-contradictions` by task need.
3. Expand EvidenceSet card IDs to evidence-card source refs.
4. For relation vocabulary, follow the active source ladder: CyberAlchemy v2 local canon, framework-unification, Arcanum definitions, formalization sources, then repo-wide backstop.
5. Backfill missing evidence-cards for `authority_relation_record`, relation registry, lifecycle matrix, and boundary checklist selectors.
6. Only after cards exist, synthesize ontology candidates with explicit branch target, evidence confidence, commitment confidence, invalidation, review owner, and promotion gate.
7. Create PromotionRecord fixtures in `block` or `candidate` state until owner gates pass.
8. Compile read models last.

### Final Robot-Talks Position

Shannon accepts:

- Bateson's constraint that CyberAlchemy ontology material can supply governed candidate meaning, but source digests only support candidates.
- Simon's product/application movement spine as a valid analogue:

```text
OutcomeEvent / MetricObservation -> PromotionCandidate -> OwnerDecision -> KnowledgeProjection
```

- Ashby's caution that `authority_relation_record` should remain governance metadata for now, not a vault edge with semantic force.

Shannon rejects or constrains:

- authority movement protocol absorbing ontology;
- B4 bridge as universal authority bus;
- product reuse without owner reuse scope, public/private boundary review, and source role classification;
- schema work before schema/definition governance.

Recommended relation map fragment:

```text
source file
  -> source selector / source digest
      relation: selects_or_summarizes
      rule: digest is evidence aid, not replacement

source selector / digest
  -> InventoryEvidence / evidence-card
      relation: catalogs_evidence
      fields: source_ref, role, snapshot, authority_level, residue

EvidenceSet
  -> evidence-card ids
      relation: groups_for_lookup_or_handoff
      rule: no copied promotion claim

InventoryEvidence / evidence-card
  -> OntologyCandidate
      relation: supports_candidate
      rule: supports meaning; does not promote

OutcomeEvent / MetricObservation
  -> PromotionCandidate / OntologyCandidate
      relation: supplies_runtime_or_product_evidence
      rule: requires owner reuse scope and boundary review

OntologyCandidate
  -> PromotionRecord
      relation: requests_or_is_governed_by_gate
      rule: PR owns transition state, confidence split, gate result

authority_relation_record
  -> PromotionRecord / OntologyCandidate / source-target pair
      relation: records_authority_movement_metadata
      rule: ARR describes adoption/adaptation/elevation/rejection/deferral; it does not itself promote

OwnerDecision / gate verdict
  -> PromotionRecord
      relation: decides_transition

PromotionRecord
  -> governed projection / KnowledgeProjection / read model
      relation: emits_when_gate_allows
      rule: blocked PR withholds projection

B4 bridge
  -> ARR / candidate / projection witness links
      relation: witnesses_cross_branch_authority_movement
      rule: bridge validates, traces, or flags insufficiency; it does not redefine source or target meaning
```

Residue:

- `authority_relation_record` is movement metadata.
- `PromotionRecord` is transition governance.
- `OntologyCandidate` is candidate meaning.
- `EvidenceSet` is lookup/handoff.
- ARR is not yet a vault edge, graph edge, schema row, or implemented catalog entry.
- Digest usefulness depends on source ref, snapshot/revision, source role, and drift owner.
- B4 bridge promotion needs two-sided evidence and owner gates.
- Simon's movement spine is reusable as a pattern, not automatically portable as CyberAlchemy v2 authority.

## Agent 3 - Simon, Herbert

Role: explorer
Lens: Ontologize product/application ontology

### Initial Receipt

Artifacts inspected:

- `projects/ontologize/DEFINITIONS.md`
- `projects/ontologize/GLOSSARY.md`
- `projects/ontologize/ONTOLOGY-BRANCHES.md`
- `projects/ontologize/DAG-AND-METRICS.md`
- `projects/ontologize/PRODUCT.md`
- `projects/ontologize/PUBLIC-OFFERING.md`
- `projects/ontologize/definitions/DEFINITIONS.md`
- `projects/ontologize/definitions/DEFINITIONS-INDEX.md`
- `projects/ontologize/definitions/DEFINITION-DRIFT-AUDIT.md`
- `projects/ontologize/operational-ontology/`
- `projects/ontologize/development/view-triad-method/`
- `projects/ontologize/clients/hellbender/system-view.md`
- `projects/ontologize/clients/hellbender/engineer-view.md`
- `projects/ontologize/clients/hellbender/ontology-view.md`
- `projects/ontologize/dogfood/cyberalchemy-lead-evidence-pilot/`
- CyberAlchemy v2 authority movement review and related authority policy/boundary surfaces

Relation candidates:

- `branch-as-view` is a product/application projection of authority movement: each artifact/view materializes B1 meaning, B2 system, B3 run-context, and B4 bridge, but remains evidence/register material until a gate promotes it.
- Ontology nodes already encode the movement spine: `OutcomeEvent` / `MetricObservation` supply evidence, `PromotionCandidate` proposes movement, `OwnerDecision` is the promotion gate, and `KnowledgeProjection` is the promoted target.
- B4 bridge edges are the natural place to model `authority_relation_record` links, especially `drifts_from`, `contradicts`, `traced_to`, `tested_by`, and future `origin_constraint` / `origin_backreference`.
- Owner reuse is the product form of promotion authority: reusable lesson, message, client learning, or product claim requires owner decision plus allowed reuse scope.
- Hellbender confirms the boundary pattern: public evidence can shape account research, but cannot authorize an offer; metrics cannot become reusable knowledge without owner route.

Product/application constraints:

- Ontologize's product ontology is stricter than a glossary: it requires branches, typed nodes, governed edges, separate execution/ontology DAGs, evidence grades, and promotion gates.
- B3 `run-context` is load-bearing for product proof because denominators, lifecycle state, and stage-vs-outcome checks live there.
- Raw drift is not contradiction. Drift feeds candidate movement; contradiction is adjudicated and blocks promotion.
- Dogfood is validation, not external offer.
- Inventory and ontology can represent, condense, route, and request promotion; they do not promote themselves.

Public/private risks:

- Product copy risks collapsing "Operational ontology" into the separate agent-operation `operational-ontology` branch, or into B3 run-context.
- Private DomainSpec, telemetry, sessions, and implementation evidence must not leak into public CyberAlchemy/Ontologize claims without scrub and owner review.
- Client account research must not become client-facing collateral by rename/copy.
- Cross-client or cross-product reuse is the sharpest commercial risk.
- Public offering language should keep "founding pilot / working name / scoped proof" posture.

Gaps for definitions-governance or inventory:

- Define or import the generic authority movement vocabulary.
- Add product/application definitions for `approved_allowed_uses`, `proposed_allowed_uses`, and `record_kind`.
- Inventory needs a relation-name registry.
- The branch materialization register should map to `authority_relation_record` fields.
- Hellbender's coined account edges should stay `PROPOSED-UNFILED` until reused in another client/account pattern and promoted through owner review.

### Final Robot-Talks Position

Simon accepts:

- ontology should not be absorbed by authority movement protocol;
- Shannon's ladder as the cleanest stable backbone;
- `authority_relation_record` as governance metadata for now.

Simon rejects or constrains:

- B4 bridge edges as equivalent to promotion;
- source digests as source authority;
- product claims without owner reuse scope, boundary review, and promotion verdict.

Recommended relation map fragment:

```text
SourceFile / SourceSelector
  -> InventoryEvidence / EvidenceCard
      role: evidence carrier, source locator, confidence support
      not authority promotion

  -> OntologyCandidate
      role: branch-typed governed meaning
      branches: B1 meaning, B2 system, B3 run-context, B4 bridge
      may request promotion
      may expose drift / contradiction / trace / evidence-gap witnesses

  -> AuthorityRelationRecord
      role: governance metadata beside candidate
      fields: source_context, target_context, artifact_kind,
              movement_kind, relation_mode, use_mode,
              semantic_delta, structural_delta, enforcement_delta,
              boundary_review_ref, decision_owner, drift_trigger
      status: candidate metadata, not vault edge

  -> PromotionRecord / OwnerDecision
      role: owner-gated verdict
      verdicts: promoted, rejected, deferred, local_only, blocked
      must name reuse scope and boundary conditions

  -> GovernedProjection / KnowledgeProjection / ReadModel
      role: authorized target artifact
      carries origin back-reference, allowed uses, drift owner
```

Ontologize product nodes fit this as an application profile:

```text
OutcomeEvent / MetricObservation
  -> PromotionCandidate
  -> OwnerDecision
  -> KnowledgeProjection
```

Residue:

- Preserve the distinction between movement evidence and movement authority.
- Preserve `authority_relation_record` as a complement to `PromotionRecord`.
- Preserve B4 as bridge/witness space, not promotion space.
- Preserve source-file primacy over digests.
- Preserve product/client boundary requirements: data class, owner reuse scope, public/private scrub, and drift owner before any reusable or public-facing claim.

## Agent 4 - Ashby, W. Ross

Role: explorer
Lens: Vault ontology grammar and lifecycle control

### Initial Receipt

Artifacts inspected:

- `implementation/domainspec/vault/ontology-conventions.md`
- `implementation/domainspec/vault/confidence-levels.md`
- `implementation/domainspec/vault/constitution/edge-constitution.md`
- `implementation/domainspec/vault/constitution/schema-amendment-discipline-constitution.md`
- `arcanum/BUSINESS-ONTOLOGY.md`
- `arcanum/definitions/RELATIONSHIPS.md`
- `arcanum/definitions/DEFINITIONS.md`
- `cyberAlchemy-v2/development/reviews/2026-06-21-authority-elevation-protocol-review/findings.md`
- `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md`
- `cyberAlchemy-v2/authority/promotion-policy.md`
- `cyberAlchemy-v2/authority/definitions/DEFINITION-TOWERS.md`
- `cyberAlchemy-v2/authority/definitions/source-clusters/arcanum.md`

Relation candidates:

- `authority_relation_record` should remain governance metadata, not a vault edge yet. If it becomes a vault edge/relation family, it must enter the catalog through schema governance.
- Candidate movement modes already named by the review: `adopts_without_delta`, `adapts_with_delta`, `specializes_for_context`, `inherits_under_source_authority`, `elevates_to_higher_context`, `rejects_for_context`, `defers_pending_evidence`.
- Vault analogs: `derives-from`, `validates`, `codified-as`, `governed-by`, `operationalized-by`, `supersedes`, `contradicts`. These can witness authority movement, but none equals promotion by itself.
- Business/system/bridge ontology maps cleanly: business intent is source meaning; system ontology is realization evidence; bridge records traceability, tests, observability, constraints, and drift.
- Confidence maps conceptually but not lexically: vault `veracidade` / `conviccao` correspond to evidence and commitment, while the protocol proposes richer enumerations. Keep vocabularies distinct unless definitions-governance normalizes them.

Lifecycle/block conditions:

- Ontology and inventory may represent, condense, route, or request promotion; they do not promote authority.
- Promotion blocks on unknown source authority, unresolved conflict, missing owner route, missing boundary review, or attempted mutation before gate passage.
- Vault promotion blocks on open `contradicts`, insufficient review/evidence, asymmetric required vault edges, category-invalid edges, or cycles in justification/governance edges.
- Schema mutation blocks unless amendment discipline is satisfied.
- A new authority relation schema/registry blocks until relation schema, registry, boundary checklist, decision-gate contract, and artifact-kind lifecycle matrix exist.

Conflicts:

- Edge-count inconsistency: `ontology-conventions.md` and `edge-constitution.md` disagree in stated counts; the edge constitution says Appendix C rows win over stated integers.
- `contracts` is overloaded: DomainSpec relationship verb differs from Arcanum `contract` authority agreement.
- `edge-constitution.md` is still exploratory; grammar, constructibility, and full asymmetry validators are planned/partial, so it cannot yet carry full enforcement claims.
- Authority movement terms are design-scope only.

Required governance route:

1. `definitions-governance` for vocabulary/design only.
2. `constitution-governance` for artifact-kind lifecycle matrix.
3. `decision-gate` for owner conflict, public/private boundary, naming, scope, and promotion disputes.
4. Only after those pass, `task-session` may implement relation schemas, promotion schemas, source-cluster rows, or vault catalog amendments.

### Final Robot-Talks Position

Ashby accepts:

- ontology is governed meaning, not an authority engine;
- source files retain authority over source digests;
- Shannon's ladder is the stable control path;
- `authority_relation_record` complements `PromotionRecord`;
- Simon's product spine is a useful witness pattern;
- B4 bridge is the right conceptual place for relation links across intent, evidence, decision, and projection.

Ashby rejects or constrains:

- making `authority_relation_record` a vault edge now;
- source digests as source substitutes;
- Ontologize/product terms as canonical authority-movement vocabulary before owner reuse scope, boundary review, and definitions-governance;
- treating vault analog edges as promotion or gate verdicts.

Recommended relation map fragment:

```text
SourceArtifact
  -> SourceDigest / SourceSelector
  -> InventoryEvidence / EvidenceCard
  -> OntologyCandidate
      fields: branch, meaning, confidence, source_refs, candidate_edges
  -> AuthorityRelationRecord
      fields: source_context, target_context, artifact_kind,
              relation_mode, movement_kind, use_mode,
              semantic_delta, structural_delta, enforcement_delta,
              evidence_confidence, commitment_confidence,
              conflict_status, boundary_review_ref,
              decision_owner, drift_owner
  -> PromotionRecord
      fields: owner_gate, gate_verdict, block_conditions,
              validation_surface, approval_ref
  -> OwnerDecision
      verdict: promoted | rejected | deferred | local_only
  -> LocalAuthority or GovernedProjection / KnowledgeProjection
```

B4 bridge should host cross-branch links such as:

- business outcome is evidenced by `OutcomeEvent` / `MetricObservation`;
- ontology candidate is supported by inventory evidence;
- promotion candidate is decided by owner gate;
- projection is read-model output, not authority.

Residue:

- Preserve the distinction between movement description and promotion decision.
- Preserve "ontology requests, promotion decides."
- Preserve source authority even when digests and candidates are better for navigation.
- Preserve product/application witnesses as examples, not owners.
- Preserve the blocked state for schema/catalog changes until relation schema, relation registry, lifecycle matrix, decision-gate contract, and schema-amendment route exist.
