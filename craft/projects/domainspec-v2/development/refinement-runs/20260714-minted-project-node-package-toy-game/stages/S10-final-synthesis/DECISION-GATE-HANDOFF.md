# Decision Gate Handoff — Production Home and Admission Binding

## What This Handoff Does

It resumes the paused FPR-01/source-home decision with the layout confusion removed. It does not pre-answer owner-controlled repository paths or promote the toy design.

## Fixed Invariants From Refine Evidence

1. DomainSpec owns factory form: schemas, supported profile rules, compiler/validator behavior, project template/minter, conformance contract.
2. A minted project owns concrete domain meaning in project-local machine sources.
3. Recommended consumer default: `specs/<feature>/feature.json` plus `specs/<feature>/nodes/*.json` with source-owned outgoing connections.
4. `graph.json`, `source-manifest.json`, Markdown, and build receipts are generated/read-only.
5. DomainSpec-local concrete feature packs are fixtures/witnesses, not minted-project authority.
6. Kind existence, shape evidence, and supported/release admission remain separate.
7. Cross-feature completeness and independent edge lifecycle are not claimed.

## Owner Decisions Required

### DG-MNP-01 — Exact factory authority homes

Bind exact repository paths and owners for:

- project/feature/node/connection schemas;
- supported profile declaration;
- source resolver/compiler contract and implementation;
- generated graph/source-manifest/Markdown schemas and generator;
- project template/minter;
- conformance fixtures/evidence.

Acceptance: one authoritative home per item, no consumer feature semantics in the factory template, and no hand-authored generated projection.

### DG-MNP-02 — Supported profile and admission posture

Decide which current kinds/relationships a minted-project compiler may accept and how registry status, formation evidence, profile support, and release admission remain separate.

Acceptance: exact machine source/digest, owner, effective condition, and distinct failures for unsupported kind/profile and non-active relationship state.

### DG-MNP-03 — Existing fixture disposition

Classify each DomainSpec-local concrete feature pack as `validation-witness`, `historical`, `migrate-to-consumer-example`, `repair-required`, or `retire`.

Acceptance: exactly one disposition, owner, reason, and effective condition per fixture; no row becomes consumer authority by location.

## Evidence Handles

- selected design: `stages/S08-distill-repair/selected-design.json`
- original tournament: `stages/S06-invoke-design-toy-game/toy-game/EVIDENCE.json`
- repair evidence: `stages/S08-distill-repair/REPAIR-EVIDENCE.json`
- non-executed plan: `stages/S09-invoke-plan/PLAN.md`
- task/SWU plan: `stages/S09-invoke-plan/WORK-PACK.md`

## Next Route After Gate

Run Invoke Refresh/Plan to insert approved paths, profile posture, commands, and fixture dispositions. Validate the refreshed dispatch, then select one SWU for Task Session. No automatic whole-wave execution.

