# G02 Flipt namespace/ETag matched pair r1

## Result

The fresh source-only Flipt namespace/ETag task `SWE-Bench-Pro__go__maintenance__bugfix__ebadd40b` completed as a valid, sealed ARE/DSH matched pair after a separately retained zero-call ranker failure was fixed. Both `FileInfo` and `GetVersion` were confirmed in the pinned base before dispatch. The corrected ranker used an own-property guard for token expansions; the Go candidate kept the original untrimmed 50-line source packet.

| Arm | Span-F1 | File-F1 | Known model tokens | Arm seconds |
| --- | ---: | ---: | ---: | ---: |
| ARE | 0.37385 | 0.45455 | 145,231 | 162.323 |
| DSH | 0.41420 | 0.54545 | 579,943 | 310.813 |

The predeclared strict four-gate decision is **fail**: ARE used 74.96% fewer known tokens and 47.77% less arm time, but trailed by 0.04035 Span-F1 and 0.09091 File-F1. This is one development pair, not full ContextBench generalization. The candidate ranker SHA-256 was `70ce7350ff6029bac290fe5f542ab6a2fef9a37a999f858451441f3a6139a9ce`; the pre-score seal SHA-256 was `455b8c7d92519726ccc2d9cc6194ca1f5b16bba1c6f3cace79a1e9e0cfffacb3`.

Full receipts remain at `/opt/are-benchmark-runs/g02-cross-layer-flipt-namespace-ownfix-pair-r1/`, including the frozen base overlay, both predictions, complete costs, pre-score seal, native scores, and pair decision. This task is now exposed for mechanism diagnosis.

## Open Questions

- Which missing namespace or file-object source layer explains ARE's quality deficit, and can a source-only candidate propose it without using gold at selection time?
- Does a corrected candidate generalize on another untouched Go task while retaining the efficiency advantage?
