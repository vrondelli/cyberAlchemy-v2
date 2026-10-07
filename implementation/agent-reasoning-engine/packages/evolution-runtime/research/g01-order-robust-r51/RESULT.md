# G01 r51 result — counterbalanced order and fixed RRF

Status: completed exposed diagnostic; independently reproduced; advancement gate failed on response-contract validity only  
Claim ceiling: exposed mechanism evidence; no confirmation or superiority claim

## Execution

- 71 previously exposed cases: r43 (`23`), r44 (`24`), and r50 (`24`);
- two new deterministic order views per case, for `142` tokenizer and `142`
  generation calls;
- `435,079` prompt tokens and `9,766` completion tokens;
- no transport failure and all calls returned HTTP 200;
- `135/142` responses satisfied the frozen numeric-ID schema;
- seven responses returned an unambiguous list of exact candidate paths in the
  `candidate_ids` field. Those paths were normalized only for a separately
  labeled diagnostic. They do not satisfy the frozen validity gate.

## Combined results

| Ranking | MRR@8 | Hit@1 | Hit@3 | Reach@30 |
|---|---:|---:|---:|---:|
| Graph | 0.47830 | 23 | 41 | 63 |
| Historical raw GLM | 0.59666 | 37 | 45 | 63 |
| New reverse view | 0.58699 | 36 | 48 | 63 |
| New half-rotation view | 0.56767 | 34 | 45 | 63 |
| Fixed four-ranking RRF (`k=60`) | **0.62141** | **38** | **47** | 63 |

Diagnostic RRF minus graph MRR@8 was `+0.14311`; its deterministic paired
bootstrap 95% interval was `[+0.05827, +0.23251]`. RRF minus historical raw GLM
was `+0.02475`, with interval `[-0.01278, +0.06367]`. Wins/ties/losses were
`22/36/13` against graph and `15/52/4` against historical raw GLM.

RRF exceeded graph MRR@8 in all three cohorts and lost no cohort-level graph
MRR. It also recovered the raw treatment's combined Hit@3 regression: `47`
versus raw `45` and graph `41`.

## Gate disposition

All frozen quantitative, coverage, and cohort-safety checks passed. The overall
advancement gate failed because only `135/142`, rather than `142/142`, outputs
obeyed the exact numeric-ID response schema. The diagnostic path normalization
was frozen after collection and is not retroactively counted as protocol
validity.

This means r51 supports the counterbalanced-order plus fixed-RRF mechanism as a
high-value candidate, but it does not qualify that mechanism for a fresh
confirmation or support any superiority claim. The precommitted next research
step is the fixed-lambda Self-Sorting escalation using the sealed lists; RRF
weights or `k` must not be tuned on these outcomes.

## Receipts

- WSL archive: `/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/order-robust-r51`
- packet SHA-256: `51db287026aa01a02cb3074b2fb7a528dd43b548466f731313b7059effa318ee`
- prediction SHA-256: `c54c44939cf1033d643953c73a2ed8fbec5a535934e54387a54dc9e0e7b6be1a`
- evaluation SHA-256: `95e5894444a78a4beee4282e49e4c165a175526b47f442841acc87b152eac89d`
- independent audit: `audit_passed=true`, zero network or model calls

## Open questions

- Can fixed-lambda Self-Sorting improve on RRF without sacrificing Hit@3?
- Should a future confirmation response contract prospectively accept either
  numeric IDs or exact candidate paths?
- Does the mechanism transfer to a fresh non-BugSwarm population?
