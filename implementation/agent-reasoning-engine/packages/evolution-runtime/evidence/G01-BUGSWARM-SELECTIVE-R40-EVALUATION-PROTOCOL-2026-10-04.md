# G01 BugSwarm selective r40 evaluation protocol — 2026-10-04

Status: prospectively frozen evaluator-only protocol  
Population: unchanged 24-case r34–r39 mechanism-test population  
Claim ceiling: exposed mechanism evaluation; not fresh confirmation or superiority

## Objective

Acquire exact evaluator-only changed-source labels after all four source-only
rankings were sealed, then compare unchanged ARE, graph-r2, symbol/path, and
fixed equal-weight RRF without changing any query, rank, or parameter.

## Frozen inputs

| Input | SHA-256 |
| --- | --- |
| BugSwarm 1.3.1 raw metadata | `c952d8f7080e798cc66d903906d645c6dfc21f88789b1977e0d3e2d0f7c2192d` |
| r34 final population | `fee3ffa2e39fee3aadfbe09612439542942ffcfcadb13e45dc7f77ffda9e012c` |
| r36 source projection | `14766f233d6b369551b94fc7d3372b85d3cb88f0936b337024d7bb7247188395` |
| r38 audit | `ef02489f4b42a1363fee82af76a2c812a98ce595ae1ce621d0e8ea10c2dc68fe` |
| r39 rankings | `9466de334f4d0a2ccd38a4db05b38a1bc8c55beb638542c755c509fb5b319cb9` |
| r39 seal | `cf2fda51657801c3795d51bdf854593134915622a3b487551be9ed1dff5afd20` |
| r39 audit | `9781bf39483ee5dc05db9ab68b69d7dea06d7164e27c9bc191d48972023e5158` |

## Label acquisition

For each sealed slot, resolve the passed trigger SHA from the pinned raw
BugSwarm row and make exactly one request to:

`https://api.github.com/repos/{repo}/compare/{failed}...{passed}`

Maximum requests: 24. Automatic retries: zero. Stop on the first inadmissible
case. A label is admissible only when:

- HTTP status is 200 and the body is at most 8 MiB;
- base SHA equals the exact failed SHA;
- the final comparison commit equals the exact passed SHA;
- the complete `files` list is present, has fewer than 300 entries, and has no
  pagination link; and
- at least one changed old-side `.py` or `.java` path, matching the case
  language, exists in the r36 failed-source Git index.

The old-side path is `previous_filename` when present, otherwise `filename`.
Tests, fixtures, examples, and documentation are not removed at evaluation:
every changed language-matching path present in the failed source is a gold
path. This prevents the evaluator from silently favoring production files.

Passing source is not downloaded or checked out. Comparison bodies and label
receipts remain private WSL evaluator evidence and are never sent to the VPS or
model.

## Metrics

For each ranking and case, let `r` be the first rank of any gold path:

- `RR@8 = 1/r` when `r <= 8`, otherwise zero;
- Hit@1, Hit@3, and top-30 reach;
- mean MRR@8 across all 24 cases; and
- per-case first-gold rank.

Compare fused against each individual channel using wins/ties/losses on RR@8
and a deterministic 200,000-sample paired bootstrap interval for the mean
RR@8 difference, seed `400039`. Also count every top-30 coverage gain and loss.

Report the same metrics separately for `all-three-agree`, `two-agree`, and
`all-different` strata. These strata were sealed before labels.

## Advancement gates

The fixed fused ranker qualifies as an improvement only if all conditions hold:

1. 24/24 labels are admissible and independently rehashed;
2. fused MRR@8 exceeds ARE, graph-r2, and symbol/path;
3. the 95% paired-bootstrap lower bound is above zero against each channel;
4. fused top-30 reach is at least the maximum individual-channel reach; and
5. fused has zero top-30 coverage losses against every individual channel.

The candidate `GLM only for all-different` selector advances to a model test
only if the non-all-different fused subset has no top-30 misses and the
all-different stratum contains at least one deterministic miss. This is a
screening gate, not proof that GLM will repair those misses.

## Stop conditions

Any input drift, incomplete label, identity mismatch, pagination, ranking-set
drift, or audit mismatch stops r40. No metric is computed on a selected subset.
No provider or model call occurs in r40.

## Open questions

- Does support agreement predict deterministic success strongly enough to
  justify selective GLM?
- If fusion fails, which channel supplies the lost correct paths or ranks?
- What distinct development population should own the next learned threshold?
