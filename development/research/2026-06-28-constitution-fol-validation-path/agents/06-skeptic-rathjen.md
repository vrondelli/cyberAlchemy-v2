---
agent_name: "Rathjen, Michael"
role: skeptic
gate: definitional-soundness
dispatch_id: 2026-06-28-constitution-fol-validation-path
date: 2026-06-28
label: S3-definitional-soundness
status: complete
angle: "does 'FOL-validate the constitution' collapse to the per-rule deterministic validators already specced, re-skinned as theorem-proving? residue must be the cross-rule consistency/entailment/model-checking layer or it is a relabel"
verifies:
  - domainspec-lean-formalization/lean-engineer/AgentPermissionKernel.lean (Satisfies :99–103; decidePolicy :119–122; decidePolicy_sound :160–164 — independent def, theorem not rfl)
  - domainspec-lean-formalization/lean-formalization/FunctorialResidueStructure.lean (count_blind_agrees :258–261)
  - cyberAlchemy-v2/validation/authority-kind-closure-validator-SPEC.md (C-1..C-3 presence lints; R-1 review-only)
---

# S3 — Rathjen: relabel vs residue, on proof-theoretic grounds

My gate is DEFINITIONAL-SOUNDNESS. I do not score labels (`⊨`, "theorem-prove the
constitution"); I score **derivation content**. The question is which parts of an
"FOL-constitution-validator" carry real proof content the per-rule validators we already
own/spec cannot produce, and which parts are the owned per-rule decision procedure wearing
a `⊨`/theorem costume. I verified the three load-bearing Lean facts in source before
relying on them (see frontmatter `verifies`) — they are real, not assumed.

## Relabel vs residue

I take the three-fibre split E3 established as the partition and apply the collapse-test to
each row. **A relabel-with-residue is not a kill** — where a layer is a relabel I say what
collapses to it; where it is residue I name the residue and the proof obligation that makes
it non-vacuous.

### Row 1 — per-rule / per-request `state ⊨ rule` (`∀ rule . r ⊨ rule`) — COLLAPSES to owned; RELABEL with no residue

**Collapses to:** `Satisfies` / `decidePolicy_sound` (`AgentPermissionKernel.lean`) for the
permission constitution; the C-1..C-3 presence lints (`closure-validator-SPEC`) for the
governance authority-kind layer.

Proof-theoretic reading. `Satisfies P r` is **already a first-order formula, verbatim** —
`(∀ L ∈ P, ¬ layerForbids L r) ∧ (∀ L ∈ P, layerPermits L r)`, with `layerForbids` an
`∃ rule ∈ L (…)` over a finite list (`:99–103, :91–96`). The atoms are decidable
(`rule.applies r : Req → Bool`). This is **bounded** quantification over finite relations:
∀/∃ here are finite conjunction/disjunction, so the formula is **quantifier-free up to
finite unfolding** — Σ⁰₀ / decidable. `decidePolicy_sound` (`:160–164`) is a genuine theorem
(I checked: `decidePolicy` is defined *independently* of `Satisfies`, the proof is a
`by_cases` derivation, **not `rfl`**), but what it proves is exactly that the decision
procedure agrees with this bounded formula for a **fixed `r`**.

So an "FOL-validator" that, on this row, formalizes `state ⊨ rule` as `⊨` and runs a solver
is **re-skinning a decision procedure we already own and already proved sound in Lean.**
The `⊨` costume adds *nothing*: the satisfaction relation is `Satisfies`, the theorem-prover
is `decidePolicy`, and the soundness theorem is `decidePolicy_sound`. Porting this to
Z3/Alloy/Datalog is the worst case — it recomputes an owned, machine-checked, single-trust-base
finite-relation check under a **second** trust base (E3's fork-with-negative-residue; the
kodamai collapse-test fires). **Verdict: relabel, no residue. Not build-worthy as "FOL".**

The closure-validator C-1..C-3 sit on this same row in the governance register: each is
`∀ artifact . presence-lint(artifact)` — a per-element universal sweep ("catch-all row
present", "kind in its home location", "no artifact in a non-enumerated location",
`SPEC:19–25`). Encoding these as `⊨`-checks is the same relabel: a presence lint is a
Σ⁰₀ predicate over the artifact set; calling it `state ⊨ C-1` adds no derivation content.

### Row 2 — cross-rule `∃ state . state ⊨ constitution`, consistency, `axiom ⊨ rule` — REAL RESIDUE (mostly); see the seam test below for the one sub-part that can collapse

**Real-residue-because:** the cross-rule objects require quantification over **rule-pairs**
or over **models**, which the per-rule sweep is *syntactically incapable of expressing* — not
merely "doesn't currently do." This is the proof-theoretic discriminator I was sent to apply,
and it is decisive.

- **Consistency / no-two-rules-contradict.** The per-rule validator's universal form is
  `∀ rule . lint(rule)` — it quantifies over rules **independently**, evaluating each in
  isolation. "Rules `c₁` and `c₂` jointly contradict" is `¬∃ state . (state ⊨ c₁ ∧ state ⊨ c₂)`,
  equivalently `consistent(ruleset) ≡ ∃ state . ⋀ᵢ state ⊨ cᵢ`. This **quantifies over the
  conjunction of all rules at once and over the space of states** — a `∃`-over-models. A
  per-rule lint has no slot for the conjunction or for the existential over states; it cannot
  *state* the predicate, let alone decide it. This is the **`∀rule.P` vs `∃state.⋀P`** gap:
  not a re-skin, a strictly higher logical object.

- **R-1 is the cleanest proof-theoretic witness in the repo.** The SPEC's own R-1 is
  `∃ kind . governs(kind) ∧ ¬enumerated(kind)` (`SPEC:30–33`). C-1..C-3 are `∀x.P(x)` over
  the *enumerated* artifacts. R-1 existentially quantifies over the **space of possible kinds**
  — including kinds *not in the enumeration* — and pairs `governs` against the closure relation
  `enumerated`. The SPEC **declares this is why R-1 cannot be deterministic** ("stays review
  until the authority object schema stabilizes", `:31–33, :57–62`). That is the repo telling us,
  in its own words, that the quantifier-alternation `∀→∃·alternation` is the wall: the per-rule
  sweep structurally cannot express `∃ kind . governs ∧ ¬enumerated`. **This is residue, not
  relabel — and it is owned-as-open, never an owned-as-kill.**

- **`∃ state . state ⊨ whole-governance-constitution` (model-finding).** `decidePolicy`
  answers `r ⊨ P` for a **given** `r` (Row 1). It does **not** answer "does **any** repo-state
  satisfy the whole `STABLE-REPOSITORY-CONSTITUTION` ruleset" — that is finite-model-finding /
  SAT, `∃`-over-the-state-space. No owned file computes it (E1 §4: open for governance
  constitutions; `decidePolicy_flatten_meet` is the *template* but only for the permission
  object). Real residue.

**Hidden-relabel check (the trap I was told to watch):** do these "cross-rule" checks secretly
decompose into independent per-rule checks? For **consistency / contradiction / model-finding:
no.** Their defining feature is the **conjunction-then-existential** — `∃ state . ⋀ᵢ (…)` does
not distribute into `⋀ᵢ ∃ state . (…)` (different states could satisfy different conjuncts; the
contradiction is precisely the *absence of a common* state). So they cannot be decomposed into
independent per-rule checks; the interaction is genuine. **Not a hidden relabel.** The one place
a hidden relabel **can** occur is the axiom-seam — handled next, because it is the subtle case.

### The `axiom ⊨ rule` seam — REAL ONLY IF non-vacuous; this is the live collapse risk

This is the subtlest call and the one proof theory exists to make. The claim "FOL formalizes
that axiom `A` entails rule `C`" is **contentful iff the entailment derivation is non-trivial**,
and **vacuous (a hidden relabel) iff the rule is the axiom restated**, so that `A ⊨ C` holds by
`decide` on a syntactic match.

The discriminator, stated precisely:

- **Contentful (real residue):** `A` is a formula, `C` is a *distinct* formula, and the proof
  `A ⊢ C` uses **non-trivial inference** — instantiation of a quantifier, a case split, a
  combination of `A` with the ruleset's other commitments. The proof object **carries content**:
  removing it loses a fact not recoverable by inspection. Here `axiom ⊨ rule` is real proof
  content the per-rule validator cannot produce (the per-rule validator checks the rule's *gate
  fires*, never that the rule *follows from* its cited axiom).

- **Vacuous (relabel, no residue):** `C` IS `A` re-tokenized, so `A ⊢ C` is `A ⊢ A` up to
  renaming — `decide`/`rfl` confirms a syntactic identity. Then "FOL-validate axiom→rule" reduces
  to "we wrote the rule = the axiom and the checker confirms the strings match." **That is a
  hidden relabel: it wears entailment costume over a syntactic-equality lint** (which is itself a
  Row-1-class presence check). Calling it `⊨` does not buy proof content; the derivation is empty.

**Where the repo actually sits — verified against E1, and this is the load-bearing finding for
my gate:** the owned `AXIOMS.md`→`CONSTITUTION.md` "Derivation Chain" is an **enumerated prose
attribution** — "A1 governs C1, C6" — *not a derivation* (E1 §"Check-class 3"; the review doc
itself says the chain is "a default pattern, not a law"). There is **no formal language in which
A1 is a formula and C1 is a theorem**. So **today the axiom→rule link is neither contentful nor
vacuous in proof-theoretic terms — it is not yet a logical object at all.** The collapse risk is
therefore *prospective*: when someone formalizes it, the seam is real residue **iff** they author
`A` and `C` as **independent formulas with a non-`rfl` entailment proof** (like `decidePolicy_sound`
is non-`rfl`), and it collapses to a relabel **iff** they encode `C` as a restatement of `A` and
let `decide` confirm the match. **The honest verdict: the axiom-seam is potential residue whose
realness is contingent on the encoding being non-vacuous — and it is the one part of Row 2 most
exposed to a hidden relabel.** It must be witnessed (G2/Gödel), not asserted.

## What survives

Stated as `claim ≤ proof`, per row, with the proof obligation that keeps each honest:

1. **Row 1 (`∀ rule . r ⊨ rule`) — does NOT survive as FOL contribution. Relabel, no residue.**
   It collapses to owned: `Satisfies`/`decidePolicy_sound` (permission constitution, machine-checked)
   and the C-1..C-3 presence lints (governance, specced). An external `⊨`/solver port here is the
   worst case — a second trust base recomputing an owned single-trust-base check. *Not build-worthy
   as "FOL-validate the constitution."*

2. **Row 2 cross-rule consistency / contradiction / `∃ state . state ⊨ constitution` — SURVIVES as
   real residue.** Proof-theoretic ground: the predicate is `∃ state . ⋀ᵢ state ⊨ cᵢ` (and its
   negation for contradiction), which **does not distribute** into independent per-rule checks, so
   it is a strictly higher logical object the `∀ rule . lint` sweep cannot express. R-1
   (`∃ kind . governs ∧ ¬enumerated`, SPEC-declared not-deterministic) is the cleanest owned witness
   that this quantifier-alternation is the wall. **This is the genuine open residue — open, not owned;
   build-from-owned, never a kill.** Non-vacuity obligation discharged in principle by the
   non-distributivity argument; the concrete witness on one real cav2 rule-pair is G2/Gödel's job.

3. **The `axiom ⊨ rule` seam — SURVIVES CONDITIONALLY.** Real proof content **iff** the entailment
   is non-vacuous (`A`, `C` distinct formulas, non-`rfl` derivation carrying content). Collapses to a
   relabel **iff** `C` is `A` restated and `decide` confirms a syntactic match. Today it is **prose
   attribution, not yet a logical object**, so its realness is undetermined and entirely contingent
   on the encoding. This is the subtlest collapse risk and must be witnessed, not labelled.

4. **Row 3 (residue/behavior gluing) — out of scope for FOL by theorem, so no relabel risk here.**
   `count_blind_agrees` (`FunctorialResidueStructure.lean:258–261`, verified: `g(Xmerge.obj) =
   g(Xsep.obj)` for any `g` factoring through fibers) **proves** the Boolean/cardinality fibre — the
   FOL/Datalog register — is **blind** to the merge/separate distinction. FOL cannot *render* this
   layer, so the question "is FOL here a relabel" does not even arise. The categorical residue spine
   is untouched by, and does not subsume, the Row-2 FOL complement.

**Gate verdict (DEFINITIONAL-SOUNDNESS): NOT a kill.** "FOL-validate the constitution" is a
**relabel on Row 1** (collapses to the owned per-rule decision procedure / presence lints) and **real
cross-rule residue on Row 2** (consistency / contradiction / model-finding — `∃state.⋀ᵢ`, non-
distributive, structurally beyond the per-rule sweep, owned-as-open via R-1). The **`axiom ⊨ rule`
entailment is contentful only if non-vacuous** and is today prose-not-logic, so it is the live
collapse risk that the witness must adjudicate. The headline must say: **Row-1 use = relabel (collapse
to owned); Row-2 use = build-from-owned with real residue; axiom-seam = real iff the entailment proof
is non-`rfl`/non-tautological.**
