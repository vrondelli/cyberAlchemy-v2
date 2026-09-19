# Invoke Refresh — WP-RMT-002 S1 staged plan proposal

## Outcome Brief

Lane A planning authoring is complete. All and only the 22 approved
`WP-RMT-002` plan targets now have staged candidate bytes that bind S1's
atomic state-plus-outbox rule, later idempotent at-least-once publication,
stable occurrence identity, durable-fact preservation, and forward
compensation. The staged overlay validator passes without touching the live
plan, so the exact candidate can be reviewed while `RMT-OP-001` remains
unselected.

- Objective: replace the stale generic W3/W4 proof denominator with an exact,
  versioned S1 plan proposal.
- Result: proposal authoring and staged-byte validation pass; handoff is gated
  and mutation readiness is false.
- Why it matters: the remaining meta-type work can continue from one coherent
  durable-occurrence contract after a separate review/apply gate, without
  mistaking prototypes or planning evidence for implementation or production
  proof.

## Boundary and Next Decision

- Changed: new files only under this `lane-a-rmt-plan-refresh/` package,
  including a 22-file staged mirror, exact hash manifest, reproducible
  validator, proposal, Distill result, and validation receipt.
- Unchanged: all 22 live plan targets; product code; existing candidates and
  receipts; profiles, schemas, ontology, definitions, and authority; Craft,
  Inventory, telemetry, Git, release, publication, deployment, and production
  state.
- Open questions: an independent reviewer has not yet falsified the exact
  staged bytes, the owner has not accepted them for apply, and no post-apply
  receipt exists.
- User decision: none for this helper. The parent should first join Lane B and
  run the read-only integration check; any later apply proposal needs a new
  exact owner decision.
- Next action: inspect `STAGED-TARGET-MANIFEST.json`, reproduce
  `STAGED-VALIDATION-RECEIPT.json`, complete independent exact-byte review,
  and only then decide whether to authorize a separate apply-approved package.

## Technical Details

## Invoke Result

- Mode: `refresh`.
- Spell: `invoke`.
- Activation source: delegated bounded helper.
- Mutation mode: explicit `proposal-only`.
- Phase status: `pass` — the exact requested proposal is complete.
- Phase status basis: 22/22 staged targets, 0 refresh-authoring blockers.
- Handoff status: `gated`.
- Mutation ready: `false`.
- Work Pack: `WP-RMT-002`.
- Semantic epoch: `WP-RMT-002/S1/2026-08-16`.
- Decision SHA-256:
  `2168de08e9e0ea72a29ce74fb9a3285094aebaa05d72df34d9749e5cbdac20c9`.
- S1 contract digest:
  `75fd21cd605735b9ca76ed42e46d126850b6c94ea976f55347aa35fd61d530b7`.
- Target inventory: 22 exact live paths and 22 staged candidates; all 22
  candidate bytes differ from their baselines.
- Inventory SHA-256:
  `96299460ce607ae4641bbb6709228deb2c67e4f0f62d25eb7405c25e04970f1e`.
- Manifest SHA-256:
  `d187aeb2b08089836d272ada662bb459393d2fa8192ee576fc066d3185f362d4`.
- Validation receipt SHA-256:
  `1c23c20d967b88bd4cd5262793953f5dcd0d71059025ca62b88765a88790518a`.
- Allowed-route digest:
  `fbf715f4ce69802f1512d400e5bb3a600b96826131027e04a77cd9649c234e72`.
- Applied changes: none.
- Authority effect: none.

## What the candidate binds

The plan now has one central closed S1 contract rather than four loosely
worded type interpretations:

1. Operation owns transaction/effect-group, state-write, outbox checkpoint,
   occurrence identity, and commit observations.
2. Event owns distinct persistence, publication-attempt, acknowledgement,
   delivery, and consumption observations.
3. State Machine returns deterministic transition/effect intents and performs
   neither publication nor compensation.
4. Workflow consumes exact Operation and State Machine handles, preserves
   committed durable facts, and expresses forward compensation only.
5. Fixture/evaluator representability stays below independent provider,
   database, restart, recovery, delivery, and consumer proof.
6. At-least-once plus idempotent retry explicitly does not mean distributed
   exactly-once.

The 16 added S1 hostile controls cover the complete eight-boundary fault
matrix plus closed decode, future version, missing member, mixed commit, stale
binding, occurrence reuse, rollback after commit, and non-idempotent retry.
Each has an exact owner, proof owner, fixture path, required observation,
required outcome, and stable diagnostic code.

## Preserved topology

- Types: 7/7.
- SWUs: 70/70, ten per type.
- Affected SWU contracts: 40/40, without adding units.
- Planned write scopes: 189/189, same paths and owners, all still absent.
- Relation translations: 18/18 under REL-A; semantic handles create no new
  relation instance.
- Source bindings: 29/29, adding only the accepted S1 decision.
- Frontier: `RMT-OP-001` only.
- Selection: `selected_unit=null`; `route_id=null`.

## Validation

Reproduce with:

```bash
python3 projects/domainspec-v2/development/first-production-release/refreshes/2026-08-16-stable-foundation-two-lane/lane-a-rmt-plan-refresh/validate-staged-package.py "$PWD"
```

Current exits:

- package validator: 0;
- JSON parse: pass for 8/8 staged JSON targets;
- staged validator Node syntax: pass;
- text hygiene: 22/22 final newline, zero trailing-whitespace findings;
- exact live/staged hash check: pass, with all live baselines unchanged;
- temporary staged-overlay `validate-work-pack.mjs`: exit 0;
- graph, contracts, baselines, sources, hostiles, relations, route digest,
  execution-entry projection, and stored-output comparison: pass.

The overlay uses the unchanged live plan only for out-of-scope support files
such as Rule/Interface/Mapping tasks and historical receipts, then replaces
exactly the 22 proposed targets with staged bytes. The staged validator maps
those physical bytes back to the canonical logical plan root, so route paths
and source bindings are checked without applying anything.

## Distill and dispatch boundaries

Lane-specific Distill passes for proposal shape: the 22-target refresh is the
smallest coherent unit that closes S1 without adding a meta type, wave, SWU,
or implementation path. The helper simulated Proposer/Balancer roles; it does
not claim independent review.

The parent two-lane Dispatch Spec remains descriptive only. This helper did
not register a dispatch, append a ledger row, spawn another subagent, or claim
a review/implementation route.

## Blockers by lifecycle scope

- Refresh authoring: 0.
- Apply authorization: 1 — no authorization exists to apply these bytes.
- Target lifecycle: 1 deferred — actual applied bytes need fresh live
  validation before selection.
- Audit: 2 — independent exact-byte review and owner acceptance are pending.

These downstream gates keep the handoff gated but do not lower the completed
proposal-only phase from `pass`.

## Residue and claim ceiling

No Inventory or observability post-result row was written because those trees
are outside the helper's exact write scope. No generic product/provider proof
was run. The strongest supported claim is: **an exact, internally consistent,
proposal-only S1 plan candidate exists and passes staged structural
validation**.

This does not authorize apply, select or execute `RMT-OP-001`, prove any
provider/database/restart implementation, or establish profile admission,
ontology/registry authority, production stability, release, publication,
deployment, promotion, or distributed exactly-once delivery.
