# G01 one-pass query-bound source index r5 — exposed no-model development

Status, 2026-10-03: **local prototype, not VPS-qualified or dispatched**.
The frozen G01 r17 failure and its 24/24 gate are unchanged. No model call or
native score was made in this experiment.

The [r4 query-bound predecessor](G01-QUERY-BOUND-INDEX-R4-DEV.md) halved
memory but missed the 60-second worker deadline on exposed MUI. The
[r5 core](../research/g01-fast-live-v1/source-index-capacity-r5/ranked_source_hints_r5.py)
computes full posting counts and per-file document-frequency terms in one
pass over each line, retaining only query-intersecting terms. Its
[worker](../research/g01-fast-live-v1/source-index-capacity-r5/ranked_source_worker_r4.py)
keeps the one-query binding and the old address/output caps. Original r3 and
r4 files were not changed.

SHA-256: core `367d6baee2901e2aa0e6c4ef2edf7d1d487b3c427755bba66ac822ae681150f3`;
worker `d15572e72df1ca9606c16c2ca1c918a0940057e09fe0e6e00f4dfc194dc43847`;
[focused test](../research/g01-fast-live-v1/source-index-capacity-r5/test_query_bound_r5.py)
`40a4ff84186871ba437a455b0af25568910228969733238f0268c68d40819c1d`.
The two r5 tests passed, including ordinary and >128-term queries,
oversized lines, exact output/digest parity on synthetic records, unbound
multi-query behavior, and bound-query rejection.

Two previously exposed G01 r17 tasks were replayed from their exact archived
r16 bare source caches and task problem statements, with no model or evaluator
access. The complete `{manifest,query_result}` output was canonicalized by
`jq -S -c` and SHA-256 compared to the unchanged r3 worker:

| Exposed task/source | r3 peak RSS / elapsed | r5 peak RSS / elapsed | Complete-output SHA-256, both |
| --- | ---: | ---: | --- |
| Transformers Python task 5 | 1,178,812 KiB / 59.08 s | 555,596 KiB / 41.70 s | `096264dec18bea6e01145d146070eb2ffbb8f266f46df20dce0e79522eb916cb` |
| MUI TypeScript task 3 | 370,236 KiB / 58.73 s | 199,356 KiB / 56.03 s | `f7e37af9da62d71f55c5d4e33e14b67b1d663fbdf93361959e2df1b4a41e07c2` |

Both outputs matched exactly on these two exposed inputs, including admission,
hint score units and hints. The r5 peak-RSS reductions were **52.9%** (Transformers)
and **46.2%** (MUI). Elapsed values are single local runs, not speed claims;
MUI's **3.97-second margin** to the 60-second supervised deadline is too
small to establish live reliability. Local bare-cache runs do not reproduce
the VPS overlay path, other services, host memory state, or parent worker
settlement.

The required parent-supervisor check on that same exposed MUI task **failed**:
`run_index` returned `worker-deadline` after 60.0365 seconds, child exit
`-9`, `forced: true`, and no result. This is a new no-model diagnostic, not
the standalone successful output above. It decisively rejects r5 as a
prospective 60-second worker despite its exact-output and memory gains. A
separately versioned speed policy must pass supervised checks before VPS use.

## Next gate

Before any fresh G01 freeze, fix the supervised deadline failure and run
source-only full-output parity and supervised checks across exposed large-index
tasks, then an
actual-layout no-model VPS rehearsal under a declared `MemAvailable` floor.
Record peak RSS, elapsed, worker settlement and output digests. Stop on any
deadline/OOM/error. Only after that may a separately selected, clean,
native-admitted cohort and prospective GLM campaign be considered. R17's 24
IDs remain exposed and cannot be silently topped up.

## Open Questions

- Does r5 retain its memory and deadline margin under actual VPS concurrent
  load and four-view overlay mounts?
- Which distinct, score-blind cohort can satisfy the strict 24-pair gate
  after r17's full selection is excluded?
