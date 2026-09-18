# ContextBench Round 49 — Fresh H67 replication

## Objective hierarchy

Enduring objective: Improve reusable ARE reasoning, useful continuity, recovery, correctness, and completed outcomes within cumulative model input plus output tokens.

Initial GLM objective: Finish GLM-5.3-flash qualification, beginning with the 8K small-window chapter and useful reasoning-state recovery under pressure.

Current milestone: Replicate the Round 48 development result on a larger fresh ContextBench cohort before declaring the 8K intervention stable.

## Research method

objective → gap → question → competing hypotheses → selection → experiment/tasks/criteria → results → observations → reviewed decision → successor

## Evidence-led question

Round 48 passed all frozen development-canary gates across eight tasks: +5.17 percentage points macro Span-F1, no context-quality degradation, one additional valid selection, and 26,343 fewer logical cumulative tokens. The quality gain occurred in the terminal phase, while token savings occurred in the effect phase. Does the unchanged H67 intervention retain its combined quality-per-token benefit on a larger fresh cohort?

- **H67-R49 — unchanged universal decision-bound state:** replicate `decision-state/v1`, its earliest-boundary state machine, neutral control review, limits, prompts, and scorer without outcome-informed changes.
- **H67-phase-instability:** the combined Round 48 pass resulted from unstable phase composition or a few influential tasks and will not replicate.
- **H62 — terminal compact review:** terminal state is the only useful component; retain as a successor only if the unchanged replication fails in a phase-specific way.
- **H0 — no transferable observable-state gain:** Round 48 was cohort variance.

Select H67-R49. Replication precedes mechanism tuning so Round 48 evidence is tested rather than fitted.

## Fixed decision rule

Use 16 fresh, never-matrix-exposed, public, scoreability-gated tasks at 8K and the same 96,000 cumulative input-plus-output cap per logical path. Select across all available public language strata and prefer repository diversity. Public safety screening occurs before freeze. Gold paths, spans, patches, and content remain sealed from selection and state construction.

Each task creates one shared prefix and matched control/treatment branches at the unchanged earliest effect, terminal, or typed-pressure boundary. Require all 16 identities to be accounted for and at least 12 complete causal pairs. Preserve zero automatic retries, fixed denominator, no replacements, conservative unknown-usage debit, the 3,072-token per-pair treatment ceiling, and immediate infeasibility stop.

The primary replication gate remains treatment-minus-control macro Span-F1 of at least +0.05, no degradation in span coverage, span precision, file coverage, file precision, or valid-selection rate, and aggregate treatment tokens no greater than control. Report effect and terminal/pressure strata separately as diagnostics; do not change the combined gate after observing phase counts.

A pass closes the development replication step for the 8K intervention and requires an explicit decision about the scale needed for final small-window qualification. A fail selects the successor only from recorded phase evidence and does not trigger task reruns or in-round treatment changes.

## Work DAG

```mermaid
flowchart LR
  A[Bind R48 outcome and closeout] --> B[Register replication hypotheses]
  B --> C[Lock unchanged treatment and gates]
  C --> D[Select 16 fresh stratified tasks]
  D --> E[Public safety and sealed scoreability gates]
  E --> F[Prepare pinned repositories]
  F --> G[Native scorer smoke]
  G --> H[Runtime regression suite]
  H --> I[Zero-model preflight]
  I --> J[Freeze cohort and execution]
  J --> K[Run paired live sequence]
  K --> L[Score fixed denominator]
  L --> M[Phase-stratified analysis]
  M --> N[Reviewed decision and successor]
```

## Storage policy

Prepare repositories in the retained-data root, clean each reconstructible worktree after its cell closes, and preserve compact manifests, receipts, logs, hashes, scored outcomes, and closeout records. Check free space before freeze and after execution. Do not accumulate round-specific caches under the WSL virtual disk.

## Open questions

- Is 16 fresh tasks sufficient to close development replication, or should final 8K qualification require a larger confirmation tier?
- Will the effect-phase token reduction remain after repository and task diversity increase?
- Will terminal-boundary state retain its context-quality benefit?
- Does a pressure-boundary trajectory appear in the larger cohort?
- What non-code retention benchmark should test transfer after the 8K code-context chapter?
