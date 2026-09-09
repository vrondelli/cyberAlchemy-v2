# Context Basis paper integration — candidate synthesis

## Claim and authority boundary

This synthesis joins the three explorer returns in `research.md`. Paper descriptions and reported evidence remain distinct from local-source facts, local analogies, and local design candidates. It promotes no definition, admits no ontology, adopts no Product Capability, authorizes no DomainSpec design or implementation, and grants no effect.

Local source bindings:

- `CONTEXT-BASIS-DEFINITION-PACK.v1-candidate.json`: `concepts`, `workflow`, `ontology_dependency_lock_candidate`, `relationships`, `open_questions_and_conflicts`, `blocked_actions`, `claim_ceiling`.
- `ontology/business-ontology.json`: selected request-context, context-envelope, context-formation, request-routing, context-refresh, context-before-judgment, drift-invalidates, and advice-not-permission selectors.
- `codex-integration/CODEX-REQUEST-GOVERNANCE-DEFINITION-PACK.v1-candidate.json`: request context, preflight decision, route directive, decision gate, and open questions.
- `codex-integration/business-ontology.json`: selected request-context, preflight-decision, route-directive, preflight, and unknown-fails-closed selectors.
- Yu et al., arXiv:2603.10062v2, §§3–6.
- Dadhich, arXiv:2607.21503v1, §§2–6 and Appendices A–D.

## Thesis

The local invariant remains:

```text
preserved request
  → exactly one route or visible gate
  → request-relative definition closure
  → exact ontology selector and required-edge lock
  → complete/current Necessary Context Basis
  → immutable consumer-specific Context Window View
  → selected-route-owned non-authorizing strategy
```

Selected-dependency drift creates a successor view; unrelated drift is diagnostic. Context, routing, strategy, validation, consensus, and receipts grant no authority.

The papers strengthen the architecture around this invariant:

- arXiv:2603.10062v2 contributes hierarchy, hybrid local/shared organization, access and cache-transfer questions, visibility ordering, and read-time conflicts. It is a position paper and supplies no evaluated consistency protocol.
- arXiv:2607.21503v1 contributes the lifecycle of architecting, ingesting, scoping, anticipating, and compacting/consolidating. Its reported benchmarks concern conversational recall, not exact selector closure, compaction fidelity, isolation, latency, context rot, or authority safety.

The joined candidate is a **selector-bound context lifecycle**. Owner-controlled sources feed an immutable request-relative basis. Views are derived through explicit manifests. Caches, anticipated material, and shared projections may accelerate construction but remain quarantined until rebound to the current request, route, definition closure, selector lock, consumer, purpose, and access scope.

## Adopt, adapt, test, reject

| ARE concept | Adopt/adapt | Required test | Reject |
|---|---|---|---|
| `ObviousRoute` | Preserve exact-one-route semantics; use hierarchy and anticipation only to precompute candidate inputs. | Cold versus prefetched preflight must return identical direct/gate/block output for the same request and registry digests. | Popularity, cache locality, similarity, prediction confidence, or agent majority as route authority. |
| `RequestRelativeDefinitionClosure` | Adopt retrieval-versus-sufficiency and ingestion-quality distinctions; express closure as a least fixed point of exact definition identities, selectors, digests, postures, and allowed relation traversal. | Missing bridge definitions, conflicts, and high-similarity distractors must yield collect-all missing/conflict results. | Retrieval or graph traversal success as proof of closure. |
| `OntologySelectorLock` | Preserve exact ontology IDs, nodes, required edges, reasons, exclusions, source digests, and lock digest; adapt access, visibility, conflict, and provenance vocabulary. | Mutate selected and unrelated nodes independently; only intersecting selected drift may invalidate reuse. | Best-effort entity resolution, global latest-ontology coherence, graph-neighborhood completeness, or diagnostic runtime output as admission. |
| `NecessaryContextBasis` | Bind lifecycle stages to request, route, closure, lock, authority/effect posture, constraints, gaps, and digest. | Every declared proof obligation is covered or returned as a typed missing dependency. | Persistent storage, benchmark recall, or a retrieved set as evidence of sufficiency, truth, admission, or authority. |
| `ContextWindowView` | Use bounded assembly but require immutable identity, basis/lock binding, protected exact fields, omissions, residue, lineage, and freshness. | Compare full append, free-form summary, typed compaction, cold regeneration, and validated reuse. | Cache presence, similarity, timestamp, or a generic compaction score as sufficient reuse evidence. |
| `RouteOwnedStrategy` | Preserve route ownership after a complete/current basis; allow route-specific owner-adopted projection policy. | Compare local regeneration and shared projection reuse under identical bindings and explicit conflicts. | Autonomous architecture activation, cache coherence, consensus, or plausible continuation as ownership or authority. |

## Layer model

