# G01 query-bound batched source index r8 — exposed no-model qualification

Status, 2026-10-03: **local source-only development candidate**, not a new
campaign, native score, or superiority result. Frozen G01 r17 remains terminal
failed at four scored, one unscored, 19 unattempted; none was retried.

## Mechanism and exact source

The r7 worker started one `git cat-file blob` process per loaded file. The
archived MUI task-3 index admitted 12,772 files; the same source-only replay
loaded 13,067 blobs including later-excluded files. The [r8 worker](../research/g01-fast-live-v1/source-index-capacity-r8/ranked_source_worker_r7.py)
uses one bounded `git cat-file --batch` child after exact commit/inventory
checks. Every returned header must match the requested 40-hex object ID,
`blob` type and inventory byte length; the trailing batch delimiter is
checked. An early child exit, identity mismatch, length mismatch or nonzero
final status fails closed. The child is settled before the worker emits a
result. Parent address/output limits and the prospective 120-second deadline
remain in force. The [r8 core](../research/g01-fast-live-v1/source-index-capacity-r8/ranked_source_hints_r8.py)
is functionally the r5 one-pass query-bound index, preserving full postings,
document frequencies, manifest, ranking and logical index digest.

SHA-256: core `e934ac458c1566fe0e7483dd9107d2cef5a98aa4df0662b73f6c23fb0afa88d1`;
worker `b06d6a4d2291a96a3d51978058ca6c4b53208c4882780dd7dd629149604dfb6a`;
[four focused tests](../research/g01-fast-live-v1/source-index-capacity-r8/test_query_bound_r8.py)
`7f6c9d7ee0a101b6baeb8c26df4b910fd3596916a73910d6651416b2f5f73f38`
passed, including a real temporary Git repository with empty and binary
blobs, exact old/new output parity and child settlement. The read-only
[archived-output probe](../research/g01-fast-live-v1/source-index-capacity-r8/probe_exposed_index_r8.py)
is `0c2c430f0c80edcab792d5e75b866f9034ac3b838747d9017edc854dc5e0eae7`;
the read-only [24-task sweep helper](../research/g01-fast-live-v1/source-index-capacity-r8/sweep_exposed_r17_r8.py)
is `cc93394c8be17ff2b159a672d5de71b0ec1ca8edadfc4287ee1a01cfb197ebe4`.

## Exposed-task parity and capacity

All four completed r17 pairs' **initial empty-query** source indexes were
replayed from their archived pinned caches. Each r8 run passed parent
settlement and matched the archived base/index identity, complete manifest,
and complete query result—not merely top hints:

| r17 task | Origin | Supervised elapsed | Peak RSS | Loaded blobs | Full archived parity |
| ---: | --- | ---: | ---: | ---: | --- |
| 1 | Django | 13.31 s | 248,892 KiB | 6,067 | pass |
| 2 | Ansible | 6.04 s | 134,788 KiB | 5,030 | pass |
| 3 | MUI TypeScript | 13.47 s | 172,604 KiB | 13,067 | pass |
| 4 | Sympy | 12.37 s | 234,800 KiB | 1,934 | pass |

R17 task 5 had no completed live index receipt. A separate local replay on
its pinned Transformers base compared the actual empty initial query against
the unchanged r3 worker. Both complete `{manifest,query_result}` projections
had SHA-256 `232336a71ccc86dea97677de0fab1c2659f2be1772258e0ca6fa70647cb64b83`
and logical index digest
`d6b77a28fb670df4bc5bfda43fc3c941e4d79814d18a48f7a1b37ee064ad9570`.
R3 standalone took **55.45 s / 1,157,820 KiB peak RSS**; r8 parent-supervised
settled in **37.83 s / 419,664 KiB**, loading 4,133 blobs. These are single
local runs, not VPS throughput estimates. The separate problem-statement
query also matched exactly; on MUI, r8 took **14.58 s** versus r7's
**106.58 s** under that same query and local source cache.

The remaining 19 r17 selections were checked with the empty query using the
prospective r8 worker, exact task JSON SHA checks and pinned WSL caches. The
first sweep returned **17/19**: tasks 23 and 24 failed *before indexing*
because the sweep helper selected the older r16 cache instead of their
explicit r16 r2 delta cache. That failure is preserved; no task or model
attempt was created. After the helper was corrected to map the two declared
cache generations, a separate task-23/24 replay passed **2/2**. Thus all 24
distinct exposed r17 selections have now produced a successful **local,
parent-supervised, no-model** index with r8, across separate diagnostic
runs—not one frozen 24/24 campaign. Across tasks 6–24 the longest settled
worker was task 16 at **89.34 seconds** and the largest peak was task 21 at
**431,600 KiB**. No evaluator reference, native score or GLM call was read
or made by the sweep.

