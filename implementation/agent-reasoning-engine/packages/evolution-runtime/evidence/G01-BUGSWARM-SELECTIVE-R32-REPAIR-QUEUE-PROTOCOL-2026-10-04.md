# G01 BugSwarm selective-GLM r32 — score-blind replacement queue

Status: fixed before queue construction or new network access. R29 and r31
authenticate 15/24 original r28 rows. The unresolved slots are Python ordinals
5, 6, 7, and 12 and Java ordinals 15, 18, 19, 21, and 22.

Bind:

- r28 metadata census SHA-256
  `f4aead7a1201f114fe89d6da36226c4aeab5f4712f6114d1165632f9b2f2258a`;
- r29 result SHA-256
  `f3d63d9c43467d0e8ba13055e5207206269a6be17978cdd8da58018154460017`;
- r31 result SHA-256
  `6238f34ef6698dcce62874d19f1177e55e6b8c33f114b154893606fc45d1dbb0`;
- unchanged metadata eligibility SHA-256
  `ac7f77088a4256285b0d733c666ab45e161e2fbd364cb0a3bb3c9b14bec3422e`.

Reconstruct all 180 exclusions sealed by r28, then exclude all 24 r28 selected
repositories. For each language, begin strictly after the r28 sealed
language-specific source-order floor: Python position 467 and Java position
1350. Walk the pinned BugSwarm failure-side order and retain every remaining
metadata-eligible candidate in a previously unseen repository. Preserve exact
source position, image tag, failed job ID, and failing commit.

Seal the complete queues before any request. Do not inspect logs, source,
patches, labels, rankings, outputs, or scores during queue construction. The
next separately frozen runner may consume each language queue in order until
its fixed failed slots are filled. It must preserve every attempt and may not
reuse a repository even when an attempt fails.

If either queue contains fewer candidates than its fixed failed-slot count,
stop with a terminal metadata shortage rather than shrinking the denominator.

## Open Questions

- How many Python and Java candidates remain after 204 expected conservative
  repository exclusions?
- How many ordered attempts will be needed to restore 24/24 source/log
  availability?
