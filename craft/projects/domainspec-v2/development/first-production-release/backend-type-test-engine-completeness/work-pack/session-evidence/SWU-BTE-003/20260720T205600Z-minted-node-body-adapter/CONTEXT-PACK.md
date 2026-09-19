# Context Pack — SWU-BTE-003 minted-node body adapter

## Identity

- Task: `SWU-BTE-003`
- Parent: `TASK-BTE-NODE-COVERAGE`
- Work pack: `backend-type-test-engine-completeness/WORK-PACK.md`
- Run: `20260720T205600Z-minted-node-body-adapter`
- Mode: `standard`, strict
- Runtime: local
- Handoff pack: none
- Evidence role: Task Session execution evidence, not planning authority

## Gate Summary

- Selected unit: exactly one, `SWU-BTE-003`
- Readiness: `ready-after-selection`
- Dependency: `SWU-BTE-001` terminal receipt is `pass`
- Apply prerequisite: post-kernel sequencing repair receipt is `pass`
- Write-scope overlap: no pre-existing changes in `impl/tools/minted-project/`; the existing untracked kernel test belongs to completed `SWU-BTE-001` and will not be rewritten
- Blocker decisions: none
- Strict obligation coverage: `10/10`, pass

## Controlling Constraints

1. YAML criteria remain formation authority; the JSON node schema remains envelope authority.
2. The compiler must call the proven shared criterion evaluator and must not retain or add a competing YAML/criterion evaluator.
3. Body normalization covers `body.fields`, `body.values`, direct scalar keys, and named equality prose while preserving missing, empty, whitespace, `false`, and `0`.
4. Node-envelope and formation failures remain distinguishable.
5. No type-name branching is allowed; current profile admission selects `node.kind`, and the adapter resolves the unique canonical YAML schema by its `meta_type` declaration.
6. The current four-kind profile and explicit UI development profile retain successful and failing behavior.
7. This SWU does not create the successor 13-kind profile, corpus, edge proof, obligation catalogue, or release evidence.

## Recorded Assumption And Trade-off

The current four-kind profile binds legacy JSON formation projections, while the accepted plan deliberately schedules the YAML adapter before `SWU-BTE-002` creates digest-pinned successor bindings. For this SWU, an admitted `node.kind` selects the unique canonical YAML criterion schema by `meta_type`; explicit development-profile `attribute-map` paths remain honored and schema/meta-type mismatches fail closed.

- Chosen: canonical schema lookup by unique `meta_type`, after profile kind admission. This implements `001 -> 003` without inventing a new profile field.
- Rejected: wait for `SWU-BTE-002`; this recreates the circular dependency the approved Refresh repaired.
- Rejected: retain the compiler’s private attribute-map parser or rely on duplicate JSON body rules; both violate the shared-kernel and YAML-authority decisions.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| `O-003-01` | Select one ready SWU with complete dependency evidence. | Work Pack row; `SWU-BTE-001` receipt; Invoke apply receipt. | covered |
| `O-003-02` | Normalize minted bodies into `CriterionSubject`. | Node task algorithm; kernel subject contract. | covered |
| `O-003-03` | Support all eight backend rule forms. | Live kernel inventory test and canonical meta-type registry. | covered |
| `O-003-04` | Use one shared evaluator and remove the competing attribute parser. | Kernel exports; compiler `loadAttributeCriteria`/`validateAttributeMapFormation` selectors. | covered |
| `O-003-05` | Select YAML schemas without kind branches. | Profile kind admission; unique `meta_type` schema inventory; accepted P-BTE-003/004. | covered |
| `O-003-06` | Preserve envelope-versus-formation diagnostics. | Node schema; compiler base-violation filtering and `FORMATION_INVALID`. | covered |
| `O-003-07` | Preserve current four-kind behavior. | Compiler/conformance tests and current supported profile. | covered |
| `O-003-08` | Preserve explicit UI development behavior. | Development profile contract and UI engine tests. | covered |
| `O-003-09` | Emit stable criterion IDs/codes in compiler diagnostics. | Kernel violation contract; Task done criteria. | covered |
| `O-003-10` | Validate and synchronize auditable completion evidence. | Task validation/handoff clauses; Task Session contract. | covered |

