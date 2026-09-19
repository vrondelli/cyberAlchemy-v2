# Circularity Critique — Language ↔ Validator Convergence (s3, adversarial lane)

Role: `circularity-skeptic`. Target: find where making the DomainSpec language
and the Lean validator **mutually dependent** (D1 ∧ D2) becomes a **vicious
circle** or a **bootstrap deadlock**, and state the conditions under which the
mutual dependency stays healthy — bidirectional at the system level, **acyclic at
the meta level**.

- **D1** = validator derives obligations/vocabulary from the language.
- **D2** = language's validation authority (§7) + promotion (§8) binds to the
  validator's verdict.

The operator wants both. Prior run flagged **R-circularity** and
**R-bridge-feasibility** (both still open). This critique is the gate on whether
D1 ∧ D2 is safe.

---

## 1. The self-validation loop — where the vicious circle actually forms

The danger is not "the validator depends on the language" alone, nor "the language
depends on the validator" alone. It is the **single fused authority**: if the same
artifact that *authors* the obligations is then *graded as correct by those very
obligations*, the spec is the judge in its own trial. A spec that declares "my
obligation table is {O1}" and then "passes because it satisfies {O1}" has proven
nothing — it has defined its own passing condition. This is vacuous validation:
the verdict carries zero information.

The convergence risks this at exactly **one seam**: when D1 lets a *single spec*
inject the obligation predicates AND D2 lets that *same spec's* pass/promotion be
decided by those injected predicates, within one bootstrap layer, with no
independently-seeded floor. DEFINE.md §"thing that must NOT happen" names it;
REPAIR.md R-circularity keeps it open. The seam is real, not hypothetical.

**The prevention rule (MUST adopt verbatim):**

> **Split the authority.** Content authority = the **language** (what an
> obligation/concept *means*). Well-formedness authority = the **Lean validator**
> (is this artifact structurally σ-typed / schema-closed / acyclic / shape-correct).
> **D2 binds ONLY to well-formedness, NEVER to content-correctness.** A spec may
> never be the judge of its own *content* correctness; it may only be checked for
> *well-formedness* against a vocabulary it did not get to redefine for that check.

Concretely: Lean grades P1 (closure), P2 (σ-typing), P5 (acyclicity) — and P3 only
against an obligation table whose **schema/shape** is fixed by `domainspec-core`,
not against obligation *content* the spec-under-test authored. The language decides
what `obligation_id` X *means*; Lean decides whether the artifact is
*well-formed with respect to* X. These are different judges, and that difference is
what makes the verdict non-vacuous. This mirrors DESIGN-PACKAGE §7's two-authority
model (schema canonical for *accepted shape*; contract+owner canonical for
*obligation satisfied*) and the anti-collapse rule in REPAIR.md.

**Corollary (the meta-level acyclicity claim).** At the *system* level the edge is
bidirectional (language → validator content; validator → language authority). At
the *meta* level it is a DAG because the two edges land on **disjoint authorities**:
`content` and `well-formedness` are different nodes. A→B and B→A is a cycle only if
A and B are the same node. Separate the nodes and the cycle dissolves. This is the
whole trick; everything below is mechanics that protect it.

---

## 2. Bootstrap order — breaking the chicken-and-egg

The deadlock: to derive the obligation table you need a valid spec; to call a spec
validated you need the validator; to run the validator you need the table. A naive
"turn on D1 ∧ D2 at once" never starts. The break is to seed a floor **independent
of any spec-under-test**, then bind the directions in strict order, promotion last.

| Step | What is true / what is seeded | Why it breaks the cycle |
|------|-------------------------------|--------------------------|
| **B0. Seed vocabulary (independent)** | The σ-model vocabulary — 25 `Meta`, 29 `EdgeType`, 2 `Profile`, `sigmaValid` — is seeded from **`domainspec-core` + paper Tables 3/4**, NOT from any DomainSpec doc the validator will later grade. Lean compiles and `gradeFor` runs on the reference example (`ZagrMarketplace.lean`). | The validator's vocabulary has a source that is **not** a spec it must validate. Kills the worst circularity (Lean's vocab derived from a spec Lean must validate first). |
| **B1. Validator runs well-formedness-only** | P1, P2, P5 are **real**; P3, P4 are **stub/pass-unconditionally** (already true per README). No spec content authors any grading predicate yet. | A first valid verdict exists with zero dependence on language-authored obligations. D1 is not yet wired; no loop possible. |
| **B2. Empty / warn-only obligation table (D1 partial)** | The first language-derived obligation table is **empty or warn-only** (P3 emits WARN, never `fail`/`block`). `obligation_id`s (B-1) begin populating it, indexed per `Meta`/`EdgeType`. Single source of truth: table is *derived* from contract/schema/taxonomy, never hand-maintained in parallel. | D1 turns on without ever being able to *gate* a spec. A bug or a self-referential obligation can only WARN, so it cannot manufacture a false pass or a false block. The loop is *present but non-load-bearing*. |
| **B3. First spec reaches `validated`** | A spec reaches `lifecycle_state: validated` on the strength of **well-formedness pass + warn-only obligations**. `validated` is a *maturity* claim, not an *authority* claim (§8.1). | The maturity axis can advance before promotion is bound — §8.3 already says reaching `validated` does NOT make a contract canonical. |
| **B4. Harden obligations to fail-capable (D1 full)** | Once B-1 demonstrably mechanizes prose obligations into decidable per-`Meta` predicates (R-bridge-feasibility resolved for that obligation), individual obligations graduate warn → fail. Each graduation is per-obligation, evidence-gated, reversible. | D1 becomes load-bearing **incrementally**, only for obligations proven decidable. Un-mechanized obligations stay warn-only (the conditional bridge of DEC-FIT-01 / REPAIR.md). |
| **B5. Bind promotion LAST (D2 full)** | `promotion_state → promoted-by-owner` is bound to the validator verdict — and even then **Lean pass is necessary, not sufficient**. P1–P7 (incl. P3 well-formedness) are necessary; **P8 owner-approval stays human** and is the sufficient act. | Promotion — the only truly irreversible authority transfer — binds only after vocabulary, well-formedness, and fail-capable obligations are all stable. The most dangerous edge is the last one armed, and even armed it has a human in the loop. |

