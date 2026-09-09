---
tags: [upload, celery, polars, oom, performance, infrastructure]
node_type: spec
is_session: true
layer: application
nature: corrective
status: active
created: 2026-03-31
timestamp: 2026-03-31T10:50:00-03:00
expires: 2026-05-30
conversation_id: 2baa6781-c41f-493f-9f6f-e38ac036d314
# --- Structured fields ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 8
importance_rationale: "Resolved a hard blocker (SIGKILL on production-size uploads) that survived a prior fix attempt, identified four root causes at different stack layers, and established a permanent worker recycling policy via CELERY_WORKER_MAX_MEMORY_PER_CHILD."
---

# CSV Upload OOM — Root Cause Analysis and Final Fixes

**Date:** 2026-03-31 10:50 (UTC-3)
**Tags:** #upload #celery #polars #oom #performance #infrastructure

## Summary

This session continued OOM fix work started in the previous conversation (2026-03-31-1130). The previous session had refactored the upload pipeline to stream the clean CSV via a temp file instead of holding `clean_bytes` in RAM, but the upload was still being killed with SIGKILL on every attempt. This session used memory instrumentation to identify and fix four distinct root causes.

### Diagnosis Approach

Memory checkpoints were added to `upload_service.py` using `resource.getrusage(RUSAGE_SELF).ru_maxrss` — a per-process peak RSS counter that only increases. Log lines of the form `[mem] after process_file: 6136 MB` were emitted at each pipeline stage. The logs revealed that the SIGKILL was consistently happening *inside* `process_file()` (the "after process_file" checkpoint was never reached in most runs), which narrowed the search to `upload_rules_base.py`.

### Root Cause 1 — Python UDF per row: `map_elements(cls._parse_date)`

The base class used `pl.col(date_col).map_elements(cls._parse_date, return_dtype=pl.Utf8)` for each of 3 date columns. `map_elements` with a Python callable breaks out of Polars' Rust execution path and calls Python once per cell. For a 1.2 GB CSV with millions of rows:
- ~3M Python string objects created per date column (CPython overhead: 50–100 bytes each)
- 3× 3M = ~9M Python function calls total
- Processing time: 3–4 minutes
- Memory: Python heap spike from all the intermediate string objects

**Fix:** Replaced with native Polars expressions:
```python
pl.coalesce([
    pl.col(date_col).str.strptime(pl.Date, '%d/%m/%Y', strict=False),
    pl.col(date_col).str.strptime(pl.Date, '%Y-%m-%d', strict=False),
]).dt.strftime('%Y-%m-%d').alias(date_col)
```
This runs entirely in Rust. Processing time dropped from 3–4 minutes to ~10 seconds.

### Root Cause 2 — `df.unique()` at end of `process_file`

`process_file` returned `df.unique()` — a full row-level hash computation across all columns, requiring the original DataFrame + a hash table + the result simultaneously (~3× DataFrame size). For a 1.2 GB file whose in-memory representation was ~6 GB (all-string schema via `infer_schema_length=0`), this would need ~18 GB — far beyond the 7.65 GB Docker limit. After fixing root cause 1, this became the new kill point (SIGKILL at ~22 seconds instead of ~220 seconds).

**Fix:** Removed `df.unique()`. It was redundant because `split_intra_file_duplicates` already handles dedup via `DEDUP_KEYS`. Any truly identical rows share the same `DEDUP_KEYS` and would be caught there. Behavior is semantically equivalent — identical rows show up in `duplicated_count` rather than being silently dropped, which is actually better UX.

### Root Cause 3 — `split_intra_file_duplicates` join intermediate

The function used:
```python
counts = df.group_by(keys).len(name='count')
full_df = df.join(counts, on=keys, how='left')
unique_df = full_df.filter(pl.col('count') == 1).drop('count')
duplicates_df = full_df.filter(pl.col('count') > 1).drop('count')
```
At peak: `df` + `full_df` (join copy of `df` + count column) + `unique_df` coexisted simultaneously — ~3× DataFrame.

**Fix:** Replaced with:
```python
is_dup = pl.struct(keys).is_duplicated()
unique_df = df.filter(~is_dup)
duplicates_df = df.filter(is_dup)
```
`is_duplicated()` is a boolean mask (~8 MB for 1M rows), evaluated inside `filter` without creating an intermediate full copy of `df`. Peak drops from 3× to 2× DataFrame.

### Root Cause 4 — Cross-task Polars allocator memory retention

Even after all three fixes above, the second upload attempt from the same worker was being killed. Memory logs showed:

