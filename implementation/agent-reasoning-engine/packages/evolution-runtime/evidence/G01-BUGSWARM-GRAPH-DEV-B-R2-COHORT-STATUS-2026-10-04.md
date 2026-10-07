# G01 BugSwarm second development cohort — selection and source/log preflight

Status, 2026-10-04: **24 distinct development repositories selected and
admitted for private development scoring.** All 24 exact failing commits,
original logs, source archives, code-only roots, evaluator-only diff labels,
and label-to-projection joins passed. The unchanged graph r2 rule has now
been scored against the ARE baseline on this cohort. No GLM call or reserved
confirmation access occurred; this is not ContextBench, live ARE, or a
superiority claim.

The [metadata selection protocol](G01-BUGSWARM-GRAPH-DEV-B-R1-COHORT-PROTOCOL-2026-10-04.md)
and [selector](../research/arb-trace2code-r1/select-bugswarm-graph-dev-b-r1.py)
used pinned BugSwarm 1.3.1 metadata and failure-side source order. They
excluded **74** repositories across the original exposed cohort, r1
development, the unopened r1 reserved-confirmation cohort, and r2 repaired
development. The fixed 12 Python + 12 Java selection traversed 325 Python
and 394 Java source-order positions. The private metadata receipt SHA-256 is
`d3f1dbef2443752290cfe917f75d15a229f4a176d2708c2764fcf7886df25b92`.
Selection used the dataset's post-fix code-patch classification and
changed-file count, which may cause selection bias; it did not use patch
paths, ranker scores, or model outputs.

The [r1 preflight](../research/arb-trace2code-r1/preflight-bugswarm-graph-dev-b-r1.py)
found **23/24** exact failed commits over GitHub HTTPS and **24/24**
nonempty, job-ID-matched original BugSwarm logs. `numpy/numpy` at Python
position 12 returned GitHub HTTP 404 for its failing SHA. Its private
preflight receipt SHA-256 is
`cc8adb5e427659794cfc6334797b759fd7dc9884346968bb74ac2dfea21f98dd`.
The logs came over unauthenticated HTTP and remain transport-provisional.

The separately fixed [r2 repair rule](G01-BUGSWARM-GRAPH-DEV-B-R2-SOURCE-REPAIR-PROTOCOL-2026-10-04.md)
retained the other 23 and selected the first later eligible, disjoint
development-parity Python case with both exact source and original log:
`jazzband/tablib`, source-order position 337. The [repair script](../research/arb-trace2code-r1/repair-bugswarm-graph-dev-b-r2.py)
made one candidate attempt, with HTTPS commit status 200 and HTTP log
status 200. The private r2 metadata receipt SHA-256 is
`53df9fa74a732090fa23c65373b0f656cf73b0b9a92a6e1c81ca534b97bb16b8`;
the replacement-log SHA-256 is
`18a8c29fb746a86942e6529dadc5437aa4f407defbb9f1fa7d6f896098b164b4`.

The 24 exact failed-commit archives were acquired under the separately fixed
[r3 single-archive cap exception](G01-BUGSWARM-GRAPH-DEV-B-R3-ARCHIVE-EXCEPTION-PROTOCOL-2026-10-04.md).
Their combined acquisition receipt SHA-256 is
`056cc06b538d6560f3e3a0e37c2ae9ed874d109cb6e167a0092774dbb8e0e77d`;
the safe-path and code-bound validation receipt is
`b8ba45df6f3e9a6e3440c85291814173304a95ad0c378fed9d10d7114ad91f7c`.
The [versioned materializer](../research/arb-trace2code-r1/materialize-bugswarm-graph-dev-b-r3-code.py)
projected 23,725 `.py`/`.java` files, 124,002,269 code bytes, and 24/24
complete roots; receipt SHA-256 is
`ac0e840cad602ac5b5f80ba7579389ab95cc6efdb4ae682c1744103b29db5d92`.
The [source-only query projection](../research/arb-trace2code-r1/project-bugswarm-graph-dev-b-r3-queries.py)
sealed 24/24 failure-side queries at at most 1,017 bytes each; query seal
SHA-256 is `72bcc7e7709ed20a8f096575f45d9f0c9ac3196612dff6559c4d91c8c0bc156e`.

The separate [evaluator-only diff audit](../research/arb-trace2code-r1/audit-bugswarm-graph-dev-b-r3-gold.py)
admitted 24/24 identity-matched cases; gold receipt SHA-256 is
`ac3ef81c36088dc305508c940df9a86d583c8601ba41874c1369197a14ec376e`.
Its [projection join](../research/arb-trace2code-r1/audit-bugswarm-graph-dev-b-r3-projection-gold.py)
found all 27/27 gold source files in the code-only roots; join receipt
SHA-256 is `0a72eb4e9c44f2776bceb72ec602b59c897f41dea227cf122ad00a9ce3f9af7d`.
Gold paths stayed in `graph-dev-b-r2/evaluator-only/`; the source-only
rankers did not receive them. Original BugSwarm logs and diffs still have
unauthenticated HTTP transport provenance, so label/source integrity is
provisional for a public claim.

