# G02 normalized 16-call candidate — Go matched quality failure

The frozen normalized-clause, twenty-hint, sixteen-call candidate ran on
source-only Flipt Go task `05aad678`. This task had not been scored in the
current G02 cycle before the candidate was fixed. The first captured ARE
request contained the twenty-hint primer. Both ARE and same-instance DSH
produced valid native selections with fully known model-token usage.

| Arm | Span-F1 | File-F1 | Model tokens | Wall seconds |
| --- | ---: | ---: | ---: | ---: |
| ARE | 0.24952337 | 0.50000000 | 53,050 | 96.49 |
| DSH | 0.25710447 | 0.73684211 | 648,011 | 298.07 |

ARE cut tokens and wall time sharply but lost both accuracy metrics. The
candidate is rejected, not promoted. Both final file sets had precision
`1.0`; ARE selected four of twelve gold files, DSH seven. The DSH-only
hits included `config/flipt.schema.cue`, `config/flipt.schema.json`, and
`internal/oci/file.go`. None was delivered in the ARE run, and the first
twenty ranked hints did not list them. This is an acquisition gap, not a
terminal-selection precision gap. The source-only task file and both native
scores are retained here.

ARE [receipts](G02-NORMALIZED-16-GO-ARE-RECEIPTS.tar.gz) SHA-256:
`d8e4b2e975c8ee481522dcc2ae65538757398624a15313c17f38d7f2e83eb5cc`.
DSH [receipts](G02-NORMALIZED-16-GO-DSH-RECEIPTS.tar.gz) SHA-256:
`8ab036825c125fd62953f3392cb66cc9e0b167817b88f4d71c30cd59466642b2`.
Archives exclude source checkouts and credential values. VPS run root:
`/opt/are-benchmark-runs/g02-normalized-clauses-16-go-r1`.

Decision: reject the fixed sixteen-call candidate. Investigate a general
source-neighborhood or longer exploration variant on this now-exposed task;
any subsequent success requires another untouched matched task.

## Open Questions

Can ARE acquire schema and implementation neighbors without relying on
task-specific filenames, while retaining the large token and wall-time
savings across repositories?
