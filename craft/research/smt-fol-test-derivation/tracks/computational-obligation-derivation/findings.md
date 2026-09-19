# Findings — Deriving Tests for Computational / Opaque-Formula Obligations

dispatch_id: `2026-06-21-computational-obligation-derivation` · type: research · final_approver: parent
Status: resolved · Scope: the general class of obligations whose `Formal` cell **names a computation** (function call / aggregate / policy) rather than a closed expression. Witnesses: `applyMakeupPolicy`, `sum(profit)`, policy functions.

## The question

Can the typed-derivation rules be extended past the `needs_formal` boundary to soundly, deterministically derive test assertions for opaque-computation obligations — beyond the weak `>=0` property?

## Verdict matrix (the vetted "good set")

| Approach | R1 (soundness) | R2 (engine + honesty) | Net verdict | Sound FOR |
| --- | --- | --- | --- | --- |
| **A2 closed-form** — FoldAst + PiecewiseAst + ArithExpr evaluator (engine evaluates the *spec* expression for EXPECTED, like the deal-split ternary) | borrow-from-owned | adopt-with-guard | **ADOPT (core)** | closed-form aggregates (`sum`/`count`/`min`/`max`) + piecewise-arithmetic policies in the QF-decidable fragment |
| A2 — Dafny/Why3/JML/SMT `get-model` oracle path | conditional (circular if postcondition transcribed) | **reject for this engine** (solver `unknown`/timeout is nondeterministic) | **REJECT in-derivation** (at most an out-of-band advisory that never changes emitted bytes) | n/a |
| **A1 metamorphic / property** — relations (monotonicity, conservation, additivity, permutation-invariance, …) | conditional (structural MRs ok; behavioral MRs are spec claims, not type-derivable) | adopt-with-guard (**co-emit, never replace**) | **ADOPT as an honest FLOOR** | `sum` algebraic MRs auto; behavioral MRs only when spec-confirmed |
| **A3 needs_formal** — opaque computation with no in-spec formula stays flagged | borrow-from-owned (Rice: re-impl is circular/undecidable) | adopt (strongest honesty) | **ADOPT as default framing** | genuinely algorithmic policies (iteration, lookup, external rates) |

**Convergent answer:** the gap is **partly closable, honestly** — (1) generalize the engine's *closed-form* AST so aggregates and piecewise-arithmetic policies derive exact values by construction (the cheapest, soundest win); (2) add metamorphic/property tests **only as a floor that co-exists with `needs_formal`**, never as a silent replacement; (3) keep `needs_formal` for the irreducible opaque remainder. The SMT/solver path stays **out of the deterministic derivation step** (breaks reproducibility). This is exactly the SMT/FOL tower's decidability line, now operationalized for computation.

## LIVE FINDING (P8 — R2 verified against the shipped code) — honesty regression

The engine **today** has a real defect this research surfaced:

- `bindings/financial-settlement.json` binds the `newMakeup >= 0` property to the **I1 `needs_formal`** obligation (`match: {rule_type:"needs-formal", id:"I1", base_rule_type:"invariant"}`).
- In `emit/tests.ts` `emitHybridTests`, a successful `emitProperty` hits `continue` and increments `properties` — the obligation is **NOT** counted as a `coverageGap`.
- **Effect:** a passing `>=0` relation test **silently overwrites the honest `needs_formal` value-gap and zeroes that gap from the count.** The `$comment` admitting it's weaker than a value oracle lives in JSON, invisible in the emitted suite.

This is the "sound-but-weak replaces honest" regression — **a metamorphic floor masquerading as full coverage.** It must be fixed: a property emitted for an UNCLASSIFIED/bare-call obligation must **co-emit** the property **AND** an `it.skip` + `coverage_gap: needs-formal-value` and still increment `coverageGaps`.

## Engine work items (feeds P4)

1. **Fix the honesty regression (highest priority):** metamorphic/property emits co-exist with `needs_formal`, never replace; the gap stays counted. (A1 guard / A3 default.)
2. **Closed-form AST extension:** `FoldAst` (associative reducers — generalizes `count`), `PiecewiseAst` (guarded arithmetic), `ArithExpr` evaluator (`+ − · / min max`, var/numeric leaves), pure + total. Guards: **rational/integer or fixed-decimal arithmetic only** (no native float accumulation — `0.1+0.2` drift breaks determinism); totalize div-by-zero/empty-fold → `unparsed`→coverage_gap; bounded fold length. → `sum(profit)` and a *closed-form-authored* `applyMakeupPolicy` derive exact values.
3. **Provenance guard:** a closed-form Formal cell must be parsed from the spec doc, not transcribed from the impl; keep the `isBareCall → needs_formal` gate (a bare `applyMakeupPolicy(...)` is NOT promotable — the author must write the piecewise formula to unlock value derivation).
4. **Structural-vs-semantic MR split:** auto-derive only algebraically-guaranteed MRs (`sum` permutation/additivity/empty/singleton); behavioral MRs (monotonicity, conservation) require explicit spec confirmation — never auto-asserted from types.
5. **SMT path:** not in the deterministic derivation step; optional out-of-band advisory only.

## Honest residual limits (claim ≤ proof, P10)

- Metamorphic relations are **necessary, not sufficient**: a uniform-wrong-constant policy satisfies monotonicity+conservation+scaling yet is wrong. The floor catches *shape* faults (operator swaps, conditional flips, fold bugs, boundaries — the E3 survivors), not *magnitude* faults. Surface this, don't bury it.
- Genuinely algorithmic policies have no tractable closed form (Rice) → irreducibly `needs_formal` / human fixture.
- "Closed-form authoring" relocates work to the spec author — it's a real cost, not free derivation.

## Sources (verified by explorers)

- Barr, Harman, McMinn, Shahbaz, Yoo — *The Oracle Problem in Software Testing: A Survey*, IEEE TSE 2015 — https://dl.acm.org/doi/10.1109/TSE.2014.2372785 (oracle-source taxonomy).
- Segura et al. — *Metamorphic Testing: Challenges & Opportunities*, ACM CSUR 2018 — https://dl.acm.org/doi/10.1145/3143561 (MRs necessary-not-sufficient; MR selection is hard).
- Chen et al. — *Metamorphic Testing review* — https://www.cs.hku.hk/data/techreps/document/TR-2017-04.pdf
- Claessen & Hughes — *QuickCheck*, ICFP 2000 — https://www.cs.tufts.edu/~nr/cs257/archive/john-hughes/quick.pdf ; Hypothesis (JOSS 2019) — https://joss.theoj.org/papers/10.21105/joss.01891
- Dafny — https://dafny.org/latest/DafnyRef/DafnyRef ; Why3 — https://www.why3.org/ ; SMT-LIB — https://smt-lib.org/ ; KeY proof-based test-gen — https://formal.kastel.kit.edu/biblio/projects/key/chapter12.pdf
- McKeeman — *Differential Testing for Software*, 1998 — https://www.cs.swarthmore.edu/~bylvisa1/cs97/f13/Papers/DifferentialTestingForSoftware.pdf ; Rice's theorem — https://en.wikipedia.org/wiki/Rice%27s_theorem
- Banking metamorphic relations (IEEE IRI 2023) — https://www.cs.montana.edu/izurieta/pubs/IRI_2023.pdf

## Recommended next route

`task-session`: (1) fix the honesty regression (co-emit guard) — small, urgent; (2) implement the closed-form AST extension (FoldAst/PiecewiseAst/ArithExpr) + provenance guard; then re-run E3 to measure how much the derived arm catches up once `applyMakeupPolicy` is authored closed-form. Both feed the C2 coverage/trust question.
