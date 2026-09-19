# Inventory Evolution Substrate Findings

Dispatch: `2026-06-18-inventory-evolution-efficiency`

## Direct Answer

Evidence cards plus typed sets and indexes are enough to justify the next
build-from-owned operational base for inventory evolution. Current repo evidence is
report/design/fixture-level, not a live incremental runtime [Russell].

Do not select a primary graph substrate as the current authority/runtime base [Shannon]
[Simon]. Select authority records plus generated read models, including bounded graph
projections when ontology correctness depends on traversing typed relations across more
than one hop [Turing][Wittgenstein].

In plain terms: the inventory can stay card/index based; the ontology layer should gain
derived graph projections for bounded reasoning, not a single graph-native source of
truth [Shannon][Turing][Simon].

## Definitions

**Primary graph substrate:** the graph itself is the authoritative persistence model for
inventory and ontology state [Wittgenstein].

**Evidence card:** an authority record binding a source selector to observed evidence,
provenance, status, and residue. It is not an ontology node, not an edge, and not itself
the domain claim except "this source yielded this evidence" [Wittgenstein].

**Authority record:** a durable governed record from which generated read models can be
rebuilt. Evidence cards, ontology candidates, PromotionRecords, ontology nodes, and
decision records can be authority records. Authority means "rebuild source," not
"semantically true" [Wittgenstein].

**Typed set:** a finite collection of record ids sharing an explicit membership predicate,
such as `blocked_promotions` or `source_changed_evidence`. A set answers "is this in
scope?" [Wittgenstein].

**Index:** a generated lookup map from a key to record ids, such as
`selector_to_evidence`. An index answers "what records match this key?" [Wittgenstein].

**Derived edge projection:** generated typed relation tuples such as `supports`,
`promoted_by`, or `realizes`, with enough provenance and invalidation state to be rebuilt
from authority records [Turing][Wittgenstein].

**Graph projection:** a generated read model containing node identity plus derived edge
semantics sufficient for bounded traversal or ontology checks. Not every edge list is a
graph projection [Wittgenstein].

**Ontology node:** a governed semantic entity, relation, or claim active in a branch/view
after promotion. It is not the source card, candidate, PromotionRecord, index entry, or
graph projection that may represent it [Wittgenstein].

**Generated read model:** a non-authoritative compiled structure optimized for query,
traversal, validation, or display. It may include indexes, typed sets, and graph
projections, and must be disposable and regenerable from authority records [Shannon]
[Simon][Wittgenstein].

The clarified ladder is:

```text
source selector -> evidence card -> ontology candidate -> PromotionRecord -> ontology node -> generated read models
```

This preserves the distinction between semantic authority and compiled retrieval or
traversal surfaces [Wittgenstein].

## Precedent And Ownership

The result is build-from-owned, not novel and not already deployed [Russell].

Owned surfaces:

- Arcanum inventory for evidence-card and read-model discipline [Russell].
- Ontology Vault and ontology-harness for governed confidence, branch-aware traceability,
  and drift review [Russell][Simon].
- CyberAlchemy promotion governance for candidate-to-commitment flow [Russell][Turing].
- Ontologize branch discipline and DAG work for typed relation and projection needs
  [Turing][Simon].

Current status: design/report/fixture-level in `projects/ontology`; not yet deployed as
an incremental compiler, cache invalidator, or branch projection runtime [Russell].

## Verdict Matrix

| Candidate | Owner | Witnessed? | Sound? | Verdict | Use Mode |
| --- | --- | --- | --- | --- | --- |
| Primary graph substrate as current authority/runtime base | Owned graph/edge law exists in Ontologize and ontology design material, but not as this inventory runtime [Russell][Turing] | Not required by current query/update shape [Shannon][Simon] | Unsound as current authority because it freezes unsettled semantics into topology [Simon][Wittgenstein] | KILL | Typed graph law remains available as derived projection precedent, not primary store now |
| Evidence cards plus typed sets/indexes for inventory retrieval/read-model efficiency | Owned by Arcanum inventory and repo indexing patterns [Russell][Shannon] | Witnessed by local lookup/update fixture pattern [Quine] | Sound for lookup, filters, local updates, and bounded read models [Shannon][Simon] | GO | build-from-owned inventory substrate |
| Evidence cards plus typed sets/indexes as the complete ontology relation substrate | Owned only for inventory/read-model work, not complete ontology relation governance [Turing][Russell] | Witness does not carry multi-hop semantic correctness by itself [Quine][Turing] | Unsound once correctness depends on invalidation closure, contradiction blocking, branch comparison, or promotion impact analysis [Turing][Wittgenstein] | KILL | Typed negative: sets/indexes alone cannot carry governed ontology relations |
| Authority records plus generated read models, including bounded graph projections when needed | Owned by Arcanum inventory, ontology-vault, ontology-harness, CyberAlchemy promotion governance, and Ontologize branch/DAG discipline [Russell] | Witnessed as fixture acceptance pattern below [Quine] | Sound because authority, lookup, membership, and traversal are separated [Shannon][Turing][Simon][Wittgenstein] | GO | build-from-owned architecture / next implementation target |

