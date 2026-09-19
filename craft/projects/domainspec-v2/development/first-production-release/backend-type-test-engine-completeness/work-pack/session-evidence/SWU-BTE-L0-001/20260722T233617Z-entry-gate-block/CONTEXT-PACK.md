---
task: SWU-BTE-L0-001
mode: standard
status: block
createdAt: 2026-07-22T23:36:17Z
sessionId: 20260722T233617Z-entry-gate-block
semanticAuthority: none
---

# Context Pack — SWU-BTE-L0-001 Entry-Gate Audit

## Context Pack Summary

- Task: `SWU-BTE-L0-001` — contracts, validators, and a non-admitting
  `ValidationReceipt`.
- Mode: `standard`, strict, local.
- Files selected: 11.
- Snippets selected: 15 selector-level sections.
- Obligation coverage: 7 covered, 2 blocked; 77.8% executable coverage.
- Noise ratio: low; only L0 entry, authority, write, and validation evidence.
- Output markdown: this file.
- Output index: `context-pack.json`.
- Handoff pack: none; `--via runtime` was not requested.
- Strict coverage: `block`.
- Prototype/compiler mutation: none.

## Obligation Matrix

| ID | Obligation | Selected evidence | Status |
| --- | --- | --- | --- |
| `L0-CTX-001` | Resolve exactly one possible target. | `WORK-PACK.md#Candidate SWU Manifest`; L0 task frontmatter. | covered — `SWU-BTE-L0-001` is the sole candidate. |
| `L0-CTX-002` | Require explicit selection only after its entry evidence exists. | `WORK-PACK.md#Handoff Gate`; `PLAN.md#Navigation`; W0/W1. | **block** — the candidate remains unselected, and selection is forbidden before the freeze. |
| `L0-CTX-003` | Validate the refreshed dispatch before execution. | `EXECUTION-DISPATCH.json`; current validator result. | covered — `VALIDATION=pass`. |
| `L0-CTX-004` | Match preserved Design, validation, seed, and completed receipt digests. | L0 `Consumes`; refresh apply receipt; direct SHA-256 recomputation. | covered — all five preserved handles match. |
| `L0-CTX-005` | Consume an independently authored, pre-execution red manifest and freeze receipt. | L0 `Consumes`; `WORK-PACK.md#L0 Output Contract`; `GAPS.md#Active Gates`; Design ownership split. | **block** — both required validation-owned files are absent. |
| `L0-CTX-006` | Preserve the candidate's exact implementation write scope. | L0 `Write Scope`; `WORK-PACK.md#Candidate SWU Manifest`. | covered — scope is explicit. A pre-existing `impl/package.json` change must be preserved and re-audited after unblock. |
| `L0-CTX-007` | Preserve non-admission and owner separation. | Design ownership table; L0 `Done And Validation`; shared decisions. | covered — implementation cannot author expected red answers or grant admission. |
| `L0-CTX-008` | Retain exact done criteria and runnable regression validation. | L0 `Done And Validation`; `WORK-PACK.md#Command Status`. | covered — planned L0 command plus current regressions are named. |
| `L0-CTX-009` | Stop before mutation when an entry handle is missing or stale. | L0 `Consumes` and `Stop And Handoff`; W0/W1. | covered — this session stops before implementation. |

## Included Context

- `WORK-PACK.md` — candidate identity, selected state, L0 outputs, validation
  inputs, allowed/forbidden writes, handoff gate — `L0-CTX-001..009`.
- `work-pack/tasks/TASK-BTE-L0-PROOF-PRIMITIVES.md` — exact consumes, emits,
  red cases, rules, done criteria, stop route — `L0-CTX-002..009`.
- `work-pack/waves/W0-REFRESH-HANDOFF.md` — freeze and selection exit gate —
  `L0-CTX-002`, `L0-CTX-005`, `L0-CTX-009`.
- `work-pack/waves/W1-L0-PROOF-PRIMITIVES.md` — entry and non-admitting exit —
  `L0-CTX-002`, `L0-CTX-007`, `L0-CTX-009`.
- `PLAN.md#Layer Plan`, `#Command Plan`, `#Navigation` — L0 order and explicit
  prohibition on starting early — `L0-CTX-002`, `L0-CTX-008`.
- `REQUIREMENTS.md#Authority And Versioning`, `#Obligation And Test Derivation`
  — independent authority and exact-set constraints — `L0-CTX-005`,
  `L0-CTX-007`.
- `DESIGN.md#Ownership And Authority Split`, `#Fixture And Catalogue Ownership`
  — the implementation under test cannot author its own oracle —
  `L0-CTX-005`, `L0-CTX-007`.
- `EXECUTION-DISPATCH.json` — selected-one-SWU and exact-entry-evidence gate —
  `L0-CTX-003`.
- `refreshes/2026-07-22-full-work-refresh/apply-receipt.json` — refreshed plan
  receipt and preserved digests — `L0-CTX-003`, `L0-CTX-004`.
- `work-pack/shared/GAPS.md#Active Gates` — open `GATE-BTE-L0-FREEZE` —
  `L0-CTX-005`.
- `work-pack/shared/DECISIONS.md#Accepted Plan Decisions` — independent red
  cases and candidate-only posture — `L0-CTX-007`.

## Excluded Candidates

- L1-L8 tasks — excluded because no L0 receipt exists.
- Historical BTE tasks and waves — excluded because `HISTORICAL-MAP.md` makes
  them non-executable.
- IOLM, Body War, UI, and public Arcanum files — excluded by the L0 boundary.
- Broad implementation search — excluded because the missing exact input paths
  already determine the gate.

## Gate Verdict

`BLOCK`. The following required paths do not exist:

- `projects/domainspec-v2/validation-inputs/l0/red-fixture-manifest.v1.json`;
- `projects/domainspec-v2/validation-inputs/l0/red-fixture-freeze-receipt.json`.

The current invocation does not include an exact `--swu SWU-BTE-L0-001`
selection, and the Work Pack forbids selection before those files exist and
validate. There is no implementation trade-off to decide yet, so Decision Gate
does not apply. The missing evidence cannot be fabricated by Task Session
without violating the validation-owner boundary.

## Next Actions

1. An authorized validation owner independently authors and freezes the exact
   nonempty L0 red-fixture manifest and emits its digest-bound freeze receipt.
2. Validate both artifacts without importing the future BTE implementation.
3. Invoke Task Session with explicit `--swu SWU-BTE-L0-001`; rebuild this
   context pack and audit the existing `impl/package.json` modification before
   adding the planned script row.
