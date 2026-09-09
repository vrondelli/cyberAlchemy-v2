# Queries: Ontology Vault Runtime API

All queries are read-only, bearer-authenticated except liveness, bounded, and
logical-ID addressed.

| Query | Input | Output | Bounds |
| --- | --- | --- | --- |
| GetConfiguredPackage | `package_id` | configured registration projection | one item |
| GetSnapshot | `snapshot_id` | immutable identity and receipt refs | one item |
| ListSnapshotRecords | `snapshot_id`, cursor, filters | qualified local envelopes | page size 1–100 |
| GetSnapshotRecord | snapshot + `local_kind` + `local_id` | one qualified record | one item |
| ListSnapshotSources | `snapshot_id`, cursor | logical source bindings | bounded page |
| GetRuntimeRun | `run_id` | execution status and exact native wrapper | one item |
| ListRunArtifacts | `run_id` | content-addressed artifacts | bounded page |
| GetRunArtifact | `run_id`, `artifact_id` | immutable bytes | 2 MiB response cap |
| GetDraftProposalArtifact | `artifact_id` | immutable draft bytes | one item |
| Health | none | process liveness | no semantic claim |
| Readiness | none | bounded service readiness | no ontology/implementation claim |

Successful immutable responses bind snapshot/content digest, quoted SHA-256
ETag, profile, adapter, truncation, cursor, and authority effect `none`.
Matching normalized `If-None-Match` returns `304`.

