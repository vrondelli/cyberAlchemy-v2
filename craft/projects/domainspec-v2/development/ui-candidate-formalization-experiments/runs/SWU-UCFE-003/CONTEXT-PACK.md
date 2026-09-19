---
task: SWU-UCFE-003
mode: standard
status: complete
strict_coverage: n/a
handoff: none
authority: session-evidence
created_at: 2026-07-12
---

# SWU-UCFE-003 Context Pack

## Scope

Evaluate each preregistered existing representation independently across six
coverage dimensions. The audit may establish complete coverage, open the
distinct-evidence route, or defer because evidence is incomplete. It cannot
establish that Form is distinct or mutate authority.

## Obligation Matrix

| ID | Obligation | Controlling evidence | Status |
| --- | --- | --- | --- |
| O1 | Consume accepted immutable preregistration generation 001. | SWU-002 receipt and run manifest | covered |
| O2 | Verify current Form law, registry, relationship, and Body War receipt handles. | preregistration source pins | covered |
| O3 | Evaluate three alternatives independently. | `alternatives.yml` coverage alternatives | covered |
| O4 | Type all six dimensions for every alternative. | `EXPERIMENT-CONTRACTS.md` Existing Coverage Matrix | covered |
| O5 | Derive states from finite required/provided obligation sets, not labels or hand-authored outcomes. | Form schema/fixtures and exact signatures | covered |
| O6 | Prevent partial evidence pooling between alternatives. | coverage contract and SWU algorithm 3 | covered |
| O7 | Emit `covered-existing` only for one six-of-six alternative. | SWU algorithm 4 | covered |
| O8 | Emit `distinct-route-open` only when every dimension is complete and none passes all six. | SWU algorithm 5 | covered |
| O9 | Emit `defer-missing` on stale sources or incomplete dimensions. | SWU algorithm 6 and edge cases | covered |
| O10 | Preserve generated fixtures as structural audit evidence, never an independent corpus. | SWU edge cases; corpus receipt prohibitions | covered |

Coverage: 10/10. Existing finite candidate schemas and exact relationship rows
are sufficient to test structural preservation and loss. They are not
independent empirical evidence and cannot satisfy the distinct matrix.

## Selected Context

| Source | Selector | Obligations |
| --- | --- | --- |
| `work-pack/tasks/TASK-UCFE-COVERAGE.md` | SWU-UCFE-003 | O1-O10 |
| `runs/SWU-UCFE-002/receipt.json` | accepted preregistration generation | O1, O2 |
| `experiments/form/preregistration.yml` | source pins, matrix, corpus A | O1-O3, O9 |
| `experiments/form/alternatives.yml` | three alternatives and exact signatures | O3-O8 |
| `EXPERIMENT-CONTRACTS.md` | Existing Coverage Matrix and precedence | O4, O6-O9 |
| `../ui-meta-type-formalization/candidate-meta-types/ui/form/form.schema.yml` | six required aggregate fields | O4, O5 |
| `../ui-meta-type-formalization/candidate-meta-types/ui/form/fixtures/` | positive, malformed, neighbor contracts | O4, O5 |
| `../ui-meta-type-formalization/candidate-meta-types/ui/component/component.schema.yml` | typed visual I/O and no validation authority | O3-O5 |
| `../ui-meta-type-formalization/candidate-meta-types/ui/action/action.schema.yml` | intent/outcome contract | O3-O5 |
| `../../definitions/relationships/relationships.yml` | exact active signature endpoints | O2-O5, O9 |
| `../ui-meta-type-repair/evidence/results/corpus/generation-002/receipts.json` | Body War literal facts and prohibitions | O2, O5, O10 |

## Evaluation Model

For each dimension, fixtures declare a finite candidate-required obligation set
and a source-backed alternative-provided set. The evaluator computes set
difference:

- no missing items and complete source checks -> `pass`;
- missing required items with complete finite source checks -> `fail`;
- stale source, wildcard, label witness, or incomplete check -> `missing`.

An alternative passes only when all six dimensions pass. Missing dimensions
cannot become failure evidence for distinction and cannot become coverage.

## Constraints

- Alternative matrices remain isolated; no union operation is permitted.
- Failure means current non-coverage under pinned contracts, not universal
  impossibility or candidate distinction.
- Active `submits` remains `Form -> Action`; it cannot be silently widened to
  make the Component alternative compose.
- Generated fixtures are deterministic structural probes, not corpus B.
- Changed-consequence output names exactly which Form consequence is lost.
- No score, weight, threshold tailoring, wildcard edge, or label witness.

## Write Scope

- `experiments/form/coverage/fixtures/`
- `experiments/form/coverage/manifest.json`
- `experiments/form/coverage/evaluate-coverage.mjs`
- `experiments/form/coverage/results/generation-001/`
- `tests/form-coverage.test.mjs`
- `runs/SWU-UCFE-003/CONTEXT-PACK.md`
- `runs/SWU-UCFE-003/receipt.json`
- direct branch/frontier synchronization

## Validation Surface

```bash
node --test projects/domainspec-v2/development/ui-candidate-formalization-experiments/tests/form-coverage.test.mjs
npm --prefix projects/domainspec-v2/impl run validate:docs
```

## Gate Verdict

PASS. Dependency, finite source contracts, exact signatures, write scope, and
validation are present. Runtime is local through the Experiment Harness owner
boundary; no subagent or runtime delegation is used.
