---
to: Vlad
from: Victor (multi-agent audit, synthesized)
re: cyberAlchemy-v2 — AX-ONT-2 "orthogonality" and why the Lean transfer fails (a kill, framed as clarity)
date: 2026-06-21
status: resolved locally by RESOLUTION.md
---

# To Vlad — AX-ONT-2 orthogonality, and the bridge that isn't there

This came out of a conversation on the Lean side. The theorem repo has machinery for *orthogonality* — a KCBS spectral presheaf, cyclic Hilbert projectors where `⟪vᵢ,vⱼ⟫ = 0` — and the obvious question was whether that machinery could sharpen CAV2's AX-ONT-2 ("labels must be orthogonal", `I(Lᵢ;Lⱼ) = 0` for all pairs, `ontology-axioms.md:84`). It looked like a free win: we already have a verified contextuality-obstruction detector on one side, AX-ONT-2 wants orthogonal labels on the other, same word, surely they connect.

They don't. I ran a 7-agent dispatch to try to make the transfer survive — two explorers pushing from opposite angles, three skeptics each on a separate gate (precedent, non-vacuity, definitional soundness), an edge-layer probe, plus a writer and an auditor. The dispatch **killed** every version of the bridge. Four candidate transfers, all closed negative. So this memo is not "here's a tool you can use." It's the opposite: **here is exactly why this door is shut, and the one small thing worth keeping from having opened it.**

I want to be blunt that this is a kill result. Nothing below claims the Lean repo proves anything about CAV2. Everything below is owned literature — Isham–Butterfield 1998, Doering–Isham 2008, Abramsky–Brandenburger 2011, Abramsky's relational-DB contextuality 2013/14, Shannon 1948, Kochen–Specker 1967, Cabello–Estebaranz–García-Alcaine 1996. The contribution is the typed map of *why the transfer fails*, plus one watch-condition. I'm bringing it to you because the clarity is worth more than the bridge would have been, and because two of the findings change how AX-ONT-2 should be read.

---

## The two findings I think are load-bearing

### 1. "Orthogonality" is two different objects sharing one English word — and they point in opposite directions

This is the one that matters most, because it kills the bridge at the root and it costs nothing to verify.

AX-ONT-2's orthogonality is `I(Lᵢ;Lⱼ) = 0` (`ontology-axioms.md:84`). That is Shannon **statistical independence**. It is *commutative* — `I(Lᵢ;Lⱼ) = I(Lⱼ;Lᵢ)`, it lives over a flat product of distributions, and when it holds across all pairs you get `H(L₁,...,Lₙ) = Σ H(Lᵢ)` (`ontology-axioms.md:87`), maximum capacity, zero redundancy.

The Lean machinery's orthogonality is `⟪vᵢ,vⱼ⟫ = 0`, Hilbert inner-product zero on rays in a non-commutative algebra (`KCBSProjectorsReal.lean:140`, where `proj_comp_succ_eq_zero` makes adjacent projectors compose to zero). That non-commutativity is *what generates contextuality* in the first place.

Here's the part that flips the whole proposed transfer. A commutative C*-algebra's Gelfand spectrum **always** has a global section — it is the canonical *non-contextual* case. The Lean presheaf actually proves a global section exists on its side too (`KCBSSpectralPresheaf.lean:302`, `spectralPresheaf_admits_global_section`; the section is the constant `false`, `:283`). So:

- CAV2 `I = 0` ⟹ commutative ⟹ global label-consistency always achievable ⟹ **no obstruction, by construction**.
- Hilbert `⟪vᵢ,vⱼ⟫ = 0` on the cyclic-5 ⟹ the obstruction.

The two zeros mean opposite things. Maximal label-orthogonality in AX-ONT-2's sense is *maximal guarantee of consistency* — the furthest thing from contextuality, not an instance of it. A spectral-presheaf checker run against any `I=0`-satisfying schema would return "no obstruction" every single time, because that's the only answer the structure can give. It would be testing the wrong thing and reporting a pass it can't fail.

