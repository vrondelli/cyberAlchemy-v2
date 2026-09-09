---
node_type: research
angle: REPRODUCIBILITY CLASSIFICATION — how hard is each asset to rebuild from PUBLIC info; only genuinely-irreproducible cores are algorithmic moats
agent: "Shannon, Claude"
is_session: false
status: candidate
created: 2026-07-02
role: explorer (read-only except this file)
question: "Owner asks — flip to 'all validators = moat'? Classify each of the 7 assets by reproducibility-from-public (a trivial / b moderate / c hard) → algorithmic-moat y/n."
lens: reproducibility (a weekend rebuild from a published contract is not a moat; the irreproducible core is)
corpus: >-
  projects/domainspec-v2/impl/tools/validate-relationships.ts (read in full);
  projects/domainspec-v2/impl/spec/RELATIONSHIPS.md (the 29-edge public canonical table the walker reads);
  projects/domainspec-v2/development/meta-type-formalization/research/2026-07-02-formalism-and-primitives/{findings,verify-precedent-moat,verify-decidability}.md;
  projects/domainspec-v2/development/meta-type-formalization/DEFINE.md
claim_discipline: claim ≤ proof — every reproducibility class is grounded in the actual code shape or a re-verified finding; the δ-engine/Kodamai internals are cited-as-private-by-charter, not inspected.
---

# Reproducibility classification — validators-as-moat

**Frame.** A "moat" the owner can defend is a capability a competitor *cannot cheaply
rebuild*. The reproducibility test is the honest one: given only what is (or would be)
**public**, how many engineer-days to reproduce the asset's discriminating behavior?
- **class (a) trivially reproducible** — a weekend rebuild from a published contract. Gating it
  is theater: the "check" is a table-walk anyone can re-derive from the published table itself.
- **class (b) moderately reproducible** — known techniques (Datalog/Cedar, parsing) + real
  integration effort. Bounded weeks, no secret. Gating gives at most a *head-start*, not a wall.
- **class (c) genuinely hard / proprietary** — an algorithm or a *data asset* that public
  information does not reconstruct. **Only (c) is an algorithmic (or data) moat.**

Load-bearing distinction: **a validator's *code* and a validator's *input contract* reproduce
together.** The structural validators walk a **published** table (`RELATIONSHIPS.md` ships all
29 typed edges verbatim; a per-type `.schema.yml` is by design a public contract — DEFINE.md:14
"PUBLIC validation criteria only"). If the table is public, a competitor rebuilds the walker
*from the table* in a weekend — the walker adds no defensible secret over its own published input.

---

## Per-asset classification

### Asset 1 — Structural per-instance validator (table-walk over `.schema.yml`)
Provider: `projects/domainspec-v2/impl/tools/validate-relationships.ts`.
**What it actually is (read in full):** parse markdown tables (`parseTableForSection`,
`parseTableRow`, `toHeaderMap`), collect canonical edge labels into a `Set` from the *public*
`RELATIONSHIPS.md` (`parseCanonicalEdges`, regex ``/^\|\s*`([a-z-]+)`\s*\|/`` :150), then
`canonicalEdges.has(value)` membership at :72 and :98. Plus a Levenshtein suggester (:349) —
the CS-101 dynamic-programming edit distance. No solver, no proof, terminates by construction
(Gödel re-verified: "bounded ∀/∃ + finite-set membership", verify-decidability.md:34-44).
**Reproducibility:** trivial. Every input it consumes is published (the 29-edge table, the
`.schema.yml` shape). Set-membership + Levenshtein is a *weekend* rebuild — and rebuildable
*from the published table alone*, so the validator adds zero secret over its own contract.
→ **[reproducibility-class a | algorithmic-moat NO]** Gating it is theater.

### Asset 2 — P5 boolean-predicate check (Rule Formal → boolean)
**What it is:** a return-sort check — parse the Formal cell, confirm its root is a Bool-valued
operator (Rule) not a strategy-select (Policy). Context-free parse + sort inference over a fixed
operator signature (verify-decidability.md:46-51). The optional Lean soundness twin
(`matchesGlob_iff`) "does not change the accept/reject verdict" (verify-decidability.md:52-58) —
it is rigor, not discriminating power.
**Reproducibility:** trivial-to-low. A ~100-line typed-expression parser + a root-tag sort check
is a weekend/short-week build once the operator grammar is public (and the grammar *must* be
public for authors to write conformant Formal cells). The Lean twin adds machine-checked rigor,
not an irreproducible capability.
→ **[reproducibility-class a | algorithmic-moat NO]** Moat-safe only while it checks
*parses-to-Bool*; if it ever checked predicate *satisfiability*, it would leave the public
contract and become Asset 4 (the real line) — that is a boundary flag, not this asset's value.

