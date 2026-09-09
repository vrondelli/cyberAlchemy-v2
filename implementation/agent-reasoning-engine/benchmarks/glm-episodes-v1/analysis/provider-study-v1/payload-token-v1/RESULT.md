# H23 actual tokenizer result

Frozen screen: **supporting**. All 12 calls completed, source/request/response audit passed, controller session77093 exited0. No retries, errors, replacement or model calls. Original token counts exactly reproduce H22 historical measurements.

| Window | Original input | Projected input | Saved tokens | Original admission | Projected admission |
| --- | --- | --- | --- | --- | --- |
| 8K | 5290 | 4974 | 316 | reject | fit |
| 10K | 7305 | 6985 | 320 | reject | fit |
| 12K | 9281 | 8962 | 319 | reject | fit |

Admission includes 512 input-margin tokens plus 2048 output-reserve tokens against soft-window minus256. All larger-payload controls reject in both arms; savings there are313/317/316 tokens. Complete projected payload preservation was established in the preceding offline study. Provider measurements now establish admission benefit for these exact requests, not live GLM correctness or the behavior of an integrated engine.

[Audit](report.json), [canonical research records](research.json), [DAG](../research/dag-payload-token-85-final.json):116 records/194 edges. The experiment and criteria existed before dispatch. The assessor was written while measurement ran and applies those frozen criteria. No model output was requested or executed.

Next runnable frontier: implement an equivalent JS projection with whole-schema diagnostics, prove parity against the offline candidate, then freeze a controlled live comparison under unchanged task/padding/reserve/call limits. Retain genuine-pressure controls and treat missing proposals separately from incorrect code. Core adoption and serving effects remain deferred.

## Open Questions

Does GLM interpret the smaller envelope correctly and finish the pressured task? Can both facts survive genuine capacity pressure? Broader qualification remains in the GLM finish plan. See [study contract](README.md).
