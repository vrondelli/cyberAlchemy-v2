# Interrogation Review — residue-skeptic (adversarial lane)

Stage: s3 · Role: residue-skeptic · Lane: ADVERSARIAL
Target: `stages/s2-invoke-define/DEFINE.md` (Lean Functor Validation for DomainSpec)
Honesty boundary enforced: Craft PCRA — LLM translation is lossy; the target is
**acceptable, NAMED, governed residue, never zero**; **no full-faithfulness / isomorphism claim**
(`CRAFT-INITIAL-DEFINITION.md` Loop 2 correction, lines 98–99; Honesty Boundary, lines 660–672;
"It should not … claim perfect isomorphism", lines 693–698).

**Verdict: FLAG** (not block). DEFINE already seeds the right honesty constraints
(R-honesty, "Lan-faithful, not full", "staged, per Craft") and explicitly scopes the
categorical claim OUT of "proven". It does not currently overclaim. But four claims are
fragile enough that they will silently drift into overclaim during DESIGN/PLAN unless the
guardrails below are written into the design contract now. The flag is "fix the framing
language and add the residue ledger entries before DESIGN", not "the proposal is dishonest".

---

## Prioritized findings

### F1 (CRITICAL) — "Stage A proves the spec is correct." Correct vs WHAT?

- **Claim** (DEFINE lines 11–13, 41–43): "A DomainSpec spec is well-formed and internally
  correct — decidably, in Lean."
- **Why fragile:** "correct" is unqualified and reads as semantic correctness. What Stage A
  actually discharges is _internal_ correctness only: P1 schema closure, P5 acyclicity of the
  codegen-dependency subgraph, P2 σ-typing free-by-construction, and the deferred P3/P4. Every
  one of these is a property of the spec **as a graph/quiver against the σ-signature**. None of
  them can witness that the spec captures the user's INTENT. The σ-signature itself is taken as
  given (validator README: "Below the Claim B Wall the spec is taken as given", line 89). There
  is a second, deeper wall: even a fully σ-valid, closed, acyclic spec can be the _wrong_ spec.
  P3/P4 are stubs today (README lines 58–59, 74–76), so "Stage A correct" is also _partial_ even
  on its own internal terms — Stage A is at most P1+P5 today.
- **Named residue:** **Domain residue** (the schema may lack the relations/terms/behavior the
  user meant — Craft taxonomy, line 426) sitting at an **intent wall** strictly above the Claim B
  Wall. Plus **R-stub** (DEFINE already names this): Stage A is partial until P3/P4 land. This is
  _governance/validation residue_ in the sense that no decidable Lean predicate can own the
  intent-capture decision — it is a human-decision residue (Craft stop criterion 3, lines 517,
  365).
- **Guardrail:** Rename the claim to **"Stage A proves the spec is internally well-formed
  (σ-valid, closed, acyclic) — it does NOT prove the spec is the intended spec."** Add an explicit
  **Intent Wall** above the Claim B Wall in the domain map, owned by human review / interrogation,
  never by Lean. Mark Stage A as "P1+P5 real; P3+P4 stub" everywhere it is summarized.

### F2 (CRITICAL) — "Code-as-functor F: C → S" — is the map actually a functor?

- **Claim** (DEFINE lines 14–19, 47–58): T then classification "yields a functor candidate
  F : C → S"; validation = "does F preserve composition and identities".
- **Why fragile:** Calling F a functor presupposes the structure it is supposed to _check_. On
  real code the functor laws plausibly fail in both directions:
  - **Identity preservation** is suspect: a code unit may map to no spec object (a helper, a
    glue module, an adapter) — F is not even total on objects, so `F(id_c)` has no target.
  - **Composition preservation** is suspect: code call-edges compose freely (a→b→c), but the spec
    σ-signature only admits _typed_ edges; `F(g∘f)` need not equal `F(g)∘F(f)` because the spec may
    forbid the composite edge type or route it through a different Meta. That is exactly an
    **oplax/lax** situation (a comparison 2-cell, not an equality), or at best a **partial functor**
    on a subcategory — _not_ a strict functor.
  - **Two residue directions, both real and both must be named:**
    (a) **code with no spec counterpart** = extra/unspecified behavior (image of C not in spec);
    (b) **spec with no code** = unimplemented obligations (objects of S with empty preimage).
    A single "functor" framing hides (b) entirely, because a functor says nothing about
    surjectivity/fullness — which is precisely why the README already disclaims `Functor.Full`.