So the practical takeaway: **AX-ONT-2 is not a contextuality property and the Lean machinery cannot detect violations of it.** Treating them as connected is a pun on the word "orthogonal."

### 2. The knowledge lives at the edge layer, not the label layer

The reason AX-ONT-2 *demands* independent labels is to get a clean, non-redundant **basis** — that's good compression hygiene, it's `ΔH ≈ H(Lₙ₊₁)` for any admitted label (`ontology-axioms.md:93-96`). But a flat product of independent labels has, by definition, no coupling between its factors. No coupling means no cross-document constraint, which means **the label layer carries no relational knowledge.** That's not a bug in AX-ONT-2 — independence is the goal there — it's just a statement of what that layer is for.

The genuine structure, the place where constraints actually bind documents to each other, is the cross-document **edges** (`derives-from`, `contradicts`, `contextualizes`). That's where contextuality *could* live if it lived anywhere in CAV2. The edge-probe (Spivak's leg of the dispatch) went looking and found this:

In current CAV2, **no edge type is simultaneously (a) value-constraining and (b) non-acyclic.** The value-constraining edges are all in the acyclic set (`edge-acyclicity-constitution.md:40`: `derives-from, supersedes, governs, part-of, codified-as, operationalized-by, validates, creates, modifies`). The edges that are *allowed* to cycle — `contextualizes`, `contradicts` — carry "No functional dependency" by definition (`ontology-conventions.md:523`; `contradicts` is symmetric-but-toothless on values). The intersection {value-constraining} ∩ {non-acyclic} is **empty**.

That emptiness is not an accident — it is *exactly why AX-ONT-2 is safely non-contextual.* A contextuality obstruction needs a cycle of constraints that can't be simultaneously satisfied. CAV2 has cycles (in the cycle-permitted edges) and it has constraints (in the acyclic edges), but it never has both *in the same edge*, so no obstruction can form. The structure is clean for a real, statable reason.

---

## The one thing worth keeping — a watch-condition, not a theorem

From the whole exercise, exactly one residue survives the skeptics, and it's the structural fact from finding 2 stated as a guard:

**INVARIANT — no edge type in CAV2 may be simultaneously value-constraining and non-acyclic.**

I want to be precise about its type. This is **not** a proved theorem about CAV2, and it does not "detect" anything today. Its collapse-test is inline and honest: as long as every edge stays either *value-constraining-and-acyclic* or *non-acyclic-and-value-free*, the invariant is **vacuously satisfied and contributes zero**. It is a watch-condition. It becomes a live instrument only on the first edge that straddles both properties.

The framework it sits in is owned — Abramsky–Brandenburger 2011 (NJP 13, 113036) for the contextuality-from-gluing-failure structure, Abramsky's relational-DB contextuality (arXiv:1208.6416, arXiv:1406.7386) for the application to data schemas. We invented nothing. What we did was *locate* the one CAV2-local condition whose violation would make that owned machinery suddenly relevant.

Deploy it as a schema guard: if CAV2 ever adds an edge type `E` that both (a) constrains the value of a label field on an adjacent node AND (b) is absent from the acyclic set (`edge-acyclicity-constitution.md:40`), then this invariant breaks, and **that is the first moment AX-ONT-2 could become contextual** — at which point a contextuality-obstruction review becomes mandatory before merge. Until then it sits dormant and costs nothing.

That's the gift: not a tool, but a tripwire on the exact place where the non-contextuality you currently enjoy for free would stop being free.

---

## What I'm leaving open for you

Three calls only you should make.

### Is AX-ONT-2 compression-hygiene or a consistency guarantee?

The doc reads, in places, as if orthogonal labels buy you a *consistency* property. They don't — `I=0` buys you non-redundancy and maximum channel capacity (`ontology-axioms.md:87`), which is a compression property. These are different claims and the current text lets a reader conflate them. If the intent is compression hygiene, say so plainly and stop letting "orthogonality" carry an implied consistency promise it doesn't make. If the intent really is a consistency guarantee, then the guarantee comes from somewhere *other* than `I=0`, and the axiom should name that source.

