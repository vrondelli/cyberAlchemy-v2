# P00 — Bind sources and materialize prototype contracts

Lane: **product-construction**. Owner: one bounded Luna packet. Objective route for execution: CA2-ROUTE-IMPLEMENT.
Dependencies: none. Status in this plan: **not started**.

Read [LUNA-START.md](../LUNA-START.md) first. All paths below are relative to the comparison root, not this tasks directory. Common forbidden scope: parent Babylon app/B1/Unity/user source, public Arcanum, runtime and cloud. Common evidence writes: one new receipt in `runs/<run-id>/receipts/P00-<attempt>.json`; coordinator alone updates the run-wide status.

## Exact inputs

- `SOURCE-REGISTER.json`
- `PLAN.md`
- `CONTRACTS.md`
- `ART-DIRECTION.md`
- `../app/src/session.ts`
- `../app/src/playback.ts`
- `../checkpoints/B1/v1/manifest.json`

Resolve placeholder receipt paths from actual dependency results. Never guess a selected revision or approved digest.

## Allowed writes

- `design/definitions.md`
- `design/source-map.json`
- `design/prototype-mapping.md`
- `design/implementation-contract.md`


Generated package cache/build paths are allowed only when listed. No broad staging or commits.

## Procedure

1. Verify the registered user PNG, five reuse files and B1 manifest hashes. Check the candidate's selected bound files; do not rewrite a digest when input differs. Record exact affected dependencies.

2. Define the local terms listed in PLAN.md and map each to source data or presentation state. Distinguish source Robot from a synthetic visual actor and construction count from scenery identity.

3. Write the D65 prototype mapping: product journey, business hypothesis (understand a shared experiment), typed input/intent, compiled graph, implementation modules and candidate tests. No canonical ontology updates.

4. Materialize CONTRACTS.md C3 as an exact interface and diagnostics shape for the next tasks. Include Promise-based disposal, positive zoom semantics, read-only diagnostics and one Playback owner.

5. Record chosen fixed-camera projection and pin the initial defaults. Resolve routine naming inside the allowed files; report any contradiction that affects behavior rather than improvising incompatible APIs.

## Decisive checks

- Selected input digests match or affected entries are explicitly blocked.
- Each defined local term has a source selector or a presentation-only label.
- All renderer methods, ownership, error paths and time units are concrete.
- No implementation file or protected source changed.

Use the relevant [validation procedure](../VALIDATION.md) and save actual outputs. Do not mark a check PASS merely because code appears plausible.

## Done and handoff

A short source-bound prototype contract exists that P01/P02/P03 can implement without redesigning it.

Return changed-file hashes, checks and exit results, actual evidence paths, limitations and the next ready node: **O01 or P02**. If blocked, name the exact missing input/tool or failing behavior, preserve independent work, and return the bounded receipt. Never run a user checkpoint as an automated success.

Open questions: [register](../OPEN-QUESTIONS.md).
