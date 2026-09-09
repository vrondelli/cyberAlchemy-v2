# S01 — Context Builder evidence baseline

**Stage:** Context Builder · **capability:** context-builder · **status:** pass

## The decision (from the accepted FOL dispatch)

The 2026-06-28 FOL constitution-validation dispatch (accepted by Bourbaki) resolved that formal
validation of cav2 constitutions is a **build-from-owned complement bounded to Row 2** (cross-rule
consistency / whole-constitution satisfiability `∃state.⋀ᵢ`). It left exactly one decision open
([findings.md](../../../research/2026-06-28-constitution-fol-validation-path/findings.md) §5b/§5d):

> "Even Row 2 should first be weighed against doing the finite-model search **in Lean** (single trust
> base) before reaching for an external solver."

## The three options (concrete trust bases)

| Opt | Engine | Trust base | Source cite |
|---|---|---|---|
| A | Lean-native bounded finite-model / `decide` | single (kernel already Lean) | findings §5d, §5b ("weigh doing the finite-model search in Lean"); template `decidePolicy_flatten_meet` |
| B | Cedar + Datalog (FORGE/PCAS) | Cedar's verified core is itself Lean → shares trust base | findings Row-2a row; Cedar arXiv 2403.04651; FORGE/PCAS arXiv 2602.16708 |
| C | Alloy/Kodkod or Z3 | separate SAT/SMT | findings Row-2b row ("Alloy/Kodkod (bounded SAT), Z3 on EPR/finite") |

## The Row-2 obligation + the discriminating fixture

- **Obligation:** decide `∃ state . ⋀ᵢ (state ⊨ cᵢ)` (whole-constitution satisfiability) and cross-rule
  consistency — the predicate the per-rule validator provably cannot state (findings §4).
- **Gödel witness (the toy-game fixture):** three CAV2-C nodes joined by a `governs` cycle
  `C2 → C13 → C4 → C2`, each individually clean for C-1..C-3 (unary `(kind, location)` lints). The
  cross-rule check `reach(X,X)` finds the cycle; the per-rule validator returns ALL-PASS. CAV2-C13
  ("Value-Cycle Edge Guard") already mandates this acyclicity. Source: findings §4; validator SPEC
  `cyberAlchemy-v2/validation/authority-kind-closure-validator-SPEC.md`; `STABLE-REPOSITORY-CONSTITUTION.md` §CAV2-C13.

## Decisive technical axis (to be tested, not assumed)

Acyclicity = transitive closure (`reach`), a **recursive** predicate. Engines differ on whether they can
express it: Cedar policies generally cannot (no recursion); Datalog and Alloy can natively (Alloy `^r`);
Lean can define it inductively + `decide` on a bounded graph. This is the toy-game's job to settle.

## Owner boundaries

Read-only authority inputs: the FOL findings, the validator SPEC, CAV2-C13, the cited Lean files. Writes:
this run folder only. Build of the solver: deferred to a Task Session next-route.