### Should the residue-typing budget live on the edge layer, not the label layer?

Finding 2 says the coupling — and therefore any real cross-document constraint — is in the edges, not the labels. If CAV2-D18's residue-typing effort is currently aimed at label independence, I think it's aimed at the layer that carries no coupling. The edges are where the constraints, and therefore the typed residue, actually are. This is a budget-allocation call I can't make for you.

### Do you ever foresee a value-constraining cyclic edge?

The watch-condition is dormant exactly until one of these exists. If you already see a future edge type that both forces a label value *and* is allowed to cycle (some kind of negotiated/mutually-constraining relation), then the invariant is about to go live and it's worth wiring the guard now rather than after.

---

## Concrete edits, ordered by leverage

Each item: file → change → effect. The first two are cheap and high-value; the third is a steer, not a diff.

1. **`ontology-axioms.md` (AX-ONT-2, near `:84`)** — add one sentence: *"This orthogonality is Shannon statistical independence (commutative). It is the non-contextual case by construction — global label-consistency is always achievable — and it is a compression / non-redundancy property, not a knowledge-bearing or consistency-guaranteeing one."* *Effect:* stops any future reader (or future me) from reading AX-ONT-2 as a deep consistency guarantee it does not provide, and pre-empts exactly the failed bridge this memo documents.

2. **`edge-acyclicity-constitution.md` (after the acyclic-set definition, `:40`)** — add the watch-condition as an explicit guard: *"INVARIANT: no edge type may be simultaneously value-constraining and non-acyclic. Adding an edge type that constrains a label value AND is absent from the acyclic set above requires a contextuality-obstruction review before merge."* *Effect:* converts the implicit structural reason AX-ONT-2 is currently safe into an enforced, reviewable rule — turns a fact we happen to satisfy into one we'd notice losing.

3. **(steer, not a diff) residue-typing scope** — note in the CAV2-D18 working notes that coupling, and therefore typed residue, lives in the edge constraints, not in label independence. *Effect:* points the residue-typing effort at the layer that actually carries cross-document structure.

---

## What I deliberately did not recommend

For honesty about what was considered and cut:

- **Building a spectral-presheaf / KS checker for the labels.** It would test the wrong thing — on any `I=0`-satisfying schema it returns "no obstruction" by construction (finding 1). It cannot fail, so it cannot inform.
- **Claiming any Lean → CAV2 orthogonality bridge.** It's a pun across commutative (Shannon) and non-commutative (Hilbert) "orthogonality." The dispatch killed all four versions; I'm not going to dress a kill as a bridge.
- **Treating AX-ONT-2 as contextuality-adjacent.** It is the *opposite* of contextual — maximal label-orthogonality is maximal guarantee of a global section. Saying otherwise would be inflation in the wrong direction.

---

## One observation beyond the audit

The thing the exercise made visible that I didn't expect going in: **CAV2's current non-contextuality is structural and load-bearing, not incidental.** It holds for one precise reason — the empty intersection of {value-constraining} and {non-acyclic} edges — and that reason is the kind of thing a schema can quietly lose during evolution without anyone noticing, because no single edge addition looks like it crosses a line. Finding 2 isn't just "the bridge fails here"; it's a description of the one seam where the property you currently get for free is sitting. The watch-condition (edit 2) is cheap precisely because it costs nothing until that seam is touched — and at that point it's the only thing standing between you and an obstruction you didn't know you could have.

That's the part worth keeping from a dispatch whose headline result was a kill.

---

## Three sharpest questions, in order

1. **Is AX-ONT-2 meant as compression-hygiene or as a consistency guarantee?** The doc conflates them and they are genuinely different claims. (Determines whether edit 1 is a clarification or a correction.)
2. **Should the edge layer carry the residue-typing budget instead of the label layer?** The coupling is in the edges; the labels are independent by design. (Determines where CAV2-D18 effort should point.)
3. **Do you ever foresee a value-constraining cyclic edge?** If yes, the watch-condition goes live and edit 2 should be wired now rather than later. (Determines whether the guard is dormant insurance or near-term necessity.)

— V.