The [ARE baseline](../research/arb-trace2code-r1/rank-bugswarm-graph-dev-b-r3-are.mjs)
sealed 24/24 full-file rankings before baseline scoring (seal SHA-256
`d6555bb758b3f974c516ab23ae29cf6e8ddfa493804feb5fb247bc13395fd2ed`).
Its evaluator receipt SHA-256 is
`0be6977ed77ed3c958d8f6e6018850a31310f0ae785dc2b1441b350b82600861`.
The [unchanged graph r2 rule on cohort B](../research/arb-trace2code-r1/rank-bugswarm-graph-dev-b-r3-graph.py)
sealed its 24/24 rankings at SHA-256
`bef3ad37a6c4f87d08e3254df47a7ae1c52e641b58a672859511a47737639813`.
The [paired evaluator](../research/arb-trace2code-r1/evaluate-bugswarm-graph-dev-b-r3-graph.py)
produced receipt SHA-256
`82b8ce048c7d77d09ea1bfc04bab11e3c68e7d7f12e84cfd2e199c4c43b86fd8`:

| Second 24-repository development cohort | ARE | Graph r2 transfer |
| --- | ---: | ---: |
| MRR@8 | 0.15764 | **0.41667** |
| Hit@3 | 6/24 | **12/24** |
| Top-30 gold reach | 13/24 | **18/24** |

Graph-minus-ARE MRR@8 is **+0.25903**, with a 20,000-draw paired bootstrap
95% interval **[+0.09306, +0.43646]**, 12 wins, nine ties, and three losses.
This is repository-disjoint *development transfer*, not a predeclared cohort-B
quality gate or untouched confirmation. The graph still misses six gold
files at top 30, so a pairwise top-candidate selector alone cannot solve
candidate reach. A separately fixed union/pairwise experiment was prepared
next; its source-only reach screen is reported below. Independent
confirmation remains conditional on a qualified rule.
Evaluator-only admission happened before these rankings, but the source-only
ranker processes had no evaluator input; the earlier path-count output is
part of the exposed development history.

The unchanged test-edge augmentation transferred at MRR@8 **0.38889** and
top-30 reach **19/24**: one more reachable case but lower direct ranking
than graph r2. Its evaluator receipt SHA-256 is
`125668b488ec0de79032f7062bc5438cc25eb1e953074265f4a4ddf5ea4184ac`.
The [separately fixed r5 union/pairwise protocol](G01-BUGSWARM-GRAPH-DEV-B-R5-PAIRWISE-PROTOCOL-2026-10-04.md)
sealed 24 compact packets, but evaluator-only union reach was **19/24**, below
its 20/24 advancement condition; no r5 GLM call was dispatched. The
[r6 full-log stem screen](G01-BUGSWARM-GRAPH-DEV-B-R6-FULL-LOG-STEM-RESULT-2026-10-04.md)
also failed at **19/24** reach with zero gains and zero losses. Its failure
diagnosis now points to failure-context weighting, test-class aliases, and
log-silent source relationships rather than another selector over the same
unreachable pool.

The separately frozen [r7 stratified acquisition](G01-BUGSWARM-GRAPH-DEV-B-R7-STRATIFIED-ACQUISITION-PROTOCOL-2026-10-04.md)
raised bounded candidate reach to **22/24**. The subsequent
[r8 GLM result](G01-BUGSWARM-GRAPH-DEV-B-R8-GLM-RESULT-2026-10-04.md)
completed 24/24 valid listwise and 38/38 valid pairwise calls. Guarded
MRR@8 was **0.60243** against graph r2 **0.41667** and ARE **0.15764**;
the paired ARE interval was positive with 16 wins, eight ties, zero losses.
The frozen overall gate failed because original HTTP logs and diff labels
were transport-provisional at evaluation. These are exposed development results, not a
fresh or product superiority claim.

A later [HTTPS provenance audit](G01-BUGSWARM-GRAPH-DEV-B-R8-PROVENANCE-AUDIT-2026-10-04.md)
independently corroborated all **24/24** patch-file label sets from exact Git
trees, but byte-matched only **15/24** original logs; nine large HTTPS
transfers closed early. The original r8 whole-gate result remains failed.

## Open Questions

- Can source-grounded structured retrieval reach the two files outside r7's
  bounded candidate pools without sacrificing 8K fit or cost?
- How will HTTP logs and diffs be authenticated or independently reproduced?