1. **Source acquisition/I/O** records attributable observations. Observation is not durability, acceptance, or authority.
2. **Owner-controlled source memory** holds durable original records with current, superseded, conflicting, or retired posture.
3. **Selected dependency set** contains the exact request-relative definition closure and ontology selector lock.
4. **Necessary Context Basis** freezes request, route, dependencies, constraints, gaps, authority/effect posture, and digest.
5. **Context Window View** is an immutable consumer/purpose/window/source-epoch projection.
6. **Agent-local cache** is disposable performance state and cannot change semantic posture.
7. **Shared reusable projection** is an immutable transformed artifact; publication grants visibility only.
8. **RouteOwnedStrategy** is a non-authorizing route-specific candidate derived from one current view.

## Protocol contract candidates

- **Access:** `owner_route_id`, readers, proposers, canonical writer, access mode, granularity, confidentiality scope, public/private boundary.
- **Identity:** request, route-decision, closure, lock, basis, view, source epoch, consumer, purpose, window, transform, artifact, parent, and producer-sequence identities/digests.
- **Visibility:** local creation, proposal, publication, acceptance, and supersession are distinct events. Publication never implies acceptance.
- **Invalidation:** only selected dependency drift, changed consumer/purpose/access, material conflict, or expired external-state binding invalidates a view. Ambient drift is diagnostic.
- **Conflict:** preserve stale dependency, concurrent write, semantic disagreement, scope violation, environment drift, and authority-posture conflict. Material conflicts make dependent strategy `not_evaluable` unless an owner-declared deterministic rule applies.
- **Speculation:** anticipated artifacts remain `warm-unbound` until explicit rebinding; they cannot select or widen a route.
- **Compaction:** protected definitions, selectors, negative constraints, exclusions, conflicts, gaps, and authority/effect posture remain exact or the result is `not_safely_compactable`.

## View reuse candidate

An immutable view may be reused only if request and route-decision digests are unchanged; closure and lock digests match; all selected dependencies are current; consumer, purpose, and access are compatible; transformation and protected-field validation exist; no material conflict remains; external freshness holds; and exclusions, residue, authority, and effect posture are unchanged. A new per-turn receipt records reuse even when view identity is retained. Unknown or failed predicates require cold regeneration, a successor view, or `not_evaluable`.

## Experiments and metrics

The smallest Codex experiment uses one synthetic request that uniquely selects Research and includes one exact definition, one selector lock, one negative constraint, and `authority_effect=none`. Run cold construction, unchanged warm reuse, unrelated drift, selected-definition drift, and a high-similarity false “accepted/authorized” distractor.

It fails if warm and cold route directives differ; unrelated drift invalidates; selected drift does not invalidate; any protected field changes; the distractor inflates authority; or an unknown produces direct continuation instead of gate/block.

Measure p50/p95/p99 preflight, closure, lock, view, validation, and total latency; cold/warm/speculative paths; all token classes; exact protected-field fidelity; dependency recall/precision and bridge closure; irrelevant-context ratio; stale detection and false invalidation; deterministic outcomes; isolation violations; conflict preservation; superseded-record leakage; and authority inflation. Initial safety thresholds are 100% protected-field fidelity, 100% declared closure, 100% selected-drift detection, zero authority inflation, zero conflict deletion, zero scope violations, and identical warm/cold decisions.

Two fuller fixtures remain required:

- a 120-turn repeated-compaction fixture comparing full append, free-form summary, typed compaction, and view reuse;
- a multi-agent fixture where two views share `D@v1`, the owner publishes `D@v2`, one agent emits a stale result, and incompatible explanations remain competing candidates rather than last-writer-wins.

## Killed ideas

- global shared mutable prompt or memory;
- vector store as source of truth;
- cache hit equals reusable view;
- global ontology epoch invalidates every view;
- last-writer-wins semantic merge;
- autonomous per-agent architecture activation;
- generic compaction score proves protected-field fidelity;
- anticipation chooses route or widens scope;
- receipt proves truth, admission, or authority.

## Owner decisions

1. ARE plus definitions-governance owners must resolve `ARE-CONTEXT-OPEN-001`: relation kinds and termination rules for definition closure.
2. ARE plus ontology owners must resolve `ARE-CONTEXT-OPEN-002`: minimum required-edge closure, exclusions, and missing/ambiguous outcomes.
3. Codex integration plus Context owners must resolve `ARE-CONTEXT-OPEN-003`: unchanged-view reuse with per-turn receipts versus per-turn successor views.
4. Codex integration owner must select the native preflight boundary.
5. CyberAlchemy product owner must decide whether initial ambiguity and consequential continuation share one human interaction surface.
6. ARE product owner must accept, revise, or reject the projection types, cache-admission predicate, protocol fields, protected-field set, benchmark thresholds, and experiment before a Product Capability proposal.

This remains candidate research integration only.
