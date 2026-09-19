# Context Pack — SWU-BTE-001 shared criterion kernel

This is session evidence for one bounded Task Session. It is not a canonical planning document.

## Context Pack Summary

- Task: `SWU-BTE-001`
- Mode: `standard --strict --emit both`
- Files selected: 14
- Snippets selected: 24
- Obligation coverage: 100%
- Noise ratio: 0 (every selected source closes a named obligation)
- Output markdown: this file
- Output index: `context-pack.json`
- Handoff pack: none (local execution)
- Strict coverage: pass
- Blockers: 0

## Authority And Gate

1. `TASK-BTE-CONTRACT.md` owns the SWU algorithm, write scope, done criteria, and validation surface.
2. `WORK-PACK.md` owns dependency readiness and the bounded SWU board.
3. W0/W1 and Distill own sequencing: W0 is closed and SWU-BTE-001 is first.
4. The 2026-07-20 Invoke Refresh receipt owns the readiness repair and returns `task-session:execute SWU-BTE-001`.
5. Live committed callers and tests constrain behavior preservation.

Gate evidence:

- `EXECUTION-DISPATCH.json` validated `pass` with zero blocks and flags using Dispatch Spec.
- The live non-UI schema inventory contains 13 files and 16 criteria across the eight contracted BTE rules.
- The same caller schema root now also contains nine UI schemas using `attribute-nonempty/v1`; preserving that committed rule is a compatibility obligation, not a BTE profile expansion.
- No declared implementation or test file had a pre-existing worktree diff when the session started.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O-001 | Select exactly one dependency-ready SWU. | Work Pack SWU manifest; Invoke Refresh receipt | covered |
| O-002 | Replace both duplicated bounded YAML readers with one fail-closed reader. | Task algorithm 1; both caller loader/parser selectors | covered |
| O-003 | Preflight required fields, option lists, known rules, and contradictions. | Task algorithm 2; UI repair preflight contract/tests | covered |
| O-004 | Preserve missing, empty, whitespace, `false`, and `0`. | Task algorithm 3 and edge cases | covered |
| O-005 | Evaluate all eight BTE rule forms through one kernel. | Task algorithm 4; 13-schema/16-criterion live inventory | covered |
| O-006 | Return stable ordered structured violations with schema, criterion, rule, subject, and code. | Task algorithm 5 | covered |
| O-007 | Adapt Markdown and instance YAML without CLI behavior drift. | Task algorithm 6; caller and black-box test selectors | covered |
| O-008 | Prove caller parity and fail-closed negatives. | Task algorithm 7; existing parity tests; new kernel test target | covered |
| O-009 | Preserve the committed UI repair rule while keeping it outside BTE breadth claims. | live caller imports, UI repair contract, parity tests | covered |
| O-010 | Run all four declared validation commands. | Task validation block; `impl/package.json` scripts | covered |

## Selected Sources

