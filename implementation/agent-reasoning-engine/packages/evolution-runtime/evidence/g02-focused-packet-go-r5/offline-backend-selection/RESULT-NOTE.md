# Post-run named-backend packet selection diagnostic

The replay script read only the completed model result and source-only task.
It extracted `storage.type: oci`, removed already-selected source paths in
other `storage/fs/<backend>` siblings, and included receipt-confirmed focused
packet reads plus packet reads under the named backend path. It did not read
gold labels. The unchanged native scorer was applied afterward.

| Selection | Span-F1 | File-F1 |
| --- | ---: | ---: |
| Live model selection | 0.28220 | 0.47619 |
| Post-run runtime selection | 0.27544 | 0.76190 |
| Pinned DSH control | 0.25710 | 0.73684 |

The replay added `internal/oci/file.go`, `cmd/flipt/bundle.go`, and
`build/testing/integration.go`; it removed three Git/local storage paths.
The [analysis](r5-backend-analysis.json), [prediction](r5-backend-prediction.json),
and [native score](r5-backend-native-score.json) retain the exact result.
This rule was designed after observing the exposed task and is not a
prospective result. It cannot justify promotion or a broad ARE claim.

## Open Questions

Can the active-component and sibling-path rule be made general and frozen
before an untouched matched run, without harming legitimate comparator files?
