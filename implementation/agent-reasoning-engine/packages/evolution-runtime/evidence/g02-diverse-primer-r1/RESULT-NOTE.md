# G02 diverse primer, 16 calls — rejected

The source-diverse primer was tested treatment-only on the now-exposed
JavaScript confirmation task. It kept the model, task, pinned commit,
16-call profile, scorer and 25K finalization reserve fixed; only the initial
ranked hints changed. The eight hints included notification and topic
JavaScript modules rather than only the former template-heavy ranking.

ARE sealed a valid selection in 15 calls, 47,471 known model tokens, zero
unknown usage and 123.81 seconds. Native Span-F1 was `0.0479225685` and
File-F1 `0.3076923077`, versus the pinned DSH control's `0.3960750270` and
`0.4000000000`. The [native screen](native-screen/screen.json) therefore
rejects this hypothesis despite its cost advantage. The trace includes only
two direct `read_file` results and 19 archive recoveries. Improved hint
diversity alone did not make the 16-call path read and select enough source.

The [receipt archive](G02-DIVERSE-PRIMER-R1-RECEIPTS.tar.gz) has SHA-256
`5e17720319adf63c7297f7e54782b063f5a58182169affd1c988bcbef48e0ae9`.
It includes exact code, task, generation events, transport ledger and
settlement; source checkouts and credentials are excluded. The full run is
retained at `/opt/are-benchmark-runs/g02-diverse-primer-r1` on the VPS.

Decision: keep the diverse primer as a diagnostic branch, but do not promote
it. The next test should keep this primer and raise only the call limit to
learn whether premature finalization is the dominant remaining constraint.

## Open Questions

Can a still-bounded call limit recover native quality within DSH's time and
token cost? Why did a relevant primer lead to so few direct source reads?
