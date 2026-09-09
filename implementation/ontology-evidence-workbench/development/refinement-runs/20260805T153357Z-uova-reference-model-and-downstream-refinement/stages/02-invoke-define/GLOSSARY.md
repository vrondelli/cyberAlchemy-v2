# Relation Reference Glossary

| Term | Definition | Current owner/status |
| --- | --- | --- |
| Source relation ID | Stable relation identity inside one admitted SourceGraph revision. | Existing field; canonical local key. |
| RelationRef | Portable reference `(source_graph_digest, source_relation_id)`. | Candidate definition. |
| SourceRelationBinding | Canonical admitted semantic relation record. | Existing schema concept, clarified here. |
| Relation facet | Immutable scene-local semantic projection derived once from the canonical record. | Candidate alternative, not selected. |
| Resolver | Revision-aware function that maps a RelationRef to exactly one canonical record or a typed failure. | Candidate contract. |
| Semantic field | Field whose value changes relation meaning: predicate, ordered endpoints, source direction, evidence/mapping/authority state. | Candidate field class. |
| Local field | Consumer-owned state that does not redefine relation meaning, such as traversal direction, viewport, or route geometry. | Candidate field class. |
| Projection | Deterministic consumer record derived from canonical semantics plus local state. | Existing architectural role, clarified here. |
| Snapshot | Detached copy of selected semantic fields tied to a RelationRef and canonical digest. | Candidate serialization contract. |
| Source relation digest | Deterministic digest of the canonical semantic record used to validate snapshots. | Candidate proof field. |
| Scene revision | Digest-bound KnowledgeScene identity that includes source graph and View Pack revisions. | Existing architectural role, clarified here. |
| Traversal direction | User movement relative to canonical source direction; never a rewritten ontology direction. | Existing planned field, clarified here. |
| Presentation encoding | Exact-predicate-keyed color, pattern, label, and direction phrase. | Existing planned registry; non-semantic. |
| Stale revision | Reference or derived artifact bound to a different graph/scene revision. | Candidate typed failure. |
| Projection collapse | Loss of distinct relation identity in a downstream mapping. | Existing observed failure class, named here. |

Glossary status: `linked` to the current UOVA field names; new terms remain candidate-local and are not promoted to Definitions Governance.
