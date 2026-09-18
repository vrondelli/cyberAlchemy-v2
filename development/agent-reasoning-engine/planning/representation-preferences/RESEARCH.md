# Recurring representation preferences: research and design

Date: 2026-09-18. Candidate construction; authority effect none.

## Objective and observed gap

The user wants ARE to offer a reusable representation after repeated requests,
such as plans in DAG form. The existing learning ledger stores explicit lessons
and revocations but has no recurrence-to-offer mechanism. Its evolution recurrence
counts failures, not representation requests. Source: implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/interaction-learning-lifecycle.mjs.

This contributes to the objective in agent-reasoning-engine/LIGHTHOUSE.md:
useful continuity and completed outcomes within total model input/output tokens.
The original GLM small-window objective and completed bounded 8K milestone remain
unchanged; the ContextBench 10K frontier remains separate. This user-requested
capability study does not replace that benchmark or claim cross-model improvement.

## Question and competing hypotheses

Q1: Can explicit repeated format requests support useful preference offers without
silently treating repetition as consent or applying a format in unrelated tasks?

H1: Three distinct completed requests in the last twenty requests, in the same
thread and task category, justify one offer. Explicit acceptance creates a scoped
lesson. Exact task matching and current format overrides prevent leakage.
H0: Manual explicit feedback is sufficient; offers add annoyance without benefit.
H2: A semantic model detector handles varied wording better than a bounded lexical
detector, but adds tokens and attribution errors. Defer model detection until H1's
host contract is tested. Repeated one-off needs remain counterevidence to H1;
therefore an offer is a question, never automatic consent.

Prediction: the local suite produces an offer at the threshold, no premature
lesson, exact scoped application after acceptance, and no application after
revocation, conflicting current instruction, or a task change. Any violation
rejects the candidate. These are contract claims, not human usefulness claims.

## Primary benchmark research

- PrefEval: https://arxiv.org/abs/2502.09597 and
  https://github.com/amazon-science/PrefEval. Explicit/implicit preferences and
  later questions test preference following. Select for a future paired output
  evaluation; published tasks do not directly test asking permission to save.
- BenchPreS: https://arxiv.org/abs/2603.16557. Appropriate Application Rate and
  Misapplication Rate measure context-sensitive application/suppression. Select
  its distinction for negative cases; our local cases are not BenchPreS scores.
- LongMemEval: https://github.com/xiaowu0162/LongMemEval. Knowledge updates,
  multi-session reasoning and abstention help test changed or unavailable memory.
  Supplementary, not the main representation benchmark.
- LongMemEval-V2: https://github.com/xiaowu0162/LongMemEval-V2. The 2026 successor
  evaluates agent experience in web/enterprise trajectories. Its large multimodal
  histories and latency-oriented leaderboard are a weaker fit for this bounded
  preference feature. Do not download its large data for this work.

No external dataset or model run is represented as completed. A future paired
study must pin versions, separate development/confirmation tasks, record complete
input+output usage (including detector and judge calls), and compare manual-only,
confirmed offers, and semantic detection at equal budgets and context sizes.
Bytes and deterministic test counts are not token savings or semantic quality.

## Proposed implementation

Use the existing interaction review host and ReasoningState ledger. Derive offers
from persisted successful host requests; never count references, failed turns,
duplicate IDs, quoted text, ambiguous wording or unaccepted suggestions. A small
anchored grammar supports plan/compare tasks and DAG/table/checklist/plain formats.
Unrecognized language abstains. Preserve raw requests and record evidence IDs.

Add an optional closed preference decision field to the host request: offer ID,
accept/decline, and explicit retention scope for acceptance. Decisions live in the
same host request journal. An accepted offer is translated to the existing feedback
path using a verbatim confirmation instruction. Add optional typed applicability
to lessons (task and format); legacy lesson records keep their existing shape.
Host input provides task/format classification; runtime selection uses exact task
identity and suppresses lessons when a current format differs. Old journal replay
must retain its digests. Existing disable-reuse controls remain authoritative.

Offers appear in completed results and inspect(), outside model instructions.
An offer remains visible for decision, but is emitted as new only once. Declining
suppresses that task/format in the thread; acceptance suppresses further offers.
No automatic preference learning is activated in repository/gateway defaults.

## Method and evidence limits

Use the research-learning ontology D01/D02/D03/D04/D05/D07/D08 distinctions:
observation → question → competing hypotheses → selection → experiment → result
→ reviewed decision. This document is a first-round design, not a registered
research DAG or frozen ContextBench experiment. The task DAG is a construction
plan. Local conformance testing does not establish generalization or complete the
research milestone. Review this design before the DAG, then review the DAG before
code. Preserve failures and rerun only after a relevant change.

## Open Questions

Does three-request recurrence predict user acceptance? Which wording should a
semantic detector cover? How much provider-token cost does projection add? Those
require a separately frozen live study and user feedback; local tests cannot answer.

## Design review corrections

The independent reviewer required: a canonical verbatim confirmation matching
the offer; acceptance is resolved only when its bound lesson exists; unsuccessful
requests consume the twenty-request window; mode off suppresses offers; immutable
offer IDs bind their original evidence; typed conflicting formats fail closed.
Pending offers expire when their evidence leaves the window. Declines persist
per thread/task/format; saved product preferences suppress duplicate offers in
other threads, including after revocation (revocation must not cause prompting).
Acceptance of another active format for the same task requires explicit prior
revocation. A failed provider call after lesson storage does not undo consent;
a failure before lesson storage does not resolve the offer. Replayed old records
must retain exact digests. These corrections are mandatory implementation gates.