- **Named residue:** **Structural residue** (the artifact shape — a strict functor — cannot hold
  the relation that actually exists, which is partial + lax — Craft taxonomy line 427). Direction
  (a) is **translation residue** (code expresses structure the spec did not intend); direction (b)
  is **recomposition residue** / coverage residue (spec obligations that do not reattach to code).
- **Guardrail:** Do NOT assert F is a functor. Frame the Stage-B object as a **partial, lax
  structure-preserving map** whose _non-preservation_ (failed identity/composition squares) IS the
  reported residue. Require the design to ledger **both directions separately**: an
  "unspecified-behavior" residue class and an "unimplemented-obligation" residue class. The Lean
  surface should check _commuting squares where they exist_ and _report_ where they don't — never
  claim the squares all commute.

### F3 (HIGH) — "Deterministic translator T" launders LLM residue into T's mapping table

- **Claim** (DEFINE lines 47–52, 86–87, U3): T is non-LLM and reproducible; "Determinism is the
  load-bearing property: the translator must not be PCRA even though the code generator is."
- **Why fragile:** Determinism ≠ correctness. T's _design_ encodes choices — which architecture
  pattern, which source tag, which composability rule maps to which Meta. A deterministic-but-wrong
  T is perfectly reproducible and still systematically mis-lifts code. Worse, it _launders_ codegen
  residue: when the LLM produces idiosyncratic code, T's fixed mapping table silently coerces it
  into a Meta, and the resulting "clean" functor check attributes zero residue to a translation that
  actually lost information **inside T**. DEFINE's own U3 admits this is unresolved ("can residue be
  attributed to the codegen, not to T?"). The README also flags the precedent: "incidental markdown
  links accepted as σ-fallback edges may surface as M6 witnesses" — i.e. the existing pipeline
  already manufactures edges that are mapping artifacts, not real structure (README line 91).
- **Named residue:** **Translation residue relocated into the translator** — a _mapping residue_
  that is invisible unless T's table is itself audited. This is **governance residue** (the system
  cannot tell which owner — codegen vs T — is responsible — Craft taxonomy line 431) plus
  **entropy residue** displaced from the PCRA layer into T's discrete choice points.
- **Guardrail:** Require T to emit **provenance per lifted artifact** (which pattern/tag/rule fired,
  with a confidence/fallback flag — reuse the existing `EdgeProvenance: declared | contextInferred |
sigmaFallback` machinery, README line 46). Residue attributable to `sigmaFallback`/`contextInferred`
  is **T-mapping residue**; residue from declared-but-mismatched structure is **codegen residue**.
  Make T's mapping table a **versioned, reviewable schema** (a Craft schema in its own right) so its
  choices are governed, not hidden. Until T-provenance exists, DEFINE's R-determinism ("asserted,
  not yet proven") must stay open and Stage B must NOT claim residue is codegen-attributable.

### F4 (MEDIUM) — categorical claims must be forced onto Craft's 4-stage ladder

Craft stages every categorical/universal claim: (1) operational, (2) formal, (3) philosophical,
(4) universal physics (`CRAFT-INITIAL-DEFINITION.md` lines 624–631). Anything above
**operational+formal** must NOT be asserted as established. Forcing each DEFINE claim:

| DEFINE claim                                                           | Honest stage                                                                                                   | Verdict                                                                       |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| "spec is a well-typed quiver/category, free by construction" (l.34–39) | operational+formal (Theorem 1 is real in Lean)                                                                 | OK as stated                                                                  |
| Spec category `S` with σ-legal morphisms (l.34)                        | formal-by-analogy (Spivak/Lawvere are analogy, not authority — Craft l.57)                                     | OK only if labeled analogy                                                    |
| Implementation category `C` from code (l.46)                           | **formal CLAIM, unproven** — that code units + calls form a category (assoc/identities) is asserted, not shown | must be downgraded to "candidate"                                             |
| "Code-as-functor F" (l.54)                                             | **above operational+formal** if asserted as a functor; only honest as "partial lax map candidate"              | see F2 — do not assert                                                        |
| "mathematically establish … implementation fidelity" (l.27–28)         | risks **philosophical/universal** drift ("mathematically checkable agreement")                                 | reword to "mechanically checkable _structural_ agreement, with named residue" |

