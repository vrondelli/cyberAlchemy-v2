---
node_type: research
title: Assurance Ladder & Skeptical-Buyer Due Diligence
run: 2026-06-08-business-explanation
stage: s4-research
role: due-diligence-skeptic
status: complete
date: 2026-06-08
---

# Assurance Ladder — Buyer's Technical Due Diligence

**Posture:** I am the buyer's technical advisor. I do not take the pitch at face
value. Below is what is *actually* proven, what is merely machine-checked, and what
is — and always will be — human judgment. Then every place a naive pitch would lie
to you, with the honest correction. The conclusion: the honest story still sells,
but only if the seller stops three specific overclaims.

Evidence base (read, not the marketing):
- `internal_tools/lean-code-validator/README.md` (the actual validator)
- `2026-06-08-clarity-language-fit/.../LANGUAGE-FIT-VERDICT.md` (DEC-FIT-01)
- `2026-06-08-language-validator-convergence/RESULT.md` (DEC-CONV-01)
- `2026-06-08-lean-functor-validation/RESULT.md` (Stage A/B status)
- `2026-06-08-business-explanation/.../s2-invoke-define/DEFINE.md` (the brief)

---

## 1. THE ASSURANCE LADDER

Three tiers. The strength of a claim is the tier it actually sits on — not the tier
the pitch puts it on.

### TIER 1 — PROVEN (mathematics; an actual theorem)

What is a real theorem, true by construction, that no input can violate:

- **σ-typing well-formedness (Theorem 1, `all_edges_well_typed`).** Every edge in a
  spec is type-correct *for its declared profile*, proved by induction in Lean 4.
  This is free "by construction": an ill-typed edge for the declared profile **cannot
  be built** — the data type refuses to hold it (`EdgeRow.wellTyped`). This is the
  one item on the ladder that is genuinely a proof, not a check.
- **Scope of the proof:** structural fidelity of the spec's edge graph to the
  σ-signature tables (paper Tables 3 & 4). It says the blueprint is *internally
  type-consistent*. It does **not** say the blueprint is correct, complete, or what
  you wanted.

That is the entire PROVEN tier today. One theorem. It is real, and it is narrow.

### TIER 2 — MACHINE-CHECKED (deterministic, reproducible — a check, not a proof)

Runs today as Lean `#eval` / grader output (`gradeFor → CodegenReadinessReport`),
reproducible via the standing command `lake env lean .../ZagrMarketplace.lean`:

- **P1 — schema closure (real).** Every dangling/unresolved reference in the spec is
  flagged as a fail. Catches: blueprint that points at things that don't exist.
- **P5 — acyclicity of the codegen-dependency subgraph (real).** Gray/black DFS over
  the dependency edges; flags cycles. Catches: a blueprint whose generation order is
  impossible (A needs B needs A). **Note honestly: this is a partial DFS check, not a
  proved acyclicity theorem.** It catches cycles it visits on the codegen subgraph;
  it is a deterministic check, not a universal guarantee about all graphs.
- **M6 witness (computable today, governs nothing).** Ambiguity witnesses are
  *computed* but currently drive no verdict — see Tier-2 limits below.

Properties of this tier: deterministic, reproducible, no human in the loop, no
Mathlib (self-contained, auditable). A pass here is **necessary, not sufficient**.

What is *claimed* for Tier 2 but is **not wired** (do not let a pitch count these):

- **P3 — per-meta obligation table: STUB.** Passes unconditionally today. The thing
  that would check "does the spec satisfy its business obligations" does not run yet.
- **P4 — M6 ambiguity grade via provenance: STUB.** Passes unconditionally today.
  Per-edge provenance is hardcoded `.declared`; the residue is computed but **governs
  nothing**.
- These two are the difference between "checks structure" (true today) and "governs
  fidelity/residue" (designed, not shipping).

### TIER 3 — HUMAN-JUDGED (never the machine — by design, permanently)

These are not gaps to be closed by more engineering. They are deliberately,
permanently human:

- **Intent capture (the "Intent Wall").** Whether the blueprint actually captures
  what the business wanted is human judgment. No theorem and no check reaches above
  this wall. ("Lan-faithful, not full" — the math models structure, never intent.)
- **Promotion sign-off (P8 — owner approval).** P1–P7 are *necessary* for promotion;
  **P8, a human owner's approval, is the sufficient act.** The machine can block; it
  cannot authorize. This is an invariant (I5: "P8 human").
- **Everything below the Claim B Wall.** The spec is *taken as given* by the
  validator. Whether the given spec is the right spec is not in scope for the math.
- **Conjectural / never asserted:** the Lan/η fidelity characterization and the open
  M6-graph theorem are conjectures. They are *not* claimed as proven, and a buyer
  should treat any pitch that asserts them as overclaiming.

---

## 2. THE OVERCLAIM LIST — what a salesperson might say, and the honest correction

