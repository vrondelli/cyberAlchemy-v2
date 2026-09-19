# Interrogation Refine Review — Factory/Consumer/Implementer Dialectic

Mode: `refine-review`  
Verdict: `flag` — definition is coherent enough for the toy experiment, with four named design repairs.

## Interview Basis

The operator already confirmed the Refine seed and dispatch. This review therefore asks no new preference question; it challenges the accepted definition one issue at a time against the strict context. The three voices below are labeled local perspectives, not dispatched subagents.

## Question 1 — Who owns concrete domain meaning after mint?

**DomainSpec factory owner:** DomainSpec owns admitted forms, relationship signatures, compilation rules, validation, and safe defaults. If it ships `Player`, `UnlockDoor`, or financial-settlement semantics as canonical project truth, it has retained consumer authority and failed the mint handoff.

**Minted consumer-project owner:** The project must own the project manifest, feature manifest, node bodies, and authored connections. It can choose different domain content without editing DomainSpec.

**Implementer-agent traversal owner:** The graph must disclose that ownership through project-local source pointers. A pointer into `projects/domainspec-v2/impl/.../__fixtures__` is a failed handoff even if the graph is valid.

**Finding:** pass. The definition states the split.  
**Repair R1:** the toy validator must reject absolute paths, `..` escapes, and any canonical source root outside the disposable consumer-project root.

## Question 2 — What does the implementer traverse?

**Factory owner:** The compiler can normalize layout variance, but must not invent missing semantic fields.

**Consumer owner:** Authors edit machine node/edge sources. Generated outputs may be deleted and reproduced.

**Implementer owner:** Traverse `graph.json`, select a node by `node_id`, then open the machine `source_path`. Markdown is useful for learning, but it cannot be the only place that explains kind, target, or edge identity.

**Finding:** pass. Machine and human routes are distinct.  
**Repair R2:** run a mutant where a required machine field is absent but appears in Markdown; compilation must fail before traversal.

## Question 3 — Does embedding a connection erase edge identity?

**Factory owner:** No. Storage nesting and graph semantics are different dimensions. The compiler can promote a source-owned connection record into a first-class normalized edge.

**Consumer owner:** One outgoing declaration near its source node improves local authoring, provided direction is canonical and edge IDs are stable.

**Implementer owner:** The normalized edge needs `edge_id`, `type`, `from`, `to`, and `source_path`; it must not be reconstructed from prose or inferred twice from inverse navigation.

**Finding:** flag. The definition states edge identity but does not yet prove duplicate ownership detection or candidate equivalence.  
**Repair R3:** the tournament must compile all layouts to the same edge objects and reject duplicate `edge_id` regardless of source layout.

## Question 4 — How does the project select DomainSpec language authority?

**Factory owner:** Kind and relationship signatures need a version/digest binding so a rebuild can explain which language it used.

**Consumer owner:** The project manifest may reference a DomainSpec installation or package identity, but canonical feature roots remain project-relative.

**Implementer owner:** A generated build receipt should record the effective kind/relationship digests. It should not copy the entire root registry into consumer semantic authority.

**Finding:** flag. The run can pin the two current registry digests, but packaging/distribution is not designed.  
**Repair R4:** the toy manifest records language digests as inputs and the graph records them as provenance; the future package-resolution mechanism remains deferred.

## Question 5 — Is a single feature enough?

**Factory owner:** It is enough to falsify local file-layout and projection claims, not enough to prove cross-feature resolution or production scalability.

**Consumer owner:** Four nodes across structural, behavioral, and connective kinds create meaningful local variation without turning the experiment into a product.

**Implementer owner:** Three typed edges exercise forward traversal, rule gating, and event production. A second feature would test a different question.

**Finding:** pass with scope limit. The L0 witness is proportionate if the final result names its expiry condition.

## Convergence Check

| Criterion | Result | Evidence/repair |
| --- | --- | --- |
| DomainSpec owns form without consumer meaning | pass | definition boundary plus R1 path-escape mutant |
| Consumer owns canonical node sources | pass | project-local manifests and source pointers |
| Implementer traverses without Markdown | pass after R2 | missing-machine-field mutant required |
| Edge identity survives layout | flag until S06 | R3 identical normalized graph and duplicate test |
| Language binding is reproducible | flag until S06 | R4 registry digest binding |

## Residue Ledger

- R1 path containment — acceptance-critical for S06, locally testable.
- R2 Markdown independence — acceptance-critical for S06, locally testable.
- R3 stable first-class edge identity — acceptance-critical for S06, locally testable.
- R4 language package resolution — digest binding testable now; package distribution deferred.
- Cross-feature source resolution — outside this experiment; triggers a later rerun.
- Production source-home disposition — FPR-01 owner gate; explicitly untouched.

## Verdict

`flag`, continue. No question requires external evidence or a human design choice before the identical-layout experiment. S06 must implement R1–R4; failure of R1–R3 blocks selection, while R4 may pass at digest-binding level with packaging deferred.

