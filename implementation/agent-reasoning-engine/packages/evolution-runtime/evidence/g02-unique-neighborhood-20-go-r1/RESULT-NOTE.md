# G02 unique paths and source neighbors — exposed Go quality failure

This treatment-only screen used the now-exposed Go task `05aad678`. The
candidate changed the pinned base ranker to return unique paths per query,
then used tracked-file relationships to surface sibling implementations and
matching schema contracts. An offline, gold-free check placed
`internal/oci/file.go` and both `config/flipt.schema.*` files in the initial
twenty hints. The first captured model request contained that primer.

ARE completed valid native selection in 18 model calls, 150,423 known model
tokens, zero unknown-usage requests, and 183.01 seconds. Span/File-F1 was
`0.2521071234`/`0.5555555556`, below the same-task DSH control's
`0.2571044676`/`0.7368421053`; DSH used 648,011 tokens and 298.07 seconds.
The [native screen](native-screen/screen.json) rejects both quality gates.
ARE did read and select both schema files, demonstrating some behavioral
effect, but did not read `internal/oci/file.go` and lost other relevant files.
Hints alone remain too unreliable for coverage.

[Receipt archive](G02-UNIQUE-NEIGHBORHOOD-20-GO-R1-RECEIPTS.tar.gz) SHA-256:
`921ed5bfae5aff29daabf217b31f8f1ca6e91483a87cc53c868ddadd9ad2fce4`.
It excludes source checkouts and credentials. VPS run root:
`/opt/are-benchmark-runs/g02-unique-neighborhood-20-go-r1`.

Decision: reject. The next mechanism should deliver a bounded, provenance-
bound source-neighborhood packet rather than merely listing additional paths.
That packet must count in input-token and wall-time accounting and retain
native read-ID integrity before any comparative claim.

## Open Questions

Can a single bounded initial source packet improve coverage and native
quality without spending away ARE's large token/time advantage?
