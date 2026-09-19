# H-EN evidence-neighborhood frontier

## Objective and gap

The enduring objective is reusable reasoning continuity and better completed
outcomes within fewer total model tokens. The current milestone remains the four
fixed GLM-5.3-Flash ContextBench tasks at 8K. H-L improved ledger visibility but
returned only 0.3156 mean Span-F1. Its exported trajectories covered only 46.7%
of labeled files even though all integrity and accounting gates passed.

Research method: objective → measured gap → question → competing hypotheses →
bounded experiment → result → reviewed decision → successor.

## Competing hypotheses

- **H-EN:** task facets plus deterministic neighborhoods of visited source paths
  expose relevant unvisited files without additional model calls.
- **H-B:** broader queries return more distractors but do not improve labeled-file
  acquisition after a bounded cutoff.
- **H-S:** source paths are found, but presenting or reading them costs enough
  context that native quality and total-token efficiency do not improve.
- **H-D:** some labels are not inferable from the task, so exposed-cohort path
  recall can rise without general product value.

H-EN is selected for construction evidence. The other hypotheses remain active
falsifiers. No fresh control branch is used.

## Additive mechanism

The worker builds one verified index from the clean pinned base checkout, rather
than rebuilding it for every facet or starting one `git cat-file` process per
blob. The parent verifies a clean checkout and exact commit before and after the
child. The child records content hashes, applies a 512 MiB address-space bound,
accepts at most eight queries, and makes no provider calls.

Eight label-blind facets are computed before label comparison:

1. task statement;
2. verification/tests;
3. documentation;
4. CMake/build;
5. Make/build;
6. CI/package;
7. visited-source neighborhood;
8. nearest visited test-tree neighborhood.

Each facet returns at most ten highest-ranked paths, with one window per path.
The visited facets use only paths already present in the candidate's exported
trajectory. Hidden labels never enter query generation or ranking.

## Offline result

The final R5 replay recovered every labeled file absent from the four H-L
exported trajectories:

| Task | Trajectory file recall | Frontier projected recall | Missing paths recovered |
| --- | ---: | ---: | ---: |
| 1 | 0.2000 | 1.0000 | 4 / 4 |
| 2 | 0.5000 | 1.0000 | 1 / 1 |
| 3 | 0.6667 | 1.0000 | 1 / 1 |
| 4 | 0.5000 | 1.0000 | 3 / 3 |
| **Mean** | **0.4667** | **1.0000** | **9 / 9** |

R5 evidence SHA256:
`5919f1fc4edb9ea2cb91c9786ab385607038df944dc1a7d380830b1b8b335f3c`.
This is the first perfect labeled-file acquisition replay in this benchmark
episode. It is not a perfect ContextBench score. The replay returns up to 80 raw
hints per task; it does not prove that they fit a model request, become confirmed
read evidence, are selected with correct spans, improve native Span-F1, or save
tokens. It uses the exposed cohort and cannot serve as untouched confirmation.

The iterations were informative: top-five fixed facets reached 73.3% projected
mean file recall; top ten reached 87.5%; adding visited neighborhoods reached
95.8%; path diversity removed duplicate-window waste; the visited test-tree facet
recovered the final Svelte harness and reached 100%.

## Next bounded gates

1. Add fixture tests for multi-query source identity, path diversity, limits,
   parent post-verification, and failure settlement.
2. Compress and deduplicate the frontier into a tokenizer-measured path/range
   view. Do not auto-read or claim evidence from hints.
3. Integrate a separate H-EN tool or state view so the model can request verified
   reads. Keep H-MC terminal consensus out of this experiment.
4. Replay long local trajectories and prove complete accounting under the same
   8K, 96K-per-task, 384K-campaign, and two-worker ceilings.
5. Run initial, populated, and terminal tokenizer qualification, then independent
   source and launch review.
6. Dispatch a candidate-only live run only if every prior gate passes. Score all
   four tasks and retain failures and all token costs.

## Open Questions

What is the smallest frontier view that retains all nine missing paths? Will GLM
read and select useful hints rather than spend tokens on distractors? Can the
mechanism transfer to untouched tasks and non-code evidence graphs? Does task 1
contain label content that is not inferable from its issue statement? Perfect
native quality, a verified 15% total-token reduction, and untouched confirmation
remain open.
