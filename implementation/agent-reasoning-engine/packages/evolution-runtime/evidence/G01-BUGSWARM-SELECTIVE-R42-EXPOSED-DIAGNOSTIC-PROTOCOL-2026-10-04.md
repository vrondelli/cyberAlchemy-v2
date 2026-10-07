# G01 BugSwarm selective r42 exposed diagnostic protocol — 2026-10-04

Status: frozen before score computation  
Population: all 23 r41-admissible cases; ordinal 15 retained as an excluded population receipt  
Claim ceiling: exposed mechanism diagnosis only; not fresh confirmation or superiority

## Objective

Score the unchanged r38 ARE and graph-r2 rankings and the unchanged r39
symbol/path and equal-weight RRF rankings on every case admitted by the r40
label rule. No query, rank, label, parameter, or case may be changed.

## Frozen inputs

- r38 audit SHA-256:
  `ef02489f4b42a1363fee82af76a2c812a98ce595ae1ce621d0e8ea10c2dc68fe`
- r39 rankings SHA-256:
  `9466de334f4d0a2ccd38a4db05b38a1bc8c55beb638542c755c509fb5b319cb9`
- r39 seal SHA-256:
  `cf2fda51657801c3795d51bdf854593134915622a3b487551be9ed1dff5afd20`
- r39 audit SHA-256:
  `9781bf39483ee5dc05db9ab68b69d7dea06d7164e27c9bc191d48972023e5158`
- r41 census result SHA-256:
  `88f011f1c532609e633e0f6a023c23c8894068babd4655436c64e38c200bf78e`

## Metrics

Use the metrics already frozen in r40. For each ranking and case, let `r` be
the first rank of any gold path:

- `RR@8 = 1/r` when `r <= 8`, otherwise zero;
- Hit@1, Hit@3, and top-30 reach;
- mean MRR@8 and per-case first-gold rank.

For fused versus each individual channel, report RR@8 wins/ties/losses, mean
difference, a 200,000-sample paired bootstrap 95% interval with Python
`random.Random(400039)`, and top-30 gains/losses. Each bootstrap sample draws
23 complete case rows with replacement. The empirical interval uses sorted
zero-based indices `floor(0.025*N)` and `ceil(0.975*N)-1`.

Report metrics by the sealed `all-three-agree`, `two-agree`, and
`all-different` strata. Also evaluate r40's selector screen: the
non-all-different fused subset must have no top-30 miss and the all-different
stratum must contain at least one fused top-30 miss.

## Interpretation

R42 applies the unchanged r40 metrics to a denominator declared only after r40
failed. Therefore, even if the numerical r40 fusion conditions hold on 23
cases, the outcome is a mechanism diagnostic and cannot pass r40, qualify a
fresh candidate, or support a product superiority claim.

## Boundaries

No network, model, passing-source checkout, VPS transfer, publication, or
ranking mutation is allowed. The score output and an independent recomputation
must account for all 24 original ordinals and identify ordinal 15 as excluded.

## Open questions

- Does fixed fusion improve MRR@8 without losing top-30 coverage?
- Does the sealed agreement stratum predict deterministic retrieval misses?
- Which component should be changed on a distinct development population?

