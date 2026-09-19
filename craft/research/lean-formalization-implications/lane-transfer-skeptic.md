# Lane report — TRANSFER SKEPTIC (anti-bias axis: import optimism vs transfer skepticism)

Dispatch: lean-formalization-implications. Role: attack imports from
`c:/Users/victo/domainspec-lean-formalization` into `domainspec-core`.
Discipline: claim <= proof (the Lean repo's own rule, `GLOSSARY.md:367`).

**Framing first.** The Lean repo models compilation as a functor `Δ : L₁ → L₂`
between **small categories** with **Set-valued instance presheaves** and the Kan
adjoint triple (`GLOSSARY.md:31-59`; `docs/domainspec-two-layer-framework.md:206-209`).
domainspec-v2 governs a **finite typed composable graph fragment** with
validators: identities are "not represented or validator-enforceable today"
(`projects/domainspec-v2/definitions/reviews/2026-07-12-category-law-formalization-route.md:31`),
composition is "only local endpoint compatibility" (`:32`), associativity is
"not represented or enforced" (`:34`), and the word "category" is explicitly
reserved (`:14-23`, `:70`; `projects/domainspec-v2/research/2026-07-02-first-class-category-boundary/findings.md:178-184`).
So the default verdict for any theorem whose hypothesis is "Δ a functor between
categories" is **hypothesis mismatch**: it cannot even be *stated* over v2's
current artifact. Everything below is judged against that floor.

---

## 1. KILL-LIST

| # | Tempting import | Kill reason | Cites |
|---|---|---|---|
| K1 | **Noether / "two conservation laws" language** for spec evolution | **Overclaim** — the repo itself demoted it. Paper Coda "stands as a *scope warning only*" (`docs/paper.md:305`); "This paper does **not** prove a Noether theorem" (`:308`); ingredient table: continuous symmetry / generator / conserved current all **Absent** (`:312-318`). A2 is closed-negative for classical Noether (`GLOSSARY.md:460`; `BACKLOG.md:232-234` D3). | paper.md Coda; BACKLOG D1–D3 |
| K2 | **Lawvere fixed-point / strange-loop closure** (a "self-describing spec system") | **Overclaim / closed-negative** — "a real Lawvere fixed-point at any finite level ... is structurally forbidden" (`BACKLOG.md:89`); "The framework should stop chasing Lawvere as a target" (`:91`); `C_ω_absorption_refuted` (`GLOSSARY.md:282`); D2: "structurally suggested, not formalized" (`BACKLOG.md:229`). | BACKLOG A4; GLOSSARY P6 entry (:200) |
| K3 | **"Yoneda solves translation" / schema-as-consolidated-instance (A1)** | **Vocabulary-only + overclaim** — the repo's own glossary warns the Yoneda bridge "is a precise Lan/Yoneda bridge, **not a generic 'Yoneda solves translation' slogan**" (`GLOSSARY.md:75`); Yoneda itself is "inherited standard math, not a new DomainSpec theorem" (`:71`); A1 is "Captured, not integrated" even in its home repo (`BACKLOG.md:33`). | GLOSSARY:71,75; BACKLOG A1 |
| K4 | **Representability Witness + Representability-Grounded Promotion Gate** | **Already-owned/routed** — domainspec-core already routed exactly these two as PROMOTE-CANDIDATEs to definitions-governance / constitution-governance (`cyberAlchemy-v2/development/research/2026-06-21-presheaf-vect-yoneda-residue-implications/findings.md:36-42`, drafts `:52-82`). Re-importing duplicates a live routing; the Witness is contingent on the H-8 no-sorry check (residue R7, `:164-169`). | CAV2 findings 2026-06-21 |
| K5 | **Schema-instance independence** and **hallucination-as-untracked-residue** as new governance | **Already-owned** — verdict ALREADY-OWNED by CAV2-D16/D22 and D18/D23 respectively (`findings.md:36-37`); (c) is a *validation-discharge* of existing rules, not new authority (`:98-104`). | same findings, matrix rows (c),(b) |
| K6 | **"Schema residue" η^sch** as a v2 metric | **Overclaim + hypothesis mismatch** — the repo calls it a "*prospective* definition — well-defined only once G is exhibited," and G's existence (M2-restricted) is open while unrestricted M2 is refuted (`GLOSSARY.md:103`, M-table `:444-445`). v2 has no functor to take an adjoint of. | GLOSSARY:103; M2Counter |
| K7 | **M2-restricted / M6' / M6-restricted** as importable results | **Overclaim (open conjectures)** — B1–B3 are explicitly conjectural (`BACKLOG.md:190-197`); M6' unrestricted is *refuted* (`GLOSSARY.md:450`). An open conjecture changes no v2 validation, promotion, or owner decision. | BACKLOG B1–B3; GLOSSARY M-table |
| K8 | **M5 adjoint triple / Kan-extension machinery / migration functors** as v2 validator semantics | **Hypothesis mismatch + already-owned by literature** — requires L₁, L₂ categories and Set-valued instances; v2 lacks identity, composition, closure (route review rows `:31-34`). The triple is Spivak 2012, "DomainSpec's contribution is not the triple" (`GLOSSARY.md:484`). Category framing is "rationale only" in v2 (`findings.md 2026-07-02:20`). | route review; GLOSSARY appendix |
| K9 | **"Fractal" taxonomy** | **Vocabulary-only** — "Project brand, not a new mathematical concept ... a taxonomy of fully-faithfulness conditions" (`GLOSSARY.md:155-160`). v2 has no adjunction to index the taxonomy on. | GLOSSARY fractal note |
| K10 | **Reflection tower / ω-colimit / transfinite persistence** | **Hypothesis mismatch + repo-admitted gaps** — the tower is "not Δ-parametric" (B5 open, `BACKLOG.md:157`, `:181-188`); per-step `EssSurjResidue` "collapses to the count n (closed-negative)" (`README.md:38`, `:53`). Nothing in v2's promotion lifecycle consumes a tower level. | README honest status; BACKLOG B5 |
| K11 | **Thermodynamics / second-law / Landauer surfaces** | **Overclaim if read physically; irrelevant to v2** — finite-discrete only, "not a continuous RG theorem and not a full Gibbs/Landauer/Clausius result" (`GLOSSARY.md:111`, `:119-123`); the entropy+MI unification is "**owned**" by Perrone 2024 (`README.md:34`, `:51`). No v2 decision consumes an entropy observable. | GLOSSARY §finite-discrete; README |
| K12 | **Time-as-functor (A2 insight)** | **Vocabulary-only + regime-bound** — "Captured, not integrated" (`BACKLOG.md:47`); D1: breaks in relativity and in distributed systems — exactly v2's territory, where time is a partial order (`BACKLOG.md:226-227`). | BACKLOG A2, D1 |
| K13 | **The repo's bulk as evidence weight** ("198 Lean files") | **Overclaim** — "There is **no blanket `sorry`-free claim** ... 89 of 198 root files contain the string `sorry`" (`README.md:55`); "functoriality in Δ is still 'hollow'" (`:36`); V/H/D unification claim "**rejected** by audit" (`:88`). Any import must be per-file build-gated. | README:55 |
| K14 | **Claim-status discipline** (closure marks, relation labels) as a process import | **Already-owned** — domainspec-core's CAV2 constitutions, promotion gates, and verdict-matrix practice already enforce the same discipline (e.g. `findings.md 2026-07-02` rubric; CAV2-C1/C3/D5 cited at `2026-06-21 findings.md:79-82`). Convergent, not importable. | CAV2 spine |

---

## 2. SHORT LIST — survives the attack

Three items, all consumed by the **already-selected v2 route** — the
research-tower on category-like laws (`2026-07-12-category-law-formalization-route.md:46-62`).
None touches a validator today; that is the honest ceiling.

### S1. The proved counterexample pack as ready-made countermodels
- **Artifacts:** `M6Counter.lean` (`m6_strong_refuted`), `M2Counter.lean`
  (`M2_unrestricted_false`), `Bicyclic.lean` (`lanUnit_app_not_mono_bicyclic`),
  `S2VsS3Counter.lean`, `CounitCounter.lean`.
- **Proof status:** closed-proof, Lean source-level, no-sorry per the repo's own
  M-table (`GLOSSARY.md:444`, `:449-450`) and the CAV2 lane's independent cites
  (`2026-06-21 findings.md:36-37`).
- **Specific v2 change:** the route packet demands "candidate law set with
  **countermodels**" (route review `:58`). These are the countermodels for the
  **projection-preservation** and **obligation-preservation** rows (`:35-36`):
  they prove no schema-side discipline (injective + faithful) can be promoted as
  evidence of instance-side round-trip fidelity. Concretely: definitions-governance
  must never accept a law of the form "endpoint/type validation passing ⇒
  generated views preserve obligations" — a four-object countermodel already
  refutes its categorical idealization.

### S2. F11 — the fully-faithful threshold as the hypothesis-setter
- **Artifact:** `F11.lean` (`schema_instance_decoupling_threshold`).
- **Proof status:** "Lean source-level theorem family" for the sharp threshold;
  transfinite variants explicitly excluded (`GLOSSARY.md:464`, `:182`).
- **Specific v2 change:** **conditional** — only after the research-tower defines
  v2's composition operator and a genuine translation functor exists. Then F11
  fixes which hypothesis a positive preservation law must demand: **fully
  faithful**, because inj+faithful is proved insufficient (S1) and FF is proved
  sufficient. It pre-decides the strength of any future promoted
  "projection preservation" law and blocks a weaker phrasing at the
  definitions-governance gate.

### S3. GLOSSARY §1 + NAMING.md as the notation bridge
- **Artifacts:** `GLOSSARY.md:27-84` (categorical primitives with engineer
  readings), `lean-formalization/NAMING.md` (project ↔ Mathlib table).
- **Proof status:** definitional/standard — zero proof risk by construction.
- **Specific v2 change:** the route packet's deliverable 2 is exactly "notation
  bridge from DS-D1/DS-D8 into objects, morphisms, identities, and composition"
  (route review `:56-57`). This glossary is a vetted, honesty-annotated starting
  table (each term flagged standard vs project-brand), saving the tower a
  from-scratch pass and importing the repo's disambiguation warnings (e.g. `:47`
  on `Cat`, `:107` on "residue") wholesale.

**Not on the short list, and why it is close:** the instance-unit η^ins as a
formal definition of "generated-view round-trip loss." The object is real and
unconditional (`GLOSSARY.md:105`), but its statement still needs the functor v2
does not have; it enters only *through* S2's condition, so listing it separately
would double-count.

---

## 3. Skeptic's bottom line

The sibling repo's transferable value to domainspec-core is **narrow and
negative-shaped**: proved counterexamples that constrain what v2's future law
package may claim, one sharp threshold theorem that fixes a hypothesis, and a
notation table. Every positive-sounding headline — Noether, Lawvere, Yoneda-as-
translation, towers, thermodynamics — is, by the repo's **own** status
discipline, a scope warning, a closed-negative, an open conjecture, or prior-art
owned. The two governance candidates it could seed (Representability Witness /
Promotion Gate) were already routed by domainspec-core on 2026-06-21 and must
not be re-imported as if new.
