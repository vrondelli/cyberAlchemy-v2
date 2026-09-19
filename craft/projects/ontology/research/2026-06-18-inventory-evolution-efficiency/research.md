# Inventory Evolution Efficiency Research

Dispatch: `2026-06-18-inventory-evolution-efficiency`

## Evidence Boundary

This research file collects the returns from the confirmed DomainSpec research dispatch.
It preserves the evidence boundary for the synthesis in `findings.md`.

The run did not prove that an incremental compiler, cache invalidator, graph export, or
branch projection runtime already exists. It evaluates the substrate architecture from
repo evidence and witness fixtures.

## Explorer Returns

### Shannon, Claude: Computational Indexing

Shannon recommends against making a large graph the primary runtime substrate now. For
the current query/update shapes, evidence cards plus compiled indexes, typed sets, and
adjacency projections are enough, and fit the authority model better than a fully
materialized graph.

Evidence cited by Shannon:

- `projects/ontology/ARCHITECTURE.md` defines the ladder as `source selector ->
  InventoryEvidence -> OntologyCandidate -> PromotionRecord -> governed projection /
  retrieval view`, keeps generated read models non-canonical, and treats CSV as an
  optional evidence index.
- `.arcanum/inventory/{README,schema,index}.md` frames inventory pages as compiled read
  models rather than source truth.
- `cyberAlchemy/agentic-system-ontology-entry-model.md` frames ontology as a semantic
  superset rather than a storage dump.
- `projects/ontologize/DAG-AND-METRICS.md` says inverses should be computed rather than
  hand-authored.
- Body War indexing templates sketch selector indexes, link indexes, retrieval results,
  and object indexes as compiled artifacts rather than one graph substrate.

Shannon's efficient query classes:

- selector/source -> evidence card lookup;
- evidence card -> candidate/promotion lookup;
- branch/status/owner/gate filters;
- contradiction/gap/residue retrieval;
- bounded neighborhood traversal for projections and context packs.

Suggested compiled structures:

- `id -> record`;
- `selector -> evidence_card_ids`;
- `evidence_card_id -> candidate_ids`;
- `candidate_id -> promotion_record_id`;
- `branch/status/reviewOwner/gateResult -> typed id sets`;
- `edge_type/from_id -> to_ids`;
- reverse adjacency per edge type;
- contradiction/open-question/residue typed sets;
- retrieval views for common questions.

Complexity claim: index lookup is roughly O(1)/O(log n) to locate a bucket plus O(k) for
returned items. Update cost is local to the changed card/candidate/promotion, affected
typed sets, adjacency rows, and cached retrieval views mentioning those ids.

Failure modes named by Shannon:

- heavy ad hoc multi-hop queries across many edge types;
- graph analytics such as centrality, clustering, motif search, or large transitive
  closure;
- weak bridge chains through contradictions at interactive latency;
- highly dynamic user-defined branch/view projection;
- drift if reverse indexes or projections are not deterministically rebuilt.

### Turing, Alan: Ontology Graph Modeling

Turing also rejects one large primary graph as the immediate substrate, but stresses that
the governed ontology layer eventually needs explicit typed graph projections once
relations become load-bearing.

Inventory can stay lightweight for:

- source summaries;
- tags;
- contradictions;
- provenance;
- index/log feeds;
- selector-level evidence;
- bounded retrieval.

Ontology cannot remain only cards and sets once correctness depends on:

- typed nodes;
- governed edges;
- branch assignment;
- promotion state;
- contradiction paths;
- linked DAGs;
- dependency closure.

Turing's breakpoint is trustworthy change propagation rather than raw query speed.
Cards and sets hold for source lookup, bounded retrieval, glossary support, membership
filters, and precomputed slice views. A graph projection becomes necessary when routine
questions require:

- which promoted knowledge is invalidated if an evidence item or decision changes;
- which B1 meaning nodes are realized by B2/B3 evidence through B4 bridge edges;
- which candidates are blocked by unresolved `contradicts` edges;
- what downstream projections depend on a superseded node;
- what minimal dependency closure is needed for a branch, view, or task.

Turing's runtime recommendation:

- raw evidence and inventory pages remain the write-friendly substrate;
- typed node/edge records with provenance and promotion state govern ontology material;
- graph projections are compiled only for ontology-governed objects such as
  InventoryEvidence, OntologyCandidate, PromotionRecord, promoted entries, decisions,
  and bridge edges;
- materialization is incremental by branch or task view.

Turing's graph-first threshold:

- transitive invalidation/supersession becomes routine;
- contradiction blocking across candidates and promoted entries becomes routine;
- branch bridge coverage checks become routine;
- promotion/retirement impact analysis becomes routine;
- context-builder needs minimal dependency closure instead of curated retrieval sets.

Evidence cited by Turing:

- `arcanum/extraction-research/inventory.md`;
- `cyberAlchemy/agentic-system-inventory-ontology-pipeline.md`;
- `projects/ontologize/definitions/DEFINITIONS.md`;
- `projects/ontologize/DAG-AND-METRICS.md`;
- `projects/ontologize/schemas/ontology-node.schema.json`;
- `projects/ontologize/ONTOLOGY-BRANCHES.md`;
- the branch-as-view refinement `RESULT.md`;
- `arcanum/development/cyberalchemy-ontology-lifecycle/ONTOLOGY-ARCHITECTURE.md` as
  candidate design material, not runtime-verified implementation.

### Simon, Herbert: Operational Governance

