# Refresh Patch Proposal — stable-foundation two-lane planning

Status: proposal-only<br>
Mutation ready: no<br>
Product execution: forbidden<br>
Current target artifacts changed by this proposal: none<br>

## Purpose

Describe the exact planning mutations that may be prepared only after a new
owner approval. This file is not a material package, patch, task selection, or
authorization to edit the named targets.

## Common binding

Both lanes must consume the exact decision record:

`projects/domainspec-v2/development/first-production-release/decisions/2026-08-16-first-stable-foundation-candidate.md`

Bound SHA-256 at proposal time:
`2168de08e9e0ea72a29ce74fb9a3285094aebaa05d72df34d9749e5cbdac20c9`.

Any change to that record invalidates this proposal and requires a new context
selection, Distill pass, Dispatch validation, and owner review.

## Lane A — refresh `WP-RMT-002`

### Objective

Replace the older generic W3/W4 denominator with the selected S1 contract:
atomic state-plus-durable-outbox commit, later idempotent at-least-once
publication, stable occurrence identity, no rollback after durable commit, and
forward compensation. Preserve candidate-only authority and the ten-unit
per-type cycle.

### Exact proposed future material target inventory

All paths are under
`projects/domainspec-v2/development/refinement-runs/20260814T193343Z-active-meta-type-implementations/stages/09-invoke-plan/`:

1. `WORK-PACK.md`
2. `IMPLEMENTATION-LAYERING.md`
3. `EXECUTION-PACK.md`
4. `DISTILL-PLAN-VALIDATION.md`
5. `PLAN-TRANSPORT.md`
6. `GAP-LEDGER.md`
7. `SWU-MANIFEST.json`
8. `SWU-CONTRACTS.json`
9. `HOSTILE-CATALOGUE.json`
10. `RELATION-CONTRACTS.json`
11. `WRITE-SCOPE-BASELINE.json`
12. `VALIDATION-RESULT.json`
13. `EXECUTION-ENTRY.json`
14. `EXECUTION-ENTRY-VALIDATION.json`
15. `validate-work-pack.mjs`
16. `tasks/TASK-RMT-OP.md`
17. `tasks/TASK-RMT-EVENT.md`
18. `tasks/TASK-RMT-SM.md`
19. `tasks/TASK-RMT-WF.md`
20. `waves/W0-OPERATION.md`
21. `waves/W2-MAPPING-EVENT.md`
22. `waves/W3-STATE-MACHINE-WORKFLOW.md`

This 22-path inventory is exact for the proposed refresh. A later material
package with a missing or extra target is a different proposal and must fail
closed before apply.

### Required deltas

1. Introduce a semantic plan epoch bound to S1 and the decision digest.
2. Make `RMT-OP-001` admission bind the versioned transaction/effect-group
   observation, state write, durable outbox checkpoint, commit outcome, and
   provider-proof separation.
3. Make Event bind stable occurrence identity, persistence, publication
   attempt, acknowledgement ambiguity, delivery, and consumption as separate
   observations.
4. Make State Machine return deterministic effect intents without performing
   publication or compensation.
5. Make Workflow reference exact Operation/State Machine transaction handles,
   preserve durable facts after commit, and express forward compensation.
6. Add the complete fault matrix: before state write; between state and outbox;
   after outbox/before publish; send failure; success/ack timeout;
   duplicate/reordered delivery; poison occurrence; recovery/replay.
7. Add closed-decode, future-version, missing-member, mixed-commit, stale
   binding, occurrence-reuse, rollback-after-commit, and non-idempotent retry
   hostiles with stable codes.
8. Keep fixture/evaluator representability separate from independent provider,
   database, restart, and recovery proof.
9. Recompute affected SWU inputs, outputs, write scopes, baselines, expected
   receipts, relation bindings, wave gates, and validation digests.
10. Run Plan Distill again and require the first selected unit to remain the
    smallest reversible trust-building admission step.
11. Regenerate the execution-entry projection only after every target above is
    internally consistent. Its frontier may remain `RMT-OP-001`, but it needs a
    new allowed-route digest and exact required-input bindings.
12. Preserve `authority_effect: none`, candidate-only claims, historical
    receipts, and the prohibition on distributed exactly-once claims.

### Lane A stop conditions

- Any change to canonical definitions, accepted profile authority, product
  code, or existing candidate implementations.
- A target outside the 22-path plan inventory.
- An attempt to select or execute `RMT-OP-001` during authoring.
- A failed plan, Distill, execution-entry, whitespace, or exact-inventory
  validation.
- Any request to rewrite historical receipts or broaden authority.

### Lane A acceptance for a later planning apply

- An exact staged material package covering all and only the 22 targets.
- Current-source hash inventory and explicit changed-byte report.
- `validate-work-pack.mjs` passes against staged bytes.
- Every JSON document parses and all owned schemas/validators pass.
- Distill passes and records recomposition into the seven-type Work Pack.
- Implementation Readiness validates the new execution entry.
- Independent plan reviewer confirms S1 and the complete fault matrix.
- Owner accepts the exact staged plan bytes.

No RMT implementation may run as part of that apply.

## Lane B — create the stable CLI foundation lifecycle

### Objective

Materialize SF-01 through SF-21 as a governed CLI-specific definition,
architecture, and Work Pack without changing `@domainspec-v2/impl`, schemas,
profiles, locks, source code, release records, or product state.

### Exact proposed authoring root

`projects/domainspec-v2/development/first-production-release/stable-foundation-cli/`

The root is new. It is a candidate planning namespace subordinate to the July
product-release contract, not a release channel or accepted stable product.

### Define outputs required before Design

