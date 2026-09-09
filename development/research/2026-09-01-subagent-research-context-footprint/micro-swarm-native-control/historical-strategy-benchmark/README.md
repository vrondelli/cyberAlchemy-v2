# Historical Strategy Swarm Benchmark

Status: prepared, awaiting exact fan-out approval  
Evidence class: non-governed comparative simulation

This benchmark tests whether Luna swarms can reconstruct three preserved
historical research results from their raw `research.md` inputs. The original
`findings.md` files are withheld from explorers, reducers, synthesizers, and Sol
baselines. Only dataset-local judges see the historical findings after both
candidates are frozen.

It preserves two strategy arms:

```text
control:     3 Luna lens explorers -> 1 Luna synthesizer
micro-shard: 9 Luna atomic extractors -> 3 Luna angle reducers
                                           -> 1 Luna synthesizer

raw research input -> 1 blind Sol baseline
swarm candidate + Sol baseline + withheld findings -> 1 Sol rubric judge
```

The control has 18 logical roles. The micro-shard arm has 45 logical roles:
27 extractors, 9 reducers, 3 synthesizers, 3 Sol baselines, and 3 Sol judges.
Each extractor receives only its angle's manifest-bound source slice and one
facet, rather than the whole `research.md`; repair appendices remain attached
to the affected angle. The slices cover every explorer-return byte once at the
angle level, while three facet readers independently inspect each slice.
On the current three-child host ceiling it requires 15 physical waves. With at
least 27 serving slots, its dependency graph has four ideal stages. This makes
prompt-size, merge-loss, wall-time, and reconstruction-quality trade-offs
directly measurable rather than assuming that more splitting is faster.

The three datasets differ in subject matter and original model mix. They are
comparison targets, not interchangeable authority: one has an explicit final
accept decision, one preserves a produced result without local final-approval
evidence, and one has an evidence-closure `ready` receipt without a local final
approval file.

The parent reports per-dataset scores, paired swarm-minus-Sol deltas, wall time,
failures, and residual differences. No result establishes general model parity,
historical-result replacement, benchmark admission, publication, or deployment
authority.
