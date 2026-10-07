# G02 demand-mode recovery — rejected

This exposed JavaScript screen changed only `recovery_visibility` from eager
to demand in the 32-call diverse-primer candidate. The model explicitly
opened recovery, then made 46 `recover_archived_read` calls. It sealed a valid
selection in 31 calls, 90,404 known model tokens, zero unknown usage and
186.86 seconds. Native Span/File-F1 was `0.2312801510`/`0.1904761905`,
below the pinned DSH control's `0.3960750270`/`0.4000000000`. The
[native screen](native-screen/screen.json) rejects demand mode on quality.

The [receipt archive](G02-DEMAND-RECOVERY-R1-RECEIPTS.tar.gz) has SHA-256
`195eeb86f6f6c9924d9a09a06e4880e01b2a567e138e0c7bc564e6ca85675459`.
It retains exact code, task, transport ledger, events and settlement without
source checkouts or credentials. Full VPS run:
`/opt/are-benchmark-runs/g02-demand-recovery-r1`.

Decision: reject. Hiding expanded recovery until explicitly requested did
not prevent the repetitive archive path. The next treatment-only test removes
the archive catalog from discovery entirely while retaining direct source
reads and the observed-read tool.

## Open Questions

Will exploration improve when the archive catalog is absent? Does losing the
catalog hurt source continuity after compaction, even if direct reads remain
available?
