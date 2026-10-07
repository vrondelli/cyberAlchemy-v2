# G01 source-floor exposed-task development screen

This is a label-free selector applied offline to the already-exposed HEN-11
v22 trajectories. It dispatches no model. It cannot establish prospective
quality, token, or wall-time improvement. Source rows remain at the pinned
VPS run; only derived predictions and receipts are retained here.

The first [eight-handle freeze](SCREEN-FREEZE-r2.json) failed the exposed
screen: task 1 Span-F1 stayed `0`, task 4 reached `0.085521`, and mean
Span-F1 was `0.042761`. A subsequent [regional-diversity refinement](SCREEN-FREEZE-r3.json)
was explicitly developed after observing r2 on already-exposed tasks. It
recovered nonzero task-1 Span-F1 `0.012753`; task 4 remained `0.085323`, and
mean `0.049038` still missed HEN-10's `0.073272` threshold. Task 4 also
missed its `0.126544` nonregression floor. Both candidates are rejected.

A subsequent [source-neighborhood upper-bound diagnostic](UPPER-BOUND-RESULT-r1.md)
expanded selected source spans by 16 lines on pinned base files. It raised the
two exposed-task native Span-F1 values to `0.100899` and `0.182173`, but those
extra lines were never delivered to the model. This is feasibility evidence
only, not an ARE benchmark result or a promoted candidate.

Task 1's v22 trajectory contained reads from the correct C source file, but
the first selector chose nearby non-gold lines. Regional diversity selected
one confirmed read within a labeled region and produced a small positive
score. This supports a source-neighborhood/localization hypothesis, not a
final-selection-only solution. A future live candidate must acquire and
present relevant line neighborhoods within the 8K window, then use a fresh
task for comparative evidence. Do not rerun these exposed tasks for a
prospective claim.

Score receipts: [task 1 r2](task-1-native-score-r2.json),
[task 4 r2](task-4-native-score-r2.json),
[task 1 r3](task-1-native-score-r3.json), and
[task 4 r3](task-4-native-score-r3.json). The v22 source run is
`/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev`.

## Open Questions

- What bounded source-neighborhood acquisition raises line localization rather
  than only file coverage?
- Can the next live candidate keep its full request envelope within 8K while
  improving accuracy and retaining token/time efficiency?
