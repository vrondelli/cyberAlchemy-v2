---
agent_name: "Quine, Willard Van Orman"
role: skeptic
gate: precedent
label: S1-ownership-attribution
dispatch_id: 2026-06-28-constitution-fol-validation-path
methodology: ownership attribution — "no entity without identity"; tightest-owner sweep
verification: "Lean symbols grep-confirmed (sorry-free, #print axioms); Cedar Lean-verification + FORGE/PCAS arXiv 2602.16708 verified via web"
---

# S1 — Ownership attribution: who owns what in the FOL-constitution-validation residue

**Gate = PRECEDENT/ownership.** No terminal kill is mine to emit. My job: for each part of the proposed
validation, find the tightest owner. A found owner relabels a candidate `build-from-owned` (cite + deploy),
NOT a kill. The only genuine residue is what survives the sweep with no owner — and I must say what search
falsifies even that.

"No entity without identity" — so I refuse to credit any part as "novel" until I have named the owner that
would force it to be derivative, and failed to find one.

## Verification done first (no attribution on trust)

- **owned-by-us Lean symbols — CONFIRMED present, sorry-free, axiom-checked.**
  `grep` over `domainspec-lean-formalization/lean-engineer/AgentPermissionKernel*.lean`:
  - `Satisfies` is a real FOL formula: `(∀ L ∈ P, ¬ layerForbids L r) ∧ (∀ L ∈ P, layerPermits L r)` —
    quantifiers over a finite layer list, `∃ rule ∈ L` inside each `layer{Forbids,Permits}` predicate
    (`AgentPermissionKernel.lean:92–103`). This is Tarskian satisfaction on a finite model.
  - `decidePolicy_sound` (`:162`) and its sound+complete parent `decidePolicy_allow_iff` (`:137`) exist;
    `deny_precedence` (`:170`), `decidePolicy_append_allow` (`AgentPermissionKernelComposition.lean:51`),
    `decidePolicy_flatten_meet` (`AgentPermissionKernelAlgebra.lean:98`) all exist.
  - `grep -c sorry` = **0** across the three files; each theorem carries a `#print axioms` line. The proofs
    are genuine, not stubs.
  - Bonus owned asset relevant to Row 2: `layered_not_flattenable` (`:202`) is a *machine-checked
    non-equivalence* between our layered semantics and Cedar's single-set `∃` semantics — i.e., we already
    own a cross-semantics *distinguishing* theorem, the Row-2 register, in Lean.
- **Cedar Lean-verification — CONFIRMED.** AWS Cedar's authorization engine + validator are modeled and
  proved (correctness, sound slicing, validation soundness) in **Lean**, differentially tested against the
  Rust impl. Cedar Analysis adds a **symbolic compiler to SMT** giving a **decidable, sound, and complete**
  encoding of policy semantics (quantifier-free, ground, finite domains, decidable theories). Source: AWS
  Open Source blog "Introducing Cedar Analysis"; arXiv 2403.04651; lean-lang.org/use-cases/cedar.
- **FORGE / PCAS (arXiv 2602.16708) — CONFIRMED, with the seam intact.** WebFetch of the abstract:
  Datalog-derived policy language "admits tractable static analyses for **contradiction, redundancy,
  subsumption, and conditional reachability**." It is NL-policy → Datalog → cross-rule static defect
  analysis — the end-to-end isomorph E2 named. The fetch also confirms the **anti-over-crediting catch**:
  "**No mention of axioms entailing or justifying policy rules.** The framework treats policies as
  specifications written directly in Datalog rather than deriving them from underlying axioms." The seam
  is real in the field too — not just in our repo.

## Ownership table

