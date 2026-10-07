# G02 Flipt caching matched pair r1

## Result

The fresh source-only Flipt caching-middleware/shadowing task `SWE-Bench-Pro__go__maintenance__bugfix__157932b6` completed as a valid, sealed ARE/DSH matched pair with the stable untrimmed Go candidate and the ranker own-property guard.

| Arm | Span-F1 | File-F1 | Known model tokens | Arm seconds |
| --- | ---: | ---: | ---: | ---: |
| ARE | 0.09783 | 0.16000 | 29,479 | 78.183 |
| DSH | 0.03799 | 0.08333 | 62,818 | 93.077 |

The predeclared strict four-gate decision is **pass**. ARE improved both native quality metrics and used 53.07% fewer known tokens and 16.00% less arm time. Absolute quality remains low in both arms; this is a relative one-task result, not evidence the task was solved or that G02 generalizes. The candidate ranker SHA-256 was `70ce7350ff6029bac290fe5f542ab6a2fef9a37a999f858451441f3a6139a9ce`; pre-score seal SHA-256 was `d856a893e035718b9883451d4cd42a28c336a9feba35e8e9a0294b764c8dbc8c`.

Full receipts remain at `/opt/are-benchmark-runs/g02-cross-layer-flipt-cache-gofunc-pair-r1/`.

## Open Questions

- Does the same candidate retain a quality and efficiency advantage on a second untouched, larger Go task?
- Why are both arms' absolute native scores low, and is the task itself weakly localized by source-only evidence?
