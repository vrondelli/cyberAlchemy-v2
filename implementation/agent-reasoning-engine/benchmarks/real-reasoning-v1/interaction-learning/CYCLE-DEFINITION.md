# Interaction-Learning Objective Cycle

Status: objective closed; IL-H04 retained as supported construction candidate  
Cycle kind: `interaction-learning`  
Primary metric: `episode_success_rate`  
Authority effect: none

This document consolidates the product-owner selections DG-IL-01 through
DG-IL-14. It governs the historical Codex-session ingestion and objective-cycle
experiment. It does not activate an engine change, admit the candidate cycle
definition, or authorize publication or deployment.

## Objective

Increase successful completion of long ARE workflows by reducing avoidable
state loss, scope drift, repeated clarification, incorrect cycle or benchmark
transitions, unclear language, and incorrect interaction ordering.

`episode_success_rate` is the percentage of eligible objective-bounded episodes
completed without an assistant-caused correction or recovery turn. Language and
ordering are diagnostic causes inside this objective, not replacement metrics.

## Owner decisions

| Gate | Selected decision |
| --- | --- |
| DG-IL-01 | Use the focused evidence cohort: the 73 Windows Codex sessions selected by CyberAlchemy/ARE working-directory evidence plus the 2 WSL sessions. Other sessions remain outside this cycle. |
| DG-IL-02 | Process visible messages locally; inspect tool and reasoning structure transiently; detect and exclude secrets; never retain credentials, encrypted reasoning content, tool payloads, or environment values. Persist compact redacted structural facts, hashes, metrics, and lessons. |
| DG-IL-03 | Optimize workflow continuity and clarity. Primary metric: `episode_success_rate`. |
| DG-IL-04 | Episodes are objective-bounded. Session, WSL, restart, and environment-reset boundaries do not split a continuing objective. |
| DG-IL-05 | Outcomes are `success`, `failure`, or `indeterminate`. Only success and failure enter the metric denominator. |
| DG-IL-06 | Count failure only with evidence that the assistant caused the repair. Other attribution values are user objective change, external failure, and ambiguous. |
| DG-IL-07 | Record one primary cause plus zero or more contributing factors from state continuity, scope transition, ordering/coordination, language/clarity, evidence/completion, environment/recovery, and execution error. |
| DG-IL-08 | Split chronologically while keeping all episodes for a continuing objective in one discovery, validation, or frozen-holdout partition. |
| DG-IL-09 | Screen hypotheses offline, then validate surviving candidates on bounded new live interactions through a separate evaluator. |
| DG-IL-10 | Require baseline-relative improvement, a predeclared sample, no critical regression, independent evaluation, and explicit uncertainty. Passing makes a candidate eligible for review only. |
| DG-IL-11 | Continue through as many hypotheses as the objective requires. Completion needs a sustained numeric target, guardrail preservation, independent evaluation, and owner approval. Exhaustion is not completion. |
| DG-IL-12 | Limit each hypothesis to named, reversible reasoning-system surfaces with an exact target, causal prediction, metric, and rollback. Model weights, unrelated surfaces, secret retention, and automatic activation are excluded. |
| DG-IL-13 | Preserve a versioned learning package: lesson, candidate change, evidence bundle, evaluator verdict, limitations, decision receipt, and rollback binding. Do not duplicate raw source logs. |
| DG-IL-14 | Close conceptual definition. Measure and freeze the remaining empirical parameters during ingestion and baseline construction. |
| DG-IL-15 | Retain the supported IL-H04 learning package and close this objective. This does not activate or deploy the candidate; serving integration requires a separately authorized successor cycle. |

## Episode and label contract

The scanner produces turn references and structural signals, not final episode
labels. A separate evaluator groups turn references into continuing objectives
and supplies the outcome, causal attribution, categories, evidence note, and
evaluator identity. The baseline calculator fails closed on unknown turns,
duplicate turn assignment, invalid categories, or a failure not attributed to
the assistant.

Raw user and assistant text can be inspected transiently by an authorized local
evaluator. The durable ingestion artifact contains message hashes, ordinals,
timestamps, lengths, language hints, correction-signal classes, tool-name
counts, and source identities. It contains no message text, tool arguments,
tool outputs, environment values, encrypted reasoning, or credential values.

## Evaluation and lifecycle

```text
source logs
  -> streaming cohort scan
  -> privacy-safe evaluation tasks
  -> independent objective grouping and labels
  -> frozen historical baseline and chronological partitions
  -> hypothesis portfolio
  -> offline validation
  -> bounded live validation
  -> independent assessment
  -> owner review
  -> candidate learning package or preserved negative result
```

No historical replay can substitute for prospective live evidence. No passing
candidate can activate itself. A controlled-upgrade cycle remains a separate
successor with its own authorization and rollback evidence.

## Empirical parameters to freeze

These are produced by the first real run rather than chosen by narrative:

- eligible and indeterminate episode counts;
- discovery, validation, and holdout sizes after objective grouping;
- historical `episode_success_rate` and diagnostic counts;
- minimum live-validation sample;
- numeric completion target; and
- materialized evidence size and archive placement.

The first execution froze these values:

- 63 historical episodes: 50 eligible and 13 indeterminate;
- chronological partitions: discovery 38 episodes, validation 13, holdout 12;
- historical `episode_success_rate = 0.50`;
- minimum prospective sample `20`;
- numeric target `0.75`, with Wilson 95% lower bound above `0.50`;
- zero allowed critical regressions; and
- recommend-only posture with no automatic activation.

Four hypotheses were evaluated. IL-H04 passed at 20/20 with Wilson lower bound
`0.8389`; IL-H01 through IL-H03 are retained as negative results. Exact results
and claim limits are in [RESULTS.md](RESULTS.md).

## Open Questions

- What real-user confirmation cohort is required before any later activation?
- The separately authorized engine-improvement cycle selected and implemented
  the ARE Codex wrapper's post-objective-resolution boundary; it remains
  disabled pending later confirmation and upgrade decisions.
