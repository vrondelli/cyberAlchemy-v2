# Distill Repair — Bootstrap Toy-Game (s8)

Low-cost falsification of the convergence: can a **first valid spec + first
validator run** exist with **no circular dependency**? The failure to avoid
(`assessment_failure_reference`): a bootstrap deadlock where each side needs the
other first.

## The game (trace the bootstrap order B0–B5)
| Step | Action | Needs the other side? | Verdict |
|------|--------|----------------------|---------|
| B0 | Seed `Meta`/`EdgeType`/σ from `domainspec-core` + paper tables | **No** — independent of any spec | OK (exists today) |
| B1 | Run validator in well-formedness-only mode (P1/P2/P5; P3/P4 = pass-stub) | No | OK (exists today) |
| B2 | `K↓` emits empty/warn-only `obligationsForMeta` | No (empty table is valid) | OK |
| B3 | Author one spec; `gradeFor` → `pass` on well-formedness; `K↑` advances it to `validated` | No (P3 vacuous) | OK — **first valid spec without obligations** |
| B4 | Resolve B-1; `K↓` emits real obligations warn→fail; specs re-graded | Uses language content, not status | OK iff I-K↓-status-blind |
| B5 | Bind promotion: Lean `pass` necessary + P8 owner approval | Human, last | OK |

## Result: PASS — no deadlock
The cycle opens at **B0** (vocabulary seeded independently) and at **B2** (empty
obligation table is a valid fixed point). A first spec reaches `validated` at B3
using only checks that exist today, before any obligation derivation. The mutual
dependency tightens monotonically B4→B5. **No step requires the other side to be
complete first.**

## What WOULD falsify (and is therefore forbidden)
- F1: deriving the σ-vocabulary from a spec that the validator must first validate
  (B0 violated) → deadlock.
- F2: binding promotion (B5) before vocabulary is seeded (full-merge with early
  promotion) → deadlock.
- F3: `K↓` reading lifecycle `status` (Attack 1) → re-closes the loop.

## Evidence link
This mirrors the prior run's `FaultInject.lean`-style harness: the toy-game is a
sequence fixture; each forbidden move (F1–F3) is the analogue of an injected
fault that must be rejected. Loop-1 edge set (D1-5/D1-6 → gradeFor → D2-5/D2-1) is
exactly B0–B3 and is runnable today.

## Residue carried
R-obligation-conflict (conflicts→gap record), R-bridge-feasibility (gates B4),
R-determinism (close before D1 fail-capable), OD-3 (one dialect).
