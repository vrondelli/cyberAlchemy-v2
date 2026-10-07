# G02 Flipt bootstrap matched pair r1

## Result

The fresh source-only Flipt bootstrap-configuration task `SWE-Bench-Pro__go__maintenance__bugfix__b91d5788` completed as a valid, sealed ARE/DSH matched pair. The retained 50-line Go function-window candidate improved native quality but missed both efficiency gates:

| Arm | Span-F1 | File-F1 | Known model tokens | Arm seconds |
| --- | ---: | ---: | ---: | ---: |
| ARE | 0.51582 | 0.84211 | 276,627 | 231.874 |
| DSH | 0.43040 | 0.75000 | 264,768 | 219.746 |

The predeclared strict four-gate decision is **fail**. ARE gained 0.08542 Span-F1 and 0.09211 File-F1, but spent 11,859 more known tokens and 12.128 more seconds. This is one development pair, not full ContextBench generalization. The source-only initial packet included authentication bootstrap, token-server, configuration, and schema surfaces. The candidate ranker SHA-256 was `70ce7350ff6029bac290fe5f542ab6a2fef9a37a999f858451441f3a6139a9ce`.

Full receipts remain at `/opt/are-benchmark-runs/g02-cross-layer-flipt-bootstrap-gofunc-pair-r1/`, including `FREEZE.json`, `PAIR-PRE-SCORE-SEAL.json`, `PAIR-DECISION.json`, both predictions, cost receipts, and native scores. The pre-score seal SHA-256 was `2f06f0fc6a0161b4eb901ef4118dd42722261355dc9e1c1261d6bb342c9cba83`.

## Open Questions

- Which ARE phase accounts for the small token/time excess, and can it be shortened without losing the cross-layer quality gain?
- Does a cost-reduced candidate retain quality on an untouched matched task?
