# Exposed Flipt relationship packet screen r1b: rejected

This was an ARE-only development screen on the already-exposed Flipt issue
`1177cd53`. The pinned DSH row is in
[the fresh pair](../g02-fresh-component-1177-r1/RESULT-NOTE.md). The preceding
r1 launch stopped at Docker exit 125 before any model call because a new helper
mountpoint was absent in the read-only snapshot. R1b inlined that same helper
into a hash-pinned ranker overlay and completed normally.

R1b delivered eight receipt-bound pinned-base reads: three ranked code reads,
three neighbors (including two schemas at line 1), and the issue-derived
default and advanced-fixture reads. Native Span/File-F1 was
`0.49428`/`0.61538` in 150,496 known model tokens and 171.77 seconds. The
fresh DSH row scored `0.54523`/`0.71429` in 773,892 tokens and 437.36
seconds. ARE improved over its prior `0.47204`/`0.50000` fresh-pair treatment,
but still lost both quality gates. **Reject; no promotion.**

The model retained the default file, but not either schema or the advanced
fixture in its final context. A label-free, post-run focused-packet replay
added the confirmed fixture and scored `0.50076`/`0.66667`; this too missed
DSH and is not prospective evidence. The next screen corrected the schema
line ranges in the acquisition packet; see
[r2](../g02-source-relations-1177-r2/RESULT-NOTE.md).

Evidence: [run result](result.json), [prediction](prediction.json),
[native score](native-score.json), [offline focused score](offline-focused-score.json),
[settlement](SETTLEMENT.json), and [receipts](receipts.tar.gz). The receipt
archive SHA-256 is
`cbbdbb9c61cb05c856ae0821d15325f33f5fd2b79adb115c513059197cac705a`;
it excludes source checkouts and secret files.

## Open Questions

- Can the runtime select relevant configuration-contract evidence without
  hurting span precision or requiring repeated model calls?