- `SPEC.md`
- `REQUIREMENTS.md`
- `GLOSSARY.md`
- `DEFINE-CONTEXT.md`
- `DEFINE-DISPATCH-TRACE.md`
- `DEFINE-DISTILL-VALIDATION.md`
- `DEFINE-TRANSPORT-REPORT.json`
- `DEFINE-VALIDATION.json`

Define must reuse the 21 resolved branches; it may clarify missing contract
fields but must not silently reopen them. The July product research and August
stable review satisfy the discovery-existence input, within their evidence
ceilings.

### Design outputs required before Plan

- `DESIGN.md` with all six required views
- `DESIGN-CONTEXT.md`
- `DESIGN-DISPATCH-TRACE.md`
- `DESIGN-SCOPE-MANIFEST.json`
- `DESIGN-DENOMINATOR-RECEIPT.json`
- `DESIGN-SELECTION-RESULT.json`
- `DESIGN-DISTILL-VALIDATION.md`
- `DESIGN-LAYERING-SEED.md`
- `GLOSSARY-CONSISTENCY.md`
- `DESIGN-TRANSPORT-REPORT.json`
- planned fixture and validator contracts, explicitly unexecuted

Normal Plan authoring cannot start until Design reaches
`design-validator-pass` twice from one immutable scope/denominator. An
`authored-complete` Design may route only to validator remediation.

### Plan outputs required before any execution selection

- `PLAN.md`
- `IMPLEMENTATION-LAYERING.md`
- `WORK-PACK.md`
- `EXECUTION-PACK.md`
- `EXECUTION-DISPATCH.json`
- `DISTILL-VALIDATION.md`
- `PLAN-TRANSPORT.md`
- `EXECUTION-ENTRY.json`
- `EXECUTION-ENTRY-VALIDATION.json`
- split `work-pack/shared/`, `work-pack/tasks/`, and `work-pack/waves/`
  contracts appropriate to medium/high complexity

Plan must decompose product work into exact SWUs only after the architecture is
approved. Required planning slices include:

1. package/source boundary and command/input/profile contract;
2. separate receipt and diagnostic schema/decoder contracts;
3. explicit project-root resolver and P2 source-set binding;
4. deterministic `lint` diagnostics and structural receipt behavior;
5. npm/lock migration, build-only script allowlist, and compiled-JavaScript
   staging with pinned external Node;
6. clean arbitrary-root reproducibility and acceptance-binding invalidation;
7. data classification, pointer-only diagnostics, dependency, permission, and
   redaction campaigns;
8. boundary/over-bound resource measurements and stable failure behavior;
9. N-1 reading, migration, support, patch, rollback, withdrawal, retention,
   quarantine, and supersession drills;
10. independent operator green/red pilot and release-owner handoff, without
    authorizing release.

Every mutation-capable SWU must have one behavior, one independently reviewable
acceptance boundary, split analysis, exact write scope, validation commands,
source anchors, terminal synchronization contract, expected receipt, and
deterministic successor policy.

### Lane B stop conditions

- A missing Define or Design validator gate.
- A proposal to reuse the review shortlist as an approved Design.
- An attempt to rename or mutate the current implementation workspace before a
  Plan/SWU authorizes an exact extraction.
- Profile admission, schema authority change, lock mutation, package install,
  build, code edit, release staging, network access, or external effect.
- Any claim that planned fixtures or validators are executed evidence.

## Integration gate

After Lane A's refreshed plan proposal and Lane B's validated Plan exist, one
read-only integration pass must prove:

- both bind the same decision digest, P2 identity, 13/16 denominator, C2 causal
  proof definition, S1 contract, and project-root topology;
- the CLI consumes owner-ratified profile and conformance receipts rather than
  defining them;
- RMT candidate providers, generated views, Inventory, and the CLI package do
  not acquire canonical/profile/promotion authority;
- implementation write scopes do not overlap without one declared owner;
- historical receipts retain immutable versioned lookup;
- neither plan upgrades the Craft FPR gate or claims production/release;
- each Plan's Distill, validator, execution-entry, and claim ceiling remain
  independently valid.

Failure reroutes to the owning lane. It does not permit a synthetic merged
Work Pack or automatic repair.

## Dispatch and subagent boundary

P1 holds because the route has independent authoring branches, more than three
source families, and a synthesis gate. However, DomainSpec's governed
`dispatch_type: plan` is reserved. Therefore:

- no register-dispatch sheet is created;
- no check-tension agents run;
- no human dispatch confirmation is requested;
- no ledger row is appended;
- no subagent is spawned;
- the Dispatch Spec is a validated descriptive route only.

Future planning may be authored inline by the parent or through one explicitly
bounded helper at a time. Two or more plan-authoring agents remain blocked
until a live type owner exists. After plans are authored, a separately proposed
live `review` dispatch may inspect them.

## Excluded mutation scope

- Every current RMT plan target listed above.
- `projects/domainspec-v2/impl/**`.
- `projects/domainspec-v2/definitions/**`.
- `projects/domainspec-v2/authority/**`.
- `projects/domainspec-v2/.craft/ledger.yml`.
- `.arcanum/inventory/**`.
- `telemetry/agents/**`.
- `arcanum/**` and all public outputs.
- `releases/**`, Git state, tags, commits, pushes, publication, deployment, and
  external systems.

## Next owner approval

If this proposal is accepted, the next bounded authorization should say:

> Approve planning authoring only: prepare Lane A's staged 22-path RMT plan
> refresh and Lane B's Define/Design/Plan artifacts under the named new root.
> Do not apply Lane A, execute any SWU, mutate product/profile/authority bytes,
> register a dispatch, spawn multiple agents, or perform Git/release work.

That approval starts planning authoring. It is not dispatch confirmation,
implementation admission, profile acceptance, or release authorization.
