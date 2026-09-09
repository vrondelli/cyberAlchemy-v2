# Small-window qualification complete

The complete-transport candidate passed the frozen small-window gate: **36/36 final verified**, across four tasks at 8K/10K/12K in three predeclared rounds. Initial proposals passed **28/36** (27 without transport retry); all eight logical corrections succeeded. This qualifies the bounded benchmark composition, not full GLM integration or held-out generalization.

| Round | Initial | Final | Recycled continuity | Public workers cleaned |
| --- | ---: | ---: | ---: | ---: |
| 1 | 10/12 | 12/12 | 3/3 | 14/14 |
| 2 | 8/12 | 12/12 | 3/3 | 16/16 |
| 3 | 10/12 | 12/12 | 3/3 | 14/14 |

The [independent audit](independent-audit.json) reconciles all36 outcomes and330 model/353 tokenizer physical attempts. It verifies100 frozen source files,36 delivery gates,9/9 recycled continuity across24 recycling events, and the required long8K recycling in allthree rounds. Minimum recorded soft headroom was259 tokens. Final validation passed261 public checks and288 independent oracle checks; all44 public workers were cleaned up with no validation execution errors.

One initial60-second model timeout in Round3 long10K recovered with one bounded retry. No correction transport retry was needed in this live candidate; that path passed offline fault-injection tests for schema, semantic and combined corrections. Eight corrections comprised six schema-only, one combined schema/semantic and one semantic. Interrupted provider usage remains unknown.

Elapsed campaign time:2,429,156ms (40.5minutes). Predeclared caps were624 model,1032 tokenizer and72 public workers. Existing30-second tokenizer,60-second model and580-second arm deadlines remained fixed. See [plan](PLAN.md), [schedule](schedule.json), [aggregate](run/result.json), [correction tests](correction-tests.log) and [controller tests](controller-tests.log):61 targeted tests passed before the source freeze.

## What is qualified

Opt-in `example-fields-v20` completion, `bounded-reads-v1` delivery, `inspected-mutation-v1` source policy; scoring uses `clear-v1`, other tasks `recent-observations-v2`. Hard context16384, soft limits8000/10000/12000, output2048 and token margin512. Initial requests permit two total transient retries per trial, at mostone per logical request. Shared correction allows one logical response and at mostone physical transient retry. Every physical attempt remains counted. Defaults and product activation are unchanged.

The [first four failed campaigns](../../analysis/snapshots/2026-09-09/REPORT.md) remain retained:34/36,32/36,35/36,35/36. This is the fifth fresh36-trial candidate (180 initial qualification trials in total), not a replacement of their failed trials. The retained12-case development replay is not an additional independent dataset.

The user requested analysis instead of further blind tuning. No further campaign was started. The [analysis package](../../analysis/README.md) and [GCF review](../../analysis/GCF-REVIEW.md) propose controlled alternatives; this acceptance result does not demonstrate improved first-proposal quality or GCF suitability.

## Open Questions

First-proposal quality remains28/36 here. The analysis owns whether a simpler model-facing contract or GCF input can improve it. Larger contexts, new repository tasks, product entry-point integration and held-out acceptance remain in the [GLM finish plan](../../../../GLM-FINISH-PLAN.md). Provider-internal compaction is not observable from these receipts.
