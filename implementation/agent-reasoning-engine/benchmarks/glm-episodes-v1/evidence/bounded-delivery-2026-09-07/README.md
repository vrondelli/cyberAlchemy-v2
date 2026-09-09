# Bounded-delivery live pilot — 2026-09-07

Candidate evidence, authority effect none. [Frozen manifest](manifest.json),
[result](result.json), [arm receipt](arm-0/completed.json), and
[visible trace](arm-0/visible-trace.json) preserve the pre-EOF-fix trial.

Clear-v1 used bounded-reads-v1: **four required files read exactly once and
fully delivered**, on distinct turns; two recycles; five nonempty archive
responses delivered after recycling. Continuity passed. Nine successful read
results were confirmed delivered, with none unknown or undelivered. This
contrasts with the earlier legacy clear trial's 24 reads and zero successful
archive recovery, but multiple changes and one sample prevent causal attribution.

There was **no patch candidate**. After identifying the intended structural
comparison repair in its visible response, GLM requested offset 448 on a source
whose total length was 448. The new reader treated exact EOF as a fatal range
error. The run stopped before v2: 10 model attempts, 12 tokenizer attempts,
36,993 input tokens, 461 output tokens, 78.614 seconds for the arm. All recorded
request projections remained below the 8,000 soft threshold with output reserved;
provider internal compaction remains unobservable. Local pretrial suite: 257 passed.

## EOF correction and continuation boundary

The preserved source manifest predates the correction. Exact EOF now returns
an empty successful page with `eof:true`; offsets beyond EOF still fail. Empty
pages cannot satisfy meaningful archived-evidence delivery. The 448-character
regression and eight other archive checks pass. This removes an overly strict
paging failure; it does not weaken archive ownership or hash validation.

The failed clear arm was not replayed. The [untouched v2 continuation](v2-eof/result.json)
used a [new source manifest](v2-eof/manifest.json) after the EOF correction and
passing tests/review. It stopped on a **tokenizer HTTP 500** after three model
attempts and four tokenizer attempts. Three files were read; two original bodies
were confirmed delivered. The third body was not sent to the model because its
request could not be measured. No fourth model request was dispatched, no
recycle occurred, and no patch was proposed. No automatic retry was made.

Both intended retention arms have now been attempted, across explicitly different
source versions. Aggregate: **13 model / 16 tokenizer attempts**, within the
original 24/48 caps. No verified repairs and no reliable policy comparison.
The corrected EOF behavior is covered locally; live repair completion remains
unverified because the v2 provider failure occurred earlier in the task.

Local validation after the EOF correction: 260/260 combined tests. A subsequent
CLI selector guard fix passed all 17 runner checks, including one new regression
(261 distinct checks across the current validation). Source changes are pinned
in the corresponding manifests; earlier 257-test evidence remains preserved.

## Construction outcome and next boundary

Implemented: opt-in bounded read scheduling, exact-dispatch delivery metrics,
unknown-delivery accounting, structured owned-archive recovery, newest-complete-
exchange fallback under strict measurement, and explicit successful EOF pages.
Default delivery remains legacy-v1 and default retention remains clear-v1.
Kite has no live integration here. Heldout/dev corpora were not used.

The next live task is a new source-frozen scorer pair after the provider tokenizer
is healthy, with the corrected runtime identical in both arms. It must have its
own budget and preserve these failures; no automatic provider retry was added.
After verified repair success, expand to the untouched retention repair and a
controlled repeated comparison. EOF acknowledgments never count as meaningful
archive recovery, and local admission still cannot prove provider-internal
compaction did not occur.

## Open Questions

- Does explicit EOF let the model finish the repair instead of paging again?
- Will v2 complete the untouched arm under the same hard/soft window limits?
- Can a later repeated, controlled trial separate the bundled interventions?
