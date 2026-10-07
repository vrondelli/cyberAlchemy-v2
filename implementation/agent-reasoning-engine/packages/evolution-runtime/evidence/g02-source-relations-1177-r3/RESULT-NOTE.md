# Exposed Flipt deprecation-closure screen r3

R3 delivered eleven receipt-confirmed pinned-base reads on the already-exposed
`1177cd53` task, including the source-only cache, database, and UI
`deprecations` methods. The live model selected schemas and defaults but
omitted the database and UI methods. Native Span/File-F1 was
`0.51131`/`0.66667` in 183,327 model tokens and 222.62 seconds, below the
pinned DSH row's `0.54523`/`0.71429`. **The live screen is rejected.**

The pre-existing, label-free [component packet selector](../../../../benchmarks/contextbench-v1/component-packet-selection.mjs)
was replayed *after* this run. It added three receipt-confirmed focused reads
(advanced fixture, database, and UI) without another model call. The replay
scored Span/File-F1 `0.55073`/`0.80000`, above the same-instance DSH row,
while retaining the 183,327-token/222.62-second model cost. This is an
exposed-task diagnostic, not a fresh win or promotion. It justified freezing
the combined packet-plus-selector candidate before an untouched pair.

Evidence: [frozen screen](../g02-source-relations-1177-r2/NEXT-SCREEN-R3-FREEZE.json),
[run result](result.json), [live prediction](prediction.json),
[live score](native-score.json), [selector receipt](offline-focused-selection.json),
[replay score](offline-focused-score.json), [settlement](SETTLEMENT.json),
and [receipts](receipts.tar.gz). Receipt archive SHA-256:
`4d040e129a7ccac6423f9ac2b4fda6acaba18a1b145e39868bb43a13307d8c12`.
The archive excludes source checkouts and secret files.

## Open Questions

- Will the combined rule improve both native metrics on another, untouched
  configuration-deprecation task?
