# First live selectivity results

All 16 scheduled GLM-5.3-flash generations completed with measured usage. Exact
results: [RESULTS.json](RESULTS.json); [blind review](blind-review.json);
[native observation and decision](observations.json).

| Measure | History only | History plus selected ARE state |
| --- | ---: | ---: |
| Completed generations | 8/8 | 8/8 |
| Blind semantic pass | 6/8 | 6/8 |
| Frozen structural and semantic pass | 4/8 | 5/8 |
| Total input + output tokens | 2,719 | 3,340 |
| Explicit plain override failures, blind review | 1/2 | 1/2 |

No useful state benefit is established. Both arms pass the apply/change tasks where
ARE actually adds state. The one extra combined pass is in the suppression task,
where the prompts are identical and neither arm receives selected state. It cannot
be attributed to ARE. Treatment consumes 621 additional tokens, about 22.8% more.
Two repetitions at temperature zero still produced different outputs.

The run exposed two separate problems. Some valid prose answers violate the fixed
JSON output transport. Both arms once follow the historical DAG preference despite
the current plain-text override. The ARE selector correctly suppresses state there,
but the full historical preference remains in the model input. Suppressing added
state does not itself resolve that historical conflict.

The blind review marks two density explanations ambiguous because they say lighter
than the same amount of water without specifying equal volume. This affects one
answer per arm equally. The scorer remains frozen; no retrospective synonym changes
were used to improve results. Automated misapplication counts are incomplete for
unparseable answers; the blind review detects one wrong-format override per arm.

The original frozen run failed before any scored output. Provider diagnostic code
1210 established that thinking cannot be disabled. This versioned successor uses
enabled low reasoning, retains the tasks and scoring, and passes independent review
and native continuity freeze. Its exact usage is 6,059 tokens. Earlier failed calls
and three diagnostics have unknown usage; they are not counted as zero. Reserving
32,768 tokens for them yields 38,827 tokens including the measured successor, within
the original 204,800 branch budget under that conservative reservation policy.

## Decision and next work

Keep the reserved tasks untouched. Investigate current-request precedence and
structured-output adherence through separately registered hypotheses, preserving
these failures. Do not retain a claimed quality improvement from this run.

LongMemEval and PersonaMem remain separate external branches. Their measured
admission blockers and [successor research](../personamem/SUCCESSOR-RESEARCH.md)
require a reviewed context protocol. These selectivity results do not complete the
whole benchmark plan or prove long-context retention.

## Open questions

Can explicit current-request precedence resolve stale preferences in visible
history without harming legitimate reuse? How much measured quality loss comes
from JSON transport versus task reasoning? Which source-bound memory/retrieval
protocol can evaluate the external histories within a declared total-token budget?
