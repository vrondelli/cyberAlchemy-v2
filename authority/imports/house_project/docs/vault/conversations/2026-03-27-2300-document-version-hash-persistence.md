---
tags: [data-model, document-pipeline, event-system, identity, migration]
node_type: spec
is_session: true
layer: domain
nature: corrective
status: active
created: 2026-03-27
timestamp: 2026-03-27T23:00:00-03:00
expires: 2026-05-26
conversation_id: ""
# --- Structured fields ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates:
  - "Premise: Any value used as an entity_id in the event log must be persisted on the row, not recomputed at emission time"
expected_importance: 7
importance_rationale: "This session closes a structural risk to event identity — the core traceability mechanism of the system — by eliminating silent breakage on null FK paths and consolidating a previously scattered, recomputed value into a single persisted source of truth."
---

# DocumentVersion Hash Persistence

**Date:** 2026-03-27 23:00 (UTC-3)
**Tags:** #data-model #document-pipeline #event-system #identity #migration

## Summary

This session addressed a gap in the `DocumentVersion` identity model: the `document_hash` — used as the `entity_id` for all document pipeline events — was being recomputed on-the-fly at every event-emission call site rather than stored on the row. The session surfaced this as a structural risk because `folder` (the FK that provides `leaf_folder_path` for recomputation) is nullable on `DocumentVersion`, meaning any row with a null folder would silently break event identity.

The solution was to add `document_hash` as a persisted column on `DocumentVersion`. The hash is now computed once — right after `bulk_create` in `_persist_document_versions`, using `res.leaf_folder_path` directly from the already-loaded `DocumentsFolderResult` — and stored via `bulk_update`. All five downstream event-logging call sites in `process_bulk_import.py` were updated to read from `dv.document_hash` instead of calling the hash function inline.

### Problem: on-the-fly recomputation over a nullable FK

Five independent call sites in `process_bulk_import.py` were each calling `document_hash(dv.original_name, dv.folder.leaf_folder_path, dv.uploaded_at)` inline. Because `folder` is a nullable FK on `DocumentVersion`, any code path where the folder had been nulled would fail silently — the hash would either raise an `AttributeError` or produce a wrong value. The event-system constitution requires `entity_id` to be stable and deterministic; the implementation provided no structural guarantee of this.

No alternative approaches were considered — storing the value was clearly correct. The only decision point was whether to index the column, which was deferred.

### Decision: persist the hash at creation time

`document_hash` was added as a `CharField(max_length=32)` on `DocumentVersion`. In `_persist_document_versions`, after `bulk_create`, the hash is computed using `res.leaf_folder_path` (already loaded on the `DocumentsFolderResult` object, avoiding an extra FK join) and persisted via `bulk_update`. This is one additional DB round-trip per folder batch, but eliminates five fragile recomputations downstream.

### Nullability tightened after DB clear

The field was initially added as `null=True, blank=True` as a defensive default for existing rows. After the user confirmed the database was cleared, it was updated to non-nullable. The migration uses `default=''` with `preserve_default=False` — Django's standard pattern for adding a non-nullable column to an empty table.

## Epistemic Impact

The session implicitly confirms that identity-critical values must be persisted rather than recomputed, especially when the inputs to that computation are not guaranteed to be available. This reinforces the event-system constitution's contract that `entity_id` must be stable and deterministic.

Five call sites recomputing `document_hash` via a nullable FK was silent spec drift: the event catalog assumed a stable `entity_id`, but the implementation had no structural guarantee. The drift is now closed.

**Promoted candidate:** "Any value used as an `entity_id` in the event log must be persisted on the row, not recomputed at emission time." Sufficiently general and falsifiable to become a rule in the event-system constitution or a standing premise.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `domains/aquisicao/repositories/models.py` | Modified | Added `document_hash` CharField to `DocumentVersion` so the hash is stored once at creation time rather than recomputed at each event-emission call site |
| `migrations/infrastructure_database/0045_documentversion_document_hash.py` | Created | AddField migration for the new column; tightened to non-nullable with `default=''` / `preserve_default=False` after confirming the database was cleared |
| `domains/documents_validation/use_cases/process_bulk_import.py` | Modified | Hash computed once after `bulk_create` using `res.leaf_folder_path` and stored via `bulk_update`; all five downstream event-logging call sites updated to read `dv.document_hash` |

## Connections

- `validates` → `docs/vault/constitution/event-system-constitution.md` — the contract that `entity_id` must be stable and deterministic is now structurally enforced for `document_version` events

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Promote "entity_id values must be persisted, not recomputed at emission" to the event-system constitution or as a standing premise | Promoted candidate from this session | HIGH | Unscheduled |
| Audit other event types in the catalog to verify no other `entity_id` is being recomputed from nullable or mutable inputs at emission time | Generalization of the risk surfaced here | MEDIUM | Unscheduled |
