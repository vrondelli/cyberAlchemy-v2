# Exposed Flipt relationship packet screen r2: rejected

R2 changed only source-only acquisition: the two schemas were read around
their tracing/Jaeger definitions instead of line 1. The eight-read packet was
receipt-confirmed on the pinned base. The model nevertheless omitted both
schemas and the default file from its final context.

| Arm | Span-F1 | File-F1 | Known model tokens | Wall seconds |
| --- | ---: | ---: | ---: | ---: |
| R2 ARE live | 0.50902 | 0.56000 | 213,018 | 193.69 |
| Pinned fresh DSH | 0.54523 | 0.71429 | 773,892 | 437.36 |

R2 missed both strict quality gates; **reject and do not dispatch a fresh
control for this candidate**. A label-free post-run selector added two focused
packet reads and scored `0.51510`/`0.61538`. An additional offline replay
selected the two confirmed, component-matching schema reads and scored
`0.52582`/`0.71429`. File-F1 merely tied DSH while Span-F1 remained lower.
Neither offline replay is a live or prospective benchmark result.

The exposed-task evidence now separates the failure: source acquisition
delivered useful defaults, schema, and fixture content, but final selection
discarded much of it; even a conservative receipt-bound restoration does not
clear the joint quality gate. Further live repeats of packet wording or
range tuning on this task are low-value. The next hypothesis must improve
span localization and issue-wide final evidence selection together, and then
be tested on a different untouched matched task if its exposed screen passes.

Evidence: [freeze](../g02-source-relations-1177-r1b/NEXT-SCREEN-R2-FREEZE.json),
[run result](result.json), [prediction](prediction.json), [native score](native-score.json),
[offline focused score](offline-focused-score.json),
[offline contract score](offline-contract-score.json),
[contract selection receipt](offline-contract-selection.json),
[settlement](SETTLEMENT.json), and [receipts](receipts.tar.gz). The receipt
archive SHA-256 is
`0927f35993df698e976623f731208e02b686f2a88643777c4d756af28070f539`;
it excludes source checkouts and secret files.

## Open Questions

- Which source-only signal can select responsible spans across a broader
  configuration change without adding irrelevant context?
- Can that signal retain ARE's large token/time advantage on an untouched task?