| Source | Selectors | Obligations | SHA-256 |
| --- | --- | --- | --- |
| `WORK-PACK.md` | Control Fields; SWU Manifest row 001; Gate Checks | O-001, O-010 | `65540de6cf2b9cb3b725ced611091a0e67619ff4e8a6adb939611aafef1fe8cc` |
| `work-pack/tasks/TASK-BTE-CONTRACT.md` | SWU-BTE-001 Goal through Validation | O-002–O-010 | `188c49ef9036ed85e98aa4658faf2c0958a7c0391a2b48cf105d7b0355a4987f` |
| `work-pack/waves/W0-OWNER-GATE.md` | Exit Gate; Promotion | O-001 | `388d82480a0952d171576e0be0c6df963a75ed26d6234e1eb04bcf45f72794b6` |
| `work-pack/waves/W1-SHARED-KERNEL.md` | Sequence; Exit Gate | O-001, O-005, O-008 | `77657e4fc0549be0d8e301d70d9384958ac266c99f41b7d400f128bdecef30e9` |
| `DISTILL-VALIDATION.md` | smallest coherent unit; recomposition verdict | O-001 | `3b15b682acd56e78b7cd1e636b2bd7c23b798d2147e74508efc3fe3ef5eccdb3` |
| `EXECUTION-DISPATCH.json` | dispatch identity and gates | O-001 | `ced40ba443c3015434e9a257f4ecc451cb570857656989a5116e1f242aa6bfbe` |
| `refreshes/2026-07-20-swu-readiness-continuation/apply-receipt.json` | applied delta; validation; next route | O-001 | `7bcfcdfd76aae5658ba8197c75b7c422b0e13bb269735cc513a529d5ee7569e7` |
| `impl/tools/validate-content.ts` | schema loader; `applyCriterion`; Markdown table adapter | O-002, O-005–O-009 | `6f8fce5c4efe202b62c9589b1ecefc8b9b190802576e7cda9e6b1e8df3ea0233` |
| `impl/tools/instances.ts` | schema loader; `applyInstanceCriterion`; instance generator | O-002, O-005–O-009 | `1fa7f8b5e23ad7b7550811030bef8fcc3673a9ce1d559210ba2e37f153136b29` |
| `impl/tools/lib/ui-repair-rule-contract.ts` | violation registry; preflight helpers; compatibility rule | O-003, O-004, O-009 | `abcef63a1ea09b94ccba3e9e76bf7c0d929455b60697174336662a126ba0d20a` |
| `impl/tools/tests/validate-content.test.ts` | CLI contract and schema-negative fixtures | O-003, O-007, O-008 | `503f8912fb7bd8ad25bd609f555871fde53f05eebf393e3ff39428813f435f98` |
| `impl/tools/tests/instances.test.ts` | round-trip and schema-negative fixtures | O-003, O-007, O-008 | `8545fe8107c0fb179d2d2fdafb6b821cb9223a942145ba95077b15c801279ab9` |
| `impl/tools/tests/attribute-nonempty-parity.test.ts` | Markdown/instance compatibility vectors | O-007–O-009 | `e7162fb8f49f22209119fdebf9234ea5353453e775caee13728ad43362cd887c` |
| `impl/package.json` | `tools:test`, `validate:content`, `instances:validate`, `typecheck` | O-010 | `22e23a59dce87af17154c44418cac2cfe2c06bea4e9be5d3104cb99c74af4936` |

## Execution Constraints

- Writes remain inside the declared implementation files, directly affected tests, and Task Session evidence/synchronization artifacts.
- Do not change any meta-type schema, supported profile, UI admission artifact, engine rule, or release state.
- Preserve the UI violation registry and its existing codes.
- The shared evaluator decides outcomes; caller-local code may only normalize subjects and format violations for its CLI.
- Any unsupported YAML feature fails before criterion evaluation.
- No runtime adapter or subagent is used.

## Selected Implementation Path

Use a typed shared kernel with three boundaries:

1. a bounded YAML loader and criterion preflight;
2. a normalized `CriterionSubject` plus ordered structured evaluator;
3. thin Markdown and instance adapters that retain caller-specific paths and CLI presentation.

The compatibility-only `attribute-nonempty/v1` branch remains supported because removing it would be behavior drift in both shared callers. The BTE completion assertion remains scoped to the 13 non-UI schemas and their 16 criteria.

## Validation Surface

```bash
npm --prefix projects/domainspec-v2/impl run tools:test
npm --prefix projects/domainspec-v2/impl run validate:content
npm --prefix projects/domainspec-v2/impl run instances:validate
npm --prefix projects/domainspec-v2/impl run typecheck
```

## Excluded Candidates

- UI profile planning documents: excluded because the committed rule contract and parity tests fully cover the compatibility obligation.
- W2+ task contracts: excluded because SWU-BTE-001 cannot mutate or promote those scopes.
- Engine sources: excluded because the task explicitly keeps criterion evaluation outside the engine moat.