## Core Synthesis

The current efficient-query surface is mostly lookup, filtering, bounded neighborhood
traversal, contradiction/gap/residue retrieval, and branch/status/owner/gate slicing
[Shannon]. These shapes can be served by authority records plus generated read models:
`id -> record`, selector indexes, typed sets, forward adjacency, reverse adjacency, and
retrieval views [Shannon][Simon].

The hard problem is governed state transition, not arbitrary graph traversal [Shannon]
[Simon]. PromotionRecords carry governance state; evidence confidence and commitment
confidence are distinct; contradictions and blocked gates must stay explicit rather than
hidden inside connectivity [Shannon][Simon].

Graph projection becomes necessary when correctness depends on traversing typed
relations across more than one hop, especially for invalidation closure, contradiction
blocking, branch comparison, or promotion impact analysis [Turing][Wittgenstein].

Therefore the runtime answer is not "no graph." It is "no primary graph substrate now."
Use authority records as rebuild source and compile bounded graph projections only for
the parts of ontology governance that need typed traversal [Shannon][Turing][Simon].

## Smallest Witness Fixture Pattern

This witness is a fixture acceptance pattern, not a claim that these exact ids are
already deployed in `projects/ontology` [Russell].

### Authority Records

```yaml
evidence_card:
  id: IE-0001
  source_selector: projects/ontology/ARCHITECTURE.md#ladder
  observed_evidence: Inventory evolves from source selector through evidence, candidate, and promotion.
  provenance:
    source_path: projects/ontology/ARCHITECTURE.md
    source_kind: report
  authority_level: evidence
  branch: ontology/main
  status: active
  tags: [materialization, inventory-evolution]
  residue: []

ontology_candidate:
  id: OC-0001
  evidence_ids: [IE-0001]
  proposed_meaning: InventoryEvidence is canonical evidence authority before ontology promotion.
  status: candidate
  branch: ontology/main
  owner: ontology

decision_record:
  id: DR-0001
  subject_id: OC-0001
  decision: promote
  gate: non-vacuity
  result: pass
  emits: PR-0001

promotion_record:
  id: PR-0001
  candidate_id: OC-0001
  decision_id: DR-0001
  decision: promoted
  gate_result: pass
  promoted_node_id: ON-0001
  commitment_confidence: medium

ontology_node:
  id: ON-0001
  branch: ontology/main
  status: active
  source_promotion_id: PR-0001
  meaning: InventoryEvidence is canonical evidence authority before ontology promotion.
```

The fixture separates evidence, candidate meaning, decision, promotion, and ontology node,
which is the boundary Quine required and the terminology Wittgenstein required [Quine]
[Wittgenstein].

### Generated Read Models Before Invalidation

The following generated structures are proposed acceptance fixtures, not deployed
compiler output [Russell].

```yaml
indexes:
  selector_to_evidence:
    projects/ontology/ARCHITECTURE.md#ladder: [IE-0001]

  evidence_to_candidates:
    IE-0001: [OC-0001]

  candidate_to_promotion:
    OC-0001: PR-0001

typed_sets:
  branch_sets:
    ontology/main: [IE-0001, OC-0001, DR-0001, PR-0001, ON-0001]

  status_sets:
    active: [IE-0001, ON-0001]
    candidate: [OC-0001]
    promoted: [PR-0001]

  gate_result_sets:
    pass: [PR-0001]
    blocked_source_changed: []

  residue_sets:
    source_changed: []
```

```yaml
derived_edge_projection:
  supports:
    IE-0001: [OC-0001]

  decided_by:
    OC-0001: [DR-0001]

  emits:
    DR-0001: [PR-0001]

  realizes:
    PR-0001: [ON-0001]

reverse_edges:
  supported_by:
    OC-0001: [IE-0001]

  decision_for:
    DR-0001: [OC-0001]

  emitted_by:
    PR-0001: [DR-0001]

  realized_from:
    ON-0001: [PR-0001]
```

This is a generated read model because it can be rebuilt from authority records and does
not itself carry authority [Shannon][Simon][Wittgenstein].

## One Update

Update: the source section behind `IE-0001` changes or becomes disputed [Shannon][Simon].

