# Invoke Design — Convergence Architecture (s6)

Full architecture: `COUPLING-ARCHITECTURE.md` (same folder). This is the design
summary the plan consumes.

## The converged system (compiler-pair, DEC-CONV-01)
```
                 K↓ (derive: obligation_ids→table, taxonomy→Σ)
   LANGUAGE  ───────────────────────────────────────────────▶  VALIDATOR
 (content authority)                                       (well-formedness authority)
        ▲                                                          │
        │            K↑ (verdict → lifecycle transition guard)     │
        └──────────────────────────────────────────────────────────┘
   pass→authorize gated→validated · warn→hold · fail→blocked · P8 stays human
```
Disjoint facts: `K↓` reads only authored content; `K↑` reads only the verdict.
Neither reads the other's output → acyclic at the meta level.

## Components
- **K↓ compiler** (peer of translator `T`): contracts → `obligationsForMeta` +
  active `Meta`/`EdgeType`/profile. Deterministic; emits the existing `Spec`
  inputs. Realizes D1 edges (incl. the B-1-gated obligation table).
- **K↑ binder**: `gradeFor` → `CodegenReadinessReport` → a lifecycle transition
  guard + a `validations_run` receipt recorded in the language's iteration doc.
  Realizes D2 edges.
- **Drift check**: `obligationsForMeta == K↓(contracts)`; every `validated`
  transition has a `gradeFor` receipt. Enforces single-source-of-truth.

## Two-loop rollout (from distill)
- Loop 1 (now, well-formedness): D1-5/D1-6 → gradeFor → D2-5 → D2-1.
- Loop 2 (after B-1, obligations): K↓ obligation table → P3/P4 real → D2 residue.

## Invariants (design-level)
1. `K↓` ⊥ verdict/status; `K↑` ⊥ obligation content.
2. D2 binds to well-formedness only; P8 owner-approval stays human (Lean pass
   necessary, not sufficient).
3. Obligations enter warn-before-fail (B4) so change-propagation converges.
4. Promotion/status never feeds back into σ-vocab or obligation content.

## Not done here
No compilers written; B-1 not resolved; OD-3 (single dialect) unratified. Designed,
not wired.
