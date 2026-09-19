# research.md — collected explorer returns (verbatim)

Dispatch `2026-07-06-write-right-share-substrate` (research; Two-tier PUBLIC/PRIVATE share substrate).
Three explorers, pairwise-tensioned (methodology × source-corpus). Returns are verbatim; the synthesizer's `findings.md` is the cited read model over them.

---

## E1 — Shannon, Claude · MECHANISM-RECONSTRUCTION (expository)

## Write→Read Machine — Mechanism Reconstruction (raw material, not human-facing)

### Step 1 — Capture writes everything (ungoverned, complete)
Source: `read-trivial-via-selective-promotion-synthesis.md` §1 "Two write surfaces — only one is selective." Quote: "Capture (candidate/intake/the host's own store) writes **everything** — cheap, ungoverned, complete. NOT selective, and shouldn't be: the full evidence base is needed to promote correctly and to keep provenance." This is the base of the whole machine: nothing is filtered at the point of ingestion. Selectivity does not exist yet at this step — flag this explicitly against any reader who assumes CyberAlchemy "writes less."

### Step 2 — PROMOTE less: selectivity lives at the gate, not the keystroke
Source: same doc §1, continuing: "Authority (promoted/governed) writes **only the important things** — gated, owner-routed, **default-deny** (CAV2-D49)." Direct line: "CyberAlchemy does not make you write less; it makes you **promote** less. The selectivity lives at the **promotion gate**, not at the keystroke." §2 sharpens what the gate filters on — not recall-importance (substrate already handles that: utility_score, JEPA relevance, Aspirational/Self-Model density gate — "telling it what to recall is redundant") but **govern-importance** ("may we rely on / promote this?") — the actual non-redundant filter criterion feeding the gate. CAV2-D49 (default-deny) is cited as the mechanism id; treat as governance-authority reference, not moat detail.

### Step 3 — The write confers a stable citable typed referent + a recorded gate (content PROPOSED non-deterministically, authority CONFERRED+recorded deterministically)
Source: `deterministic-retrieval-thesis-synthesis.md` §1 "The surviving irreducible object," corroborated verbatim by evidence card `irreducible-keystone-typed-referent-plus-gate`. Exact formulation: "A stable, citable, typed referent + a recorded gate over it, with the query arriving already-typed... A *quarantined non-deterministic generator* (write-time model-driven extraction) proposes content; a *recorded gate* (cav2 = the missing S5) confers authority on a frozen typed referent." Card restates as: "Content non-deterministically proposed, authority deterministically conferred + recorded."

Load-bearing correction (claim≤proof — do not skip): card `determinism-is-cost-not-requirement` (§3 Leg 3 in synthesis) **demotes** determinism from a governance requirement to a **cost-dominance optimization**: "auditors attest non-deterministic processes routinely (SOC2 attests *that a reviewer approved at T against version V*, not reproducibility)... Determinism's real status = cost-dominance (collapses the attestation surface to ~0), not logical necessity." So: never assert "the gate is deterministic" as a necessity claim — it is a cost-optimized choice layered on top of the actual requirement, which is provenance + a citable referent. The write-authority-proviso (card `ingest-relocation-epoch-scoped`, synthesis §2 Leg 2) frames why the decision must be written once, not recomputed: "a conferred decision is non-derivable — it must be decided once and written, not recomputed."

PRIVATE-CANDIDATE flags on this step: "cav2 = the missing S5" (VSM/regulator internal framing — both source docs are marked `boundary: INTERNAL — moat content present; do not copy into public arcanum/`); the 5-line-item ingest loop composition (neural extraction, scope-tagging, promotion/governance metadata, provenance, ontology maintenance — synthesis §2 Leg 2) is internal pipeline structure, keep private; the "quarantined non-deterministic generator" wording is fine to reuse conceptually but do not expose which write-time model does the extraction.

