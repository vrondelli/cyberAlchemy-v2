# G01 BugSwarm selective-GLM r29 — authenticated source/log result

Status: terminal under the fixed r29 gate at 14/24 admitted. All 24 rows were
attempted once; the remaining ten require separately versioned transport or
score-blind source repair. No row was retried or replaced.

The fixed protocol SHA-256 is
`e18ea6c1c786be99f27002ee99e9c1261b0e3d5f110e8f956db2eb272a2aea7e`.
The runner `preflight-bugswarm-selective-r29.py` has SHA-256
`cccc9b0f998b5d6b7e0354899e22172aa67b732604b2a7c3c1222ddf3dbc6787`.
The private result is:

`/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/selective-r28/preflight-r29/RESULT.json`

Its SHA-256 is
`f3d63d9c43467d0e8ba13055e5207206269a6be17978cdd8da58018154460017`.

The run made 93 bounded HTTPS requests with zero automatic retries. Fourteen
rows passed exact failing-source availability, BugSwarm page identity, failed
log size, complete failed-log transfer, and strict UTF-8.

Ten rows failed:

- three exact failing-commit codeload archives returned HTTP 404: Python rows
  5 and 6, and Java row 22;
- seven rows passed exact failing-source and BugSwarm page identity, and their
  declared logs were within the 8 MiB ceiling, but the raw-log GET ended with
  curl exit 56 after only about 32–65 KiB. These are Python rows 7, 10, and 12,
  and Java rows 15, 18, 19, and 21.

The seven interrupted log transfers retained their partial bytes and exact
receipts. Their declared sizes range from 192,878 to 7,221,476 bytes. This
pattern is a transport-integrity failure, not evidence that their repositories,
page identities, or logs are absent. A separately fixed ranged-read probe is
eligible before replacing those seven rows. The three source-404 rows require
separate rename diagnosis or score-blind source-order replacement.

The sealed result records `gold_opened=false`,
`passing_source_opened=false`, `patches_opened=false`, and `model_calls=0`.

## Claim boundary

R29 proves first-pass authenticated source/log availability for 14/24 r28
rows and identifies exact failure classes for the other ten. It is not a
ranking, selective-routing, accuracy, efficiency, or superiority result.

## Open Questions

- Does BugSwarm honor bounded byte-range requests sufficiently to reconstruct
  the seven interrupted logs with exact length and whole-body SHA-256?
- Do the three codeload 404s resolve through deterministic repository-owner
  redirects without changing commit identity?
- How many score-blind replacement attempts are needed after transport and
  rename repair are exhausted?
