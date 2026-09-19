# Invoke Design — DomainSpec Categorical Verification Pipeline (s6)

Stage: s6 · Capability: invoke (design). Synthesizes `TRANSLATOR-DESIGN.md`
(this folder), the s5 decision DEC-CAT-01, Stage-A (`STAGE-A-CORRECTNESS.md`),
and the round-2 skeptic guardrails (`../s7-interrogation/DESIGN-REVIEW.md`).

## The pipeline (decided framing: presheaf-lan, fdm core)

```
DomainSpec spec (contract+schema)
   │  Stage A: specCorrect = (σ-typed: PROVED by Theorem 1) ∧ P1 closure ∧ P5 acyclic
   ▼  [internal correctness only — Intent Wall above; not intent capture]
LLM codegen  (PCRA, lossy — Craft schema→data)
   ▼
produced code C
   │  T : deterministic, total, non-LLM lift  (tag ≻ pattern ≻ graph; σ-filtered)
   ▼
recovered Spec  (metaOf objects + EdgeRow arrows, per-edge EdgeProvenance)
   │  Stage B: fdm functor/migration obligations over the σ-quiver, via gradeFor
   ▼
verdict + residue ledger  (named, provenance-split; partial+lax, never Full)
```

## Stage A — spec correctness (reuse, mostly built)
- σ-typedness: **proved/free** (`EdgeRow.wellTyped` + Theorem 1 `all_edges_well_typed`).
- P1 closure: **real** (`gradeP1Closure`). P5 acyclicity: **real** (`gradeP5Acyclic`, `#eval`/`partial` — a check, not a proof).
- Minimal acceptance: `specCorrect := gradeFor spec` has no `fail` ⇔ P1=pass ∧ P5=pass (P3/P4 are pass-stubs and excluded from the floor).
- Declared assumptions (below the Claim B Wall): parser fidelity, σ-table faithfulness, vocabulary canonicity, D11 partition, no `Functor.Full`.

## Stage B — deterministic translator T (the new component)
- **Inputs → spec category** (full table in `TRANSLATOR-DESIGN.md`): source tags → `Meta`/`EdgeType` by identity rename of `TAXONOMY.md`/`RELATIONSHIPS.md` labels; architecture pattern cards → structural metas/edges; composability rules used only as the `sigmaValid` **admissibility filter** (never an edge generator); GitNexus symbols/calls/flows → candidate morphisms, σ-filtered.
- **Output:** the existing `Spec` record (same artifact `gradeFor` consumes, `ZagrMarketplaceGen.lean` format). No validator change needed to ingest.
- **Determinism:** total + pure; strict tier precedence (tag ≻ pattern ≻ graph), `Sigma.lean` declaration-order tie-break, lexical sort, pinned GitNexus snapshot ⇒ same code → byte-identical Spec.
- **Provenance split (the F3 firewall):** tag edges `.declared`, pattern edges `.contextInferred`, σ-filtered graph edges `.sigmaFallback`. This separates T-mapping residue from codegen residue.

## Residue model (honesty-corrected per round-2 skeptic)
Three things must never collapse into one sentence (skeptic G1):
1. **Witness — real today.** `m6Witnesses` enumerates ambiguity candidates now (`#eval`-able).
2. **Grade — stubbed today.** `gradeP4Ambiguity` returns `.pass` unconditionally; provenance is hardcoded `.declared` in the emitter. So the witness **governs nothing yet**.
3. **Characterization — conjectural.** "residue = Lan unit η not iso" is theorem-dependent; no `Lan`/η object exists. Held as **open conjecture**.

Residue directions (partial+lax map, skeptic F2):
- code ∉ spec → **unspecified-behavior residue** (code unit with no Meta; sidecar-recorded, not in `concepts`).
- spec ∉ code → **unimplemented-obligation residue** (Stage-A concept with no code edge; diff vs Stage-A ConceptSpace).
- T-untypable edge → `sigmaFallback` → WARN, never silently dropped.

## Decidability line (skeptic G3)
- σ-typing: **proved theorem**.
- P1, P5, M6-witness: **operational `#eval`** (`partial`, not a proof).
- path-equation / commutativity "functor obligations": decidable only under a finite confluent relation set; **undecidable in general** — and there are **no path equations in the `Spec` record today**, so do not call commutativity a "functor obligation" until it is actually modeled.

## Claims permitted (Craft ladder)
Operational + formal only. Forbidden: "proves spec correct" unqualified, "F is a functor", any `Full`/faithful/iso, "proves fidelity/agreement", zero-residue, philosophical/universal framing as established.