| Part | Tightest owner (cite) | Class | Use-mode |
|---|---|---|---|
| **Row 1 — per-rule `r ⊨ rule`** (one state satisfies one rule) | `AgentPermissionKernel.Satisfies` (FOL formula, `AgentPermissionKernel.lean:102`) + `decidePolicy_sound` / `decidePolicy_allow_iff` sound-complete decider (`:137,:162`), sorry-free | owned-by-us | **already-deployed** (in Lean, for the permission constitution) |
| Row 1 — *classical floor underneath it* | Tarskian satisfaction `M ⊨ φ` over a finite model; decidability of a quantifier-free / bounded-quantifier formula over a finite domain | owned-by-classical | already-deployed (our Lean is one instance of it) |
| **Row 2a — cross-rule consistency / contradiction / shadowing / redundancy / equivalence** | **Cedar + Cedar Analysis** (Lean-verified engine; SMT symbolic compiler — *decidable, sound, complete*; arXiv 2403.04651) **and** **FORGE/PCAS Datalog⁻** (contradiction/redundancy/subsumption/reachability, *decidable on the non-recursive fragment*; arXiv 2602.16708). For the *permission* constitution specifically: `deny_precedence`, `decidePolicy_append_allow`, `decidePolicy_flatten_meet`, `layered_not_flattenable` (owned-by-us, Lean) | owned-by-field (general) + owned-by-us (permission instance) | **build-from-owned** (encode our governance rules into Cedar/Datalog and run their deciders) |
| **Row 2b — `∃ state . state ⊨ whole-constitution`** (satisfiability of the whole ruleset) | **Classical: FOL/EPR satisfiability + finite-model / bounded model-checking.** Tool owners: **Alloy/Kodkod** (bounded SAT — *decidable by construction at a bound*), **Cedar→SMT** UNSAT-check (decidable), **Z3** (semi-decidable raw, decidable on EPR/finite). FORGE abstract does *not* claim whole-policy satisfiability — so Cedar/Alloy/SMT are the owners, not FORGE. | owned-by-field + owned-by-classical | **build-from-owned** (bound the domain → Alloy/SMT decides it) |
| **The seam — `axiom ⊨ rule` (does an underlying axiom force its constitution rule)** | **As a *checking* problem: owned-by-classical — it is ordinary FOL entailment `Γ ⊢ φ`, owned by any sound prover** (Lean/Coq for proof-theoretic `⊢`; Z3/Vampire for `Γ ⊨ φ` over a decidable fragment). **As an *encoding/derivation* problem for OUR governance axioms (A1–A6): precedent-thin** — no field policy tool (Cedar, FORGE, Alloy, OWL) has a native slot for an `underlying-axiom` field that *derives* the rule; our A1–A6 are NL harm-evidence statements, not formal predicates, so today there is no formula `A1` and no theorem `C1` derived from it (E1: `01-explorer-wisnesky.md:83`; E2: `02-explorer-tarski.md:97`; FORGE abstract confirms field has no slot). | checking → owned-by-classical · encoding for A1–A6 → precedent-thin | **build-from-owned for the *checking*; the residue is the *encoding* of A1–A6 into formulae, not the entailment machinery** |

## Honest read

### Row 2 — what is build-from-owned, named owner

**Row 2 is build-from-owned, not unowned. There is no novel "cross-rule validator" to invent.**

- **Cross-rule defect detection** (contradiction / shadowing / redundancy / subsumption / equivalence) is
  *doubly owned*: by **Cedar Analysis** (Lean-verified, SMT-backed, decidable/sound/complete) and by
  **FORGE/PCAS** (Datalog⁻, decidable on its non-recursive fragment, *the published end-to-end NL→cross-rule
  blueprint*). For the **permission constitution** it is additionally *already-deployed in our own Lean*
  (`deny_precedence`, `decidePolicy_append_allow`, `decidePolicy_flatten_meet`, plus the
  `layered_not_flattenable` non-equivalence witness). Use-mode: **encode our governance rules into one of
  these deciders and run it.** The residue here is *the encoding of our specific governance constitutions*,
  never the checking.
- **`∃ state . state ⊨ whole-constitution`** (whole-ruleset satisfiability) is owned by **classical
  finite-model / bounded model-checking** and operationalized by **Alloy/Kodkod, Cedar→SMT, Z3 on a
  decidable fragment**. Note for the record: **FORGE does not own this** — its abstract claims per-property
  static analyses, not whole-policy satisfiability. So the owner to cite is Alloy/SMT, not FORGE. Use-mode:
  **bound the domain, hand it to Alloy/SMT.** Build-from-owned.

