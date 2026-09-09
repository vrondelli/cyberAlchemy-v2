# Events: Ontology Vault Runtime API

Events are runtime-local operational evidence, not ontology or authority
events.

| Event | Produced by | Payload ceiling | Consumer |
| --- | --- | --- | --- |
| RegistrationVerified | configured admission | logical IDs and digests | compiler |
| RegistrationRejected | configured admission | typed redacted error | operator |
| SnapshotPublished | snapshot compiler | snapshot/content/source digests | query plane |
| SnapshotReused | snapshot compiler | existing immutable handle | client |
| SnapshotFailed | snapshot compiler | typed error and cleanup result | operator |
| RunStarted | run worker | run/operation/snapshot IDs | status query |
| RunCompleted | run worker | runtime status + exact native-result ref | client |
| DraftProposalArtifactCreated | artifact constructor | artifact digest and handle | retained owner route |
| TeardownCompleted | service owner | zero-residue measurements | operator |

Events never encode owner review, delivery, acceptance, rejection, promotion,
publication, release, or deployment state.

