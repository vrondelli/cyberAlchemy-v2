# G01 iterative source feedback development r1

## Fixed source-only pilot

Use exactly the preceding multi-view policy, then inspect its top three
production-ranked source seeds. For each, choose a20-line window, stride10,
distinct query-token overlap, earliest tie, cap1200characters, over first20000
Unicode source characters. Append these source-bound observations to the
expanded query, retrieve once more and include that production top50 rank as one
additional equal RRF k60 view. Add at most four missing fused top20 paths to the
unchanged caller-reader union. Control: identical per-case width, missing paths
selected by original expanded-query ranking. No generation, gold-informed seeds,
case exceptions, provider calls or fresh labels. Source-seal all62 exposed r3/r4
cases before repeated mapped-gold scoring. Reuse the pilot threshold: net >=2
cases above control, positive improvement in both cohorts, no base reach losses.
Keep the known incomplete r4 mapping visible; not complete-label confirmation.

[RepoCoder](https://arxiv.org/abs/2303.12570) motivates iterative repository
retrieval, but studies retrieval plus generation for code completion. This
deterministic source-feedback adaptation is neither its implementation nor its
reported benchmark. Previous [multi-view pilot](G01-DEFECTS4J-MULTIVIEW-DEV-R1.md)
failed advancement and is not silently replaced by this distinct experiment.

Implementation: [generator](../research/arb-trace2code-r1/screen-defects4j-iterative-source-dev-r1.mjs).
The shared post-seal mapped-file reach scorer preserves the same pilot thresholds
and denominator; each experiment has its own source and score receipts.

## Completed result — 2026-10-06

The source-pilot gate **failed**. All62 exposed cases are retained, candidate
widths match per case, maximum28, and there are no base reach losses. r3 mapped
reach remains30/32 for treatment/base/control; r4 remains28/30 for all three.
The one-case JacksonCore-7 gain of the earlier multi-view screen is absent here.
Net gain0 fails the threshold2; neither cohort improves. Three feedback-window/
fusion tests and Node syntax checks passed. No provider calls followed.

Every retrieved snippet carries its raw source digest and deterministic line
window in the private source seal. The known JxPath-7 incomplete mapping stays
explicit; this remains mapped-file reach, not confirmation or reader accuracy.
Do not promote this exact feedback rule. This failure does not refute RepoCoder
or AutoCrashFL; tasks and implementations differ.

[Source seal](/home/vlad_/are-benchmark-archive/defects4j-caller-r4/ITERATIVE-SOURCE-SCREEN-DEV-R1.json):
`4468bb4c4fbb74942ec957538ce4ab520bcb5d56a56353d746b62dd1f73b44ed`.
[Shared-schema reach score](/home/vlad_/are-benchmark-archive/defects4j-caller-r4/ITERATIVE-SOURCE-REACH-DEV-R1.json):
`343be5b45692ecaa3e8b058f8046b588f54347b5d1c230681506a0665e0eb31d`.
The shared scorer's schema uses its multi-view development-reach name; input
seal digests and distinct archive filenames identify this feedback experiment.

## Open Questions

The exact feedback rule did not improve reach above equal widening. Next: explicit
symbol/dependency navigation instead of repeating blended text expansion. Any
later pass permits only stronger source-informed comparator and bounded reader
development, not superiority. Complete-label representation, reader evidence quality, live
ARE, G02 quality/cost and broader G03 transfer remain open.
