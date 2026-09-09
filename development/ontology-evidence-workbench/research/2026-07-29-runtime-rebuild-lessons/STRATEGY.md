# OEW Runtime Rebuild Lessons — Research Strategy

Status: confirmation-ready; implementation paused; unregistered

This is a non-authority research proposal. It does not modify the OEW
implementation, package manifests, locks, plan, selected SWU, ontology,
promotion, release, or production state.

## P1 Trigger Decision

This is a governed research dispatch. Synthesis applies because the answer must
combine current runtime execution, the full blocker/refresh chronology, and a
clean-slate prototype architecture. Isolation and parallelism matter because a
single reader could easily rationalize the existing plan instead of testing
whether the plan itself creates the blockers.

## Research Question

Which current OEW blockers are real runtime or source failures, which are
created by exact-byte ownership and work-pack granularity, and what is the
smallest rebuild that reaches a browser-testable Poker-Team prototype without
adding package manifests?

The working hypothesis is deliberately non-authoritative:

- the pinned SHA values are reproducibility guards, not themselves the runtime
  failure;
- the 48 strict-TypeScript errors are a real source defect;
- the repeated Refresh and SWU insertion cycle may be a governance amplification
  of that ordinary defect;
- the upstream pnpm workspace may already be the runtime that the private OEW
  adapter should consume.

The dispatch must prove, revise, or kill those statements.

## Lanes, Groups, And Subagents

### Explorers — parallel

Anti-bias axis: composite methodology and source-corpus.

- `Hewitt, Carl` — empirical clean-runtime reproduction. Output: exact package
  topology, commands, failures, and a complete corpus ledger.
- `Simon, Herbert` — blocker and Refresh archaeology. Output: causal timeline,
  churn counts, protected versus manufactured stops, and per-path evidence.
- `van Lamsweerde, Axel` — minimum architecture. Output: component diagram,
  no-new-package acceptance path, and exact KEEP/REBUILD/DELETE/DEFER matrix.

### Synthesizer

- `Turing, Alan` — exact-binding causal synthesis and candidate comparison.

### Skeptics — parallel

Anti-bias axis: attack-vector.

- `Rittel, Horst` — precedent and ownership: prevent rebuilding pnpm, Vite,
  Playwright, or adapter mechanics that already have an owner.
- `Popper, Karl` — non-vacuity: require one runnable no-new-package browser
  witness plus measurable simplification.

### Writer

- `Shannon, Claude` — write `findings.md` only after evidence closure.

### Auditor

- `Brandenburg, Martin` — verify the final answer, exact bindings, dispositions,
  claim ceiling, and one bounded revision.

Final approver: parent.

## Dependency Flow

```text
explorers
    |
    v
synthesizer <---- one evidence-feedback loop ---- explorers
    |
    v
skeptics <---- one zig-zag ---- synthesizer
    |
    v
exact-binding evidence closure
    |
    v
writer ----> auditor ---- one bounded revision ----> writer
    |
    v
parent final approval
```

Whole-dispatch loop ceiling: two. No research stage may mutate OEW source,
planning, lock, package, generated build, browser, or ontology state.

## Candidate Matrix

The research must compare and either retain, defer, or kill:

1. continue the current `007T -> 013B -> 014 -> 014V` chain;
2. rebuild as a thin private adapter inside the pinned upstream pnpm workspace;
3. use a static or Node-native prototype lane for the first browser witness;
4. build a new generalized runtime.

Each candidate needs an owner/precedent label, non-vacuity witness,
definitional-soundness result, and verdict.

## Inventory Preflight

Lookup readiness: PASS against `.arcanum/inventory/index.json`; projection
conformance passed with zero failures and 111 uncontrolled-tag warnings.
Source coverage remains partial.

Selected:

- the prior OEW runtime-audit strategy, because its formal, empirical, and
  adversarial partition remains useful;
- the prior coverage-rejected OEW runtime result, because it found existing
  upstream mechanics and also demonstrates why complete corpus ledgers and
  per-artifact dispositions are mandatory now.

Excluded:

- Inventory runtime/faceted-layout work, because it is not evidence about the
  pinned Understand-Anything workspace;
- Studio interface work, because it does not answer this package, SHA, or
  TypeScript question.

Design consequence: this dispatch adds a direct runtime experiment, complete
receipt chronology, a clean-slate architecture lane, exact bindings, and one
non-vacuity browser witness. Inventory is discovery only.

## Gate And Ledger State

- Candidate schema: `0.8.0`.
- Candidate sheet:
  `cyberAlchemy-v2/development/ontology-evidence-workbench/research/2026-07-29-runtime-rebuild-lessons/dispatch-sheet.json`.
- Frozen sheet SHA-256:
  `6b78fbef290285df6d55791d41e7939a7662ca00a20da05f20e4ec673fc29d6f`.
- Confirmation-readiness validator: PASS; ledger mutation none.
- Check-tension checker: PASS,
  `check-tension:checker:1e4c628a-418b-48b7-b259-647c2e2045ed`.
- Check-tension reviewer: PASS,
  `oew-tension-review-v2:f2e5e197-4d06-4b3a-83df-9d333f62d6bd`.
- Capability-bound orchestration route:
  `orchestration.dispatch.json`; authorization remains
  `requires_user_permission`.
- Human confirmation: pending.
- Registration: absent.
- Research agents spawned: zero.
- Implementation Task Session: interrupted before mutation admission.
- Six declared 007T implementation target hashes: unchanged from preflight.

## Next Human Action

Reply exactly `confirmed` to authorize registration and execution of the
frozen sheet digest, request a revision, or decline. Any edit to the sheet
invalidates the current readiness and tension evidence.