### Asset 3 — Cross-graph Cedar / Datalog (cycles, reachability, cross-rule closure)
**What it is:** the one layer a node-local table-walk *provably cannot* express (the owned
`acyclicity_not_unary` separation, verify-decidability.md:61-73). Least-fixpoint Datalog over a
finite Herbrand base / Cedar policy-set evaluation — both **published, textbook** techniques.
Not wired into `impl` today (Quine + Gödel both confirm: "no running FOL/SMT/Datalog engine",
verify-precedent-moat.md:66, verify-decidability.md:180).
**Reproducibility:** moderate. The *techniques* are public (Soufflé, Cedar, Datalog stratification
are off-the-shelf); the effort is integration — encoding the edge graph, wiring the engine,
scoping queries. Bounded weeks for a competent team. The owned `GovernsAcyclicity.lean` pattern
is a *head-start*, not a wall. What is reproducible is the *checker over the declared graph*; it
reasons about declared edges, never δ-derivation.
→ **[reproducibility-class b | algorithmic-moat NO]** Known techniques + effort; gating it buys a
head-start, not defensibility. (If it were ever fed *derived* edges from the engine, the moat
would live in the engine — Asset 4 — not in the Datalog layer.)

### Asset 4 — δ-engine (private derivation algorithm, `src/rules`)
**What it is:** the proprietary derivation the whole public contract is defined *around*
(DEFINE.md:14, :70 — "the engine `src/rules` δ-derivation stays private (moat)"; MEMORY
`engine-algorithm-proprietary`). Everything that needs a solver/proof for *meaning*
(satisfiability, semantic purity, derivation) "has left the public contract and hit the engine
moat" (findings.md:28-29, 65-70).
**Reproducibility:** genuinely hard — by charter never published, and the outputs are cited/
demonstrated but the algorithm is not disclosed. Public information (results, the LLM free-path)
does not reconstruct it. This is the definitional algorithmic moat.
→ **[reproducibility-class c | algorithmic-moat YES]** The canonical algorithmic moat.