### Step 4 — Read = cheap typed-graph traversal seeded by an already-typed query
Source: synthesis §2 Leg 1 (KEYSTONE, explicitly "build-from-owned, NOT proven"): the query "arrives already a node in a typed graph (node→pattern, edge→composition; `SEED.md:16-27`) — handed a discrete subgraph, not an embedding to denoise." Hard boundary condition: "Holds ONLY under a **node-contract boundary** on cross-feature edges; else transitive closure re-inflates to whole-graph RAG (Z1 counterexample)." Card `typed-intent-seed-owned-but-unexecuted` is the demotion anchor: the owning tower (spec-ontology-unification) is **UNEXECUTED**, and the 1:1 node→pattern assumption is its own open residue — do not let "build-from-owned" read as "build-from-proven."

Prior-art discipline (card `wrapper-not-algorithm-two-ontologies`, synthesis §3 A2): traversal itself = GraphRAG/KG-retrieval, cite as prior art, no novel-algorithm claim. Retained novelty is narrow: (a) two-ontologies distinction (governed hand-typed provenance graph vs GraphRAG's LLM-extracted statistical one), (b) the already-typed query seed (GraphRAG still embeds the query to find its entry node; here the query IS a node).

Cost/signal decomposition of "read trivial" (`read-trivial-via-selective-promotion-synthesis.md` §3): two compounding, distinct mechanisms — **cost-trivial** (comprehension pre-paid at write via ingest-time cost relocation, CQRS/materialized-view pattern; cross-refs `ingest-relocation-epoch-scoped` card) and **signal-trivial** (default-deny promotion means the authority surface actually read is small and high-signal — "little to sift"). Explicit demotion required whenever "trivial" is used: §"honest caveat" — "'Trivial' overclaims — read is cheap + high-signal, not zero: the grounding margin remains, discreteness is conditional on contract-completeness, and it is only cheap *within a stable schema epoch*." Never write "trivial" unqualified.

### Cross-cutting residue/flags (do not drop when synthesizing)
- The single shared failure point across all four steps is the **dcb-correctness seam** (card `dcb-seam-highest-leverage`) — cross-feature ordering/read-set freshness/contract sufficiency; internal component reference (`test-engine/HANDOFF.md` G2) — PRIVATE-CANDIDATE (internal seam/test-harness name), keep the *existence* of the seam citable but not the internal doc path in public-facing material.
- Ontology-epoch re-ingestion is a genuinely **unbounded** tail (no sampling/utility bound named) — do not let step 3/4's "cheap" framing imply this is solved.
- "Deterministic ontology" is flagged as a misnomer in the synthesis itself (§2 Leg 3): the ontology is non-deterministically *authored*; only the post-promotion referent + gate are deterministic. Preserve this distinction in any downstream prose — collapsing it is the single most likely overclaim a synthesizer could introduce.
- Every leg (traversal/relocation/gate) is explicitly build-from-owned of an established pattern, no terminal KILLs, but also no novel-algorithm claim — the moat is the *combination/wrapper*, not any single mechanism, and the underlying engine algorithm is out of scope for this corpus entirely (not described in these three sources) and stays proprietary per standing policy.

---

## E2 — Porter, Michael · COMPARATIVE-POSITIONING (comparative/historical)

**Porter — Comparative-Positioning angle, one-pager draft (text only)**

## 1. Value proposition: what write-right buys on the read side

The trade is explicit and asymmetric: pay once, non-deterministically, at write; read forever, deterministically, for free. `ingest-relocation-epoch-scoped` (thesis-cards.md) names the price — a 5-line-item governed write loop (neural extraction, scope-tagging, promotion/governance metadata, provenance, ontology maintenance) — bought against a "cheap deterministic read." The resonantOS synthesis (§2, `ingest-time-cost-relocation`) gives the mechanism: comprehension is "paid once at ingest and crystallized into typed edges," so the fast loop needs "no LLM, sub-50ms" — traversal becomes exact label/property-index lookup + adjacency prefix-scan, not re-derivation.

The cav2-authority synthesis (Part 3) names the payoff precisely as **cost-trivial + signal-trivial**: cost-trivial because the write is pre-paid; signal-trivial because default-deny (the closed 9-kind authority set, `CAV2-D49`) means nothing un-promoted competes for read attention. This is the **promote-less-not-write-less** framing: you don't reduce what gets authored (extraction still runs broadly, non-deterministically) — you reduce what gets *promoted* to a citable, gated referent. Promotion, not authorship, is the choke point.

Caveat the pitch must carry: `determinism-is-cost-not-requirement` (thesis-cards.md) is an explicit **REVISION** — determinism is not a governance precondition (auditors attest non-deterministic processes routinely per SOC2 analogy), it's **cost-dominance** — it "collapses the attestation/provenance surface to ~0" (cav2-authority synthesis, Part 3). Don't oversell determinism as logically necessary; sell it as the cheapest way to satisfy provenance + a stable citable referent.

## 2. Honest contrast vs vector-RAG / GraphRAG

Two distinct differences, not one:

**(a) Entry-node arrival.** Standard RAG/GraphRAG embeds the query to find its entry node — semantic search at read time. Here "the query arrives already-a-node" (`wrapper-not-algorithm-two-ontologies`, thesis-cards.md; echoed as `typed-intent-discrete-vector`, resonantOS synthesis §2): DomainSpec's typed intent is the discrete-vector start point, so even the *grounding* step (not just traversal) collapses. resonantOS synthesis §2 is careful to split "search" into grounding (shrinks toward zero, doesn't vanish) vs traversal (killed outright, replaced by deterministic typed navigation) — a distinction the pitch should preserve rather than flatten into "no search needed."

