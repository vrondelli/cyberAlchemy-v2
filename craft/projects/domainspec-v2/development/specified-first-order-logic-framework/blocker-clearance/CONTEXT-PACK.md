# Planning Context Pack

Mode: standard, strict selector coverage.

## Obligations

| ID | Obligation | Controlling evidence | Status |
| --- | --- | --- | --- |
| O-01 | Clear G-SFOL-06 without changing the released profile registry | `WORK-PACK.md` gate table; `impl/tools/minted-project/compiler.ts` profile selection and node loop; `impl/spec/ui-profile/minted-project-profile.json` development-profile precedent | covered |
| O-02 | Prepare exact, bounded experimental consumer authority without impersonating the declared source owner | Financial Settlement `operations.md` C3/P4; root validation backend deal, settlement, and GenerateSettlement use-case sources | covered |
| O-03 | Preserve the general DS-SFOL architecture | framework `SPEC.md` node-authoring contract and `operations.md` DeriveEffectCases | covered |
| O-04 | Do not claim an effect proof from an evaluator/harness alone | `src/sfol/cases/index.ts`, `src/sfol/proof/index.ts`, effect evaluator and harness | covered |
| O-05 | Regenerate Financial Settlement from canonical nodes | minted-project resolver/compiler/views contracts and node-source projection | covered |
| O-06 | Prove exact-set closure, mutation detection, and replay | TASK-SFOL-ADOPTION done criteria | covered |
| O-07 | Preserve BTE as structural evidence, separate from DS-SFOL behavior | existing BTE scripts and DS-SFOL capability boundary | covered |

## Selected Sources

| Path | Selector | Obligations |
| --- | --- | --- |
| `../WORK-PACK.md` | SWU-011 state, G-SFOL-01, G-SFOL-06 | O-01, O-02 |
| `../work-pack/tasks/TASK-SFOL-ADOPTION.md` | dependencies, write scope, done criteria | O-02, O-06 |
| `../SPEC.md` | Node Authoring Contract, Generality Proof | O-03, O-05 |
| `../operations.md` | DerivePureCases, DeriveEffectCases, EvaluateClause | O-03, O-04 |
| `../../../impl/tools/minted-project/compiler.ts` | profile selection, node validation, graph construction | O-01, O-05 |
| `../../../impl/tools/minted-project/views.ts` | build and verification receipts | O-05 |
| `../../../impl/spec/ui-profile/minted-project-profile.json` | explicit development profile precedent | O-01 |
| `../../../impl/test-derivation-engine/src/sfol/node-source/index.ts` | canonical proof-context projection | O-01, O-05 |
| `../../../impl/test-derivation-engine/src/sfol/cases/index.ts` | pure-only derived case contract | O-04 |
| `../../../impl/test-derivation-engine/src/sfol/proof/index.ts` | pure-only exact-set receipt and replay | O-04, O-06 |
| `../../../impl/test-derivation-engine/src/sfol/runners/effect/` | effect trace and contained harness | O-04, O-06 |
| `../../../impl/test-derivation-engine/__fixtures__/financial-settlement/operations.md` | C3 and P4 source clauses | O-02 |
| `../../../../../validation/poker-team/backend/src/domain/deal/deal.service.ts` | C3 implementation anchor | O-02 |
| `../../../../../validation/poker-team/backend/src/domain/settlement/settlement.service.ts` | P4 eligibility-decision anchor | O-02 |
| `../../../../../validation/poker-team/backend/src/use-cases/financial-settlement/generate-settlement.ts` | actual P4 write and event anchor | O-02, O-06 |

## Constraints

- Use an explicit development-only profile; do not mutate the released
  supported-profile registry.
- `body.logic` is admitted only by a profile-level logic contract.
- Canonical machine nodes, not Markdown or direct AST injection, feed adoption.
- Consumer fixtures and adapters contain no expected result.
- P4 is admitted only as its written implication. The initial finite universe
  contains an eligible case and proves the promised write/event. Zero-payout
  and duplicate-suppression converse behavior remain residue unless a separate
  clause such as R5 is admitted.
- P4 adapters invoke the real GenerateSettlement use case and capture actual
  transaction-repository and event-handler calls. They may project declared
  P4 observations but may not manufacture them from a decision boolean.
- Generic effect derivation/proof is core framework work and precedes adoption.
- Generated artifacts are byte-deterministic and remain below the feature
  source directory.
- Existing BTE artifacts are not overwritten by DS-SFOL generation.
- Release admission and production claims remain `not-granted`.

## Excluded Context

- AEO adoption: downstream of Financial Settlement and not needed to clear its
  gates.
- External solver selection: explicitly out of scope in the parent work pack.
- Public Arcanum mutation: no public capability behavior is required.

Strict coverage: pass, 7/7 obligations covered.