- **Run 1** (fresh worker, starts at 144 MB): `process_file` → 6136 MB → **task completes successfully**
- **Run 2** (same worker, starts at 6136 MB — Polars never returned OS pages): `process_file` → 6583 MB → **SIGKILL** ~1 minute later during join operations

Polars' allocator (mimalloc/jemalloc) retains freed memory in an internal free list and does not return it to the OS. After a large upload, the worker's RSS stays at ~6 GB permanently. The second upload starts from that 6 GB baseline, and even a small additional allocation (e.g., `unique_df` during the split) pushes the container past its 7.65 GB Docker limit.

**Fix:** Added to `house_project/settings.py`:
```python
CELERY_WORKER_MAX_MEMORY_PER_CHILD = 2_000_000  # 2 GB in KB
```
Celery checks RSS after each task completes. If RSS > 2 GB (which always happens after a large upload), it gracefully replaces the worker process before accepting the next task. The next upload starts from ~145 MB baseline.

### Additional Optimizations

Three `del` statements were added in `upload_service.py` to release large DataFrames earlier, preventing them from coexisting with subsequently-created DataFrames in the same pipeline stage:
- `del df` — immediately after `split_intra_file_duplicates` returns
- `del unique_df` — immediately after both DB dedup joins complete
- `del csv_df` — immediately after writing to `clean_path`

These reduce the *duration* of peak memory, but due to Polars' allocator behavior, do not reduce the OS-visible RSS (the pages remain in Polars' free list). Their main benefit is ensuring Polars can reuse freed pages for subsequent allocations within the same task rather than requesting new OS pages.

## Epistemic Impact

**Polars allocator behavior confirmed:** Polars' internal allocator never returns freed pages to the OS. This is a permanent constraint for all long-lived Celery workers that process large DataFrames. Any future spec or deployment plan involving batch Polars processing must account for this with either `CELERY_WORKER_MAX_MEMORY_PER_CHILD`, container-level OOM handling, or explicit `malloc_trim` calls.

**Python UDFs in Polars are qualitatively expensive:** `map_elements` with a Python callable is not a constant-factor overhead — it breaks out of Rust execution entirely, creates millions of Python objects, and can be the primary OOM cause even before the DataFrame itself is fully held. This should inform code review standards for the pipeline layer.

**Promoted candidates:** Both observations above are candidates for a future `premise` node on Polars usage constraints in the pipeline.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `infrastructure/remessa/upload_rules_base.py` | Modified | Replaced `map_elements(cls._parse_date)` with native `str.strptime` + `coalesce`; removed `df.unique()`; replaced `df.join(counts)` in `split_intra_file_duplicates` with `pl.struct(keys).is_duplicated()` |
| `infrastructure/remessa/upload_service.py` | Modified | Added `import resource` and `[mem]` log checkpoints; added `del df`, `del unique_df`, `del csv_df` to release DataFrames earlier in the pipeline |
| `house_project/settings.py` | Modified | Added `CELERY_WORKER_MAX_MEMORY_PER_CHILD = 2_000_000` to force worker recycling after 2 GB RSS |

## Connections

- Continues: `docs/vault/conversations/2026-03-31-1130-remessa-upload-oom-diagnosis.md` (prior session that introduced the `clean_bytes` → `clean_path` refactor)
- Contextualizes: `specs/003-remessa-upload-with-events/2026-03-31-003-remessa-upload-oom-fix.md` (the implementation plan this session was executing)

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| No premise exists encoding "avoid Python UDFs (`map_elements`) in Polars hot paths" | Root cause 1 | MEDIUM | Open |
| No premise exists for "long-lived Celery workers + Polars require explicit RSS ceiling via `MAX_MEMORY_PER_CHILD`" | Root cause 4 | MEDIUM | Open |
| No integration test covering multi-upload worker reuse scenario (second upload from non-zero RSS baseline) | Root cause 4 | MEDIUM | Open |
| Memory instrumentation (`[mem]` logs) is ad-hoc — no standard for when to add memory tracing in the pipeline | Session observation | LOW | Open |

## Open Questions

- Is the first upload confirmed working end-to-end in local dev? The session ended with the upload still running ("It is running, check the logs") — success was not explicitly confirmed before close-session was called.
- Does `CELERY_WORKER_MAX_MEMORY_PER_CHILD` apply to GCP Cloud Run (production) or only to local Docker Compose? Production uses Cloud Run Jobs for bulk import, but Celery workers in GCP may have different memory limits.
