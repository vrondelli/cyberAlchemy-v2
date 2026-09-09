# Obsidian TOC ontology pilot results

2026-09-05. Pilot complete; full experiment blocked before the nine measured runs.
Authority effect: none. No commits, publication, product approval or ARE activation.

The research-ontology pilot did not outperform ordinary coding or the checklist
in this pilot. All three completed solvers passed the same 37 of 41 raw feature
tests, failed the same four, and preserved all 1,131 scored regression tests.
None achieved an official benchmark pass.

## Observed outcomes

| Run | Official task result | Official feature matches passed | Raw feature tests passed | Scored regressions passed |
|---|---|---|---|---|
| Pristine-base preflight | FAIL, expected | 0/41 | New rule absent | 1131/1131 |
| A: ordinary coding | FAIL | 0/41 | 37/41 | 1131/1131 |
| B: checklist replacement | FAIL | 0/41 | 37/41 | 1131/1131 |
| C: research ontology | FAIL | 0/41 | 37/41 | 1131/1131 |

The first B attempt ended with the native service error “Selected model is at
capacity.” It produced no source patch and is retained as `not_evaluable`, not a
coding failure. Its one permitted replacement used a fresh context and clean
container on the same inherited model. No interrupted work or evaluation
feedback was transferred.

Machine results: [results.json](results.json).

## Why official and raw counts differ

All three implementations emitted the feature test suite prefix `Auto TOC`.
The pinned grader configuration expects `Auto Table of Contents`. Exact test-ID
matching therefore reports every feature case missing even though Jest executed
all 41. A diagnostic substitution of that prefix matches all 41 expected IDs and
recovers the observed 37 passing cases for each run. This is a diagnosis, not a
replacement score: the official verifier and all submitted patches stayed intact.

The four raw failures remain real after that diagnostic name substitution. The
assertion differences show correct anchors but incorrect visible TOC labels:
links and image embeds were stripped where the expected labels retained their
original markup. The repeated failure illustrates the distinction between
anchor normalization and display-label formatting. This diagnosis was collected
only by the evaluator and was not supplied to later solvers.

The official combined partial score is about 96.5% even on the untouched base,
because the existing regression cases dominate the denominator. It is not a
useful task-completion headline here.

Evidence: [A discrepancy](evidence/runs/pilot-A/grader-discrepancy.json),
[B discrepancy](evidence/runs/pilot-retry-B/grader-discrepancy.json),
[C discrepancy](evidence/runs/pilot-C/grader-discrepancy.json).

## Ontology produced and checked

The [C research ontology](evidence/runs/pilot-C/notes/ontology.json) contains
59 nodes and 69 typed relationships: 9 sources, 7 requirements, 7 hypotheses,
7 code locations, 10 test-case records and 19 observations. Nine historical
observations are explicitly stale. This is a generic evidence graph for this
task, not an admitted ARE or repository ontology.

The independent [graph check](evidence/runs/pilot-C/graph-check.json) found:

- unique node IDs, valid typed endpoints and no dangling edges;
- a source, implementation hypothesis and test link for every requirement;
- matching current code/observation hashes against the frozen solver container;
- matching hashes for all nine source records.

This establishes reference consistency and recorded freshness. It does not
establish that the requirements were interpreted correctly. In this run, a
consistent graph coexisted with the same four implementation failures as the
other arms. There is no observed correctness gain in this pilot, and one run
per arm cannot establish general method efficacy or equivalence.

The checklist control is preserved at
[B checklist](evidence/runs/pilot-retry-B/notes/checklist.json). All working
scaffolds and development tests remained outside submitted source patches.

## Execution and limitations

The task manifest, instruction, environment description and unchanged official
verifier were fetched from benchmark commit
`0b9fabbb63b9104d678fe965e1632f2dd9eaa2ea`. Every solver and verifier began at
Obsidian base `6393b3ab32a2ace1fc24d4b0f5e0f13a179c874f`, using image digest
`sha256:56d3ffcde2ca373ffa0107f830b243d66191020f7021806acc8d609148518092`.
See [manifest](manifest.json), [frozen pilot inputs](evidence/pilot-inputs.json)
and [environment versions](evidence/environment.json).

