# Digest and Reference Glossary

| Term | Definition | Status |
| --- | --- | --- |
| SceneSemanticBasis | Schema-versioned fields from which the scene revision is computed. | Candidate definition. |
| SceneRevisionDigest | Content identity of the semantic basis, excluding only declared identity/runtime slots. | Candidate replacement vocabulary for ambiguous `scene_digest`. |
| SceneEnvelope | Optional finalized container holding a semantic revision and revision-bound references. | Candidate model component. |
| SceneEnvelopeDigest | Optional content identity of the finalized envelope; depends on the revision, never vice versa. | Candidate model component. |
| ReferenceBindingPhase | Deterministic stage after revision computation when relation references can name that revision. | Candidate definition. |
| ValidatedRelationRef | `(scene_revision_digest, source_relation_id)` accepted only after revision and ID recomputation. | Clarified existing concept. |
| Back-reference slot | Schema-declared path whose stored revision points to an ancestor artifact identity. | Candidate definition. |
| Digest dependency DAG | Explicit graph of hash inputs and stored identities; cycles are illegal. | Candidate proof tool. |
| Semantic scene field | Field whose change must alter scene revision, including portal/Path traversal-local data. | Candidate field class. |
| Derived runtime artifact | Rebuildable in-memory index or cache excluded from content identity. | Existing role, clarified. |
| Detached reference projection | Separately serialized mapping from consumer records to validated references. | Candidate model. |
| Ambient scene scope | Process-local current-scene state used to fill or interpret IDs. | Negative control; not portable authority. |
| Finalization | Deterministic construction of one immutable, internally valid artifact. | Candidate contract. |
| Admission | Recompute-and-reject validation of serialized artifacts. | Existing contract, hardened. |

Glossary status: linked to current OEW terms only. No Definitions Governance promotion occurs.
