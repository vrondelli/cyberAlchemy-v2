# G02 ranked-acquisition transfer test: ContextBench task 3

Status: two new GLM-5.3-Flash arms generated and natively scored on
2026-09-26. Both used the same frozen `full-cycle-80` source-only task,
container image, model, scorer and configured 1M-token profile. The assignments
were incremental batch recovery and radical ranked acquisition, with two
concurrent workers and no automatic model retry. This is an exposed development
task, not an untouched or deep-window confirmation.

| Arm | Span-F1 | File-F1 | Model tokens | Calls | Tokens vs historical DSH |
| --- | ---: | ---: | ---: | ---: | ---: |
| Corrected round-74 DSH task-3 baseline | 0.5125361243 | 0.8 | 307,103 | 20 | — |
| Corrected round-74 ARE task-3 baseline | 0.5366528354 | 0.8 | 240,586 | 95 | 21.66% fewer |
| New incremental recovery | 0.465121902 | 0.8 | 298,516 | 94 | 2.80% fewer |
| New ranked acquisition | 0.393656952 | 0.8 | 234,326 | 95 | 23.70% fewer |

Before scoring, the fixed task-3 comparison rule was no F1 regression versus
DSH, at least one F1 increase, and at least 15% fewer tokens (at most 261,037)
for the joint quality-and-token target. **Neither new arm passes the quality
rule.** Ranked acquisition meets the token threshold but loses 0.118879
Span-F1 versus DSH, and it also regresses against the earlier ARE result. It
uses 21.50% fewer tokens than the new incremental arm, but has lower quality.
Do not generalize the separate task-2 perfect score to task 3.

## Loss localization

After both generation arms closed, the evaluator identified three labeled
files. Both new arms selected the same two implementation files and omitted
`pkg/cmd/repo/view/view_test.go` (File-F1 0.8, recall 2/3). The source-only
`list_files` result showed all three paths in both arms, and the ranked primer
also surfaced the omitted test file. Neither arm produced a confirmed read
observation for that path. Thus the observed task-3 miss is downstream of path
discovery: the candidate was surfaced but not opened or carried into terminal
evidence. Ranked acquisition does not itself solve evidence follow-through.

## Accounting and evidence

Both containers exited zero and sealed `final_context_selected` with native
exports. The frozen generation package's 636 source bindings matched before
launch. Both scored predictions equal their sealed native exports; both model
ledger digests recompute correctly. Every dispatched model call has known
usage: 94/94 incremental and 95/95 ranked, summing exactly to 298,516 and
234,326 tokens. The largest input was 5,279/4,605 tokens respectively, so the
configured 1M capacity was not materially occupied. The native scorer reported
no error, and its two frozen source bindings still match. The historical
baseline is the [corrected round-74 result](../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/deepseek-audit-75/CORRECTED-RESULTS.json).

The [generation receipts archive](generation-receipts-v1.tar.gz) contains the
frozen config, task, freeze, review, source package, both complete evidence
trees, model ledgers and predictions (229 entries; SHA-256
`b9bc56b22239c5704470a2ff26677c77f944059b7e0d4948d93c440d453e8677`).
The evaluator outputs are [incremental](incremental-native-score.json) and
[ranked acquisition](radical-native-score.json). Original evidence and source
worktrees remain on the VPS under
`/opt/are-benchmark-runs/g02-transfer-task3-20260926-v1/`; the compressed
archive is mirrored under
`/opt/are/evolution-runtime/evidence/g02-transfer-task3-20260926-v1/`.
Reference/gold data were not mounted into either generation container.

## Next hypothesis and open questions

The next G02 candidate should test a bounded evidence-follow-through step:
when a source-only search or rank result identifies task-relevant tests or
integration surfaces, require a confirmed read or an explicit recorded reason
for exclusion before terminal selection. It must not inject evaluator labels or
force a particular file by name. First test this mechanism offline on source
receipts, then run a new fixed comparison on more than one task. Can it retain
task-2 precision while restoring task-3 recall, without inflating calls or
tokens? Will a genuinely occupied large context change the result?
