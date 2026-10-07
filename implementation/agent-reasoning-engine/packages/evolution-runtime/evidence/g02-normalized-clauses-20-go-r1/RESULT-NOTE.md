# G02 normalized 20-call Go diagnostic — quality still failed

This treatment-only replay used the already-exposed Go task `05aad678`.
It kept the normalized twenty-hint acquisition unchanged and raised the
maximum model calls from sixteen to twenty. The first captured request
contained the intended hints.

ARE completed valid native selection in 19 model calls, 179,519 known model
tokens, zero unknown-usage requests, and 140.01 seconds. Span/File-F1 was
`0.2277520621`/`0.5555555556`, below the same-task DSH control's
`0.2571044676`/`0.7368421053`; DSH used 648,011 tokens and 298.07 seconds.
The [native screen](native-screen/screen.json) rejects both quality gates.
More calls alone did not close the acquisition gap.

[Receipt archive](G02-NORMALIZED-20-GO-R1-RECEIPTS.tar.gz) SHA-256:
`e2fba8d11112682ac1cc4650ccb342c6d0eeec8f685490da28e0311e95769883`.
It excludes source checkouts and credentials. VPS run root:
`/opt/are-benchmark-runs/g02-normalized-clauses-20-go-r1`.

Decision: reject. A source-neighborhood mechanism, not further call-budget
relaxation, is the next testable hypothesis.

## Open Questions

Can deterministic source relationships surface schema and implementation
neighbors within the first prompt without increasing model-call cost?
