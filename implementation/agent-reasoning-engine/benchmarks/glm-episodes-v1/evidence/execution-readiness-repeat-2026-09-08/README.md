# Readiness retry result

The unchanged fixed diagnostic passed its target: **8/8 readiness rounds**, followed by all six retained public validations with **zero execution failures**. Four proposals passed and the two known semantic defects remained rejected. No model or tokenizer API calls were made; eight bounded local secret consumptions completed successfully.

All 24 child probes passed, ranging from 39.3 to 75.9 ms. Secret consumption ranged from 118.8 to 313.4 ms. The six validations executed 40 public checks. The empty-history defect in long-recent-1 and interior-start defect in archive-recent-2 remain output mismatches. The other four retained proposals passed these selected checks. This is local replay, not a new live model repair score.

Thresholds and code are unchanged from the [previous diagnostic](../execution-readiness-2026-09-08/README.md). All fourteen enumerated source entries matched after completion. Earlier blocked measurements remain intact. The host load observed after this run was 1.22, much lower than during the failed run; this supports the contention diagnosis without establishing causality for every earlier failure.

Evidence: [manifest](run/manifest.json), [aggregate](run/result.json), and the eight per-round results. The same [construction plan](../execution-readiness-2026-09-08/PLAN.md) and existing 21-test validation apply; no code changed or new unit-test pass is claimed. CAV2-D65 run-local validation evidence, authority effect none.

## Open Questions

The host was ready at this sample. A future live corrective run must check readiness again immediately before dispatch. Whether the one-turn feedback repairs both semantic defects prospectively remains unresolved. Public checks are partial coverage, and earlier model/continuity scores remain unchanged.