## Selected Sources

| Source | Selectors | Obligations |
| --- | --- | --- |
| `WORK-PACK.md` | SWU-003 row, continuation paragraph, gate checks | O-003-01, O-003-10 |
| `work-pack/tasks/TASK-BTE-NODE-COVERAGE.md` | dependencies, SWU-003 algorithm/write scope/done criteria/validation/handoff | O-003-01..10 |
| `work-pack/waves/W1-SHARED-KERNEL.md` | sequence, exit gate, promotion | O-003-01, O-003-04 |
| `work-pack/shared/DECISIONS.md` | P-BTE-003, P-BTE-004 | O-003-04, O-003-05, O-003-06 |
| `SWU-BTE-001/.../execution-receipt.json` | result, validation, residue | O-003-01, O-003-04 |
| `refreshes/2026-07-20-post-kernel-sequencing-repair/apply-receipt.json` | result, applied changes, next route | O-003-01 |
| `impl/tools/lib/meta-type-criteria.ts` | subject/violation types, schema loader, evaluator | O-003-02, O-003-03, O-003-04, O-003-09 |
| `impl/tools/minted-project/compiler.ts` | profile selection, duplicate formation evaluator, node loop | O-003-04, O-003-05, O-003-06 |
| `impl/tools/tests/minted-project-compiler.test.ts` | positive compile and formation-negative tests | O-003-06, O-003-07 |
| `impl/tools/tests/meta-type-criteria.test.ts` | exact 13/16/eight-rule inventory and normalized-subject controls | O-003-02, O-003-03, O-003-09 |
| `definitions/meta-types/meta-types.yml` | 13 active members and criterion-schema refs | O-003-03, O-003-05 |
| `definitions/minted-project/supported-profiles.yml` | current four-kind admission and formation projections | O-003-05, O-003-07 |
| `impl/spec/ui-profile/minted-project-profile.json` | explicit formation contracts and handle | O-003-05, O-003-08 |
| `impl/spec/minted-project/node.schema.json` | source envelope and body boundary | O-003-02, O-003-06 |

## Write Scope

- `impl/tools/minted-project/meta-type-body-adapter.ts` — new
- `impl/tools/minted-project/compiler.ts`
- `impl/tools/tests/minted-project-meta-type-body-adapter.test.ts` — new
- `impl/tools/tests/minted-project-compiler.test.ts` only if compiler-level diagnostic assertions are required
- `work-pack/shared/TRACEABILITY.md` and `contracts/README.md` for the task-required adapter/diagnostic handoff
- `WORK-PACK.md` and this run evidence only after validation supports completion

## Validation Surface

```bash
npm --prefix projects/domainspec-v2/impl run tools:test
npm --prefix projects/domainspec-v2/impl run engine:test
npm --prefix projects/domainspec-v2/impl run typecheck
python3 arcanum/formulae/dispatch-spec/scripts/validate-dispatch.py \
  projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/EXECUTION-DISPATCH.json \
  --json
git diff --check -- <SWU-BTE-003 scope>
```

## Excluded Candidates

- Individual schema files: the canonical registry plus shared-kernel inventory test cover selection and rule diversity; tests will exercise representative live schemas directly.
- `contracts/README.md` and `TRACEABILITY.md`: synchronization targets, not controlling implementation authority.
- Successor profile, corpus, edge, obligation, consumer, and release artifacts: later SWUs.
- Broad repository search: unnecessary after the UI development profile was checked as the named same-compiler compatibility surface.

## Fallback Search

Named gap only: the explicit UI development profile was inspected because it shares `compileMintedProject`; no wider UI or release exploration is authorized.
