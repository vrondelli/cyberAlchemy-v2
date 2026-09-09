# UI Conformance Matrix

This matrix adds obligations to the existing nine-SWU pack without changing its
order or dependencies.

| SWU | Contracts | Required evidence |
| --- | ---: | --- |
| UOVARR-005 | 19 | Page/Layout navigation description; Path, inspector, navigation and selection View Models; lifecycle Hooks; Path Form; navigation Actions/Guard/Binding/Mappings; relation-bearing rows carry `RelationRef` and `relation_digest` |
| UOVARR-006 | 36 | graph, node, relation, Portal, legend, filter, index, linear and status Components/View Models; presentation Hooks, Actions, Guards and Bindings; exact-ID scene/geometry Mappings; no semantic ownership in UI or geometry |
| UOVARR-007 | 1 | `StaticProjection` consumes validated snapshot-facing View Models and does not require a live DomainSpec checkout or resolver in detached output |
| UOVARR-009 | 2 | project-source and ViewPack Mappings plus a complete 58/58 conformance audit and runtime import scan |

## Cross-SWU gates

1. UOVARR-005 materializes the OEW-owned profile snapshot and compiled UI
   inventory before any UI contract is claimed.
2. UOVARR-006 cannot accept relation cards, portals, arrows, inspector, or Full
   Index unless the same exact relation ID resolves across all surfaces.
3. UOVARR-007 rejects incomplete or stale detached snapshots and preserves exact
   text when color or pattern is null.
4. UOVARR-009 proves 58 unique dispositions, zero Adapter nodes, zero general State
   Indicator nodes, and no runtime dependency on `projects/domainspec-v2/`.

## Relationship ceiling

Only minted relationships may be claimed. Local references may connect a Component
to an Action and a Hook to a Binding in implementation, but those connections are
not promoted into DomainSpec relationship evidence until the owner registry admits
them.
