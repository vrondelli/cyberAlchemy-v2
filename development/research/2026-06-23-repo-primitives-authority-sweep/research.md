# research.md — collected verbatim returns

Dispatch: `2026-06-23-cav2-repo-primitives-authority-sweep` (research)
Goal: sweep the umbrella repo + cav2's own staged material for candidate **primitives** (node concepts) and **authority** (owner-routed canonical sources) cyberAlchemy-v2 could adopt.

Groups A (explorers) returns are verbatim below. Synthesis lives in `findings.md`.

---

## A1 — Abramsky, Samson (explorer) — bottom-up formal-primitive floor

> Source corpus: `domainspec-lean-formalization/`. claim ≤ proof carried verbatim from README + file headers.

`candidate | exact source path:symbol | proposed cav2 mapping | reusable AS | honest status`

1. **FunctorialResidueStructure** | `lean-formalization/FunctorialResidueStructure.lean:FunctorialResidueStructure` (struct, §1) | the typed dock under `concept.residue` (the "target that beats count") | generic node-shape for any residue node: schema type + refinement preorder + `noise : Schemaᵒᵖ ⥤ C` where monotonicity IS `Functor.map` | **proved sorry-free** (monotonicity DERIVED; `noise_anti_refl/_trans` are `map_id/map_comp`). Owned machinery (Preorder→Category, pointwise Lan); contribution = derivation + witness #2.
2. **separation_is_functor_action** | `…FunctorialResidueStructure.lean:DiamondNonVacuity.separation_is_functor_action` (+ `functorial_strictly_dominates_count`, `lanPackaging_obligation_landed`) | the non-degeneracy WITNESS a `concept.residue` must clear; an Authority **Discipline** gate ("residue must beat count") | proof a functorial noise glues a separated pair NO Set-cardinality residue can see | **proved sorry-free.** The only sweep object that escapes the count wall.
3. **ResidueStructure** + **universal_monotonicity** | `lean-formalization/UniversalResidueFunctor.lean:ResidueStructure`, `:universal_monotonicity` | a **Constitution/Discipline** ("any residue register must ship `noise_anti`"), NOT a Definition of residue | uniform monotonicity law across registers | **count-degenerate.** Set-valued ⇒ count-capped by the type; monotonicity is a postulated field. Header: "No universal property is proved" — do NOT call it a functor.
4. **lanFaithfulSchema** + **Δ_noise_nonempty** (observer register) | `…UniversalResidueFunctor.lean:ObserverInstance.lanFaithfulSchema`, `:Δ_noise_nonempty` | a `concept.residue` instance for the observer axis | third register's non-vacuity witness (`Bicyclic.X` ∈ noise) | **proved sorry-free as instance**, but sits on count-capped #3 (non-vacuous witness, degenerate dock).
5. **FCAConceptResidue.Concept** + **conceptResidue** | `lean-formalization/FCAConceptResidue.lean:Concept`, `:conceptResidue`, `:diagConcept` | THE typed artifact-type for cav2 `concept.residue` (Galois-closed (extent,intent) pair) | defines + inhabits the residue node's artifact-type; instantiates #1 | **owned-by-prior-art** (Ganter–Wille 1999 / Wille 1982; Ore 1944). Header: "build-from-owned, NO novelty claim." NOT a count-wall clearance.
6. **Residue.ResidueObject** + **H** | `lean-formalization/Residue.lean:ResidueObject`, `:H`, `:H_identity_zero`, `:H_product_eq` | a `concept.residue` instance carrying entropy readout; supports a **Spec** (chain-rule) | residue-as-(basepoint, finite fiber, pmf) | **proved sorry-free but SCOPED**: object-level fiber simplification, no ambient category; categorical reformulation deferred.
7. **M6Counter / η^ins object** — `m6_strong_refuted` | `lean-formalization/M6Counter.lean:m6_strong_refuted_poly`, `:m6_strong_refuted` | a **Decision/counterexample** node: "schema injectivity + faithfulness do NOT propagate to instance fidelity" | the object whose non-iso IS instance-level residue | **proved sorry-free** (refutation); bounds what a residue node may claim, not authority-bearing.
8. **kernel-as-absorbed-typing** | `research-ai/bridges/encoder-kernel-as-absorbed-typing.md`; `EnergyInfoSubFConjecture.lean:residue_quotient_kernel` | candidate `concept.residue` *reading*; at most a **Decision** to keep as conjecture | "what distinctions the encoder declares irrelevant" | **open.** Only the 2×2 instance proved (rfl); general statement body `True := trivial` + 2 open sorrys.
9. **loss-blindness / scalar-shadow** | `research-ai/bridges/loss-blindness.md`; `EnergyInfoSubFConjecture.lean:fibered_residue_quotient_not_forced` | motivation for why `concept.residue` must be functorial not scalar; feeds Discipline #2 | "scalar metrics can't see kernel structure" | **open.** Only `fibered_residue_quotient_not_forced` (constant map non-surjective on a too-weak struct); headline pair-construction not yet formalized.

