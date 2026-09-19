# Implementation Layering

This is a project-agnostic layering decision for the lifecycle machinery. It does not select the concrete new meta-type or claim the named components exist.

## Dependency rule

Dependencies point from orchestration and language adapters toward stable domain contracts. Domain contracts depend on no filesystem, AST library, package manager, native compiler, canvas, or governance transport.

```text
L0 semantic contracts
  <- L1 candidate formation
  <- L2 authority and projection adapters
  <- L3 observation/evaluation kernel
  <- L4 native language adapters
  <- L5 orchestration and closeout
```

## Layers

| Layer | Owns | May depend on | Must not depend on | Portability |
| --- | --- | --- | --- | --- |
| L0 semantic contracts | intent, design closure, obligations, applicability, unsupported algebra, receipt types | stable value primitives | repository paths, languages, governance tools | reusable/private DomainSpec |
| L1 candidate formation | candidate packet construction, criterion fixture model, non-collapse matrix | L0 and read-only ontology snapshots | canonical writes or self-admission | DomainSpec-specific |
| L2 authority/projection adapters | definitions-governance transport, canonical digest reads, reciprocal ontology projection | L0-L1 and explicit owner interfaces | evaluator decisions or language syntax | repository-specific edge |
| L3 observation/evaluation kernel | `ObservationProjection`, property/relation evaluation, deterministic normalization, parity | L0 contracts | ASTs, compilers, process exit, admission | reusable/private DomainSpec |
| L4 language adapters | TypeScript, Python, Rust source/module/native-tool extraction | L0 and L3 schema | owner decisions or other language adapters | language/project edge |
| L5 orchestration/closeout | gate ordering, task receipts, refreshes, claim ceilings, residue | all lower layers through explicit receipts | hidden semantic defaults | project workflow |

## Component placement

| Component | Layer | Lifecycle | Scale-up trigger |
| --- | --- | --- | --- |
| intent and obligation schemas | L0 | versioned and immutable per execution | two consumers need the same contract |
| candidate packet builder | L1 | one instance per proposed type | repeated hand-authored packets drift |
| canonical owner adapter | L2 | human-gated request/receipt | definitions-governance transport changes |
| architecture realization projector | L2 | regenerated after admitted ontology change | canvas/ontology graph format evolves |
| generic evaluator and normalizer | L3 | pure deterministic calls | graph algorithms or conditional property support needed |
| each language adapter | L4 | isolated project scan | native syntax/module semantics exceed bounded resolver |
| Task Session route | L5 | one SWU at a time | execution becomes a reusable multi-agent dispatch |

## Interface rules

- L4 returns data; it does not call the authority owner or change lifecycle state.
- L3 consumes explicit facts and returns findings; it does not infer that missing facts pass.
- L2 projections always carry `authority_effect: none` unless an external owner receipt names a real canonical mutation.
- L5 moves between tasks only with required receipts and freshness checks.
- Public Arcanum files are outside every layer's write scope.

## Failure containment

A failure is contained at the narrowest layer: malformed intent at L0, non-collapse failure at L1, missing approval at L2, inconsistent facts at L3, unsupported native construction at L4, or incomplete closeout at L5. Higher layers may report but not reinterpret a lower-layer block.

