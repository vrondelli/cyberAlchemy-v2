---
node_type: refinement-artifact
stage: s7-interrogation
role: residue-skeptic
lane: adversarial
round: 2
status: review
honesty_boundary: Craft PCRA — residue named/governed, never zero; no full-faithfulness
---

# Design Review — residue-skeptic (adversarial lane), round 2

Stage: s7 · Role: residue-skeptic · Lane: ADVERSARIAL
Target: **DEC-CAT-01** (`presheaf-lan` target framing, `fdm` operational core) and the
SCU in `s5-distill/DISTILL.md`.
Honesty boundary: Craft PCRA — residue is named, attributed, governed; **never zero**;
**no `Functor.Full`/faithful/isomorphism** claim.

Ground truth read directly from the Lean source (not from the decision prose):
`Sigma.lean` (`sigmaValid`), `Profiles.lean` (`isCodegenDependency`),
`Richness.lean` (`EdgeRow.wellTyped`, `EdgeProvenance`, `m6Witnesses`),
`Report.lean` (`gradeFor`, P1/P3/P4/P5).

**Verdict: PASS (provisional) with 3 REQUIRED guardrails (G1–G3) before Invoke Plan (s9).**
The decision does NOT smuggle the open theorem in as usable, does NOT assert `F` is a
functor, and explicitly pins the Kan/Lan/M6-graph theorem as an open conjecture
(hard constraint 1). It satisfies FIX-1..4 *at the framing level*. The PASS is conditional
because the decision's headline residue definition — "residue = Lan unit η failing to be
iso, witnessed computably **today** by `m6Witnesses`" (DECISION lines 24–25) — is **half
true and half drift**, and two fdm "decidability" claims need a sharper boundary line drawn
where `#eval` stops being a proof. None of these are blockers; they are contract-tightening.

---

## A. Does `presheaf-lan` smuggle in an unproven theorem as if usable?

**No — the decision treats it as conjecture, correctly.** Hard constraint 1 states the
Kan/`Lan`/M6-graph theorem is "an **OPEN CONJECTURE** — never asserted proven", and the
recomposition ladder (DISTILL lines 39–43) places "presheaf lift + Lan unit η … → open
M6-graph theorem" as the *last* step, gated, not built now. The build-now layer is `fdm`
only. This is the honest posture and it holds.

**One residual drift to fence (G1).** The decision phrases the *residue definition itself*
in Lan vocabulary: "Residue is defined as the **Lan unit `η` failing to be iso**, witnessed
computably **today** by `m6Witnesses`" (DECISION lines 24–25). This conflates two layers:

- The **Lan-unit-not-iso** characterization of residue is a statement *about* the open
  presheaf-lan theory. It is only meaningful once the Lan exists as a constructed object and
  η is defined. **That object does not exist today.** So "residue *is* η-not-iso" is a
  conjecture-level definition, not an operational one.
- What `m6Witnesses` computes today is a **finite list of ambiguity triples** over `S.edges`
  (two distinct sources, same edge type, same non-Entity target, no disambiguating relation —
  `Richness.lean` lines 85–96). That list is real and `#eval`-able now. But it is *not* a
  witness "that η fails to be iso" — there is no η to witness against. It is, at most, a
  candidate operational *proxy* for one specific kind of residue (M6 codegen ambiguity).

**G1 (REQUIRED):** Split the residue definition into two clearly-staged statements:
(1) **operational, today:** "residue is named by a finite set of computable witnesses —
`m6Witnesses` (M6 ambiguity), P1 unresolved refs, P5 cycles, and (once real) P3/P4 findings";
(2) **conjectural, deferred:** "*under the presheaf-lan roadmap* these witnesses are
*conjectured* to correspond to η failing to be iso." Never write "residue = η-not-iso,
witnessed today" as a single sentence — that sentence imports the open theorem's vocabulary
into a today-claim. This is the same drift class as round-1 F4.

---

## B. Is "residue = η not iso" computable TODAY, or theorem-dependent?

**Split answer — this is the load-bearing finding.**