The risk I am guarding against — calling Row 2 "net-new residue" — is **falsified**. E1's own
`01-explorer-wisnesky.md:118,128` calls the governance side "genuinely open / net-new residue," but that
is true only in the **build-state** sense (we have not *built* the governance instance), not the
**ownership** sense. The math and the tools are owned. Saying "FOL cross-rule is net-new" would be
inflation; the precise statement is: *the governance-constitution instance is unbuilt, over fully owned
machinery.* Build-state ≠ precedent-state — do not let "we haven't built it" leak into "no one owns it."

### The axiom⊨rule seam — be ruthless: where is it owned, where is it thin

This is the one place over-claiming "novel" is a live risk, so I split it cleanly into **checking** vs
**encoding**:

- **The *checking* is owned-by-classical and not thin at all.** "Does axiom-set `Γ` entail rule `φ`" is
  literally FOL entailment `Γ ⊢ φ` (proof-theoretic) / `Γ ⊨ φ` (model-theoretic). Every sound prover owns
  it: Lean/Coq for the `⊢` side, Z3/Vampire for the `⊨` side over a decidable fragment. There is **no novel
  entailment mechanism to invent.** Anyone who frames "axiom⊨rule checking" as the open prize is
  over-claiming — it collapses to owned proof theory. **Collapse-test for the seam:** *if A1–A6 were already
  written as formulae, the seam would reduce to a one-line `Γ ⊢ φ` call to an owned prover and the open
  contribution would be zero.* That test is exactly what keeps the seam honest.

- **The *encoding* — turning our governance axioms A1–A6 into formulae from which the rules are derived —
  is precedent-thin, and this is the only genuinely thin residue in the whole decomposition.** What
  falsifies "unowned" and what survives it:
  - *Falsifies (so NOT residue):* the entailment relation, the prover, the decidability story, and even the
    *pattern* of axiom→rule derivation chains (model-theory and any DL/OWL `TBox ⊨ assertion` setup own the
    shape). If our A1–A6 were predicates, this is solved.
  - *Survives (so IS the residue):* **no field policy tool carries a native `underlying-axiom` slot that
    derives a rule** (verified: FORGE abstract — "treats policies as written directly in Datalog rather than
    deriving them from underlying axioms"; Cedar's model is principal/action/resource/context with no axiom
    layer; E2:`97`). And **our A1–A6 are NL harm-evidence prose, not formulae** (E1:`83,113`). So the thin,
    genuinely-unowned thing is *the act of formalizing our six governance axioms as predicates and exhibiting
    `Aᵢ ⊢ Cⱼ`* for our actual constitution — a one-repo encoding task, not a new logic.

  This is also a `concept.axiom` node that the repo **already flagged DEFERRED** (`promotion-requests/
  2026-06-23-authority-object-schema-proposal.md:60`, gap G5/OQ-2) — i.e. it is a *known, owned-as-open*
  item, not a discovery. Per CLAUDE.md I surface it rather than silently "resolve" it.

**Net:** the seam is **owned as a checking problem (classical proof theory), precedent-thin as an
encoding problem for A1–A6 only.** The residue is the *encoding*, never the *checking*. Calling the
checking "novel" would be the inflation; the encoding is the real (small, one-repo) open work.

## One-line verdict

Row 1 = **already-deployed owned-by-us** (`Satisfies`/`decidePolicy_sound`, Lean, sorry-free); Row 2
(cross-rule + state⊨constitution) = **build-from-owned**, owners = **Cedar Analysis + FORGE/PCAS** (decidable,
Lean/Datalog) and **Alloy/SMT** for satisfiability, with the permission instance already in our Lean; the
**axiom⊨rule seam** = **owned-by-classical as *checking* (FOL entailment `Γ⊢φ`, any prover)** and **the
only genuinely precedent-thin residue is *encoding our A1–A6 governance axioms into formulae*** (a deferred
one-repo task, not a new logic) — **zero terminal kills.**