**One-line bootstrap order:** `seed σ-vocab from domainspec-core (B0) → run
well-formedness-only validator (B1) → derive empty/warn-only obligation table (B2)
→ let specs reach validated on well-formedness (B3) → graduate obligations
warn→fail as B-1 mechanizes (B4) → bind promotion last, Lean-necessary +
owner-sufficient (B5).`

---

## 3. Falsifiers — convergence designs that are DEAD on arrival

Any proposed convergence model that does ONE of the following is blocked at s5; do
not route it.

- **F1 — Promotion-before-vocabulary (full-merge with early P8 binding).** Binds D2
  (promotion/authority to Lean verdict) before B0/B2 are stable, i.e. before the
  vocabulary is independently seeded and the obligation table exists. The
  `full-merge` route is the prime suspect: fusing language and validator into one
  artifact tends to arm the promotion edge at the same instant it defines the
  obligations. DOA — it skips B0–B4 and re-creates the single-fused-authority seam.
- **F2 — Lean's vocabulary derived from a spec Lean must validate first.** Any
  design where `Meta`/`EdgeType`/`Profile`/`sigmaValid` is sourced from a
  DomainSpec doc that the validator is then asked to grade. This is the textbook
  vicious circle (the validator's notion of "valid" is defined by the thing it
  validates). B0 exists precisely to forbid this. DOA.
- **F3 — Content-correctness binding.** Any D2 that lets Lean's verdict assert
  *content correctness* ("the obligation is the right obligation") rather than
  *well-formedness* ("the artifact satisfies the declared obligation's shape").
  Violates the §1 prevention rule; the verdict becomes vacuous. DOA.
- **F4 — Auto-promotion (P8 collapsed into Lean pass).** Any design that makes
  `Lean = pass ⟹ promoted`. Lean pass is necessary, not sufficient; collapsing P8
  removes the governed human residue and lets a well-formed-but-wrong spec become
  canonical. DOA.
