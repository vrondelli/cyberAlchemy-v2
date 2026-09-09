# L0 — Corpus

## Primary proposal map

| PDF pages | Content | Evidence posture |
| --- | --- | --- |
| 1–3 | Category-of-thought table, three adjunctions, fast/slow unit and counit sketches | formal claims requiring audit |
| 3–9 | Orchestrator, JGS fast path, LLM slow path, WaveDB, DNG, complete learning cycle | architecture proposal |
| 10–11 | JGS backbone/instances; associativity and parameter-cost assertions | architecture plus unsupported formal/performance claims |
| 11–13 | WaveDB graph/vector records and queries | proposed storage/query contract |
| 13–14 | LLM deliberation, decomposition, synthesis, labeling, gateway | proposed interfaces |
| 14–17 | DNG instance encode/decode and category-to-model minting | high-risk hypothesis/interfaces |
| 17–19 | Curiosity value/cost/decision heads, strategies, RL update | proposed policy |
| 20–23 | Persistence, startup, shutdown, pruning and rollback | proposed lifecycle |
| 23–26 | Minting phases, triggers, source/derived relationship | proposed pipeline and boundary |
| 26–29 | Runtime routing and illustrative fast-path generation | worked architecture scenario, not a run |
| 29–32 | Four-phase roadmap, all items unchecked | explicit non-implementation boundary |
| 32–33 | Summary and expansive “grows its own mind” conclusion | summary plus metaphor |

## Corpus completeness

All 33 physical pages were extracted page-by-page. Page 3 interleaves the end of
the fast/slow diagram with the start of the high-level architecture because of
PDF layout order; citations therefore use physical page numbers and avoid
claiming a clean textual sequence where extraction is ambiguous.

## Questions carried upward

1. Is there a category or only a directed operational graph?
2. If there is a category, what are its objects, typed hom-sets, identity arrows,
   equality of arrows, composition operation, and closure/identity/associativity
   witnesses?
3. What are the source and target categories and arrow maps for each claimed
   functor?
4. Which two functors does the proposed variant swap transform, and where are
   its naturality squares?
5. For each claimed adjunction, where are the typed functors, natural hom-set
   bijection, unit, counit, naturality, and triangle identities?
6. Is “growth functor” a lawful functor or a state transition/pipeline?
7. What does DNG mean operationally, and what objective witnesses
   encode/decode adequacy?
8. What evidence turns an ANN distance or confidence threshold into a missing
   morphism rather than model uncertainty?
9. What tests establish the curiosity policy, training loop, and model-minting
   claims?
10. Which operations can enter the semantic-hierarchy bridge without violating
    proximity-is-not-semantics?
