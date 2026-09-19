# Source Contracts

| ID | Source | Consumed contract | Ownership boundary |
| --- | --- | --- | --- |
| SC-01 | `../ontology-experiment/domain-meta-types.projection.json` | meta-type ID, maturity, coverage, exact candidate alignment | read-only projection; no canonical mutation |
| SC-02 | `../ontology-experiment/ontology.json` | concept inheritance, properties, relations, reciprocal canonical refs | candidate architecture ontology only |
| SC-03 | `../ontology-experiment/profiles/*.json` | profile inheritance, constraints, expected values, applies-to | expectations; not property meaning or authority |
| SC-04 | `../ontology-experiment/examples/typescript-observed-facts.json` | supplied element/relation facts | hand-authored fixture; no adapter execution |
| SC-05 | `../ontology-experiment/examples/typescript-evaluation.expected.json` | expected TypeScript findings | expected fixture output; not a new evaluation run |
| SC-06 | `../ontology-experiment/architecture-ontology-view.html` | current UI, loader, interaction, renderer, and separate builders | read-only brownfield implementation target |
| SC-07 | `SPEC.md` and aspect docs | one-graph, bridge, UX, and authority invariants | Invoke-local Design authority only |

Every source contract is digest-bound in `DESIGN-SCOPE-MANIFEST.json`.