- **F5 — Parallel hand-maintained table (D1 in name only).** A "derivation" that is
  actually a hand-kept copy of obligations next to the language. Violates
  single-source-of-truth (DEC-FIT-01 bridge condition #2); the two drift, and "the
  language helps" becomes a permanent fiction. Not a vicious circle but a dead
  convergence — it never converges. Flag-to-block.

Routes that survive: **shared-core-vocab** and **layered-dependency** are the
natural fits — both honor B0 (shared/seeded vocab below the merge) and keep the
authority split. **compiler-pair** survives only if the two compilers do not
co-define each other's acceptance condition (else it degenerates to F2).

---

## 4. Change-propagation circularity — convergent or oscillating?

The feared loop: language changes an obligation → validator's table changes → which
specs `pass` changes → which specs are promotable changes → which (if promotion fed
back into the language's authoritative vocabulary) could change obligations again.

**Verdict: convergent, IF and only if the §1 split and the §5 damping invariants
hold; oscillating/divergent if promotion feeds back into vocabulary.**

The loop is a contraction (it damps) because of three brakes:

1. **The feedback edge is cut at the meta level.** Promotion changes
   `promotion_state` (authority), NOT the σ-vocabulary or obligation *content*.
   B5's "vocabulary seeded from `domainspec-core`, not from promoted specs" means
   step-5-of-the-loop does NOT loop back to step-1. The chain is a finite path
   (`obligation Δ → table Δ → pass-set Δ → promotable-set Δ`), not a cycle — there
   is no edge from "promotable-set" back to "obligation". A finite acyclic path
   terminates; it cannot oscillate.
2. **Determinism + monotone re-grade.** `gradeFor` is a pure function of `Spec`;
   re-running it on the same input gives the same verdict. An obligation change
   re-grades every spec exactly once to a fixed point — no chatter (depends on
   R-determinism, still open, which is why this is a MUST-HOLD below).
3. **Warn-before-fail graduation (B2/B4) damps amplitude.** A newly changed
   obligation enters warn-only first, so it cannot *flip* a spec's pass/block
   instantly; it surfaces, is reviewed, then graduates. Severity ramps, it does not
   step. This is the shock absorber.

**What makes it OSCILLATE (forbidden):** if promotion (or "validated" status) is
allowed to feed back and mutate the obligation vocabulary — promoting spec S
changes obligation O, which un-passes spec S, which de-promotes it, which reverts O.
That is a limit cycle. The damper is precisely **B0/B5**: vocabulary is upstream of
and immutable-to promotion. Keep that edge cut and the system is a DAG that
converges; reconnect it and it rings.

---

## 5. MUST-HOLD invariants — the acyclicity gate conditions

These are the gate conditions for "healthy mutual dependency." All must hold for an
s5 route to pass; any violation is a block.

- **I1 — Authority split.** Content authority = language; well-formedness authority
  = validator. D2 binds to well-formedness only. (§1 prevention rule.) *Acyclicity
  source.*
- **I2 — Independently-seeded vocabulary.** σ-model vocab comes from
  `domainspec-core` + paper tables, never from a spec the validator must grade.
  (B0; falsifier F2.) *Cuts the worst cycle.*
- **I3 — Single source of truth.** The obligation/σ table is **derived** from
  language artifacts, never hand-maintained in parallel. (DEC-FIT-01 cond. #2;
  falsifier F5.)
- **I4 — Warn-before-fail.** New/changed obligations enter warn-only; graduate to
  fail only when B-1 mechanization is demonstrated for that obligation.
  (B2/B4; R-bridge-feasibility.) *Damps change-propagation.*
- **I5 — Promotion bound last and feedback-cut.** Promotion is the last edge armed;
  promotion/`validated` status NEVER mutates the vocabulary or obligation content.
  (B5; §4 oscillation damper.) *Keeps the loop a DAG.*
- **I6 — P8 stays human (governed residue).** Lean pass is **necessary, not
  sufficient.** P1–P7 necessary; **P8 owner-approval is the sufficient act and
  stays a human route** — never auto-bound to a Lean `pass`. (§8.3; falsifier F4.)
- **I7 — Determinism.** `gradeFor` is a pure, terminating function of `Spec`;
  re-grade reaches a fixed point in one pass. (R-determinism, open — must be closed
  before D1 goes fail-capable.)

**Governed residue (intentionally NOT mechanized):** P8 owner-approval (I6);
content-correctness judgment (stays with the language/owner, never Lean); and any
obligation B-1 cannot reduce to a decidable per-`Meta` predicate (stays warn-only
under I4). These are features, not gaps — they are where human authority is
deliberately retained.

---

## 6. Prioritized findings

| # | Severity | Finding | Mitigation / invariant |
|---|----------|---------|------------------------|
| 1 | **block-if-violated** | Single-fused-authority seam: spec authors the obligations that grade it. | I1 authority split; verdict binds to well-formedness only. |
| 2 | **block-if-violated** | Lean vocabulary derived from a spec Lean must validate (F2). | I2 seed from domainspec-core; B0 first. |
| 3 | **block-if-violated** | Promotion bound before vocabulary/table stable (F1, full-merge). | I5 + bootstrap order; promotion is B5, last. |
| 4 | **block-if-violated** | Auto-promotion collapses P8 into Lean pass (F4). | I6 Lean necessary-not-sufficient; P8 human. |
| 5 | high | Change-propagation could oscillate if promotion feeds back into vocab. | I5 feedback-cut + I4 warn-before-fail damp. |
| 6 | high | R-bridge-feasibility: B-1 may not reduce all prose obligations to decidable predicates. | I4 conditional bridge; un-mechanized obligations stay warn-only. |
| 7 | medium | Parallel hand-maintained obligation table (F5) — convergence in name only. | I3 single source of truth (derived). |
| 8 | medium | R-determinism open — non-deterministic grading would make re-grade chatter. | I7; must close before D1 goes fail-capable. |
| 9 | low | OD-3 dialect fork (schema kind vs validator `Spec`) — two dialects re-introduce a parallel surface. | resolve OD-3 (one dialect) as DEC-FIT-01 cond. #3. |

---

## Verdict: **PASS (conditional)**

Mutual dependency (D1 ∧ D2) **is achievable safely** — bidirectional at the system
level, acyclic at the meta level — **provided I1–I7 hold and the bootstrap order
B0→B5 is followed with promotion bound last.** This is a *pass with binding
conditions*, not an unconditional pass: the conditions are the deliverable. Any s5
route that trips a falsifier (F1–F5) — most acutely **full-merge with early
promotion binding** — is **BLOCKED**. The healthy design is the authority split
plus the staged bootstrap; the operator gets the mutual dependency they want, with
the vicious circle cut at the `content`/`well-formedness` node boundary and the
oscillation cut at the `promotion-↛-vocabulary` boundary.

Residue to s5/s8: R-circularity moves from *open* to *conditioned* (gated by I1/I2);
R-bridge-feasibility stays *open* (gates I4 graduation); R-determinism must close
before D1 goes fail-capable; OD-3 must resolve to one dialect.
