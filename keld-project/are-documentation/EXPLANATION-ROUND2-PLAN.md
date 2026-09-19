# Explanation round two: reviewed implementation plan

Status: reviewed and implemented; local validation passed. Reader-comprehension evaluation remains pending. Basis: [research](EXPLANATION-RESEARCH-ROUND2.md).

## Objective

Help first-time visitors distinguish ARE, model and host responsibilities, and understand why information enters the next context window. Preserve the general hero animation and the concrete signup story below it.

## Task DAG

1. Inspect current copy, capability mappings and browser checks.
2. Review scope and claims against research and existing limitations.
3. After 2: write the role-first introduction and an open, icon-led responsibility diagram.
4. After 2: enrich the context moment with its trigger, selection reasons, retained information and next responsibility.
5. After 3 and 4: integrate responsive layout and accessible text/controls.
6. After 5: build and run interaction, layout, keyboard and reduced-motion checks; inspect rendered views.
7. After 6: report implementation evidence and prepare the reader-comprehension evaluation.

## Plan review before execution

- Scope: implement the research's smallest useful slice, not all six capability redesigns. Distinct feedback/decision and state/boundary visualizations remain later work.
- Product framing: keep the required naming heading; explain ARE's role before elaborating the name.
- Responsibility accuracy: show the host as the integration/execution surface. ARE prepares context and supports decisions; the model proposes responses/actions. Avoid claims of autonomous correctness or universal permission enforcement.
- Context accuracy: explain why each item is included. The selection is illustrative, not an actual model run or an evaluated relevance algorithm. Both selected and unselected material may remain saved.
- Story consistency: preserve form design and email checks when adding the invitation rule. A new requirement adds relevant information; it does not silently invalidate older checks.
- Visual design: icon nodes, arrows and open rows. A context-window outline expresses a real boundary; avoid decorative feature cards.
- Accessibility: diagram meaning is available as text, no hover-only explanations, standard buttons, no new automatic motion. Stack the diagram in narrow panes.
- Evidence: browser checks cannot establish comprehension, quality gains or token savings. Reader testing remains pending; do not manufacture results.

Review outcome: proceed with corrections above incorporated. No unresolved prerequisite blocks local construction.

## Construction boundary

Current product frontier: introduction and context-selection explanation in the local documentation prototype.
Runnable work: React/CSS, local illustrative data, existing browser harness and build.
Operational prerequisites: none. Owner: existing product owner authorization in this conversation.
Exact affected stages: source editing and local verification only.
Causal blockers: none for implementation. Human comprehension testing depends on recruiting first-time readers.
Deferred operational residue: reader recruitment (product owner), real runtime trace integration, release and deployment separately scoped.

## Acceptance

- Naming heading and hero behavior retained.
- Visible role distinctions and return of results to working state.
- Invitation requirement has a visible selection reason; existing form/email checks retained.
- Pricing stays saved outside the window; no implication selected information was removed from storage.
- Apply/reset, capability jumps and per-moment state still work.
- No horizontal overflow at desktop and embedded-pane widths; keyboard/reduced-motion operation remains usable.

## Open Questions

Reader evaluation and proposed H1/H2 acceptance targets are owned by [the research report](EXPLANATION-RESEARCH-ROUND2.md#hypotheses-and-evaluation). Wider capability redesigns wait for this review rather than becoming hidden work in this change.

## Execution evidence

- Added [EngineRoles.tsx](src/EngineRoles.tsx) with an accessible open diagram and feedback-return explanation.
- Updated the introduction in [Hero.tsx](src/Hero.tsx), retaining the naming heading and hero choreography.
- Updated [ExplanationPaths.tsx](src/ExplanationPaths.tsx) with an explicit requirement trigger, per-item selection reasons, preserved checks, retained information and next-step handoff.
- Production build passed.
- Existing interaction suite: 92 checks passed, including keyboard and reduced motion.
- Round-two suite: 24 checks passed across 1440×900, 331×587 and 240×320.
- Rendered desktop roles and narrow context view inspected. Evidence: evidence/explanation-round2-proof.json and evidence/explanation-paths-proof.json.
- No comprehension results, model-quality improvements or token savings are claimed.

## Reader evaluation script (ready, not run)

Show the introduction and let the reader explore the context moment without coaching.
Ask:
1. What does ARE contribute, and what does the model still do?
2. Who actually runs a tool?
3. After the invitation-only requirement is applied, what can the model see?
4. Why are the email checks still included?
5. What happened to the pricing discussion?
6. How could the same process help an agent prepare a customer proposal?

Record the reader's own words, confusions and clarification requests before explaining.
Use the H1/H2 targets in the research report. Recruit first-time readers before
drawing conclusions; the browser assertions are not substitutes.
