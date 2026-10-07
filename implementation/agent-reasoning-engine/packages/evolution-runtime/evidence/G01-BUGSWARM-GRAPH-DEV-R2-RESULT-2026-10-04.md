# G01 BugSwarm failure-anchored graph r2 — exposed development result

Status, 2026-10-04: **24/24 complete source-only graph rankings, but the
prospective quality gate failed.** This is private development on the same
24-case r2 cohort described in the [baseline note](G01-BUGSWARM-GRAPH-DEV-R2-BASELINE-2026-10-04.md),
not fresh confirmation, ContextBench, live ARE, GLM, or product superiority.
The source-only [graph ranker](../research/arb-trace2code-r1/rank-bugswarm-graph-dev-r2-graph.py)
used last-64-KiB failure-log filename cues, class/def symbol anchors, and
bounded direct/reverse import neighbors. It preserved complete file coverage
and did not read patch labels. The private ranking SHA-256 is
`e3bd92f75b1fa3dfc95a43dfa29c69e8ebc6dc92e1e7bc5ba12565541586361a`;
source-only seal SHA-256 is
`7b5f5e7e88b04d0244fa9650c1f24e87ac01e1780214343cae002f7e7ade067c`.
Summed graph ranking time was **19.239 seconds**, descriptive only: no runtime
budget was frozen before execution, and this does not include generating the
ARE baseline or all-in episode cost.

The separate [evaluator-only scorer](../research/arb-trace2code-r1/evaluate-bugswarm-graph-dev-r2-graph.py)
verified the sealed predictions, baseline hashes, all 26 gold files, and the
unchanged 24-case denominator. Its private receipt SHA-256 is
`367f37032acb8c086291de1b4b3b21701acef83a432b0d26cd4e131c46db5c09`.
An independent `jq` aggregation reproduced both MRR values, wins/ties/losses,
and top-30 reach.

| Same 24 exposed development cases | ARE | Graph r2 |
| --- | ---: | ---: |
| MRR@8 | 0.21875 | **0.43234** |
| Hit@3 | 7/24 | **10/24** |
| Top-30 candidate reach | 16/24 | **17/24** |

Graph-minus-ARE MRR@8 was **+0.21359**, with a repository-unit 20,000-draw
paired bootstrap 95% interval **[+0.04276, +0.39663]** and **10 wins,
11 ties, 3 losses**. This is a substantial *exposed development* gain, but
the frozen gate required **at least 20/24 top-30 reach and 16/24 wins**.
Both failed. No qualification or superiority claim follows. The original
HTTP logs and diffs remain transport-provisional.

The next distinct source-grounded hypothesis is failure-test-to-code edges:
this version excluded test-file filename anchors, although a failing test
source may import the implementation file. Test files should be used only as
navigation seeds, never promoted as likely patch targets. Any r3 experiment
must be separately versioned and sealed before evaluator scoring; the reserved
confirmation cohort remains unopened.

## Open Questions

- Does bounded test-to-implementation import traversal increase top-30 reach
  and case wins without degrading the r2 improvements?
- Can the full pipeline's source parsing and baseline ranking fit a fixed
  end-to-end cost budget on the VPS?
- Can HTTP log/diff provenance be independently authenticated or reproduced
  before a fresh superiority claim?
