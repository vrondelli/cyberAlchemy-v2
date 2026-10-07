# G01 r17 terminal result — host-memory source-index failure

Status, 2026-10-03: **terminal failed; no r17 superiority claim**. The
separately frozen 24-pair, five-repository development campaign stopped at
task 5 under its zero-retry, no-replacement rule: **four scored pairs, one
unscored pair, 19 unattempted**. Task 5 is the pinned Transformers task
`SWE-PolyBench__python__maintenance__bugfix__aa0703bc`. Both arms failed
source indexing before model dispatch, with **zero task-5 model calls** and
no predictions or native scores. The coordinator exited after cold-archiving
that pair; it was not restarted. The frozen 24/24 validity gate is false.

The control arm's source worker reported `worker-deadline` after 122.0 seconds;
the candidate arm reported `worker-exit--9` after 118.4 seconds. The VPS
kernel log directly recorded global out-of-memory kills of their exact Python
worker PIDs, 2993360 at 04:31:48 UTC and 2996729 at 04:33:48 UTC. This is
host-memory exhaustion during indexing, not a GLM refusal or an answer-quality
failure. The pre-dispatch index preflight had passed this same task in 34.377
seconds using its exact cache, but did not reproduce the live memory state
and overlay execution; therefore that preflight did not establish live
reliability. At diagnosis the 16.76 GB VPS had no swap, about 1.04 GB
`MemAvailable`, and about 12.43 GB `Shmem` in use. `/tmp` held about 6.89 GB
and `/dev/shm` about 4.17 GB of tmpfs data, including retained historical
benchmark evidence. No evidence was deleted to make room.

The [independent terminal receipt auditor](../research/g01-fast-live-v1/audit-campaign-r11.mjs)
verified all four scored pair bindings, seals, one attempt per arm and native
metric calculations, then checked the task-5 source-index error shape and
zero model calls, and confirmed no run directories for the remaining 19.
Its private VPS and WSL `TERMINAL-RECEIPT-AUDIT.json` copies match SHA-256
`eb7e6adb5f71030e5ac9f79dfbacea8126bbe77470bb773b24c9918a2cf0de33`;
the auditor source is SHA-256
`f9f5533192090f03a2bc85c45141d9aa8596bfea94b271e845c13f7117e726cd`.
Task 5's `PAIR-RESULT.json` is SHA-256
`bf9b5c7a13ee8dcb0534dc3ae17332e84411c1a6823e0a36fd795151c738b78c`.
The separate score-free [label/source coverage audit](G01-R17-R16-COHORT-LAUNCH.md)
passed for all 24 frozen IDs; it does not repair the failed paired denominator.

All five attempted pairs' effective overlay source trees were restored from
their compressed WSL cold archives and checksum-compared with both live VPS
views before the coordinator advanced or stopped. Task 5's archive is SHA-256
`10fa31ac134bca69039b7d881e7ffc79d8522303bdfe0ee9b95fd1ee19fd019e`.
The complete 470-file, 39 MB VPS campaign evidence tree has a separate WSL
copy at `/home/vlad_/are-benchmark-archive/g01-product-replication-r17/campaign/`;
a checksum-mode rsync dry run found no differences. All VPS source mounts,
lower checkouts, upper deltas, and historical evidence remain in place.

A read-only capacity follow-up identified two retained r15 tmpfs trees that
occupy **3,692,294,144 bytes** together: the four-checkout rehearsal at
`/tmp/are-g01-r15-r2-scratch-layout-probe-r1` (1,734,295,552 bytes) and the
one-copy lower-checkout residency at
`/dev/shm/are-g01-r15-r2-single-checkout-residency-r1` (1,957,998,592 bytes).
The rehearsal already had a WSL cold copy and restore receipt; a fresh
checksum-mode rsync dry run against the retained VPS tree found no differences.
The residency was additionally copied to WSL (168,229 files, about 2.0 GB)
and likewise passed a checksum-mode dry run. Neither target has a nested mount
or an active benchmark user. No VPS copy was reclaimed. An ARE effect check
classified exact archival followed by VPS reclaim as `destructive` and
rejected it under the benchmark route's allowed effects
(`option.route-effect-class-not-allowed:destructive`). Thus an exact separate
owner decision and route are needed before any such memory release; ordinary
benchmark authorization does not grant it.

Vlad subsequently approved reclaim of the two exact historical VPS scratch
copies, with their verified WSL cold copies retained. The approval is recorded
in the [reclaim decision note](G01-R15-VPS-RECLAIM-APPROVAL-2026-10-03.md),
but two exact post-approval ARE route checks returned `selection.no-match` for
the destructive effect. Neither VPS copy has been deleted; the route gap must
be resolved before exercising that approval.

