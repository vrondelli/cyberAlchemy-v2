# Findings — Presheaf / Vect / Yoneda / Residue: CAV2 Authority Implications

Dispatch: `2026-06-21-presheaf-vect-yoneda-residue-cav2-implications`, lane B.
Synthesizer: Mac Lane, Saunders (n=1). Sources: `research.md` (Simon / Tarski /
Lawvere explorer returns, recorded verbatim).

> **HARD BOUNDARY — this document PROMOTES NOTHING.** Every row below is a
> *non-authority candidate*. All PROMOTE-CANDIDATE verdicts are routings to the
> downstream owner (definitions-governance / constitution-governance), which
> alone hold promotion authority. ALREADY-OWNED rows assert existing CAV2
> coverage and require no action beyond a validation note.
>
> **Claim <= proof.** Nothing grounded by (a) presheaf-in-Vect or (d)
> geometric-orthogonality may be a PROMOTE-CANDIDATE — per Lawvere's grounding
> ruling (research.md, Lawvere) both lack a *deployed in-framework theorem*: (a)
> is a deployment gap (build-from-owned), (d)'s framework reading is metaphor.

---

## One-line goal answer

The presheaf/Vect/Yoneda/residue work implies **two genuinely net-new CAV2
candidates** — a "Representability Witness" definition and a
"Representability-Grounded Promotion Gate" constitution-rule, both grounded only
by the deployed theorem behind claim (b) (`M2Counter.lean:54`, no-sorry) — while
claims (c) and (b)'s governance are **already owned** (D16/D22 and D18/D23
respectively) and claims (a) and (d) **ground no promotable authority**
(deployment gap / metaphor).

---

## CANDIDATE-AUTHORITY matrix

| implied authority | kind | grounded-by (deployed theorem cite, or NOT-GROUNDED) | already-owned-by-CAV2? (cite ID:line) | candidate verdict | downstream owner |
|---|---|---|---|---|---|
| **(c) schema-instance independence** — schema and instance axes vary independently; no silent coupling | definition (formal poset/lattice layer) | (c) GROUNDED: `M6Counter.lean:125` + `S2VsS3Counter.lean:158`, both no-sorry (research.md, Lawvere; Simon) | YES — CAV2-D16 Typed Coupling Invariant (DEFINITIONS.md:644-711) + CAV2-D22 Orthogonal Classification (DEFINITIONS.md:1207-1285) | **ALREADY-OWNED** | n/a (validation note only) |
| **(b) hallucination/residue governance** — representability detects a commitment-level faithfulness failure | definition/axis (governance layer) | (b) GROUNDED: `M2Counter.lean:54`, no-sorry (research.md, Lawvere) | YES — CAV2-D18 Residue (DEFINITIONS.md:790-871) + CAV2-D23 Authority Lifecycle Axis (DEFINITIONS.md:1286-1346) | **ALREADY-OWNED** | n/a (validation note only) |
| **Representability Witness** — formal criterion distinguishing representable (true) vs non-representable (hallucinating) presheaf embeddings via the `IsRepresentable(Δ.op ⋙ yoneda.obj I)` test | **definition** (net-new) | (b) GROUNDED: `M2Counter.lean:54`, no-sorry (research.md, Lawvere; Simon) | NO — D18 owns the remainder structure, D23 owns the commitment/evidence split, but neither owns the formal categorical witness (research.md, Simon) | **PROMOTE-CANDIDATE** | definitions-governance |
| **Representability-Grounded Promotion Gate** — promotion from research into spec/impl authority requires passing a representability/faithfulness round-trip test; for presheaf-valued claims the test is `IsRepresentable(Delta.op >>> yoneda.obj I)`; failure gates to residue/open-question, not auto-block | **constitution-rule** (net-new) | (b) GROUNDED: `M2Counter.lean:54`, no-sorry (research.md, Lawvere; Tarski) | NO — partially covered/specialized but unnamed: CAV2-C3 Research Before Specification (STABLE-REPOSITORY-CONSTITUTION.md:52-66), CAV2-C9 Validation Before Implementation (:146-159), CAV2-D5 Promotion Gate (DEFINITIONS.md:185-221); none mandates a representability test (research.md, Tarski) | **PROMOTE-CANDIDATE** | constitution-governance |
| **(a) presheaf-in-Vect framework reading** — V-valued (Vect-enriched) presheaf embedding as in-framework authority | (would-be definition/axiom) | **NOT-GROUNDED in-framework** — externally grounded (Kelly 1982 sec.4-5; `DomainSpec.lean:105-147` proves only the Set case); Vect Lean encoding unwritten = DEPLOYMENT gap (research.md, Lawvere) | n/a — build-from-owned note only | **DO-NOT-PROMOTE** | (build-from-owned backlog; not promotable until deployed) |
| **(d) geometric-orthogonality framework reading** — perpendicular-embeddings = semantic-independence | (would-be definition) | **NOT-GROUNDED in-framework** — formal notion owned externally (Freyd-Kelly 1972 LNM76; Kelly sec.5.5); in-framework reading is metaphor, no deployed theorem in domainspec-core (research.md, Lawvere) | n/a | **DO-NOT-PROMOTE** | (demote to metaphor; re-label per CAV2-C1) |
| **NAMING ACTION** — rename claim (c) away from the word "orthogonality" to avoid lexical conflation with CAV2-D22 Orthogonal Classification (governance layer); (c) is lattice/poset *decoupling*, not categorical orthogonality | naming/definition-hygiene action | (c) GROUNDED: `M6Counter.lean:125` + `S2VsS3Counter.lean:158`, no-sorry; Lawvere "GO/renamed"; Simon altitude split (research.md) | partial — D22 owns the term "orthogonal" at governance altitude; collision is lexical not semantic | **PROMOTE-CANDIDATE** (hygiene item, not new authority) | definitions-governance |