- **Finding:** Two phrases sit above the allowed ceiling: **"yields a functor candidate F"** (treats
  the functor as nearly-achieved) and **"mathematically checkable agreement"** (reads as semantic
  agreement, not structural). DEFINE _mostly_ protects itself ("functor candidate", "staged, per
  Craft", IN/OUT scope explicitly excludes "proven"), so this is a wording flag, not a block.
- **Guardrail:** Add a one-line **claim-stage table** to DESIGN tagging every categorical statement
  operational / formal / analogy / candidate, and forbid "philosophical"/"universal" wording in the
  pipeline's own deliverables (keep that horizon in a clearly separated section if at all).

### F5 (INFO) — residue taxonomy classification of the whole pipeline

Mapping the expected residue of the full Intent→spec→codegen→T→F pipeline onto Craft's seven types
(taxonomy table, lines 423–431):

| Craft residue type        | Where it appears here                                                                    | Unavoidable?                         |
| ------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------ |
| **Translation residue**   | LLM codegen (PCRA) — the headline source; also T-mapping (F3)                            | **YES — structural to PCRA**         |
| **Domain residue**        | spec may not capture intent (F1, Intent Wall)                                            | **YES — Lean cannot decide intent**  |
| **Structural residue**    | strict-functor framing can't hold partial+lax reality (F2)                               | YES, until F is reframed             |
| **Attention residue**     | large code units / large specs degrade both codegen and review fidelity                  | YES (mitigable via SCU sizing)       |
| **Entropy residue**       | LLM path-spread (codegen); discrete-choice spread inside T (F3)                          | YES at codegen; reducible in T       |
| **Recomposition residue** | spec obligations with no code (F2 direction b); does the residue ledger reattach upward? | YES, must be tracked                 |
| **Governance residue**    | who owns codegen-vs-T attribution (F3); who owns intent (F1)                             | YES, until provenance + owners named |

**Unavoidable floor:** translation, domain, and entropy residue can never be driven to zero in this
pipeline — that is the PCRA honesty boundary itself. The pipeline's legitimate goal is to make these
**named, attributed, and governed**, not absent. Any deliverable that implies a path to zero residue
violates Craft.

---

## Claims that must NOT be made (hard list)

1. **NOT** "Stage A proves the spec is correct" (unqualified). Only: "internally well-formed —
   σ-valid, closed, acyclic; P1+P5 real, P3+P4 stub." Never that Lean proves intent capture.
2. **NOT** "F is a functor" / "F is structure-preserving" as an achieved fact. Only: "partial, lax
   map candidate; preservation is _checked per square_ and non-preservation is the reported residue."
3. **NOT** any `Functor.Full` / faithful / isomorphism / "fully faithful" claim — explicitly barred
   by the README ("Lan-faithful, not full") and Craft (lines 98–99, 697).
4. **NOT** "deterministic T ⇒ residue is attributable to codegen." Determinism does not buy
   correctness; T-mapping residue exists and must be separated via provenance (F3).
5. **NOT** "the pipeline proves implementation fidelity" / "mathematically checkable agreement."
   Only "mechanically checkable _structural_ agreement, with named governed residue."
6. **NOT** zero-residue, "complete," "exhaustive," or "fully verified" framing anywhere. Residue is
   never zero (PCRA).
7. **NOT** treating the spec-as-category / code-as-category as proven categories — they are
   candidates; Spivak/Lawvere are **analogy, not authority** (Craft line 57).
8. **NOT** presenting any philosophical/universal-physics framing as established within the
   pipeline's own claims (Craft 4-stage ladder; only operational+formal are assertable).

---

## Required fixes before DESIGN proceeds (to clear the FLAG)

- FIX-1 (from F1): add an explicit **Intent Wall** above the Claim B Wall in the domain map; requalify
  the Stage A claim and mark P3/P4 as stub wherever Stage A is summarized.
- FIX-2 (from F2): reframe Stage B object as **partial + lax**, not functor; ledger the two residue
  directions (unspecified-behavior, unimplemented-obligation) as separate named classes.
- FIX-3 (from F3): require **per-artifact provenance** from T (reuse `EdgeProvenance`), keep
  R-determinism open, and forbid codegen-attribution claims until provenance exists.
- FIX-4 (from F4): add a **claim-stage table** to DESIGN; reword "functor candidate F" and
  "mathematically checkable agreement"; ban philosophical/universal wording in deliverables.

These are framing/contract fixes, not redesigns. DEFINE's seeded ledger (R-honesty, R-stub,
R-determinism) already points the right direction; the fixes make the guardrails load-bearing
instead of optional.
