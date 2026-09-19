# Invoke Plan — Convergence Work Pack (s9, non-executed)

No code. Sequences the two-loop convergence; honors the bootstrap order and the
acyclicity invariants.

## Loop 1 — well-formedness mutual dependency (closable NOW, no B-1)
| ID | Step | Realizes | Done when |
|----|------|----------|-----------|
| L1-1 | Freeze the schema envelope → `Spec`/`unresolvedRefs` mapping (partial OD-3) | D1-5 | one envelope maps to a `gradeFor`-ingestible Spec |
| L1-2 | Author 1 `expect:pass` + 1 `expect:fail` example (closes B-2) | D1-6 | both fixtures grade as expected |
| L1-3 | `K↑` binder v0: `gradeFor` report → `validations_run` receipt in the iteration doc | D2-5 | a validated transition carries a Lean receipt |
| L1-4 | `K↑` guard v0: verdict authorizes `gated→validated` (well-formedness only) | D2-1 | lifecycle advance requires a `pass` |
| L1-5 | Bootstrap test: run B0–B3 as a sequence fixture; assert F1–F3 are impossible | g-bootstrap | toy-game green |

**Loop 1 proves the convergence is real on well-formedness before obligations exist.**

## Loop 2 — obligation/content mutual dependency (the load-bearing half; gated on B-1)
| ID | Step | Realizes | Done when |
|----|------|----------|-----------|
| L2-1 | **Resolve B-1**: contract `obligation_id`s as addressable per-`Meta` predicates | D1-4 precondition | obligations are machine-resolvable |
| L2-2 | `K↓` compiler: contracts → `obligationsForMeta` (warn-only first, B4) + active Σ/profile | D1-3, D1-4, D1-7 | P3 sources its table from `K↓(contracts)`, status-blind (I-K↓-status-blind) |
| L2-3 | Make P3/P4 real (provenance-aware), per the prior run's Wave A | D2-6/7/8 | P3/P4 no longer stubs |
| L2-4 | Drift check `obligationsForMeta == K↓(contracts)`; conflicts → `gap` record | single-source-of-truth; R-obligation-conflict | no hand-maintained copy; conflicts halt graduation |
| L2-5 | Graduate obligations warn→fail as they mechanize (B4); promotion bound last, P8 human (B5) | D2-9 | Lean pass necessary; owner approval sufficient |

## Cross-cutting decisions (decision-gate)
- **OD-3**: collapse language `schema` kind and validator `Spec` into one dialect.
- **DEC-CAT-01** ratification (carried from prior run).

## Acyclicity invariants the build must enforce
I1 `K↓` ⊥ verdict/status · I2 `K↑` ⊥ obligation content · I3 warn-before-fail ·
I4 status never feeds σ-vocab/obligation content · I5 P8 stays human.

## Boundaries / stop
- Read-only here; L*/decision-gates are future task-session/decision-gate work.
- Stop/escalate if L2-1 shows obligations can't reduce to per-Meta predicates
  (R-bridge-feasibility) → Loop 2 is warn-only and that is recorded honestly.

## Recommended next route
`task-session` on **Loop 1** (proves convergence now), in parallel with a
`decision-gate` on OD-3 + DEC-CAT-01; then `task-session` on **L2-1 (B-1)**.
