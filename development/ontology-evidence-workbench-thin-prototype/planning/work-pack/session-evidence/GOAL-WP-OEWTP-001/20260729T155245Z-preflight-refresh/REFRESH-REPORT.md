# Invoke Refresh Report: OEWTP Goal Preflight

- Mode: refresh
- Activation source: continuation from Goal
- Mutation mode: proposal-only
- Phase status: block after independent runtime-contract review
- Handoff readiness: blocked
- Mutation ready: false
- Target lifecycle: private OEWTP planning package
- Goal result: blocked before SWU-001 implementation mutation

## What passed

- The four-SWU frontier is finite, ordered, and dependency-aware.
- SWU-OEWTP-001 is the unique first unit and is otherwise narrow, reversible,
  and explicitly validated.
- One bounded helper independently confirmed the runtime-contract drift and was
  joined and closed with no writes.
- This proposal is bound to live planning digests and does not touch
  implementation or package topology.
- The deterministic repair program passes its check-only run and is retained
  as reproducibility evidence for the reviewed proposal.

## What blocks execution

The work pack was authored against an older execution contract:

1. no staged material-package and mutation-admission path is declared for any
   SWU;
2. the Invoke closeout route is not the exact tuple admitted by Task Session;
3. four closeout delta names are outside the installed allowlist;
4. the expected owner receipt is named by path but not contracted by fields and
   outcomes.

The independent review then found that the proposal itself cannot be safely
applied:

5. Task Session forces the complete allowed-write set to equal material
   package targets, so it cannot reserve validation-produced outputs;
6. Invoke accepts approval scope supersets;
7. controls and dependencies are not mirrored below the producer staging root;
8. approval, staging-symlink, post-write digest, receipt-field, and
   Plan/Distill rebinding gates are incomplete.

These are governance/runtime contract failures. They occur before TypeScript,
Vite, gateway, Playwright, or browser execution.

## Proposed repair

`REFRESH-PATCH-PROPOSAL.md` is superseded and must not be staged or applied.
The safe replacement is specified by `RUNTIME-REPAIR-PLAN.md` and
`RUNTIME-REPAIR.dispatch.json`. It first repairs the reusable Task Session and
Invoke contracts, validates canonical Arcanum, regenerates bounded mirrors, and
stops before OEW planning mutation.

`repair-check.json` and `prepare-planning-repair.mjs` remain historical
proposal evidence. Neither is an active apply mechanism.

## Decision required

Authorize exactly the target and boundary inventory in
`RUNTIME-REPAIR.dispatch.json`. This repairs canonical public Arcanum and its
listed repository-local generated mirrors, then stops. It does not authorize
the later OEW planning apply or any SWU.

## Claim ceiling

This report proves only that the current work pack and the former planning-only
repair cannot enter the installed mutation runtime safely, and that a bounded
runtime repair is now proposed. It does not prove implementation correctness,
a browser witness, ontology correctness, promotion, release, deployment,
production readiness, or user outcomes.
