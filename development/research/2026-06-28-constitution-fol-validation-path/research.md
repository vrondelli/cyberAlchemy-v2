---
dispatch_id: 2026-06-28-constitution-fol-validation-path
role: index
agent_name: "Curry, Haskell"
purpose: "verbatim collected-returns index for the synthesis in findings.md"
status: draft
date: 2026-06-28
---

# Collected returns — index

The six agent returns below are the only sources for `findings.md`. Each is read as a
verbatim collected return; `findings.md` cites them by filename. Order: explorers (G1)
then skeptics (G2).

| # | File | Agent | Role / label | One-line return |
|---|---|---|---|---|
| E1 | `agents/01-explorer-wisnesky.md` | Wisnesky, Ryan | explorer · owned-axiomatic | Owned-in-repo sweep: Row-1 per-rule + the permission-constitution cross-layer theorems (`decidePolicy_flatten_meet`) are owned/machine-checked; the *governance*-constitution cross-rule + axiom→rule layers are open residue (build-state, not no-owner). |
| E2 | `agents/02-explorer-tarski.md` | Tarski, Alfred | explorer · formal-methods field | Field survey: cross-rule consistency/contradiction/equivalence + `state⊨ruleset` is real and **decided** by Cedar (Lean-verified, decidable SMT fragment) and FORGE/Datalog⁻; Alloy = bounded counterexamples, not proof; no field tool has an `axiom⊨rule` slot. |
| E3 | `agents/03-explorer-lawvere.md` | Lawvere, F. William | explorer · categorical register | Hyperdoctrine read: FOL `⊨` and the categorical `⊨` are two fibres of one hyperdoctrine. Three-row split — Row 1 owned-in-Lean (Boolean fibre), Row 2 the genuine FOL complement, Row 3 non-poset fibre where FOL is **provably blind** (`count_blind_agrees`). COMPLEMENT, narrow, inside the governance fibre. |
| S1 | `agents/04-skeptic-quine.md` | Quine, W. V. O. | skeptic · precedent/ownership | Tightest-owner sweep: Row 1 = already-deployed owned-by-us; Row 2 = build-from-owned (Cedar + FORGE deciders, Alloy/SMT for satisfiability); axiom⊨rule *checking* = owned-by-classical, only the *encoding* of A1–A6 is precedent-thin (deferred one-repo task). Zero kills. |
| S2 | `agents/05-skeptic-godel.md` | Gödel, Kurt | skeptic · non-vacuity WITNESS | Built the witness by hand: a `governs`-cycle across three lint-clean CAV2-C nodes that C-1..C-3 pass but `reach(X,X)` catches; CAV2-C13 already mandates that acyclicity. Verdict WITNESSED — Row-2 residue is real, does not collapse to `decidePolicy`. |
| S3 | `agents/06-skeptic-rathjen.md` | Rathjen, Michael | skeptic · definitional-soundness | Collapse-test per row: Row 1 = relabel (no residue); Row 2 = real residue because `∃state.⋀ᵢ state⊨cᵢ` is non-distributive (cannot decompose into per-rule checks); axiom-seam = real iff the entailment proof is non-`rfl`; Row 3 = out of scope by theorem. NOT a kill. |
