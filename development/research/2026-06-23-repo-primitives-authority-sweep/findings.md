# findings.md — repo primitives & authority sweep for cyberAlchemy-v2

Dispatch: `2026-06-23-cav2-repo-primitives-authority-sweep` (research) · final_approver: Vlachopulos, Ioannis
Sources: `research.md` (verbatim explorer returns A1 Abramsky / A2 Ashby / A3 Hacking) + reviewer adjudications (Capucci precedent / Rathjen non-vacuity / Tarski definitional-soundness).

> **One-line answer to the goal.** cav2 is **not greenfield**: most reusable material is already *staged* (referenced- or imported-not-promoted), so the task is mostly **promotion/consolidation, not import**. The single count-escaping formal primitive (`FunctorialResidueStructure` + `separation_is_functor_action`) is the highest-leverage adoption; the governance floor is already captured in cav2's Import Pack and awaits owner-routed promotion. Only **one** terminal KILL (an open lean statement that is vacuous as written) and **one** DEFER.

## Verdict matrix

Ownership is a LABEL, never a verdict (research skill); KILL appears ONLY for no-witness or tautological. Every demoted/owned/count-degenerate/open label is carried (claim ≤ proof).

| # | candidate | source path | cav2 Kind / node concept | owner (precedent) | witnessed? | sound? | verdict | use-mode |
|---|---|---|---|---|---|---|---|---|
| 1 | **FunctorialResidueStructure** | `domainspec-lean-formalization/lean-formalization/FunctorialResidueStructure.lean` | dock under `concept.residue` (D18/D17) | lean repo — cited in **D18** as SUPPORT (A3) | yes — `separation` proved (A1) | yes — count-beating (A1) | **GO** | build-from-owned (referenced-not-imported → promote) |
| 2 | **separation_is_functor_action** | same file `:DiamondNonVacuity` | `concept.decision`/Definition predicate (the non-degeneracy witness) | lean — net-new symbol, not yet in D17/D18 (Capucci) | yes — proved (A1) | yes — the only count-escaping object (A1) | **GO** | build-from-owned |
| 3 | ResidueStructure + universal_monotonicity | `UniversalResidueFunctor.lean` | `concept.constitution`/Discipline ("ship `noise_anti`") | lean — `ResidueStructure` cited in D18 (A3) | yes — inhabited (Rathjen) | **count-degenerate** (carry) | **GO** | build-from-owned — wire as a *Discipline forcing the monotonicity law*, NOT a Definition |
| 4 | lanFaithfulSchema | `UniversalResidueFunctor.lean:ObserverInstance` | `concept.residue` observer-axis instance | lean (Capucci) | yes — instance proved (Rathjen) | **degenerate dock** (carry) | **GO** | build-from-owned |
| 5 | FCAConceptResidue.Concept | `FCAConceptResidue.lean:Concept` | typed artifact-type for `concept.residue` | **Ganter–Wille 1999 / Ore 1944** (A1) | yes | **count-shadow** (carry) | **GO** | build-from-owned (owned ≠ kill) |
| 6 | Residue.ResidueObject + H | `Residue.lean:ResidueObject,:H` | `concept.residue` instance w/ entropy readout | lean — `ResidueObject` cited D18 (A3) | yes | **data-level-scoped** (carry) | **GO** | build-from-owned |
| 7 | M6Counter / η^ins `m6_strong_refuted` | `M6Counter.lean:m6_strong_refuted` | `concept.decision` / counterexample (bounds claims) | lean — proved refutation (A1) | yes (Rathjen: strongest) | distinct | **GO** | build-from-owned |
| 8 | **encoder-kernel-as-absorbed-typing** (general statement) | `EnergyInfoSubFConjecture.lean`; bridge `research-ai/.../encoder-kernel-as-absorbed-typing.md` | OPEN conjecture | precedent-clean (Capucci) | **NO** — general body `True := trivial` + 2 `sorry` ⇒ vacuous (Rathjen forced closed negative) | n/a | **KILL** (no-witness) | banked typed-negative ↓ |
| 9 | loss-blindness / scalar-shadow | `research-ai/bridges/loss-blindness.md`; `fibered_residue_quotient_not_forced` | OPEN headline | precedent-clean (Capucci) | not-yet-witnessed — statable, unformalized (Rathjen) | n/a | **DEFER** | novel-attempt (not-yet-witnessed) |
| 10 | Axioms A1–A6 | `implementation/domainspec/AXIOMS.md` | Axiom-invariant (specific); generic `axiom` kind OPEN | domainspec — imported-not-promoted, Import Pack (A3) | yes — mixed enforceable/diagnostic (Rathjen) | distinct | **GO** | build-from-owned (promote specific axioms; generic axiom-kind deferred — **AUTHORITY-MODEL OQ-2**) |
| 11 | Constitution C1–C11 | `implementation/domainspec/CONSTITUTION.md` | `concept.constitution` | domainspec — imported-not-promoted (A3) | yes | distinct (rule⇄axiom⇄gate shape — A2) | **GO** | build-from-owned |
| 12 | Governance Attenuation | `implementation/domainspec/GOVERNANCE-ATTENUATION.md` | `concept.constitution`/`decision` (meta-constraint on authority-system size) | domainspec — imported-not-promoted (Capucci: **not novel**) | yes diagnostic; **enforceable layer-cap OPEN** (Rathjen) | distinct — unique meta-constraint (A2) | **GO** | build-from-owned |
| 13 | Drift / Convergence defs | `implementation/domainspec/DRIFT-CONVERGENCE.md` | `concept.definition` | domainspec — among 149 def candidates (A3) | yes | distinct (check overlap w/ DEFINITION-DRIFT-AUDIT) | **GO** | build-from-owned |
| 14 | DomainSpec Authority Map | `implementation/domainspec/AUTHORITY-MAP.md` | `concept.constitution` (precedence) — **comparator only** | domainspec — imported-not-promoted (Capucci) | yes | **collapse risk vs cav2 AUTHORITY-MODEL** (Tarski) | **GO (comparator-only)** | build-from-owned — **caveat (binds headline):** tautological if treated as a replacement; use solely as an audit comparator for cav2's own AUTHORITY-MODEL |
| 15 | CyberAlchemy Method | `arcanum/framework/CYBERALCHEMY-METHOD.md` | `concept.constitution`/`discipline` (ancestral method) | arcanum — Evidence posture, **not deployed** (Capucci corrects writer) | yes — broad reach (A2) | distinct (ancestral) | **GO** | build-from-owned (consolidate the ancestral owner-route method) |
| 16 | Arcanum single-definer rule | `arcanum/definitions/DEFINITIONS.md` | `concept.definition` governance | arcanum | yes — cav2 runs 47 defs under it (A3) | **collapses into cav2 definitions-governance** (Tarski) | **already-deployed** (provenance) | already-deployed — **no action**; adopting would re-skin the rule already in force |
| 17 | Arcanum Discipline Catalog + Growth Rule | `arcanum/disciplines/DISCIPLINES.md` | `concept.discipline` + `concept.constitution` | arcanum — cav2 references; `stable-repository-stewardship` already a candidate (A3) | yes — broad reach (A2) | distinct (catalog + meta-rule) | **GO** | build-from-owned |