| # | Naive pitch (DO NOT say) | Honest correction (DO say) |
|---|---|---|
| **O1** | "Mathematically proves your software is correct / bug-free." | Proves your code's **structure matches the blueprint**, and the blueprint is **internally type-consistent**. It does **not** prove the blueprint is what you wanted, nor that the code is bug-free. The biggest assurance — intent capture — is explicitly human (Intent Wall). |
| **O2** | "Two systems verify each other automatically, end to end." | The two-system convergence is **designed, not wired** (DEC-CONV-01). Today only **Loop 1** (well-formedness) is closable; the load-bearing **Loop 2** waits on the B-1 bridge. No runtime co-dependency exists yet. |
| **O3** | "Fully automated — no humans needed." | Human sign-off (P8) is a **permanent, deliberate** part of the design, not a missing feature. A machine pass is necessary; a person still authorizes promotion. Removing the human is not on the roadmap. |
| O4 | "It checks all your business rules / obligations." | The obligation checks (**P3, P4**) are **stubs that pass unconditionally today.** Real obligation checking needs the B-1 work (`obligation_id`s) to land first. |
| O5 | "The validator proves there are no dependency cycles." | P5 is a **deterministic DFS check** over the codegen subgraph, not a universal acyclicity *proof*. It reliably catches cycles in what it checks; call it a check, not a theorem. |
| O6 | "It proves your delivered code is a faithful translation of the spec." | The code→spec translator **`T` is net-new and largely unbuilt** (Stage B). `F` is a **partial, lax map — not a strict functor**; no `Functor.Full`, no isomorphism. "Fidelity" is not established. |
| O7 | "The DomainSpec language drives the verification." | Per DEC-FIT-01, the language is **incidental today** — the running checks use `domainspec-core` + paper tables, not the language. It becomes load-bearing **only after** the B-1 bridge. |
| O8 | "It uses Mathlib / industrial-grade formal libraries." | It is **self-contained Lean 4, no Mathlib** — a defensible choice (auditable, no heavy dependency), but do not dress it up as something it isn't. |
| O9 | "Governed residue / fidelity tracking is in the product." | The residue **witness is computable** but **governs nothing** (P4 stub, provenance hardcoded). Shipping the "governed residue" claim before P4 + per-edge provenance land is the named falsifier of the whole Stage-B story. |

**Top 3 to kill (these are the ones that turn an honest pitch into a fraudulent one):**
1. **O1** — "proves the software is correct/bug-free." It proves structure + consistency, not intent.
2. **O2** — "the two systems verify each other today." Designed, not wired.
3. **O3** — "fully automated, no humans." The human key (P8) is permanent by design.

---

## 3. CURRENT-STATE HONESTY — built today vs designed-not-wired

A buyer must not be told vaporware is shipping. The line:

**Exists and runs today (demonstrable in a due-diligence session):**
- σ-typing theorem (Tier 1), real and free.
- P1 closure + P5 acyclicity `#eval` checks (Tier 2), reproducible via the standing command.
- The Python emitter (`audit_richness.py`) that turns a spec dir into the gradeable Lean `Spec`.
- A reference example (`ZagrMarketplace`) and an adversarial fault harness (`FaultInject`: P1 fail, P5 fail, R_CF ok).
- **Loop 1** (well-formedness mutual loop) is **closable now** without B-1.

**Designed, decided, but NOT wired (roadmap — must be sold as roadmap):**
- **P3 / P4 obligation + ambiguity grading** — stubs that pass unconditionally.
- **Per-edge provenance** — hardcoded `.declared`; the parser does not track it yet.
- **The convergence / compiler-pair** (DEC-CONV-01) — designed; "no claim the systems co-depend at runtime today."
- **B-1 bridge** (`obligation_id`s) — open; the highest-leverage missing edge; unblocks 6 of 9 missing dependency edges and flips the language from incidental to load-bearing.
- **The code→spec translator `T`** — net-new, "the real work," only the *design* exists.
- **Loop 2** (load-bearing obligation dependency) — gated on B-1.

**Open / unresolved (honesty residue, not hidden):**
- OD-3 (single schema dialect), DEC-CAT-01 ratification, R-determinism, R-bridge-feasibility, R-obligation-conflict.

Status of the underlying runs themselves: the functor-validation run is a **flag**
(design produced, sequencing surfaced — not "done"); the convergence run is a
**pass** on *architecture*, explicitly **not** on a shipped runtime. Sell the
architecture as decided; sell the build as staged.

---

## 4. SKEPTICAL-BUYER FAQ

**Q1. "So is it bug-free? Does this prove my software has no bugs?"**
No, and anyone who tells you that is overselling. It proves one thing
mathematically: your blueprint is internally type-consistent. It then *checks*
(deterministically) that the delivered code's structure matches that blueprint, and
that the blueprint has no dangling references or impossible build cycles. Bugs that
live *inside* a correctly-shaped component, or a blueprint that faithfully encodes
the *wrong* requirement, are not caught here. What you get is the elimination of a
whole class of structural and consistency defects — by calculation, not review — plus
an honest, named boundary around everything else.