**Floor summary.** Genuine bottom-up primitive = **#1 + #2** (proved, count-beating). **#5 FCA Concept** = owned *definition* that types/inhabits the node but stays in the count shadow. **#3/#4** proved-but-count-degenerate (Discipline only). **#6** proved but data-level-scoped. **#7** proved bounding counterexample. **#8/#9** open conjectures. Only count-escaping authority = witness #2.

---

## A2 — Ashby, W. Ross (explorer) — top-down governance-authority floor

> Source corpus: `implementation/domainspec/` + `arcanum/`. Confirmed cav2's rule: authority moves by OWNER ROUTE. **Every candidate below is Original-authority in its home repo and Evidence posture for cav2 until imported + owner-promoted. None govern cav2 today.**

`candidate | exact source path | proposed cav2 Authority Kind | owner route | why it could govern cav2`

1. `Axioms A1–A6 (epistemic floor; Via Negativa)` | `implementation/domainspec/AXIOMS.md` | **Axiom-invariant** | constitution-governance | A3 "governance must be computable", A4 "observation independent from execution", A6 "feedback budget" are domain-neutral floors. Evidence posture.
2. `Constitution rules C1–C11 (L4→L3→L6 derivation chain)` | `implementation/domainspec/CONSTITUTION.md` | **Constitution** | constitution-governance | reusable shape = rule ⇄ axiom ⇄ gate with explicit derivation chain. Evidence posture.
3. `Governance Attenuation thesis (more layers → lower per-layer fidelity)` | `implementation/domainspec/GOVERNANCE-ATTENUATION.md` (+ execution board) | **Constitution** (constraint on the authority system) or **Decision** (layer-budget cap) | constitution-governance / decision-gate | the only candidate constraining the authority system's own size; aligns with cav2's context-load concern. Evidence posture.
4. `Drift/Convergence definitions (5 drift kinds; convergence = evidence-backed reduction)` | `implementation/domainspec/DRIFT-CONVERGENCE.md` | **Definition** | definitions-governance | canonical "is this artifact drifting from its authority" vocabulary; import definitions not the doc-routing table (file defers normative semantics to research). Evidence posture.
5. `DomainSpec Authority Map (precedence: research defs > impl docs > plan > packs)` | `implementation/domainspec/AUTHORITY-MAP.md` | **Constitution** (precedence/tie-break) | constitution-governance | worked precedence model; cav2 already has AUTHORITY-MODEL → comparator/hardening source, not replacement. Evidence posture.
6. `CyberAlchemy Method (Objective/Output/Discovery/Tension/Route)` | `arcanum/framework/CYBERALCHEMY-METHOD.md` | **Constitution** (method contract) or **Discipline** | constitution / discipline-governance | "Route = who owns next lifecycle step" = same owner-route principle; arguably cav2's ANCESTRAL method. Evidence posture (closest to family-original, still Evidence until imported).
7. `Arcanum Canonical Definitions (single-definer rule)` | `arcanum/definitions/DEFINITIONS.md` (index + drift audit) | **Definition** | definitions-governance | "only this file defines; promote local terms from evidence" = cav2's definitions-governance contract. Evidence posture.
8. `Arcanum Discipline Catalog + Growth Rule (promote only when route names owner/evidence/validation/mutation boundary)` | `arcanum/disciplines/DISCIPLINES.md` (cards/) | **Discipline** (catalog) + **Constitution** (Growth Rule) | discipline-governance | Growth Rule ≈ cav2's authority-by-owner-route applied to disciplines; cav2 already references this path (link ≠ promotion). Evidence posture.

**Notes:** strongest broad-reach floors = #6 Method + #8 Growth Rule (encode the owner-route principle cav2 already affirms). #3 Attenuation = unique meta-constraint. #4/#5 are operational docs that defer to research-level normative definitions (`research/projects/domainspec/definitions/`, outside sweep scope). Every row = Evidence/Original-authority posture for cav2.

