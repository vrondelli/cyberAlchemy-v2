# Define Downstream-Utility Protocol

Protocol ID: `define-downstream-utility@1`

Status: `prepared-not-authorized-for-live-run`

## Hypotheses

- **H1 — selected information:** `equivalent_notes` improves outcomes over
  `ticket_only` on high-ambiguity tasks.
- **H2 — Define structure:** `definition_pack` improves outcomes over
  `equivalent_notes` when both contain the same fact set.
- **H3 — evidence enforcement:** `definition_pack_evidence_gate` improves
  outcomes over `definition_pack`.
- **H4 — negative control:** Define structure does not materially degrade
  low-ambiguity tasks.

Each hypothesis may fail independently. H3 must not be attributed to Define's
pack-only product meaning.

## Pilot Shape

Prepare six task blocks:

- two low-ambiguity controls; and
- four high-ambiguity tasks with a pre-identified consequential tension in
  meaning, context, ownership, allowed action, or blocked action.

Each task runs once in all four conditions, producing 24 independent
plan-to-implementation chains. This is a minimum pilot, not a generalization
sample. A replication wave is required before a broad product claim.

Use `TASK-SELECTION.md` to freeze the sampling frame, inclusion/exclusion
checks, and ambiguity classification. Use one recorded random seed to assign
condition execution order within each task block. Because the first pilot has
one run per cell, every result remains exploratory until replicated.

## Freeze Before Assignment

For every task, freeze:

1. repository commit and clean working state;
2. ticket text;
3. complete source packet;
4. task-relevant fact-set manifest;
5. hidden truth card and hidden acceptance cases;
6. low- or high-ambiguity classification and written reason;
7. ordinary prose notes generated from the fact set;
8. Definition Pack generated from the same fact set;
9. evidence-gate policy generated from the pack;
10. model, harness, tool versions, budgets, and sandbox limits;
11. randomization seed and condition assignment; and
12. two blinded reviewers.

Freeze the task-selection record and one condition manifest per task as exact
files. Every run row binds their SHA-256 digests. Before interpreting metrics,
run the joined bundle validator so separately valid artifacts cannot be mixed.

The truth card and task classification must be frozen before any condition
output is inspected.

Record material-production time and tokens for the ticket, notes, pack, and
gate policy. The total-cost comparison includes this preparation work rather
than treating the Definition Pack as free.

## Information-Parity Check

The notes and Definition Pack must bind the same `fact_set_digest`. Two
independent checks answer:

- Is every factual proposition in the pack present in the notes?
- Is every factual proposition in the notes present in the pack?

Presentation, order, fields, links, and explicit open-state structure may
differ. Adding a new fact to either condition creates a new experiment packet.

Follow `FACT-SET-CONTRACT.md`. Atomic parity includes open questions, owners,
allowed uses, and blocked actions. The pack must contain no plan, solution,
architecture choice, implementation hint, hidden-case answer, authority grant,
or evidence-gate instruction.

The ticket-only arm receives the same raw source access but not the selected
fact representation. This tests whether the selected information itself helps.

## Plan-To-Implementation Handoff

For each condition:

1. Start a clean planner session.
2. Produce a frozen plan without access to hidden truth cases.
3. Start a separate clean implementer session with the frozen plan and the
   condition material; do not pass planner conversation history.
4. Permit the implementer to produce one of four explicit outcomes:
   `implement`, `abstain`, `ask`, or `escalate`.
5. Run hidden acceptance cases after the implementation session ends.
6. Give artifacts to two reviewers who are blind to the condition label.
7. Record reviewer scores separately before adjudication.
8. After scoring, ask each reviewer to guess the condition and record confidence
   as a blinding-success diagnostic.
9. Preserve acceptance disagreement; if an adjudicator is used, record the
   adjudicator and reason without replacing the two original reviews.
10. Record all owner corrections, rejected suggestions, rework, time, tokens,
   and protocol deviations.

Unknown observations are written as `null` and named in `unknown_fields`.
They are never replaced with zero. A row with an unknown observation cannot be
`completed`; it is preserved as `blocked` or `protocol_deviation` and excluded
from aggregate comparisons.

The clean handoff tests whether clarified meaning survives into the next stage.

## Plan Rubric

Each reviewer scores six items from 0 to 2:

1. goal and intent fidelity;
2. concept and context fidelity;
3. assumptions, conflicts, and open questions exposed;
4. sources and evidence traceable;
5. owners and permission limits correct; and
6. implementation tasks and tests preserve semantic obligations.

`0` means wrong or missing, `1` means partial or implicit, and `2` means
correct, explicit, and traceable. Length earns no points.

## Comprehension Anchors

After implementation, each reviewer scores comprehension from 0 to 4:

- `0` — cannot explain the intended behavior or how to extend it;
- `1` — identifies surface behavior but not the important limits;
- `2` — explains the main behavior but misses an owner, blocked action, or
  extension constraint;
- `3` — explains the behavior, key limits, and a safe extension path; and
- `4` — does all of level 3 and correctly locates the supporting source,
  responsible owner, and evidence needed for a bounded extension or review.

The expected action is frozen as exactly one of `implement`, `abstain`, `ask`,
or `escalate`. `outcome_match` is true only when the observed action equals
that frozen action. The separate `unnecessary_change` and
`incorrect_abstention` flags retain the most consequential directional errors.

## Semantic Defect Policy

- critical = 5: wrong consequential behavior, permission violation, or silent
  closure of a blocking concept;
- major = 2: failed semantic acceptance case or required behavioral redesign;
- minor = 1: local correction without changed behavior or ownership.

Ordinary formatting or style defects are reported separately and do not become
semantic defects by assertion.

## Stop Rules

Stop the affected block on:

- source, truth-card, fact-set, or repository drift;
- information-parity failure;
- planner/implementer conversation leakage;
- reviewer learns the condition before scoring;
- hidden cases are changed after assignment;
- model, harness, tool, or budget identity changes inside a block;
- missing append-only row or validator false pass/false fail; or
- unknown observations reported as zero, or a completed row containing an
  unknown observation;
- external effect beyond the separately approved sandbox.

Preserve the deviation. Do not silently repair and rescore the same run.

## Live Authorization Gate

Preparation does not authorize live execution. A later owner must select the
tasks, execution identity, reviewers, privacy boundary, cost ceiling, and
external-effect envelope, then confirm the frozen manifest.
