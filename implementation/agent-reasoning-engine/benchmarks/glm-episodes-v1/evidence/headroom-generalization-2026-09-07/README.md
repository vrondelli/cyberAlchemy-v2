# Headroom and generalization results — 2026-09-07

The headroom target is met. Opt-in reserved-headroom-v7 passed all four8K confirmation trials with repair and recycling continuity, at least342 tokens below the configured soft limit. The earlier v5 loop had only29 tokens of minimum headroom. This is a measured comparison of different candidates and adaptive tuning samples, not a controlled reliability estimate.

## Fixed evaluation

The final candidate then ran all12 predeclared trials without tuning or replacements:9 repairs and7 continuity passes. Minimum measured soft headroom was451 tokens. Both retention policies demonstrated repair plus actual archive recovery at12K on the separately constructed longer task.

| Task | Repairs | Continuity | Minimum soft headroom |
| --- | ---: | ---: | ---: |
| exact-json-scoring | 3/4 | 3/4 | 489 |
| archive-slice-bounds | 3/4 | 2/4 | 532 |
| retention-long-window | 3/4 | 2/4 | 451 |

See [every fixed trial](fixed-evaluation/README.md) and the [frozen schedule](fixed-evaluation/manifest.json). These controlled source-derived tasks do not establish general production reliability. The scoring task existed in earlier work; archive slicing is a new evaluation task.

## What changed

- deduplicated-state-v6 removes duplicate file digests only from validated prompt progress views. Durable ledger bytes, exact source attachments, authoritative mutation hashes, IDs, ranges and delivery flags remain intact.
- reserved-headroom-v7 inherits that projection and uses configured soft limit minus256 as its effective recycling threshold:7744 at8K and11744 at12K. This reserve is explicit in admission_policy and checked against every dispatch. Output reserve2048 and tokenizer margin256 remain unchanged.
- The archive-slice-bounds fixture extracts the repository UTF-16 slicing behavior and removes two boundary checks. The independent oracle covers eight cases, including surrogate boundaries, EOF and invalid ranges.
- retention-long-window adds two dense long-ID pairing documents and requires six distinct reads, followed by archive recovery after recycling. It retains the original independent retention repair oracle under a new workload identity.
- Existing policies, default policy and default two-episode invocation are unchanged; additional tasks require explicit selection.

## All failures and limitations

The fixed evaluation retained three failures: one provider deadline, one failed provider request, and one input-reservation overrun. In the overrun, the tokenizer estimated8897 input tokens; the model reported9159. That exceeded the256-token margin by6. The guard blocked the result; its actual input plus output reserve still remained below12K. This calls for explicit tokenizer-margin calibration, not disabling the check. See [trial04](fixed-evaluation/trial-04/checked-report.json).

Two correct repairs lacked continuity: the first v2 archive-slicing trial did not recycle, and the second v2 long-window trial finalized after only four of six required reads. These are not counted as continuity successes. Working12K examples: [v2](fixed-evaluation/trial-05/checked-report.json) and [clear](fixed-evaluation/trial-07/checked-report.json).

Tuning also retained its unsuccessful outcomes. [V6 tuning](tuning-01/README.md) repaired4/4 but only2/4 exercised continuity and minimum headroom was3: smaller prompts alone let more history survive. [Initial v7 tuning](tuning-02/README.md) had one joint pass and three provider failures. The unchanged [confirmation batch](tuning-03/README.md) passed4/4 jointly with342 minimum headroom. No failed identities were replaced.

## Validation and provenance

All373 local checks passed ([log](tests.tap)). Including all tuning and evaluation, 24 trials consumed 132 model and 156 tokenizer attempts. The fixed evaluation used70/80 attempts. Per-arm limits remained12/24 attempts and580 seconds.

The [plan](PLAN.md), per-batch manifests, checked reports, visible traces and candidate patches retain source evidence. V7 source hashes matched across tuning02, tuning03 and fixed evaluation and at final aggregation ([validation](validation.json)). Original fixture repairs were evaluated in isolated copies only. Checked reports validate recorded oracle receipts and integrity bindings, not cryptographic authenticity or fresh oracle replay. The complete raw report inputs remain in the /tmp paths recorded in each driver; subset exports exclude raw message history and provider reasoning.

This validates ARE admission and observable recycling. It cannot establish absence of provider-internal compaction. No default activation, publication or deployment occurred.

## Open Questions

- What tokenizer margin covers long-ID and archive-recovery requests across repeated provider measurements?
- How should required-read completion be enforced before accepting an otherwise correct repair?
- Do larger non-adaptive samples and more repository tasks preserve these results?
- What operational evidence would justify default activation?
