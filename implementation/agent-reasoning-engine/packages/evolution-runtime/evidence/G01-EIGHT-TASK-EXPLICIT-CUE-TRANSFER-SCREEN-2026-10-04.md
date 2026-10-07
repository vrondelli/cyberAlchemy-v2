# G01 explicit-file cue transfer opportunity — eight-task development set

Status: **source-only diagnostic, no gold or model use**. The eight-task
development-transfer candidate remains unfrozen and unscored. Its separate
native-reference admission was 8/8 tasks and 20/20 files; that says nothing
about this cue's relevance or benchmark performance.

The [score-blind screen](../research/g01-fast-live-v1/screen-g01-eight-task-explicit-cues-r1.py)
applied the same exact tracked-path/unique-basename rule used in the exposed
r17 cue study to all eight pinned issue statements and exact Git base trees.
It bound candidate SHA-256
`a134c8f7df6f4165c4053576365ccfb03d2c8b2c2d57d7dcf1a21848ec3bc0a2`
and wrote a private source receipt at
`/home/vlad_/are-benchmark-archive/g01-eight-task-explicit-cue-screen-r1-20261004/SOURCE-SEAL.json`,
SHA-256 `9381e29e6da50606983208a4c58a377be98caa999d5bedc2144dab56abe2b568`.

The rule found **five resolvable candidates across four of eight tasks**:
three Django tasks mention `manage.py`, one of those also mentions
`exception.py`, and one Transformers task mentions `configuration_auto.py`.
The other four tasks yielded no resolvable source filename. These are
*opportunities*, not gold hits: `manage.py` may be a traceback entry point
rather than the defect location, and no reference label was opened to decide.
This screen therefore does **not** validate transfer of the exposed four-task
Span-F1 gain. It indicates that an explicit-filename-only strategy cannot
cover at least half this development set and must be an opt-in aid within a
broader discovery mechanism, with false-cue filtering and abstention.

## Source-only r8 top-five overlap

A separate [bounded overlap audit](../research/g01-fast-live-v1/audit-g01-eight-task-cue-index-overlap-r1.py)
ran the r8 query-bound index on the same eight pinned base commits and issue
statements, then compared only its returned top-five paths to the already
sealed filename cues. It did not open native gold, model answers, or the
reserved-confirmation partition, and made zero GLM/VPS calls. Its private
write-once result is
`/home/vlad_/are-benchmark-archive/g01-eight-task-cue-index-overlap-r1-20261004/RESULT.json`,
SHA-256 `a6fc62122acebe658fdb0d5299a35b60c30faaae35adae87a668b19717bb56ba`.
The query policy used the decoded issue statement, capped at 4,096 UTF-8
bytes; only task 8 lost 634 trailing bytes, and it had no resolved filename
cue.

All **8/8** local source-index calls settled without force. Of the **five**
resolved cues across four tasks, **one** was already among the index's
top-five paths and **four** were outside them, one on each of the four
cue-bearing tasks. The longest local call was **15.664 s** and the largest
worker RSS was **345,876 KiB**. Thus an opt-in cue path can add source-only
*candidate coverage* beyond r8's first five hints. Whether any added path is
correct, improves confirmed native reads or Span-F1, or is worth its budget
remains unknown. In particular `manage.py` may be a generic traceback entry
point. Do not promote this cue or open the eight native labels without a
predeclared integrated mechanism and score rule.

The four outside-top-five occurrences are **not four distinct opportunities**:
three are the same `tests/i18n/sampleproject/manage.py` path on three Django
tasks, and only one is `src/transformers/models/auto/configuration_auto.py`.
The fifth cue, `django/core/handlers/exception.py`, was already in r8's top
five. The apparent coverage gain is therefore concentrated in a repeated
sample-project entry point, not a diverse set of defect-source candidates.
This source-only observation is sufficient to reject an **unconditional**
"always read every outside-top-five filename" policy before spending GLM
calls or opening the eight native labels. It does not determine whether the
remaining Transformers path is gold or qualify a narrower policy.

No eight-task provider call, source read, evaluator score, label inspection,
or reserved-confirmation access occurred here. Preserve the set for a
predeclared integrated mechanism rather than tuning on its private gold.
The current VPS remains below the provisional 4 GiB `MemAvailable` floor
for the full G01 runner; this source-only screen does not waive that gate.

## Open Questions

- Can the standard ARE episode retain a source-cued native read as confirmed
  delivery without sacrificing its own broader discovery and all-in budget?
- How should the system suppress generic traceback entry points while still
  surfacing actual defect files?
- What distinct 24-task population can establish a full superiority gate
  after development qualification, without opening the reserved partition
  prematurely?