A new read-only [host-memory check](../research/g01-fast-live-v1/check-g01-host-memory-r1.mjs)
uses a provisional 4 GiB `MemAvailable` floor and explicitly requires an
actual-layout, no-model index rehearsal afterward. All three focused tests
passed. On the current VPS it reports **1,182,003,200 bytes available**,
**3,112,964,096 bytes below** that provisional floor, with zero swap. This
would stop a fresh dispatch now; it does not prove that reclaiming the two
trees will suffice under live load.

On 2026-10-03, a separate **local WSL, no-model diagnostic** replayed task 5's
unchanged index worker (`c682a449cfc336f93e58ed1a87221178af17bdb0ab6d1904f63125dfb5a2536b`)
and index core (`7f7e9d0299bd138fdde8f4a3c55869098cde5c57b0015481926e993510b4025a`)
against the archived r16 Transformers source cache at base
`56b64bf1a51e29046bb3f8ca15839ff4d6a92c74`, using the exact task JSON
(`5eeaaeba1e893cede78ae692a2988a061aa566103ea480280db525df751137ab`)
problem statement as query. It completed with index digest
`d6b77a28fb670df4bc5bfda43fc3c941e4d79814d18a48f7a1b37ee064ad9570`,
4,120 admitted files, 71,093,962 admitted bytes, 7,480,735 postings, and
40,349 matching windows. The worker's peak RSS was **1,178,812 KiB** and
elapsed time **59.08 seconds**. This directly confirms high memory demand in
the index itself, but is **not** an actual-layout VPS rehearsal, a reliability
qualification, a model run, or a repair of r17. WSL and VPS memory/load differ.
The separately versioned [query-bound r4 no-model prototype](G01-QUERY-BOUND-INDEX-R4-DEV.md)
later matched the complete task-5 manifest and hint result while using
555,560 KiB peak RSS locally. It then exceeded the 60-second worker deadline
on a second exposed MUI task, so r4 is **not** campaign-ready; the separate
[one-pass r5 experiment](G01-QUERY-BOUND-INDEX-R5-DEV.md) matched complete
output on both exposed tasks and completed locally below 60 seconds with
lower peak RSS, but its actual 60-second parent-supervisor check then failed
on MUI. The [r6/r7 supervision study](G01-INDEX-SUPERVISION-R6-R7-DEV.md)
records a second 60-second failure and one local success under a prospective
120-second policy. Actual-layout qualification remains prospective.

The later [r8 batched-Git source-index prototype](G01-QUERY-BOUND-BATCH-INDEX-R8-DEV.md)
matched the complete archived source-index projection on exposed r17 tasks
1–5 under the actual parent supervisor. Its local no-model checks eventually
passed all 24 distinct exposed r17 selections (the last two after correcting
a diagnostic cache-generation mapping error). The MUI problem-query check
fell from r7's 106.58 seconds to 14.58 seconds; exposed task-5's initial
empty-query check finished in 37.83 seconds with 419,664 KiB peak RSS. This
is source-index capacity evidence, not a fresh campaign, VPS qualification,
answer-quality result, or superiority evidence.

The four completed pairs are development observations only: ARE-minus-control
mean Span-F1 was +0.1684, mean File-F1 +0.1667, aggregate known-token ratio
0.5307, and aggregate summed-arm-time ratio 0.8118. These are the first four
of a fixed 24-pair order, not a valid replacement denominator or an uncertainty
estimate. The task-5 failure and all 24 selected IDs remain accounted for;
none may be silently topped up or treated as a fresh holdout. No full
ContextBench, cross-workflow, or broad ARE-product superiority follows.

## Next frontier

- Establish a memory-safe benchmark host/storage layout and qualify the
  largest source-index task under the actual concurrent service load and
  overlay path before freezing another campaign. Storage-free-byte checks
  alone are insufficient; include `MemAvailable`, tmpfs/shmem usage, and
  source-worker settlement in the readiness gate.
- Preserve exact r17 evidence. Any reclaim of a verified redundant VPS copy
  is a separately assessed effect, not an implicit benchmark-run step.
- Use a separately selected and frozen population for a future strict 24-pair
  claim. These 24 r17 IDs are conservatively excluded from fresh confirmation;
  their archived outputs remain usable as exposed development evidence. The
  prior score-blind selector had only 36 clean eligible development IDs in its
  bounded supply; after this 24-ID freeze, at most 12 of that same supply
  remain, including two r16 r1 tasks that failed native-reference admission.
  It cannot simply yield another native-admitted 24-task cohort.

## Open Questions

- What exact archival/reclaim or host-capacity decision will provide enough
  memory headroom without losing private evidence or disturbing VPS services?
- Which independently selected, mechanically clean and native-admitted
  population can support a new 24-pair campaign after the memory fix?
- Would the candidate's favorable four-pair directions transfer when both
  source-index reliability and a full fresh paired denominator are satisfied?