**(b) Two ontologies, not one.** `wrapper-not-algorithm-two-ontologies` names this as the retained novelty: a governed, hand-typed provenance graph vs GraphRAG's LLM-extracted statistical one. resonantOS synthesis §3 frames the same split as **structural attenuation vs statistical attenuation** (Conant-Ashby requisite variety) — navigating declared relations (clean channel) vs guessing by cosine similarity (noisy channel). The ontology is "the regulator's model"; cav2 is the missing System-5 (VSM) that resonantOS's Living Archive substrate lacks (strong S2/S4, no S5 — supersession is model-driven, not authority-grounded per resonantOS synthesis §3).

Honesty flags for the one-pager: the Ashby/Gödel ceiling is real — "you can only economically traverse what you've modeled" (resonantOS synthesis §3); the un-modeled margin still needs a semantic fallback. And silent-deterministic-*wrong* reads on messy input are a named failure mode (`ingest-relocation-epoch-scoped`: "determinism ≠ correctness"). Don't claim the deterministic path is more *correct* — only more *governable and cheaper to attest*.

## 3. What's genuinely OURS vs prior art

`wrapper-not-algorithm-two-ontologies` is explicit and should anchor the slide: **every leg is build-from-owned, no terminal KILLs** —
- traversal = GraphRAG / KG-retrieval (cite as prior art)
- ingest relocation = CQRS / materialized-view / ETL (cite as prior art)
- the gate = VSM-S5 / symbolic-IR-auditability (cite as prior art)

"The genuine contribution is the **governance + typed-intent provenance WRAPPER** around them, not a novel algorithm." The card's own residue line is the sharpest guardrail available: *"marketing 'ontology traversal' as a new retrieval algorithm would be a tautological overclaim."* Use that line almost verbatim in the one-pager's honesty footnote — it is pre-written claim-discipline.

What survives as retained novelty (per the same card): the two-ontologies split (governed hand-typed vs LLM-extracted statistical) and the already-typed query. Both are *positioning* novelty (how the parts are wired + gated), not algorithmic novelty.

## PRIVATE-CANDIDATE flags (do not put in a public/shareable one-pager without stripping)