**Banked typed-negative (#8).** What it would have contributed: a *general* "encoder kernel = absorbed typing" primitive usable as a `concept.residue` reading. Zeroing fact: the general statement `fibered_residue_quotient_kernel_is_absorbed_typing` has body `True := trivial` with 2 open `sorry`s — vacuously true, asserts nothing, so it cannot back a Definition/Constitution without violating non-collapse rule 6 (A1, Rathjen). **The 2×2 instance `residue_quotient_kernel` (proved by `rfl`) survives separately as build-from-owned evidence** — the KILL is on the *general* claim only.

**Internal-redundancy flag (Tarski).** #4, #5, #6 are three distinct *inhabitants* of `concept.residue` (observer instance / FCA artifact-type / entropy-carrying instance). Not a collapse, but **dedup before promoting all three** as separate nodes.

## Synthesis — priority order (cites in brackets)

1. **Highest-leverage move: promote `FunctorialResidueStructure` + `separation_is_functor_action` (#1, #2)** as the typed, count-escaping dock under `concept.residue` (D17/D18). It is the *only* count-beating witness in the sweep [A1], and D18 already cites the lean residue machinery as SUPPORT [A3] — so this converts existing honesty-bounded support into a witnessed primitive at minimal cost (a **promotion**, not novel work). **Collapse-test (binds the headline):** if no cav2 `concept.residue` node can be expressed as a refinement relation with a monotone noise object, the primitive cannot be wired non-degenerately and the move collapses to a zero-residue formalization exercise [Rathjen].
2. **Promote the staged governance floor from the Import Pack — consolidation, not discovery** [A3]: Axioms A1–A6 (#10, specific axioms; generic axiom-kind stays OPEN per OQ-2), Constitution C1–C11 (#11), Drift/Convergence definitions (#13), and Governance Attenuation (#12, diagnostic form; enforceable layer-cap is open). All are imported-not-promoted; route each through its named owner per `AUTHORITY-MODEL`.
3. **Consolidate the ancestral method** [A2, Capucci]: CyberAlchemy Method (#15) and the Discipline Growth Rule (#17) encode the owner-route principle cav2 already affirms — import hardens the floor rather than adding foreign rules. Both are Evidence posture, **not** yet deployed.
4. **Bank / defer:** #8 typed-negative (general encoder-kernel claim, vacuous as written); #9 loss-blindness DEFER (statable, unformalized — not refuted).
5. **No-action provenance:** #16 Arcanum single-definer rule is already in force in cav2 (already-deployed); #14 DomainSpec Authority Map is a comparator only — never a replacement for cav2's AUTHORITY-MODEL.

**Net:** 13 GO (build-from-owned) · 1 already-deployed (no action) · 1 KILL (banked typed-negative) · 1 DEFER. No `novel-attempt` survives as a witnessed GO — consistent with cav2 already citing/importing the umbrella's material [A3]. Every owned/demoted/count-degenerate/open label is carried; no candidate is labelled authority beyond what its source sustains.

---

## Close

- **exit_reason:** `resolved` — final_approver (Vlachopulos) ACCEPTED after P9 citation check, claim ≤ proof, and verdict-integrity audit, with P8 repo corroboration of the two load-bearing lean claims (rows 1/2 `FunctorialResidueStructure.lean`; row 8 `EnergyInfoSubFConjecture.lean`) and the D18 residue cite.
- **agents_spawned:** total 8 — explorer 3 (Abramsky, Ashby, Hacking), writer 1 (Fong), skeptic 3 (Capucci, Rathjen, Tarski), auditor 1 (Vlachopulos), helpers 0. loops_used 1 (one writer↔reviewer zig-zag revision round; the `reviewers→explorers` feedback edge was available but **not fired** — explorer coverage was sufficient, no re-sweep needed).
- **check-tension gate:** 4 infrastructure agents (not part of agents_spawned) — round 1 Brandenburg (REPROVE, Group C Test 4) / Loregian (PASS); round 2 (re-gated after Group C fix) Brandenburg (PASS) / Loregian (PASS).
- **Auditor nuance (P8):** the `EnergyInfoSubFConjecture` file itself notes "the conjecture is not vapid: at least one fibered instance" — consistent with the row-8 split (general statement KILLed as vacuous-as-written; 2×2 instance survives as build-from-owned evidence).
