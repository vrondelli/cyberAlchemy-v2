# Interrogation Result — Relation Model Refine Review

Mode: `refine-review`  
Status: PASS with explicit design tensions  
User questions asked: 0; the confirmed strategy and direct evidence close the review questions without another semantic choice.

## Question-by-question review

### 1. Is the blocker only a missing portal field?

No. The same physical-field-versus-resolved-value ambiguity appears in Portal, Path, UI View Models, inspector/index, and detached output. A portal-only field addition would close one validator error while leaving several owners undefined.

### 2. What is the demonstrated semantic owner?

`SourceGraph` owns and validates the complete `SourceRelationBinding`. `KnowledgeScene` currently carries revision-bound copies of those relation records. Portal, Path, navigation, geometry, UI, renderer, inspector/index, static output, and Body War are consumers or local projections.

### 3. Do relation IDs alone suffice?

Only inside an object that already binds the exact source graph or scene revision. The portable key is `(source_graph_digest, source_relation_id)`. Navigation and geometry additionally require their bound View Pack/scene digests.

### 4. Why did the analysts disagree between B and C?

They agree on the invariant and disagree on representation. The formal analyst calls for a revision-bound immutable `RelationFacet`; the downstream analyst observes that the complete immutable scene relation bindings can already serve that role and rejects a second record type without a proven consumer.

### 5. Can the disagreement be resolved without inventing a fourth model?

Yes. Candidate C can be implemented minimally: the facet is an immutable indexed role over the existing scene relation binding, not a second semantic record. Interactive downstream records remain reference-first. Detached outputs may carry validated snapshots. This retains C's revision/snapshot safety and B's low-duplication compatibility.

### 6. What must change before any implementation resumes?

- reconcile `oew.knowledge-scene.v1` design schema with implemented `v1.1`;
- define the scene relation index/resolver and typed missing/stale results;
- repair Portal and Path task/schema requirements together;
- define summary/view/static snapshot equality rules;
- preserve SWU-UOVA-001–003 receipts through an explicit compatibility witness.

### 7. Does current evidence prove the rest of the frontend?

No. The observed chain ends at scene partition. Portals are empty and the legend is empty in current `sceneQuery.ts`; Path, navigation, geometry, renderer, inspector/index, static serializer, and the planned UOVA Body War compiler remain planned.

### 8. Is external research needed?

No. The decision is about consistency among local owner contracts and current bytes. External graph or UI precedent cannot decide which local record owns semantics.

## Surviving tensions for Distill

1. Whether the facet is a named schema definition or only a typed scene index.
2. Whether encoding fields remain stored on SourceGraph or are re-derived from the future registry.
3. Whether detached static output snapshots the complete display relation or carries the whole scene.
4. How the v1-to-v1.1 schema mismatch becomes a versioned compatibility step without rewriting completed receipts.

## Verdict

Proceed to Distill with Candidate C as the leading architecture, constrained to reuse the existing scene relation binding as its semantic payload. Candidate A is rejected. Candidate B survives as the interactive reference behavior inside C, not as a standalone solution for detached output.
