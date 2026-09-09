# Interfaces: Ontology Vault Runtime API

## External: Runtime HTTP v1

Binding: `127.0.0.1` only. Authentication: ephemeral, non-persisted,
non-echoed 256-bit bearer token. HTTP accepts logical IDs only.

### GET families

`/v1/packages/{package_id}`, `/v1/snapshots/{snapshot_id}`,
`/v1/snapshots/{snapshot_id}/records`,
`/v1/snapshots/{snapshot_id}/records/{local_kind}/{local_id}`,
`/v1/snapshots/{snapshot_id}/sources`, `/v1/runs/{run_id}`,
`/v1/runs/{run_id}/artifacts`,
`/v1/runs/{run_id}/artifacts/{artifact_id}`,
`/v1/proposal-artifacts/{artifact_id}`, `/healthz`, `/readyz`.

### POST families

| Path | Exposes | Idempotency |
| --- | --- | --- |
| `/v1/snapshots` | Compile Snapshot | required |
| `/v1/runs` + `native.validate` | Run Native Validation | required |
| `/v1/runs` + `runtime.same_adapter_byte_local_id_diff` | Run Same-Adapter Diff | required |
| `/v1/runs/{run_id}/proposal-artifacts` | Construct Draft Proposal Artifact | required |

Same idempotency key and body reuses the object. Same key with different body
returns `IDEMPOTENCY_CONFLICT`.

No HTTP registration, upload, delete, GC, cancellation, shutdown, CRUD,
approval, promotion, publication, release, deployment, or agent endpoint is
admitted. Protocol upgrades and other methods fail closed.

## Internal: PackageAdapterV0

Methods: descriptor, inspectProfile, emitLocalRecords, emitSourceBindings,
emitNativeReceipt, emitDiagnostics, emitResidue, and optional
invokeNativeValidation. Returning snapshot identity, publication, collision,
retention, or generic semantic/authority decisions is
`ADAPTER_CONTRACT_VIOLATION`.

## Administration

Designed commands: `verify-configured-registration`, `serve`,
`inspect-package`, exact-content-ID `gc`, and exact-owned-handle `stop`. GC is
blocked pending retention ownership.

