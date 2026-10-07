# G02 no-archive discovery — exposed-task near miss, rejected

This treatment-only JavaScript screen removed discovery-time archive retention
from the source-diverse 32-call candidate. Direct source reads and the
observed-read recovery tool remained available. The credential was verified
again after the user's update with a tokenizer HTTP 200 response; the key was
not printed or retained in this evidence.

The run produced a valid native selection in 23 model calls, 257,855 known
model tokens, zero unknown-usage requests, and 213.77 seconds. It made 13
direct file reads, nine searches, one file listing and no archive recoveries.
Native Span-F1 was `0.5186939514` versus the pinned DSH row's
`0.3960750270`; File-F1 was `0.3846153846` versus `0.4000000000`.
ARE used 46.53% fewer model tokens and 4.31% less wall time than that row.
The [native screen](native-screen/screen.json) correctly rejects the candidate
because File-F1 misses the predeclared joint gate.

The [receipt archive](G02-NO-ARCHIVE-R1-RECEIPTS.tar.gz) has SHA-256
`650010202001636cb5317c0dd1192390733aa8972fce8395be07e26c79c67dd8`.
It retains the exact task, code, transport ledger, events, and settlement but
excludes source checkouts and credentials. Full VPS run:
`/opt/are-benchmark-runs/g02-no-archive-r1`.

Decision: reject, retain as the current best exposed-task source-exploration
signal. A follow-up tests whether a direct-evidence-only terminal instruction
can remove analogy/background file selections without losing Span-F1 or the
efficiency advantage. No fresh matched or full-cohort claim follows.

## Open Questions

Will terminal precision improve without losing covered spans? Does the
no-archive behavior generalize to a fresh task and a larger cohort?
