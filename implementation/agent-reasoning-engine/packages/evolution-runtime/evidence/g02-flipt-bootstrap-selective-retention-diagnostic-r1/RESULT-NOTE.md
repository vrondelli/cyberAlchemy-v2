# G02 selective history retention diagnostic r1

## Result

On the already-exposed Flipt bootstrap task `SWE-Bench-Pro__go__maintenance__bugfix__b91d5788`, selective projection preserved source-read, edit, and patch exchanges but removed older search-only exchanges. ARE used **155,997 tokens** and **172.337 seconds**, yet native quality fell to **0.24472 Span-F1** and **0.46154 File-F1**. It completed a valid final selection in 19 calls, with 19 history projections removing 553,330 cumulative JSON bytes. The matched untrimmed ARE arm was 0.51582 / 0.84211 at 276,627 tokens; matched DSH was 0.43040 / 0.75000. This candidate is rejected despite its cost savings.

Full receipts remain at `/opt/are-benchmark-runs/g02-cross-layer-flipt-bootstrap-selective-diag-r1/`. The frozen episode/profile overlays and native score are preserved there. This exposed ARE-only diagnostic is not a matched win.

## Open Questions

- Can cost be reduced without projecting navigational search exchanges, or is the small bootstrap cost gap task variance rather than a systematic penalty?
- How does the untrimmed 50-line candidate perform on another untouched Go task?
