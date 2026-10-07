# G02 r11 call-ten final-selection visibility — exposed diagnostic

The previous [call-cutoff coverage audit](G02-R11-CALL-CUTOFF-COVERAGE-EXPOSED-2026-10-03.md)
found no new gold delivered after call ten, but did not establish whether
ARE's eventual selected files were even visible at that point. The separate
[evaluator-only visibility audit](../research/g02-product-r4/audit-g02-r11-cutoff-selection-visibility-r1.py)
reconciled all 12 archived r11 transport ledgers, event streams, source
delivery seal, pair identities, and final prediction files. It compared the
final selected path set with the initial packet plus successful search/read
observations through model step nine. No truncated episode, provider call,
or native scorer was run.

The write-once private receipt is
`/home/vlad_/are-benchmark-archive/g02-r11-cutoff-selection-visibility-r1-20261005/AUDIT.json`,
SHA-256 `11bc43d6330385f2245560a493e9fa4c9ee0fcb94e0cacfe20f6b77843efeb04`.
Eleven of twelve tasks already had **all** eventual selected paths visible
by call ten. Across all tasks, **32/33** final selected paths were visible;
the single late path was on task 8. Eight tasks had more than ten actual
model calls. The predeclared feasibility gate—at least ten fully visible
tasks and no more than two missing selected paths—passed.

This is a *path-visibility bound*, not realized cost savings or quality
preservation. A finalizer still needs to choose the correct files and spans
from the visible evidence, consume its own tokens/time, emit a valid selection,
and pass native scoring. The previous task-8 12-call rerun never emitted a
`finalization-start` event and scored zero, so merely lowering the call cap
is not a qualified fix. A next exposed test would explicitly enter a bounded
finalization stage at call ten, first on the first source-order task with
more than ten calls, with an actual receipt and full File-/Span-F1 and cost
accounting. No fresh G02 cohort or superiority claim is opened by this audit.

## Open questions

- Can an explicitly invoked finalizer reproduce quality from the call-ten
  evidence and fit below matched DSH cost after its own call?
- Does a source-observable stagnation trigger outperform a fixed call count
  on independent paired cases?
