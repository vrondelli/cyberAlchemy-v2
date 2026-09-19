# Invoke Refresh Report — BTE full work package

## Result

- Mode: `refresh`
- Spell: `invoke`
- Mutation mode: `apply-approved`
- Phase status: `pass`
- Phase basis: all ten accepted refresh signals are represented, the atomic
  planning package validates, and no refresh-authoring or audit blocker remains
- Handoff status: `gated`
- Output handle: `dsv2-bte-l0-l8-plan-refresh/v1`
- Evidence date: `2026-07-22`

The refresh is complete. BTE implementation is not ready to begin yet. The
validation owner must freeze the independent L0 red manifest, and the operator
must then explicitly select `SWU-BTE-L0-001` before Context Builder or Task
Session can open a runtime write scope.

## Applied delta

- Added the missing Decision 9 requirement, `DSV2-BTE-R-GRAPH-008`, and traced
  all 13 backend node-pattern rows through catalogue freeze, proof, and core.
- Replaced the stale four-layer/ten-SWU execution projection with L0-L8, ten
  active task contracts, and ten wave handoffs.
- Separated formation-v2 migration and current-v1 compatibility from successor
  YAML/JSON source activation.
- Replaced the ambiguous 16-member denominator with six separately frozen exact
  catalogues and exact-once TestCase, ExecutionResult, and primary
  MutationResult projections.
- Made the complete proof chain explicit: authority obligation, generated test,
  binding, raw result, independent evaluation, primary mutation, proof receipt,
  replay result, core eligibility, consumer evidence, and aggregate evidence.
- Marked obsolete task and wave projections historical and added an exact
  supersession map. Completed `SWU-BTE-001` and `SWU-BTE-003` evidence remains
  immutable narrow regression evidence.
- Added independent downstream IOLM and Body War consumer tasks after the shared
  core, with recomposition only at L8.
- Named `SWU-BTE-L0-001` as the sole first candidate without selecting it.

## Authority and lifecycle boundaries

The refresh changes planning, routing, Craft, Inventory, visibility read models,
and refresh evidence only. It does not:

- change DomainSpec source authority, the validated Design, implementation
  sources, consumer sources, or historical Task Session evidence;
- infer formation, compatibility, profile, node-pattern, relationship,
  validation-owner, consumer, lifecycle, or production admission;
- treat generated tests as expected truth or raw results as verdicts; or
- claim UI, full-language, universal solver, publication, release, or production
  completeness.

Candidate, admission, core eligibility, consumer proof, lifecycle promotion,
and production authorization remain distinct states.

## Synchronization

- Scoped Craft now records the L0-L8 package, closes the old 001/002 planning
  contradiction, and preserves the new L0 fixture-freeze/selection gate.
- The umbrella CyberAlchemy v2 Craft context remains only a pointer to the
  DomainSpec v2 scoped ledger; its machine and human projections now expose the
  same next move.
- The FPR visibility builder exposed and closed a stale source mismatch where
  the parent context said `flag` while its human view and generator contract
  required `block`. Generated roadmap JSON and HTML are synchronized.
- Inventory contains a new non-authority applied-result entry. The earlier
  readiness-review entry remains a historical snapshot rather than being
  rewritten.

## Validation

- Context Builder: pass, deep-strict, 11/11 obligations.
- Dispatch Spec: pass after narrowing generic receipt requirements and retaining
  BTE-specific proof requirements in the task contracts.
- Distill Validate: pass; no structural gap in the refreshed package.
- Preserved Design, validation, layering-seed, review, and completed receipt
  SHA-256 digests: pass.
- `engine:test`: pass, 107/107.
- `tools:test`: pass, 147/147.
- `typecheck`: pass.
- `validate:content`: pass, 37 concepts, 34 edges, 5 files, 22 schemas.
- `validate:rels`: pass, 5 specs, 34 edges, 30 canonical signatures.
- `instances:validate`: pass, 22 instances against 22 schemas.
- `validate:docs`: pass.
- `tags:test`: pass, 15/15.
- `engine:lint`: pass with `CLEAN (0)` as a regression baseline only; it is not
  treated as BTE completeness evidence.
- FPR visibility generation, `--check`, and 14 unit tests: pass.
- Inventory deterministic updater: pass; six machine-index and seven human-index
  assertion groups pass.
- Scoped JSON/YAML parsing, stale-route checks, and `git diff --check`: pass.

## Blockers by scope

- Refresh authoring: none.
- Apply authorization: resolved by the user's `apply-approved` request.
- Audit: none.
- Target lifecycle: open. These are expected implementation gates, not failures
  of the refresh: L0 independent red-manifest freeze, explicit candidate
  selection, stage-specific admissions, six catalogue freezes, shared-core
  proof, IOLM schema repair, Body War machine package, and terminal aggregation.

## Owner receipt and next route

- Owner: private DomainSpec v2 BTE planning/Craft owner via `invoke:refresh`
- Receipt: `pass`, `dsv2-bte-l0-l8-plan-refresh/v1`
- Next owner: validation owner for the L0 independent red manifest
- Then: operator explicitly selects `SWU-BTE-L0-001`; Context Builder emits a
  strict runtime pack; Task Session executes exactly that one SWU
- Continuation posture: refresh complete, implementation handoff gated
