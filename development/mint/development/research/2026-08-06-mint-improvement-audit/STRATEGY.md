# Mint improvement audit — governed research strategy

Status: candidate proposal; unregistered and unexecuted. This document is a non-authority strategy projection. The exact dispatch material is owned by `dispatch-sheet.json`.

## P1 trigger

Dispatch is warranted by synthesis, context protection, isolation, and parallelism. The target spans current source and runtime truth, experiment and security evidence, authority dependencies, external precedent, and operator outcomes.

## Preliminary evidence

The strongest directly observed repair target is truth and runtime parity drift. The target Mint skill and installed Claude runtime have different SHA-256 digests and a 186-line diff, while `SPEC.md`, `EXECUTION-PACK.md`, `WORK-PACK.md`, and `development/HARNESS.md` disagree about what is built and what has run. That establishes drift, not which surface owns the correct state.

Other proposed research targets remain hypotheses until the dispatch verifies them: end-to-end private-mint execution, L2 attestation integration, failure recovery and path safety, template versioning and upgrades, operator preview and diff ergonomics, observability, generalization beyond narrow fixtures, and the deferred adopt-back loop.

## Lanes and subagents

| Group | Agents | Purpose | Anti-bias |
| --- | --- | --- | --- |
| explorers | van Lamsweerde, Axel; Beer, Stafford; Simon, Herbert | Current-state/reliability forensics; adversarial evidence/security/authority analysis; external precedent/operator analysis | composite methodology + source-corpus |
| synthesizer | Wiener, Norbert | Exact as-built model and ranked candidate matrix | singleton |
| reviewers | Tetlock, Philip; Popper, Karl; Meadows, Donella H. | Precedent, non-vacuity, and definitional-soundness rejection gates | attack-vector |
| writer | Ahrens, Sönke | `findings.md` only after exact-binding closure | singleton |
| auditor | Brandenburg, Martin | Final findings audit and one bounded writer revision | singleton |

## Dependency flow

`explorers -> synthesizer <-> reviewers -> evidence closure -> writer <-> auditor -> parent approval`.

- Explorers run in parallel and all must join.
- Synthesizer and reviewers have one zig-zag loop.
- One synthesizer-to-explorers feedback loop may repair missing source identity or selectors.
- The writer remains blocked until exact-binding evidence closure is `ready`.
- The auditor may request one writer revision.
- The parent is the final approver.

## Evidence contract

Use `exact-binding`. Every retained candidate must carry:

- candidate ID and classification: `fix`, `hardening`, `experiment`, `operator-experience`, `dependency`, or `deferred/non-goal`;
- immutable source identity and exact selector or structured pointer;
- explorer return reference and evidence scope;
- `observed`, `executed`, or `unverified` proof status;
- current owner and status;
- witnessed problem or closed negative;
- impact, cost, risk, reversibility, and prerequisites;
- smallest positive fixture, discriminating negative control, and acceptance test;
- authority, promotion, publication, deployment, release, and production boundary.

## Inventory preflight

The root Inventory machine index is lookup-ready with 295 entries, partial source coverage, and 146 non-blocking uncontrolled-tag warnings. Selected inputs cover the Mint experiments and EvidenceSet, inheritance audit, universal baseline partition, installed Mint capability projection, attestation projection, additions decision, and the guarded Mint/Body War relation. Broad machine-map analogy, unrelated Body War product reviews, and generic strategy-result entries are excluded from direct Mint proof.

Design consequences: separate the three explorer corpora; use exact-binding; treat parity drift as a candidate fix whose owner is still unresolved; keep Body War outside the frozen N=3 experiment; and force typed classification of every recommendation.

Inventory is a non-authority discovery read model and cannot establish current implementation or dispatch authority.

## Gate and ledger state

- Sheet schema: `0.8.0`
- Sheet readiness: PASS, schema `0.8.0`
- Admitted sheet SHA-256: `e2445e620fe002d802384f3fec2e5b2e787673b28e0cd10f643ffafce31426ab`
- Dispatch Spec route: PASS
- Check-tension: PASS/PASS (`codex:tension_checker:e2445e620fe0`, `codex:tension_reviewer:e2445e620fe0`)
- Human confirmation: CONFIRMED for admitted digest `e2445e620fe002d802384f3fec2e5b2e787673b28e0cd10f643ffafce31426ab` (`chat:confirmed:e2445e620fe0`)
- Registration: registered-open (`REGISTER-RECEIPT.json`)
- Ledger mutation: one deterministic dispatch append; close append pending termination
- Research agents spawned: none
- Expected closeout after an authorized run: exactly one dispatch append and one close append, with every agent joined and closed

## Claim ceiling

This proposal and any eventual findings do not implement fixes, select an implementation owner, mutate Mint or authority sources, change the frozen experiment, promote Inventory, publish private material, deploy, release, ship, or establish production readiness.

## Next human action

The exact admitted sheet is confirmed. Next: deterministic registration, Orchestrate preflight, then native execution of the declared waves.
