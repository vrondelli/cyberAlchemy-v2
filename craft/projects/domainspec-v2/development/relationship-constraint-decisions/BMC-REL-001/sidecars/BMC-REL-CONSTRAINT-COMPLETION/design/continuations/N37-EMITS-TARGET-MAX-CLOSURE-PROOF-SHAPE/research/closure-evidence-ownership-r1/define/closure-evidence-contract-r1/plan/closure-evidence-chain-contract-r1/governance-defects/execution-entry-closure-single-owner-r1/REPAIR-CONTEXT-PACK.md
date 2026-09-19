# Single-owner execution-entry closure repair context

Status: strict lean context; mutation authorized by the user; implementation not yet applied.

## Task

Repair the public Arcanum Task Session and Invoke preacceptance consumers so a nonempty, exhaustively typed homogeneous lifecycle-owner frontier is valid. Preserve exact per-unit owner/schema matching, no-effect rehearsal, and the separate request-eligibility gate. Then synchronize only the generated Task Session and Invoke package bytes that derive from the changed canonical files.

## Obligations

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | Do not fabricate a second owner or change Option A. | `RECEIPT.json#/accepted_invariant_binding`; `MINIMAL-REPAIR-PROPOSAL.md#Minimal repair` | covered |
| O2 | Accept one or more lifecycle owners only when every unit has a nonempty typed owner and receipt identity. | `arcanum/arcana/task-session/scripts/execution_entry_projection.py#validate_document` | covered |
| O3 | Resolve and compare every unit's owner-receipt schema; remove only the two-identity minimum. | `arcanum/spells/invoke/scripts/rehearse_execution_entry_consumers.py#rehearse` | covered |
| O4 | Add positive single-owner and negative missing/mismatched/incomplete coverage regressions. | the two focused test files and preacceptance integration suite listed below | covered |
| O5 | Preserve generated-package parity without overwriting unrelated dirty bytes. | `arcanum/tools/sync-generated-skill-package.sh`; exact canonical/generated preimage equality below | covered |
| O6 | Stop before EVF implementation, owner-request emission, publication, or D06 work. | `PREACCEPTANCE-BLOCK-RECEIPT.json#/claim_ceiling` | covered |

## Selected evidence

1. `governance-defects/execution-entry-closure-single-owner-r1/RECEIPT.json` — accepted invariant, exact defect and authority ceiling; SHA-256 `577e910a4a8f07d2860a604291f56cdfb515900adc31040bb059209252178eec`.
2. `governance-defects/execution-entry-closure-single-owner-r1/MINIMAL-REPAIR-PROPOSAL.md` — bounded repair and required revalidation.
3. `arcanum/arcana/task-session/scripts/execution_entry_projection.py` — owner-cardinality check at `validate_document`; SHA-256 `9d15f16ae219acbc3deab5133ff3b1508d955ff1f0b849fc03559a927ac2026d`.
4. `arcanum/arcana/task-session/development/test_execution_entry_projection.py` — canonical projection regressions; SHA-256 `562ed16f7df3ebb604288aaf2ba55a781bf1ccfdf2fef219cdbb9875c024c48f`.
5. `arcanum/spells/invoke/scripts/rehearse_execution_entry_consumers.py` — per-unit schema resolution and two-identity check; SHA-256 `81be9dbcff885870c1e438dc9b71cf92c221280fb81fa1d3755d8e0180477200`.
6. `arcanum/spells/invoke/development/preacceptance-closure/test_execution_entry_negative_cases.py` — focused fail-closed matrix; SHA-256 `0f1b0f7821095b7167d6b615eba65b48af23d5f4ff17e085dfe2794e1a51864c`.
7. `arcanum/spells/invoke/development/preacceptance-closure/test_preacceptance_closure.py` — full no-effect preacceptance integration; SHA-256 `498a057f09d30fdf554d73a2cf404fe3f27bd67439968a20240b5dd543991e5c`.
8. `arcanum/tools/sync-generated-skill-package.sh` — isolated selective package generation/sync; SHA-256 `bdfc1b8c12a5b18cdfd139979ee88e18c46b9885e58eff71a645b00e4db997c4`.

Before repair, the two generated runtime files are byte-identical to their canonical sources:

- `.agents/skills/task-session/scripts/execution_entry_projection.py` = `9d15f16ae219acbc3deab5133ff3b1508d955ff1f0b849fc03559a927ac2026d`.
- `.agents/skills/invoke/scripts/rehearse_execution_entry_consumers.py` = `81be9dbcff885870c1e438dc9b71cf92c221280fb81fa1d3755d8e0180477200`.

## Write scope

- The two canonical scripts above.
- Their focused canonical tests under the two listed development paths.
- Only generated Task Session/Invoke package bytes proven to derive from those canonical edits.
- Repair validation and apply receipts in this governance-defect directory.

## Forbidden scope

EVF schemas/fixtures/tools; DomainSpec relationship definitions and packet; D06; unrelated generated-package bytes; private DomainSpec/Saturn prose; Git commit/push; publication; deployment; external effects.

## Done criteria

1. Canonical focused tests pass, including new homogeneous-owner positive coverage and missing/mismatched/incomplete negative coverage.
2. Full Invoke preacceptance-closure tests pass.
3. Selective generation preview proves no unrelated generated-package delta; canonical/generated target pairs are byte-identical after sync.
4. `git diff --check` and exact changed-path inventory pass.
5. A repair receipt records hashes, commands, effects, and the continuation point. No implementation-acceptance request is emitted in this helper.

Strict coverage: pass. Blockers: none at handoff.
