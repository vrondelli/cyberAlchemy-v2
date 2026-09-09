# Corrected source-preservation trial — 2026-09-07

Both policies produced independently verified repairs of the controlled
exact-json-scoring mutant: 8/8 oracle checks each. Clearing also passed the full
continuity benchmark; recent-observations-v2 did not perform the required archive
read after recycling. This is one exploratory pair, not a reliable policy winner.

| Policy | Model calls | Tokenizer calls | Oracle | Continuity | Recycles | Minimum soft headroom |
| --- | ---: | ---: | --- | --- | ---: | ---: |
| clear-v1 | 10 | 13 | 8/8 | Pass | 3 | 98 tokens |
| recent-observations-v2 | 6 | 8 | 8/8 | Fail: missing archive recovery | 2 | 157 tokens |

See the [checked report](checked-report.json), [analysis](analysis.json),
[manifest](manifest.json), and [result](result.json). Candidate patches and
visible traces are saved in arm-0 and arm-1. Candidates were verified in isolated
benchmark workspaces; original fixtures remained unchanged. No product code was
patched or default policy activated by this trial.

Both arms used the same frozen runtime and task with bounded-reads-v1,
budget-aware-v1, and inspected-mutation-v1. Total usage was 16 model calls,
21 tokenizer calls, 61,039 input tokens and 1,104 output tokens. No endpoint
failures or automatic retries occurred. All dispatched requests fit the 8,000
soft limit including the 2,048 output reservation and 256 margin; the hard limit
remained 16,384. The aggregate caps remained 24 model calls, 48 tokenizer calls
and 1,200 seconds. This validates observable admission and recycling, not the
absence of provider-internal compaction.

Compared with the [earlier failed pair](../source-preservation-2026-09-07/README.md),
the corrected runtime removed raw digest recovery and redundant prompt text.
Both arms now repaired the task, but multiple changes and stochastic outputs
prevent causal attribution. V2 used fewer calls in this pair and delivered all
four required files, yet issued no archive recovery call. Its three deferred
reads were counted and not executed. Clearing delivered nine successful reads,
including two archive pages, but repeated three whole-file reads. There is still
room to improve reading efficiency and benchmark compliance.

## Validation and provenance

The source hashes matched the prior 316-test validation before and after the
trial. That suite was not rerun; its log and original source-validation receipt
are copied here. The receipt's historical posttrial-live-validation flag describes
the earlier checkpoint; this directory owns the subsequent live results.
The runner freezes all configured runtime/fixture sources in its manifest.
The checked report passed hash, policy, accounting and oracle-receipt consistency
checks against the complete private run. It does not rerun the oracle or provide
cryptographic authentication. Exported traces omit raw message history and
provider reasoning; full local records are in
/tmp/are-glm-source-corrected-2026-09-07. The export is not a complete reportRun
input. Authority effect is none.

## Open Questions

- Can both policies repeat verified repairs across the other controlled task?
- How should the model reliably complete the required archive-recovery step?
- Do repair rates and reading efficiency hold across repeats and context sizes?

Next bounded step: test the corrected runtime on retention-tool-pairs with the
same budgets and independent oracle, retaining repair and continuity as separate
outcomes. Broader tuning or default changes require more evidence.
