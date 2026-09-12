# ContextBench bounded evidence-index protocol

Status: C3 design selected; G not ready. No live outcomes. Authority effect none.
[Selection and exact evidence bindings](selection-v1.json) accompany this protocol.
[Continuity](continuity.json) and [acceptance](acceptance.json) remain controlling.

## Objective and question

The enduring goal is useful ARE reasoning state and completed outcomes within
cumulative input-plus-output token budgets. The initial GLM small-window work
asks whether useful evidence remains recoverable under pressure. This round asks
whether a deterministic index of previously delivered source observations helps
GLM recover and select relevant context during original ContextBench tasks.
ContextBench clearance is the current milestone, not proof of cross-domain transfer.

Use the existing research-learning ontology and typed CB117-H1/H0/H2/H3 records.
The companion selection binds their exact versions and predecessor decisions.
Scientific dependencies and execution-task criteria remain separate.

## Task fidelity

Keep the original issue-resolution instruction, exact repository and base commit.
The agent investigates and attempts a patch, then explicitly reports the source
context used. Evaluate retrieval with the pinned native ContextBench scorer.
Record patch/completion outcomes separately when an independent oracle exists;
a native context score is not a correctness verdict on the patch.

This follows the pinned upstream issue-resolution workflow and explicit final
patch-context extraction. A localization-only exercise may be a labelled offline
or supporting diagnostic, but cannot substitute for the intended benchmark run.
Using ContextBench's constituent issue tasks does not restore a separate
SWE-bench campaign. Gold context, reference patches and private test expectations
must remain inaccessible to the agent and to state construction.

## Matched comparison

Baseline and treatment share model/profile, tools and tool schemas, repository,
task text, error correction policy, archive access, source rendering, eviction
algorithm, output cap, cumulative token cap and final-context reporting format.
Neither arm receives extra free calls for state construction or final selection.
Final selection must be bound to an actual recorded model response.

The treatment adds a bounded deterministic index of confirmed delivered reads:
stable read ID, path, source digest, line range and retrieval handle. No model
summary or evaluator-provided relevance ranking. Keep the most recently confirmed
unique reads in a fixed order and evict oldest entries when the index limit is
reached. Freeze the exact entry and token limits before live dispatch. The baseline
retains the same archive/retrieval capability without the automatically presented
index. Include index presentation tokens in the treatment's cumulative usage.

This is a state-presentation intervention, not new tool authority. Both arms
retain legal recovery actions after malformed calls. Repairs to shared tool
contracts apply before freeze and identically to both arms.

## Discriminating evidence

- H1: improved final native span selection, plus confirmed delivery, displacement
  and subsequent retrieval/use where a retention mechanism is claimed.
- H0: no useful gain despite accessible, correctly bound historical observations;
  analyze selection/task-understanding failures instead of enlarging archives.
- H2: improvement is limited to admission/presentation conditions or disappears
  under controlled matched displacement. Native scores alone cannot reject H2.
- H3: action, delivery or scoring faults prevent interpreting the comparison.
  Preserve affected outcomes, repair the instrument in a new version and rerun
  a separately frozen round; never silently replace failed cells.

The two-arm natural-task comparison can establish end-to-end effect, not by itself
identify H1 against H2. Supporting common-prefix retention diagnostics are needed
only for a specific causal claim. Do not force displacement by adding irrelevant
material to the native tasks. Cases without exposure are not-exercised for that
mechanism, while their native outcomes stay in the cohort.

## Task order and freeze criteria

1. Bind runner inputs without gold leakage, exact source snapshots, and final
   context to model-response receipts. Preserve base-revision coordinates when
   the agent edits files; distinguish pre-edit and post-edit observations.
2. Implement the bounded index and matched baseline using the same transport,
   tools and recycler. Confirm recovery handles resolve only observed source.
3. Verify action correction, delivery, final-selection and total-token admission
   offline. Existing historical receipt replays are instrument evidence only.
4. Freeze a finite development cohort drawn solely from declared development IDs,
   exact call/index/output limits, GLM profile, source/code hashes, paired matrix,
   D08 criteria and verifier, stopping rules and exposure analysis before dispatch.
5. Run every scheduled cell, score independently and retain failures/unknowns.
   Create observations and a reviewed learning decision; update the remaining gap.
6. Create a new version after negative/inconclusive learning. Use reserved
   confirmation only after development criteria pass. Acceptance remains unchanged.

Full scope remains 1,136 tasks. Three empty annotations remain visible coverage
issues; a development run does not clear the full benchmark or resolve those rows.
No live run is authorized by this planning artifact alone; existing user scope
and the selected implementation construction boundary govern execution.

## Open Questions

G owns the exact finite cohort, index/output/call limits, endpoint profile and
D08 verifier bindings. Runner construction owns response-bound final context,
search/paging delivery and base-coordinate handling after edits. C1/CB own the
three empty annotations. These are explicit remaining tasks, not evidence of a
passed freeze or a supported hypothesis.
