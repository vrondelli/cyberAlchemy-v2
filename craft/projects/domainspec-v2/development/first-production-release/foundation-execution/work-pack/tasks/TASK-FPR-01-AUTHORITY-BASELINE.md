---
task_id: TASK-FPR-01-AUTHORITY-BASELINE
owner_node: FPR-01
layer: L1
status: completed
---

# TASK-FPR-01-AUTHORITY-BASELINE

## Objective

Produce one owner-ratified, non-contradictory baseline for active types, relationships, maturity/status, source homes, projection posture, and direction disposition. Do not select the favorable count.

## Dependencies

- `SWU-SGRM-007-R1` current guard receipt.
- Accepted FPR-00 product decision.
- Existing source-homing and definitions/validation owner routes.

## SWU-FPR01-001: Deterministic Authority Census

- Selection authority: `work-pack/shared/W0-PROOF-SYNC-DECISION.md`; selected for a later Task Session and not executed by the proof refresh.
- Source anchors: `definitions/meta-types/meta-types.yml`; `definitions/relationships/relationships.yml`; `definitions/DEFINITIONS.md`; taxonomy/projection views named by `EGI-001`; `DEC-DSV2-SPEC-HOMING`; import manifest paths from `EGI-002/020`.
- Write scope: `development/first-production-release/evidence/authority-census.json` and task receipt only.
- Done criteria: enumerate canonical sources, projections, counts, statuses, source paths, content digests, and every disagreement; distinguish backend admission, staged labels, and signatures.
- Acceptance evidence: repeatable census with provenance and no chosen baseline.
- Validation: two clean runs produce byte-identical normalized JSON; every source exists or has an explicit missing disposition.
- Owner: definitions/validation local fallback.
- Handoff: pass the census to FPR01-002; stop if a source claims authority without an owner.

## SWU-FPR01-002: Owner Dispositions

- Dependencies: FPR01-001.
- Source anchors: census; `DEC-DSV2-SPEC-HOMING`; `GAP-SH-UI11-MIGRATE`; active contract-to-authoring lens; accepted business-plane-to-Spec chain.
- Write scope: `development/first-production-release/evidence/authority-source-dispositions.json` and a Decision Gate artifact under the FPR-01 evidence directory.
- Done criteria: each conflicting source/count/status/path has `authoritative`, `generated-projection`, `historical`, `superseded`, `deferred`, or `repair-required` disposition, owner, reason, and effective condition; direction is recorded as a dependency for FPR-03, not silently solved by implementation.
- Acceptance evidence: Decision Gate receipt signed/reviewed by definitions, validation, and layering owners.
- Validation: no unresolved or multiply authoritative row; every census disagreement has exactly one disposition.
- Owner: manual owner decision through Decision Gate.
- Handoff: approved dispositions only to FPR01-003.

## SWU-FPR01-003: Baseline and Drift Validator

- Dependencies: FPR01-002.
- Write scope:
  - `development/first-production-release/authority-baseline.yml`
  - `development/first-production-release/schemas/authority-baseline.schema.json`
  - `development/first-production-release/tools/validate-authority-baseline.cjs`
  - `development/first-production-release/fixtures/authority-baseline/`
- Done criteria: baseline resolves the 13/14, 24/25, 30/31, composability, projection, path, status, and direction-disposition conflicts; validator derives rather than trusts prose counts.
- Acceptance evidence: positive report plus distinct failures for mutated count, stale source path, changed status, missing owner, and conflicting direction.
- Validation: validator positive run; every fixture returns its named nonzero code; normalized result is deterministic.
- Owner: validation owner with definitions review.
- Handoff: bind exact baseline digest to FPR01-004.

## SWU-FPR01-004: Ratification Receipt

- Dependencies: FPR01-003.
- Write scope: `development/first-production-release/evidence/authority-baseline-ratification.json` only, plus Task Session receipt.
- Done criteria: receipt binds baseline, schema, validator, source census, dispositions, current guard receipt, and negative-control results by digest; required owners are named and no production claim is present.
- Acceptance evidence: independently verified receipt and unchanged-input replay.
- Validation: receipt schema/parse; referenced path/digest verification; one deliberate baseline mutation invalidates the receipt.
- Owner: definitions, validation, and layering owners; independent verifier checks the receipt.
- Handoff: only this verified receipt opens FPR-02.

## Synchronization

FPR-01 closed from the verified `SWU-FPR01-004` receipt, and the separate
apply-approved Invoke refresh synchronized Craft and workflow projections.

## Current Ratification Route

The completed `SWU-FPR01-004` Task Session produced:

- PASS receipt SHA-256
  `19b7c2c0baf10981b807297b61c8a2849b8c2505816d85735a66c49fb194fc9e`; and
- ratification JSON SHA-256
  `beeb8c5bd8c289c73123411630ac01752e3530849a1910c475b70e0606257f8c`.

The receipt verifies 19/19 bindings, unchanged canonical replay, five killed mutants,
the current guard, aggregate validation, and deliberate mutation rejection. The
separate synchronization closes this task and W1 without selecting FPR-02 or
authorizing production.