| Thing | Computable today? | Evidence |
|---|---|---|
| `m6Witnesses` returns a finite ambiguity list | **YES, today** | `Richness.lean` 85–96 — pure total function, `#eval`-able |
| That list is *graded* (turned into pass/warn/fail) | **NO — P4 is a `pass` stub** | `Report.lean` 80–81: `gradeP4Ambiguity _ := { grade := .pass }` |
| Provenance split (T-mapping vs codegen residue) | **NO — not real today** | `EdgeProvenance` type exists (`Richness.lean` 17–21) but emitter hardcodes `.declared` (README 46, 76) |
| "η fails to be iso" as a *theorem-level* characterization | **NO — theorem-dependent** | open M6-graph conjecture; no Lan/η object constructed |

So the honest statement is: **the M6-ambiguity *witness* is computable today; the *grade* is
not (P4 is a stub); the *attribution* is not (provenance is uniform `.declared`); and the
*η-not-iso characterization* is theorem-dependent.** The decision's "witnessed computably
today by `m6Witnesses`" is true *only* for the bare witness-list, and is misleading if read
as "residue is graded/attributed today." **m6Witnesses computes a candidate today; it
governs nothing today** until P4 ships and consumes it.

**G2 (REQUIRED):** Everywhere Stage B summarizes residue, state the three-part status
explicitly: *witness real (m6Witnesses) · grade stubbed (P4 pass) · attribution absent
(provenance uniform)*. Forbid any phrasing that implies residue is **attributed** to
codegen-vs-T today — this is round-1 FIX-3 / claim #4, and it is still unmet at the
implementation level (only the *type* exists). Keep R-determinism OPEN.

---

## C. Are the `fdm` "functor obligations" decidable without Mathlib?

**Partly — and the decision over-rounds "decidable" up from the real picture.** Walking the
actual obligations against the source:

1. **σ-typing (P2 / Theorem 1)** — decidable and in fact *free*. `sigmaValid` is a finite
   `Bool`-valued match (`Sigma.lean` 56–84); `EdgeRow.wellTyped` is a compile-time proof
   obligation, so an ill-typed edge is **unconstructible** (`Richness.lean` 50). `Theorem 1`
   (`all_edges_well_typed`) is a real Lean proof by induction, no `native_decide`
   (`Richness.lean` 71–76). **This one is a genuine proof, not an `#eval`.** ✓

2. **Acyclicity of the codegen-dependency subgraph (P5)** — decidable as *computation*, but
   **NOT a proof**. `graphHasCycle` uses a `private partial def dfsCycle`
   (`Report.lean` 89–114). `partial def` means **Lean has no termination proof**; it is an
   opaque `#eval`-able function, not a theorem. The comment even says "no Mathlib proof needed
   for `#eval` use" (lines 86–87). So P5 is a *decision procedure we trust operationally*, not
   a *verified* one. Honesty-wise that is fine — but it must be tagged **operational**, never
   "formally proven acyclic."