Solvers ran serially in fresh native helper contexts, each restricted to a
separate no-network container with two CPUs and 8 GiB memory. No reference
solution was fetched. Evaluator tests were absent from solver containers; they
were copied only into separate pristine verifier containers. The native helpers
still had a shared host tool surface, so host scope was instruction-enforced,
not a claimed adversarial security boundary. Full native trajectories and model
usage were not exposed; saved command logs and helper receipts are available.

The common protocol overrode the task's commit request. A disposable Git index
collected tracked and new `src/**` changes as a binary patch without modifying
the main index or committing. The unchanged official grader applied that patch
in a pristine container. This local collection adaptation is not a claim to have
run Pier's complete end-to-end agent integration. Each patch contains only
`src/rules/auto-toc.ts` and `src/lang/locale/en.ts`.

Native helpers provided neither an exact provider model-version pin nor a token
meter/enforceable token cap. These limitations were recorded in the
[pilot adaptation](contracts/pilot-adaptation.json) before solving. The pilot
used the inherited model and a monitored 60-minute wall limit per attempt.
Tokens and billed cost remain unknown, not zero or estimated. Helper-reported
timestamps are preserved, but A's first timestamp omits initial work and operator
join times include delay; no comparative latency or efficiency claim is made.

All completed solvers passed their development tests. The repository-wide
typecheck was not clean. B and C compared their final diagnostics against a
virtual pinned baseline and reported 21 unchanged diagnostics. A reported no
remaining new-rule diagnostics but did not perform an independent base
typecheck. These development checks do not override official outcomes.

All solvers are joined. Frozen patches, notes and evaluator logs are retained;
the experiment containers are stopped. The downloaded image and stopped
containers remain as operational residue. Nothing was submitted externally.

## Evidence and replay

| Arm | Frozen patch | Solver report | Official receipt |
|---|---|---|---|
| A | [patch](evidence/runs/pilot-A/model.patch) | [report](evidence/runs/pilot-A/notes/report.md) | [receipt](evidence/runs/pilot-A/evaluation/receipt.json) |
| B replacement | [patch](evidence/runs/pilot-retry-B/model.patch) | [report](evidence/runs/pilot-retry-B/notes/report.md) | [receipt](evidence/runs/pilot-retry-B/evaluation/receipt.json) |
| C | [patch](evidence/runs/pilot-C/model.patch) | [report](evidence/runs/pilot-C/notes/report.md) | [receipt](evidence/runs/pilot-C/evaluation/receipt.json) |

The original B attempt's [failure receipt](evidence/runs/pilot-B/join.json)
and [replacement binding](evidence/replacements.json) remain separate.
Each evaluation directory includes raw stdout, framework reports, CTRF results
and unchanged official reward output. Receipts bind patch and log hashes.

From this experiment directory, `python3 scripts/check_evidence.py` checks
frozen inputs and result bindings without writing. `python3
scripts/summarize_pilot.py` prints descriptive results. The local operator is
`scripts/run_local.py`; existing attempt IDs cannot be overwritten. The
replacement used the same operator functions with the separately recorded
`pilot-retry-B` identifier. Replaying requires a new evidence destination;
do not overwrite frozen attempts or restart their solvers.

## Remaining frontier and Open Questions

Product-construction frontier: pilot source candidates and an inspectable
research scaffold exist, but the task is not passed. No post-grading repair was
performed. Runnable independent follow-on work is a separately labeled design
revision that explicitly distinguishes heading source, anchor text and visible
TOC label. That is a candidate research direction, not evidence of improvement.

| Operational support | Owner | Affected stage | State |
|---|---|---|---|
| Exact model pin and token-budget enforcement | Experiment host/operator | Nine measured model runs | BLOCKED: unavailable through current native tools |
| Treatment of display-name-sensitive scoring | Evaluation operator / benchmark owner | Interpretation of future measured results | Open; preserve official scores and diagnostic counts separately |
| Image and stopped-container retention | Local experiment operator | No construction stage | Deferred operational residue |
| Commit, publication, benchmark submission or ARE activation | Respective owner | No stage in this experiment | Not performed; separate scope |

No answer selecting revised measurement controls was received during the pilot,
so the original controlled nine-run phase remains unstarted. The complete
experiment is not claimed achieved. A future run needs a host exposing the
planned controls, or an explicitly selected revised protocol frozen before
measurement. The scored pilot cases must remain excluded from that comparison.