- **Engine algorithm / moat stack**: cav2-authority synthesis Part 3 — "cite + demonstrate results, never publish the algorithm; the LLM generator is the free path" (memory: engine-algorithm-proprietary). The synthesis file itself carries an explicit boundary header: `INTERNAL — moat content present (engine determinism, attestation); do NOT copy into public arcanum/`.
- **Attestation/moat framing**: "the moat is attestation + governance-data + vertical" (cav2-authority synthesis Part 3, citing machine-map-and-moat-synthesis) — moat-sensitive, keep out of public framing; use only the cost/governance benefit, not the competitive-moat rationale.
- **cav2 apex-authority mechanics** (closed kind set, promotion lifecycle specifics, non-collapse rules) — internal governance machinery, safe to gesture at generically ("a governed promotion gate exists") but not to detail publicly.

## Status caveat for the one-pager's footer

Nothing above is proven-in-production. `typed-intent-seed-owned-but-unexecuted` (thesis-cards.md): the underlying tower is **unexecuted**, node-contract 1:1 assumption is its own open residue. `irreducible-keystone-typed-referent-plus-gate` is candidate-synthesis, not promoted authority. cav2-authority synthesis's own bottom line: "roadmap value, intended-not-shipped... meta-authority is posture not enforcement." Frame the whole one-pager as **thesis/roadmap**, not shipped capability.

---

## E3 — Meadows, Donella H. · ADVERSARIAL-COST-ACCOUNTING (adversarial/cost + leverage-ladder)

## Trade-off Ledger — Deterministic-Retrieval Thesis (adversarial-cost-accounting angle)

**1. Determinism is COST, not requirement — the requirement is provenance + a citable referent.**
Card `determinism-is-cost-not-requirement` (synthesis §2 Leg 3, §3 A1(c)) demotes the strong governance-needs-determinism claim: Z3 self-withdrew it (research.md :393-397). What auditors actually attest is that *a reviewer approved at T against version V* — non-deterministic pipelines are routinely attestable (SOC2 analogy) provided they're logged. Determinism's real function is **cost-dominance**: it collapses the attestation/provenance surface to ~0, which is a genuine efficiency win but not a logical necessity. Trade-off for the doc: don't sell "determinism → trustworthy" as a chain of implication; sell "determinism → cheaper to trust." The residue explicitly warns the rescued thing is typed referents (Leg 1), not determinism itself — conflating the two re-imports the withdrawn claim by the back door.

**2. Ingest-relocation is epoch-scoped — the treadmill is unbounded, not amortized-once.**
Card `ingest-relocation-epoch-scoped` (synthesis §2 Leg 2, §8 residue) is explicit that cheap reads are *purchased* at a model-heavy write loop with five line items (neural extraction, scope-tagging, promotion metadata, provenance, ontology maintenance) — and that this trade pays cleanly ONLY in stable-schema/high-read-ratio regimes. The unconditional version is FALSE: **full-corpus re-ingestion at every ontology epoch** is named as "the unbounded tail = view-maintenance-under-schema-change," and residue (§8, card residue line) states plainly "no sampling/utility bound named for the authority overlay; needs a bound owned." Cost-accounting reading: every schema change is a re-amortization event with no ceiling on frequency or size named anywhere in the corpus. A shareable doc that presents ingest-relocation as a one-time cost (CQRS-style, paid once) misstates the actual amortization schedule — it's paid *per epoch*, and epoch frequency is unbounded/unmodeled.

**3. Determinism ≠ correctness — silent deterministic-WRONG is a named failure mode, not a hypothetical.**
Both the synthesis (§2 Leg 2) and the `ingest-relocation-epoch-scoped` card state directly: "silent deterministic-WRONG reads on messy input (determinism ≠ correctness)." This is a distinct trade-off from #1 and #2 — even granting the cost-relocation trade is worth it in-regime, a deterministic read of a bad write is a *confident wrong answer with no variance to signal doubt*. Non-deterministic/probabilistic systems fail loud (low-confidence scores, disagreement across samples); a deterministic traversal over a corrupted or stale typed node fails silent. This is the sharpest caveat for a shareable doc because it inverts the intuitive safety story: determinism can *remove* an error-detection surface that stochastic pipelines happen to provide for free.

