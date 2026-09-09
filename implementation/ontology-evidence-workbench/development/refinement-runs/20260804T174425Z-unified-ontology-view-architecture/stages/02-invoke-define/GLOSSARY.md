# Glossary

Status: candidate-local vocabulary for this Refine run. Terms are not promoted definitions.

| Term | Definition | Link status |
|---|---|---|
| Source Graph | Lossless node/relation records whose owner defines semantic identity, exact predicates, direction, evidence, and authority effect. | partial — aligns with current graph/sidecar contracts |
| View Pack | Digest-bound selection and presentation metadata over Source Graph identities; it cannot redefine them. | partial — generalizes current ontology views |
| Knowledge Scene | Deterministic, bounded projection of Source Graph + View Pack + query/navigation state. | no-match — candidate term |
| Scene Node | A source node plus presentation metadata and computed geometry. | no-match |
| Scene Relation | A source relation plus presentation cues and routed geometry; retains exact source identity. | no-match |
| Cluster | Source-backed group with stable ID, label, purpose, membership rule, icon category, and ordering. | partial |
| Grouped Portal | Navigable aggregation of cut relations leading from the current scene to one destination cluster. | no-match |
| Navigation Frame | Complete restorable scene, selection, filter, viewport, panel, control, and focus state. | no-match |
| Evidence Binding | Trace from a presented item to exact source/evidence records and mapping status. | partial |
| Renderer Adapter | Replaceable component that renders spatial scene primitives and emits semantic interaction intents. | no-match |
| Layout Adapter | Deterministic geometry service for nodes, compound clusters, ports, labels, and routed relations. | no-match |
| Path Result | Ordered nodes and exact relations returned by a bounded path query. | partial |
| Full Index Escape | Complete non-spatial node/relation projection reachable from any scene. | no-match |
| Static Projection | Deterministic SVG/print representation produced from the same Knowledge Scene. | partial |
| Source Direction | Direction asserted by the source relation. | linked |
| Traversal Direction | Direction the user moves through a portal/path; never changes source direction. | no-match |

## Forbidden collapses

Source Graph is not Knowledge Scene; View Pack is not Cluster; focus is not filter; cut relation is not Grouped Portal; exact predicate is not display family; source direction is not traversal direction; evidence is not authority; visual encoding is not semantic identity.

