# UX Contract

## Primary surface

The header names the active ontology and View Pack. The initial canvas contains one bounded cluster, real node cards, and real relation paths. A compact contextual legend explains only visible node kinds and predicates. The complete graph count is always visible beside `Full index` so the bounded scene never implies completeness.

## Controls

| Control | Meaning |
|---|---|
| View | Choose a source-backed View Pack; does not filter or edit ontology |
| Filter | Exclude matching records from all current projections; shows active count |
| Full index | Open complete node/relation table independent of spatial renderer |
| Path | Select two nodes and compare exact relation-bearing paths |
| Evidence | Open source/evidence/authority inspector for current selection |
| Legend | Explain only active colors, patterns, markers, icons, and statuses |
| Back | Restore one complete Navigation Frame and prior focus |

No ambiguous `Overview`, `Learn`, `Deep Dive`, `Theme`, or unlabeled icon button survives unless it maps to one of these typed actions and has accessible text.

## Cards and relations

- Node card: node-kind icon, role mark, label, one-sentence definition, cluster label; metadata appears on demand.
- Relation: spatial path attached to both cards, arrow marker, exact predicate label, stable predicate color, presentation-family pattern, focusable hit target.
- Grouped Portal: destination cluster icon/name/purpose, outside-node count, relation count, predicate summary, expand action showing exact constituents.
- Inspector: never covers the selected relation endpoints; becomes a modal bottom sheet on narrow screens.

## Empty/error states

- No source/view: block with exact missing artifact and owner route.
- No cluster registry: open View selection or Full Index with a non-authoritative grouping warning; never infer clusters from layout.
- Filters remove scene: explain active filters and offer `Clear filters` and `Full index`.
- Renderer failure: preserve linear scene/index/evidence and expose a diagnostic; do not show blank black canvas.
- No Path: state the endpoints, relation policy, graph revision, and zero result without implying disconnection under other policies.

## Acceptance claim ceiling

Automated tests may prove structural equivalence, interaction mechanics, geometry, and specified accessibility properties. Only representative human evaluation may claim comprehension or usability quality; only an appropriate audit may claim conformance.