---

## Concrete candidate drafts (Popper non-vacuity witness)

These are the two actual draft texts Popper produced, supplied so downstream
owners have draftable material. **Both remain NON-AUTHORITY candidates — this
section promotes nothing.** Tentative IDs are placeholders for the owners.

### DEFINITION candidate "Representability Witness" (tentative id CAV2-D28)

- **Term:** Representability Witness.
- **Normative definition:** A presheaf-valued claim's embedding is a *true*
  embedding iff the test `IsRepresentable(Δ.op ⋙ yoneda.obj I)` holds; a
  representable embedding is grounded (the presheaf is genuinely represented by
  an object `I`), while a non-representable embedding is *hallucinating* — it
  presents as an embedding but no representing object certifies it.
- **Formal admissibility condition:** name the diagram `Δ`; record whether
  `IsRepresentable(Δ.op ⋙ yoneda.obj I)` holds. Representable → the claim **may**
  pass the promotion gate; non-representable → **route to residue / open-question**
  (the failed test is recorded as typed residue, not silently dropped).
- **Boundary:** does NOT redefine presheaf or Yoneda (those are owned upstream);
  the witness only adds the pass/fail test. Testing happens **at the gate**, not
  during research — research records claims; the gate certifies them.
- **Grounded by:** (b) — `M2Counter.lean:54`, no-sorry.

### CONSTITUTION-RULE candidate "Representability-Grounded Promotion Gate" (tentative id CAV2-C13)

- **Validation mode:** hybrid.
- **Gate text:** a presheaf-valued claim is promotable **only if** it (1) passes
  the representability test `IsRepresentable(Δ.op ⋙ yoneda.obj I)`, **OR** (2)
  records typed residue from a failed test, **OR** (3) is declared
  non-presheaf-valued (the test does not apply).
- **Failure behavior:** gate-to-residue / flag — **NOT** auto-block. A failed
  test routes the claim to residue or raises a flag; it does not hard-stop the
  pipeline.
- **Specializes:** CAV2-C3 Research Before Specification
  (STABLE-REPOSITORY-CONSTITUTION.md:52-66), CAV2-C9 Validation Before
  Implementation (:146-159), CAV2-D5 Promotion Gate (DEFINITIONS.md:185-221).
- **Grounded by:** (b) — `M2Counter.lean:54`, no-sorry.

---

## (c)-vs-D22: overlap / altitude distinction (no collision)

Claim (c) and CAV2-D22 **overlap but are not identical** (research.md, Simon).
They share one concept — axis independence with no silent coupling — at **two
different altitudes**:

- **(c) = formal/lattice layer.** A categorical poset-lattice decoupling,
  carrying the *formal proof* that schema-instance axes satisfy independence
  (`S2VsS3Counter.lean:158`; also `M6Counter.lean:125`).
- **D22 = governance/ontology layer.** Owns the governance *rule* of orthogonal
  classification (DEFINITIONS.md:1207-1285).

Per Tarski (research.md), (c) ALSO sits under CAV2-D16 Typed Coupling Invariant
(DEFINITIONS.md:644-711): D16 mandates recording a typed relation `R(A,B)` when
`A,B` cannot vary independently; (c) *proves* schema/instance CAN vary
independently, so no coupling invariant is triggered. **(c) therefore validates
the existing rules rather than colliding with them** — it supplies the formal
discharge that D16/D22 presuppose. This is the controlling reason (c) is
ALREADY-OWNED, not net-new.

