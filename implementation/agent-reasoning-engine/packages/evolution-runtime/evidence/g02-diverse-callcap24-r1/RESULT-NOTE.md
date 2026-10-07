# G02 diverse primer, 24 calls — rejected

On the exposed JavaScript task, increasing only the diverse-primer candidate's
call limit from 16 to 24 produced a valid selection in 23 calls, 67,810 known
model tokens, zero unknown usage and 159.88 seconds. Native Span-F1 improved
from `0.0479225685` to `0.2651138248`, while File-F1 fell from
`0.3076923077` to `0.2307692308`. Both remain below the pinned fresh DSH
control's `0.3960750270` Span-F1 and `0.4000000000` File-F1. The
[native screen](native-screen/screen.json) rejects the candidate.

The trace has nine `read_file` results, 14 archive recoveries and 13 searches;
several reads revisit the same selector template. More calls helped span
coverage, but did not eliminate repetitive acquisition or close the native
quality gap. This remains an exposed development observation, not a new pair.

The [receipt archive](G02-DIVERSE-CALLCAP24-R1-RECEIPTS.tar.gz) has SHA-256
`f300a727864e04a07533f863e27f9ab8b382d77b15c4eb05502ce03260a2241d`.
It retains the exact overlay, events, transport ledger and settlement without
source checkouts or credentials. The full run remains at
`/opt/are-benchmark-runs/g02-diverse-callcap24-r1` on the VPS.

Decision: test one 32-call step on the same exposed task before abandoning a
call-cap-only repair. The quality and wall-time gates remain unchanged.

## Open Questions

Will 32 calls cross both native quality gates before the 223.41-second DSH
wall-time bound? If not, can a compact visited-evidence policy prevent
repeated recovery and template rereads without losing useful source coverage?
