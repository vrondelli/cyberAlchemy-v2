# G02 diverse primer, 32 calls — rejected

The exposed JavaScript task was screened with the same source-diverse primer
as the 16- and 24-call tests; only the maximum call count rose to 32. The
worker sealed a valid selection in 31 calls, 91,137 known model tokens, zero
unknown usage and 201.98 seconds. Native Span-F1 was `0.3324723389` and
File-F1 `0.2000000000`, still below pinned DSH `0.3960750270` and
`0.4000000000`. The [native screen](native-screen/screen.json) rejects it.

The result used only two selected files. Its trace has 22
`recover_archived_read` results with just three distinct outputs, plus six
direct reads and eight recovery-page listings. More calls improved Span-F1
from the 24-call result, but did not preserve File-F1; the 201.98-second wall
time is already close to DSH's 223.41 seconds. Raising the cap further is not
the next efficient hypothesis.

The [receipt archive](G02-DIVERSE-CALLCAP32-R1-RECEIPTS.tar.gz) has SHA-256
`2645672f2f65226928413fd24fc16fbff8679e8a37ef025f84940a3d10a9548f`.
It retains exact overlays, task, events, transport ledger and settlement,
excluding source checkouts and credentials. Full evidence remains at
`/opt/are-benchmark-runs/g02-diverse-callcap32-r1` on the VPS.

Decision: reject the simple call-cap sweep. Next hypothesis should address
repeated recovery and source exploration directly, while keeping a bounded
time/token comparison against the pinned valid DSH row.

## Open Questions

Why does the model repeatedly recover the same three outputs and settle on
only two source files? Can a compact receipt-bound visited-evidence view
redirect exploration without hiding evidence needed after compaction?
