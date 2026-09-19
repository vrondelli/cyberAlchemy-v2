# Comparison outer launcher R2

Status: eleven offline tests pass; independent R2 review pending. No new provider/evaluator calls.

R1 review reproduced two failure-accounting defects: an overflowing receipt sum became zero known tokens after a caught exception, and an overflowing aggregate escaped recovery and prevented the final twelve-row report. Both added regressions failed against preserved R1. Its 108-binding rejection and original code/tests remain unchanged.

`comparison-launcher-r2.mjs` keeps the same launch, settlement, storage and scoring boundaries. Recovery now sums safely represented positive token components with BigInt and writes exact decimal strings. Numeric fields remain numbers when representable and become null when they exceed JavaScript's safe integer range. There is no downward rounding or saturation. Accounting errors retain bound witness hashes, positive receipt/usage/phase components and all twelve rows. Aggregate overflow cannot prevent report persistence. Malformed or unsafe individual numeric components are not fabricated into exact values; original witness artifacts remain the evidence, and the report never claims reconciled accounting or savings.

Nine inherited launcher tests and two overflow regressions pass. One uses an actual generation subprocess with fixture output and scorer. No successful complete production generation/evaluation run is established by these tests. The original COMPARISON-LAUNCHER.md owns the unchanged composition boundaries and pending live prerequisites.

## Open questions

Coordinator owns independent R2 review, prospective native experiment amendment, exact production source freeze and qualification. Callers must select R2 explicitly and consume exact decimal recovery fields when numeric fields are null. The live twelve-outcome comparison, untouched confirmation and full benchmark requirements remain pending; synthetic test success does not establish model quality or token savings.