---

## A3 — Hacking, Ian (explorer) — already-staged internal state / consolidation gap

> Source corpus: `cyberAlchemy-v2/` own authority surface. **cav2 is far from greenfield: 47 promoted definitions (CAV2-D1..D47), 3 constitutions, a discipline catalog, candidate ontology, and import manifests that ALREADY CITE the lean formalization + Arcanum + DomainSpec.**

**Already imported AND promoted (canonical — NOT net-new):**
- `Definitions CAV2-D1..D47` | `authority/definitions/DEFINITIONS.md` | imported+promoted | definitions-governance | none (incl. typed-coupling invariant D16, reflection-tower D17, residue D18, ontology D19, Craft D20, claim≤proof D38).
- `Orthogonal classification + authority lifecycle axis (house_project slice)` | D22/D23 + `VAULT-CONCEPT-ADOPTION-CONSTITUTION.md` | imported+promoted | constitution+definitions-governance | none (conflict marked fixed).
- `Stable Repository Constitution` | `authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md` | imported+promoted | constitution-governance | active.
- `Stable repository stewardship discipline` | `disciplines/cards/stable-repository-stewardship.md` | imported+promoted (status candidate) | discipline-governance | needs validator/constitution hardening.
- `HMI candidate promotion prep` | `authority/decisions/2026-06-23-hmi-candidate-promotion-prep.md` | promoted decision | decision-gate | active.

**Imported, NOT promoted (staged candidates — already cited):**
- `149 definition candidates` | `authority/imports/definitions/MANIFEST.md` | imported-not-promoted | definitions-governance | path-level only; needs clustering/dedup.
- `106 constitution/axiom candidates` | `authority/imports/constitutions/MANIFEST.md` | imported-not-promoted | constitution-governance | rule-level extraction "not run"; conflicts preserved.
- `house_project vault corpus` | `authority/imports/house_project/` | imported-not-promoted (slice promoted via D22/D23) | definitions/constitution-governance | rest source-local.
- `Constitution Import Pack (Arcanum / DomainSpec root+vault+axioms / project domainspec / research families)` | `authority/constitutions/CONSTITUTION-IMPORT-PACK.md` | imported-not-promoted | constitution-governance | next slice = schema amendment witness, append-only event ledger, authority lifecycle axes.

**Referenced-not-imported (cited by cav2; authority stays in source — the external explorers' targets, already known here):**
- `Lean/DomainSpec formalization` — manifests list `domainspec-lean-formalization/` etc.; DEFINITIONS already cite formal readings `L1^(n+1) := L1^n + Carrier(mu_n)` (D17), `ResidueObject/ResidueStructure/ResidueCat/Carrier` (D18). | referenced-not-imported | definitions-governance | admitted as SUPPORT evidence only; honesty boundary forbids treating LLM Craft runs as proven functor/kernel/zero-residue. Net-new = SPECIFIC formal primitives not yet named in D17/D18.
- `Arcanum-wide terms (contract, schema, invariant, axiom)` | `arcanum/definitions/DEFINITIONS.md` | referenced-not-imported | Arcanum owns | generic `schema`/`contract` deliberately NOT redefined; generic `invariant`/`axiom` flagged OPEN (AUTHORITY-MODEL OQ-2).

**Candidate-only (cav2 ontology models, not yet authority):**
- `Authority Kinds (9)` | `ontology/AUTHORITY-KINDS.md` | candidate-only | ontology route | gate=flag.
- `Node Model (12 concepts)` | `ontology/NODE-MODEL.md` | candidate-only | ontology route | live `node_type` change = schema-evolution work.
- `Ontology views + crosswalks` | `ontology/*.md` | candidate-only | ontology route | candidate model views.
- `Promotion policy` | `authority/promotion-policy.md` | candidate local policy | cav2 | OQ-1 open: extraction threshold undefined.

**Key signals:** (1) import layer already exists with rule import = path-capture ≠ promotion (OQ-1 OPEN). (2) external finds should be checked against manifests first — any lean primitive is almost certainly already `referenced-not-imported`; net-new test = named nowhere in DEFINITIONS.md/manifests. (3) DomainSpec/Arcanum axioms/constitutions/disciplines are largely `imported-not-promoted`, not net-new; named next slice = schema amendment witness, append-only event ledger, authority lifecycle axes. (4) generic `invariant`/`axiom` deliberately deferred (OQ-2) — known gap, not a discovery.