### Asset 5 — Accumulated corpus (criteria / constitutions / governance / definitions)
**What it is:** the authored body of governed authority — not code, *data*. Its value is the
curation, coverage, and internal consistency accreted over the project's life.
**Reproducibility:** genuinely hard **as a data asset** (findings phrasing: "the accumulated
corpus AS DATA"). A competitor can read any *published* portion, but cannot cheaply reproduce the
*whole coherent, gap-closed, cross-referenced* corpus — that is person-years of curation, not a
weekend rebuild, and much of it (cav2 spine, private criteria) is not public at all. This is a
**data moat**, distinct in kind from an algorithmic moat: it is not an algorithm, but it is
genuinely irreproducible from public info.
→ **[reproducibility-class c | algorithmic-moat NO (data moat YES)]** Real defensibility, but it
lives in the *data*, not in any validator's code. Gating the *validators* does not protect it;
keeping the corpus private does.

### Asset 6 — Kodamai agent-sat-spec (the agent ⊨ spec verifier)
**What it is:** Kodamai's unpublished agent-correctness verifier — the "agent satisfies spec"
substrate (MEMORY `kodamai-smithe-correctness-moat`: "the agent⊨spec verifier is its unpublished
moat"). Approaches the same *meaning/derivation* territory the δ-engine occupies (findings.md:65-70
moat boundary).
**Reproducibility:** genuinely hard — unpublished by design; a semantic ⊨ check is not a
table-walk and not reconstructible from any public contract.
→ **[reproducibility-class c | algorithmic-moat YES]** A second genuine algorithmic moat
(the correctness-verifier half; owned unbridged per the leapfrog-lane memory).

### Asset 7 — Arcanum artifact-governance validator
**What it is:** the validator that enforces Arcanum artifact structure/form. Arcanum is **public
by charter** (CLAUDE.md, MEMORY `saturn-domainspec-public`), so its governance validator and the
schema/constitution shapes it checks are — or are intended to be — public.
**Reproducibility:** trivial-to-low. Structural/form checks over a public schema constitution
(`arcanum/framework/SCHEMA-CONSTITUTION.md`, verified by Quine :65,:131) — the same table-walk /
shape-membership family as Asset 1, over a public contract. And it *cannot* be a private moat: it
lives in the public pillar by charter.
→ **[reproducibility-class a | algorithmic-moat NO]** Public by charter; structurally reproducible;
gating it would contradict the Arcanum-public boundary.

---

## Classification table

| # | Asset | Reproducibility class | Algorithmic-moat | Reason (claim ≤ proof) |
|---|-------|----------------------|------------------|------------------------|
| 1 | Structural per-instance validator (table-walk `.schema.yml`) | **(a) trivial** | **NO** | `canonicalEdges.has()` + parse + Levenshtein over the *published* 29-edge table (`validate-relationships.ts:72,98,150,349`); rebuildable from its own public input in a weekend |
| 2 | P5 boolean-predicate check | **(a) trivial** | **NO** | return-sort parse over a must-be-public operator grammar; Lean twin = rigor not power (verify-decidability.md:52-58) |
| 3 | Cross-graph Cedar / Datalog | **(b) moderate** | **NO** | known techniques (Datalog/Cedar) + integration effort; not even wired in yet (verify-precedent-moat.md:66); reasons over *declared* graph, not δ |
| 4 | δ-engine derivation | **(c) hard/proprietary** | **YES** | private by charter (DEFINE.md:14,70); public results ≠ reconstructed algorithm (MEMORY engine-algorithm-proprietary) |
| 5 | Accumulated corpus (as data) | **(c) hard** | **NO** (data moat YES) | person-years of curated, gap-closed authority; irreproducible **as data**, but not an *algorithm* — protected by privacy, not by gating validators |
| 6 | Kodamai agent-sat-spec | **(c) hard/proprietary** | **YES** | unpublished ⊨ verifier; semantic satisfiability, not a table-walk (MEMORY kodamai-smithe-correctness-moat) |
| 7 | Arcanum artifact-governance validator | **(a) trivial** | **NO** | shape-check over a public SCHEMA-CONSTITUTION; public pillar by charter — cannot be a private moat |

## The ONLY genuine algorithmic moats

**Asset 4 (δ-engine derivation) and Asset 6 (Kodamai agent-sat-spec).** Both are class (c),
unpublished, and reconstruct *meaning/derivation* that no public contract exposes. Asset 5
(corpus) is genuinely defensible but is a **data moat, not an algorithmic one** — it is protected
by keeping the data private, not by gating any validator.

## Verdict on the owner's question: flip to "all validators = moat"?

**No — that is gate-theater on the reproducible assets (1, 2, 3, 7).** Their discriminating
behavior reproduces from the published contracts they walk (Asset 1 rebuilds *from* `RELATIONSHIPS.md`;
Asset 7 is public by charter). Declaring them "moat" and gating them protects nothing a competitor
couldn't rebuild in days-to-weeks, and for Asset 7 would violate the Arcanum-public boundary. The
real, defensible line is exactly where the corpus already draws it: the **irreproducible core** —
the δ-engine algorithm (4) and Kodamai's agent-sat-spec (6) as *algorithmic* moats, plus the
accumulated corpus (5) as a *data* moat. **Gate narrowly: keep the meaning/derivation cores and
the corpus-as-data private; leave the structural table-walk validators as the public contract.**
The moment a "validator" needs a solver/proof for satisfiability or purity, it has stopped being a
reproducible check and *become* the engine moat (findings.md:28-29, 65-70) — that transition, not
the validators' publicness, is what to guard.

## Residue / boundaries
- Assets 4 and 6 are classified as (c) *by charter + cited-as-private*, not by inspecting their
  internals (correct: inspecting them is out of scope and against the moat discipline).
- Asset 3 is "not wired in" per Quine/Gödel disk checks (verify-precedent-moat.md:66); the (b)
  class is for *building* it, which is net-new integration on a public technique.
- The per-type `.schema.yml` files do not yet exist on disk (`find … *.schema.yml` → none); the
  (a) class rests on `RELATIONSHIPS.md` (the equivalent published contract, present) + the DEFINE.md:14
  "PUBLIC validation criteria" intent. If the `.schema.yml` were ever kept *private*, Asset 1's
  input becomes non-public — but the code would still be trivial; the defensibility would then live
  in the *schema-as-data* (Asset-5 category), not the walker.