One early archived-output probe also compared task 1's problem statement to
an archived *empty-query* index and correctly showed a query-result mismatch
while the index digest matched. The corrected probe now checks the reference
query digest before running. This was a diagnostic-input mismatch, not a
retrieval or batch-output discrepancy.

## Claim ceiling and next gate

A separately versioned **native service adapter** now connects the r8 reader
to the actual Node → Python source-index path without changing the r17 frozen
source or the existing r1 service. The new service, Node worker, Python
supervisor, worker and core are under
`development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/`
with `r8` names. The copied core and worker retain the prototype SHA-256 hashes
above; the new service is `82353c684fba1a1b4c0818171bacd2479a8ae0615bc90270a5361f2541b4ecc5`,
Node worker `f0449dec5658721df56cbb232b55fb276aaa4064fa5d160a59ed2687cbbde5c6`,
and Python supervisor `1e7a76ad4df6fc865380c3e54ffdb7746afe6a54a73eb839d1cace91c428c41c`.
The adapter retains the r3 logical normalizer and matching index digest,
selects the r8 worker explicitly, and raises only its prospective service
deadline ceiling from 65 to 120 seconds. It is not wired into a campaign.

The [native-path smoke test](../research/g01-fast-live-v1/source-index-capacity-r8/test-native-service-r8.test.mjs)
(`1f7a8a5bd5a09670f02b81de24facd2e778d41ad9fd1675750be495688e2f253`)
passed against a real temporary Git repository, checking initial and follow-up
query persistence, worker identity, no-model evidence and both process-group
settlements. On the archived **exposed** r17 MUI task 3, the full Node path
matched the complete archived initial manifest and query result and logical
index digest `b11dd953966f8d2d25df667b0d9a7a34a0e1f5918a619498ff385aa10325455d`;
13,067 blobs were read and both process groups settled without force in a
single **26.96-second local** check. The exposed r17 Transformers task 16
also completed through the native path in a separate **31.08-second local**
check, at 331,608 KiB worker peak and with both process groups settled.
The original r17 OOM selection, exposed Transformers task 5, then completed
through the same native path in **36.29 local seconds**, at 419,876 KiB worker
peak; its logical index digest remained
`d6b77a28fb670df4bc5bfda43fc3c941e4d79814d18a48f7a1b37ee064ad9570`,
and both process groups settled without force. This local rerun is not a
retroactive r17 task completion or proof against VPS OOM under concurrent load.
These timings are not VPS guarantees. Four Python tests and the native smoke
test pass; `git diff --check` is clean. The initial native smoke attempt failed
only because WSL `/tmp` was full; rerunning with a `/var/tmp` test root passed.

This establishes a substantial **source-index reliability/capacity
improvement on exposed local data**; it does not establish ARE answer quality,
full ContextBench performance, or product superiority. A separate
[WSL-only prospective source snapshot](G01-R8-PROSPECTIVE-SOURCE-SNAPSHOT-2026-10-03.md)
now includes the native r8 service and switches its orchestrator import;
its exact runner import and exposed MUI archived-output replay passed. It is
not frozen for dispatch or tested through the four-view overlay on the VPS.
The VPS still fails the provisional 4 GiB
`MemAvailable` gate, and historical evidence was not removed. Exact owner
approval for reclaiming two named redundant r15 VPS copies is recorded
[separately](G01-R15-VPS-RECLAIM-APPROVAL-2026-10-03.md), but the repository
route/effect boundary remains unresolved; approval is not a deletion receipt.
The latest read-only VPS check found 1,140,703,232 bytes available, a
3,154,264,064-byte shortfall to the provisional floor; WSL `/tmp` is also
full, while `/var/tmp` hosted the small local test repository.

Next: qualify the prospective r8 snapshot in the actual overlay path after
a non-destructive host-memory preflight; then select a **distinct**
clean, native-admitted G01 population and freeze a new 24-pair protocol. The
r17 IDs are exposed and cannot be silently topped up or represented as a
fresh confirmation cohort.

## Open Questions

- Does the batched reader preserve output and settle under the VPS's actual
  concurrent load and four-view overlay layout?
- What exact route/effect contract admits the separately approved, verified
  archival reclaim without broadening the benchmark route?
- Which new source population can sustain a clean, full 24-pair claim gate?