**4. The typed-seed keystone is build-from-owned but UNEXECUTED — tower not run, 1:1 unproven.**
Card `typed-intent-seed-owned-but-unexecuted` (synthesis §2 Leg 1, §3 corrections) is unambiguous: spec-ontology-unification SEED.md is status "not yet executed" (SEED.md:1-6), and the **central 1:1 node→pattern assumption is its own open residue** (SEED.md:68). Discreteness (the thing that lets a query "arrive already-typed" instead of needing embedding-denoise) holds *only* under a node-contract boundary; without it, transitive closure re-inflates to whole-graph RAG (the Z1 counterexample, synthesis §2). Cost-accounting framing: this is the leg the entire "not vector-RAG" claim leans hardest on, and it is the least proven. Routing owner is DomainSpec plan/domainspec-v2 (§7) — a shareable doc must not let "build-from-owned" read as "build-from-proven" (synthesis §8 explicitly flags this exact conflation as the residue to avoid).

**5. "Trivial" claims about the wrapper overclaim — cheap+high-signal is not the same as zero-cost.**
Card `wrapper-not-algorithm-two-ontologies` (synthesis §2 corrections, §4) establishes every leg as build-from-owned of an established pattern (GraphRAG/KG-retrieval, CQRS/materialized-view/ETL, VSM-S5/symbolic-IR-auditability) — genuinely CITE-as-prior-art, not novel algorithm. But "wrapper not algorithm" is easy to over-read as "cheap/trivial to build." Leverage-ladder framing: the wrapper composes three separately-hard patterns (retrieval correctness, write-time reconciliation, governance gating) into one seam, and #6 below shows that composition is exactly where the unresolved cost concentrates. The retained novelty (two-ontologies distinction + already-typed query seed, synthesis §2 Leg 3/§4 A2) is real, but "the read is bought, not free" — the read's cheapness is *itself* a claim that depends on Legs 1 and 2 both holding, and neither is unconditionally proven (see #2, #4). A doc calling this "trivial" or "solved" overclaims past what any card sustains.

**6. The dcb-correctness seam is the single highest-leverage open item — everything else is downstream of it.**
Card `dcb-seam-highest-leverage` (synthesis §8, cross-referenced §3) states that Z1's closure-leak, Z2's super-linear reconciliation, and Z3's write-time non-determinism **all bottom out at the same seam** (cross-feature ordering / read-set freshness / contract sufficiency; SEED.md:71-72, test-engine/HANDOFF.md G2) — "no leg promotes past it." This is the load-bearing leverage-point conclusion for a cost-accounting angle: it converts three separate-looking caveats (#2, #3, #4) into one shared bottleneck. The honest framing for a shareable doc is not "three independent risks to manage" but "one unresolved seam that gates all three legs simultaneously — resolving it is the cheapest single unlock for the whole thesis" (synthesis §8, card residue line: "resolving the seam gates all three legs at once — the cheapest unlock"). Any doc that lists these as parallel/independent caveats misrepresents the actual dependency structure and hides where the real investment should go.

**Cross-cutting note on claim≤proof:** synthesis §6 (Supersession) already records that two prior cards were revised downward (`governance-requires-determinism` → demoted; `typed-intent-discrete-vector` → refined to owned-but-unexecuted) — this thesis has already self-corrected once toward humility. A shareable doc should preserve that trajectory, not re-inflate the withdrawn strong forms. Routing/owners (synthesis §7) confirm Inventory cannot promote any of this — it stays candidate until DomainSpec plan executes the tower, cav2 authority owner ratifies the S5 framing, and the commercialization gate prices the re-ingestion treadmill and signs off on "wrapper not algorithm" positioning.
