# Invoke Define — Language ↔ Validator Convergence (s2)

## The intent, made precise
"Converge and be dependent one of another" = a **bidirectional** dependency where
neither system is complete without the other, yet the coupling does not deadlock.

- **D1 (language → validator):** the validator's *content* surface — per-Meta
  obligations (P3), and ideally the active `Meta`/`EdgeType`/profile vocabulary —
  is **derived from** DomainSpec language artifacts (contract `obligation_id`s,
  schema, taxonomy). The validator stops hand-maintaining what it checks.
- **D2 (validator → language):** the language's *validation authority* (§7) and
  lifecycle promotion (§8: `…→validated→promoted`) is **bound to** the Lean
  validator's verdict. A DomainSpec doc is not `validated`/promotable until Lean
  grades it `pass`. The validator becomes the language's machine checker.

Convergence = D1 ∧ D2 holding together as one system.

## The thing that must NOT happen (R-circularity)
If the language defines what Lean checks (D1) AND Lean decides whether the
language's own specs are valid (D2), a naive design is a **self-validating loop**:
a spec authorizes the obligations that then "validate" it. The design must keep
two authorities apart:
- **content authority** = the language (what obligations/concepts mean);
- **well-formedness authority** = the Lean validator (is this structurally /
  σ-typed / closed / acyclic correct).
D2 must bind only to *well-formedness*, never let a spec be the judge of its own
*content* correctness. Acyclic at the meta level even though bidirectional at the
system level.

## Bootstrap question (the toy-game target)
Chicken-and-egg: to derive the validator's obligation table you need a valid
language spec; to call a language spec `validated` you need the validator. What is
the **bootstrap order** that produces a first valid spec + a first validator run
with no circular dependency? (Candidate: the σ-model's vocabulary is seeded from
`domainspec-core` independently of any one spec; the first obligation table can be
empty/warn-only; promotion is the *last* thing to bind.)

## What a good convergence model must give
1. Genuine D1 and D2 (not just one direction — that was DEC-FIT-01's partial).
2. Acyclic-at-meta-level (separated authorities; a bootstrap order).
3. Single source of truth (no parallel hand-maintained vocab/obligation copies).
4. Recomposes the two-stage pipeline (lean-functor-validation) AND the language
   lifecycle (DESIGN-PACKAGE §8).

## Options (route menu, decided at s5)
shared-core-vocab · layered-dependency · full-merge · compiler-pair.

## Inputs
DEC-FIT-01 (partial-bridge + bridge condition), DEC-CAT-01 (presheaf-lan/fdm),
B-1 (`obligation_id`s), R-circularity / R-bridge-feasibility, DESIGN-PACKAGE §7/§8,
the σ-model (vocabulary from domainspec-core + paper tables).
