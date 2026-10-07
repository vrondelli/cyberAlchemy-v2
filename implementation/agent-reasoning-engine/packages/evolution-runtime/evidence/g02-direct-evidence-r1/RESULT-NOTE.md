# G02 direct-evidence terminal instruction — rejected

This treatment-only screen kept the no-archive source-exploration profile and
added an opt-in terminal instruction to omit files read only as analogies or
background. The same exposed JavaScript task, pinned image, source-only task
record, native scorer, and DSH comparator were used. No control rerun or
gold-informed generation occurred.

The run settled normally with a valid selection in 20 model calls, 257,326
known model tokens, zero unknown-usage requests and 189.89 seconds. Native
Span/File-F1 was `0.4111782300`/`0.3846153846` against the pinned DSH row's
`0.3960750270`/`0.4000000000`. The [native screen](native-screen/screen.json)
rejects it on File-F1. Compared with the preceding
[no-archive candidate](../g02-no-archive-r1/RESULT-NOTE.md), Span-F1 fell
from `0.5186939514` while File-F1 did not improve. The final file set changed,
but the instruction did not deliver the needed precision gain.

The [receipt archive](G02-DIRECT-EVIDENCE-R1-RECEIPTS.tar.gz) has SHA-256
`b9ad63d1e00a78548308f27fcb20c8b0594c3e16745a3c867d5b60daaaf5198f`.
It includes the exact code, task, transport ledger, run events and settlement,
excluding source checkouts and credentials. Full VPS run:
`/opt/are-benchmark-runs/g02-direct-evidence-r1`.

Decision: reject. Do not promote either exposed-task G02 candidate. The next
G02 step should be a materially different source-acquisition or selection
mechanism with a prospective task gate, not another wording-only replay of
this exposed task.

## Open Questions

Which missing source paths explain the remaining native file gap? Can a
mechanism improve both file and span coverage on a fresh, untouched task?
