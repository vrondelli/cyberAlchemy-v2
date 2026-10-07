# G02 r11 exposed call-cutoff coverage diagnostic

Status, 2026-10-03: **evaluator-only diagnostic on the 12 scored r11 development pairs; no truncated episode was run**.

The [fixed diagnostic](../research/g02-product-r4/audit-g02-r11-call-cutoff-coverage-exposed-r1.py)
reconciled the 12 archived ARE transport ledgers with their pair decisions,
model-response order, initial source packets, and successful `search` and
`read_file` observations. Reconstructed complete delivered-path sets matched
the earlier source-only retrieval seal on **12/12** tasks. Native gold was
opened only inside this evaluator-only audit. The 17 complete-episode
delivered gold files match the count in the separate perfect-acquisition
bound. The private counts-only receipt is
`/home/vlad_/are-benchmark-archive/g02-r11-call-cutoff-coverage-exposed-r1/AUDIT.json`,
SHA-256 `68c7c04b831e27b9d0cad96ca4f28e0da7526675f9237ab7d6fceb90aa4e15ab`;
the script SHA-256 is
`6264b8313415704116de2733194815454b26008410550349420d03695959323a`.

| Archived prefix | Known ARE model tokens through prefix | New gold files delivered later | New non-gold files delivered later |
| --- | ---: | ---: | ---: |
| First five calls per task | 313,516 | 1 | 9 |
| First eight calls per task | 612,044 | 1 | 5 |
| First ten calls per task | 790,781 | **0** | **1** |
| Complete episodes | 1,140,183 | — | — |

The first-ten prefix omits 349,402 tokens from *observed later calls* across
the 12 tasks. Eight episodes actually exceeded ten calls. This is a potential
cost frontier, **not** achieved savings: a new finalization call would consume
tokens and time, and a forced early selection might lose File-F1 or Span-F1.
It cannot repair r11's 12/24 incomplete campaign or support a matched or
superiority claim. The first-eight prefix loses one delivered gold file, so
an unconditional eight-call cap is not qualified even as a coverage-preserving
replay. The original r11 DSH total was 898,285 known tokens; a ten-call
prefix alone is below that total, but the complete new protocol's cost and
paired intervals remain unknown.

## Next test and open questions

Develop a separately versioned, source-only bounded-finalization rule using
only information available during the ARE episode. Qualify it on already
exposed tasks with actual GLM finalization, delivered-read receipts, native
File-F1 and Span-F1, and full token/time accounting before selecting any
untouched cohort. A call-count cutoff inferred from these exposed outcomes
must never be presented as independent confirmation.

The first [12-call exposed task-8 rerun](G02-R11-CALLCAP12-EXPOSED-TASK8-RESULT-2026-10-03.md)
settled with valid selection in 10 calls and 102,236 known model tokens, but
**no `finalization-start` event** occurred. Native Span-F1 and File-F1 remained
zero. Its lower cost is a non-matched stochastic observation, not a demonstrated
cutoff effect or quality improvement. Retrieval quality now takes priority over
repeating the same cap setting.

- Can a bounded finalizer produce a valid selection after ten calls without
  losing quality, and fit within the remaining token/time budget?
- Would a source-observable stagnation gate distinguish the one late useful
  read from expensive repeated exploration across repositories?
- Does any qualified policy transfer to an untouched, fully valid paired G02
  campaign under the conservative exposure rule?
