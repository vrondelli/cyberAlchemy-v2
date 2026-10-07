# G01 graph development r3 — test-to-code edge result

Status, 2026-10-04: **24/24 valid source-only predictions, but the frozen r3
advancement gate failed.** This is development on the same exposed 24-case
BugSwarm cohort, not independent confirmation, ContextBench, live ARE, GLM,
or product superiority. The [protocol](G01-BUGSWARM-GRAPH-DEV-R3-TEST-EDGE-PROTOCOL-2026-10-04.md)
was fixed before the r3 execution/evaluator read at SHA-256
`e1ddbd94d4c5b1965c514dd20e7c2b87815cfeb3f2624e1bf195481b3854bad9`.

The [source-only r3 ranker](../research/arb-trace2code-r1/rank-bugswarm-graph-dev-r3-test-edges.py)
used failing test files only as navigation seeds, adding direct-import,
two-hop-import, and class-stem implementation targets to the sealed r2
ordering. It read no evaluator path and made no model call. Its private
ranking SHA-256 is
`6b3bb3a8fc69c9808f1a7c9e0a291a16150e7e7fabe87cbe7c65877cf9cb2323`;
source-only seal SHA-256 is
`13ff95addf7ac81580dbe8ed5919bd65a0445f85e636b547e6f1f8009e5f2765`.
Summed incremental ranking time was **17.723 seconds**, within the
predeclared 30-second incremental budget. This is not all-in episode cost.

The separate [evaluator-only scorer](../research/arb-trace2code-r1/evaluate-bugswarm-graph-dev-r3-test-edges.py)
verified 24/24 case identities and complete file coverage against the sealed
r2 rankings and evaluator labels. Its private receipt SHA-256 is
`8cf258b607846d8af1fe7a2827b84f867f192e95ad96a8f2438984bf5b43b07f`.
Independent `jq` arithmetic reproduced the macro MRR, reach, and win counts.

| Same 24 exposed development cases | ARE | Graph r2 | Test-edge r3 |
| --- | ---: | ---: | ---: |
| MRR@8 | 0.21875 | **0.43234** | 0.34142 |
| Hit@3 | 7/24 | 10/24 | 10/24 |
| Top-30 gold reach | 16/24 | 17/24 | **21/24** |

R3-minus-ARE MRR@8 was **+0.12267**, paired repository-unit 20,000-draw
bootstrap 95% interval **[-0.02664, +0.27852]**, with **11 wins, 8 ties,
5 losses**. R3-minus-r2 was **-0.09092**, interval
**[-0.22346, +0.02778]**, with **5 wins, 11 ties, 8 losses**. Test edges
brought **four new gold-reachable cases into the top 30 with zero r2-reachable
cases lost**, but their direct promotion damaged early ranking. R3 met the
24-valid, 20-reach, and incremental-time components; it failed the MRR,
16-win, and positive-bootstrap-lower components. It is therefore a candidate
*acquisition channel*, not a qualified direct ranker.

The next development hypothesis is a bounded union: preserve r2's ranking
signal while exposing r3's additional top-30 candidates to a separately
frozen selector. A source-only union of r2 and r3 top-30 paths has at most
60 candidates; it needs a fixed packet rule, actual GLM tokenizer admission
under the 8K window, paired cost accounting, and a new evaluator seal before
any GLM rerank. Do not treat union reach as selection accuracy, open the
reserved confirmation cohort, or relax the failed r3 gate.
An initial source-only count of the two sealed top-30 lists found **14–50
distinct paths per case, mean 35**, with only two cases above 45; this is
packet-size feasibility information, not tokenizer admission or accuracy.

## Open Questions

- Can an 8K GLM packet retain the full r2/r3 top-30 union and enough
  behavior-bearing evidence to rank the four newly reachable files?
- Does a bounded selector preserve r2's existing wins while converting
  acquisition gains into MRR gains at acceptable cost?
- How can the original HTTP logs/diffs be independently authenticated or
  reproduced before any fresh claim?
