# G01 BugSwarm selective r39 multi-view result — 2026-10-04

Status: passed pre-gold source-only ablation  
Population: unchanged 24-case r36/r37/r38 mechanism-test population  
Claim ceiling: retrieval stability and candidate-packet evidence only

## Result

The research-backed deterministic symbol/path channel and equal-weight
three-view RRF completed on all 24 cases. An independent implementation
recomputed all symbol scores, complete rankings, RRF scores, source sets, and
census values exactly.

| Measure | Result |
| --- | ---: |
| complete symbol/path rankings | 24/24 |
| complete fused rankings | 24/24 |
| all three channel top-1 paths agree | 1 |
| exactly two channel top-1 paths agree | 12 |
| all three channel top-1 paths differ | 11 |
| fused top-1 in 3 channel top-five lists | 7 |
| fused top-1 in 2 channel top-five lists | 13 |
| fused top-1 in 1 channel top-five list | 2 |
| fused top-1 in 0 channel top-five lists | 2 |
| top-ten union size | min 9; mean 21.375; max 29 |
| network / model calls | 0 / 0 |
| gold / passing source / patch access | 0 / 0 / 0 |

The third view materially stratifies the r38 disagreement population. A
candidate rule that escalates only the eleven `all-different` cases would make
11 rather than 21 GLM calls, a provisional 54.2% reduction from always-GLM.
That rule is **not admitted**: r39 contains no correctness evidence, so its
accuracy preservation is unknown.

## Integrity receipts

| Artifact | SHA-256 |
| --- | --- |
| protocol | `b2e1122d8c4106cc57abbf6c5b428ffc5cc393ef460f5ee78f4655fbe0630a06` |
| multi-view runner | `62241e15ed2b6281212f5818e286f8580ee4f00a39cd9cba4c89a6c06583e50e` |
| independent auditor | `4c3af222271286ddd1f746023192fca2b8dc320c4e2440f98307f011acb22350` |
| complete rankings | `9466de334f4d0a2ccd38a4db05b38a1bc8c55beb638542c755c509fb5b319cb9` |
| result seal | `cf2fda51657801c3795d51bdf854593134915622a3b487551be9ed1dff5afd20` |
| independent audit | `9781bf39483ee5dc05db9ab68b69d7dea06d7164e27c9bc191d48972023e5158` |

Private result root:

`/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/selective-r28/rankings-r39`

## Interpretation

The external research produced an integration that is both cheap and
auditable: typed query evidence, a separate exact symbol/path view, fixed late
fusion, and channel-support receipts. It improves the selector's *potential*
efficiency compared with binary ARE/graph disagreement, but no accuracy claim
follows until evaluator-only labels are opened under a separately frozen gate.

The two cases where fused top-1 is outside every channel's top five are a
specific fusion-risk diagnostic. They must remain visible during scoring; they
are not evidence that RRF is wrong or right.

## Next gate

Freeze r40 evaluator-only scoring before reading labels. Compare ARE,
graph-r2, symbol/path, and fused rankings on:

- MRR@8;
- Hit@1, Hit@3, and top-30 reach;
- per-case wins/losses and coverage losses; and
- outcomes stratified by `all-three-agree`, `two-agree`, and `all-different`.

Only if majority/support strata reliably preserve a strong deterministic
answer should an 11-call selective GLM protocol be frozen. Otherwise, keep the
three-view fusion as candidate acquisition and design a different selector.

## Open questions

- Does fixed RRF improve ranking quality, or only alter agreement geometry?
- Are the eleven all-different cases actually harder under evaluator labels?
- Can a selector be fitted on a separate development population before any
  confirmation claim?
