# G01 BugSwarm selective-GLM r33 — rebalanced successor admission

Status: fixed before new network access. This is a new 24-repository population
definition because r32 proved that the original 12-Python/12-Java r28
denominator cannot be restored under its repository-disjoint rules.

Bind the r32 score-blind queue at SHA-256
`42fa759dc368d5b0c88a3029474ca36ebce75c0e7a57352a7eaa1131485d225e`,
the r29 result at SHA-256
`f3d63d9c43467d0e8ba13055e5207206269a6be17978cdd8da58018154460017`,
and the r31 result at SHA-256
`6238f34ef6698dcce62874d19f1177e55e6b8c33f114b154893606fc45d1dbb0`.

Retain the fifteen original r28 rows already authenticated by r29/r31. Preserve
their ordinal positions. Fill the remaining positions as follows:

- Python queue fills original Python positions 5, 6, 7, and 12, then the two
  availability-reallocated positions 21 and 22;
- Java queue fills positions 15, 18, and 19;
- original positions 21 and 22 cease to be Java strata in this successor.

The target is exactly 14 Python and 10 Java repositories. Consume each
language queue in its sealed order. A failed candidate is permanently consumed
and retained as evidence; continue to the next candidate of the same language.
Because only three Java candidates remain, any Java failure makes the exact
14/10 successor terminal. Do not silently reallocate another Java position or
shrink the denominator.

For each candidate, use one corrected HTTPS source HEAD, one bounded BugSwarm
page-prefix GET with exact identity, one corrected raw-log HEAD, and—only when
those pass—one no-redirect Python-standard-library raw-log GET capped at the
declared length plus one byte. Require exact HTTP identity, declared length,
complete body, strict UTF-8, and no retry. Preserve every header, body or
partial body, decision, and final slot binding privately in WSL.

The gate passes only when all nine replacement positions are filled, all final
repositories are unique and disjoint from the 204 exclusions, and the final
population is exactly 24 rows, 14 Python and 10 Java. No labels, passing source,
patches, rankings, provider calls, model outputs, or scores may be accessed.

## Open Questions

- Will all three exhausted-tail Java candidates pass exact source/log
  admission?
- How many Python attempts will fill the six fixed Python positions?
- If this successor passes, will the prospective ARE/graph disagreement rate
  yield material GLM savings before any gold access?
