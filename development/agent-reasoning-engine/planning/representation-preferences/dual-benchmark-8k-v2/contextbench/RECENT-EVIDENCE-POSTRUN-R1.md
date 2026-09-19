# H-L recent-evidence ledger: live result and successor

## Result

The exact candidate-only GLM-5.3-Flash run completed all four fixed ContextBench
tasks with two workers. Process settlement was clean: exit code zero, no forced
termination, and the child process group is absent. All four outcomes are valid,
all requests remained within the 8K window, all trajectories were long, token
accounting is complete, and post-score integrity passed.

| Task | Model tokens | Span-F1 | File-F1 |
| --- | ---: | ---: | ---: |
| 1 | 83,434 | 0.0231 | 0.2857 |
| 2 | 83,996 | 0.4328 | 0.2222 |
| 3 | 82,043 | 0.4651 | 0.8000 |
| 4 | 82,019 | 0.3416 | 0.4000 |
| **Mean / total** | **331,492** | **0.3156** | **0.4270** |

The registered H-L hypothesis is counterevidence. Mean Span-F1 is 0.0761 below
the 0.3918 comparison threshold, and useful coverage per 10,000 model tokens is
0.0106 below its threshold. The run measured pooled direct-read repetition of
11/30 (36.7%) and ledger omission of 28/61 (45.9%), descriptively below the
historical 43/72 and 66/73. The design does not establish that recent-first
ordering caused those differences, and the lower rates did not coincide with
better quality. It used only 0.64% fewer tokens
than the prior best-quality measured-terminal run, far short of the original 15%
target. No perfect task was produced.

Exact evidence:

- production freeze SHA256: `df801b8349cb316761efc8f089dda73deb7c98750ed03e63910a7d5b8b3e8b62`
- launch review SHA256: `0df3cd91f033cdb3e1612a57ccfe0d4cf8c5ec18972a98e17168ea72d76d415b`
- supervised result SHA256: `c5e711915e544068430905862a90461d57da3bc921f136c55dc05b1c8908023b`
- native score SHA256: `96753f3fa60c580a8c0030f07e591985fa3a8d489e1a991fabc5991c12e0d110`

## Failure localization

Task 1 is the dominant failure. Its trajectory found evidence covering 38.1% of
the labeled spans, while terminal selection retained only 5.2%. More important,
the exported trajectory contained only one of five labeled files. This does not
prove that raw provider output never mentioned the others. All eight analyzed
candidate runs' scored terminal contexts concentrated on the compression
subsystem and omitted four labeled
build surfaces: `appveyor.yml`, `build/cmake/lib/CMakeLists.txt`, `lib/Makefile`,
and `programs/Makefile`. Selection alone cannot recover evidence that was never
acquired.

An evaluator-only analysis tested 13 terminal selectors over the completed trace
and eight total candidate runs, including H-L. The analysis made no new provider
or model calls, but the seven prior runs had their own model costs. A
four-file cross-run consensus selector reached mean Span-F1 0.4169 and mean
File-F1 0.5865 when applied post hoc to the new run. The 331,492 figure covers
only that new run; this analysis makes no token-savings claim. The score is 2.01
percentage points above the previous best exposed-cohort mean, but task 1
remained at 0.0207 Span-F1. The result supports testing a bounded
terminal-consensus mechanism and shows that the tested selection-only variants
cannot reach perfect quality on this cohort.

Offline analysis SHA256:
`77bca4fff8afbd8645c1df46421c7d510c2bd861c8b88dac28df52957a5ac24c`.
It is exposed-cohort hypothesis evidence, not untouched confirmation.

## Successor hypotheses

The incremental successor is **H-MC: memory consensus terminal selection**.
ARE ranks source paths by agreement across eligible prior outcomes, keeps the
highest-confidence bounded set, and uses no extra model calls. It is falsified if
the deterministic selector cannot reproduce the offline result from exact source
bindings or if it lowers any required integrity gate.

The radical successor is **H-EN: evidence-neighborhood frontier**. ARE represents
the task as explicit evidence obligations across implementation, tests,
documentation, integration/build, and task-specific surfaces. Confirmed source
evidence expands a deterministic repository neighborhood; visited and unresolved
obligations persist across context recycling. The model receives small separate
facet results instead of one broad query. It is falsified if acquisition recall,
native quality per token, or completion does not improve under the same 8K,
96K-per-task, 384K-campaign, and two-worker ceilings.

H-MC and H-EN must remain separate experiments. No fresh control run is part of
either branch. Historical controls remain descriptive evidence only.

## Open Questions

Can H-EN acquire task 1's nonlocal build surfaces without using benchmark labels
or forcing irrelevant files into every task? Can H-MC transfer to unseen tasks
without memorizing exposed task identities? Does the fixed task-1 label contain
task-irrelevant patch content that makes perfect retrieval an invalid product
target? Perfect quality, a verified 15% token reduction, and untouched
confirmation remain open.