3. **Path-equation / commutativity (the heart of an `fdm` functor obligation)** — **this is
   where decidability degrades, and the decision is silent on it.** Spivak's functorial data
   migration treats the schema as a category *presented by generators + path equations*; the
   migration functor must *respect those equations* (commuting squares). The DomainSpec
   σ-quiver in the current implementation is a **free quiver with NO path equations declared**
   — `Spec` carries `edges : List (EdgeRow …)` and nothing else (`Richness.lean` 58–63). There
   is no relation table, no quotient, no commutativity obligation in the code at all.
   Consequences:
   - As built today, the "functor obligation" reduces to *(a)* σ-typing (free) + *(b)*
     acyclicity (`#eval`) + *(c)* closure (P1). **There is no commutativity check today**, so
     the "fdm functor obligation" is currently *weaker* than a Spivak migration — it is a
     typed-quiver-morphism check, not a category-functor check.
   - The moment path-equations are introduced (e.g. "Operation produced-by an Event must equal
     the Operation reached via the Workflow that orchestrates it"), checking `F(g∘f) = F(g)∘F(f)`
     becomes a **word problem in a category presented by relations**, which is **undecidable in
     general**. It stays decidable only under restrictions (e.g. finite, confluent-terminating
     rewrite system on the path algebra; or a finite skeleton enumerable by exhaustive `#eval`).
     The decision's blanket "functor obligations = decidable, `#eval`-checkable migration/path
     laws" (DECISION line 22) is **an over-claim** the instant non-trivial path equations exist.

**G3 (REQUIRED):** Add a **decidability boundary line** to the design: σ-typing = *proved*
(Theorem 1); acyclicity & M6-witness = *operational `#eval`, not proved* (`partial def`);
**path-equation/commutativity = decidable ONLY for a declared-finite, confluent-terminating
path-relation set, and undecidable in general** — so the design must either (i) commit to NO
path equations (then say plainly "this is a typed-quiver morphism check, not a Spivak migration
functor", do not borrow the word "functor obligation"), or (ii) declare a finite relation
schema with a decidability argument before any commutativity claim. Until (ii), do not assert
the obligations check composition-preservation — that is exactly round-1 F2 reappearing one
layer down.

---

## D. Re-check of round-1 FIX-1..4 against DEC-CAT-01

| Fix | Status | Evidence / gap |
|---|---|---|
| **FIX-1** (Intent Wall; Stage A = internal only; P3/P4 stub) | **SATISFIED at framing** | DISTILL F1: "Stage A correct = internal only; intent capture sits above an Intent Wall, owned by humans, never Lean." P3/P4 stub status is honored (Report.lean confirms). Carry the "P1+P5 real / P3+P4 stub" tag into PLAN. |
| **FIX-2** (partial+lax, not functor; two residue directions) | **SATISFIED at framing, INCOMPLETE in build** | Hard constraint 2 ("`F` is partial + lax … never `Full`"); DISTILL F2 names both directions (unspecified-behavior code∉spec; unimplemented-obligation spec∉code). BUT neither direction is *computed* today: code∉spec needs the T→Spec lift (not built); spec∉code needs P3 (stub). Flag, not block: framing is correct, coverage is future. See toy-game faults 3 & 4. |
| **FIX-3** (per-artifact provenance; R-determinism open; no codegen-attribution) | **PARTIALLY SATISFIED** | Hard constraint 3 requires the EdgeProvenance split. The *type* exists; the *emitter does not populate it* (uniform `.declared`). So the split is declared-intended, not real. R-determinism MUST stay OPEN (G2). Do not claim codegen-attribution until the parser tracks provenance. |
| **FIX-4** (claim-stage table; reword overclaims; ban philosophical wording) | **SATISFIED at framing, ONE residual** | Hard constraint 4 ("only operational + formal claims assertable"). Residual drift = the "residue = η-not-iso witnessed today" sentence (G1) which imports conjecture-vocabulary into a today-claim. Add the explicit claim-stage table to the PLAN deliverable. |

**Net:** FIX-1 and FIX-4 clear; FIX-2 and FIX-3 are correct *in framing* but *not yet real in
the build* — which is acceptable for a decision/plan gate as long as the design never narrates
the future-coverage as present capability. G1–G3 make that boundary load-bearing.

---

## E. Verdict and required fixes

**PASS (provisional)** — the decided approach is honesty-clean at the framing level and does
not violate PCRA. Required before s9 Invoke Plan:

- **G1** — never write "residue = η-not-iso, witnessed today" as one sentence; split into
  operational-witness (today) vs conjectural-Lan-characterization (deferred).
- **G2** — tag residue status three ways everywhere: *witness real · grade stubbed · attribution
  absent*; keep R-determinism OPEN; forbid codegen-attribution claims until provenance is
  populated.
- **G3** — draw the decidability boundary: σ-typing proved; acyclicity/M6 = operational `#eval`
  (`partial def`, not proved); path-equation commutativity decidable only under a declared
  finite confluent relation set, **undecidable in general** — and stop calling the check a
  "functor obligation" until commutativity is actually in scope.

These are contract-tightening, not redesign. The `fdm`-now / `presheaf-lan`-horizon split is a
sound, reversible, PCRA-honest decision.