Simon gives the pragmatic recommendation: do not make a large graph the primary
materialized substrate yet. Evidence cards plus compiled set/index structures are enough
as the operational base, with graphs generated as bounded, derived, or on-demand
projections for validation, drift review, and bridge analysis.

Simon's strongest argument is governance cost. The ontology still carries unresolved
owner decisions:

- branch-as-view;
- legal B3 producer;
- residue placement;
- artifact class rule;
- authority tie-break.

Fully materializing a graph now could freeze unsettled semantics into topology. Cards and
indexes let review happen claim by claim, with blocked promotion states visible.

On invalidation and drift, Simon says the repo already separates:

- raw evidence and selectors;
- candidate/promoted meaning;
- contradiction and drift handling;
- derived projections.

That means invalidation can be modeled as:

1. Mark evidence/card residue or contradiction.
2. Block or retire a PromotionRecord.
3. Regenerate affected indexes/views.

This is cheaper to review than mutating a persistent graph and proving all downstream
edge consequences.

Simon says graph structure remains valuable for:

- edge validation;
- contradiction blocking;
- promotion gating;
- event/update semantics.

But those graph uses should be generated per question, branch, candidate set, or
validation run.

Evidence cited by Simon:

- `projects/ontology/ARCHITECTURE.md`;
- `.arcanum/inventory/schema.md`;
- `arcanum/arcana/ontology-vault/README.md`;
- `projects/ontology/research/2026-06-18-materialization-model/findings.md`;
- Body War inventory architecture;
- `projects/ontologize/DAG-AND-METRICS.md`.

## Reviewer Returns

### Russell, Bertrand: Precedent

Verdict: REVISE, not kill.

Russell says the synthesis is directionally right, but it overstated precedent as if the
hybrid were already an operational runtime. The correct label is `build-from-owned`, not
`already-deployed`.

Required changes:

- Direct answer must say the structures are enough to justify the next build-from-owned
  operational base, while current repo evidence is report/design/fixture-level.
- Primary graph substrate should be "not selected now" rather than treated as if graph law
  has no owned precedent.
- Evidence-card plus typed sets/indexes should be GO for inventory retrieval/read-model
  efficiency, and KILL only when asked to carry governed ontology relations by itself.
- Hybrid card authority plus derived graph projections should be GO as build-from-owned
  architecture / next implementation target, not already deployed.
- Witness IDs are not live deployed artifacts in `projects/ontology`; call them a witness
  fixture pattern, not runtime witness.
- Proposed index names such as `selector_to_evidence`, `evidence_to_candidates`, and
  `candidate_to_promotion` must be demoted unless implemented.
- Invalidation/compiler behavior must be phrased as required runtime behavior or fixture
  acceptance criterion.

Russell's ownership label:

> Owned by Arcanum inventory + ontology-vault + ontology-harness, CyberAlchemy promotion
> governance, and Ontologize branch discipline; currently design/report-level in
> `projects/ontology`; not yet deployed as incremental compiler/cache/branch projection
> runtime.

### Quine, Willard Van Orman: Non-Vacuity

Verdict: REVISE, not kill.

Quine says the hybrid claim has a concrete operational witness, but the witness needs to
be instantiated one notch further.

Required changes:

- Add `ontology_node ON-0001` with branch, status, source, and meaning.
- Add `decision_record DR-0001`, because decisions are named as authority.
- Materialize compiled set contents instead of only naming index classes.
- Make invalidation transition explicit:
  - before: `PR-0001.gate_result = pass`, `ON-0001` visible in active projection;
  - update: `IE-0001.residue += source_changed`;
  - after: `PR-0001.gate_result = blocked_source_changed`,
    `gate_result_sets.pass = []`,
    `gate_result_sets.blocked_source_changed = [PR-0001]`.
- Tie evidence labels to report claims or remove them from the witness.

### Wittgenstein, Ludwig: Definitional Soundness

Verdict: REVISE, not kill.

Wittgenstein says the synthesis is directionally sound, but it relies on vocabulary
pressure. The final report needs definitions before the verdict matrix.

Required changes:

- Separate typed set from index.
- Define evidence card narrowly.
- Define authority record as rebuild source, not semantic truth.
- Define generated read model.
- Separate derived edge projection from graph projection.
- Define ontology node.
- Replace rhetorical "gigantic primary graph" with "primary graph substrate".
- Replace "graph becomes necessary once relations become load-bearing ontology facts" with
  "graph projection becomes necessary when correctness depends on traversing typed
  relations across more than one hop."
- Clarify the ladder as:
  `source selector -> evidence card -> ontology candidate -> PromotionRecord -> ontology node -> generated read models`.
- Revise matrix labels:
  - primary graph substrate = KILL as authority/runtime base now;
  - cards plus typed sets/indexes only = KILL once multi-hop semantic correctness becomes
    routine;
  - authority records plus generated read models, including bounded graph projections when
    needed = GO.

## Collected Research Answer

The collected returns converge on a hybrid answer:

- Evidence cards plus typed sets and indexes are enough for efficient inventory retrieval,
  local updates, and generated read models.
- They are not enough by themselves for governed ontology evolution once correctness
  depends on multi-hop typed relation traversal, invalidation closure, contradiction
  blocking, branch comparison, or promotion impact analysis.
- A primary graph substrate is not selected now as the authoritative persistence model.
- The next target is a build-from-owned architecture: authority records plus generated
  read models, including bounded graph projections when relation traversal is required.
