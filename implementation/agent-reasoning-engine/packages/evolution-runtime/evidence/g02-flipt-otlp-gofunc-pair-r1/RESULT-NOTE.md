# G02 Flipt OTLP matched pair r1

## Result

The fresh source-only Flipt OTLP tracing-exporter task `SWE-Bench-Pro__go__maintenance__bugfix__52d866b3` completed as a valid, sealed ARE/DSH matched pair with the stable untrimmed Go candidate and ranker own-property guard.

| Arm | Span-F1 | File-F1 | Known model tokens | Arm seconds |
| --- | ---: | ---: | ---: | ---: |
| ARE | 0.39763 | 0.34483 | 167,322 | 163.930 |
| DSH | 0.37193 | 0.33333 | 664,206 | 375.523 |

The predeclared strict four-gate decision is **pass**. ARE improved Span-F1 by 0.02570 and File-F1 by 0.01149, with 74.81% fewer known tokens and 56.35% less arm time. The quality margins are narrow; this is one development pair, not full ContextBench generalization. Its initial packet did include potentially distracting import/export files alongside `internal/config/tracing.go` and schemas, which is a remaining selector-quality issue.

The candidate ranker SHA-256 was `70ce7350ff6029bac290fe5f542ab6a2fef9a37a999f858451441f3a6139a9ce`; pre-score seal SHA-256 was `d1abe99f36e141b3355d859624814285f7d989be8c80fc25f299cb8d9ad5243b`. Full receipts remain at `/opt/are-benchmark-runs/g02-cross-layer-flipt-otlp-gofunc-pair-r1/`.

## Open Questions

- Will the relative quality gain persist on a predeclared independent holdout rather than adaptively selected development tasks?
- Can the selector distinguish tracing exporters from unrelated import/export implementation without sacrificing this result?
