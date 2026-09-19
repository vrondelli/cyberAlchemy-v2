# Design Layering Seed

| Layer | Contract | Planned proof | Execution state |
| --- | --- | --- | --- |
| L0 semantic kernel | meanings, controls, typed verdicts | schema and non-alias fixtures | planned-unexecuted |
| L1 evidence spine | observation and receipt contracts | provenance/freshness/privacy fixtures | planned-unexecuted |
| L2 profile adapters | tool/runtime mappings | admitted-profile contract tests | unbound |
| L3 evaluators | SLI/workload/infra/canary/rollback predicates | C01-C20 and M01-M17 | planned-unexecuted |
| L4 protected effects | apply/deploy/rollback | authorization and independent effect receipt | forbidden in current route |
| L5 acceptance/admission | exact-byte owner gates | owner and lifecycle receipts | pending |

The Plan may sequence owner decisions and profile admission work, but cannot create mutation-capable SWUs from these unbound layers.