**Q2. "Isn't this just unit tests with extra mathematical steps?"**
No, and the difference is the point. Tests check *examples* — the cases you thought
to write. The σ-typing result is a *theorem*: it holds for **every** possible input,
because ill-typed structure cannot even be constructed. P1/P5 are deterministic
checks over the *whole* spec graph, not sampled cases. Where it *is* "just a check"
(P1, P5), we say so — we don't dress a check up as a proof. The value is coverage
that is total by construction for the one theorem, and exhaustive over the graph for
the checks, with zero flakiness and full reproducibility.

**Q3. "What happens if the spec — the blueprint — is wrong?"**
Then the system will faithfully check your code against a wrong blueprint, and
everything can pass. This is the single most important honesty point: the machine
**never** judges whether the blueprint captures your intent — that is the Intent
Wall, and it is permanently human. That is *why* there is a mandatory human sign-off
(P8). We are explicit that a green light means "consistent and structurally faithful,"
**not** "this is what you wanted." Treat the human key as a feature, not a gap.

**Q4. "What's actually built versus roadmap? Show me the line."**
Built and runnable today: the σ-typing theorem, the P1 closure check, the P5
acyclicity check, the emitter, the reference example, the adversarial fault harness,
and the first mutual loop on well-formedness. Designed-but-not-wired: the business
obligation checks (P3/P4 are stubs that pass unconditionally), per-edge provenance,
the code→spec translator, and the two-system convergence — all decided in
architecture, none shipping at runtime. The biggest single unbuilt item, B-1
(`obligation_id`s), is on the critical path for the business-rule checking. We will
not let you mistake the roadmap for the product.

**Q5. "Why Lean? Is this real verification or academic theater?"**
Lean 4 is a real proof assistant — the same class of tool used to formally verify
chip and aerospace designs. It is real in that the σ-typing theorem is machine-checked
by the Lean kernel, not asserted. It is *honest about its limits* in that we
deliberately use **no Mathlib** — it's self-contained, so a due-diligence engineer
can read and audit the whole thing without pulling in a massive dependency. The
"academic" risk is real for the *unbuilt* categorical layer (the Lan/M6-graph
theorem is an open conjecture) — so we don't claim it. What ships is engineering, not
a paper.

**Q6. "What can't it catch — what are the holes?"**
It cannot catch: a blueprint that is consistent but wrong (intent); business
obligations not being met (P3/P4 are stubs today); semantic bugs inside a
structurally-correct component; and — until the translator `T` is built — whether
delivered code is a faithful translation at all. It also makes no
isomorphism/"fidelity" claim: the map from code to spec is a partial, lax map with
named residue in both directions (code doing things the spec didn't ask for; spec
obligations the code didn't implement). We name the residue rather than claim zero.

**Q7. "You said two systems 'depend on each other.' Is that running today?"**
No. The mutual dependency is **designed** (DEC-CONV-01) and proven *safe* (acyclic at
the meta level, with a bootstrap order that avoids a chicken-and-egg deadlock — we
toy-gamed it). But there is no runtime co-dependency today. Loop 1 (well-formedness)
can demonstrate the pattern now; Loop 2 (the load-bearing business-obligation
dependency) is gated on the B-1 bridge. Designed and falsification-tested is real
progress — but it is not "shipping."

**Q8. "If a competitor just ran more tests, would they get the same assurance?"**
Partly, and that's the honest framing of the moat. The deterministic checks (P1/P5)
a disciplined team could approximate with tooling. What's harder to replicate is the
*by-construction* guarantee (you cannot even express an ill-typed spec) and the
explicit, governed assurance ladder that tells you exactly which tier each claim sits
on. The defensibility grows specifically as B-1 → P3/P4 → the translator land, which
is why the roadmap order matters. Today the defensibility is "honest, structured,
real-but-narrow," not "unbreachable."

---

## 5. VERDICT

**PASS — an honest pitch is still compelling, conditional on killing O1/O2/O3.**

Rationale:
- There is a genuine, kernel-checked theorem (σ-typing) — rare in commercial
  software. That alone is a credible, defensible anchor.
- The deterministic checks (P1, P5) are real, reproducible, and demonstrable in the
  room during due diligence. A buyer's advisor can run the standing command and see it.
- The honesty boundary is itself the differentiator: a vendor who hands you the
  assurance ladder and says "here is exactly what we prove, check, and leave to your
  people" is *more* trustworthy than one claiming "proves correctness." Sophisticated
  buyers reward this.
- The human key (P8) and the Intent Wall convert the system's limits into a
  liability story the buyer already believes ("of course a person still signs off").

**Conditions for PASS (these are blocking — the pitch becomes a misrepresentation
without them):**
1. Never claim "proves the software is correct/bug-free" (O1). Say "proves structure
   + consistency; intent stays human."
2. Never present the two-system convergence as running today (O2). It is designed,
   safe, and staged — Loop 1 now, Loop 2 after B-1.
3. Never claim "fully automated, no humans" (O3). The human sign-off is permanent by
   design.
4. Sell P3/P4 obligation checking, the translator `T`, and "governed residue" as
   **roadmap**, not product (O4, O6, O9).

If those four hold, the honest story is *more* compelling than the inflated one,
because it survives the due-diligence session that the inflated one would fail.
