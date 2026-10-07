# G02 Go named-type closure diagnostic r1

## Result

On the already-exposed Flipt namespace/ETag task `SWE-Bench-Pro__go__maintenance__bugfix__ebadd40b`, an opt-in source-only named-type closure delivered `internal/storage/fs/object/fileinfo.go`, `object/store.go`, `object/file.go`, and `internal/storage/fs/snapshot.go` in the initial packet. The packet was 9,589 source bytes. The ARE-only run completed a valid selection in 19 calls, **246,045 tokens**, and **156.596 seconds**. Native quality was **0.36422 Span-F1** and **0.47619 File-F1**.

The prior matched ARE arm without this closure scored 0.37385 / 0.45455 at 145,231 tokens; its DSH control scored 0.41420 / 0.54545. The closure marginally improved File-F1 but regressed Span-F1 and token efficiency, and still trailed the control's quality. It is not promoted. This is an exposed diagnostic, not a prospective matched result.

Full receipts remain at `/opt/are-benchmark-runs/g02-cross-layer-flipt-namespace-named2-diag-r1/`. An earlier candidate was frozen but never dispatched at `/opt/are-benchmark-runs/g02-cross-layer-flipt-namespace-named-diag-r1/`; the latter had no GLM calls and is not a result.

## Open Questions

- Does the stable untrimmed G02 candidate show an aggregate quality and efficiency advantage on an untouched source-only cohort?
- What general source-acquisition change addresses object-layer quality without overfitting the exposed namespace task?
