# Execution Pack — Future Handoff Only

This pack describes the future execution choreography after exact owner acceptance and Implementation Readiness selection. It performs no execution.

| Wave | Layer | SWUs | Gate after wave |
| --- | --- | --- | --- |
| W0 | L0 | `SWU-FMP2-001` | pure classifier receipt and owner closeout pass |
| W1 | L1 | `SWU-FMP2-002` | owner-accepted generic material contract plus shared factory regression pass |
| W2 | L2 | `SWU-FMP2-003` | fake-tool provider, accounting, registry, and cleanup pass |
| W3 | L2 | `SWU-FMP2-004`, then `SWU-FMP2-005` | both separate corpus receipts pass; known-red remains exact |
| W4 | L3 | `SWU-FMP2-006` | live lifecycle, exact inventory, six-receipt chain, null successor, claim ceiling pass |

Only one fresh Task Session runs at a time. Later units consume the exact accepted predecessor execution receipt and `invoke:refresh:apply-approved` owner closeout. No sibling mutation or hidden fan-out is admitted. The first failure stops the chain and preserves the last accepted predecessor.

Each Task Session route also consumes `RECEIPT-BINDINGS.json` and `CLOSEOUT-CONTRACTS.json`. It must emit the bound precloseout receipt, join the exact Invoke owner receipt, emit the bound generic terminal receipt, and pass the candidate-local semantic validator before exposing a successor cursor. The final unit exposes no cursor because its successor is null.

The separately running adapter Design helper is not part of these waves and has no product or Plan write scope.