**Quine confirmation.** Quine confirmed (c)'s ALREADY-OWNED verdict is a
*validation-discharge* of the CAV2-D16/D22 preconditions, **not an over-merge**;
and the Representability Witness is the *positive dual* of CAV2-D18 Residue (a
test certifying the **absence** of residue), **not a re-skin** of D18.

---

## DO-NOT-PROMOTE list (claim <= proof enforcement)

Lawvere's grounding ruling (research.md, Lawvere) is the binding authority here.
Nothing resting on (a) or (d) may be a PROMOTE-CANDIDATE:

1. **(a) presheaf-in-Vect, in-framework reading.** Grounded *externally* (Kelly
   1982 sec.4-5) and proven only for the **Set** case in-repo
   (`DomainSpec.lean:105-147`, no-sorry). The Vect/V-enriched Lean encoding is
   **not yet written** — a *deployment* gap, not a grounding gap. Verdict:
   **build-from-owned**, not promotable as authority until deployed.
   - *Collapse condition (Lawvere):* if sibling `AsymmetricTowerVEnriched.lean`
     already proves the V-enriched triple no-sorry, (a) is already-deployed —
     trust-but-verify before rebuild.
2. **(d) geometric-orthogonality, in-framework reading.** The formal notion is
   owned externally (Freyd-Kelly 1972 LNM76; Kelly sec.5.5 enriched
   orthogonality), but the "perpendicular-embeddings = semantic-independence"
   reading is **metaphor** with no deployed theorem in domainspec-core. Verdict:
   promote the *formal* notion only as build-from-owned; **DEMOTE the
   in-framework reading to metaphor, NOT authority.** Per CAV2-C1 Source-Ledgered
   Consolidation it must be re-labeled (synthesis/inference/open-question →
   metaphor); per CAV2-C3 it stays research-only.

---

## Residue

Open items, collapse conditions, and deferred work — preserved, not promoted:

- **R1 — Representability Witness deployment status (Simon collapse).** If
  BACKLOG **H-8** already contains a complete no-sorry Lean formalization of
  `IsRepresentable(Delta.op >>> yoneda.obj I)`, the witness is *already-deployed*,
  not net-new — the candidate would downgrade to ALREADY-DEPLOYED. The H-8
  backlog state must be checked before definitions-governance acts. (research.md,
  Simon; Lawvere notes H-8 "open = work not absence".)
- **R2 — Gate optionality (Tarski collapse).** The Representability-Grounded
  Promotion Gate keystone is *falsified* if a governance review chooses to leave
  representability **optional** rather than blocking; the rule then stays
  implicit under C3/C9 and is not promoted. (research.md, Tarski.)
- **R3 — (a) V-enriched deployment (Lawvere collapse).** Verify
  `AsymmetricTowerVEnriched.lean` before any rebuild of the Vect case
  (trust-but-verify). (research.md, Lawvere.)
- **R4 — Proposed home for the Witness.** Simon proposes CAV2-D28 or a dedicated
  instance-residue witness module; the home is a definitions-governance decision,
  not fixed here. (research.md, Simon.)
- **R5 — No measure-theoretic rule from (c).** Tarski rules out any
  "two-budget/conservation-law" rule grounded by (c) alone — (c) is structural
  poset independence, not measure-theoretic; no such candidate is opened.
  (research.md, Tarski.)
- **R6 — (d) re-labeling action.** The metaphor demotion of (d) is itself a
  CAV2-C1 ledger action (re-label as metaphor) that must be carried out
  downstream; recorded here as residue, not executed.
- **R7 — Representability Witness collapse (contingency).** If BACKLOG **H-8**
  (`domainspec-lean-formalization`) already contains a *complete no-sorry* Lean
  formalization of `IsRepresentable(Δ.op ⋙ yoneda.obj I)`, the Witness is
  **already-deployed, not net-new** — the CAV2-D28 candidate downgrades to
  ALREADY-DEPLOYED. **definitions-governance must verify H-8 state before acting**
  (trust-but-verify; "open = work not absence" does not by itself prove absence).
- **R8 — Promotion Gate contingency.** The CAV2-C13 rule is admissible **only if**
  a governance review **MANDATES** representability (blocking). If the review
  instead chooses to leave representability **optional / advisory**, the rule
  stays implicit under C3/C9 and is **not promoted**. **constitution-governance
  owns that stance decision.**

---

## Routing summary

- **definitions-governance** receives: Representability Witness
  (PROMOTE-CANDIDATE); the (c) naming/hygiene rename action; ALREADY-OWNED
  validation notes for (c) under D16/D22 and (b) under D18/D23.
- **constitution-governance** receives: Representability-Grounded Promotion Gate
  (PROMOTE-CANDIDATE), specializing C3/C9/D5.
- **No owner / build-from-owned backlog**: (a) Vect deployment; (d) metaphor
  re-label under C1.
