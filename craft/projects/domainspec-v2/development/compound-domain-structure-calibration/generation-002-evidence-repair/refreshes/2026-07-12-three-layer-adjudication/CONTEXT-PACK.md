---
mode: refresh
spell: invoke
status: complete
strict_coverage: pass
mutation_mode: proposal-only
evidence_date: 2026-07-12
---

# Context Pack: Three-Layer F3 Adjudication Refresh

## Refresh Scope

Refresh only the blocked L2/L3 continuation of generation 2 after
`DEC-CDSC2-F3-ADJUDICATION` selected explicit pre-observation, observation, and
post-observation adjudication layers. Completed SWU-CDSC2-001 through
SWU-CDSC2-004 remain accepted and immutable.

## Source Evidence

1. `runs/SWU-CDSC2-005/DECISION-GATE.md`: Option 2 selected by the user.
2. `runs/SWU-CDSC2-005/TASK-SESSION-RESULT.md`: old SWU005 blocked before F3
   mutation.
3. Parent `evidence/generation-001/f3-savvy-page/receipt.json`: immutable
   pre-observation F3 interpretation, including combined absence observable
   `Q-06`.
4. `evidence/generation-002/m1-permitted-screen/receipt.json`: frozen supported
   permitted-substitution observation.
5. `evidence/generation-002/m2-breaking-guard/receipt.json`: frozen supported
   breaking-substitution observation.
6. Parent `contracts/evidence-receipt.schema.yml`: v1 compatibility target.
7. Parent `evaluation/validate-input.mjs`: total-matrix and receipt validation.
8. Parent `evaluation/evaluate-fixture.mjs`: frozen four-outcome evaluator.
9. `contracts/observation-receipt.schema.yml`: frozen observation layer.
10. `runtime/validate-generation-002.mjs`: current parity/protection boundary.
11. `runtime/evaluate-successor-suite.mjs`: current append-only suite boundary.
12. Current `SPEC.md`, `ARCHITECTURE.md`, implementation plan/layering, and
    work-pack L2/L3 contracts.
13. `DECISION-LEDGER.md` decision `DEC-CDSC2-009` and `GAP-LEDGER.md` gap
    `GAP-CDSC2-008`.

## Controlling Constraints

- Parent F3 bytes and generation-1 bytes remain unchanged.
- M1/M2 receipt bytes, predictions, outcomes, and handles remain unchanged.
- The adjudication layer cannot add or rewrite explanations.
- Permitted and breaking substitution coordinates remain separate.
- Compatibility observables derive from parent preregistered `S` descriptions
  and predictions, never from observed outcomes.
- The v1 evaluator remains read-only and receives only a deterministic derived
  compatibility projection.
- A disputed or partial explanation becomes `indeterminate`; execution cannot
  optimize cells for a preferred fixture or suite verdict.
- No result establishes identity, DS-D1/DS-D8 authority, irreducibility,
  portability, pattern admission, activation, or promotion.

## Target Inventory

The refresh proposal covers `SPEC.md`, `ARCHITECTURE.md`,
`IMPLEMENTATION-LAYERING.md`, `IMPLEMENTATION-PLAN.md`, `WORK-PACK.md`,
`EXECUTION-PACK.md`, `INVOKE-TRANSPORT.md`, L2/L3 task and wave contracts, the
generation-2 dispatch, new adjudication contract/runtime/test paths, and final
audit inputs. No target artifact is edited in proposal-only mode.

## Coverage Result

Strict coverage passes. The source decision, immutable handles, evaluator
assumptions, artifact drift, write boundaries, validation surfaces, and next
owner are all explicit. No clarification decision remains open.
