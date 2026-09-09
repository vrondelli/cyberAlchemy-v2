# Cross-Task Decisions

| Decision | Value | Effect |
| --- | --- | --- |
| core/profile boundary | reusable core plus replaceable project profile | Body War vocabulary stays outside core |
| predicate visual key | exact `sourcePredicate` | one stable color per edge type |
| coarse visual key | `presentationRelation` | one stable line pattern; redundant only |
| relation semantic owner | one versioned `RelationPresentationRecord` | renderers cannot derive raw semantics |
| state owner | OEW UI store with pure derivations | no duplicate local graph or DOM-derived state |
| full graph | explicit `Show all loaded graph` escape | never ontology completeness |
| execution order | one SWU at a time over shared overlay/patch | no concurrent write collision |
| evidence | atomic deltas; no universal score | human claims remain separate |
| typed-test compatibility | owner decision pending between test-side and config-side repair | Decision Gate selection is required before successor planning; selection grants no retry authority |