```yaml
before:
  PR-0001.gate_result: pass
  ON-0001.visible_in_projection: projection:ontology/main/promoted-active

update:
  IE-0001.residue:
    - type: source_changed
      note: Recheck ladder language before relying on OC-0001.
```

This is an acceptance criterion for a future runtime: the changed evidence card must cause
the generated read models that depend on it to be rebuilt or invalidated [Russell][Quine].

## One Query

Query: Which promoted ontology nodes in `ontology/main` depend on changed source evidence?
[Turing][Simon]

```yaml
step_1: residue_sets.source_changed -> [IE-0001]
step_2: evidence_to_candidates.IE-0001 -> [OC-0001]
step_3: candidate_to_promotion.OC-0001 -> PR-0001
step_4: promotion_record.PR-0001.promoted_node_id -> ON-0001
step_5: branch_sets.ontology/main contains ON-0001 -> true
result: [ON-0001]
```

This remains efficient with typed indexes and derived adjacency because the traversal is
bounded and typed [Shannon][Turing].

## One Invalidation

Invalidation: block `PR-0001` until `IE-0001` is reviewed [Simon][Quine].

```yaml
after:
  promotion_record:
    id: PR-0001
    candidate_id: OC-0001
    decision_id: DR-0001
    decision: blocked
    gate_result: blocked_source_changed
    promoted_node_id: ON-0001

  gate_result_sets:
    pass: []
    blocked_source_changed: [PR-0001]

  status_sets:
    active: [IE-0001]
    blocked: [PR-0001]

  residue_sets:
    source_changed: [IE-0001]

  invalidated_generated_read_models:
    - retrieval:ontology/main/promoted
    - graph_projection:ontology/main/promoted-active
```

The point is not that this compiler exists today. The point is that the runtime acceptance
criterion is local and reproducible: mark evidence residue, block the promotion, update
typed sets, and invalidate generated read models [Russell][Quine][Simon].

## One Projection

Projection: branch-local active ontology graph projection for `ontology/main`, excluding
blocked promotions [Turing][Simon].

```yaml
graph_projection:
  id: graph_projection:ontology/main/promoted-active
  source_authority_records:
    - IE-0001
    - OC-0001
    - DR-0001
    - PR-0001
    - ON-0001
  include_nodes_where:
    branch: ontology/main
    gate_result: pass
  include_edges:
    - supports
    - decided_by
    - emits
    - realizes
  exclude:
    gate_result: [blocked_source_changed]
  nodes: []
  reason: PR-0001 is blocked, so ON-0001 is withheld from the active promoted view.
```

This projection is a generated read model, not authority. It demonstrates why the graph
belongs as a bounded projection over authority records rather than as the authority
substrate itself [Turing][Wittgenstein].

## Required Runtime Acceptance Criteria

The build-from-owned implementation should not claim operational completion until these
behaviors exist:

- Stable ids for evidence cards, ontology candidates, decision records, PromotionRecords,
  ontology nodes, and generated read models [Shannon][Quine].
- Incremental regeneration of indexes and typed sets from authority records [Shannon]
  [Russell].
- Deterministic invalidation of generated read models that depend on changed evidence,
  candidates, decisions, or promotions [Russell][Quine].
- Bounded graph projection generation for branch/view checks and promotion impact
  analysis [Turing][Simon].
- Drift checks proving generated read models can be rebuilt from authority records
  without hidden manual edits [Shannon][Simon][Wittgenstein].

## Graph-First Threshold

Revisit a primary graph substrate only when at least one of these becomes routine enough
that bounded generated read models are inadequate:

- ad hoc multi-hop queries across many edge types [Shannon];
- large transitive invalidation or supersession closure [Turing];
- contradiction blocking across many branches or views [Turing];
- branch bridge coverage checks with dynamic user-defined projections [Turing][Shannon];
- graph analytics such as centrality, clustering, motif search, or large closure
  analytics [Shannon].

Until then, a primary graph substrate adds governance and consistency cost without matching
the current authority model [Shannon][Simon].

## Final Recommendation

Adopt authority records plus generated read models as the next build-from-owned substrate
for inventory/ontology evolution [Russell].

Keep source files, evidence cards, ontology candidates, decision records, PromotionRecords,
and ontology nodes as authority records [Shannon][Simon][Wittgenstein]. Compile indexes,
typed sets, reverse adjacency, residue/contradiction indexes, and retrieval views for
efficient inventory evolution [Shannon][Simon]. Generate bounded graph projections only
when ontology governance needs typed multi-hop traversal, invalidation closure,
contradiction blocking, branch/view projection, or promotion impact analysis [Turing]
[Wittgenstein].
